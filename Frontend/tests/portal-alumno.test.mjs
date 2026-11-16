import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && !specifier.match(/\.[a-z]+$/i) && context.parentURL?.endsWith(".ts")) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier, context);
  },
});
const { datosPortalAlumno, rotacionMesAlumno } = await import("../app/lib/portal-alumno.ts");
const { createInitialData } = await import("../app/lib/mock/data.ts");
const { aplicarCobro } = await import("../app/lib/facturacion.ts");
const { FECHA_REFERENCIA } = await import("../app/lib/config.ts");
const { proximaFacturaAlumno } = await import("../app/lib/proxima-factura.ts");
const alumno = (state, id) => state.usuarios.find((u) => u.idAlumno === id);

test("cada alumno ve exclusivamente sus contratos, facturas, pagos y multas", () => {
  const state = createInitialData();
  for (const usuario of state.usuarios.filter((u) => u.rol === "alumno")) {
    const portal = datosPortalAlumno(state, usuario);
    assert.equal(portal.alumno.idAlumno, usuario.idAlumno);
    for (const lista of [portal.contratos, portal.facturas, portal.pagos, portal.multas]) {
      assert.ok(lista.every((registro) => registro.idAlumno === usuario.idAlumno));
    }
    assert.equal(portal.facturas.find((f) => f.idAlumno !== usuario.idAlumno), undefined);
    assert.ok(portal.integrantes.every((nombre) => typeof nombre === "string"));
  }
});

test("no expone registros si falta la vinculación o la cuenta es administradora", () => {
  const state = createInitialData();
  state.pagos.push({ idPago: "sin-titular", monto: 123, fecha: FECHA_REFERENCIA, concepto: "Sin titular" });
  for (const usuario of [state.usuarios[0], { ...alumno(state, "A01"), idAlumno: undefined }, { ...alumno(state, "A01"), idAlumno: "inexistente" }]) {
    const portal = datosPortalAlumno(state, usuario);
    assert.equal(portal.alumno, undefined);
    assert.equal(portal.habitacion, undefined);
    assert.equal(portal.grupo, undefined);
    assert.equal(portal.saldo, 0);
    for (const lista of [portal.contratos, portal.facturas, portal.pagos, portal.multas]) assert.deepEqual(lista, []);
  }
});

test("el saldo y los avisos se actualizan con pagos parciales y totales sin duplicar multas", () => {
  const state = createInitialData();
  const usuario = alumno(state, "A03");
  const portal = datosPortalAlumno(state, usuario);
  assert.equal(portal.saldo, 5000);
  assert.ok(portal.avisos.some((a) => a.id === "F-A03-2026-10"));
  const cobro = { idFactura: "F-A03-2026-10", monto: 2000, fecha: FECHA_REFERENCIA, medio: "efectivo", referencia: "" };
  const parcial = aplicarCobro(state, cobro, "P100");
  assert.equal(datosPortalAlumno(parcial, usuario).saldo, 3000);
  const final = datosPortalAlumno(aplicarCobro(parcial, { ...cobro, monto: 3000 }, "P101"), usuario);
  assert.equal(final.saldo, 0);
  assert.equal(final.pendientes.length, 0);
  assert.ok(!final.avisos.some((a) => a.id === cobro.idFactura));
});

test("las asignaciones históricas no se muestran como vigentes y se avisa cuando faltan", () => {
  const state = createInitialData();
  const usuario = alumno(state, "A01");
  state.asignaciones = state.asignaciones.map((a) => a.idAlumno === "A01" ? { ...a, fechaHasta: FECHA_REFERENCIA } : a);
  state.grupoAlumnos = state.grupoAlumnos.filter((a) => a.idAlumno !== "A01");
  const portal = datosPortalAlumno(state, usuario);
  assert.equal(portal.habitacion, undefined);
  assert.equal(portal.grupo, undefined);
  assert.equal(portal.tarea, undefined);
  assert.ok(portal.avisos.some((a) => a.id === "habitacion"));
  assert.ok(portal.avisos.some((a) => a.id === "grupo"));
});

test("los pagos futuros no ocultan deuda actual", () => {
  const state = createInitialData();
  state.pagos.push({ idPago: "futuro", idAlumno: "A03", idFactura: "F-A03-2026-10", monto: 5000, fecha: "2099-01-01", concepto: "Futuro" });
  assert.equal(datosPortalAlumno(state, alumno(state, "A03")).saldo, 5000);
});


