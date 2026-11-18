import { FECHA_REFERENCIA } from "./config";
import { finEstadia } from "./domain";
import { esFechaISO } from "./gestiones";
import { importeMulta } from "./multas";
import type { Contrato, DataState, Factura, Multa, Pago, ReemplazoFacturaInput, RegistrarCobroInput } from "./types";

export function periodoValido(periodo: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(periodo) && periodo >= "1900-01" && periodo <= FECHA_REFERENCIA.slice(0, 7);
}

/** Cada mes con al menos un día de estadía genera una cuota completa. */
export function correspondeCuota(contrato: Contrato, periodo: string): boolean {
  return periodoValido(periodo) && contrato.fechaDesde <= finEstadia(contrato) &&
    contrato.fechaDesde.slice(0, 7) <= periodo && finEstadia(contrato).slice(0, 7) >= periodo;
}

export function totalFactura(factura: Factura): number {
  return Math.round(factura.detalles.reduce((suma, detalle) => suma + detalle.monto, 0) * 100) / 100;
}

export function cobradoDirectoFactura(factura: Factura, pagos: Pago[]): number {
  return Math.round(pagos.filter((p) => p.idFactura === factura.idFactura).reduce((suma, p) => suma + p.monto, 0) * 100) / 100;
}

export function cobradoFactura(factura: Factura, pagos: Pago[]): number {
  return Math.round((cobradoDirectoFactura(factura, pagos) + (factura.creditoAplicado ?? 0)) * 100) / 100;
}

export function saldoFactura(factura: Factura, pagos: Pago[]): number {
  if (factura.fechaCancelacion) return 0;
  return Math.max(0, Math.round((totalFactura(factura) - cobradoFactura(factura, pagos)) * 100) / 100);
}

export function estadoFactura(factura: Factura, pagos: Pago[]) {
  if (factura.fechaCancelacion) return "cancelada";
  const saldo = saldoFactura(factura, pagos);
  if (saldo === 0) return "pagada";
  if (factura.fechaVence < FECHA_REFERENCIA) return "vencida";
  if (saldo < totalFactura(factura)) return "parcial";
  return "pendiente";
}

export function aplicarCancelacionFactura(state: DataState, idFactura: string, motivo: string): DataState {
  const factura = state.facturas.find((f) => f.idFactura === idFactura);
  if (!factura || saldoFactura(factura, state.pagos) <= 0) throw new Error("Solo se pueden cancelar facturas con saldo pendiente.");
  const motivoCancelacion = motivo.trim();
  if (!motivoCancelacion || motivoCancelacion.length > 1000) throw new Error("Ingresá un motivo de cancelación de hasta 1000 caracteres.");
  return { ...state, facturas: state.facturas.map((f) => f === factura ? { ...f, fechaCancelacion: FECHA_REFERENCIA, motivoCancelacion } : f) };
}

export function facturaActivaDeMulta(facturas: Factura[], idMulta?: string) {
  return facturas.find((f) => !f.fechaCancelacion && f.detalles.some((d) => d.idMulta && d.idMulta === idMulta));
}

function detalleMulta(multa: Multa, { recargo, total }: ReturnType<typeof importeMulta>) {
  return {
    idMulta: multa.idMulta,
    concepto: `Multa ${multa.idMulta} · ${multa.motivo || "Sanción de residencia"}${recargo ? ` (incluye recargo del ${multa.recargoPorcentaje ?? 20}%)` : ""}`,
    monto: total,
  };
}

function saldarMultas(multas: Multa[], factura: Factura, fecha: string): Multa[] {
  return multas.map((multa) => {
    if (multa.estado !== "pendiente") return multa;
    const detalle = factura.detalles.find((d) => d.idMulta === multa.idMulta);
    return detalle ? { ...multa, estado: "pagada", fechaPago: fecha, montoPagado: detalle.monto } : multa;
  });
}

