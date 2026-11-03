import { prisma } from "../config/database.js";
import { NotFoundError, ConflictError, BadRequestError } from "../utils/customErrors.js";

/**
 * Capa de Servicio: Limpieza y Ambientes Comunes
 * Gestiona la conformación de grupos de aseo, asignación de alumnos,
 * catálogo de ambientes y cronograma de tareas de convivencia.
 */
class LimpiezaService {
  /**
   * ==========================================
   * GESTIÓN DE GRUPOS DE LIMPIEZA
   * ==========================================
   */

  /**
   * Crea un nuevo Grupo de Limpieza tras validar unicidad de nombre.
   */
  async createGrupo(data) {
    const existing = await prisma.grupoDeLimpieza.findFirst({
      where: {
        nombreDelGrupo: { equals: data.nombreDelGrupo, mode: "insensitive" },
      },
    });

    if (existing) {
      throw new ConflictError(`Ya existe un grupo de limpieza con el nombre: '${data.nombreDelGrupo}'`);
    }

    return await prisma.grupoDeLimpieza.create({
      data: {
        nombreDelGrupo: data.nombreDelGrupo,
      },
    });
  }

  /**
   * Obtiene la lista paginada de Grupos con sus integrantes y ambientes asignados actualmente.
   */
  async getAllGrupos({ page = 1, limit = 10, search } = {}) {
    const skip = (page - 1) * limit;
    const now = new Date();
    const where = search
      ? { nombreDelGrupo: { contains: search, mode: "insensitive" } }
      : {};

    const [total, grupos] = await Promise.all([
      prisma.grupoDeLimpieza.count({ where }),
      prisma.grupoDeLimpieza.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nombreDelGrupo: "asc" },
        include: {
          gruposLimpiezaAlumnos: {
            include: {
              alumno: {
                select: {
                  idAlumno: true,
                  nombre: true,
                  apellido: true,
                  documento: true,
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
    ]);

    const gruposFormateados = grupos.map((g) => ({
      idGrupoLimpieza: g.idGrupoLimpieza,
      nombreDelGrupo: g.nombreDelGrupo,
      totalIntegrantes: g.gruposLimpiezaAlumnos.length,
      integrantes: g.gruposLimpiezaAlumnos.map((ga) => ga.alumno),
      ambientesActivos: g.gruposLimpiezaAmbientes.map((ga) => ({
        idAmbiente: ga.ambiente.idAmbiente,
        ambiente: ga.ambiente.ambiente,
        tareas: ga.ambiente.tareas,
        fechaDesde: ga.fechaDesde,
        fechaHasta: ga.fechaHasta,
      })),
    }));

    return {
      grupos: gruposFormateados,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Obtiene el detalle de un Grupo con integrantes y su historial completo de ambientes asignados.
   */
  async getGrupoById(id) {
    const now = new Date();
    const grupo = await prisma.grupoDeLimpieza.findUnique({
      where: { idGrupoLimpieza: id },
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
            ambiente: true,
          },
        },
      },
    });

    if (!grupo) {
      throw new NotFoundError(`No se encontró ningún grupo de limpieza con el ID: ${id}`);
    }

    const ambientesActivos = [];
    const historialAmbientes = [];

    for (const ga of grupo.gruposLimpiezaAmbientes) {
      const item = {
        idAmbiente: ga.ambiente.idAmbiente,
        ambiente: ga.ambiente.ambiente,
        tareas: ga.ambiente.tareas,
        fechaDesde: ga.fechaDesde,
        fechaHasta: ga.fechaHasta,
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
      totalIntegrantes: grupo.gruposLimpiezaAlumnos.length,
      integrantes: grupo.gruposLimpiezaAlumnos.map((ga) => ga.alumno),
      ambientesActivos,
      historialAmbientes,
    };
  }

  /**
   * Actualiza el nombre de un Grupo de Limpieza.
   */
  async updateGrupo(id, data) {
    const grupo = await prisma.grupoDeLimpieza.findUnique({
      where: { idGrupoLimpieza: id },
    });

    if (!grupo) {
      throw new NotFoundError(`No se encontró ningún grupo de limpieza con el ID: ${id}`);
    }

    if (data.nombreDelGrupo && data.nombreDelGrupo !== grupo.nombreDelGrupo) {
      const conflicto = await prisma.grupoDeLimpieza.findFirst({
        where: {
          idGrupoLimpieza: { not: id },
          nombreDelGrupo: { equals: data.nombreDelGrupo, mode: "insensitive" },
        },
      });

      if (conflicto) {
        throw new ConflictError(`Ya existe otro grupo de limpieza con el nombre: '${data.nombreDelGrupo}'`);
      }
    }

    return await prisma.grupoDeLimpieza.update({
      where: { idGrupoLimpieza: id },
      data,
    });
  }

  /**
   * Elimina un Grupo de Limpieza.
   */
  async deleteGrupo(id) {
    const grupo = await prisma.grupoDeLimpieza.findUnique({
      where: { idGrupoLimpieza: id },
    });

    if (!grupo) {
      throw new NotFoundError(`No se encontró ningún grupo de limpieza con el ID: ${id}`);
    }

    return await prisma.grupoDeLimpieza.delete({
      where: { idGrupoLimpieza: id },
    });
  }

  /**
   * Agrega un Alumno a un Grupo de Limpieza verificando existencia y pertenencia previa.
   */
  async agregarAlumnoAGrupo(idGrupoLimpieza, idAlumno) {
    const [grupo, alumno] = await Promise.all([
      prisma.grupoDeLimpieza.findUnique({ where: { idGrupoLimpieza } }),
      prisma.alumno.findUnique({ where: { idAlumno } }),
    ]);

    if (!grupo) {
      throw new NotFoundError(`No se encontró el grupo de limpieza con ID: ${idGrupoLimpieza}`);
    }

    if (!alumno) {
      throw new NotFoundError(`No se encontró el alumno con ID: ${idAlumno}`);
    }

    const yaEsMiembro = await prisma.grupoLimpiezaAlumno.findUnique({
      where: {
        idGrupoLimpieza_idAlumno: { idGrupoLimpieza, idAlumno },
      },
    });

    if (yaEsMiembro) {
      throw new ConflictError(`El alumno ${alumno.nombre} ${alumno.apellido} ya pertenece al grupo '${grupo.nombreDelGrupo}'`);
    }

    await prisma.grupoLimpiezaAlumno.create({
      data: {
        idGrupoLimpieza,
        idAlumno,
      },
    });

    return {
      idGrupoLimpieza,
      nombreDelGrupo: grupo.nombreDelGrupo,
      alumnoAgregado: {
        idAlumno: alumno.idAlumno,
        nombreCompleto: `${alumno.nombre} ${alumno.apellido}`,
        documento: alumno.documento,
      },
    };
  }

  /**
   * Quita un Alumno de un Grupo de Limpieza.
   */
  async quitarAlumnoDeGrupo(idGrupoLimpieza, idAlumno) {
    const asignacion = await prisma.grupoLimpiezaAlumno.findUnique({
      where: {
        idGrupoLimpieza_idAlumno: { idGrupoLimpieza, idAlumno },
      },
    });

    if (!asignacion) {
      throw new NotFoundError(`El alumno ID ${idAlumno} no pertenece al grupo de limpieza ID ${idGrupoLimpieza}`);
    }

    return await prisma.grupoLimpiezaAlumno.delete({
      where: {
        idGrupoLimpieza_idAlumno: { idGrupoLimpieza, idAlumno },
      },
    });
  }

  /**
   * Asigna un Ambiente al Grupo con rango de fechas (Turno de limpieza).
   * Evita solapamiento: un ambiente no puede tener dos grupos activos al mismo tiempo.
   */
  async asignarAmbienteAGrupo(idGrupoLimpieza, { idAmbiente, fechaDesde, fechaHasta }) {
    const [grupo, ambiente] = await Promise.all([
      prisma.grupoDeLimpieza.findUnique({ where: { idGrupoLimpieza } }),
      prisma.ambiente.findUnique({ where: { idAmbiente } }),
    ]);

    if (!grupo) {
      throw new NotFoundError(`No se encontró el grupo de limpieza con ID: ${idGrupoLimpieza}`);
    }

    if (!ambiente) {
      throw new NotFoundError(`No se encontró el ambiente con ID: ${idAmbiente}`);
    }

    const fechaInicio = fechaDesde ? new Date(fechaDesde) : new Date();
    const fechaFin = fechaHasta ? new Date(fechaHasta) : null;

    // Verificar si el ambiente ya tiene una asignación activa en el mismo período
    const ahora = new Date();
    const asignacionSolapada = await prisma.grupoLimpiezaAmbiente.findFirst({
      where: {
        idAmbiente,
        OR: [
          { fechaHasta: null },
          { fechaHasta: { gt: ahora } },
        ],
      },
      include: {
        grupoLimpieza: true,
      },
    });

    if (asignacionSolapada) {
      throw new ConflictError(
        `El ambiente '${ambiente.ambiente}' ya se encuentra actualmente asignado al grupo '${asignacionSolapada.grupoLimpieza.nombreDelGrupo}'. Debe finalizar ese turno antes de asignarlo nuevamente.`
      );
    }

    return await prisma.grupoLimpiezaAmbiente.create({
      data: {
        idGrupoLimpieza,
        idAmbiente,
        fechaDesde: fechaInicio,
        fechaHasta: fechaFin,
      },
      include: {
        grupoLimpieza: true,
        ambiente: true,
      },
    });
  }

  /**
   * Finaliza el turno de limpieza de un ambiente para un grupo estableciendo fechaHasta.
   */
  async finalizarTurnoAmbiente(idGrupoLimpieza, idAmbiente, { fechaHasta } = {}) {
    const now = new Date();
    const asignacion = await prisma.grupoLimpiezaAmbiente.findFirst({
      where: {
        idGrupoLimpieza,
        idAmbiente,
        OR: [{ fechaHasta: null }, { fechaHasta: { gt: now } }],
      },
    });

    if (!asignacion) {
      throw new NotFoundError(
        `No se encontró un turno activo del ambiente ID ${idAmbiente} para el grupo ID ${idGrupoLimpieza}`
      );
    }

    const fechaCierre = fechaHasta ? new Date(fechaHasta) : now;

    return await prisma.grupoLimpiezaAmbiente.update({
      where: {
        idGrupoLimpieza_idAmbiente_fechaDesde: {
          idGrupoLimpieza,
          idAmbiente,
          fechaDesde: asignacion.fechaDesde,
        },
      },
      data: {
        fechaHasta: fechaCierre,
      },
      include: {
        grupoLimpieza: true,
        ambiente: true,
      },
    });
  }

  /**
   * ==========================================
   * GESTIÓN DE AMBIENTES
   * ==========================================
   */

  /**
   * Crea un nuevo Ambiente con sus tareas asignadas.
   */
  async createAmbiente(data) {
    const existing = await prisma.ambiente.findFirst({
      where: {
        ambiente: { equals: data.ambiente, mode: "insensitive" },
      },
    });

    if (existing) {
      throw new ConflictError(`Ya existe un ambiente registrado con el nombre: '${data.ambiente}'`);
    }

    return await prisma.ambiente.create({
      data,
    });
  }

  /**
   * Obtiene todos los Ambientes con indicación del grupo actualmente responsable.
   */
  async getAllAmbientes({ page = 1, limit = 10, search } = {}) {
    const skip = (page - 1) * limit;
    const now = new Date();
    const where = search
      ? {
          OR: [
            { ambiente: { contains: search, mode: "insensitive" } },
            { tareas: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [total, ambientes] = await Promise.all([
      prisma.ambiente.count({ where }),
      prisma.ambiente.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ambiente: "asc" },
        include: {
          gruposLimpiezaAmbientes: {
            where: {
              OR: [{ fechaHasta: null }, { fechaHasta: { gt: now } }],
            },
            include: {
              grupoLimpieza: {
                include: {
                  gruposLimpiezaAlumnos: {
                    include: {
                      alumno: {
                        select: {
                          idAlumno: true,
                          nombre: true,
                          apellido: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const ambientesFormateados = ambientes.map((amb) => {
      const asignacionActiva = amb.gruposLimpiezaAmbientes[0];
      const grupoActual = asignacionActiva
        ? {
            idGrupoLimpieza: asignacionActiva.grupoLimpieza.idGrupoLimpieza,
            nombreDelGrupo: asignacionActiva.grupoLimpieza.nombreDelGrupo,
            fechaDesde: asignacionActiva.fechaDesde,
            fechaHasta: asignacionActiva.fechaHasta,
            integrantes: asignacionActiva.grupoLimpieza.gruposLimpiezaAlumnos.map(
              (ga) => ga.alumno
            ),
          }
        : null;

      return {
        idAmbiente: amb.idAmbiente,
        ambiente: amb.ambiente,
        tareas: amb.tareas,
        estado: grupoActual ? "ASIGNADO" : "SIN_ASIGNAR",
        grupoActual,
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

  /**
   * Obtiene el detalle de un Ambiente con su historial completo de asignaciones.
   */
  async getAmbienteById(id) {
    const now = new Date();
    const amb = await prisma.ambiente.findUnique({
      where: { idAmbiente: id },
      include: {
        gruposLimpiezaAmbientes: {
          orderBy: { fechaDesde: "desc" },
          include: {
            grupoLimpieza: {
              include: {
                gruposLimpiezaAlumnos: {
                  include: {
                    alumno: {
                      select: {
                        idAlumno: true,
                        nombre: true,
                        apellido: true,
                      },
                    },
                  },
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

    let grupoActual = null;
    const historial = [];

    for (const ga of amb.gruposLimpiezaAmbientes) {
      const item = {
        idGrupoLimpieza: ga.grupoLimpieza.idGrupoLimpieza,
        nombreDelGrupo: ga.grupoLimpieza.nombreDelGrupo,
        fechaDesde: ga.fechaDesde,
        fechaHasta: ga.fechaHasta,
        integrantes: ga.grupoLimpieza.gruposLimpiezaAlumnos.map((a) => a.alumno),
      };

      if (!grupoActual && (!ga.fechaHasta || ga.fechaHasta > now)) {
        grupoActual = item;
      } else {
        historial.push(item);
      }
    }

    return {
      idAmbiente: amb.idAmbiente,
      ambiente: amb.ambiente,
      tareas: amb.tareas,
      estado: grupoActual ? "ASIGNADO" : "SIN_ASIGNAR",
      grupoActual,
      historial,
    };
  }

  /**
   * Actualiza los datos de un Ambiente.
   */
  async updateAmbiente(id, data) {
    const amb = await prisma.ambiente.findUnique({
      where: { idAmbiente: id },
    });

    if (!amb) {
      throw new NotFoundError(`No se encontró ningún ambiente con el ID: ${id}`);
    }

    if (data.ambiente && data.ambiente !== amb.ambiente) {
      const conflicto = await prisma.ambiente.findFirst({
        where: {
          idAmbiente: { not: id },
          ambiente: { equals: data.ambiente, mode: "insensitive" },
        },
      });

      if (conflicto) {
        throw new ConflictError(`Ya existe otro ambiente con el nombre: '${data.ambiente}'`);
      }
    }

    return await prisma.ambiente.update({
      where: { idAmbiente: id },
      data,
    });
  }

  /**
   * Elimina un Ambiente.
   */
  async deleteAmbiente(id) {
    const amb = await prisma.ambiente.findUnique({
      where: { idAmbiente: id },
    });

    if (!amb) {
      throw new NotFoundError(`No se encontró ningún ambiente con el ID: ${id}`);
    }

    return await prisma.ambiente.delete({
      where: { idAmbiente: id },
    });
  }

  /**
   * Cronograma consolidado de limpieza: qué grupo y qué alumnos limpian cada ambiente en la fecha actual.
   */
  async getCronograma() {
    const now = new Date();
    const asignaciones = await prisma.grupoLimpiezaAmbiente.findMany({
      where: {
        OR: [{ fechaHasta: null }, { fechaHasta: { gt: now } }],
      },
      include: {
        ambiente: true,
        grupoLimpieza: {
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
        },
      },
    });

    return asignaciones.map((a) => ({
      ambiente: {
        idAmbiente: a.ambiente.idAmbiente,
        nombre: a.ambiente.ambiente,
        tareas: a.ambiente.tareas,
      },
      grupoResponsable: {
        idGrupoLimpieza: a.grupoLimpieza.idGrupoLimpieza,
        nombreDelGrupo: a.grupoLimpieza.nombreDelGrupo,
        alumnos: a.grupoLimpieza.gruposLimpiezaAlumnos.map((ga) => ga.alumno),
      },
      periodo: {
        fechaDesde: a.fechaDesde,
        fechaHasta: a.fechaHasta,
      },
    }));
  }
}

export const limpiezaService = new LimpiezaService();
export default limpiezaService;

