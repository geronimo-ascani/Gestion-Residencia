import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !specifier.match(/\.[a-z]+$/i) && context.parentURL?.endsWith(".ts")) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });
const { createInitialData } = await import("../app/lib/mock/data.ts");
const { cambiarEstadoCuenta, crearCuentaAlumno, estadoAcceso, puedeGestionarAdministradores, registrarCambios, validarCorreoCuenta } = await import("../app/lib/administracion.ts");
const { FECHA_REFERENCIA } = await import("../app/lib/config.ts");
function escenario() {
  const datos = createInitialData();
  const alumno = datos.alumnos[0];
  datos.usuarios = datos.usuarios.filter((u) => u.rol === "administrador");
  datos.contratos = [{ idContrato: "C_TEST", idAlumno: alumno.idAlumno, fechaDesde: "2020-01-01", fechaHasta: "2030-12-31" }];
  return { datos, alumno };
}

test("alumno registrado puede existir sin cuenta y crearla requiere contrato y correo único", () => {
  const { datos, alumno } = escenario();
  assert.equal(estadoAcceso(undefined, datos), "sin-cuenta");
  assert.throws(() => crearCuentaAlumno({ ...datos, contratos: [] }, alumno.idAlumno, "test@example.com", "UT"), /contrato vigente/);
  assert.throws(() => crearCuentaAlumno(datos, alumno.idAlumno, "", "UT"), /correo válido/);
  assert.throws(() => crearCuentaAlumno(datos, alumno.idAlumno, " ANA@RESIDENCIA.AR ", "UT"), /existe una cuenta/);
  const despues = crearCuentaAlumno(datos, alumno.idAlumno, " TEST@EXAMPLE.COM ", "UT");
  assert.equal(despues.usuarios.at(-1).estado, "activo");
  assert.equal(despues.alumnos[0].correo, "test@example.com");
  assert.throws(() => crearCuentaAlumno(despues, alumno.idAlumno, "otro@example.com", "UT2"), /ya tiene/);
  assert.throws(() => validarCorreoCuenta("incorrecto", []), /válido/);
});

test("vencimiento y baja impiden acceso; renovar no levanta una suspensión manual", () => {
  const { datos, alumno } = escenario();
  const u = { idUsuario: "UT", idAlumno: alumno.idAlumno, nombre: "Alumno", correo: "a@example.com", rol: "alumno", estado: "activo" };
  assert.equal(estadoAcceso(u, datos), "activo");
  assert.equal(estadoAcceso(u, { contratos: [{ ...datos.contratos[0], fechaHasta: "2020-12-31" }] }), "sin-contrato");
  assert.equal(estadoAcceso(u, { contratos: [{ ...datos.contratos[0], fechaCancelacion: FECHA_REFERENCIA }] }), "sin-contrato");
  assert.equal(estadoAcceso({ ...u, estado: "suspendido" }, datos), "suspendido");
  assert.equal(estadoAcceso({ ...u, estado: "pendiente" }, datos), "pendiente");
});

test("protege cuenta propia y gestión de administradores; restablecer habilita la cuenta", () => {
  const { datos, alumno } = escenario();
  assert.equal(puedeGestionarAdministradores(datos), true);
  assert.throws(() => cambiarEstadoCuenta(datos, "U1", true), /propia cuenta/);
  const administrador = { ...datos.usuarios[0], idUsuario: "U_OTRO", estado: "activo" };
  const sinPermiso = { ...datos, usuarios: [{ ...datos.usuarios[0], gestionaAdministradores: false }, administrador] };
  assert.equal(puedeGestionarAdministradores(sinPermiso), false);
  assert.throws(() => cambiarEstadoCuenta(sinPermiso, "U_OTRO", true), /permiso/);
  const creado = crearCuentaAlumno(datos, alumno.idAlumno, "a@example.com", "UT");
  const suspendido = cambiarEstadoCuenta(creado, "UT", true);
  assert.equal(suspendido.usuarios.at(-1).estado, "suspendido");
  assert.throws(() => cambiarEstadoCuenta({ ...suspendido, contratos: [] }, "UT", false), /contrato vigente/);
  assert.equal(cambiarEstadoCuenta(suspendido, "UT", false).usuarios.at(-1).estado, "activo");
});

