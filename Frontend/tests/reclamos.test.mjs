import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !specifier.match(/\.[a-z]+$/i) && context.parentURL?.endsWith(".ts")) return nextResolve(`${specifier}.ts`, context);
  return nextResolve(specifier, context);
} });
const { createInitialData } = await import("../app/lib/mock/data.ts");
const { prepararReclamo, actualizarReclamo, reclamosVisibles, ubicacionesReclamo, validarReclamo, listarReclamosAdministracion } = await import("../app/lib/reclamos.ts");
const { datosPortalAlumno } = await import("../app/lib/portal-alumno.ts");
const alumno = (s, id = "A01") => s.usuarios.find((u) => u.idAlumno === id);
const fecha = "2026-11-14T15:00:00.000Z";
const input = { tipo: "problema", categoria: "mantenimiento", asunto: "La luz no enciende", descripcion: "La luminaria junto a la ventana no enciende desde ayer.", ubicacion: "general", detalleUbicacion: "Ventana", prioridad: "normal" };
function conReclamo() {
  const state = createInitialData();
  state.reclamos = [prepararReclamo(state, alumno(state), input, "R1", fecha)];
  return state;
}

test("crea una presentación con identidad de la cuenta, datos normalizados y seguimiento inicial", () => {
  const s = createInitialData();
  const r = prepararReclamo(s, { ...alumno(s), idAlumno: "A02" }, { ...input, asunto: `  ${input.asunto} ` }, "R1", fecha);
  assert.equal(r.idAlumno, "A01");
  assert.equal(r.asunto, input.asunto);
  assert.equal(r.estado, "pendiente");
  assert.equal(r.historial.length, 1);
  assert.equal(r.historial[0].tipo, "creacion");
  assert.equal(s.reclamos.length, 0);
});

test("valida asunto, descripción, enumeraciones y ubicación; no admite habitación de otro alumno", () => {
  const s = createInitialData();
  const lugares = ubicacionesReclamo(s, "A01");
  assert.ok(lugares.some((u) => u.id === "habitacion:H1"));
  assert.ok(!lugares.some((u) => u.id === "habitacion:H2"));
  assert.ok(!lugares.some((u) => u.id === "ambiente:AM2"));
  const errores = validarReclamo({ ...input, tipo: "otro", categoria: "sin-categoria", asunto: " ", descripcion: "muy breve", ubicacion: "habitacion:H2", prioridad: "urgente", detalleUbicacion: "x".repeat(121) }, lugares);
  assert.deepEqual(Object.keys(errores).sort(), ["tipo", "categoria", "asunto", "descripcion", "ubicacion", "prioridad", "detalleUbicacion"].sort());
  assert.throws(() => prepararReclamo(s, alumno(s), { ...input, ubicacion: "habitacion:H2" }, "R1", fecha), /ubicación/);
  assert.equal(validarReclamo({ ...input, descripcion: "x".repeat(3001) }, lugares).descripcion.length > 0, true);
});

test("un alumno ve solo sus casos; administración puede verlos todos", () => {
  const s = conReclamo();
  assert.equal(reclamosVisibles(s, alumno(s)).length, 1);
  assert.equal(reclamosVisibles(s, alumno(s, "A02")).length, 0);
  assert.equal(reclamosVisibles(s, s.usuarios[0]).length, 1);
  assert.throws(() => actualizarReclamo(s, alumno(s, "A02"), "R1", "Mensaje ajeno", undefined, "E1", fecha), /no está disponible/);
});

test("cuentas suspendidas, inexistentes y administradores no pueden crear casos de alumnos", () => {
  const s = createInitialData();
  assert.throws(() => prepararReclamo(s, s.usuarios[0], input, "R1", fecha), /alumno activo/);
  const u = alumno(s); s.usuarios = s.usuarios.map((c) => c.idUsuario === u.idUsuario ? { ...c, estado: "suspendido" } : c);
  assert.throws(() => prepararReclamo(s, u, input, "R1", fecha), /no tiene acceso/);
  assert.deepEqual(reclamosVisibles(s, u), []);
});

test("alumno agrega detalles sin modificar estado ni datos originales", () => {
  const s = conReclamo();
  const nuevo = actualizarReclamo(s, alumno(s), "R1", "Agrego información para la revisión.", undefined, "E1", "2026-11-14T16:00:00.000Z");
  assert.equal(nuevo.reclamos[0].historial.length, 2);
  assert.equal(s.reclamos[0].historial.length, 1);
  assert.equal(nuevo.reclamos[0].estado, "pendiente");
  assert.equal(nuevo.reclamos[0].descripcion, input.descripcion);
  assert.throws(() => actualizarReclamo(s, alumno(s), "R1", "Intento resolver", "resuelto", "E2", fecha), /Solo administración/);
});

