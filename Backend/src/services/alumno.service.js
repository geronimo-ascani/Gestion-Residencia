import { prisma } from "../config/database.js";
import { NotFoundError, ConflictError, BadRequestError } from "../utils/customErrors.js";

/**
 * Capa de Servicio: Alumno
 * Contiene la lógica de negocio, validaciones de dominio y llamadas directas al cliente Prisma.
 * Modela la herencia con Usuario (Alumno extiende/pertenece a Usuario).
 */
class AlumnoService {
  /**
   * Crea un nuevo registro de Alumno tras verificar unicidad de documento y vincular/crear su cuenta de Usuario.
   */
  async create(data) {
    const { correo, idUsuario, contrasena, ...alumnoData } = data;

    // 1. Verificar si el documento ya está registrado
    const existingDoc = await prisma.alumno.findUnique({
      where: { documento: alumnoData.documento },
    });
    if (existingDoc) {
      throw new ConflictError(`Ya existe un alumno registrado con el documento: ${alumnoData.documento}`);
    }

    let finalIdUsuario = idUsuario;

    // 2. Resolver cuenta de Usuario (herencia)
    if (!finalIdUsuario) {
      if (!correo) {
        throw new BadRequestError("Se requiere un 'idUsuario' existente o un 'correo' para asociar el usuario del alumno");
      }

      const existingUser = await prisma.usuario.findUnique({
        where: { correo },
        include: { alumno: true },
      });

      if (existingUser) {
        if (existingUser.alumno) {
          throw new ConflictError(`El usuario con correo ${correo} ya está asociado a otro perfil de alumno`);
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
            correo,
            contrasenaHash: contrasena || "default_hash",
            idRol: rolAlumno.idRol,
          },
        });
        finalIdUsuario = nuevoUsuario.idUsuario;
      }
    } else {
      const usuario = await prisma.usuario.findUnique({
        where: { idUsuario: finalIdUsuario },
        include: { alumno: true },
      });
      if (!usuario) {
        throw new NotFoundError(`No se encontró el usuario con ID: ${finalIdUsuario}`);
      }
      if (usuario.alumno) {
        throw new ConflictError(`El usuario con ID ${finalIdUsuario} ya tiene asignado un perfil de alumno`);
      }
    }

    // 3. Crear el alumno vinculado a su usuario
    return await prisma.alumno.create({
      data: {
        ...alumnoData,
        idUsuario: finalIdUsuario,
      },
      include: {
        usuario: {
          select: {
            idUsuario: true,
            correo: true,
            idRol: true,
            rol: true,
          },
        },
      },
    });
  }

  /**
   * Obtiene la lista paginada de Alumnos con filtro de búsqueda opcional.
   */
  async getAll({ page = 1, limit = 10, search, estado } = {}) {
    const skip = (page - 1) * limit;

    const where = {};

    if (estado) {
      where.estado = estado;
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { nombre: { contains: search, mode: "insensitive" } },
            { apellido: { contains: search, mode: "insensitive" } },
            { documento: { contains: search, mode: "insensitive" } },
            { usuario: { correo: { contains: search, mode: "insensitive" } } },
          ],
        },
      ];
    }

    const [total, alumnos] = await Promise.all([
      prisma.alumno.count({ where }),
      prisma.alumno.findMany({
        where,
        skip,
        take: limit,
        orderBy: { idAlumno: "desc" },
        include: {
          usuario: {
            select: {
              idUsuario: true,
              correo: true,
              idRol: true,
              rol: true,
            },
          },
        },
      }),
    ]);

    return {
      alumnos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtiene un Alumno por su clave primaria, incluyendo sus relaciones clave y los datos del Usuario heredado.
   */
  async getById(id) {
    const alumno = await prisma.alumno.findUnique({
      where: { idAlumno: id },
      include: {
        usuario: {
          select: {
            idUsuario: true,
            correo: true,
            idRol: true,
            rol: true,
          },
        },
        contratos: true,
        cuotasMensuales: true,
        multas: true,
        habitacionesAlumnos: {
          include: {
            habitacion: true,
          },
        },
        gruposLimpiezaAlumnos: {
          include: {
            grupoLimpieza: true,
          },
        },
      },
    });

    if (!alumno) {
      throw new NotFoundError(`No se encontró ningún alumno con el ID: ${id}`);
    }

    return alumno;
  }

  /**
   * Actualiza parcialmente un Alumno tras verificar su existencia y evitar conflictos de duplicidad.
   */
  async update(id, data) {
    const alumno = await prisma.alumno.findUnique({
      where: { idAlumno: id },
      include: { usuario: true },
    });

    if (!alumno) {
      throw new NotFoundError(`No se encontró ningún alumno con el ID: ${id}`);
    }

    const { correo, contrasena, idUsuario, ...alumnoData } = data;

    if (alumnoData.documento) {
      const conflict = await prisma.alumno.findFirst({
        where: {
          AND: [
            { idAlumno: { not: id } },
            { documento: alumnoData.documento },
          ],
        },
      });

      if (conflict) {
        throw new ConflictError(`El documento ${alumnoData.documento} ya está en uso por otro alumno`);
      }
    }

    if (correo && alumno.usuario) {
      const userConflict = await prisma.usuario.findFirst({
        where: {
          AND: [
            { idUsuario: { not: alumno.usuario.idUsuario } },
            { correo },
          ],
        },
      });
      if (userConflict) {
        throw new ConflictError(`El correo ${correo} ya está en uso por otro usuario`);
      }

      await prisma.usuario.update({
        where: { idUsuario: alumno.usuario.idUsuario },
        data: { correo },
      });
    }

    return await prisma.alumno.update({
      where: { idAlumno: id },
      data: alumnoData,
      include: {
        usuario: {
          select: {
            idUsuario: true,
            correo: true,
            idRol: true,
            rol: true,
          },
        },
      },
    });
  }

  /**
   * Elimina un Alumno por su ID (las tablas relacionadas se eliminan en cascada según el schema).
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
