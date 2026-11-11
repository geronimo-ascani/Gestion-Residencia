import { normalizar } from "./format";
import { FECHA_REFERENCIA } from "./config";
import type {
  Contrato,
  DataState,
  NuevaTareaLimpiezaInput,
  TareaLimpieza,
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


export const TAREAS_LIMPIEZA = [
  { enRotacion: true, numero: 1, nombre: "Limpiar baños", tareas: ["Pisos limpios", "Lavamanos limpio", "Tacho de basura limpio", "Inodoro limpio"] },
  { enRotacion: true, numero: 2, nombre: "Limpiar salas comunes", tareas: ["Limpiar salas de estudio", "Limpiar pasillos", "Limpiar comedor"] },
  { enRotacion: true, numero: 3, nombre: "Limpiar duchas", tareas: ["Limpiar cada ducha", "Limpiar los mingitorios", "Limpiar el lavamanos"] },
  { enRotacion: true, numero: 4, nombre: "Limpiar cocinas", tareas: ["Limpiar los hornos", "Limpiar el piso", "Limpiar las heladeras", "Limpiar la bacha", "Limpiar la mesada"] },
] as const;

export function semanaLimpieza(fecha = FECHA_REFERENCIA): number {
  return Math.floor((Number(fecha.slice(8, 10)) - 1) / 7) + 1;
}

export function tareaLimpieza(
  tareaInicial: number,
  semana: number,
  tareas: readonly { enRotacion: boolean; numero: number; nombre: string; tareas: readonly string[] }[] = TAREAS_LIMPIEZA,
) {
  const rotativas = tareas.filter((tarea) => tarea.enRotacion);
  return rotativas[(tareaInicial + semana - 2) % rotativas.length];
}

export function validarGrupoLimpieza(
  state: DataState,
  input: { nombreDelGrupo: string; tareaInicial: number; idAlumnos: string[] },
): string {
  if (state.grupos.length >= 4) return "Ya existen los cuatro grupos de limpieza. Editá uno existente o eliminá uno para reemplazarlo.";
  if (!input.nombreDelGrupo.trim()) return "Ingresá el nombre del grupo.";
  if (state.grupos.some((g) => g.nombreDelGrupo.trim().toLowerCase() === input.nombreDelGrupo.trim().toLowerCase())) return "Ya existe un grupo con ese nombre.";
  if (![1, 2, 3, 4].includes(input.tareaInicial) || state.grupos.some((g) => g.tareaInicial === input.tareaInicial)) return "Elegí una tarea inicial disponible.";
  if (!input.idAlumnos.length) return "Seleccioná al menos un integrante.";
  if (input.idAlumnos.some((id) => !state.alumnos.some((a) => a.idAlumno === id && a.estado === "activo"))) return "Solo se pueden asignar alumnos activos existentes.";
  return "";
}

export function actualizarIntegrantesLimpieza(
  state: DataState, idGrupoLimpieza: string, idAlumnos: string[],
): DataState {
  if (!state.grupos.some((g) => g.idGrupoLimpieza === idGrupoLimpieza)) return state;
  if (idAlumnos.some((id) => !state.alumnos.some((a) => a.idAlumno === id && a.estado === "activo"))) return state;
  const ids = new Set(idAlumnos);
  return { ...state, grupoAlumnos: [
    ...state.grupoAlumnos.filter((a) => a.idGrupoLimpieza !== idGrupoLimpieza && !ids.has(a.idAlumno)),
    ...[...ids].map((idAlumno) => ({ idGrupoLimpieza, idAlumno })),
  ] };
}


export function validarTareaLimpieza(input: NuevaTareaLimpiezaInput, tareas: TareaLimpieza[], numeroActual?: number): string {
  if (!input.nombre.trim()) return "Ingresá el nombre de la tarea.";
  if (tareas.some((tarea) => tarea.numero !== numeroActual && normalizar(tarea.nombre.trim()) === normalizar(input.nombre.trim()))) {
    return "Ya existe una tarea con ese nombre.";
  }
  if (!input.tareas.length || input.tareas.some((actividad) => !actividad.trim())) {
    return "Ingresá al menos una actividad y completá cada renglón.";
  }
  const actividades = input.tareas.map((actividad) => normalizar(actividad.trim()));
  if (new Set(actividades).size !== actividades.length) return "Las actividades no deben repetirse.";
  return "";
}
