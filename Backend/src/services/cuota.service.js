import { prisma } from "../config/database.js";
import { NotFoundError, ConflictError, BadRequestError } from "../utils/customErrors.js";

/**
 * Capa de Servicio: Cuota Mensual
 * Contiene la lógica de negocio para la emisión, cobro y seguimiento de cuotas de residencia.
 */
class CuotaService {
  /**
   * Crea una Cuota individual para un alumno verificando:
   * 1. Que el alumno exista.
   * 2. Que no tenga ya una cuota emitida para el mismo mes asociado.
   */
  async create(data) {
    const alumno = await prisma.alumno.findUnique({
      where: { idAlumno: data.idAlumno },
    });

    if (!alumno) {
      throw new NotFoundError(`No se encontró ningún alumno con el ID: ${data.idAlumno}`);
    }

    // Evitar duplicar cuotas para el mismo mes
    const cuotaExistente = await prisma.cuotaMensual.findFirst({
      where: {
        idAlumno: data.idAlumno,
        mesAsociado: data.mesAsociado,
      },
    });

    if (cuotaExistente) {
      throw new ConflictError(
        `El alumno ${alumno.nombre} ${alumno.apellido} ya tiene una cuota registrada para el mes '${data.mesAsociado}' (ID: ${cuotaExistente.idCuota})`
      );
    }

    return await prisma.cuotaMensual.create({
      data: {
        idAlumno: data.idAlumno,
        mesAsociado: data.mesAsociado,
        montoPagado: data.montoPagado,
        fechaEmision: data.fechaEmision ? new Date(data.fechaEmision) : new Date(),
        estadoCuota: data.estadoCuota || "PENDIENTE",
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
   * Genera masivamente la cuota del mes para todos los alumnos activos que cuenten con contrato vigente.
   */
  async generarCuotasMes({ mesAsociado, monto, fechaEmision }) {
    const alumnos = await prisma.alumno.findMany({
      where: {
        estado: "ACTIVO",
        contratos: {
          some: { estado: "VIGENTE" },
        },
      },
      include: {
        cuotasMensuales: {
          where: { mesAsociado },
        },
      },
    });

    if (alumnos.length === 0) {
      return {
        mesAsociado,
        generadas: 0,
        omitidas: 0,
        mensaje: "No se encontraron alumnos activos con contrato vigente para emitir cuotas",
        detalle: [],
      };
    }

    const fecha = fechaEmision ? new Date(fechaEmision) : new Date();
    const creadas = [];
    const omitidas = [];

    for (const alumno of alumnos) {
      if (alumno.cuotasMensuales.length > 0) {
        omitidas.push({
          idAlumno: alumno.idAlumno,
          nombreCompleto: `${alumno.nombre} ${alumno.apellido}`,
          motivo: `Ya posee cuota para el mes '${mesAsociado}'`,
        });
        continue;
      }

      const nuevaCuota = await prisma.cuotaMensual.create({
        data: {
          idAlumno: alumno.idAlumno,
          mesAsociado,
          montoPagado: monto,
          fechaEmision: fecha,
          estadoCuota: "PENDIENTE",
        },
      });

      creadas.push({
        idCuota: nuevaCuota.idCuota,
        idAlumno: alumno.idAlumno,
        nombreCompleto: `${alumno.nombre} ${alumno.apellido}`,
        monto,
      });
    }

    return {
      mesAsociado,
      totalAlumnosConContrato: alumnos.length,
      generadas: creadas.length,
      omitidas: omitidas.length,
      creadas,
      omitidasDetalle: omitidas,
    };
  }

  /**
   * Obtiene la lista paginada de Cuotas con filtros y métricas financieras acumuladas.
   */
  async getAll({ page = 1, limit = 10, idAlumno, estadoCuota, mesAsociado, search } = {}) {
    const skip = (page - 1) * limit;
    const where = {};

    if (idAlumno) {
      where.idAlumno = idAlumno;
    }

    if (estadoCuota) {
      where.estadoCuota = estadoCuota;
    }

    if (mesAsociado) {
      where.mesAsociado = { contains: mesAsociado, mode: "insensitive" };
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

    const [total, cuotas, agrupadasPorEstado] = await Promise.all([
      prisma.cuotaMensual.count({ where }),
      prisma.cuotaMensual.findMany({
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
      prisma.cuotaMensual.groupBy({
        by: ["estadoCuota"],
        where,
        _sum: { montoPagado: true },
        _count: { idCuota: true },
      }),
    ]);

    // Resumen financiero de la consulta actual
    const resumen = {
      totalRegistros: total,
      totalRecaudado: 0,
      totalPendiente: 0,
      totalVencido: 0,
    };

    for (const grupo of agrupadasPorEstado) {
      const totalMonto = Number(grupo._sum.montoPagado || 0);
      if (grupo.estadoCuota === "PAGADA") resumen.totalRecaudado += totalMonto;
      else if (grupo.estadoCuota === "PENDIENTE") resumen.totalPendiente += totalMonto;
      else if (grupo.estadoCuota === "VENCIDA") resumen.totalVencido += totalMonto;
    }

    return {
      cuotas,
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
   * Obtiene el detalle de una Cuota por su ID.
   */
  async getById(id) {
    const cuota = await prisma.cuotaMensual.findUnique({
      where: { idCuota: id },
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

    if (!cuota) {
      throw new NotFoundError(`No se encontró ninguna cuota con el ID: ${id}`);
    }

    return cuota;
  }

  /**
   * Actualiza parcialmente una Cuota.
   */
  async update(id, data) {
    const cuota = await prisma.cuotaMensual.findUnique({
      where: { idCuota: id },
    });

    if (!cuota) {
      throw new NotFoundError(`No se encontró ninguna cuota con el ID: ${id}`);
    }

    if (data.mesAsociado && data.mesAsociado !== cuota.mesAsociado) {
      const duplicado = await prisma.cuotaMensual.findFirst({
        where: {
          idAlumno: cuota.idAlumno,
          idCuota: { not: id },
          mesAsociado: data.mesAsociado,
        },
      });

      if (duplicado) {
        throw new ConflictError(
          `El alumno ya cuenta con otra cuota para el mes '${data.mesAsociado}'`
        );
      }
    }

    return await prisma.cuotaMensual.update({
      where: { idCuota: id },
      data,
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
   * Registra el pago de una cuota marcándola como PAGADA.
   */
  async registrarPago(id, { montoPagado } = {}) {
    const cuota = await prisma.cuotaMensual.findUnique({
      where: { idCuota: id },
    });

    if (!cuota) {
      throw new NotFoundError(`No se encontró ninguna cuota con el ID: ${id}`);
    }

    if (cuota.estadoCuota === "PAGADA") {
      throw new ConflictError(`La cuota con ID ${id} ya se encuentra registrada como PAGADA`);
    }

    return await prisma.cuotaMensual.update({
      where: { idCuota: id },
      data: {
        estadoCuota: "PAGADA",
        ...(montoPagado !== undefined ? { montoPagado } : {}),
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
   * Elimina una Cuota por su ID.
   */
  async delete(id) {
    const cuota = await prisma.cuotaMensual.findUnique({
      where: { idCuota: id },
    });

    if (!cuota) {
      throw new NotFoundError(`No se encontró ninguna cuota con el ID: ${id}`);
    }

    return await prisma.cuotaMensual.delete({
      where: { idCuota: id },
    });
  }

  /**
   * Resumen del estado financiero integral de un alumno (cuotas + multas).
   */
  async getBalanceAlumno(idAlumno) {
    const alumno = await prisma.alumno.findUnique({
      where: { idAlumno },
      include: {
        cuotasMensuales: {
          orderBy: { fechaEmision: "desc" },
        },
        multas: {
          orderBy: { fechaEmision: "desc" },
        },
      },
    });

    if (!alumno) {
      throw new NotFoundError(`No se encontró ningún alumno con el ID: ${idAlumno}`);
    }

    let cuotasPagadas = 0;
    let cuotasPendientes = 0;
    let multasPagadas = 0;
    let multasPendientes = 0;

    for (const c of alumno.cuotasMensuales) {
      const monto = Number(c.montoPagado);
      if (c.estadoCuota === "PAGADA") cuotasPagadas += monto;
      else if (c.estadoCuota === "PENDIENTE" || c.estadoCuota === "VENCIDA") cuotasPendientes += monto;
    }

    for (const m of alumno.multas) {
      const monto = Number(m.monto);
      if (m.estadoMulta === "PAGADA") multasPagadas += monto;
      else if (m.estadoMulta === "PENDIENTE") multasPendientes += monto;
    }

    const deudaTotal = cuotasPendientes + multasPendientes;
    const totalAbonado = cuotasPagadas + multasPagadas;

    return {
      alumno: {
        idAlumno: alumno.idAlumno,
        nombreCompleto: `${alumno.nombre} ${alumno.apellido}`,
        documento: alumno.documento,
        estado: alumno.estado,
      },
      balance: {
        deudaTotal,
        totalAbonado,
        cuotas: {
          total: alumno.cuotasMensuales.length,
          montoPagado: cuotasPagadas,
          montoPendiente: cuotasPendientes,
        },
        multas: {
          total: alumno.multas.length,
          montoPagado: multasPagadas,
          montoPendiente: multasPendientes,
        },
      },
      detalleCuotas: alumno.cuotasMensuales,
      detalleMultas: alumno.multas,
    };
  }
}

export const cuotaService = new CuotaService();
export default cuotaService;

