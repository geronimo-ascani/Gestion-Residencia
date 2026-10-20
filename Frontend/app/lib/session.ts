import type { Usuario } from "./types";

/**
 * Usuario logueado (mock). Al conectar la autenticación real, reemplazar por
 * la sesión del servidor. El campo `rol` ya permite distinguir administrador
 * de alumno para el futuro portal del residente.
 */
export const usuarioActual: Usuario = {
  idUsuario: "U1",
  nombre: "Ana Pérez",
  correo: "ana@residencia.ar",
  rol: "administrador",
  estado: "activo",
};