test("la habitación muestra solo ocupantes vigentes y únicamente sus nombres", () => {
  const state = createInitialData();
  const usuario = alumno(state, "A01");
  const portal = datosPortalAlumno(state, usuario);
  assert.equal(portal.ocupantesHabitacion.length, 2);
  assert.equal(portal.ocupantesHabitacion.filter((o) => o.esActual).length, 1);
  assert.ok(portal.ocupantesHabitacion.some((o) => o.nombre === "Martina López"));
  assert.ok(portal.ocupantesHabitacion.every((o) => Object.keys(o).sort().join(",") === "esActual,nombre"));
  state.asignaciones = state.asignaciones.map((a) => a.idAlumno === "A02" ? { ...a, fechaHasta: FECHA_REFERENCIA } : a);
  const actualizado = datosPortalAlumno(state, usuario);
  assert.equal(actualizado.ocupantesHabitacion.length, 1);
  assert.equal(actualizado.ocupantesHabitacion[0].esActual, true);
});

test("el calendario mensual respeta los límites del mes y las semanas de la residencia", () => {
  const state = createInitialData();
  const octubre = rotacionMesAlumno(2, state.tareasLimpieza, "2026-10-20");
  assert.equal(octubre.length, 5);
  assert.equal(octubre[0].desde, "2026-10-01");
  assert.equal(octubre[0].hasta, "2026-10-07");
  assert.equal(octubre[4].desde, "2026-10-29");
  assert.equal(octubre[4].hasta, "2026-10-31");
  assert.deepEqual(octubre.filter((s) => s.actual).map((s) => s.semana), [3]);
  const febrero = rotacionMesAlumno(2, state.tareasLimpieza, "2027-02-28");
  assert.equal(febrero.length, 4);
  assert.equal(febrero[3].hasta, "2027-02-28");
  assert.equal(febrero[3].actual, true);
  const bisiesto = rotacionMesAlumno(2, state.tareasLimpieza, "2028-02-29");
  assert.equal(bisiesto.length, 5);
  assert.equal(bisiesto[4].hasta, "2028-02-29");
  assert.equal(bisiesto[4].actual, true);
});

test("el calendario corresponde al grupo del alumno y tolera tareas sin configurar", () => {
  const state = createInitialData();
  const usuario = alumno(state, "A03");
  const portal = datosPortalAlumno(state, usuario);
  assert.equal(portal.rotacion.find((s) => s.actual).tarea.numero, portal.tarea.numero);
  assert.equal(rotacionMesAlumno(1, [], FECHA_REFERENCIA)[0].tarea, undefined);
  state.grupoAlumnos = [];
  assert.deepEqual(datosPortalAlumno(state, usuario).rotacion, []);
});


test("próxima factura estima la cuota siguiente sin duplicar meses ya emitidos", () => {
  const state = createInitialData();
  const p = datosPortalAlumno(state, alumno(state, "A01"));
  assert.equal(p.proximaFactura.periodo, "2026-11");
  assert.equal(p.proximaFactura.fechaVence, "2026-11-10");
  assert.equal(p.proximaFactura.monto, 45000);
  assert.equal(p.proximaFactura.estimada, true);
  state.facturas.push({ ...state.facturas[0], idFactura: "noviembre", idContrato: "C01", idAlumno: "A01", periodo: "2026-11", fechaVence: "2026-11-10" });
  const actualizada = datosPortalAlumno(state, alumno(state, "A01"));
  assert.equal(actualizada.proximaFactura.estimada, false);
  assert.equal(actualizada.proximaFactura.idFactura, "noviembre");
});

test("la previsión respeta bajas, finalización y contratos sin arancel", () => {
  const base = { idContrato: "C", idAlumno: "A", fechaDesde: "2026-03-01", fechaHasta: "2026-10-31", montoMensual: 45000 };
  assert.equal(proximaFacturaAlumno([base], [], []), undefined);
  assert.equal(proximaFacturaAlumno([{ ...base, fechaHasta: "2027-02-28", fechaCancelacion: "2026-10-25" }], [], []), undefined);
  assert.equal(proximaFacturaAlumno([{ ...base, fechaHasta: "2027-02-28", montoMensual: undefined }], [], []), undefined);
});

test("la próxima cuota ajusta días de vencimiento y contempla ingresos programados", () => {
  const contrato = { idContrato: "C", idAlumno: "A", fechaDesde: "2027-02-15", fechaHasta: "2027-12-31", montoMensual: 12345, diaVencimientoPago: 31 };
  const proxima = proximaFacturaAlumno([contrato], [], [], "2027-01-20");
  assert.equal(proxima.fechaVence, "2027-02-28");
  assert.equal(proxima.monto, 12345);
});

test("el portal conserva contratos vigentes, anteriores y sus datos de baja", () => {
  const state = createInitialData();
  const lucia = datosPortalAlumno(state, alumno(state, "A01"));
  assert.deepEqual(lucia.contratos.map((c) => c.idContrato), ["C01", "C15"]);
  const martina = datosPortalAlumno(state, alumno(state, "A02"));
  const anterior = martina.contratos.find((c) => c.idContrato === "C16");
  assert.equal(anterior.fechaCancelacion, "2025-10-01");
  assert.ok(anterior.motivoCancelacion);
});
