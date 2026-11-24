import { prisma } from "../config/database.js";
import { FECHA_REFERENCIA } from "../config/constants.js";
import { NotFoundError, ConflictError, BadRequestError } from "../utils/customErrors.js";
import { administracionService } from "./administracion.service.js";

/**
 * Capa de Servicio: Facturación
 * Implementa la emisión, cálculo de vencimientos, auditoría de renglones
 * y estados de facturación mensual y sanciones asociadas.
 */
class FacturaService {
  /**
   * Determina la fecha de fin de estadía efectiva de un contrato.
   */
  #finEstadia(contrato) {
    if (contrato.fechaCancelacion) {
      return contrato.fechaCancelacion.toISOString().slice(0, 10);
    }
    return contrato.fechaHasta.toISOString().slice(0, 10);
  }

  /**
   * Valida si a un contrato le corresponde emitir cuota para un período dado.
   */
  #correspondeCuota(contrato, periodo) {
    const inicioContrato = contrato.fechaDesde.toISOString().slice(0, 10);
    const finContrato = this.#finEstadia(contrato);

    return (
      inicioContrato.slice(0, 7) <= periodo &&
      finContrato.slice(0, 7) >= periodo
    );
  }

  /**
   * Calcula la fecha de vencimiento según el día pactado en el contrato y el período.
   */
  #calcularFechaVence(periodo, diaPactado = 10) {
    const [anioStr, mesStr] = periodo.split("-");
    const anio = parseInt(anioStr, 10);
    const mes = parseInt(mesStr, 10);

    // Obtener el último día del mes
    const ultimoDiaMes = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
    const diaVence = Math.min(ultimoDiaMes, Math.max(1, diaPactado || 10));

    return new Date(Date.UTC(anio, mes - 1, diaVence, 23, 59, 59));
  }

  /**
   * Computa los montos dinámicos y el estado de la factura.
   */
  #enriquecerFactura(factura, fechaRefStr = FECHA_REFERENCIA) {
    const totalFacturado = factura.detalles
      ? factura.detalles.reduce((sum, d) => sum + Number(d.monto), 0)
      : 0;
    const totalCobrado = factura.pagos
      ? factura.pagos.reduce((sum, p) => sum + Number(p.monto), 0)
      : 0;
    const creditoAplicado = Number(factura.creditoAplicado || 0);

    const saldoPendiente = factura.fechaCancelacion
      ? 0
      : Math.max(
          0,
          Math.round((totalFacturado - totalCobrado - creditoAplicado) * 100) / 100
        );

    let estado = "pendiente";
    if (factura.fechaCancelacion) {
      estado = "cancelada";
    } else if (saldoPendiente === 0) {
      estado = "pagada";
    } else {
      const fechaVenceStr = factura.fechaVence.toISOString().slice(0, 10);
      if (fechaVenceStr < fechaRefStr) {
        estado = "vencida";
      } else if (totalCobrado > 0 || creditoAplicado > 0) {
        estado = "parcial";
      }
    }

    return {
      ...factura,
      totalFacturado: Math.round(totalFacturado * 100) / 100,
      totalCobrado: Math.round(totalCobrado * 100) / 100,
      creditoAplicado,
      saldoPendiente,
      estado,
    };
  }

  /**
   * Emite una factura individual para un contrato en un período mensual.
   */
  async generarFactura({ idContrato, periodo }) {
    // 1. Obtener contrato y verificar existencia
    const contrato = await prisma.contrato.findUnique({
      where: { idContrato },
      include: {
        alumno: true,
      },
    });

    if (!contrato) {
      throw new NotFoundError(`No se encontró el contrato con ID: ${idContrato}`);
    }

    // 2. Verificar que el período no esté en el futuro respecto a la fecha del sistema
    if (periodo > FECHA_REFERENCIA.slice(0, 7)) {
      throw new BadRequestError("No se pueden emitir facturas para períodos futuros.");
    }

    // 3. Verificar si el período corresponde a la estadía
    if (!this.#correspondeCuota(contrato, periodo)) {
      throw new BadRequestError(
        `El período ${periodo} no corresponde a la estadía del contrato (${contrato.fechaDesde.toISOString().slice(0, 7)} a ${this.#finEstadia(contrato).slice(0, 7)})`
      );
    }

    // 4. Verificar duplicidad de factura para este contrato y período
    const facturaExistente = await prisma.factura.findFirst({
      where: {
        idContrato,
        periodo,
      },
    });

    if (facturaExistente) {
      throw new ConflictError(
        `Ya existe una factura emitida para el contrato ${idContrato} en el período ${periodo} (Factura ID ${facturaExistente.idFactura})`
      );
    }

    // 5. Validar monto mensual del contrato
    const montoMensual = Number(contrato.montoMensual);
    if (!Number.isFinite(montoMensual) || montoMensual <= 0) {
      throw new BadRequestError("El contrato no cuenta con un importe mensual válido.");
    }

    // 6. Obtener multas pendientes habilitadas para incluir (que no estén en facturas activas)
    const fechaRefDate = new Date(`${FECHA_REFERENCIA}T23:59:59.999Z`);
    const multasCandidatas = await prisma.multa.findMany({
      where: {
        idAlumno: contrato.idAlumno,
        estadoMulta: "PENDIENTE",
        fechaEmision: { lte: fechaRefDate },
        detallesFactura: {
          none: {
            factura: {
              fechaCancelacion: null,
            },
          },
        },
      },
      orderBy: { fechaEmision: "asc" },
    });

    // Filtrar aquellas cuyo período sea <= periodo facturado
    const multasAIncluir = multasCandidatas.filter((m) => {
      const periodoMulta = m.periodoDesde || m.fechaEmision.toISOString().slice(0, 7);
      return periodoMulta <= periodo;
    });

    // 7. Calcular fecha de vencimiento y fecha de emisión (primer día del período)
    const fechaVence = this.#calcularFechaVence(periodo, contrato.diaVencimientoPago);
    const fechaEmision = new Date(`${periodo}-01T00:00:00.000Z`);

    // 8. Crear factura y renglones en una transacción
    const nuevaFactura = await prisma.$transaction(async (tx) => {
      const factura = await tx.factura.create({
        data: {
          idContrato,
          idAlumno: contrato.idAlumno,
          periodo,
          fechaEmision,
          fechaVence,
          titular: `${contrato.alumno.apellido}, ${contrato.alumno.nombre}`,
          documento: contrato.alumno.documento,
        },
      });

      // Renglón 1: Alojamiento mensual
      await tx.detalleFactura.create({
        data: {
          idFactura: factura.idFactura,
          concepto: `Alojamiento mensual · ${periodo}`,
          monto: montoMensual,
          orden: 1,
        },
      });

      // Renglones 2..N: Multas pendientes
      for (let i = 0; i < multasAIncluir.length; i++) {
        const m = multasAIncluir[i];
        const montoMulta = Number(m.monto);
        const tieneRecargo = Number(m.recargoPorcentaje) > 0;
        const textoRecargo = tieneRecargo ? ` (incluye recargo del ${m.recargoPorcentaje}%)` : "";

        await tx.detalleFactura.create({
          data: {
            idFactura: factura.idFactura,
            idMulta: m.idMulta,
            concepto: `Multa M${m.idMulta} · ${m.motivo || "Sanción de residencia"}${textoRecargo}`,
            monto: montoMulta,
            orden: i + 2,
          },
        });
      }

      return await tx.factura.findUnique({
        where: { idFactura: factura.idFactura },
        include: {
          detalles: { orderBy: { orden: "asc" } },
          pagos: true,
          contrato: true,
          alumno: true,
        },
      });
    });

    if (nuevaFactura?.idAlumno) {
      void administracionService.notificarAlumno(nuevaFactura.idAlumno, {
        claveEvento: "factura_emitida",
        tipo: "vencimiento",
        titulo: `Nueva factura emitida · Período ${periodo}`,
        detalle: `Se generó la factura #${nuevaFactura.idFactura}. Vence el ${nuevaFactura.fechaVence ? nuevaFactura.fechaVence.toISOString().slice(0, 10) : ""}.`,
        destino: `/estudiante/facturas/${nuevaFactura.idFactura}`,
      });
    }

    return this.#enriquecerFactura(nuevaFactura);
  }

  /**
   * Generación masiva de facturas para todos los contratos vigentes de un período.
   */
  async generarFacturasMes({ periodo }) {
    if (periodo > FECHA_REFERENCIA.slice(0, 7)) {
      throw new BadRequestError("No se pueden emitir facturas para períodos futuros.");
    }

    // Buscar contratos activos
    const contratos = await prisma.contrato.findMany({
      include: { alumno: true },
      orderBy: { idContrato: "asc" },
    });

    const contratosElegibles = contratos.filter((c) => this.#correspondeCuota(c, periodo));

    const facturasGeneradas = [];
    const facturasOmitidas = [];
    const errores = [];

    for (const contrato of contratosElegibles) {
      try {
        const yaExiste = await prisma.factura.findFirst({
          where: {
            idContrato: contrato.idContrato,
            periodo,
          },
        });

        if (yaExiste) {
          facturasOmitidas.push({
            idContrato: contrato.idContrato,
            idFactura: yaExiste.idFactura,
            alumno: `${contrato.alumno.apellido}, ${contrato.alumno.nombre}`,
            motivo: "Ya facturado previamente",
          });
          continue;
        }

        const factura = await this.generarFactura({
          idContrato: contrato.idContrato,
          periodo,
        });

        facturasGeneradas.push({
          idFactura: factura.idFactura,
          idContrato: contrato.idContrato,
          alumno: factura.titular,
          periodo: factura.periodo,
          total: factura.totalFacturado,
          vence: factura.fechaVence.toISOString().slice(0, 10),
        });
      } catch (err) {
        errores.push({
          idContrato: contrato.idContrato,
          error: err.message,
        });
      }
    }

    return {
      periodo,
      totalProcesados: contratosElegibles.length,
      totalGenerados: facturasGeneradas.length,
      totalOmitidos: facturasOmitidas.length,
      facturasGeneradas,
      facturasOmitidas,
      errores,
    };
  }

  /**
   * Obtiene la lista paginada de facturas con filtros, montos y estado dinámico.
   */
  async getAll({ page = 1, limit = 10, periodo, idContrato, idAlumno, estado, search } = {}) {
    const where = {};

    if (periodo) where.periodo = periodo;
    if (idContrato) where.idContrato = idContrato;
    if (idAlumno) where.idAlumno = idAlumno;

    if (search) {
      where.OR = [
        { titular: { contains: search, mode: "insensitive" } },
        { documento: { contains: search, mode: "insensitive" } },
      ];
    }

    // Traer facturas con detalles y pagos para calcular saldos y estados
    const [todasFacturas, totalSinFiltrarEstado] = await Promise.all([
      prisma.factura.findMany({
        where,
        orderBy: [{ fechaEmision: "desc" }, { idFactura: "desc" }],
        include: {
          detalles: { orderBy: { orden: "asc" } },
          pagos: true,
          contrato: true,
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
      }),
      prisma.factura.count({ where }),
    ]);

    // Enriquecer todas las facturas con totales, saldos y estados
    const enriquecidas = todasFacturas.map((f) => this.#enriquecerFactura(f));

    // Filtrar por estado dinámico si fue solicitado
    const filtradas = estado
      ? enriquecidas.filter((f) => f.estado === estado)
      : enriquecidas;

    // Calcular métricas globales
    const resumen = {
      totalFacturas: filtradas.length,
      montoTotalFacturado: Math.round(filtradas.reduce((acc, f) => acc + f.totalFacturado, 0) * 100) / 100,
      montoTotalCobrado: Math.round(filtradas.reduce((acc, f) => acc + f.totalCobrado, 0) * 100) / 100,
      montoTotalPendiente: Math.round(filtradas.reduce((acc, f) => acc + f.saldoPendiente, 0) * 100) / 100,
      conteoPorEstado: {
        pagada: enriquecidas.filter((f) => f.estado === "pagada").length,
        parcial: enriquecidas.filter((f) => f.estado === "parcial").length,
        vencida: enriquecidas.filter((f) => f.estado === "vencida").length,
        pendiente: enriquecidas.filter((f) => f.estado === "pendiente").length,
        cancelada: enriquecidas.filter((f) => f.estado === "cancelada").length,
      },
    };

    // Paginación en memoria sobre el conjunto enriquecido
    const skip = (page - 1) * limit;
    const paginadas = filtradas.slice(skip, skip + limit);

    return {
      facturas: paginadas,
      resumen,
      pagination: {
        total: filtradas.length,
        page,
        limit,
        totalPages: Math.ceil(filtradas.length / limit) || 1,
      },
    };
  }

  /**
   * Obtiene una factura por su ID con todo el detalle de renglones y cobros registrados.
   */
  async getById(id) {
    const factura = await prisma.factura.findUnique({
      where: { idFactura: id },
      include: {
        detalles: {
          orderBy: { orden: "asc" },
          include: {
            multa: true,
          },
        },
        pagos: {
          orderBy: { fecha: "desc" },
        },
        contrato: true,
        alumno: true,
      },
    });

    if (!factura) {
      throw new NotFoundError(`No se encontró ninguna factura con el ID: ${id}`);
    }

    return this.#enriquecerFactura(factura);
  }

  /**
   * Elimina una factura si no tiene cobros o pagos asociados.
   */
  async delete(id) {
    const factura = await prisma.factura.findUnique({
      where: { idFactura: id },
      include: { pagos: true },
    });

    if (!factura) {
      throw new NotFoundError(`No se encontró ninguna factura con el ID: ${id}`);
    }

    if (factura.pagos.length > 0) {
      throw new ConflictError(
        `No se puede eliminar la factura ID ${id} porque ya registra ${factura.pagos.length} cobro(s) asociado(s).`
      );
    }

    return await prisma.factura.delete({
      where: { idFactura: id },
    });
  }

  /**
   * Cancela una factura existente registrando la fecha y motivo de cancelación,
   * liberando las multas asociadas para futuras facturas y conservando los cobros registrados como crédito.
   */
  async cancelarFactura(id, { motivo } = {}) {
    const idFactura = Number(id);
    const factura = await prisma.factura.findUnique({
      where: { idFactura },
      include: {
        pagos: true,
        detalles: true,
      },
    });

    if (!factura) {
      throw new NotFoundError(`No se encontró ninguna factura con el ID: ${idFactura}`);
    }

    if (factura.fechaCancelacion) {
      throw new ConflictError(`La factura ID ${idFactura} ya se encuentra cancelada.`);
    }

    const facturaCancelada = await prisma.factura.update({
      where: { idFactura },
      data: {
        fechaCancelacion: new Date(FECHA_REFERENCIA),
        motivoCancelacion: motivo?.trim() || "Cancelada administrativamente",
      },
      include: {
        detalles: {
          include: { multa: true },
          orderBy: { orden: "asc" },
        },
        pagos: true,
        contrato: true,
        alumno: true,
      },
    });

    if (facturaCancelada?.idAlumno) {
      void administracionService.notificarAlumno(facturaCancelada.idAlumno, {
        claveEvento: "factura_cancelada",
        tipo: "info",
        titulo: `Factura cancelada · Período ${facturaCancelada.periodo}`,
        detalle: `La factura #${facturaCancelada.idFactura} fue cancelada. Motivo: ${facturaCancelada.motivoCancelacion || "Cancelada por administración"}.`,
        destino: `/estudiante/facturas/${facturaCancelada.idFactura}`,
      });
    }

    return this.#enriquecerFactura(facturaCancelada);
  }

  /**
   * Emite una factura de reemplazo aplicando el crédito cobrado de una factura cancelada previa.
   */
  async emitirReemplazo({ idFacturaOrigen, idContrato, periodo, concepto, monto, fechaVence }) {
    const origen = await prisma.factura.findUnique({
      where: { idFactura: Number(idFacturaOrigen) },
      include: {
        pagos: true,
        reemplazos: true,
      },
    });

    if (!origen) {
      throw new NotFoundError(`No se encontró la factura de origen con ID: ${idFacturaOrigen}`);
    }

    if (!origen.fechaCancelacion) {
      throw new BadRequestError("La factura de origen debe encontrarse cancelada para poder emitir un reemplazo.");
    }

    if (origen.reemplazos.length > 0) {
      throw new ConflictError("Esta factura de origen ya cuenta con un reemplazo emitido.");
    }

    const contrato = await prisma.contrato.findUnique({
      where: { idContrato: Number(idContrato) },
      include: { alumno: true },
    });

    if (!contrato) {
      throw new NotFoundError(`No se encontró el contrato con ID: ${idContrato}`);
    }

    if (!this.#correspondeCuota(contrato, periodo)) {
      throw new BadRequestError("El período debe corresponder a la estadía del contrato.");
    }

    // Calcular crédito acumulado de la factura origen
    const creditoAplicado = origen.pagos.reduce((sum, p) => sum + Number(p.monto), 0);

    if (creditoAplicado > 0 && origen.idAlumno && origen.idAlumno !== contrato.idAlumno) {
      throw new BadRequestError("El crédito de la factura original solo puede aplicarse al mismo titular.");
    }

    const montoRenglon = Math.round(Number(monto) * 100) / 100;
    if (montoRenglon <= 0) {
      throw new BadRequestError("El importe debe ser un número positivo.");
    }

    // Multas candidatas que no estén en facturas activas
    const fechaRefDate = new Date(`${FECHA_REFERENCIA}T23:59:59.999Z`);
    const multasCandidatas = await prisma.multa.findMany({
      where: {
        idAlumno: contrato.idAlumno,
        estadoMulta: "PENDIENTE",
        fechaEmision: { lte: fechaRefDate },
        detallesFactura: {
          none: {
            factura: {
              fechaCancelacion: null,
            },
          },
        },
      },
      orderBy: { fechaEmision: "asc" },
    });

    const multasAIncluir = multasCandidatas.filter((m) => {
      const periodoMulta = m.periodoDesde || m.fechaEmision.toISOString().slice(0, 7);
      return periodoMulta <= periodo;
    });

    const totalMultas = multasAIncluir.reduce((sum, m) => sum + Number(m.monto), 0);
    const totalNuevaFactura = Math.round((montoRenglon + totalMultas) * 100) / 100;

    if (totalNuevaFactura < creditoAplicado) {
      throw new BadRequestError("El total de la nueva factura no puede ser menor al crédito disponible.");
    }

    const fechaVenceObj = new Date(`${fechaVence}T23:59:59.000Z`);

    return await prisma.$transaction(async (tx) => {
      const nuevaFactura = await tx.factura.create({
        data: {
          idContrato: contrato.idContrato,
          idAlumno: contrato.idAlumno,
          periodo,
          fechaEmision: new Date(`${FECHA_REFERENCIA}T00:00:00.000Z`),
          fechaVence: fechaVenceObj,
          titular: `${contrato.alumno.apellido}, ${contrato.alumno.nombre}`,
          documento: contrato.alumno.documento,
          idFacturaOrigen: origen.idFactura,
          creditoAplicado,
        },
      });

      // Renglón principal
      await tx.detalleFactura.create({
        data: {
          idFactura: nuevaFactura.idFactura,
          concepto: concepto.trim(),
          monto: montoRenglon,
          orden: 1,
        },
      });

      // Renglones de multas
      let ordenRenglon = 2;
      for (const multa of multasAIncluir) {
        await tx.detalleFactura.create({
          data: {
            idFactura: nuevaFactura.idFactura,
            idMulta: multa.idMulta,
            concepto: `Sanción · ${multa.motivo}`,
            monto: Number(multa.monto),
            orden: ordenRenglon++,
          },
        });
      }

      // Si el nuevo total queda 100% cubierto por el crédito aplicado
      if (totalNuevaFactura === creditoAplicado) {
        for (const multa of multasAIncluir) {
          await tx.multa.update({
            where: { idMulta: multa.idMulta },
            data: {
              estadoMulta: "PAGADA",
              fechaPago: new Date(`${FECHA_REFERENCIA}T00:00:00.000Z`),
              montoPagado: Number(multa.monto),
            },
          });
        }
      }

      const completa = await tx.factura.findUnique({
        where: { idFactura: nuevaFactura.idFactura },
        include: {
          detalles: {
            orderBy: { orden: "asc" },
            include: { multa: true },
          },
          pagos: true,
          contrato: true,
          alumno: true,
        },
      });

      if (completa?.idAlumno) {
        void administracionService.notificarAlumno(completa.idAlumno, {
          claveEvento: "factura_reemplazo",
          tipo: "vencimiento",
          titulo: `Nueva factura de reemplazo emitida · Período ${periodo}`,
          detalle: `Se emitió la factura #${completa.idFactura} en reemplazo de la #${idFacturaOrigen}. Crédito aplicado: $${creditoAplicado}.`,
          destino: `/estudiante/facturas/${completa.idFactura}`,
        });
      }

      return this.#enriquecerFactura(completa);
    });
  }
}

export const facturaService = new FacturaService();
export default facturaService;
