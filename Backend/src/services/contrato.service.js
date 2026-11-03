import { prisma } from "../config/database.js";
import { NotFoundError, ConflictError, BadRequestError } from "../utils/customErrors.js";

/**
 * Capa de Servicio: Contrato
 * Contiene la lógica de negocio para la gestión de contratos de residencia estudiantil,
 * vigencias, bajas anticipadas y renovaciones.
 */
class ContratoService {
  /**
   * Crea un nuevo Contrato verificando:
   * 1. Que el alumno exista y esté activo.
   * 2. Que el alumno no tenga ya otro contrato en estado VIGENTE.
   */
  async create(data) {
    const alumno = await prisma.alumno.findUnique({
      where: { idAlumno: data.idAlumno },
    });

    if (!alumno) {
      throw new NotFoundError(`No se encontró ningún alumno con el ID: ${data.idAlumno}`);
    }

    if (alumno.estado !== "ACTIVO") {
      throw new BadRequestError(
        `No se puede generar un contrato para el alumno ${alumno.nombre} ${alumno.apellido} porque se encuentra en estado '${alumno.estado}'`
      );
    }

    // Si se crea como VIGENTE, verificar que no tenga otro vigente actualmente
    const estadoInicial = data.estado || "VIGENTE";
    if (estadoInicial === "VIGENTE") {
      const contratoVigente = await prisma.contrato.findFirst({
        where: {
          idAlumno: data.idAlumno,
          estado: "VIGENTE",
        },
      });

      if (contratoVigente) {
        throw new ConflictError(
          `El alumno ya cuenta con un contrato VIGENTE (ID: ${contratoVigente.idContrato}). Debe finalizarlo, rescindirlo o cancelarlo antes de dar de alta uno nuevo.`
        );
      }
    }

    return await prisma.contrato.create({
      data: {
        idAlumno: data.idAlumno,
        fechaDesde: new Date(data.fechaDesde),
        fechaHasta: new Date(data.fechaHasta),
        estado: estadoInicial,
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
  }

  /**
   * Obtiene la lista paginada de Contratos con filtros por alumno, estado, búsqueda y vencimiento.
   */
  async getAll({ page = 1, limit = 10, idAlumno, estado, search, porVencerDias } = {}) {
    const skip = (page - 1) * limit;
    const where = {};

    if (idAlumno) {
      where.idAlumno = idAlumno;
    }

    if (estado) {
      where.estado = estado;
    }

    if (porVencerDias) {
      const now = new Date();
      const fechaLimite = new Date();
      fechaLimite.setDate(now.getDate() + porVencerDias);

      where.estado = "VIGENTE";
      where.fechaHasta = {
        gte: now,
        lte: fechaLimite,
      };
    }

    if (search) {
      where.alumno = {
        OR: [
          { nombre: { contains: search, mode: "insensitive" } },
          { apellido: { contains: search, mode: "insensitive" } },
          { documento: { contains: search, mode: "insensitive" } },
          { usuario: { correo: { contains: search, mode: "insensitive" } } },
        ],
      };
    }

    const [total, contratos] = await Promise.all([
      prisma.contrato.count({ where }),
      prisma.contrato.findMany({
        where,
        skip,
        take: limit,
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
      }),
    ]);

    return {
      contratos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Obtiene un Contrato por su ID con datos del alumno y su historial de habitación.
   */
  async getById(id) {
    const contrato = await prisma.contrato.findUnique({
      where: { idContrato: id },
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
            habitacionesAlumnos: {
              include: { habitacion: true },
              orderBy: { fechaDesde: "desc" },
            },
          },
        },
      },
    });

    if (!contrato) {
      throw new NotFoundError(`No se encontró ningún contrato con el ID: ${id}`);
    }

    return contrato;
  }

  /**
   * Actualiza parcialmente un Contrato verificando coherencia de fechas.
   */
  async update(id, data) {
    const contrato = await prisma.contrato.findUnique({
      where: { idContrato: id },
    });

    if (!contrato) {
      throw new NotFoundError(`No se encontró ningún contrato con el ID: ${id}`);
    }

    const nuevaFechaDesde = data.fechaDesde ? new Date(data.fechaDesde) : contrato.fechaDesde;
    const nuevaFechaHasta = data.fechaHasta ? new Date(data.fechaHasta) : contrato.fechaHasta;

    if (nuevaFechaHasta <= nuevaFechaDesde) {
      throw new BadRequestError("La fecha de finalización debe ser posterior a la fecha de inicio");
    }

    // Si se pasa a VIGENTE, verificar que no haya otro contrato VIGENTE distinto para este alumno
    if (data.estado === "VIGENTE" && contrato.estado !== "VIGENTE") {
      const otroVigente = await prisma.contrato.findFirst({
        where: {
          idAlumno: contrato.idAlumno,
          idContrato: { not: id },
          estado: "VIGENTE",
        },
      });

      if (otroVigente) {
        throw new ConflictError(
          `El alumno ya cuenta con otro contrato VIGENTE (ID: ${otroVigente.idContrato})`
        );
      }
    }

    return await prisma.contrato.update({
      where: { idContrato: id },
      data: {
        ...(data.fechaDesde ? { fechaDesde: nuevaFechaDesde } : {}),
        ...(data.fechaHasta ? { fechaHasta: nuevaFechaHasta } : {}),
        ...(data.estado ? { estado: data.estado } : {}),
      },
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
    });
  }

  /**
   * Cambia el estado de un Contrato (ej. dar de baja o rescindir antes de tiempo).
   */
  async cambiarEstado(id, nuevoEstado) {
    const contrato = await prisma.contrato.findUnique({
      where: { idContrato: id },
    });

    if (!contrato) {
      throw new NotFoundError(`No se encontró ningún contrato con el ID: ${id}`);
    }

    // Si se intenta reactivar como VIGENTE
    if (nuevoEstado === "VIGENTE" && contrato.estado !== "VIGENTE") {
      const otroVigente = await prisma.contrato.findFirst({
        where: {
          idAlumno: contrato.idAlumno,
          idContrato: { not: id },
          estado: "VIGENTE",
        },
      });

      if (otroVigente) {
        throw new ConflictError(
          `No se puede reactivar el contrato porque el alumno ya tiene otro contrato VIGENTE (ID: ${otroVigente.idContrato})`
        );
      }
    }

    return await prisma.contrato.update({
      where: { idContrato: id },
      data: { estado: nuevoEstado },
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
    });
  }

  /**
   * Elimina un Contrato por su ID.
   */
  async delete(id) {
    const contrato = await prisma.contrato.findUnique({
      where: { idContrato: id },
    });

    if (!contrato) {
      throw new NotFoundError(`No se encontró ningún contrato con el ID: ${id}`);
    }

    return await prisma.contrato.delete({
      where: { idContrato: id },
    });
  }
}

export const contratoService = new ContratoService();
export default contratoService;