test("administración responde, actualiza estado y genera avisos para el titular", () => {
  const s = conReclamo();
  const nuevo = actualizarReclamo(s, s.usuarios[0], "R1", "El técnico revisará la luminaria.", "en_revision", "E1", "2026-11-14T16:00:00.000Z");
  assert.equal(nuevo.reclamos[0].estado, "en_revision");
  assert.equal(nuevo.reclamos[0].historial[1].rol, "administrador");
  const aviso = datosPortalAlumno(nuevo, alumno(s)).avisos.find((a) => a.id === "reclamo-E1");
  assert.equal(aviso.to, "/estudiante/reclamos/R1");
  assert.ok(!datosPortalAlumno(nuevo, alumno(s, "A02")).avisos.some((a) => a.id === "reclamo-E1"));
  const resuelto = actualizarReclamo(nuevo, s.usuarios[0], "R1", "La luminaria fue reparada.", "resuelto", "E2", "2026-11-14T17:00:00.000Z");
  assert.equal(resuelto.reclamos[0].estado, "resuelto");
  assert.throws(() => actualizarReclamo(resuelto, alumno(s), "R1", "Nuevo mensaje", undefined, "E3", fecha), /cerrada/);
});

test("cancelar conserva el historial y bloquea nuevas actualizaciones", () => {
  const s = conReclamo();
  const cancelado = actualizarReclamo(s, alumno(s), "R1", "Ya no necesito esta gestión.", "cancelado", "E1", fecha);
  assert.equal(cancelado.reclamos[0].estado, "cancelado");
  assert.equal(cancelado.reclamos[0].historial.length, 2);
  assert.throws(() => actualizarReclamo(cancelado, s.usuarios[0], "R1", "Responder después", undefined, "E2", fecha), /cerrada/);
});

test("rechaza mensajes vacíos y estados arbitrarios", () => {
  const s = conReclamo();
  assert.throws(() => actualizarReclamo(s, alumno(s), "R1", "   ", undefined, "E1", fecha), /entre 5 y 2000/);
  assert.throws(() => actualizarReclamo(s, s.usuarios[0], "R1", "Cambio de estado", "inexistente", "E1", fecha), /no es válido/);
});


test("los datos iniciales conservan administración aunque la sesión actual sea de un alumno", async () => {
  const { usuarioActual } = await import("../app/lib/session.ts");
  const anterior = { ...usuarioActual };
  try {
    Object.assign(usuarioActual, { ...alumno(createInitialData()), rol: "alumno" });
    const datos = createInitialData();
    assert.equal(datos.usuarios[0].rol, "administrador");
    assert.equal(datos.usuarios[0].idUsuario, "U1");
    assert.ok(datos.usuarios.some((u) => u.rol === "alumno" && u.idAlumno === "A01"));
  } finally {
    for (const key of Object.keys(usuarioActual)) delete usuarioActual[key];
    Object.assign(usuarioActual, anterior);
  }
});


test("la bandeja administrativa combina vistas, estados, tipo, categoría y prioridad", () => {
  const s = conReclamo();
  s.reclamos.push({ ...s.reclamos[0], idReclamo: "R2", idAlumno: "A02", tipo: "solicitud", categoria: "administracion", prioridad: "alta", estado: "en_revision" });
  s.reclamos.push({ ...s.reclamos[0], idReclamo: "R3", estado: "resuelto" });
  assert.equal(listarReclamosAdministracion(s, s.usuarios[0], { vista: "abiertos" }).length, 2);
  assert.deepEqual(listarReclamosAdministracion(s, s.usuarios[0], { vista: "cerrados" }).map((r) => r.idReclamo), ["R3"]);
  assert.deepEqual(listarReclamosAdministracion(s, s.usuarios[0], { vista: "abiertos", estado: "en_revision", tipo: "solicitud", categoria: "administracion", prioridad: "alta" }).map((r) => r.idReclamo), ["R2"]);
  assert.equal(listarReclamosAdministracion(s, s.usuarios[0], { categoria: "convivencia" }).length, 0);
});

test("la búsqueda administrativa admite nombre sin acentos, documento y asunto", () => {
  const s = conReclamo();
  assert.equal(listarReclamosAdministracion(s, s.usuarios[0], { busqueda: "lucia fernandez" }).length, 1);
  assert.equal(listarReclamosAdministracion(s, s.usuarios[0], { busqueda: "46000001" }).length, 1);
  assert.equal(listarReclamosAdministracion(s, s.usuarios[0], { busqueda: "luz no enciende" }).length, 1);
  assert.equal(listarReclamosAdministracion(s, s.usuarios[0], { busqueda: "inexistente" }).length, 0);
});

test("la bandeja prioriza casos abiertos de prioridad alta y permite ordenar por antigüedad", () => {
  const s = conReclamo();
  s.reclamos[0].fechaCreacion = "2026-11-01T10:00:00Z";
  s.reclamos.push({ ...s.reclamos[0], idReclamo: "R2", prioridad: "alta", fechaCreacion: "2026-11-02T10:00:00Z" });
  s.reclamos.push({ ...s.reclamos[0], idReclamo: "R3", prioridad: "alta", estado: "resuelto", fechaCreacion: "2026-11-03T10:00:00Z" });
  assert.deepEqual(listarReclamosAdministracion(s, s.usuarios[0], { orden: "prioridad" }).map((r) => r.idReclamo), ["R2", "R1", "R3"]);
  assert.deepEqual(listarReclamosAdministracion(s, s.usuarios[0], { orden: "antiguos" }).map((r) => r.idReclamo), ["R1", "R2", "R3"]);
});

test("un alumno no puede acceder a la bandeja de gestión ni simulando el rol administrativo", () => {
  const s = conReclamo();
  const u = alumno(s);
  assert.deepEqual(listarReclamosAdministracion(s, u), []);
  assert.deepEqual(listarReclamosAdministracion(s, { ...u, rol: "administrador" }), []);
});
