import { prisma } from "../config/database.js";
import { FECHA_REFERENCIA } from "../config/constants.js";
import { NotFoundError, ConflictError, BadRequestError } from "../utils/customErrors.js";
import { administracionService } from "./administracion.service.js";

/**
 * Capa de Servicio: Multas y Sanciones Económicas
 * Gestiona el ciclo de vida completo de sanciones disciplinarias, desglose de daños,
 * recargos por vencimiento, prórrogas y auditoría histórica de modificaciones.
 */
class MultaService {
  /**
   * Calcula el calendario estándar de cobro de una multa según el día del mes.
   * Emisiones posteriores al día 15 admiten abonar hasta la segunda factura siguiente.
   */
  #calendarioMulta(fechaStr = FECHA_REFERENCIA, diaVencimiento = 10) {
    const [anioStr, mesStr, diaStr] = fechaStr.split("-");
    const anio = parseInt(anioStr, 10);
    const mes = parseInt(mesStr, 10);
    const dia = parseInt(diaStr, 10);

    const plazo = dia > 15 ? 2 : 1;

    const periodo = (desplazamiento) => {
      const d = new Date(Date.UTC(anio, mes - 1 + desplazamiento, 1));
      return d.toISOString().slice(0, 7);
    };

    const periodoHasta = periodo(plazo);
    const [anioH, mesH] = periodoHasta.split("-").map(Number);
    const ultimoDia = new Date(Date.UTC(anioH, mesH, 0)).getUTCDate();
    const diaEfectivo = Math.min(ultimoDia, Math.max(1, diaVencimiento || 10));

    const fechaVenceStr = `${periodoHasta}-${String(diaEfectivo).padStart(2, "0")}`;

