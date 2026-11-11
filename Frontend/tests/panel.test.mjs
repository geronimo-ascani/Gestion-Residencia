import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && !specifier.match(/\.[a-z]+$/i) && context.parentURL?.endsWith(".ts")) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier, context);
  },
});
const { resumenPanel } = await import("../app/lib/panel.ts");
const { createInitialData } = await import("../app/lib/mock/data.ts");
const { aplicarCobro } = await import("../app/lib/facturacion.ts");

test("el panel separa cobros mensuales, deuda facturada y multas sin duplicar importes", () => {
  const panel = resumenPanel(createInitialData());
  assert.equal(panel.cobradoMes, 630000);
  assert.equal(panel.saldoPendiente, 5000);
  assert.equal(panel.alumnosConSaldo, 1);
  assert.equal(panel.facturasVencidas, 1);
  assert.equal(panel.multasVencidas, 1);
  assert.equal(panel.residentes.length, 14);
  assert.equal(panel.ocupacion.capacidadTotal, 17);
  assert.equal(panel.ocupacion.camasOcupadas, 14);
  assert.equal(panel.habitaciones.reduce((s, h) => s + h.libres, 0), 3);
  assert.equal(panel.porVencer.length, 3);
  assert.equal(panel.sinFacturar.length, 0);
  assert.equal(panel.grupos.reduce((s, g) => s + g.integrantes, 0), 14);
  assert.equal(panel.residentesSinGrupo, 0);
});

test("los pagos parciales y completos actualizan el panel y la deuda de la multa", () => {
  const state = createInitialData();
  const cobro = { idFactura: "F-A03-2026-10", monto: 2000, fecha: "2026-10-20", medio: "efectivo", referencia: "" };
  const parcial = aplicarCobro(state, cobro, "P100");
  assert.equal(resumenPanel(parcial).saldoPendiente, 3000);
  assert.equal(resumenPanel(parcial).cobradoMes, 632000);
  const final = resumenPanel(aplicarCobro(parcial, { ...cobro, monto: 3000 }, "P101"));
  assert.equal(final.saldoPendiente, 0);
  assert.equal(final.pendientes.length, 0);
  assert.equal(final.multasVencidas, 0);
  assert.equal(final.cobradoMes, 635000);
});

test("incluye deuda de otros meses, excluye pagos futuros y señala cuotas sin emitir", () => {
  const state = createInitialData();
  state.pagos = state.pagos.filter((p) => p.idFactura !== "F-A01-2026-09");
  state.pagos.push({ idPago: "futuro", idAlumno: "A01", fecha: "2026-10-21", monto: 99999, concepto: "Futuro" });
  state.facturas = state.facturas.filter((f) => f.idFactura !== "F-A02-2026-10");
  const panel = resumenPanel(state);
  assert.equal(panel.cobradoMes, 630000);
  assert.equal(panel.saldoPendiente, 50000);
  assert.equal(panel.alumnosConSaldo, 2);
  assert.equal(panel.pendientes[0].factura.periodo, "2026-09");
  assert.equal(panel.sinFacturar[0].idContrato, "C02");
});

test("los residentes y grupos excluyen contratos cancelados, históricos y futuros", () => {
  const state = createInitialData();
  state.contratos[0].fechaCancelacion = "2026-10-20";
  state.contratos[1].fechaDesde = "2026-11-01";
  const panel = resumenPanel(state);
  assert.equal(panel.residentes.length, 12);
  assert.equal(panel.grupos.reduce((s, g) => s + g.integrantes, 0), 12);
  assert.equal(panel.porVencer.length, 1);
});

test("maneja una residencia sin datos y muestra cero sin errores", () => {
  const state = createInitialData();
  for (const key of Object.keys(state)) state[key] = [];
  const panel = resumenPanel(state);
  assert.equal(panel.cobradoMes, 0);
  assert.equal(panel.saldoPendiente, 0);
  assert.equal(panel.ocupacion.porcentaje, 0);
  assert.equal(panel.residentes.length, 0);
  assert.equal(panel.grupos.length, 0);
  assert.equal(panel.pendientes.length, 0);
});
