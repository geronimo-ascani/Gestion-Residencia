import { normalizar } from "./format";
import { asignacionActiva } from "./domain";
import type { DataState, EstadoReclamo, NuevoReclamoInput, Reclamo, Usuario } from "./types";

export const TIPOS_RECLAMO = [{ id: "reclamo", label: "Reclamo" }, { id: "solicitud", label: "Solicitud" }, { id: "problema", label: "Aviso de problema" }] as const;
export const CATEGORIAS_RECLAMO = [{ id: "mantenimiento", label: "Mantenimiento" }, { id: "limpieza", label: "Limpieza" }, { id: "convivencia", label: "Convivencia" }, { id: "administracion", label: "Administración" }, { id: "otro", label: "Otro" }] as const;
export const ESTADOS_RECLAMO = [{ id: "pendiente", label: "Pendiente" }, { id: "en_revision", label: "En revisión" }, { id: "resuelto", label: "Resuelto" }, { id: "rechazado", label: "Rechazado" }, { id: "cancelado", label: "Cancelado" }] as const;
export const reclamoAbierto = (r: Reclamo) => r.estado === "pendiente" || r.estado === "en_revision";

function cuentaActiva(data: DataState, usuario: Usuario) {
  const cuenta = data.usuarios.find((u) => u.idUsuario === usuario.idUsuario && u.rol === usuario.rol && u.estado === "activo");
  if (!cuenta) throw new Error("Tu cuenta no tiene acceso para realizar esta acción.");
  return cuenta;
}

export function ubicacionesReclamo(data: DataState, idAlumno: string) {
  const asignacion = asignacionActiva(data.asignaciones, idAlumno);
  const habitacion = data.habitaciones.find((h) => h.idHabitacion === asignacion?.idHabitacion);
  return [
    { id: "general", label: "General / No corresponde un lugar" },
    ...(habitacion ? [{ id: `habitacion:${habitacion.idHabitacion}`, label: `Mi habitación · N.º ${habitacion.numeroHabitacion}` }] : []),
    ...data.ambientes.filter((a) => !data.habitaciones.some((h) => normalizar(a.ambiente) === normalizar(`Habitación ${h.numeroHabitacion}`))).map((a) => ({ id: `ambiente:${a.idAmbiente}`, label: a.ambiente })),
  ];
}

export function validarReclamo(input: NuevoReclamoInput, ubicaciones: { id: string }[]) {
  const errores: Record<string, string> = {};
  if (!TIPOS_RECLAMO.some((t) => t.id === input.tipo)) errores.tipo = "Elegí el tipo de presentación.";
  if (!CATEGORIAS_RECLAMO.some((c) => c.id === input.categoria)) errores.categoria = "Elegí una categoría.";
  if (input.asunto.trim().length < 5 || input.asunto.trim().length > 100) errores.asunto = "El asunto debe tener entre 5 y 100 caracteres.";
  if (input.descripcion.trim().length < 20 || input.descripcion.trim().length > 3000) errores.descripcion = "La descripción debe tener entre 20 y 3000 caracteres.";
  if (!ubicaciones.some((u) => u.id === input.ubicacion)) errores.ubicacion = "Elegí una ubicación válida.";
  if (input.detalleUbicacion.trim().length > 120) errores.detalleUbicacion = "El detalle de ubicación no puede superar los 120 caracteres.";
  if (!["normal", "alta"].includes(input.prioridad)) errores.prioridad = "Elegí una prioridad válida.";
  return errores;
}

export function prepararReclamo(data: DataState, usuario: Usuario, input: NuevoReclamoInput, id: string, fecha: string): Reclamo {
  const cuenta = cuentaActiva(data, usuario);
  if (cuenta.rol !== "alumno" || !cuenta.idAlumno || !data.alumnos.some((a) => a.idAlumno === cuenta.idAlumno && a.estado === "activo")) throw new Error("Solo un alumno activo puede crear una presentación.");
  const ubicaciones = ubicacionesReclamo(data, cuenta.idAlumno);
  const errores = validarReclamo(input, ubicaciones);
  if (Object.keys(errores).length) throw new Error(Object.values(errores)[0]);
  return {
    ...input, asunto: input.asunto.trim(), descripcion: input.descripcion.trim(), detalleUbicacion: input.detalleUbicacion.trim(),
    ubicacion: ubicaciones.find((u) => u.id === input.ubicacion)!.label,
    idReclamo: id, idAlumno: cuenta.idAlumno, estado: "pendiente", fechaCreacion: fecha, fechaActualizacion: fecha,
    historial: [{ id: `${id}-alta`, fecha, autor: cuenta.nombre, rol: "alumno", tipo: "creacion", mensaje: "Presentación registrada y pendiente de revisión por administración.", estado: "pendiente" }],
  };
}

