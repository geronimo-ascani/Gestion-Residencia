import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !specifier.match(/\.[a-z]+$/i) && context.parentURL?.endsWith(".ts")) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });
const { createInitialData } = await import("./fixtures/data.ts");
const { cargarDatosGuardados } = await import("../app/lib/persistence.ts");
const { aplicarAsignacionHabitacion, esFechaISO, validarAltaAlumno, validarAltaContrato, validarAltaHabitacion } = await import("../app/lib/gestiones.ts");
const { guardarSesion, restaurarSesion, cerrarSesion, usuarioActual } = await import("../app/lib/session.ts");
const { importeMulta } = await import("../app/lib/multas.ts");
const { prepararFactura } = await import("../app/lib/facturacion.ts");
const { requestPasswordReset } = await import("../app/lib/auth.ts");
function almacenamiento() {
  const items = new Map();
  return { getItem: (k) => items.get(k) ?? null, setItem: (k, v) => items.set(k, v), removeItem: (k) => items.delete(k) };
}

test("persistencia recupera datos válidos y migra campos nuevos sin reemplazar registros", () => {
  const data = createInitialData();
  assert.deepEqual(cargarDatosGuardados(JSON.stringify(data)), data);
  delete data.reclamos; delete data.historialAdministrativo; delete data.parametros;
  const migrados = cargarDatosGuardados(JSON.stringify(data));
  assert.deepEqual(migrados.alumnos, data.alumnos);
  assert.deepEqual(migrados.reclamos, []);
  assert.equal(typeof migrados.parametros.cuotaMensual, "number");
  assert.equal(cargarDatosGuardados(null).usuarios[0].idUsuario, "U1");
});
test("datos dañados producen un error recuperable y nunca se reemplazan por ejemplos", () => {
  for (const valor of ["{", "null", "[]", "{}", JSON.stringify({ ...createInitialData(), alumnos: [null] }), JSON.stringify({ ...createInitialData(), facturas: [{ idFactura: "X" }] })]) {
    assert.throws(() => cargarDatosGuardados(valor));
  }
});
test("sesión guarda solo identidad; recordar es opcional y cerrar borra datos de la cuenta anterior", () => {
  const anteriorLocal = globalThis.localStorage, anteriorSesion = globalThis.sessionStorage;
  try {
    globalThis.localStorage = almacenamiento(); globalThis.sessionStorage = almacenamiento();
    assert.equal(restaurarSesion(), null);
    guardarSesion({ ...createInitialData().usuarios[0], passwordHash: "secreto" });
    assert.deepEqual(JSON.parse(sessionStorage.getItem("residencia-sesion")), { idUsuario: "U1" });
    assert.equal(localStorage.getItem("residencia-recordar-sesion"), null);
    assert.equal(restaurarSesion(), "U1");
    guardarSesion({ idUsuario: "TEST", idAlumno: "A03", nombre: "Alumno", correo: "test@example.com", rol: "alumno", estado: "activo" }, true);
    assert.equal(usuarioActual.passwordHash, undefined);
    sessionStorage.removeItem("residencia-sesion");
    assert.equal(restaurarSesion(), "TEST");
    cerrarSesion();
    assert.equal(restaurarSesion(), null); assert.equal(usuarioActual.idAlumno, undefined); assert.equal(usuarioActual.idUsuario, "");
    sessionStorage.setItem("residencia-sesion", "{malformado");
    assert.equal(restaurarSesion(), null);
  } finally { globalThis.localStorage = anteriorLocal; globalThis.sessionStorage = anteriorSesion; }
});
test("altas rechazan documento repetido y habitación duplicada aunque el formato cambie", () => {
  const data = createInitialData();
  assert.throws(() => validarAltaAlumno(data, { ...data.alumnos[0], documento: data.alumnos[0].documento.split("").join(".") }), /existe un alumno/);
  assert.throws(() => validarAltaHabitacion(data, { ...data.habitaciones[0], numeroHabitacion: `0${data.habitaciones[0].numeroHabitacion}` }), /existe una habitación/);
  assert.throws(() => validarAltaHabitacion({ habitaciones: [] }, { ...data.habitaciones[0], capacidadMaxima: 1.5 }), /capacidad/);
});
test("contratos validan fechas reales, alumno, importes, superposición y vencimiento hasta día 31", () => {
  const data = createInitialData(); data.contratos = [];
  const contrato = { idAlumno: data.alumnos[0].idAlumno, fechaDesde: "2026-10-20", fechaHasta: "2026-10-20", montoMensual: 150000, depositoGarantia: 0, diaVencimientoPago: 31 };
  assert.equal(esFechaISO("2026-02-30"), false); assert.equal(esFechaISO("2028-02-29"), true);
  assert.doesNotThrow(() => validarAltaContrato(data, contrato));
  for (const cambio of [{ idAlumno: "otro" }, { fechaHasta: "2026-02-30" }, { montoMensual: NaN }, { montoMensual: 1.005 }, { diaVencimientoPago: 32 }, { depositoGarantia: -1 }]) assert.throws(() => validarAltaContrato(data, { ...contrato, ...cambio }));
  data.contratos = [{ ...contrato, idContrato: "C" }];
  assert.throws(() => validarAltaContrato(data, contrato), /superponen/);
});
test("asignación rechaza habitaciones llenas o inexistentes y conserva el historial", () => {
  const data = createInitialData();
  const alumno = data.alumnos[0]; const habitacion = data.habitaciones[0];
  data.habitaciones = [{ ...habitacion, capacidadMaxima: 1 }, { ...habitacion, idHabitacion: "LIBRE" }];
  data.asignaciones = [{ idAlumno: "OTRO", idHabitacion: habitacion.idHabitacion, fechaDesde: "2020-01-01", fechaHasta: null }, { idAlumno: alumno.idAlumno, idHabitacion: "ANTERIOR", fechaDesde: "2020-01-01", fechaHasta: "2021-01-01" }];
  assert.throws(() => aplicarAsignacionHabitacion(data, alumno.idAlumno, habitacion.idHabitacion), /completa/);
  assert.throws(() => aplicarAsignacionHabitacion(data, alumno.idAlumno, "DESCONOCIDA"), /no existe/);
  const nuevo = aplicarAsignacionHabitacion(data, alumno.idAlumno, "LIBRE");
  assert.deepEqual(nuevo.asignaciones[1], data.asignaciones[1]);
  assert.equal(nuevo.asignaciones.at(-1).idHabitacion, "LIBRE");
  assert.equal(aplicarAsignacionHabitacion(nuevo, alumno.idAlumno, "LIBRE"), nuevo);
});
test("una multa facturada muestra el importe congelado y el concepto respeta el recargo configurado", () => {
  const data = createInitialData(); const multa = data.multas.find((m) => m.idMulta === "M01");
  assert.equal(importeMulta(multa, "2026-10-20").total, 6000);
  assert.equal(importeMulta(multa, "2026-10-20", data.facturas).total, 5000);
  data.facturas = []; data.multas = [{ ...multa, recargoPorcentaje: 12.5 }];
  const factura = prepararFactura(data, data.contratos.find((c) => c.idAlumno === multa.idAlumno).idContrato, "2026-10", "TEST");
  assert.match(factura.detalles.find((d) => d.idMulta === multa.idMulta).concepto, /12\.5%/);
});
test("recuperación de contraseña no presenta el HTML del servidor como un envío exitoso", async () => {
  const fetchAnterior = globalThis.fetch;
  try { globalThis.fetch = async () => new Response("<html></html>", { status: 200, headers: { "content-type": "text/html" } });
    assert.match((await requestPasswordReset("test@example.com")).error, /no está disponible/);
  } finally { globalThis.fetch = fetchAnterior; }
});
