import { FECHA_REFERENCIA } from "./config";
import type { Multa } from "./types";

// Aranceles establecidos por la residencia; extraordinaria admite importe manual.
export const TIPOS_MULTA = [
  { id: "leve", nombre: "Falta leve", monto: 10000 },
  { id: "moderada", nombre: "Falta moderada", monto: 25000 },
  { id: "grave", nombre: "Falta grave", monto: 40000 },
  { id: "extraordinaria", nombre: "Falta extraordinaria", monto: 0 },
];

/** Después del día 15 se admite cancelar hasta la segunda factura siguiente. */
export function calendarioMulta(fecha: string, diaVencimiento = 10) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const plazo = dia > 15 ? 2 : 1;
  function periodo(desplazamiento: number) {
    return new Date(Date.UTC(anio, mes - 1 + desplazamiento, 1)).toISOString().slice(0, 7);
  }
  const ultimo = new Date(Date.UTC(anio, mes - 1 + plazo + 1, 0)).getUTCDate();
  return {
    periodoDesde: periodo(1),
    periodoHasta: periodo(plazo),
    fechaVence: `${periodo(plazo)}-${String(Math.min(ultimo, Math.max(1, diaVencimiento))).padStart(2, "0")}`,
  };
}

export function importeMulta(multa: Multa, hoy = FECHA_REFERENCIA) {
  if (multa.estado === "anulada") return { base: multa.monto, recargo: 0, total: 0 };
  const fecha = multa.estado === "pagada" ? multa.fechaPago ?? multa.fechaVence : hoy;
  const recargo = fecha > multa.fechaVence ? Math.round(multa.monto * 0.2 * 100) / 100 : 0;
  return { base: multa.monto, recargo, total: multa.montoPagado ?? multa.monto + recargo };
}

/** Conserva el día del vencimiento, ajustándolo al último día del mes destino. */
export function extenderMes(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const ultimo = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
  return new Date(Date.UTC(anio, mes, Math.min(dia, ultimo))).toISOString().slice(0, 10);
}

export function normalizarBusqueda(valor: string) {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().trim();
}

export function conHistorialMulta(anterior: Multa, nueva: Multa, accion: "edicion" | "prorroga", motivo?: string): Multa {
  const campos = [
    ["tipo", "Tipo de multa"], ["motivo", "Motivo"], ["observaciones", "Observaciones"],
    ["huboDanios", "Daños registrados"], ["detalleDanios", "Detalle de daños"],
    ["montoSancion", "Importe de sanción (ARS)"], ["montoDanios", "Importe de daños (ARS)"],
    ["monto", "Total base (ARS)"], ["fechaVence", "Vencimiento"], ["periodoHasta", "Último período sin recargo"],
  ] as const;
  const mostrar = (valor: unknown) => typeof valor === "boolean" ? (valor ? "Sí" : "No") : String(valor ?? "Sin registrar");
  const cambios = campos.filter(([campo]) => anterior[campo] !== nueva[campo]).map(([campo, nombre]) => ({
    campo: nombre, anterior: mostrar(anterior[campo]), nuevo: mostrar(nueva[campo]),
  }));
  if (!cambios.length) return anterior;
  return { ...nueva, historial: [...(anterior.historial ?? []), { fecha: new Date().toISOString(), accion, motivo, cambios }] };
}
