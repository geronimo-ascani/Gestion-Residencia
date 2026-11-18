import { prisma } from "../config/database.js";
import { NotFoundError, ConflictError, BadRequestError } from "../utils/customErrors.js";

/**
 * Capa de Servicio: Alumno
 * Gestiona el padrón estudiantil, datos personales, información académica,
 * procedencia/domicilio, contactos de emergencia y cuentas de usuario asociadas.
 */
class AlumnoService {
  /**
   * Enriquece un objeto Alumno para homogeneizar propiedades con el Frontend.
   */
  #enriquecerAlumno(alumno) {
    if (!alumno) return null;
    const correoEfectivo = alumno.correoContacto || alumno.usuario?.correo || "";
    return {
      ...alumno,
      correo: correoEfectivo,
      fechaNacimiento: alumno.fechaNacimiento
        ? alumno.fechaNacimiento.toISOString().slice(0, 10)
        : null,
    };
  }

  /**
   * Crea un nuevo registro de Alumno con sus datos extendidos y contactos de emergencia.
   */
  async create(data) {
    const {
      correo,
      correoContacto,
      idUsuario,
      contrasena,
      contactosEmergencia,
      emergenciaNombre,
      emergenciaVinculo,
      emergenciaTelefono,
      fechaNacimiento,
      estado,
      ...restoData
    } = data;

    // 1. Normalizar y verificar unicidad de documento
    const documentoLimpio = restoData.documento.trim();
    const existingDoc = await prisma.alumno.findUnique({
      where: { documento: documentoLimpio },
    });
    if (existingDoc) {
      throw new ConflictError(
        `Ya existe un alumno registrado con el documento: ${documentoLimpio}`
      );
    }

    // 2. Normalizar contactos de emergencia recibidos
    let contactosAInsertar = [];
    if (Array.isArray(contactosEmergencia) && contactosEmergencia.length > 0) {
      contactosAInsertar = contactosEmergencia
        .filter((c) => c && c.nombre && c.nombre.trim())
        .map((c, idx) => ({
          nombre: c.nombre.trim(),
          vinculo: (c.vinculo || "Familiar").trim(),
          telefono: (c.telefono || "").trim(),
          orden: c.orden || idx + 1,
        }));
    } else if (emergenciaNombre && emergenciaNombre.trim()) {
      contactosAInsertar = [
        {
          nombre: emergenciaNombre.trim(),
          vinculo: (emergenciaVinculo || "Familiar").trim(),
          telefono: (emergenciaTelefono || "").trim(),
          orden: 1,
        },
      ];
    }

    // 3. Resolver cuenta de usuario si se especificó correo o idUsuario
    let finalIdUsuario = idUsuario;
    const correoFinal = (correoContacto || correo || "").toLowerCase().trim() || null;

    if (!finalIdUsuario && correo) {
      const existingUser = await prisma.usuario.findUnique({
        where: { correo: correo.toLowerCase().trim() },
        include: { alumno: true },
      });

      if (existingUser) {
        if (existingUser.idAlumno) {
          throw new ConflictError(
            `El usuario con correo ${correo} ya está asociado a otro perfil de alumno`
          );
        }
        finalIdUsuario = existingUser.idUsuario;
      } else {
        let rolAlumno = await prisma.rol.findUnique({
          where: { rol: "ALUMNO" },
        });
        if (!rolAlumno) {
          rolAlumno = await prisma.rol.create({
            data: { rol: "ALUMNO" },
          });
        }

        const nuevoUsuario = await prisma.usuario.create({
          data: {
            correo: correo.toLowerCase().trim(),
            contrasenaHash: contrasena || "default_hash",
            idRol: rolAlumno.idRol,
            estado: "activo",
            nombre: restoData.nombre.trim(),
            apellido: restoData.apellido.trim(),
            documento: documentoLimpio,
            telefono: restoData.telefono?.trim() || null,
          },
        });
        finalIdUsuario = nuevoUsuario.idUsuario;
      }
    } else if (finalIdUsuario) {
      const usuario = await prisma.usuario.findUnique({
        where: { idUsuario: finalIdUsuario },
      });
      if (!usuario) {
        throw new NotFoundError(`No se encontró el usuario con ID: ${finalIdUsuario}`);
      }
      if (usuario.idAlumno) {
        throw new ConflictError(
          `El usuario con ID ${finalIdUsuario} ya tiene asignado un perfil de alumno`
        );
      }
    }

    // 4. Procesar fecha de nacimiento
    let fechaNacimientoObj = null;
    if (fechaNacimiento) {
      fechaNacimientoObj = new Date(`${fechaNacimiento}T00:00:00.000Z`);
      if (isNaN(fechaNacimientoObj.getTime())) {
        throw new BadRequestError("Formato de fecha de nacimiento inválido (YYYY-MM-DD)");
      }
      if (fechaNacimientoObj > new Date()) {
        throw new BadRequestError("La fecha de nacimiento no puede ser futura");
      }
    }

    // 5. Crear el Alumno y sus contactos dentro de una transacción atómica
    const nuevoAlumno = await prisma.$transaction(async (tx) => {
      const alumno = await tx.alumno.create({
        data: {
          ...restoData,
          documento: documentoLimpio,
          correoContacto: correoFinal,
          estado: (estado || "activo").toLowerCase(),
          fechaNacimiento: fechaNacimientoObj,
        },
      });

      // Crear contactos de emergencia asociados
      for (const contacto of contactosAInsertar) {
        await tx.contactoEmergencia.create({
          data: {
            idAlumno: alumno.idAlumno,
            nombre: contacto.nombre,
            vinculo: contacto.vinculo,
            telefono: contacto.telefono,
            orden: contacto.orden,
          },
        });
      }

      // Si existe un usuario vinculado, actualizar idAlumno en el usuario
      if (finalIdUsuario) {
        await tx.usuario.update({
          where: { idUsuario: finalIdUsuario },
          data: { idAlumno: alumno.idAlumno },
        });
      }

      return await tx.alumno.findUnique({
        where: { idAlumno: alumno.idAlumno },
        include: {
          contactosEmergencia: { orderBy: { orden: "asc" } },
          usuario: {
            select: {
              idUsuario: true,
              correo: true,
              idRol: true,
              rol: true,
              estado: true,
            },
          },
        },
      });
    });

    return this.#enriquecerAlumno(nuevoAlumno);
  }

  /**
   * Obtiene la lista paginada de Alumnos con filtros por búsqueda, estado, carrera o localidad.
   */
  async getAll({ page = 1, limit = 10, search, estado, carrera, localidad, provincia } = {}) {
    const skip = (page - 1) * limit;
    const where = {};

    if (estado) {
      where.estado = { equals: estado.toLowerCase(), mode: "insensitive" };
    }

    if (carrera) {
      where.carrera = { contains: carrera, mode: "insensitive" };
    }

    if (localidad) {
      where.localidad = { contains: localidad, mode: "insensitive" };
    }

    if (provincia) {
      where.provincia = { contains: provincia, mode: "insensitive" };
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { apellido: { contains: search, mode: "insensitive" } },
        { documento: { contains: search, mode: "insensitive" } },
        { correoContacto: { contains: search, mode: "insensitive" } },
        { legajo: { contains: search, mode: "insensitive" } },
        { carrera: { contains: search, mode: "insensitive" } },
        { usuario: { correo: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, alumnos] = await Promise.all([
      prisma.alumno.count({ where }),
      prisma.alumno.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
        include: {
          contactosEmergencia: { orderBy: { orden: "asc" } },
          usuario: {
            select: {
              idUsuario: true,
              correo: true,
              idRol: true,
              rol: true,
              estado: true,
            },
          },
          habitacionesAlumnos: {
            where: { fechaHasta: null },
            include: { habitacion: true },
          },
        },
      }),
    ]);

    return {
      alumnos: alumnos.map((a) => this.#enriquecerAlumno(a)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Obtiene un Alumno por su ID con todo su historial y relaciones asociadas.
   */
  async getById(id) {
    const alumno = await prisma.alumno.findUnique({
      where: { idAlumno: id },
      include: {
        contactosEmergencia: { orderBy: { orden: "asc" } },
        usuario: {
          select: {
            idUsuario: true,
            correo: true,
            idRol: true,
            rol: true,
            estado: true,
            fechaAlta: true,
          },
        },
        contratos: { orderBy: { fechaDesde: "desc" } },
        facturas: { orderBy: { fechaEmision: "desc" } },
        pagos: { orderBy: { fecha: "desc" } },
        multas: { orderBy: { fechaEmision: "desc" } },
        habitacionesAlumnos: {
          orderBy: { fechaDesde: "desc" },
          include: { habitacion: true },
        },
        grupoLimpiezaAlumno: {
          include: { grupoLimpieza: true },
        },
        reclamos: { orderBy: { fechaCreacion: "desc" } },
      },
    });

    if (!alumno) {
      throw new NotFoundError(`No se encontró ningún alumno con el ID: ${id}`);
    }

    return this.#enriquecerAlumno(alumno);
  }

  /**
   * Actualiza parcialmente un Alumno o una de sus secciones (personales, domicilio, académica, emergencia).
   */
  async update(id, data) {
    const alumno = await prisma.alumno.findUnique({
      where: { idAlumno: id },
      include: {
        usuario: true,
        contactosEmergencia: true,
      },
    });

    if (!alumno) {
      throw new NotFoundError(`No se encontró ningún alumno con el ID: ${id}`);
    }

    const {
      correo,
      correoContacto,
      contrasena,
      idUsuario,
      contactosEmergencia,
      emergenciaNombre,
      emergenciaVinculo,
      emergenciaTelefono,
      fechaNacimiento,
      estado,
      ...restoData
    } = data;

    // 1. Validar unicidad de documento si cambia
    if (restoData.documento && restoData.documento !== alumno.documento) {
      const conflict = await prisma.alumno.findFirst({
        where: {
          AND: [
            { idAlumno: { not: id } },
            { documento: restoData.documento.trim() },
          ],
        },
      });

      if (conflict) {
        throw new ConflictError(
          `El documento ${restoData.documento} ya está en uso por otro alumno`
        );
      }
      restoData.documento = restoData.documento.trim();
    }

    // 2. Procesar fecha de nacimiento si viene
    let fechaNacimientoObj;
    if (fechaNacimiento !== undefined) {
      if (fechaNacimiento === null || fechaNacimiento === "") {
        fechaNacimientoObj = null;
      } else {
        fechaNacimientoObj = new Date(`${fechaNacimiento}T00:00:00.000Z`);
        if (isNaN(fechaNacimientoObj.getTime()) || fechaNacimientoObj > new Date()) {
          throw new BadRequestError("Fecha de nacimiento inválida o futura");
        }
      }
    }

    // 3. Procesar actualización de correo
    const nuevoCorreo = correoContacto || correo;
    if (nuevoCorreo && alumno.usuario) {
      const userConflict = await prisma.usuario.findFirst({
        where: {
          AND: [
            { idUsuario: { not: alumno.usuario.idUsuario } },
            { correo: nuevoCorreo.toLowerCase().trim() },
          ],
        },
      });
      if (userConflict) {
        throw new ConflictError(
          `El correo ${nuevoCorreo} ya está en uso por otro usuario`
        );
      }

      await prisma.usuario.update({
        where: { idUsuario: alumno.usuario.idUsuario },
        data: { correo: nuevoCorreo.toLowerCase().trim() },
      });
    }

    // 4. Ejecutar actualización en transacción
    const alumnoActualizado = await prisma.$transaction(async (tx) => {
      // Actualizar contactos de emergencia si se pasaron explícitamente
      if (Array.isArray(contactosEmergencia)) {
        await tx.contactoEmergencia.deleteMany({
          where: { idAlumno: id },
        });

        for (let i = 0; i < contactosEmergencia.length; i++) {
          const c = contactosEmergencia[i];
          if (c && c.nombre && c.nombre.trim()) {
            await tx.contactoEmergencia.create({
              data: {
                idAlumno: id,
                nombre: c.nombre.trim(),
                vinculo: (c.vinculo || "Familiar").trim(),
                telefono: (c.telefono || "").trim(),
                orden: c.orden || i + 1,
              },
            });
          }
        }
      } else if (emergenciaNombre !== undefined) {
        // Fallback a campos planos
        if (emergenciaNombre && emergenciaNombre.trim()) {
          await tx.contactoEmergencia.deleteMany({ where: { idAlumno: id } });
          await tx.contactoEmergencia.create({
            data: {
              idAlumno: id,
              nombre: emergenciaNombre.trim(),
              vinculo: (emergenciaVinculo || "Familiar").trim(),
              telefono: (emergenciaTelefono || "").trim(),
              orden: 1,
            },
          });
        }
      }

      // Preparar payload de actualización del Alumno
      const dataUpdate = {
        ...restoData,
        ...(nuevoCorreo !== undefined
          ? { correoContacto: nuevoCorreo?.toLowerCase()?.trim() || null }
          : {}),
        ...(fechaNacimiento !== undefined ? { fechaNacimiento: fechaNacimientoObj } : {}),
        ...(estado ? { estado: estado.toLowerCase() } : {}),
      };

      return await tx.alumno.update({
        where: { idAlumno: id },
        data: dataUpdate,
        include: {
          contactosEmergencia: { orderBy: { orden: "asc" } },
          usuario: {
            select: {
              idUsuario: true,
              correo: true,
              idRol: true,
              rol: true,
              estado: true,
            },
          },
        },
      });
    });

    return this.#enriquecerAlumno(alumnoActualizado);
  }

  /**
   * Agrega un nuevo contacto de emergencia a un alumno.
   */
  async addContactoEmergencia(idAlumno, contactoData) {
    const alumno = await prisma.alumno.findUnique({
      where: { idAlumno },
    });
    if (!alumno) {
      throw new NotFoundError(`No se encontró el alumno con ID: ${idAlumno}`);
    }

    const conteoActual = await prisma.contactoEmergencia.count({
      where: { idAlumno },
    });

    return await prisma.contactoEmergencia.create({
      data: {
        idAlumno,
        nombre: contactoData.nombre.trim(),
        vinculo: contactoData.vinculo.trim(),
        telefono: contactoData.telefono.trim(),
        orden: contactoData.orden || conteoActual + 1,
      },
    });
  }

  /**
   * Actualiza un contacto de emergencia existente.
   */
  async updateContactoEmergencia(idAlumno, idContacto, contactoData) {
    const contacto = await prisma.contactoEmergencia.findFirst({
      where: { idContacto, idAlumno },
    });
    if (!contacto) {
      throw new NotFoundError(
        `No se encontró el contacto de emergencia ID ${idContacto} para el alumno ID ${idAlumno}`
      );
    }

    return await prisma.contactoEmergencia.update({
      where: { idContacto },
      data: {
        ...(contactoData.nombre ? { nombre: contactoData.nombre.trim() } : {}),
        ...(contactoData.vinculo ? { vinculo: contactoData.vinculo.trim() } : {}),
        ...(contactoData.telefono ? { telefono: contactoData.telefono.trim() } : {}),
        ...(contactoData.orden !== undefined ? { orden: contactoData.orden } : {}),
      },
    });
  }

  /**
   * Elimina un contacto de emergencia de un alumno.
   */
  async deleteContactoEmergencia(idAlumno, idContacto) {
    const contacto = await prisma.contactoEmergencia.findFirst({
      where: { idContacto, idAlumno },
    });
    if (!contacto) {
      throw new NotFoundError(
        `No se encontró el contacto de emergencia ID ${idContacto} para el alumno ID ${idAlumno}`
      );
    }

    return await prisma.contactoEmergencia.delete({
      where: { idContacto },
    });
  }

  /**
   * Elimina un Alumno por su ID (borrado físico en cascada si es requerido).
   * Para borrado lógico, se actualiza estado: "inactivo".
   */
  async delete(id) {
    const alumno = await prisma.alumno.findUnique({
      where: { idAlumno: id },
    });

    if (!alumno) {
      throw new NotFoundError(`No se encontró ningún alumno con el ID: ${id}`);
    }

    return await prisma.alumno.delete({
      where: { idAlumno: id },
    });
  }
}

export const alumnoService = new AlumnoService();
export default alumnoService;
