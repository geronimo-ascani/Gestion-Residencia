import type { Usuario } from "./types";

/**
 * Usuario logueado (mock). Al conectar la autenticación real, reemplazar por
 * la sesión del servidor. El campo `rol` ya permite distinguir administrador
 * de alumno para el futuro portal del residente.
 */
export const USUARIO_ADMIN_INICIAL: Usuario = {
  idUsuario: "U1",
  nombre: "Ana Pérez",
  apellido: "Pérez",
  documento: "30000123",
  correo: "ana@residencia.ar",
  rol: "administrador",
  estado: "activo",
  gestionaAdministradores: true,
  fechaAlta: "2026-01-01",
};

export const usuarioActual: Usuario = { ...USUARIO_ADMIN_INICIAL };

const SESION_KEY = "residencia-sesion";
const RECORDAR_KEY = "residencia-recordar-sesion";

function reemplazarUsuario(usuario: Usuario) {
  for (const clave of Object.keys(usuarioActual)) delete (usuarioActual as unknown as Record<string, unknown>)[clave];
  Object.assign(usuarioActual, usuario);
}

export function restaurarSesion() {
  try {
    const guardada = sessionStorage.getItem(SESION_KEY) ?? localStorage.getItem(RECORDAR_KEY);
    if (!guardada) return null;
    const valor: unknown = JSON.parse(guardada);
    return typeof valor === "object" && valor !== null && "idUsuario" in valor && typeof valor.idUsuario === "string" ? valor.idUsuario : null;
  } catch { return null; }
}
export function guardarSesion(usuario: Usuario, recordar = false) {
  const referencia = JSON.stringify({ idUsuario: usuario.idUsuario });
  sessionStorage.setItem(SESION_KEY, referencia);
  if (recordar) localStorage.setItem(RECORDAR_KEY, referencia);
  else localStorage.removeItem?.(RECORDAR_KEY);
  reemplazarUsuario(usuario);
}

export function sincronizarUsuario(usuario: Usuario) { reemplazarUsuario(usuario); }

export function cerrarSesion() {
  try { sessionStorage.removeItem(SESION_KEY); } catch { /* El cierre en memoria debe completarse aun si el navegador bloquea el almacenamiento. */ }
  try { localStorage.removeItem?.(RECORDAR_KEY); } catch { /* La sesión recordada tampoco se puede leer mientras esté bloqueado. */ }
  reemplazarUsuario({ idUsuario: "", nombre: "", correo: "", rol: "alumno", estado: "inactivo" });
}
