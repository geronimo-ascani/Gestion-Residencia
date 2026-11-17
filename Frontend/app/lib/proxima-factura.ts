import { FECHA_REFERENCIA } from "./config";
import { finEstadia } from "./domain";
import { saldoFactura, totalFactura } from "./facturacion";
import type { Contrato, Factura, Pago } from "./types";

export function proximaFacturaAlumno(contratos: Contrato[], facturas: Factura[], pagos: Pago[], hoy = FECHA_REFERENCIA) {
  const emitida = facturas.filter((f) => f.fechaVence >= hoy && saldoFactura(f, pagos) > 0)
    .sort((a, b) => a.fechaVence.localeCompare(b.fechaVence))[0];
  const estimadas = contratos.flatMap((c) => {
    if (!Number.isFinite(c.montoMensual) || (c.montoMensual ?? 0) <= 0) return [];
    const [anio, mes] = hoy.split("-").map(Number);
    let periodo = new Date(Date.UTC(anio, mes, 1)).toISOString().slice(0, 7);
    if (c.fechaDesde.slice(0, 7) > periodo) periodo = c.fechaDesde.slice(0, 7);
    while (periodo <= finEstadia(c).slice(0, 7)) {
      const [a, m] = periodo.split("-").map(Number);
      if (!facturas.some((f) => f.idContrato === c.idContrato && f.periodo === periodo)) {
        const dia = Math.min(new Date(Date.UTC(a, m, 0)).getUTCDate(), Math.max(1, c.diaVencimientoPago ?? 10));
        return [{ periodo, fechaVence: `${periodo}-${String(dia).padStart(2, "0")}`, monto: c.montoMensual!, estimada: true, idFactura: undefined }];
      }
      periodo = new Date(Date.UTC(a, m, 1)).toISOString().slice(0, 7);
    }
    return [];
  });
  return [...estimadas, ...(emitida ? [{ periodo: emitida.periodo, fechaVence: emitida.fechaVence, monto: totalFactura(emitida), estimada: false, idFactura: emitida.idFactura }] : [])]
    .sort((a, b) => a.fechaVence.localeCompare(b.fechaVence))[0];
}
