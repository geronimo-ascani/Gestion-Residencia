import { FECHA_REFERENCIA } from "./config";
import { finEstadia } from "./domain";
import { importeMulta } from "./multas";
import type { Contrato, DataState, Factura, Pago, RegistrarCobroInput } from "./types";

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

export function saldoFactura(factura: Factura, pagos: Pago[]): number {
  return Math.max(0, Math.round((totalFactura(factura) - pagos.filter((p) => p.idFactura === factura.idFactura).reduce((suma, p) => suma + p.monto, 0)) * 100) / 100);
}

export function estadoFactura(factura: Factura, pagos: Pago[]) {
  const saldo = saldoFactura(factura, pagos);
  if (saldo === 0) return "pagada";
  if (factura.fechaVence < FECHA_REFERENCIA) return "vencida";
  if (saldo < totalFactura(factura)) return "parcial";
  return "pendiente";
}

export function prepararFactura(state: DataState, idContrato: string, periodo: string, idFactura: string): Factura {
  const contrato = state.contratos.find((c) => c.idContrato === idContrato);
  if (!contrato || !correspondeCuota(contrato, periodo)) throw new Error("El período debe corresponder a la estadía y no puede ser futuro.");
  const alumno = state.alumnos.find((a) => a.idAlumno === contrato.idAlumno);
  if (!alumno) throw new Error("No se encontró al titular del contrato.");
  if (!Number.isFinite(contrato.montoMensual) || (contrato.montoMensual ?? 0) <= 0) throw new Error("El contrato no tiene un importe mensual válido.");
  if (contrato.diaVencimientoPago !== undefined && (!Number.isInteger(contrato.diaVencimientoPago) || contrato.diaVencimientoPago < 1 || contrato.diaVencimientoPago > 31)) throw new Error("El contrato no tiene un día de vencimiento válido.");
  if (state.facturas.some((f) => f.idContrato === idContrato && f.periodo === periodo)) throw new Error("La cuota de este contrato ya fue facturada para ese período.");
  const [anio, mes] = periodo.split("-").map(Number);
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const fechaVence = `${periodo}-${String(Math.min(ultimo, Math.max(1, contrato.diaVencimientoPago ?? 10))).padStart(2, "0")}`;
  const facturadas = new Set(state.facturas.flatMap((f) => f.detalles.flatMap((d) => d.idMulta ? [d.idMulta] : [])));
  const multas = state.multas.filter((m) => m.idAlumno === alumno.idAlumno && m.estado === "pendiente" &&
    m.fechaEmision <= FECHA_REFERENCIA && (m.periodoDesde ?? m.fechaEmision.slice(0, 7)) <= periodo && !facturadas.has(m.idMulta));
  return {
    idFactura, idContrato, idAlumno: alumno.idAlumno, titular: `${alumno.apellido}, ${alumno.nombre}`, documento: alumno.documento,
    periodo, fechaEmision: FECHA_REFERENCIA, fechaVence,
    detalles: [
      { concepto: `Alojamiento mensual · ${periodo}`, monto: contrato.montoMensual! },
      ...multas.map((m) => ({ idMulta: m.idMulta, concepto: `Multa ${m.idMulta} · ${m.motivo || "Sanción de residencia"}${importeMulta(m).recargo ? " (incluye recargo del 20%)" : ""}`, monto: importeMulta(m).total })),
    ],
  };
}

export function aplicarCobro(state: DataState, input: RegistrarCobroInput, idPago: string): DataState {
  const factura = state.facturas.find((f) => f.idFactura === input.idFactura);
  if (!factura) throw new Error("Seleccioná una factura existente.");
  const centavos = Math.round(input.monto * 100);
  if (!Number.isSafeInteger(centavos) || centavos <= 0 || Math.abs(input.monto * 100 - centavos) > 0.00001 || input.monto > saldoFactura(factura, state.pagos)) throw new Error("El importe debe ser mayor a cero, tener hasta dos decimales y no superar el saldo.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.fecha) || !Number.isFinite(Date.parse(`${input.fecha}T00:00:00Z`)) || new Date(`${input.fecha}T00:00:00Z`).toISOString().slice(0, 10) !== input.fecha || input.fecha < factura.fechaEmision || input.fecha > FECHA_REFERENCIA) throw new Error("La fecha debe estar entre la emisión de la factura y la fecha actual.");
  if (!["efectivo", "transferencia", "tarjeta"].includes(input.medio)) throw new Error("Seleccioná un medio de pago válido.");
  if (input.medio !== "efectivo" && !input.referencia.trim()) throw new Error("Ingresá la referencia de la operación.");
  const pago: Pago = { ...input, idPago, idAlumno: factura.idAlumno, concepto: `Factura ${factura.idFactura} · ${factura.periodo}`, referencia: input.referencia.trim() };
  const pagos = [...state.pagos, pago];
  const saldada = saldoFactura(factura, pagos) === 0;
  return { ...state, pagos, multas: state.multas.map((m) => saldada && m.estado === "pendiente" && factura.detalles.some((d) => d.idMulta === m.idMulta)
    ? { ...m, estado: "pagada", fechaPago: input.fecha, montoPagado: factura.detalles.find((d) => d.idMulta === m.idMulta)!.monto } : m) };
}