export function actualizarMultaFacturada(state: DataState, anterior: Multa, multa: Multa): DataState {
  if (anterior === multa) return state;
  const factura = facturaActivaDeMulta(state.facturas, multa.idMulta);
  let facturas = state.facturas;
  let multas = state.multas.map((m) => m === anterior ? multa : m);
  if (factura) {
    if (saldoFactura(factura, state.pagos) <= 0) throw new Error("La factura asociada ya está pagada.");
    const recalcular = anterior.monto !== multa.monto || anterior.fechaVence !== multa.fechaVence;
    const actualizada = { ...factura, detalles: factura.detalles.map((d) => {
      if (d.idMulta !== multa.idMulta || (!recalcular && anterior.motivo === multa.motivo)) return d;
      const importe = recalcular ? importeMulta(multa, factura.fechaEmision) : importeMulta(anterior, factura.fechaEmision, [factura]);
      return detalleMulta(multa, importe);
    }) };
    const total = totalFactura(actualizada);
    const cobrado = cobradoFactura(factura, state.pagos);
    if (total < cobrado) throw new Error("El total actualizado no puede quedar por debajo del importe ya cobrado.");
    if (total === cobrado) {
      const fechaUltimoCobro = state.pagos.filter((p) => p.idFactura === factura.idFactura)
        .reduce((ultima, pago) => pago.fecha > ultima ? pago.fecha : ultima, factura.fechaEmision);
      multas = saldarMultas(multas, actualizada, fechaUltimoCobro);
    }
    facturas = state.facturas.map((f) => f === factura ? actualizada : f);
  }
  return { ...state, facturas, multas };
}

export function prepararFactura(state: DataState, idContrato: string, periodo: string, idFactura: string, reemplazo?: ReemplazoFacturaInput): Factura {
  const contrato = state.contratos.find((c) => c.idContrato === idContrato);
  if (!contrato || !correspondeCuota(contrato, periodo)) throw new Error("El período debe corresponder a la estadía y no puede ser futuro.");
  const alumno = state.alumnos.find((a) => a.idAlumno === contrato.idAlumno);
  if (!alumno) throw new Error("No se encontró al titular del contrato.");
  let creditoAplicado = 0;
  const origen = reemplazo ? state.facturas.find((f) => f.idFactura === reemplazo.idFacturaOrigen) : undefined;
  const cadena = new Set<string>();
  if (reemplazo) {
    if (!origen?.fechaCancelacion) throw new Error("Seleccioná una factura de origen cancelada.");
    if (state.facturas.some((f) => f.idFacturaOrigen === origen.idFactura)) throw new Error("Esta factura ya tiene un reemplazo.");
    creditoAplicado = cobradoFactura(origen, state.pagos);
    if (creditoAplicado > 0 && origen.idAlumno !== alumno.idAlumno) throw new Error("El crédito de la factura original solo puede aplicarse al mismo titular.");
    const centavos = Math.round(reemplazo.monto * 100);
    if (!reemplazo.concepto.trim() || reemplazo.concepto.trim().length > 200) throw new Error("Ingresá un concepto de hasta 200 caracteres.");
    if (!Number.isSafeInteger(centavos) || centavos <= 0 || Math.abs(reemplazo.monto * 100 - centavos) > 0.00001) throw new Error("Ingresá un importe positivo con hasta dos decimales.");
    if (!esFechaISO(reemplazo.fechaVence)) throw new Error("Ingresá una fecha de vencimiento válida.");
    for (let anterior: Factura | undefined = origen; anterior && !cadena.has(anterior.idFactura); anterior = state.facturas.find((f) => f.idFactura === anterior?.idFacturaOrigen)) {
      cadena.add(anterior.idFactura);
    }
  } else {
    if (!Number.isFinite(contrato.montoMensual) || (contrato.montoMensual ?? 0) <= 0) throw new Error("El contrato no tiene un importe mensual válido.");
    if (contrato.diaVencimientoPago !== undefined && (!Number.isInteger(contrato.diaVencimientoPago) || contrato.diaVencimientoPago < 1 || contrato.diaVencimientoPago > 31)) throw new Error("El contrato no tiene un día de vencimiento válido.");
  }
  if (state.facturas.some((f) => f.idContrato === idContrato && f.periodo === periodo && (!f.fechaCancelacion || !cadena.has(f.idFactura)))) {
    throw new Error("La cuota de este contrato ya fue facturada para ese período.");
  }
  const [anio, mes] = periodo.split("-").map(Number);
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const fechaVence = reemplazo?.fechaVence ?? `${periodo}-${String(Math.min(ultimo, Math.max(1, contrato.diaVencimientoPago ?? 10))).padStart(2, "0")}`;
  const facturadas = new Set(state.facturas.filter((f) => !f.fechaCancelacion).flatMap((f) => f.detalles.flatMap((d) => d.idMulta ? [d.idMulta] : [])));
  const multas = state.multas.filter((m) => m.idAlumno === alumno.idAlumno && m.estado === "pendiente" &&
    m.fechaEmision <= FECHA_REFERENCIA && (m.periodoDesde ?? m.fechaEmision.slice(0, 7)) <= periodo && !facturadas.has(m.idMulta));
  const factura: Factura = {
    idFactura, idContrato, idAlumno: alumno.idAlumno, titular: `${alumno.apellido}, ${alumno.nombre}`, documento: alumno.documento,
    periodo, fechaEmision: FECHA_REFERENCIA, fechaVence,
    ...(origen ? { idFacturaOrigen: origen.idFactura, creditoAplicado } : {}),
    detalles: [
      { concepto: reemplazo?.concepto.trim() ?? `Alojamiento mensual · ${periodo}`, monto: reemplazo?.monto ?? contrato.montoMensual! },
      ...multas.map((m) => detalleMulta(m, importeMulta(m))),
    ],
  };
  if (totalFactura(factura) < creditoAplicado) throw new Error("El total de la nueva factura no puede ser menor al crédito disponible.");
  return factura;
}

