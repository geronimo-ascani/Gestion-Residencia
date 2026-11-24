import { contratoVigente } from "./domain";
import { FECHA_REFERENCIA } from "./config";
import { usuarioActual } from "./session";
import type { CambioAdministrativo, DataState, Usuario } from "./types";

export const ESTADOS_CUENTA = {
  pendiente: "Pendiente de activación", activo: "Activa", suspendido: "Suspendida",
  inactivo: "Inactiva", "sin-contrato": "Sin contrato vigente", "sin-cuenta": "Sin cuenta",
};

export function estadoAcceso(usuario: Usuario | undefined, datos: Pick<DataState, "contratos">) {
  if (!usuario) return "sin-cuenta";
  if (usuario.estado === "suspendido" || usuario.estado === "inactivo") return usuario.estado;
  if (usuario.rol === "alumno" && !contratoVigente(datos.contratos, usuario.idAlumno ?? "")) return "sin-contrato";
  return usuario.estado;
}

export function puedeGestionarAdministradores(datos: Pick<DataState, "usuarios">) {
  return datos.usuarios.some((u) => u.idUsuario === usuarioActual.idUsuario && u.rol === "administrador" && u.estado === "activo" && u.gestionaAdministradores);
}

export function validarCorreoCuenta(correo: string, usuarios: Usuario[], excluir?: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) throw new Error("Ingresá un correo válido para el acceso.");
  if (usuarios.some((u) => u.idUsuario !== excluir && u.correo.toLowerCase() === correo.trim().toLowerCase())) throw new Error("Ya existe una cuenta con ese correo.");
}

const secciones = {
  carreras: "Carreras", vinculos: "Vínculos de emergencia",
  reclamos: "Reclamos y solicitudes", alumnos: "Alumnos", contratos: "Contratos", habitaciones: "Habitaciones", asignaciones: "Asignaciones de habitación",
  usuarios: "Cuentas de acceso", facturas: "Facturación", pagos: "Cobros", multas: "Multas", grupos: "Grupos de limpieza",
  tareasLimpieza: "Tareas de limpieza", grupoAlumnos: "Integrantes de limpieza", ambientes: "Ambientes", grupoAmbientes: "Asignaciones de ambientes",
} as const;

/** Auditoría del prototipo. La API deberá registrar actor y cambios en la misma transacción. */
export function registrarCambios(antes: DataState, despues: DataState, fecha: string, id: string): DataState {
  if (antes === despues) return antes;
  const cambios: CambioAdministrativo[] = Object.entries(secciones).flatMap(([clave, seccion]) => {
    const campo = clave as keyof typeof secciones;
    const previos = antes[campo];
    const nuevos = despues[campo];
    if (previos === nuevos || JSON.stringify(previos) === JSON.stringify(nuevos)) return [];
    // Los índices se usan solo para relaciones sin identificador propio.
    const identidad = (fila: object, indice: number) => {
      const r = fila as Record<string, unknown>;
      const pk: Record<string, string> = { carreras: "id", vinculos: "id", reclamos: "idReclamo", alumnos: "idAlumno", usuarios: "idUsuario", contratos: "idContrato", habitaciones: "idHabitacion", facturas: "idFactura", pagos: "idPago", multas: "idMulta", grupos: "idGrupoLimpieza", ambientes: "idAmbiente", tareasLimpieza: "numero" };
      return String(r[pk[campo]] ?? indice);
    };
    const mapa = new Map(previos.map((fila, indice) => [identidad(fila, indice), fila]));
    const cambiosFila = nuevos.flatMap((fila, indice) => {
      const referencia = identidad(fila, indice);
      const anterior = mapa.get(referencia);
      mapa.delete(referencia);
      if (JSON.stringify(anterior) === JSON.stringify(fila)) return [];
      const r = fila as unknown as Record<string, unknown>;
      const a = anterior as unknown as Record<string, unknown> | undefined;
      const campos = Object.keys(r).filter((key) => key !== "passwordHash" && JSON.stringify(a?.[key]) !== JSON.stringify(r[key]));
      const detalle = a && a.passwordHash !== r.passwordHash ? "Contraseña actualizada" : a ? campos.map((key) => `${key}: ${typeof a[key] === "object" || typeof r[key] === "object" ? "contenido actualizado" : `${a[key] ?? "—"} → ${r[key] ?? "—"}`}`).join(" · ") : String(r.nombre ?? r.nombreDelGrupo ?? r.ambiente ?? referencia);
      return [{ referencia, accion: a ? "Modificación" : "Alta", detalle }];
    });
    cambiosFila.push(...[...mapa.keys()].map((referencia) => ({ referencia, accion: "Baja", detalle: "Registro eliminado" })));
    return cambiosFila.map((c, indice) => ({ id: `${id}-${campo}-${indice}`, idActor: usuarioActual.idUsuario, fecha, seccion, accion: c.accion, detalle: `${c.referencia} · ${c.detalle}` }));
  });
  if (JSON.stringify(antes.parametros) !== JSON.stringify(despues.parametros)) {
    cambios.push({ id: `${id}-parametros`, idActor: usuarioActual.idUsuario, fecha, seccion: "Parámetros", accion: "Modificación", detalle: Object.entries(despues.parametros).filter(([k, v]) => antes.parametros?.[k as keyof typeof antes.parametros] !== v).map(([k, v]) => `${k}: ${antes.parametros?.[k as keyof typeof antes.parametros] ?? "—"} → ${v}`).join(" · ") });
  }
  return cambios.length ? { ...despues, historialAdministrativo: [...cambios, ...antes.historialAdministrativo] } : despues;
}

export function crearCuentaAlumno(datos: DataState, idAlumno: string, correo: string, idUsuario: string): DataState {
  const alumno = datos.alumnos.find((a) => a.idAlumno === idAlumno);
  if (!alumno) throw new Error("El alumno no existe.");
  if (datos.usuarios.some((u) => u.idAlumno === idAlumno)) throw new Error("El alumno ya tiene una cuenta.");
  if (!contratoVigente(datos.contratos, idAlumno)) throw new Error("Se necesita un contrato vigente para crear el acceso.");
  validarCorreoCuenta(correo, datos.usuarios);
  return { ...datos, alumnos: datos.alumnos.map((a) => a.idAlumno === idAlumno ? { ...a, correo: correo.trim().toLowerCase() } : a), usuarios: [...datos.usuarios, { idUsuario, idAlumno, apellido: alumno.apellido, documento: alumno.documento, nombre: `${alumno.nombre} ${alumno.apellido}`, correo: correo.trim().toLowerCase(), rol: "alumno", estado: "activo", fechaAlta: FECHA_REFERENCIA }] };
}

export function cambiarEstadoCuenta(datos: DataState, idUsuario: string, suspender: boolean): DataState {
  const usuario = datos.usuarios.find((u) => u.idUsuario === idUsuario);
  if (!usuario) throw new Error("La cuenta no existe.");
  if (usuario.idUsuario === usuarioActual.idUsuario) throw new Error("No podés suspender tu propia cuenta.");
  if (usuario.rol === "administrador" && !puedeGestionarAdministradores(datos)) throw new Error("No tenés permiso para gestionar administradores.");
  if (usuario.rol === "alumno" && !suspender && !contratoVigente(datos.contratos, usuario.idAlumno ?? "")) throw new Error("No se puede restablecer el acceso sin contrato vigente.");
  return { ...datos, usuarios: datos.usuarios.map((u) => u.idUsuario === idUsuario ? { ...u, estado: suspender ? "suspendido" : "activo" } : u) };
}
