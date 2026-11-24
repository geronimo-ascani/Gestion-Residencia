import type { Usuario } from "./types";

const invitado: Usuario = { idUsuario: "", nombre: "", correo: "", rol: "alumno", estado: "inactivo" };

export const usuarioActual: Usuario = { ...invitado };

export function sincronizarUsuario(usuario: Usuario | null) {
  for (const clave of Object.keys(usuarioActual)) {
    delete (usuarioActual as unknown as Record<string, unknown>)[clave];
  }
  Object.assign(usuarioActual, usuario ?? invitado);
}

export function limpiarDatosDeSesionAnteriores() {
  try {
    for (const key of ["residencia-datos-v1", "residencia-recordar-sesion", "residencia_token"]) {
      localStorage.removeItem(key);
    }
  } catch {}
  try {
    for (const key of ["residencia-sesion", "residencia_token"]) {
      sessionStorage.removeItem(key);
    }
  } catch {}
}

export const CAMBIO_DE_SESION = "residencia:cambio-de-sesion";

export function notificarCambioDeSesion() {
  if (typeof BroadcastChannel === "undefined") return;
  const canal = new BroadcastChannel(CAMBIO_DE_SESION);
  canal.postMessage(null);
  canal.close();
}

export async function cerrarSesion() {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    headers: {
      "X-Residencia-Request": "browser",
      ...(usuarioActual.idUsuario ? { "X-Residencia-Account": usuarioActual.idUsuario } : {}),
    },
    credentials: "same-origin",
  });
  if (!res.ok && res.status !== 401) {
    throw new Error("No pudimos cerrar la sesión. Volvé a intentar.");
  }
  limpiarDatosDeSesionAnteriores();
  sincronizarUsuario(null);
  notificarCambioDeSesion();
}