export function aplicarEmisionFactura(state: DataState, factura: Factura): DataState {
  const multas = saldoFactura(factura, state.pagos) === 0 ? saldarMultas(state.multas, factura, factura.fechaEmision) : state.multas;
  return { ...state, facturas: [...state.facturas, factura], multas };
}

export function aplicarCobro(state: DataState, input: RegistrarCobroInput, idPago: string): DataState {
  const factura = state.facturas.find((f) => f.idFactura === input.idFactura);
  if (!factura || factura.fechaCancelacion) throw new Error("Seleccioná una factura habilitada para cobros.");
  const centavos = Math.round(input.monto * 100);
  if (!Number.isSafeInteger(centavos) || centavos <= 0 || Math.abs(input.monto * 100 - centavos) > 0.00001 || input.monto > saldoFactura(factura, state.pagos)) throw new Error("El importe debe ser mayor a cero, tener hasta dos decimales y no superar el saldo.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.fecha) || !Number.isFinite(Date.parse(`${input.fecha}T00:00:00Z`)) || new Date(`${input.fecha}T00:00:00Z`).toISOString().slice(0, 10) !== input.fecha || input.fecha < factura.fechaEmision || input.fecha > FECHA_REFERENCIA) throw new Error("La fecha debe estar entre la emisión de la factura y la fecha actual.");
  if (!["efectivo", "transferencia", "tarjeta"].includes(input.medio)) throw new Error("Seleccioná un medio de pago válido.");
  if (input.medio !== "efectivo" && !input.referencia.trim()) throw new Error("Ingresá la referencia de la operación.");
  const pago: Pago = { ...input, idPago, idAlumno: factura.idAlumno, concepto: `Factura ${factura.idFactura} · ${factura.periodo}`, referencia: input.referencia.trim() };
  const pagos = [...state.pagos, pago];
  const multas = saldoFactura(factura, pagos) === 0 ? saldarMultas(state.multas, factura, input.fecha) : state.multas;
  return { ...state, pagos, multas };
}