    return {
      periodoDesde: periodo(1),
      periodoHasta,
      fechaVence: new Date(`${fechaVenceStr}T23:59:59.000Z`),
    };
  }

  /**
   * Extiende la fecha de vencimiento un mes calendario.
   */
  #extenderMes(fechaDate) {
    const fechaStr = fechaDate.toISOString().slice(0, 10);
    const [anio, mes, dia] = fechaStr.split("-").map(Number);
    const ultimo = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
    const nuevoDia = Math.min(dia, ultimo);
    const nuevaFecha = new Date(Date.UTC(anio, mes, nuevoDia, 23, 59, 59));
    return nuevaFecha;
  }

  #obtenerDetalleActivo(multa) {
    if (!multa?.detallesFactura || !Array.isArray(multa.detallesFactura)) return null;
    return (
      multa.detallesFactura.find(
        (d) => d.factura && !d.factura.fechaCancelacion
      ) || null
    );
  }

  #obtenerFacturaActiva(multa) {
    const detalleActivo = this.#obtenerDetalleActivo(multa);
    return detalleActivo ? detalleActivo.factura : null;
  }

  /**
   * Computa los importes con recargo por mora y el estado de negocio de una multa.
   */
  #enriquecerMulta(multa, hoyStr = FECHA_REFERENCIA) {
    if (!multa) return null;

    const montoBase = Number(multa.monto);
    const recargoPct = Number(multa.recargoPorcentaje ?? 20);
    const estadoReal = (multa.estadoMulta || "PENDIENTE").toUpperCase();

    let recargo = 0;
    let total = montoBase;
    let estado = "pendiente";

    const fechaVenceStr = multa.fechaVence ? multa.fechaVence.toISOString().slice(0, 10) : "";
    const fechaComparacion = multa.fechaPago
      ? multa.fechaPago.toISOString().slice(0, 10)
      : hoyStr;

    if (estadoReal === "ANULADA") {
      estado = "anulada";
      total = 0;
    } else if (estadoReal === "PAGADA") {
      estado = "pagada";
      total = Number(multa.montoPagado) || montoBase;
      if (multa.fechaPago && fechaVenceStr && multa.fechaPago.toISOString().slice(0, 10) > fechaVenceStr) {
        recargo = Math.max(0, Math.round(total - montoBase));
      }
    } else {
      // Estado PENDIENTE
      if (fechaVenceStr && fechaComparacion > fechaVenceStr) {
        estado = "vencida";
        recargo = Math.round(montoBase * (recargoPct / 100) * 100) / 100;
        total = montoBase + recargo;
      } else {
        estado = "pendiente";
        total = montoBase;
      }
    }

    const detalleActivo = (multa.detallesFactura || []).find(
      (d) => d.factura && !d.factura.fechaCancelacion
    ) || null;

    return {
      ...multa,
      detalleFactura: detalleActivo,
      monto: montoBase,
      montoSancion: Number(multa.montoSancion ?? montoBase),
      montoDanios: Number(multa.montoDanios ?? 0),
      recargoPorcentaje: recargoPct,
      recargoCalculado: recargo,
      montoTotal: Math.round(total * 100) / 100,
      estado,
      estadoMulta: estadoReal,
      fechaEmision: multa.fechaEmision ? multa.fechaEmision.toISOString().slice(0, 10) : null,
      fechaVence: fechaVenceStr,
      fechaPago: multa.fechaPago ? multa.fechaPago.toISOString().slice(0, 10) : null,
    };
  }

  /**
   * Emite una o varias multas (lote de alumnos involucrados en un mismo hecho).
   */
  async emitir(data) {
    const {
      idAlumno,
      idAlumnos,
      tipo,
      motivo,
      observaciones,
      huboDanios,
      detalleDanios,
      montoSancion,
      montoDanios,
      recargoPorcentaje,
      fechaEmision,
      fechaVence,
      periodoDesde,
      periodoHasta,
    } = data;

    // 1. Obtener lista de IDs de alumnos únicos
    const alumnosIds = [
      ...new Set(
        Array.isArray(idAlumnos) && idAlumnos.length > 0
          ? idAlumnos
          : [idAlumno]
      ),
    ].filter(Boolean);

    if (alumnosIds.length === 0) {
      throw new BadRequestError("Debe seleccionar al menos un alumno para emitir la multa.");
    }

    // 2. Verificar existencia de los alumnos
    const alumnosExistentes = await prisma.alumno.findMany({
      where: { idAlumno: { in: alumnosIds } },
      include: {
        contratos: {
          where: { estado: "VIGENTE" },
          orderBy: { fechaDesde: "desc" },
          take: 1,
        },
      },
    });

    if (alumnosExistentes.length !== alumnosIds.length) {
      throw new NotFoundError("Uno o más de los alumnos seleccionados no existen en el sistema.");
    }

    // 3. Generar identificador de lote de emisión
    const idEmision = `E${Date.now()}`;
    const fechaEmisionDate = fechaEmision
      ? new Date(`${fechaEmision}T00:00:00.000Z`)
      : new Date(`${FECHA_REFERENCIA}T00:00:00.000Z`);

    const sancion = Number(montoSancion);
    const danios = huboDanios ? Number(montoDanios || 0) : 0;
    const montoBase = Math.round((sancion + danios) * 100) / 100;
    const recargo = Number(recargoPorcentaje ?? 20);

    // 4. Crear multas en transacción
    const multasCreadas = await prisma.$transaction(async (tx) => {
      const creadas = [];

      for (const alumno of alumnosExistentes) {
        const contratoActivo = alumno.contratos[0];
        const diaVenceContrato = contratoActivo?.diaVencimientoPago || 10;

        // Calcular fechas si no fueron provistas explícitamente
        const cal = this.#calendarioMulta(
          fechaEmision || FECHA_REFERENCIA,
          diaVenceContrato
        );

        const fechaVenceDate = fechaVence
          ? new Date(`${fechaVence}T23:59:59.000Z`)
          : cal.fechaVence;

        const pDesde = periodoDesde || cal.periodoDesde;
        const pHasta = periodoHasta || cal.periodoHasta;

        const nueva = await tx.multa.create({
          data: {
            idAlumno: alumno.idAlumno,
            idEmision,
            tipo,
            motivo: motivo.trim(),
            observaciones: observaciones?.trim() || null,
            huboDanios: Boolean(huboDanios),
            detalleDanios: huboDanios ? detalleDanios?.trim() || null : null,
            montoSancion: sancion,
            montoDanios: danios,
            recargoPorcentaje: recargo,
            monto: montoBase,
            fechaEmision: fechaEmisionDate,
            fechaVence: fechaVenceDate,
            periodoDesde: pDesde,
            periodoHasta: pHasta,
            estadoMulta: "PENDIENTE",
          },
          include: {
            alumno: true,
          },
        });

        creadas.push(nueva);
      }

      return creadas;
    });

    for (const m of multasCreadas) {
      if (m?.idAlumno) {
        void administracionService.notificarAlumno(m.idAlumno, {
          claveEvento: "multa_emitida",
          tipo: "sancion",
          titulo: `Nueva sanción aplicada: ${m.tipo.toUpperCase()}`,
          detalle: `Se emitió una multa por '${m.motivo}'. Monto: $${m.monto}. Vence el ${m.fechaVence ? m.fechaVence.toISOString().slice(0, 10) : ""}.`,
          destino: `/estudiante/multas/${m.idMulta}`,
        });
      }
    }

    return multasCreadas.map((m) => this.#enriquecerMulta(m));
  }

  /**
   * Obtiene la lista paginada de Multas con métricas financieras y detección de vencidas.
   */
  async getAll({ page = 1, limit = 10, idAlumno, estado, estadoMulta, tipo, search, soloVencidas } = {}) {
    const skip = (page - 1) * limit;
    const where = {};

    if (idAlumno) where.idAlumno = idAlumno;
    if (tipo) where.tipo = tipo;

    const filtroEstado = estado || estadoMulta;
    if (filtroEstado) {
      const normalizado = filtroEstado.toUpperCase();
      if (normalizado === "VENCIDA") {
        where.estadoMulta = "PENDIENTE";
        where.fechaVence = { lt: new Date(`${FECHA_REFERENCIA}T00:00:00.000Z`) };
      } else if (["PENDIENTE", "PAGADA", "ANULADA"].includes(normalizado)) {
        where.estadoMulta = normalizado;
      }
    }

    if (soloVencidas) {
      where.estadoMulta = "PENDIENTE";
      where.fechaVence = { lt: new Date(`${FECHA_REFERENCIA}T00:00:00.000Z`) };
    }

    if (search) {
      where.OR = [
        { motivo: { contains: search, mode: "insensitive" } },
        { observaciones: { contains: search, mode: "insensitive" } },
        { detalleDanios: { contains: search, mode: "insensitive" } },
        { alumno: { nombre: { contains: search, mode: "insensitive" } } },
        { alumno: { apellido: { contains: search, mode: "insensitive" } } },
        { alumno: { documento: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, multas, todasMultas] = await Promise.all([
      prisma.multa.count({ where }),
      prisma.multa.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ fechaEmision: "desc" }, { idMulta: "desc" }],
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
          detallesFactura: {
            include: {
              factura: {
                select: {
                  idFactura: true,
                  periodo: true,
                  fechaEmision: true,
                  fechaCancelacion: true,
                },
              },
            },
          },
          cambios: {
            orderBy: { fecha: "desc" },
          },
        },
      }),
      // Consultar sin paginación para métricas
      prisma.multa.findMany({
        where,
        select: {
          monto: true,
          estadoMulta: true,
          fechaVence: true,
          montoPagado: true,
          recargoPorcentaje: true,
        },
      }),
    ]);

    // Resumen financiero dinámico
    let totalRecaudado = 0;
    let totalPendiente = 0;
    let totalAnulado = 0;
    let totalVencido = 0;
    let conteoPendientes = 0;
    let conteoVencidas = 0;
    let conteoPagadas = 0;
    let conteoAnuladas = 0;

    const fechaRefDate = new Date(`${FECHA_REFERENCIA}T00:00:00.000Z`);

    for (const m of todasMultas) {
      const montoBase = Number(m.monto);
      const est = (m.estadoMulta || "PENDIENTE").toUpperCase();

      if (est === "PAGADA") {
        totalRecaudado += Number(m.montoPagado) || montoBase;
        conteoPagadas++;
      } else if (est === "ANULADA") {
        totalAnulado += montoBase;
        conteoAnuladas++;
      } else {
        // PENDIENTE
        if (m.fechaVence < fechaRefDate) {
          const recargo = Math.round(montoBase * (Number(m.recargoPorcentaje || 20) / 100) * 100) / 100;
          totalVencido += montoBase + recargo;
          totalPendiente += montoBase + recargo;
          conteoVencidas++;
        } else {
          totalPendiente += montoBase;
          conteoPendientes++;
        }
      }
    }

    return {
      multas: multas.map((m) => this.#enriquecerMulta(m)),
      resumen: {
        totalRegistros: total,
        totalRecaudado: Math.round(totalRecaudado * 100) / 100,
        totalPendiente: Math.round(totalPendiente * 100) / 100,
        totalVencido: Math.round(totalVencido * 100) / 100,
        totalAnulado: Math.round(totalAnulado * 100) / 100,
        conteoPorEstado: {
          pendiente: conteoPendientes,
          vencida: conteoVencidas,
          pagada: conteoPagadas,
          anulada: conteoAnuladas,
        },
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
   * Obtiene una multa por su ID con todo el detalle de historial de cambios y factura asociada.
   */
  async getById(id) {
    const multa = await prisma.multa.findUnique({
      where: { idMulta: id },
      include: {
        alumno: {
          include: {
            habitacionesAlumnos: {
              where: { fechaHasta: null },
              include: { habitacion: true },
            },
          },
        },
        detallesFactura: {
          include: {
            factura: true,
          },
        },
        cambios: {
          orderBy: { fecha: "desc" },
        },
      },
    });

    if (!multa) {
      throw new NotFoundError(`No se encontró ninguna multa con el ID: ${id}`);
    }

    return this.#enriquecerMulta(multa);
  }

  /**
   * Actualiza parcialmente una Multa registrando la auditoría de cambios en CambioMulta.
   */
  async update(id, data) {
    const multa = await prisma.multa.findUnique({
      where: { idMulta: id },
      include: {
        detallesFactura: {
          include: {
            factura: {
              include: {
                detalles: true,
                pagos: true,
              },
            },
          },
        },
      },
    });

    if (!multa) {
      throw new NotFoundError(`No se encontró ninguna multa con el ID: ${id}`);
    }

    if (multa.estadoMulta !== "PENDIENTE") {
      throw new ConflictError(
        `No se puede editar una multa que ya se encuentra ${multa.estadoMulta.toLowerCase()}.`
      );
    }

    const { motivoCambio, ...camposNuevos } = data;

    // Calcular montos si cambiaron
    let montoSancion = camposNuevos.montoSancion !== undefined
      ? Number(camposNuevos.montoSancion)
      : Number(multa.montoSancion);

    let huboDanios = camposNuevos.huboDanios !== undefined
      ? Boolean(camposNuevos.huboDanios)
      : multa.huboDanios;

    let montoDanios = huboDanios
      ? (camposNuevos.montoDanios !== undefined ? Number(camposNuevos.montoDanios) : Number(multa.montoDanios))
      : 0;

    const montoTotal = Math.round((montoSancion + montoDanios) * 100) / 100;

    // Si la multa está en una factura activa, verificar coherencia de saldos y cobros
    const detalleActivo = this.#obtenerDetalleActivo(multa);
    let debeSaldar = false;
    let fechaUltimoCobro = null;

    if (detalleActivo) {
      const factura = detalleActivo.factura;
      const totalOtros = factura.detalles
        .filter((d) => d.idDetalle !== detalleActivo.idDetalle)
        .reduce((sum, d) => sum + Number(d.monto), 0);
      const nuevoTotalFactura = Math.round((totalOtros + montoTotal) * 100) / 100;
      const totalCobrado = factura.pagos.reduce((sum, p) => sum + Number(p.monto), 0);

      if (nuevoTotalFactura < totalCobrado) {
        throw new ConflictError(
          `El total actualizado de la factura ($${nuevoTotalFactura}) no puede quedar por debajo del importe ya cobrado ($${totalCobrado}).`
        );
      }

      if (nuevoTotalFactura === totalCobrado && totalCobrado > 0) {
        debeSaldar = true;
        fechaUltimoCobro = factura.pagos.reduce(
          (max, p) => (p.fecha > max ? p.fecha : max),
          factura.fechaEmision
        );
      }
    }

    let fechaVenceDate = multa.fechaVence;
    if (camposNuevos.fechaVence) {
      fechaVenceDate = new Date(`${camposNuevos.fechaVence}T23:59:59.000Z`);
    }

    // Identificar diferencias para el historial de auditoría
    const camposMapeados = [
      { key: "tipo", nombre: "Tipo de multa", ant: multa.tipo, neu: camposNuevos.tipo ?? multa.tipo },
      { key: "motivo", nombre: "Motivo", ant: multa.motivo, neu: camposNuevos.motivo ?? multa.motivo },
      { key: "observaciones", nombre: "Observaciones", ant: multa.observaciones || "Sin registrar", neu: camposNuevos.observaciones ?? multa.observaciones ?? "Sin registrar" },
      { key: "huboDanios", nombre: "Daños registrados", ant: multa.huboDanios ? "Sí" : "No", neu: huboDanios ? "Sí" : "No" },
      { key: "detalleDanios", nombre: "Detalle de daños", ant: multa.detalleDanios || "Sin registrar", neu: huboDanios ? (camposNuevos.detalleDanios ?? multa.detalleDanios ?? "") : "Sin registrar" },
      { key: "montoSancion", nombre: "Importe de sanción (ARS)", ant: String(multa.montoSancion), neu: String(montoSancion) },
      { key: "montoDanios", nombre: "Importe de daños (ARS)", ant: String(multa.montoDanios), neu: String(montoDanios) },
      { key: "monto", nombre: "Total base (ARS)", ant: String(multa.monto), neu: String(montoTotal) },
      { key: "fechaVence", nombre: "Vencimiento", ant: multa.fechaVence.toISOString().slice(0, 10), neu: fechaVenceDate.toISOString().slice(0, 10) },
      { key: "periodoHasta", nombre: "Último período sin recargo", ant: multa.periodoHasta, neu: camposNuevos.periodoHasta ?? multa.periodoHasta },
    ];

    const diferencias = camposMapeados
      .filter((c) => String(c.ant) !== String(c.neu))
      .map((c) => ({ campo: c.nombre, anterior: String(c.ant), nuevo: String(c.neu) }));

    const multaActualizada = await prisma.$transaction(async (tx) => {
      // Si está en factura activa, actualizar el importe del renglón
      if (detalleActivo) {
        await tx.detalleFactura.update({
          where: { idDetalle: detalleActivo.idDetalle },
          data: { monto: montoTotal },
        });
      }

      // Si hubo cambios, insertar registro de auditoría en CambioMulta
      if (diferencias.length > 0) {
        await tx.cambioMulta.create({
          data: {
            idMulta: id,
            accion: "edicion",
            motivo: motivoCambio?.trim() || "Modificación de datos de sanción",
            cambios: diferencias,
          },
        });
      }

      return await tx.multa.update({
        where: { idMulta: id },
        data: {
          ...(camposNuevos.tipo ? { tipo: camposNuevos.tipo } : {}),
          ...(camposNuevos.motivo ? { motivo: camposNuevos.motivo.trim() } : {}),
          ...(camposNuevos.observaciones !== undefined ? { observaciones: camposNuevos.observaciones?.trim() || null } : {}),
          huboDanios,
          detalleDanios: huboDanios ? (camposNuevos.detalleDanios?.trim() || multa.detalleDanios) : null,
          montoSancion,
          montoDanios,
          monto: montoTotal,
          fechaVence: fechaVenceDate,
          ...(camposNuevos.periodoHasta !== undefined ? { periodoHasta: camposNuevos.periodoHasta } : {}),
          ...(debeSaldar ? { estadoMulta: "PAGADA", fechaPago: fechaUltimoCobro, montoPagado: montoTotal } : {}),
        },
        include: {
          alumno: true,
          detallesFactura: {
            include: { factura: true },
          },
          cambios: { orderBy: { fecha: "desc" } },
        },
      });
    });

    return this.#enriquecerMulta(multaActualizada);
  }

  /**
   * Extiende el plazo de vencimiento de una multa (prórroga).
   */
  async prorrogar(id, { motivo, dias, nuevaFechaVence }) {
    const multa = await prisma.multa.findUnique({
      where: { idMulta: id },
      include: {
        detallesFactura: {
          include: { factura: true },
        },
      },
    });

    if (!multa) {
      throw new NotFoundError(`No se encontró ninguna multa con el ID: ${id}`);
    }

    if (this.#obtenerFacturaActiva(multa)) {
      throw new ConflictError("La multa ya está incluida en una factura activa y no admite prórrogas.");
    }

    if (multa.estadoMulta !== "PENDIENTE") {
      throw new ConflictError("Solo se pueden prorrogar multas en estado pendiente.");
    }

    const fechaAnteriorStr = multa.fechaVence.toISOString().slice(0, 10);
    let fechaNueva;

    if (nuevaFechaVence) {
      fechaNueva = new Date(`${nuevaFechaVence}T23:59:59.000Z`);
    } else if (dias) {
      fechaNueva = new Date(multa.fechaVence.getTime() + dias * 24 * 60 * 60 * 1000);
    } else {
      // Extensión de un mes por defecto
      fechaNueva = this.#extenderMes(multa.fechaVence);
    }

    const fechaNuevaStr = fechaNueva.toISOString().slice(0, 10);
    const nuevoPeriodoHasta = fechaNuevaStr.slice(0, 7);

    const diferencias = [
      { campo: "Vencimiento", anterior: fechaAnteriorStr, nuevo: fechaNuevaStr },
      { campo: "Último período sin recargo", anterior: multa.periodoHasta || "", nuevo: nuevoPeriodoHasta },
    ];

    const multaProrrogada = await prisma.$transaction(async (tx) => {
      await tx.cambioMulta.create({
        data: {
          idMulta: id,
          accion: "prorroga",
          motivo: motivo.trim(),
          cambios: diferencias,
        },
      });

      return await tx.multa.update({
        where: { idMulta: id },
        data: {
          fechaVence: fechaNueva,
          periodoHasta: nuevoPeriodoHasta,
        },
        include: {
          alumno: true,
          cambios: { orderBy: { fecha: "desc" } },
        },
      });
    });

    if (multaProrrogada?.idAlumno) {
      void administracionService.notificarAlumno(multaProrrogada.idAlumno, {
        claveEvento: "multa_prorrogada",
        tipo: "info",
        titulo: "Prórroga de multa concedida",
        detalle: `Se aplazó el vencimiento de la multa #${multaProrrogada.idMulta} hasta el ${fechaNuevaStr}. Motivo: ${motivo.trim()}.`,
        destino: `/estudiante/multas/${multaProrrogada.idMulta}`,
      });
    }

    return this.#enriquecerMulta(multaProrrogada);
  }

  /**
   * Anula una multa que no haya sido cobrada.
   */
  async anular(id, { motivo } = {}) {
    const multa = await prisma.multa.findUnique({
      where: { idMulta: id },
      include: {
        detallesFactura: {
          include: {
            factura: {
              include: { pagos: true },
            },
          },
        },
      },
    });

    if (!multa) {
      throw new NotFoundError(`No se encontró ninguna multa con el ID: ${id}`);
    }

    if (multa.estadoMulta === "PAGADA") {
      throw new ConflictError("No se puede anular una multa que ya se encuentra pagada.");
    }

    const facturaActiva = this.#obtenerFacturaActiva(multa);
    if (facturaActiva?.pagos?.length > 0) {
      throw new ConflictError("No se puede anular una multa cuya factura ya registra pagos.");
    }

    const motivoFinal = motivo?.trim() || "Anulación de multa";

    const multaAnulada = await prisma.$transaction(async (tx) => {
      await tx.cambioMulta.create({
        data: {
          idMulta: id,
          accion: "edicion",
          motivo: motivoFinal,
          cambios: [
            { campo: "Estado", anterior: multa.estadoMulta, nuevo: "ANULADA" },
          ],
        },
      });

      return await tx.multa.update({
        where: { idMulta: id },
        data: {
          estadoMulta: "ANULADA",
        },
        include: {
          alumno: true,
          cambios: { orderBy: { fecha: "desc" } },
        },
      });
    });

    if (multaAnulada?.idAlumno) {
      void administracionService.notificarAlumno(multaAnulada.idAlumno, {
        claveEvento: "multa_anulada",
        tipo: "info",
        titulo: "Multa anulada",
        detalle: `La multa #${multaAnulada.idMulta} ha sido anulada. Motivo: ${motivoFinal}.`,
        destino: `/estudiante/multas/${multaAnulada.idMulta}`,
      });
    }

    return this.#enriquecerMulta(multaAnulada);
  }

  /**
   * Registra el pago directo de una Multa.
   */
  async registrarPago(id, { fecha, monto } = {}) {
    const multa = await prisma.multa.findUnique({
      where: { idMulta: id },
    });

    if (!multa) {
      throw new NotFoundError(`No se encontró ninguna multa con el ID: ${id}`);
    }

    if (multa.estadoMulta === "PAGADA") {
      throw new ConflictError(`La multa con ID ${id} ya se encuentra registrada como PAGADA.`);
    }

    const fechaPagoObj = fecha
      ? new Date(`${fecha}T00:00:00.000Z`)
      : new Date(`${FECHA_REFERENCIA}T00:00:00.000Z`);

    const montoEfectivo = monto !== undefined ? Number(monto) : Number(multa.monto);

    const multaPagada = await prisma.multa.update({
      where: { idMulta: id },
      data: {
        estadoMulta: "PAGADA",
        fechaPago: fechaPagoObj,
        montoPagado: montoEfectivo,
      },
      include: {
        alumno: true,
        cambios: true,
      },
    });

    return this.#enriquecerMulta(multaPagada);
  }

  /**
   * Elimina una multa por su ID (si no está facturada ni pagada).
   */
  async delete(id) {
    const multa = await prisma.multa.findUnique({
      where: { idMulta: id },
      include: {
        detallesFactura: {
          include: { factura: true },
        },
      },
    });

    if (!multa) {
      throw new NotFoundError(`No se encontró ninguna multa con el ID: ${id}`);
    }

    if (this.#obtenerFacturaActiva(multa)) {
      throw new ConflictError("No se puede eliminar una multa que ya está incluida en una factura activa.");
    }

    if (multa.estadoMulta === "PAGADA") {
      throw new ConflictError("No se puede eliminar una multa pagada.");
    }

    return await prisma.multa.delete({
      where: { idMulta: id },
    });
  }
}

export const multaService = new MultaService();
export default multaService;
