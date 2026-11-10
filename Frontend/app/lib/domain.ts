import { FECHA_REFERENCIA } from "./config";
import type {
  Contrato,
  Habitacion,
  HabitacionAlumno,
  GrupoLimpiezaAmbiente,
  Multa,
  Pago,
} from "./types";

export type EstadoMultaVisual = "pagada" | "anulada" | "vencida" | "pendiente";

export type EstadoContrato =
  | "vigente"
  | "por-vencer"
  | "finalizado"
  | "programado"
  | "cancelado";

export function estaActiva(
  desde: string,
  hasta: string | null,
  hoy: string = FECHA_REFERENCIA,
): boolean {
  return desde <= hoy && (hasta === null || hasta > hoy);
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

export function asignacionesAmbienteActivas(
  asignaciones: GrupoLimpiezaAmbiente[],
  hoy: string = FECHA_REFERENCIA,
): GrupoLimpiezaAmbiente[] {
  return asignaciones.filter(
    (asignacion) =>
      asignacion.fechaDesde <= hoy &&
      (asignacion.fechaHasta === null || asignacion.fechaHasta > hoy),
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
  if (contrato.fechaCancelacion && contrato.fechaCancelacion <= hoy) return "cancelado";
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
  return [...contratos].sort((a, b) => b.fechaDesde.localeCompare(a.fechaDesde)).find(
    (c) => c.idAlumno === idAlumno && c.fechaDesde <= hoy && c.fechaHasta >= hoy &&
      (!c.fechaCancelacion || c.fechaCancelacion > hoy),
  );
}

export function totalRecaudado(pagos: Pago[]): number {
  return pagos.reduce((total, pago) => total + pago.monto, 0);
}

/** Último día de estadía; una baja es efectiva al comienzo de su fecha. */
export function finEstadia(contrato: Contrato): string {
  if (!contrato.fechaCancelacion) return contrato.fechaHasta;
  return sumarDia(contrato.fechaCancelacion, -1);
}

export function sumarDia(fecha: string, cantidad = 1): string {
  const date = new Date(`${fecha}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + cantidad);
  return date.toISOString().slice(0, 10);
}

export function contratosSuperpuestos(contratos: Contrato[], nuevo: Pick<Contrato, "idAlumno" | "fechaDesde" | "fechaHasta">): boolean {
  return contratos.some((c) => c.idAlumno === nuevo.idAlumno &&
    c.fechaDesde <= finEstadia(c) && nuevo.fechaDesde <= finEstadia(c) && nuevo.fechaHasta >= c.fechaDesde);
}

export function tipoIngreso(contrato: Contrato, contratos: Contrato[]): string {
  const anterior = contratos.filter((c) => c.idAlumno === contrato.idAlumno && c.idContrato !== contrato.idContrato &&
    c.fechaDesde < contrato.fechaDesde).sort((a, b) => finEstadia(b).localeCompare(finEstadia(a)))[0];
  if (!anterior) return "Primer ingreso";
  return !anterior.fechaCancelacion && sumarDia(anterior.fechaHasta) === contrato.fechaDesde ? "Renovación" : "Reingreso";
}
