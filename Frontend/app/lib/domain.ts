import { FECHA_REFERENCIA, MONTO_CUOTA_MENSUAL } from "./config";
import type {
  Contrato,
  CuotaMensual,
  Habitacion,
  HabitacionAlumno,
  Multa,
} from "./types";

export type EstadoCuotaVisual = "pagada" | "parcial" | "vencida" | "pendiente";

export type EstadoMultaVisual = "pagada" | "anulada" | "vencida" | "pendiente";

export type EstadoContrato =
  | "vigente"
  | "por-vencer"
  | "finalizado"
  | "programado";

export function estaActiva(
  desde: string,
  hasta: string | null,
  hoy: string = FECHA_REFERENCIA,
): boolean {
  return desde <= hoy && (hasta === null || hasta >= hoy);
}

export function asignacionesActivas(
  asignaciones: HabitacionAlumno[],
  hoy: string = FECHA_REFERENCIA,
): HabitacionAlumno[] {
  return asignaciones.filter((a) => estaActiva(a.fechaDesde, a.fechaHasta, hoy));
}

export function asignacionActiva(
  asignaciones: HabitacionAlumno[],
  idAlumno: string,
  hoy: string = FECHA_REFERENCIA,
): HabitacionAlumno | undefined {
  return asignaciones.find(
    (a) => a.idAlumno === idAlumno && estaActiva(a.fechaDesde, a.fechaHasta, hoy),
  );
}

export interface ResumenOcupacion {
  capacidadTotal: number;
  camasOcupadas: number;
  habitacionesOcupadas: number;
  habitacionesLlenas: number;
  porcentaje: number;
}

export function calcularOcupacion(
  habitaciones: Habitacion[],
  asignaciones: HabitacionAlumno[],
  hoy: string = FECHA_REFERENCIA,
): ResumenOcupacion {
  const activas = asignacionesActivas(asignaciones, hoy);
  const porHabitacion = new Map<string, number>();

  for (const asignacion of activas) {
    porHabitacion.set(
      asignacion.idHabitacion,
      (porHabitacion.get(asignacion.idHabitacion) ?? 0) + 1,
    );
  }

  let capacidadTotal = 0;
  let habitacionesLlenas = 0;

  for (const habitacion of habitaciones) {
    capacidadTotal += habitacion.capacidadMaxima;
    const ocupadas = porHabitacion.get(habitacion.idHabitacion) ?? 0;
    if (ocupadas >= habitacion.capacidadMaxima) habitacionesLlenas += 1;
  }

  return {
    capacidadTotal,
    camasOcupadas: activas.length,
    habitacionesOcupadas: porHabitacion.size,
    habitacionesLlenas,
    porcentaje: capacidadTotal > 0 ? (activas.length / capacidadTotal) * 100 : 0,
  };
}

export function estadoCuotaVisual(
  cuota: CuotaMensual,
  hoy: string = FECHA_REFERENCIA,
): EstadoCuotaVisual {
  if (cuota.estado === "pagada") return "pagada";
  if (cuota.estado === "parcial") return "parcial";
  if (cuota.mesAsociado < hoy.slice(0, 7)) return "vencida";
  return "pendiente";
}

export function esCuotaVencida(
  cuota: CuotaMensual,
  hoy: string = FECHA_REFERENCIA,
): boolean {
  return cuota.estado !== "pagada" && cuota.mesAsociado < hoy.slice(0, 7);
}

export function saldoCuota(cuota: CuotaMensual): number {
  return Math.max(0, MONTO_CUOTA_MENSUAL - cuota.montoPagado);
}

export function recaudadoDe(cuotas: CuotaMensual[]): number {
  return cuotas.reduce((total, cuota) => total + cuota.montoPagado, 0);
}

export function esperadoDe(cuotas: CuotaMensual[]): number {
  return cuotas.length * MONTO_CUOTA_MENSUAL;
}

export function estadoMultaVisual(
  multa: Multa,
  hoy: string = FECHA_REFERENCIA,
): EstadoMultaVisual {
  if (multa.estado === "pagada") return "pagada";
  if (multa.estado === "anulada") return "anulada";
  if (multa.fechaVence < hoy) return "vencida";
  return "pendiente";
}

export function esMultaVencida(
  multa: Multa,
  hoy: string = FECHA_REFERENCIA,
): boolean {
  return multa.estado === "pendiente" && multa.fechaVence < hoy;
}

export function diasHasta(
  fecha: string,
  hoy: string = FECHA_REFERENCIA,
): number {
  const destino = Date.parse(`${fecha}T00:00:00Z`);
  const base = Date.parse(`${hoy}T00:00:00Z`);
  return Math.round((destino - base) / 86_400_000);
}

export function estadoContrato(
  contrato: Contrato,
  hoy: string = FECHA_REFERENCIA,
): EstadoContrato {
  if (contrato.fechaDesde > hoy) return "programado";
  if (contrato.fechaHasta < hoy) return "finalizado";
  if (diasHasta(contrato.fechaHasta, hoy) <= 30) return "por-vencer";
  return "vigente";
}

export function contratoVigente(
  contratos: Contrato[],
  idAlumno: string,
  hoy: string = FECHA_REFERENCIA,
): Contrato | undefined {
  return contratos.find(
    (c) =>
      c.idAlumno === idAlumno && c.fechaDesde <= hoy && c.fechaHasta >= hoy,
  );
}

/** Devuelve los últimos `cantidad` meses terminando en `mes` (`YYYY-MM`). */
export function ultimosMeses(mes: string, cantidad: number): string[] {
  const [anio, numeroMes] = mes.split("-").map(Number);
  const resultado: string[] = [];
  for (let i = cantidad - 1; i >= 0; i -= 1) {
    const fecha = new Date(Date.UTC(anio, numeroMes - 1 - i, 1));
    resultado.push(
      `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, "0")}`,
    );
  }
  return resultado;
}

export function mesesConCuotas(cuotas: CuotaMensual[]): string[] {
  return [...new Set(cuotas.map((c) => c.mesAsociado))].sort();
}
