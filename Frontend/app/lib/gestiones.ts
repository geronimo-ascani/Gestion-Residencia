import { asignacionActiva, asignacionesActivas, contratosSuperpuestos, estaActiva } from "./domain";
import { FECHA_REFERENCIA } from "./config";
import { normalizar } from "./format";
import type { Alumno, Contrato, DataState, Habitacion } from "./types";

export function esFechaISO(fecha: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && Number.isFinite(Date.parse(`${fecha}T00:00:00Z`)) && new Date(`${fecha}T00:00:00Z`).toISOString().slice(0, 10) === fecha;
}
const importeValido = (valor: number | undefined, minimo: number) => valor !== undefined && Number.isFinite(valor) && valor >= minimo && Number.isSafeInteger(Math.round(valor * 100)) && Math.abs(valor * 100 - Math.round(valor * 100)) < 0.00001;

export function validarAltaAlumno(data: Pick<DataState, "alumnos">, alumno: Pick<Alumno, "nombre" | "apellido" | "documento" | "telefono" | "correo">) {
  if (![alumno.nombre, alumno.apellido, alumno.documento, alumno.telefono].every((v) => v.trim())) throw new Error("Completá el nombre, apellido, documento y teléfono del alumno.");
  const documento = (v: string) => normalizar(v.replace(/[.\s-]/g, ""));
  if (data.alumnos.some((a) => documento(a.documento) === documento(alumno.documento))) throw new Error("Ya existe un alumno con este documento. Registrá un reingreso desde su ficha.");
  if (alumno.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alumno.correo.trim())) throw new Error("Ingresá un correo válido.");
}

export function validarAltaHabitacion(data: Pick<DataState, "habitaciones">, habitacion: Omit<Habitacion, "idHabitacion">) {
  const numero = Number(habitacion.numeroHabitacion);
  if (!Number.isSafeInteger(numero) || numero < 1) throw new Error("El número de habitación debe ser un entero positivo.");
  if (data.habitaciones.some((h) => Number(h.numeroHabitacion) === numero)) throw new Error("Ya existe una habitación con ese número.");
  if (!Number.isSafeInteger(habitacion.capacidadMaxima) || habitacion.capacidadMaxima < 1) throw new Error("La capacidad debe ser un entero positivo.");
  if (!habitacion.descripcion.trim()) throw new Error("Ingresá una descripción de la habitación.");
}

export function validarAltaContrato(data: Pick<DataState, "alumnos" | "contratos">, contrato: Omit<Contrato, "idContrato">) {
  if (!data.alumnos.some((a) => a.idAlumno === contrato.idAlumno && a.estado === "activo")) throw new Error("Seleccioná un alumno activo registrado.");
  if (!esFechaISO(contrato.fechaDesde) || !esFechaISO(contrato.fechaHasta) || contrato.fechaHasta < contrato.fechaDesde) throw new Error("Ingresá fechas válidas; el fin no puede ser anterior al inicio.");
  if (contrato.fechaFirma && (!esFechaISO(contrato.fechaFirma) || contrato.fechaFirma > contrato.fechaHasta)) throw new Error("La fecha de firma no es válida para este contrato.");
  if (!importeValido(contrato.montoMensual, 0.01) || (contrato.depositoGarantia !== undefined && !importeValido(contrato.depositoGarantia, 0))) throw new Error("Los importes deben ser válidos y tener hasta dos decimales.");
  if (!Number.isInteger(contrato.diaVencimientoPago) || contrato.diaVencimientoPago! < 1 || contrato.diaVencimientoPago! > 31) throw new Error("El día de vencimiento debe estar entre 1 y 31.");
  if (contratosSuperpuestos(data.contratos, contrato)) throw new Error("Las fechas se superponen con otro contrato del alumno.");
}

export function aplicarAsignacionHabitacion(data: DataState, idAlumno: string, idHabitacion: string, hoy = FECHA_REFERENCIA): DataState {
  if (!data.alumnos.some((a) => a.idAlumno === idAlumno && a.estado === "activo")) throw new Error("Seleccioná un alumno activo registrado.");
  const habitacion = data.habitaciones.find((h) => h.idHabitacion === idHabitacion);
  if (!habitacion) throw new Error("La habitación seleccionada no existe.");
  if (asignacionActiva(data.asignaciones, idAlumno, hoy)?.idHabitacion === idHabitacion) return data;
  if (asignacionesActivas(data.asignaciones, hoy).filter((a) => a.idHabitacion === idHabitacion).length >= habitacion.capacidadMaxima) throw new Error("La habitación seleccionada está completa.");
  return { ...data, asignaciones: [
    ...data.asignaciones.map((a) => a.idAlumno === idAlumno && estaActiva(a.fechaDesde, a.fechaHasta, hoy) ? { ...a, fechaHasta: hoy } : a),
    { idAlumno, idHabitacion, fechaDesde: hoy, fechaHasta: null },
  ] };
}
