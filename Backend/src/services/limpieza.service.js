import { prisma } from "../config/database.js";
import { FECHA_REFERENCIA } from "../config/constants.js";
import { NotFoundError, ConflictError, BadRequestError } from "../utils/customErrors.js";

/**
 * Normaliza cadenas para comparaciones seguras de texto (sin acentos, minúsculas).
 */
export function normalizar(str = "") {
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Tareas estándar de limpieza predefinidas por el dominio.
 */
export const TAREAS_LIMPIEZA_DEFAULT = [
  {
    numero: 1,
    nombre: "Limpiar baños",
    enRotacion: true,
    actividades: ["Pisos limpios", "Lavamanos limpio", "Tacho de basura limpio", "Inodoro limpio"],
  },
  {
    numero: 2,
    nombre: "Limpiar salas comunes",
    enRotacion: true,
    actividades: ["Limpiar salas de estudio", "Limpiar pasillos", "Limpiar comedor"],
  },
  {
    numero: 3,
    nombre: "Limpiar duchas",
    enRotacion: true,
    actividades: ["Limpiar cada ducha", "Limpiar los mingitorios", "Limpiar el lavamanos"],
  },
  {
    numero: 4,
    nombre: "Limpiar cocinas",
    enRotacion: true,
    actividades: ["Limpiar los hornos", "Limpiar el piso", "Limpiar las heladeras", "Limpiar la bacha", "Limpiar la mesada"],
  },
];

/**
 * Capa de Servicio: Limpieza, Tareas Rotativas y Ambientes Comunes
 */
class LimpiezaService {
  /**
   * Calcula el número de semana del mes según la fecha (semanas 1 a 5).
   */
  calcularSemana(fechaStr = FECHA_REFERENCIA) {
    const dia = parseInt(fechaStr.slice(8, 10), 10);
    return Math.floor((dia - 1) / 7) + 1;
  }

  /**
   * Determina la tarea rotativa para una posición inicial y número de semana.
   */
  calcularTareaRotativa(posicionInicial, semana, tareasRotativas = []) {
    if (!tareasRotativas.length) return null;
    const index = (posicionInicial + semana - 2) % tareasRotativas.length;
    const indexPositivo = (index + tareasRotativas.length) % tareasRotativas.length;
    return tareasRotativas[indexPositivo];
  }

  /**
   * Asegura que existan las tareas predefinidas en la base de datos si la tabla está vacía.
   */
  async asegurarTareasIniciales() {
    const conteo = await prisma.tareaLimpieza.count();
    if (conteo === 0) {
      for (const t of TAREAS_LIMPIEZA_DEFAULT) {
        await prisma.tareaLimpieza.upsert({
          where: { numero: t.numero },
          update: {},
          create: {
            numero: t.numero,
            nombre: t.nombre,
            enRotacion: t.enRotacion,
            actividades: t.actividades,
          },
        });
      }
    }
  }

  /**
   * ==========================================
   * GESTIÓN DE TAREAS DE LIMPIEZA
   * ==========================================
   */

  async getAllTareas() {
    await this.asegurarTareasIniciales();
    const tareas = await prisma.tareaLimpieza.findMany({
      orderBy: { numero: "asc" },
    });

    return tareas.map((t) => ({
      numero: t.numero,
      nombre: t.nombre,
      enRotacion: t.enRotacion,
      actividades: t.actividades,
      tareas: t.actividades,
    }));
  }

  async getTareaByNumero(numero) {
    await this.asegurarTareasIniciales();
    const tarea = await prisma.tareaLimpieza.findUnique({
      where: { numero: Number(numero) },
    });

    if (!tarea) {
      throw new NotFoundError(`No se encontró ninguna tarea de limpieza con el número: ${numero}`);
    }

    return {
      numero: tarea.numero,
      nombre: tarea.nombre,
      enRotacion: tarea.enRotacion,
      actividades: tarea.actividades,
      tareas: tarea.actividades,
    };
  }

  async createTarea(data) {
    await this.asegurarTareasIniciales();

    const nombreNorm = normalizar(data.nombre);
    const existentes = await prisma.tareaLimpieza.findMany();

    if (existentes.some((t) => normalizar(t.nombre) === nombreNorm)) {
      throw new ConflictError("Ya existe una tarea de limpieza con ese nombre.");
    }

    const actividadesLimpias = (data.actividades || []).map((a) => a.trim()).filter(Boolean);
    const actividadesNorm = actividadesLimpias.map((a) => normalizar(a));
    if (new Set(actividadesNorm).size !== actividadesNorm.length) {
      throw new BadRequestError("Las actividades de la tarea no deben repetirse.");
    }

    const maxNumero = existentes.reduce((max, t) => Math.max(max, t.numero), 0);
    const nuevoNumero = data.numero || maxNumero + 1;

    const creada = await prisma.tareaLimpieza.create({
      data: {
        numero: nuevoNumero,
        nombre: data.nombre.trim(),
        enRotacion: Boolean(data.enRotacion ?? false),
        actividades: actividadesLimpias,
      },
    });

    return {
      numero: creada.numero,
      nombre: creada.nombre,
      enRotacion: creada.enRotacion,
      actividades: creada.actividades,
      tareas: creada.actividades,
    };
  }

  async updateTarea(numero, data) {
    const num = Number(numero);
    const tarea = await prisma.tareaLimpieza.findUnique({ where: { numero: num } });
    if (!tarea) {
      throw new NotFoundError(`No se encontró ninguna tarea de limpieza con el número: ${numero}`);
    }

    if (data.nombre && normalizar(data.nombre) !== normalizar(tarea.nombre)) {
      const conflicto = await prisma.tareaLimpieza.findFirst({
        where: {
          numero: { not: num },
          nombre: { equals: data.nombre.trim(), mode: "insensitive" },
        },
      });
      if (conflicto) {
        throw new ConflictError("Ya existe otra tarea de limpieza con ese nombre.");
      }
    }

    let actividadesActualizadas = undefined;
    if (data.actividades) {
      actividadesActualizadas = data.actividades.map((a) => a.trim()).filter(Boolean);
      const actsNorm = actividadesActualizadas.map((a) => normalizar(a));
      if (new Set(actsNorm).size !== actsNorm.length) {
        throw new BadRequestError("Las actividades de la tarea no deben repetirse.");
      }
    }

    const actualizada = await prisma.tareaLimpieza.update({
      where: { numero: num },
      data: {
        ...(data.nombre ? { nombre: data.nombre.trim() } : {}),
        ...(data.enRotacion !== undefined ? { enRotacion: Boolean(data.enRotacion) } : {}),
        ...(actividadesActualizadas ? { actividades: actividadesActualizadas } : {}),
      },
    });

    return {
      numero: actualizada.numero,
      nombre: actualizada.nombre,
      enRotacion: actualizada.enRotacion,
      actividades: actualizada.actividades,
      tareas: actualizada.actividades,
    };
  }

  async deleteTarea(numero) {
    const num = Number(numero);
    const tarea = await prisma.tareaLimpieza.findUnique({ where: { numero: num } });
    if (!tarea) {
      throw new NotFoundError(`No se encontró ninguna tarea de limpieza con el número: ${numero}`);
    }

    return await prisma.tareaLimpieza.delete({
      where: { numero: num },
    });
  }

  /**
   * ==========================================
   * GESTIÓN DE GRUPOS DE LIMPIEZA
   * ==========================================
   */

  async getAllGrupos({ page = 1, limit = 10, search, fecha = FECHA_REFERENCIA } = {}) {
    await this.asegurarTareasIniciales();
    const skip = (page - 1) * limit;
    const now = new Date(`${fecha}T23:59:59.000Z`);

    const where = search
      ? { nombreDelGrupo: { contains: search, mode: "insensitive" } }
      : {};

    const [total, grupos, tareasRotativas] = await Promise.all([
      prisma.grupoDeLimpieza.count({ where }),
      prisma.grupoDeLimpieza.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ posicionInicial: "asc" }, { idGrupoLimpieza: "asc" }],
        include: {
          gruposLimpiezaAlumnos: {
            include: {
              alumno: {
                select: {
                  idAlumno: true,
                  nombre: true,
                  apellido: true,
                  documento: true,
                  telefono: true,
                  estado: true,
                },
              },
            },
          },
          gruposLimpiezaAmbientes: {
            where: {
              OR: [{ fechaHasta: null }, { fechaHasta: { gt: now } }],
            },
            include: {
              ambiente: true,
            },
          },
        },
      }),
      prisma.tareaLimpieza.findMany({
        where: { enRotacion: true },
        orderBy: { numero: "asc" },
      }),
    ]);

    const semanaActual = this.calcularSemana(fecha);

    const gruposFormateados = grupos.map((g) => {
      const tareaAsignada = this.calcularTareaRotativa(
        g.posicionInicial,
        semanaActual,
        tareasRotativas
      );

      return {
        idGrupoLimpieza: g.idGrupoLimpieza,
        nombreDelGrupo: g.nombreDelGrupo,
        posicionInicial: g.posicionInicial,
        tareaInicial: g.posicionInicial,
        semanaActual,
        tareaActual: tareaAsignada
          ? {
              numero: tareaAsignada.numero,
              nombre: tareaAsignada.nombre,
              actividades: tareaAsignada.actividades,
              tareas: tareaAsignada.actividades,
            }
          : null,
        totalIntegrantes: g.gruposLimpiezaAlumnos.length,
        integrantes: g.gruposLimpiezaAlumnos.map((ga) => ga.alumno),
        ambientesActivos: g.gruposLimpiezaAmbientes.map((ga) => ({
          idAmbiente: ga.ambiente.idAmbiente,
          nombre: ga.ambiente.nombre,
          ambiente: ga.ambiente.nombre,
          tipo: ga.ambiente.tipo,
          ubicacion: ga.ambiente.ubicacion,
          tareas: ga.ambiente.tareas,
          fechaDesde: ga.fechaDesde.toISOString().slice(0, 10),
          fechaHasta: ga.fechaHasta ? ga.fechaHasta.toISOString().slice(0, 10) : null,
        })),
      };
    });

    return {
      grupos: gruposFormateados,
      semanaReferencia: semanaActual,
      fechaReferencia: fecha,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getGrupoById(id, fecha = FECHA_REFERENCIA) {
    await this.asegurarTareasIniciales();
    const grupoId = Number(id);
    const now = new Date(`${fecha}T23:59:59.000Z`);

    const [grupo, tareasRotativas] = await Promise.all([
      prisma.grupoDeLimpieza.findUnique({
        where: { idGrupoLimpieza: grupoId },
        include: {
          gruposLimpiezaAlumnos: {
            include: {
              alumno: {
                select: {
                  idAlumno: true,
                  nombre: true,
                  apellido: true,
                  documento: true,
                  telefono: true,
                  estado: true,
                  usuario: { select: { correo: true } },
                },
              },
            },
          },
          gruposLimpiezaAmbientes: {
            orderBy: { fechaDesde: "desc" },
            include: {
              ambiente: {
                include: { equipamiento: true },
              },
            },
          },
        },
      }),
      prisma.tareaLimpieza.findMany({
        where: { enRotacion: true },
        orderBy: { numero: "asc" },
      }),
    ]);

    if (!grupo) {
      throw new NotFoundError(`No se encontró ningún grupo de limpieza con el ID: ${id}`);
    }

    const semanaActual = this.calcularSemana(fecha);
    const tareaAsignada = this.calcularTareaRotativa(
      grupo.posicionInicial,
      semanaActual,
      tareasRotativas
    );

    const ambientesActivos = [];
    const historialAmbientes = [];

    for (const ga of grupo.gruposLimpiezaAmbientes) {
      const item = {
        idAmbiente: ga.ambiente.idAmbiente,
        nombre: ga.ambiente.nombre,
        ambiente: ga.ambiente.nombre,
        tipo: ga.ambiente.tipo,
        ubicacion: ga.ambiente.ubicacion,
        tareas: ga.ambiente.tareas,
        equipamiento: ga.ambiente.equipamiento,
        fechaDesde: ga.fechaDesde.toISOString().slice(0, 10),
        fechaHasta: ga.fechaHasta ? ga.fechaHasta.toISOString().slice(0, 10) : null,
      };

      if (!ga.fechaHasta || ga.fechaHasta > now) {
        ambientesActivos.push(item);
      } else {
        historialAmbientes.push(item);
      }
    }

    return {
      idGrupoLimpieza: grupo.idGrupoLimpieza,
      nombreDelGrupo: grupo.nombreDelGrupo,
      posicionInicial: grupo.posicionInicial,
      tareaInicial: grupo.posicionInicial,
      semanaActual,
      tareaActual: tareaAsignada
        ? {
            numero: tareaAsignada.numero,
            nombre: tareaAsignada.nombre,
            actividades: tareaAsignada.actividades,
            tareas: tareaAsignada.actividades,
          }
        : null,
      totalIntegrantes: grupo.gruposLimpiezaAlumnos.length,
      integrantes: grupo.gruposLimpiezaAlumnos.map((ga) => ga.alumno),
      ambientesActivos,
      historialAmbientes,
    };
  }

  async createGrupo(data) {
    const nombre = data.nombreDelGrupo.trim();
    const posicionInicial = Number(data.posicionInicial || data.tareaInicial || 1);
    const idAlumnos = (data.idAlumnos || []).map(Number).filter(Boolean);

    // 1. Validar límite de 4 grupos
    const totalGrupos = await prisma.grupoDeLimpieza.count();
    if (totalGrupos >= 4) {
      throw new ConflictError(
        "Ya existen los cuatro grupos de limpieza. Editá uno existente o eliminá uno para reemplazarlo."
      );
    }

    // 2. Validar unicidad de nombre
    const grupoExistente = await prisma.grupoDeLimpieza.findFirst({
      where: { nombreDelGrupo: { equals: nombre, mode: "insensitive" } },
    });
    if (grupoExistente) {
      throw new ConflictError(`Ya existe un grupo de limpieza con el nombre: '${nombre}'`);
    }

    // 3. Validar posición inicial (1-4 y no repetida)
    if (![1, 2, 3, 4].includes(posicionInicial)) {
      throw new BadRequestError("La tarea inicial debe ser un valor entre 1 y 4.");
    }

    const posOcupada = await prisma.grupoDeLimpieza.findFirst({
      where: { posicionInicial },
    });
    if (posOcupada) {
      throw new ConflictError(`La tarea inicial ${posicionInicial} ya está asignada al grupo '${posOcupada.nombreDelGrupo}'.`);
    }

    // 4. Validar alumnos si fueron provistos
    if (idAlumnos.length > 0) {
      const alumnosEncontrados = await prisma.alumno.findMany({
        where: { idAlumno: { in: idAlumnos }, estado: { in: ["activo", "ACTIVO"] } },
      });
      if (alumnosEncontrados.length !== idAlumnos.length) {
        throw new BadRequestError("Uno o más alumnos no existen o no se encuentran activos.");
      }
    }

    // 5. Crear en transacción asegurando unicidad 1:1 en membresía
    return await prisma.$transaction(async (tx) => {
      const nuevoGrupo = await tx.grupoDeLimpieza.create({
        data: {
          nombreDelGrupo: nombre,
          posicionInicial,
        },
      });

      if (idAlumnos.length > 0) {
        // Remover cualquier pertenencia previa de estos alumnos en otros grupos
        await tx.grupoLimpiezaAlumno.deleteMany({
          where: { idAlumno: { in: idAlumnos } },
        });

        for (const idAlumno of idAlumnos) {
          await tx.grupoLimpiezaAlumno.create({
            data: {
              idGrupoLimpieza: nuevoGrupo.idGrupoLimpieza,
              idAlumno,
            },
          });
        }
      }

      return {
        idGrupoLimpieza: nuevoGrupo.idGrupoLimpieza,
        nombreDelGrupo: nuevoGrupo.nombreDelGrupo,
        posicionInicial: nuevoGrupo.posicionInicial,
        tareaInicial: nuevoGrupo.posicionInicial,
        totalIntegrantes: idAlumnos.length,
      };
    });
  }

  async updateGrupo(id, data) {
    const grupoId = Number(id);
    const grupo = await prisma.grupoDeLimpieza.findUnique({
      where: { idGrupoLimpieza: grupoId },
    });

    if (!grupo) {
      throw new NotFoundError(`No se encontró ningún grupo de limpieza con el ID: ${id}`);
    }

    const updates = {};

    if (data.nombreDelGrupo && data.nombreDelGrupo.trim() !== grupo.nombreDelGrupo) {
      const nombreNuevo = data.nombreDelGrupo.trim();
      const conflicto = await prisma.grupoDeLimpieza.findFirst({
        where: {
          idGrupoLimpieza: { not: grupoId },
          nombreDelGrupo: { equals: nombreNuevo, mode: "insensitive" },
        },
      });
      if (conflicto) {
        throw new ConflictError(`Ya existe otro grupo de limpieza con el nombre: '${nombreNuevo}'`);
      }
      updates.nombreDelGrupo = nombreNuevo;
    }

    const nuevaPos = data.posicionInicial ?? data.tareaInicial;
    if (nuevaPos !== undefined && Number(nuevaPos) !== grupo.posicionInicial) {
      const posNum = Number(nuevaPos);
      if (![1, 2, 3, 4].includes(posNum)) {
        throw new BadRequestError("La tarea inicial debe ser un valor entre 1 y 4.");
      }
      const posConflicto = await prisma.grupoDeLimpieza.findFirst({
        where: {
          idGrupoLimpieza: { not: grupoId },
          posicionInicial: posNum,
        },
      });
      if (posConflicto) {
        throw new ConflictError(`La tarea inicial ${posNum} ya está asignada al grupo '${posConflicto.nombreDelGrupo}'.`);
      }
      updates.posicionInicial = posNum;
    }

    const actualizado = await prisma.grupoDeLimpieza.update({
      where: { idGrupoLimpieza: grupoId },
      data: updates,
    });

    return {
      idGrupoLimpieza: actualizado.idGrupoLimpieza,
      nombreDelGrupo: actualizado.nombreDelGrupo,
      posicionInicial: actualizado.posicionInicial,
      tareaInicial: actualizado.posicionInicial,
    };
  }

  async deleteGrupo(id) {
    const grupoId = Number(id);
    const grupo = await prisma.grupoDeLimpieza.findUnique({
      where: { idGrupoLimpieza: grupoId },
    });

    if (!grupo) {
      throw new NotFoundError(`No se encontró ningún grupo de limpieza con el ID: ${id}`);
    }

    return await prisma.grupoDeLimpieza.delete({
      where: { idGrupoLimpieza: grupoId },
    });
  }

  /**
   * Reemplaza de forma atómica la nómina completa de integrantes de un grupo.
   * Si un alumno seleccionado ya pertenecía a otro grupo, se traslada a este.
   */
  async guardarIntegrantes(idGrupoLimpieza, idAlumnos = []) {
    const grupoId = Number(idGrupoLimpieza);
    const grupo = await prisma.grupoDeLimpieza.findUnique({
      where: { idGrupoLimpieza: grupoId },
    });

    if (!grupo) {
      throw new NotFoundError(`No se encontró el grupo de limpieza con ID: ${idGrupoLimpieza}`);
    }

    const alumnosIds = [...new Set(idAlumnos.map(Number).filter(Boolean))];

    if (alumnosIds.length > 0) {
      const encontrados = await prisma.alumno.findMany({
        where: { idAlumno: { in: alumnosIds }, estado: { in: ["activo", "ACTIVO"] } },
      });
      if (encontrados.length !== alumnosIds.length) {
        throw new BadRequestError("Uno o más alumnos no existen o no se encuentran activos.");
      }
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Quitar a estos alumnos de cualquier otro grupo (garantiza regla 1:1)
      if (alumnosIds.length > 0) {
        await tx.grupoLimpiezaAlumno.deleteMany({
          where: { idAlumno: { in: alumnosIds } },
        });
      }

      // 2. Quitar los integrantes anteriores de este grupo
      await tx.grupoLimpiezaAlumno.deleteMany({
        where: { idGrupoLimpieza: grupoId },
      });

      // 3. Crear las nuevas asignaciones
      for (const idAlumno of alumnosIds) {
        await tx.grupoLimpiezaAlumno.create({
          data: {
            idGrupoLimpieza: grupoId,
            idAlumno,
          },
        });
      }

      const integrantesActualizados = await tx.grupoLimpiezaAlumno.findMany({
        where: { idGrupoLimpieza: grupoId },
        include: {
          alumno: {
            select: {
              idAlumno: true,
              nombre: true,
              apellido: true,
              documento: true,
            },
          },
        },
      });

      return {
        idGrupoLimpieza: grupoId,
        nombreDelGrupo: grupo.nombreDelGrupo,
        totalIntegrantes: integrantesActualizados.length,
        integrantes: integrantesActualizados.map((ga) => ga.alumno),
      };
    });
  }

  /**
   * Agrega un Alumno a un Grupo (trasladándolo si ya estaba en otro).
   */
  async agregarAlumnoAGrupo(idGrupoLimpieza, idAlumno) {
    const grupoId = Number(idGrupoLimpieza);
    const alumnoId = Number(idAlumno);

    const [grupo, alumno] = await Promise.all([
      prisma.grupoDeLimpieza.findUnique({ where: { idGrupoLimpieza: grupoId } }),
      prisma.alumno.findUnique({ where: { idAlumno: alumnoId } }),
    ]);

    if (!grupo) {
      throw new NotFoundError(`No se encontró el grupo de limpieza con ID: ${idGrupoLimpieza}`);
    }
    if (!alumno) {
      throw new NotFoundError(`No se encontró el alumno con ID: ${idAlumno}`);
    }

    return await prisma.$transaction(async (tx) => {
      // Remover de grupo anterior si existiese
      await tx.grupoLimpiezaAlumno.deleteMany({
        where: { idAlumno: alumnoId },
      });

      await tx.grupoLimpiezaAlumno.create({
        data: {
          idGrupoLimpieza: grupoId,
          idAlumno: alumnoId,
        },
      });

      return {
        idGrupoLimpieza: grupoId,
        nombreDelGrupo: grupo.nombreDelGrupo,
        alumnoAgregado: {
          idAlumno: alumno.idAlumno,
          nombreCompleto: `${alumno.nombre} ${alumno.apellido}`,
          documento: alumno.documento,
        },
      };
    });
  }

  async quitarAlumnoDeGrupo(idGrupoLimpieza, idAlumno) {
    const grupoId = Number(idGrupoLimpieza);
    const alumnoId = Number(idAlumno);

    const asignacion = await prisma.grupoLimpiezaAlumno.findFirst({
      where: { idGrupoLimpieza: grupoId, idAlumno: alumnoId },
    });

    if (!asignacion) {
      throw new NotFoundError(`El alumno ID ${alumnoId} no pertenece al grupo de limpieza ID ${grupoId}`);
    }

    return await prisma.grupoLimpiezaAlumno.delete({
      where: { idAlumno: alumnoId },
    });
  }

  async asignarAmbienteAGrupo(idGrupoLimpieza, { idAmbiente, fechaDesde, fechaHasta }) {
    const grupoId = Number(idGrupoLimpieza);
    const ambienteId = Number(idAmbiente);

    const [grupo, ambiente] = await Promise.all([
      prisma.grupoDeLimpieza.findUnique({ where: { idGrupoLimpieza: grupoId } }),
      prisma.ambiente.findUnique({ where: { idAmbiente: ambienteId } }),
    ]);

    if (!grupo) {
      throw new NotFoundError(`No se encontró el grupo de limpieza con ID: ${idGrupoLimpieza}`);
    }
    if (!ambiente) {
      throw new NotFoundError(`No se encontró el ambiente con ID: ${idAmbiente}`);
    }

    const fechaInicio = fechaDesde ? new Date(fechaDesde) : new Date();
    const fechaFin = fechaHasta ? new Date(fechaHasta) : null;

    const ahora = new Date();
    const asignacionSolapada = await prisma.grupoLimpiezaAmbiente.findFirst({
      where: {
        idAmbiente: ambienteId,
        OR: [{ fechaHasta: null }, { fechaHasta: { gt: ahora } }],
      },
      include: { grupoLimpieza: true },
    });

    if (asignacionSolapada) {
      throw new ConflictError(
        `El ambiente '${ambiente.nombre}' ya se encuentra actualmente asignado al grupo '${asignacionSolapada.grupoLimpieza.nombreDelGrupo}'.`
      );
    }

    return await prisma.grupoLimpiezaAmbiente.create({
      data: {
        idGrupoLimpieza: grupoId,
        idAmbiente: ambienteId,
        fechaDesde: fechaInicio,
        fechaHasta: fechaFin,
      },
      include: {
        grupoLimpieza: true,
        ambiente: true,
      },
    });
  }

  async finalizarTurnoAmbiente(idGrupoLimpieza, idAmbiente, { fechaHasta } = {}) {
    const grupoId = Number(idGrupoLimpieza);
    const ambienteId = Number(idAmbiente);
    const now = new Date();

    const asignacion = await prisma.grupoLimpiezaAmbiente.findFirst({
      where: {
        idGrupoLimpieza: grupoId,
        idAmbiente: ambienteId,
        OR: [{ fechaHasta: null }, { fechaHasta: { gt: now } }],
      },
    });

    if (!asignacion) {
      throw new NotFoundError(
        `No se encontró un turno activo del ambiente ID ${ambienteId} para el grupo ID ${grupoId}`
      );
    }

    return await prisma.grupoLimpiezaAmbiente.update({
      where: { idAsignacion: asignacion.idAsignacion },
      data: { fechaHasta: fechaHasta ? new Date(fechaHasta) : now },
      include: { grupoLimpieza: true, ambiente: true },
    });
  }

  /**
   * Cronograma consolidado con rotación semanal automática de tareas.
   */
  async getCronograma(fecha = FECHA_REFERENCIA) {
    await this.asegurarTareasIniciales();
    const semana = this.calcularSemana(fecha);

    const [grupos, tareasRotativas] = await Promise.all([
      prisma.grupoDeLimpieza.findMany({
        orderBy: { posicionInicial: "asc" },
        include: {
          gruposLimpiezaAlumnos: {
            include: {
              alumno: {
                select: {
                  idAlumno: true,
                  nombre: true,
                  apellido: true,
                  documento: true,
                  telefono: true,
                },
              },
            },
          },
        },
      }),
      prisma.tareaLimpieza.findMany({
        where: { enRotacion: true },
        orderBy: { numero: "asc" },
      }),
    ]);

    return {
      fechaReferencia: fecha,
      semana,
      cronograma: grupos.map((g) => {
        const tarea = this.calcularTareaRotativa(g.posicionInicial, semana, tareasRotativas);
        return {
          idGrupoLimpieza: g.idGrupoLimpieza,
          nombreDelGrupo: g.nombreDelGrupo,
          posicionInicial: g.posicionInicial,
          tareaInicial: g.posicionInicial,
          tareaAsignada: tarea
            ? {
                numero: tarea.numero,
                nombre: tarea.nombre,
                actividades: tarea.actividades,
                tareas: tarea.actividades,
              }
            : null,
          integrantes: g.gruposLimpiezaAlumnos.map((ga) => ga.alumno),
        };
      }),
    };
  }

  /**
   * ==========================================
   * GESTIÓN DE AMBIENTES Y EQUIPAMIENTO
   * ==========================================
   */

  async getAllAmbientes({ page = 1, limit = 50, search, tipo } = {}) {
    const skip = (page - 1) * limit;
    const now = new Date();
    const where = {};

    if (tipo) {
      where.tipo = tipo;
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { descripcion: { contains: search, mode: "insensitive" } },
        { ubicacion: { contains: search, mode: "insensitive" } },
        { equipamiento: { some: { nombre: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const [total, ambientes] = await Promise.all([
      prisma.ambiente.count({ where }),
      prisma.ambiente.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nombre: "asc" },
        include: {
          equipamiento: {
            orderBy: { nombre: "asc" },
          },
          gruposLimpiezaAmbientes: {
            where: {
              OR: [{ fechaHasta: null }, { fechaHasta: { gt: now } }],
            },
            include: {
              grupoLimpieza: true,
            },
          },
        },
      }),
    ]);

    const ambientesFormateados = ambientes.map((amb) => {
      const asignacionActiva = amb.gruposLimpiezaAmbientes[0];
      return {
        idAmbiente: amb.idAmbiente,
        nombre: amb.nombre,
        ambiente: amb.nombre,
        tipo: amb.tipo,
        ubicacion: amb.ubicacion || "",
        descripcion: amb.descripcion || "",
        tareas: amb.tareas || "",
        equipamiento: amb.equipamiento.map((eq) => ({
          idEquipamiento: eq.idEquipamiento,
          idAmbiente: eq.idAmbiente,
          nombre: eq.nombre,
          cantidad: eq.cantidad,
        })),
        grupoActual: asignacionActiva
          ? {
              idGrupoLimpieza: asignacionActiva.grupoLimpieza.idGrupoLimpieza,
              nombreDelGrupo: asignacionActiva.grupoLimpieza.nombreDelGrupo,
              fechaDesde: asignacionActiva.fechaDesde.toISOString().slice(0, 10),
            }
          : null,
      };
    });

    return {
      ambientes: ambientesFormateados,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getAmbienteById(id) {
    const ambId = Number(id);
    const now = new Date();

    const amb = await prisma.ambiente.findUnique({
      where: { idAmbiente: ambId },
      include: {
        equipamiento: {
          orderBy: { nombre: "asc" },
        },
        gruposLimpiezaAmbientes: {
          orderBy: { fechaDesde: "desc" },
          include: {
            grupoLimpieza: {
              include: {
                gruposLimpiezaAlumnos: {
                  include: { alumno: true },
                },
              },
            },
          },
        },
      },
    });

    if (!amb) {
      throw new NotFoundError(`No se encontró ningún ambiente con el ID: ${id}`);
    }

    const asignacionActiva = amb.gruposLimpiezaAmbientes.find(
      (ga) => !ga.fechaHasta || ga.fechaHasta > now
    );

    return {
      idAmbiente: amb.idAmbiente,
      nombre: amb.nombre,
      ambiente: amb.nombre,
      tipo: amb.tipo,
      ubicacion: amb.ubicacion || "",
      descripcion: amb.descripcion || "",
      tareas: amb.tareas || "",
      equipamiento: amb.equipamiento.map((eq) => ({
        idEquipamiento: eq.idEquipamiento,
        idAmbiente: eq.idAmbiente,
        nombre: eq.nombre,
        cantidad: eq.cantidad,
      })),
      grupoActual: asignacionActiva
        ? {
            idGrupoLimpieza: asignacionActiva.grupoLimpieza.idGrupoLimpieza,
            nombreDelGrupo: asignacionActiva.grupoLimpieza.nombreDelGrupo,
            fechaDesde: asignacionActiva.fechaDesde.toISOString().slice(0, 10),
            integrantes: asignacionActiva.grupoLimpieza.gruposLimpiezaAlumnos.map((ga) => ga.alumno),
          }
        : null,
      historial: amb.gruposLimpiezaAmbientes.map((ga) => ({
        idGrupoLimpieza: ga.grupoLimpieza.idGrupoLimpieza,
        nombreDelGrupo: ga.grupoLimpieza.nombreDelGrupo,
        fechaDesde: ga.fechaDesde.toISOString().slice(0, 10),
        fechaHasta: ga.fechaHasta ? ga.fechaHasta.toISOString().slice(0, 10) : null,
      })),
    };
  }

  async createAmbiente(data) {
    const nombre = (data.nombre || data.ambiente || "").trim();
    if (!nombre) {
      throw new BadRequestError("El nombre del ambiente es obligatorio.");
    }

    const existente = await prisma.ambiente.findFirst({
      where: { nombre: { equals: nombre, mode: "insensitive" } },
    });

    if (existente) {
      throw new ConflictError(`Ya existe un ambiente registrado con el nombre: '${nombre}'`);
    }

    const equipamientoInput = Array.isArray(data.equipamiento) ? data.equipamiento : [];

    return await prisma.$transaction(async (tx) => {
      const nuevo = await tx.ambiente.create({
        data: {
          nombre,
          tipo: data.tipo || null,
          ubicacion: data.ubicacion?.trim() || null,
          descripcion: data.descripcion?.trim() || null,
          tareas: data.tareas?.trim() || "",
        },
      });

      if (equipamientoInput.length > 0) {
        for (const item of equipamientoInput) {
          if (item.nombre && item.cantidad > 0) {
            await tx.equipamientoAmbiente.create({
              data: {
                idAmbiente: nuevo.idAmbiente,
                nombre: item.nombre.trim(),
                cantidad: Number(item.cantidad),
              },
            });
          }
        }
      }

      const creado = await tx.ambiente.findUnique({
        where: { idAmbiente: nuevo.idAmbiente },
        include: { equipamiento: true },
      });

      return {
        idAmbiente: creado.idAmbiente,
        nombre: creado.nombre,
        ambiente: creado.nombre,
        tipo: creado.tipo,
        ubicacion: creado.ubicacion || "",
        descripcion: creado.descripcion || "",
        tareas: creado.tareas || "",
        equipamiento: creado.equipamiento,
      };
    });
  }

  async updateAmbiente(id, data) {
    const ambId = Number(id);
    const amb = await prisma.ambiente.findUnique({ where: { idAmbiente: ambId } });
    if (!amb) {
      throw new NotFoundError(`No se encontró ningún ambiente con el ID: ${id}`);
    }

    const updates = {};
    const nuevoNombre = (data.nombre || data.ambiente || "").trim();
    if (nuevoNombre && normalizar(nuevoNombre) !== normalizar(amb.nombre)) {
      const conflicto = await prisma.ambiente.findFirst({
        where: {
          idAmbiente: { not: ambId },
          nombre: { equals: nuevoNombre, mode: "insensitive" },
        },
      });
      if (conflicto) {
        throw new ConflictError(`Ya existe otro ambiente con el nombre: '${nuevoNombre}'`);
      }
      updates.nombre = nuevoNombre;
    }

    if (data.tipo !== undefined) updates.tipo = data.tipo;
    if (data.ubicacion !== undefined) updates.ubicacion = data.ubicacion?.trim() || null;
    if (data.descripcion !== undefined) updates.descripcion = data.descripcion?.trim() || null;
    if (data.tareas !== undefined) updates.tareas = data.tareas?.trim() || "";

    const actualizado = await prisma.ambiente.update({
      where: { idAmbiente: ambId },
      data: updates,
      include: { equipamiento: true },
    });

    return {
      idAmbiente: actualizado.idAmbiente,
      nombre: actualizado.nombre,
      ambiente: actualizado.nombre,
      tipo: actualizado.tipo,
      ubicacion: actualizado.ubicacion || "",
      descripcion: actualizado.descripcion || "",
      tareas: actualizado.tareas || "",
      equipamiento: actualizado.equipamiento,
    };
  }

  async deleteAmbiente(id) {
    const ambId = Number(id);
    const amb = await prisma.ambiente.findUnique({ where: { idAmbiente: ambId } });
    if (!amb) {
      throw new NotFoundError(`No se encontró ningún ambiente con el ID: ${id}`);
    }

    return await prisma.ambiente.delete({
      where: { idAmbiente: ambId },
    });
  }

  /**
   * Agrega equipamiento a un ambiente.
   * Si ya existe un objeto con el mismo nombre (insensible a mayúsculas y acentos),
   * suma la cantidad acumulada, respetando la regla de negocio del proyecto.
   */
  async agregarEquipamiento(idAmbiente, { nombre, cantidad }) {
    const ambId = Number(idAmbiente);
    const amb = await prisma.ambiente.findUnique({
      where: { idAmbiente: ambId },
      include: { equipamiento: true },
    });

    if (!amb) {
      throw new NotFoundError(`No se encontró el ambiente con ID: ${idAmbiente}`);
    }

    const nombreLimpio = nombre.trim();
    const cant = Number(cantidad);
    if (!cant || cant <= 0) {
      throw new BadRequestError("La cantidad debe ser un entero positivo.");
    }

    const nombreNorm = normalizar(nombreLimpio);
    const existente = amb.equipamiento.find((e) => normalizar(e.nombre) === nombreNorm);

    if (existente) {
      const nuevaCantidad = existente.cantidad + cant;
      return await prisma.equipamientoAmbiente.update({
        where: { idEquipamiento: existente.idEquipamiento },
        data: { cantidad: nuevaCantidad },
      });
    }

    return await prisma.equipamientoAmbiente.create({
      data: {
        idAmbiente: ambId,
        nombre: nombreLimpio,
        cantidad: cant,
      },
    });
  }

  async updateEquipamiento(idAmbiente, idEquipamiento, { nombre, cantidad }) {
    const eqId = Number(idEquipamiento);
    const eq = await prisma.equipamientoAmbiente.findUnique({
      where: { idEquipamiento: eqId },
    });

    if (!eq || eq.idAmbiente !== Number(idAmbiente)) {
      throw new NotFoundError(`No se encontró el equipamiento con ID: ${idEquipamiento} en el ambiente indicado`);
    }

    return await prisma.equipamientoAmbiente.update({
      where: { idEquipamiento: eqId },
      data: {
        ...(nombre ? { nombre: nombre.trim() } : {}),
        ...(cantidad ? { cantidad: Number(cantidad) } : {}),
      },
    });
  }

  async deleteEquipamiento(idAmbiente, idEquipamiento) {
    const eqId = Number(idEquipamiento);
    const eq = await prisma.equipamientoAmbiente.findUnique({
      where: { idEquipamiento: eqId },
    });

    if (!eq || eq.idAmbiente !== Number(idAmbiente)) {
      throw new NotFoundError(`No se encontró el equipamiento con ID: ${idEquipamiento} en el ambiente indicado`);
    }

    return await prisma.equipamientoAmbiente.delete({
      where: { idEquipamiento: eqId },
    });
  }
}

export const limpiezaService = new LimpiezaService();
export default limpiezaService;
