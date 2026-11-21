import { prisma } from "../config/database.js";
import { FECHA_REFERENCIA } from "../config/constants.js";
import { NotFoundError, ConflictError, BadRequestError } from "../utils/customErrors.js";
import { administracionService } from "./administracion.service.js";

/**
 * Capa de Servicio: Cobros y Pagos
 * Gestiona el registro de pagos completos o parciales, medios de pago,
 * referencias bancarias e impacto automático en la cancelación de sanciones.
 */
class PagoService {
  /**
   * Registra un nuevo cobro vinculado a una factura.
   */
  async registrarCobro({ idFactura, monto, fecha, medio, referencia }) {
    const idFacturaNum = Number(idFactura);
    const montoRedondeado = Math.round(Number(monto) * 100) / 100;
    if (montoRedondeado <= 0) {
      throw new BadRequestError("El importe del cobro debe ser mayor a cero.");
    }

    if (medio !== "efectivo" && (!referencia || !referencia.trim())) {
      throw new BadRequestError(
        "Se requiere la referencia o número de comprobante para cobros no realizados en efectivo."
      );
    }

    const referenciaLimpia = (referencia || "").trim() || null;
    const fechaPagoObj = new Date(`${fecha}T00:00:00.000Z`);

    // Ejecutar verificación de saldo, concurrencia y registro dentro de una transacción atómica
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Buscar la factura dentro de la transacción
      const factura = await tx.factura.findUnique({
        where: { idFactura: idFacturaNum },
        include: {
          detalles: {
            include: {
              multa: true,
            },
          },
          pagos: true,
          alumno: true,
          contrato: true,
        },
      });

      if (!factura) {
        throw new NotFoundError(`No se encontró ninguna factura con el ID: ${idFacturaNum}`);
      }

      if (factura.fechaCancelacion) {
        throw new ConflictError(`No se pueden registrar cobros sobre una factura cancelada (ID: ${idFacturaNum}).`);
      }

      // 2. Validar fecha respecto a emisión y fecha de referencia
      const fechaEmisionStr = factura.fechaEmision.toISOString().slice(0, 10);
      if (fecha < fechaEmisionStr || fecha > FECHA_REFERENCIA) {
        throw new BadRequestError(
          `La fecha de cobro debe encontrarse entre la emisión de la factura (${fechaEmisionStr}) y la fecha actual (${FECHA_REFERENCIA}).`
        );
      }

      // 3. Calcular montos, crédito y saldo actual dentro de la transacción
      const totalFactura = factura.detalles.reduce(
        (sum, d) => sum + Number(d.monto),
        0
      );
      const totalCobradoPrevio = factura.pagos.reduce(
        (sum, p) => sum + Number(p.monto),
        0
      );
      const creditoAplicado = Number(factura.creditoAplicado || 0);

      const saldoPendiente = Math.max(
        0,
        Math.round((totalFactura - totalCobradoPrevio - creditoAplicado) * 100) / 100
      );

      if (saldoPendiente <= 0) {
        throw new ConflictError(
          `La factura ID ${idFacturaNum} ya se encuentra totalmente saldada.`
        );
      }

      if (montoRedondeado > saldoPendiente) {
        throw new BadRequestError(
          `El importe ingresado ($${montoRedondeado}) supera el saldo pendiente de la factura ($${saldoPendiente}).`
        );
      }

      // 4. Crear el registro de Pago
      const nuevoPago = await tx.pago.create({
        data: {
          idAlumno: factura.idAlumno || factura.contrato?.idAlumno,
          idFactura: factura.idFactura,
          monto: montoRedondeado,
          fecha: fechaPagoObj,
          concepto: `Factura ${factura.idFactura} · ${factura.periodo}`,
          medio,
          referencia: referenciaLimpia,
        },
      });

      // 5. Evaluar si la factura queda totalmente saldada con este pago
      const nuevoSaldo = Math.max(
        0,
        Math.round((saldoPendiente - montoRedondeado) * 100) / 100
      );

      const saldadaCompletamente = nuevoSaldo === 0;

      // Si la factura quedó 100% saldada, cancelar las multas asociadas en sus renglones
      const multasActualizadas = [];
      if (saldadaCompletamente) {
        for (const detalle of factura.detalles) {
          if (detalle.idMulta) {
            const multaActualizada = await tx.multa.update({
              where: { idMulta: detalle.idMulta },
              data: {
                estadoMulta: "PAGADA",
                fechaPago: fechaPagoObj,
                montoPagado: detalle.monto,
              },
            });
            multasActualizadas.push(multaActualizada.idMulta);
          }
        }
      }

      return {
        pago: nuevoPago,
        factura: {
          idFactura: factura.idFactura,
          periodo: factura.periodo,
          titular: factura.titular,
          totalFacturado: Math.round(totalFactura * 100) / 100,
          totalCobrado: Math.round((totalCobradoPrevio + montoRedondeado) * 100) / 100,
          creditoAplicado,
          saldoRestante: nuevoSaldo,
          estado: saldadaCompletamente ? "pagada" : "parcial",
          multasCanceladas: multasActualizadas,
        },
      };
    });

    if (resultado?.pago?.idAlumno) {
      void administracionService.notificarAlumno(resultado.pago.idAlumno, {
        claveEvento: "pago_registrado",
        tipo: "info",
        titulo: "Cobro acreditado con éxito",
        detalle: `Se registró un cobro de $${resultado.pago.monto} para la factura #${resultado.factura.idFactura} (${resultado.factura.periodo}). Saldo restante: $${resultado.factura.saldoRestante}.`,
        destino: `/estudiante/facturas/${resultado.factura.idFactura}`,
      });
    }

    return resultado;
  }

  /**
   * Obtiene la lista paginada de cobros con filtros por alumno, factura o medio.
   */
  async getAll({ page = 1, limit = 10, idAlumno, idFactura, medio, search } = {}) {
    const skip = (page - 1) * limit;
    const where = {};

    if (idAlumno) where.idAlumno = idAlumno;
    if (idFactura) where.idFactura = idFactura;
    if (medio) where.medio = medio;

    if (search) {
      where.OR = [
        { concepto: { contains: search, mode: "insensitive" } },
        { referencia: { contains: search, mode: "insensitive" } },
        { alumno: { nombre: { contains: search, mode: "insensitive" } } },
        { alumno: { apellido: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, pagos] = await Promise.all([
      prisma.pago.count({ where }),
      prisma.pago.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ fecha: "desc" }, { idPago: "desc" }],
        include: {
          alumno: {
            select: {
              idAlumno: true,
              nombre: true,
              apellido: true,
              documento: true,
            },
          },
          factura: {
            select: {
              idFactura: true,
              periodo: true,
              titular: true,
              fechaVence: true,
            },
          },
        },
      }),
    ]);

    // Resumen de recaudación
    const recaudacionTotal = await prisma.pago.aggregate({
      where,
      _sum: { monto: true },
    });

    return {
      pagos,
      resumen: {
        totalCobros: total,
        montoTotalRecaudado: Number(recaudacionTotal._sum.monto) || 0,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Obtiene el detalle de un cobro por su ID.
   */
  async getById(id) {
    const pago = await prisma.pago.findUnique({
      where: { idPago: id },
      include: {
        alumno: true,
        factura: {
          include: {
            detalles: true,
          },
        },
      },
    });

    if (!pago) {
      throw new NotFoundError(`No se encontró ningún cobro con el ID: ${id}`);
    }

    return pago;
  }
}

export const pagoService = new PagoService();
export default pagoService;
