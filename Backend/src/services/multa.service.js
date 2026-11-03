import { prisma } from "../config/database.js";
import { NotFoundError, ConflictError, BadRequestError } from "../utils/customErrors.js";

/**
 * Capa de Servicio: Multa
 * Contiene la lógica de negocio para la emisión, cobro, vencimiento y anulación de multas disciplinarias o de convivencia.
 */
class MultaService {
  /**
   * Crea una nueva Multa para un alumno verificando:
   * 1. Que el alumno exista.
   * 2. Que la fecha de vencimiento sea posterior o igual a la emisión.
   */
  async create(data) {
    const alumno = await prisma.alumno.findUnique({
      where: { idAlumno: data.idAlumno },
    });

    if (!alumno) {
      throw new NotFoundError(`No se encontró ningún alumno con el ID: ${data.idAlumno}`);
    }

    const fechaEmision = data.fechaEmision ? new Date(data.fechaEmision) : new Date();
    const fechaVence = new Date(data.fechaVence);

    if (fechaVence < fechaEmision) {
      throw new BadRequestError("La fecha de vencimiento no puede ser anterior a la fecha de emisión");
    }

    return await prisma.multa.create({
      data: {
        idAlumno: data.idAlumno,
        monto: data.monto,
        fechaEmision,
        fechaVence,
        estadoMulta: data.estadoMulta || "PENDIENTE",
      },
      include: {
        alumno: {
          select: {
            idAlumno: true,
            nombre: true,
            apellido: true,
            documento: true,
            estado: true,
            usuario: { select: { correo: true } },
          },
        },
      },
    });
  }

  /**
   * Obtiene la lista paginada de Multas con filtros, métricas de recaudación y detección de vencidas.
   */
  async getAll({ page = 1, limit = 10, idAlumno, estadoMulta, search, soloVencidas } = {}) {
    const skip = (page - 1) * limit;
    const now = new Date();
    const where = {};

    if (idAlumno) {
      where.idAlumno = idAlumno;
    }

    if (estadoMulta) {
      where.estadoMulta = estadoMulta;
    }

    if (soloVencidas) {
      where.estadoMulta = "PENDIENTE";
      where.fechaVence = { lt: now };
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

    const [total, multas, agrupadas] = await Promise.all([
      prisma.multa.count({ where }),
      prisma.multa.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaEmision: "desc" },
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
      }),
      prisma.multa.groupBy({
        by: ["estadoMulta"],
        where,
        _sum: { monto: true },
        _count: { idMulta: true },
      }),
    ]);

    // Resumen financiero
    const resumen = {
      totalRegistros: total,
      totalRecaudado: 0,
      totalPendiente: 0,
      totalAnulado: 0,
    };

    for (const g of agrupadas) {
      const totalMonto = Number(g._sum.monto || 0);
      if (g.estadoMulta === "PAGADA") resumen.totalRecaudado += totalMonto;
      else if (g.estadoMulta === "PENDIENTE") resumen.totalPendiente += totalMonto;
      else if (g.estadoMulta === "ANULADA") resumen.totalAnulado += totalMonto;
    }

    // Agregar flag dinamico de si está vencida
    const multasFormateadas = multas.map((m) => ({
      ...m,
      esVencida: m.estadoMulta === "PENDIENTE" && new Date(m.fechaVence) < now,
    }));

    return {
      multas: multasFormateadas,
      resumen,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Obtiene el detalle de una Multa por su ID.
   */
  async getById(id) {
    const multa = await prisma.multa.findUnique({
      where: { idMulta: id },
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
            habitacionesAlumnos: {
              where: {
                OR: [{ fechaHasta: null }, { fechaHasta: { gt: new Date() } }],
              },
              include: { habitacion: true },
            },
          },
        },
      },
    });

    if (!multa) {
      throw new NotFoundError(`No se encontró ninguna multa con el ID: ${id}`);
    }

    const esVencida = multa.estadoMulta === "PENDIENTE" && new Date(multa.fechaVence) < new Date();

    return {
      ...multa,
      esVencida,
    };
  }

  /**
   * Actualiza parcialmente una Multa.
   */
  async update(id, data) {
    const multa = await prisma.multa.findUnique({
      where: { idMulta: id },
    });

    if (!multa) {
      throw new NotFoundError(`No se encontró ninguna multa con el ID: ${id}`);
    }

    const nuevaEmision = multa.fechaEmision;
    const nuevaVence = data.fechaVence ? new Date(data.fechaVence) : multa.fechaVence;

    if (nuevaVence < nuevaEmision) {
      throw new BadRequestError("La fecha de vencimiento no puede ser anterior a la de emisión");
    }

    return await prisma.multa.update({
      where: { idMulta: id },
      data: {
        ...(data.monto !== undefined ? { monto: data.monto } : {}),
        ...(data.fechaVence ? { fechaVence: nuevaVence } : {}),
        ...(data.estadoMulta ? { estadoMulta: data.estadoMulta } : {}),
      },
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
  }

  /**
   * Cambia el estado de una Multa (PAGADA, PENDIENTE, ANULADA).
   */
  async cambiarEstado(id, nuevoEstado) {
    const multa = await prisma.multa.findUnique({
      where: { idMulta: id },
    });

    if (!multa) {
      throw new NotFoundError(`No se encontró ninguna multa con el ID: ${id}`);
    }

    return await prisma.multa.update({
      where: { idMulta: id },
      data: { estadoMulta: nuevoEstado },
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
  }

  /**
   * Registra el pago de una Multa.
   */
  async registrarPago(id) {
    const multa = await prisma.multa.findUnique({
      where: { idMulta: id },
    });

    if (!multa) {
      throw new NotFoundError(`No se encontró ninguna multa con el ID: ${id}`);
    }

    if (multa.estadoMulta === "PAGADA") {
      throw new ConflictError(`La multa con ID ${id} ya se encuentra registrada como PAGADA`);
    }

    return await prisma.multa.update({
      where: { idMulta: id },
      data: { estadoMulta: "PAGADA" },
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
  }

  /**
   * Elimina una Multa por su ID.
   */
  async delete(id) {
    const multa = await prisma.multa.findUnique({
      where: { idMulta: id },
    });

    if (!multa) {
      throw new NotFoundError(`No se encontró ninguna multa con el ID: ${id}`);
    }

    return await prisma.multa.delete({
      where: { idMulta: id },
    });
  }
}

export const multaService = new MultaService();
export default multaService;

