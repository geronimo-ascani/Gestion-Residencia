import { asignacionActiva, asignacionesActivas, contratosSuperpuestos, estaActiva, sumarDia } from "./domain";
import { FECHA_REFERENCIA } from "./config";
import { normalizar } from "./format";
import type { Alumno, Contrato, DataState, Habitacion } from "./types";

export function esFechaISO(fecha: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && Number.isFinite(Date.parse(`${fecha}T00:00:00Z`)) && new Date(`${fecha}T00:00:00Z`).toISOString().slice(0, 10) === fecha;
}
const importeValido = (valor: number | undefined, minimo: number) => valor !== undefined && Number.isFinite(valor) && valor >= minimo && Number.isSafeInteger(Math.round(valor * 100)) && Math.abs(valor * 100 - Math.round(valor * 100)) < 0.00001;

export function validarAltaAlumno(data: Pick<DataState, "alumnos">, alumno: Pick<Alumno, "nombre" | "apellido" | "documento" | "telefono" | "correo">, idAlumno?: string) {
  if (![alumno.nombre, alumno.apellido, alumno.documento, alumno.telefono].every((v) => v.trim())) throw new Error("Completá el nombre, apellido, documento y teléfono del alumno.");
  const documento = (v: string) => normalizar(v.replace(/[.\s-]/g, ""));
  if (data.alumnos.some((a) => a.idAlumno !== idAlumno && documento(a.documento) === documento(alumno.documento))) {
    throw new Error(idAlumno ? "Ya existe otro alumno con este documento." : "Ya existe un alumno con este documento. Registrá un reingreso desde su ficha.");
  }
  if (alumno.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alumno.correo.trim())) throw new Error("Ingresá un correo válido.");
}

export function validarAltaHabitacion(data: Pick<DataState, "habitaciones">, habitacion: Omit<Habitacion, "idHabitacion">, idHabitacion?: string) {
  const numero = Number(habitacion.numeroHabitacion);
  if (!Number.isSafeInteger(numero) || numero < 1) throw new Error("El número de habitación debe ser un entero positivo.");
  if (data.habitaciones.some((h) => h.idHabitacion !== idHabitacion && Number(h.numeroHabitacion) === numero)) throw new Error("Ya existe una habitación con ese número.");
  if (!Number.isSafeInteger(habitacion.capacidadMaxima) || habitacion.capacidadMaxima < 1) throw new Error("La capacidad debe ser un entero positivo.");
  if (habitacion.pisoHabitacion !== null && !Number.isSafeInteger(habitacion.pisoHabitacion)) throw new Error("El piso debe ser un número entero.");
  if (!habitacion.descripcion.trim()) throw new Error("Ingresá una descripción de la habitación.");
}

export function validarAltaContrato(data: Pick<DataState, "alumnos" | "contratos">, contrato: Omit<Contrato, "idContrato">, anterior?: Contrato) {
  if (!data.alumnos.some((a) => a.idAlumno === contrato.idAlumno && (a.estado === "activo" || a.idAlumno === anterior?.idAlumno))) throw new Error("Seleccioná un alumno activo registrado.");
  if (!esFechaISO(contrato.fechaDesde) || !esFechaISO(contrato.fechaHasta) || contrato.fechaHasta < contrato.fechaDesde) throw new Error("Ingresá fechas válidas; el fin no puede ser anterior al inicio.");
  if (contrato.fechaFirma && (!esFechaISO(contrato.fechaFirma) || contrato.fechaFirma > contrato.fechaHasta)) throw new Error("La fecha de firma no es válida para este contrato.");
  const importeRequerido = !anterior || anterior.montoMensual !== undefined || contrato.montoMensual !== undefined;
  if ((importeRequerido && !importeValido(contrato.montoMensual, 0.01)) || (contrato.depositoGarantia !== undefined && !importeValido(contrato.depositoGarantia, 0))) throw new Error("Los importes deben ser válidos y tener hasta dos decimales.");
  const diaRequerido = !anterior || anterior.diaVencimientoPago !== undefined || contrato.diaVencimientoPago !== undefined;
  if (diaRequerido && (!Number.isInteger(contrato.diaVencimientoPago) || contrato.diaVencimientoPago! < 1 || contrato.diaVencimientoPago! > 31)) throw new Error("El día de vencimiento debe estar entre 1 y 31.");
  const baja = anterior?.fechaCancelacion;
  if (baja && (baja < contrato.fechaDesde || baja > contrato.fechaHasta)) throw new Error("La fecha de baja debe quedar dentro de las fechas pactadas.");
  const fechaHasta = baja ? sumarDia(baja, -1) : contrato.fechaHasta;
  if (fechaHasta >= contrato.fechaDesde && contratosSuperpuestos(data.contratos.filter((c) => c.idContrato !== anterior?.idContrato), { ...contrato, fechaHasta })) {
    throw new Error("Las fechas se superponen con otro contrato del alumno.");
  }
}

export function editarHabitacion(data: DataState, idHabitacion: string, input: Omit<Habitacion, "idHabitacion">): DataState {
  if (!data.habitaciones.some((h) => h.idHabitacion === idHabitacion)) throw new Error("La habitación no existe.");
  validarAltaHabitacion(data, input, idHabitacion);
  const ocupantes = asignacionesActivas(data.asignaciones).filter((a) => a.idHabitacion === idHabitacion);
  if (input.capacidadMaxima < ocupantes.length) throw new Error(`La habitación tiene ${ocupantes.length} residentes asignados. Liberá plazas antes de reducir la capacidad.`);
  return { ...data, habitaciones: data.habitaciones.map((h) => h.idHabitacion === idHabitacion ? { ...input, idHabitacion } : h) };
}

export function titularContratoEditable(data: Pick<DataState, "facturas" | "pagos">, contrato: Contrato) {
  return !contrato.fechaCancelacion && !data.facturas.some((f) => f.idContrato === contrato.idContrato &&
    (!f.fechaCancelacion || data.pagos.some((p) => p.idFactura === f.idFactura)));
}

export function editarContrato(data: DataState, idContrato: string, input: Omit<Contrato, "idContrato" | "fechaCancelacion" | "motivoCancelacion">): DataState {
  const contrato = data.contratos.find((c) => c.idContrato === idContrato);
  if (!contrato) throw new Error("El contrato no existe.");
  if (input.idAlumno !== contrato.idAlumno && !titularContratoEditable(data, contrato)) throw new Error("El titular está vinculado a una factura, un cobro o una baja registrada.");
  validarAltaContrato(data, input, contrato);
  return { ...data, contratos: data.contratos.map((c) => c === contrato ? { ...c, ...input } : c) };
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