test("historial registra autor, entidad y valores anteriores; ignora operaciones sin cambios", () => {
  const { datos } = escenario();
  assert.equal(registrarCambios(datos, datos, "2026-11-14T12:00:00Z", "AUD1"), datos);
  const despues = { ...datos, usuarios: datos.usuarios.map((u) => ({ ...u, nombre: "Ana Actualizada" })) };
  const auditado = registrarCambios(datos, despues, "2026-11-14T12:00:00Z", "AUD2");
  assert.equal(auditado.historialAdministrativo.length, 1);
  assert.equal(auditado.historialAdministrativo[0].idActor, "U1");
  assert.match(auditado.historialAdministrativo[0].detalle, /Ana Pérez → Ana Actualizada/);
  assert.equal(datos.historialAdministrativo.length, 0);
});

const { claveInicial, hashClave } = await import("../app/lib/credenciales.ts");
test("contraseña inicial usa primer apellido y últimos tres dígitos, conservando mayúsculas y acentos", () => {
  assert.equal(claveInicial(" Pérez Gómez ", "30.000.123"), "Pérez123");
  assert.equal(claveInicial("López", "46000001"), "López001");
  assert.throws(() => claveInicial("", "123"));
  assert.throws(() => claveInicial("Pérez", "12"));
});
test("cuentas de ejemplo tienen correo, apellido y documento para ingresar", () => {
  for (const u of createInitialData().usuarios) {
    assert.ok(u.correo); assert.ok(claveInicial(u.apellido, u.documento));
  }
});
test("hash de contraseña permite comparar sin almacenar el texto", async () => {
  assert.equal(await hashClave("Pérez123"), await hashClave("Pérez123"));
  assert.notEqual(await hashClave("Pérez123"), await hashClave("Perez123"));
});

test("login valida claves iniciales y personalizadas, y rechaza cuentas suspendidas", async () => {
  const datos = createInitialData();
  let guardado = JSON.stringify(datos);
  globalThis.localStorage = { getItem: () => guardado };
  globalThis.sessionStorage = { setItem: () => {} };
  const { signInWithEmail } = await import("../app/lib/auth.ts");
  assert.deepEqual(await signInWithEmail({ email: "ana@residencia.ar", password: "Pérez123" }), {});
  assert.ok((await signInWithEmail({ email: "ana@residencia.ar", password: "incorrecta" })).error);
  datos.usuarios[0].passwordHash = await hashClave("NuevaClave123");
  guardado = JSON.stringify(datos);
  assert.ok((await signInWithEmail({ email: "ana@residencia.ar", password: "Pérez123" })).error);
  assert.deepEqual(await signInWithEmail({ email: "ana@residencia.ar", password: "NuevaClave123" }), {});
  datos.usuarios[0].estado = "suspendido"; guardado = JSON.stringify(datos);
  assert.ok((await signInWithEmail({ email: "ana@residencia.ar", password: "NuevaClave123" })).error);
});

test("parámetros validan rangos y decimales, conservando los importes anteriores", async () => {
 const { PARAMETROS_INICIALES, validarParametros, arancelesMulta } = await import("../app/lib/parametros.ts");
 const { importeMulta, TIPOS_MULTA } = await import("../app/lib/multas.ts");
 const nuevos = { ...PARAMETROS_INICIALES, multaLeve: 12500, recargoMulta: 30 };
 assert.doesNotThrow(() => validarParametros(nuevos));
 for (const cambio of [{ multaLeve: 0 }, { diaVencimiento: 32 }, { duracionContrato: 1.5 }, { recargoMulta: NaN }, { deposito: -1 }]) assert.throws(() => validarParametros({ ...nuevos, ...cambio }));
 assert.equal(arancelesMulta(TIPOS_MULTA, nuevos)[0].monto, 12500);
 assert.equal(TIPOS_MULTA[0].monto, 10000);
 const multa = { monto: 10000, estado: "pendiente", fechaVence: "2020-01-01" };
 assert.equal(importeMulta(multa).recargo, 2000);
 assert.equal(importeMulta({ ...multa, recargoPorcentaje: nuevos.recargoMulta }).recargo, 3000);
 const datos = createInitialData();
 const resultado = registrarCambios(datos, { ...datos, parametros: nuevos }, "2026-11-14T12:00:00Z", "PARAM_TEST");
 assert.ok(resultado.historialAdministrativo.some((c) => c.seccion === "Parámetros" && c.detalle.includes("12500")));
 assert.deepEqual(resultado.facturas, datos.facturas);
});
