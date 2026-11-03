import { prisma } from "../config/database.js";
import { NotFoundError, ConflictError, BadRequestError } from "../utils/customErrors.js";

/**
 * Capa de Servicio: Habitación y Asignación de Alumnos
 * Contiene la lógica de negocio para la gestión de plazas, disponibilidad y asignaciones históricas.
 */
class HabitacionService {
  /**
   * Crea una nueva Habitación tras verificar la unicidad del número de habitación.
   */
  async create(data) {
    const existing = await prisma.habitacion.findFirst({
      where: { numeroHabitacion: data.numeroHabitacion },
    });

    if (existing) {
      throw new ConflictError(
        `Ya existe una habitación registrada con el número: ${data.numeroHabitacion}`
      );
    }

    return await prisma.habitacion.create({
      data,
    });
  }

  /**
   * Obtiene la lista de Habitaciones con filtros por piso, disponibilidad y búsqueda de texto.
   * Calcula plazas ocupadas y disponibles en tiempo real.
   */
  async getAll({ page = 1, limit = 10, search, piso, soloDisponibles } = {}) {
    const now = new Date();
    const where = {};

    if (piso !== undefined) {
      where.pisoHabitacion = piso;
    }

    if (search) {
      where.OR = [
        { numeroHabitacion: { contains: search, mode: "insensitive" } },
        { descripcion: { contains: search, mode: "insensitive" } },
      ];
    }

    // Traemos las habitaciones con sus asignaciones activas
    const todasLasHabitaciones = await prisma.habitacion.findMany({
      where,
      orderBy: { numeroHabitacion: "asc" },
      include: {
        habitacionesAlumnos: {
          where: {
            OR: [
              { fechaHasta: null },
              { fechaHasta: { gt: now } },
            ],
          },
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
      },
    });

    // Mapear métricas de ocupación
    let habitacionesConMetricas = todasLasHabitaciones.map((hab) => {
      const ocupacionActual = hab.habitacionesAlumnos.length;
      const plazasDisponibles = Math.max(0, hab.capacidadMaxima - ocupacionActual);
      const estado = plazasDisponibles > 0 ? "DISPONIBLE" : "COMPLETA";

      return {
        idHabitacion: hab.idHabitacion,
        numeroHabitacion: hab.numeroHabitacion,
        capacidadMaxima: hab.capacidadMaxima,
        pisoHabitacion: hab.pisoHabitacion,
        descripcion: hab.descripcion,
        ocupacionActual,
        plazasDisponibles,
        estado,
        ocupantesActuales: hab.habitacionesAlumnos.map((ha) => ({
          ...ha.alumno,
          fechaDesde: ha.fechaDesde,
          fechaHasta: ha.fechaHasta,
        })),
      };
    });

    // Filtro en memoria para solo disponibles si fue solicitado
    if (soloDisponibles) {
      habitacionesConMetricas = habitacionesConMetricas.filter(
        (h) => h.plazasDisponibles > 0
      );
    }

    // Paginación
    const total = habitacionesConMetricas.length;
    const skip = (page - 1) * limit;
    const paginadas = habitacionesConMetricas.slice(skip, skip + limit);

    return {
      habitaciones: paginadas,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Obtiene el detalle de una Habitación con sus ocupantes actuales y su historial completo.
   */
  async getById(id) {
    const now = new Date();

    const habitacion = await prisma.habitacion.findUnique({
      where: { idHabitacion: id },
      include: {
        habitacionesAlumnos: {
          orderBy: { fechaDesde: "desc" },
          include: {
            alumno: {
              select: {
                idAlumno: true,
                nombre: true,
                apellido: true,
                documento: true,
                telefono: true,
                estado: true,
                usuario: {
                  select: { correo: true },
                },
              },
            },
          },
        },
      },
    });

    if (!habitacion) {
      throw new NotFoundError(`No se encontró ninguna habitación con el ID: ${id}`);
    }

    const ocupantesActuales = [];
    const historialOcupantes = [];

    for (const ha of habitacion.habitacionesAlumnos) {
      const registro = {
        alumno: ha.alumno,
        fechaDesde: ha.fechaDesde,
        fechaHasta: ha.fechaHasta,
      };

      const estaActivo = !ha.fechaHasta || ha.fechaHasta > now;
      if (estaActivo) {
        ocupantesActuales.push(registro);
      } else {
        historialOcupantes.push(registro);
      }
    }

    const plazasDisponibles = Math.max(0, habitacion.capacidadMaxima - ocupantesActuales.length);

    return {
      idHabitacion: habitacion.idHabitacion,
      numeroHabitacion: habitacion.numeroHabitacion,
      capacidadMaxima: habitacion.capacidadMaxima,
      pisoHabitacion: habitacion.pisoHabitacion,
      descripcion: habitacion.descripcion,
      ocupacionActual: ocupantesActuales.length,
      plazasDisponibles,
      estado: plazasDisponibles > 0 ? "DISPONIBLE" : "COMPLETA",
      ocupantesActuales,
      historialOcupantes,
    };
  }

  /**
   * Actualiza una Habitación.
   * Valida que no se reduzca la capacidad por debajo de la cantidad de alumnos actualmente alojados.
   */
  async update(id, data) {
    const habitacion = await prisma.habitacion.findUnique({
      where: { idHabitacion: id },
      include: {
        habitacionesAlumnos: {
          where: {
            OR: [
              { fechaHasta: null },
              { fechaHasta: { gt: new Date() } },
            ],
          },
        },
      },
    });

    if (!habitacion) {
      throw new NotFoundError(`No se encontró ninguna habitación con el ID: ${id}`);
    }

    // Verificar unicidad de número si cambia
    if (data.numeroHabitacion && data.numeroHabitacion !== habitacion.numeroHabitacion) {
      const conflict = await prisma.habitacion.findFirst({
        where: {
          AND: [
            { idHabitacion: { not: id } },
            { numeroHabitacion: data.numeroHabitacion },
          ],
        },
      });

      if (conflict) {
        throw new ConflictError(
          `Ya existe otra habitación registrada con el número: ${data.numeroHabitacion}`
        );
      }
    }

    // Validar capacidad mínima respecto a ocupantes actuales
    if (data.capacidadMaxima !== undefined) {
      const ocupantesActuales = habitacion.habitacionesAlumnos.length;
      if (data.capacidadMaxima < ocupantesActuales) {
        throw new BadRequestError(
          `No se puede reducir la capacidad a ${data.capacidadMaxima} porque actualmente hay ${ocupantesActuales} alumno(s) alojado(s) en la habitación`
        );
      }
    }

    return await prisma.habitacion.update({
      where: { idHabitacion: id },
      data,
    });
  }

  /**
   * Elimina una Habitación.
   * Impide eliminar habitaciones que tengan alumnos actualmente alojados.
   */
  async delete(id) {
    const habitacion = await prisma.habitacion.findUnique({
      where: { idHabitacion: id },
      include: {
        habitacionesAlumnos: {
          where: {
            OR: [
              { fechaHasta: null },
              { fechaHasta: { gt: new Date() } },
            ],
          },
        },
      },
    });

    if (!habitacion) {
      throw new NotFoundError(`No se encontró ninguna habitación con el ID: ${id}`);
    }

    if (habitacion.habitacionesAlumnos.length > 0) {
      throw new ConflictError(
        `No se puede eliminar la habitación ${habitacion.numeroHabitacion} porque tiene ${habitacion.habitacionesAlumnos.length} alumno(s) actualmente alojado(s). Debe desasignarlos primero.`
      );
    }

    return await prisma.habitacion.delete({
      where: { idHabitacion: id },
    });
  }

  /**
   * Asigna un Alumno a una Habitación verificando:
   * 1. Que el alumno exista y esté activo.
   * 2. Que el alumno no tenga otra habitación activa asignada.
   * 3. Que la habitación tenga plazas disponibles.
   */
  async asignarAlumno(idHabitacion, { idAlumno, fechaDesde, fechaHasta }) {
    const habitacion = await prisma.habitacion.findUnique({
      where: { idHabitacion },
    });

    if (!habitacion) {
      throw new NotFoundError(`No se encontró la habitación con ID: ${idHabitacion}`);
    }

    // 1. Verificar alumno
    const alumno = await prisma.alumno.findUnique({
      where: { idAlumno },
    });

    if (!alumno) {
      throw new NotFoundError(`No se encontró el alumno con ID: ${idAlumno}`);
    }

    if (alumno.estado !== "ACTIVO") {
      throw new BadRequestError(
        `No se puede asignar el alumno ${alumno.nombre} ${alumno.apellido} porque se encuentra en estado '${alumno.estado}'`
      );
    }

    // 2. Verificar que el alumno no tenga ya una habitación activa asignada
    const now = new Date();
    const asignacionPrevia = await prisma.habitacionAlumno.findFirst({
      where: {
        idAlumno,
        OR: [
          { fechaHasta: null },
          { fechaHasta: { gt: now } },
        ],
      },
      include: { habitacion: true },
    });

    if (asignacionPrevia) {
      throw new ConflictError(
        `El alumno ya se encuentra actualmente alojado en la habitación '${asignacionPrevia.habitacion.numeroHabitacion}'`
      );
    }

    // 3. Verificar capacidad máxima disponible
    const ocupantesCount = await prisma.habitacionAlumno.count({
      where: {
        idHabitacion,
        OR: [
          { fechaHasta: null },
          { fechaHasta: { gt: now } },
        ],
      },
    });

    if (ocupantesCount >= habitacion.capacidadMaxima) {
      throw new ConflictError(
        `La habitación '${habitacion.numeroHabitacion}' está completa (capacidad máxima: ${habitacion.capacidadMaxima})`
      );
    }

    const fechaInicio = fechaDesde ? new Date(fechaDesde) : new Date();

    return await prisma.habitacionAlumno.create({
      data: {
        idHabitacion,
        idAlumno,
        fechaDesde: fechaInicio,
        fechaHasta: fechaHasta ? new Date(fechaHasta) : null,
      },
      include: {
        habitacion: true,
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
    });
  }

  /**
   * Desasigna/libera a un alumno de una habitación estableciendo su fechaHasta.
   */
  async desasignarAlumno(idHabitacion, { idAlumno, fechaHasta }) {
    const habitacion = await prisma.habitacion.findUnique({
      where: { idHabitacion },
    });

    if (!habitacion) {
      throw new NotFoundError(`No se encontró la habitación con ID: ${idHabitacion}`);
    }

    const now = new Date();

    // Buscar asignación activa
    const asignacion = await prisma.habitacionAlumno.findFirst({
      where: {
        idHabitacion,
        idAlumno,
        OR: [
          { fechaHasta: null },
          { fechaHasta: { gt: now } },
        ],
      },
    });

    if (!asignacion) {
      throw new NotFoundError(
        `No se encontró una asignación activa del alumno ID ${idAlumno} en la habitación '${habitacion.numeroHabitacion}'`
      );
    }

    const fechaSalida = fechaHasta ? new Date(fechaHasta) : now;

    return await prisma.habitacionAlumno.update({
      where: {
        idHabitacion_idAlumno_fechaDesde: {
          idHabitacion: asignacion.idHabitacion,
          idAlumno: asignacion.idAlumno,
          fechaDesde: asignacion.fechaDesde,
        },
      },
      data: {
        fechaHasta: fechaSalida,
      },
      include: {
        habitacion: true,
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
  }

  /**
   * Obtiene los ocupantes actuales de una habitación.
   */
  async getOcupantes(idHabitacion) {
    const habitacion = await prisma.habitacion.findUnique({
      where: { idHabitacion },
    });

    if (!habitacion) {
      throw new NotFoundError(`No se encontró la habitación con ID: ${idHabitacion}`);
    }

    const now = new Date();

    const asignaciones = await prisma.habitacionAlumno.findMany({
      where: {
        idHabitacion,
        OR: [
          { fechaHasta: null },
          { fechaHasta: { gt: now } },
        ],
      },
      include: {
        alumno: {
          select: {
            idAlumno: true,
            nombre: true,
            apellido: true,
            documento: true,
            telefono: true,
            estado: true,
            usuario: {
              select: { correo: true },
            },
          },
        },
      },
    });

    return {
      habitacion: {
        idHabitacion: habitacion.idHabitacion,
        numeroHabitacion: habitacion.numeroHabitacion,
        capacidadMaxima: habitacion.capacidadMaxima,
        pisoHabitacion: habitacion.pisoHabitacion,
      },
      totalOcupantes: asignaciones.length,
      plazasDisponibles: Math.max(0, habitacion.capacidadMaxima - asignaciones.length),
      ocupantes: asignaciones.map((a) => ({
        ...a.alumno,
        fechaDesde: a.fechaDesde,
        fechaHasta: a.fechaHasta,
      })),
    };
  }
}

export const habitacionService = new HabitacionService();
export default habitacionService;
