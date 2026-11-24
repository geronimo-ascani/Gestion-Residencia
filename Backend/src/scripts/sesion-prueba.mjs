import { env } from "../config/env.js";

export async function iniciarSesionDePrueba(baseUrl, cuenta, rol) {
  if (env.NODE_ENV === "production") {
    throw new Error("Usá una base de datos de pruebas para esta verificación.");
  }
  const correo = process.env[`RESIDENCIA_TEST_${cuenta}_CORREO`];
  const contrasena = process.env[`RESIDENCIA_TEST_${cuenta}_CLAVE`];
  if (!correo || !contrasena) {
    throw new Error(`Configurá RESIDENCIA_TEST_${cuenta}_CORREO y RESIDENCIA_TEST_${cuenta}_CLAVE.`);
  }
  const respuesta = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ correo, contrasena }),
  });
  if (!respuesta.ok) throw new Error(`Falló el inicio de sesión de prueba: ${respuesta.status}`);
  const { data } = await respuesta.json();
  if (data.usuario.rol !== rol) throw new Error(`La cuenta de prueba debe tener el rol ${rol}.`);
  return data;
}