export function reclamosVisibles(data: DataState, usuario: Usuario): Reclamo[] {
  const cuenta = data.usuarios.find((u) => u.idUsuario === usuario.idUsuario && u.estado === "activo" && u.rol === usuario.rol);
  if (!cuenta) return [];
  return (data.reclamos ?? []).filter((r) => cuenta.rol === "administrador" || Boolean(cuenta.idAlumno) && r.idAlumno === cuenta.idAlumno)
    .sort((a, b) => b.fechaActualizacion.localeCompare(a.fechaActualizacion));
}

export interface FiltrosReclamosAdmin {
  busqueda?: string;
  vista?: string;
  estado?: string;
  categoria?: string;
  prioridad?: string;
  tipo?: string;
  orden?: string;
}

export function listarReclamosAdministracion(data: DataState, usuario: Usuario, filtros: FiltrosReclamosAdmin = {}) {
  const reclamos = usuario.rol === "administrador" ? reclamosVisibles(data, usuario) : [];
  const termino = normalizar(filtros.busqueda ?? "");
  return reclamos.filter((r) => {
    const alumno = data.alumnos.find((a) => a.idAlumno === r.idAlumno);
    return (filtros.vista !== "abiertos" || reclamoAbierto(r)) &&
      (filtros.vista !== "cerrados" || !reclamoAbierto(r)) &&
      (!filtros.estado || filtros.estado === "todos" || r.estado === filtros.estado) &&
      (!filtros.categoria || filtros.categoria === "todas" || r.categoria === filtros.categoria) &&
      (!filtros.prioridad || filtros.prioridad === "todas" || r.prioridad === filtros.prioridad) &&
      (!filtros.tipo || filtros.tipo === "todos" || r.tipo === filtros.tipo) &&
      normalizar(`${r.idReclamo} ${r.asunto} ${r.descripcion} ${r.ubicacion} ${alumno?.nombre ?? ""} ${alumno?.apellido ?? ""} ${alumno?.documento ?? ""}`).includes(termino);
  }).sort((a, b) => {
    if (filtros.orden === "prioridad") {
      const abiertos = Number(reclamoAbierto(b)) - Number(reclamoAbierto(a));
      if (abiertos) return abiertos;
      const prioridad = Number(b.prioridad === "alta") - Number(a.prioridad === "alta");
      if (prioridad) return prioridad;
    }
    return filtros.orden === "antiguos" ? a.fechaCreacion.localeCompare(b.fechaCreacion) : b.fechaActualizacion.localeCompare(a.fechaActualizacion);
  });
}

export function actualizarReclamo(data: DataState, usuario: Usuario, id: string, mensaje: string, estado: EstadoReclamo | undefined, eventoId: string, fecha: string): DataState {
  const cuenta = cuentaActiva(data, usuario);
  const reclamo = reclamosVisibles(data, usuario).find((r) => r.idReclamo === id);
  if (!reclamo) throw new Error("La presentación no está disponible para tu cuenta.");
  if (!reclamoAbierto(reclamo)) throw new Error("Esta presentación ya está cerrada y no admite cambios.");
  const texto = mensaje.trim();
  if (texto.length < 5 || texto.length > 2000) throw new Error("Escribí un mensaje de entre 5 y 2000 caracteres.");
  if (estado !== undefined) {
    if (cuenta.rol === "alumno" && estado !== "cancelado") throw new Error("Solo administración puede gestionar el estado.");
    if (cuenta.rol === "administrador" && !["pendiente", "en_revision", "resuelto", "rechazado"].includes(estado)) throw new Error("El estado no es válido para administración.");
  }
  const actualizado: Reclamo = { ...reclamo, estado: estado ?? reclamo.estado, fechaActualizacion: fecha,
    historial: [...reclamo.historial, { id: eventoId, fecha, autor: cuenta.nombre, rol: cuenta.rol, tipo: estado && estado !== reclamo.estado ? "estado" : "comentario", mensaje: texto, ...(estado ? { estado } : {}) }],
  };
  return { ...data, reclamos: data.reclamos.map((r) => r.idReclamo === id ? actualizado : r) };
}
