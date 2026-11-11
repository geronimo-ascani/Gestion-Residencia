import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && !specifier.match(/\.[a-z]+$/i) && context.parentURL?.endsWith(".ts")) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier, context);
  },
});
const { aplicarCobro, correspondeCuota, estadoFactura, prepararFactura, saldoFactura, totalFactura } = await import("../app/lib/facturacion.ts");
const { createInitialData } = await import("../app/lib/mock/data.ts");
const { FECHA_REFERENCIA } = await import("../app/lib/config.ts");
const { formatARS } = await import("../app/lib/format.ts");

function escenario() {
  const state = createInitialData();
  state.facturas = [];
  state.pagos = [];
  const factura = prepararFactura(state, "C03", "2026-10", "F1");
  state.facturas = [factura];
  return { state, factura };
}
const cobro = { idFactura: "F1", monto: 10000, fecha: FECHA_REFERENCIA, medio: "efectivo", referencia: "" };

test("cada mes de estadía tiene cuota completa, incluyendo meses parciales y excluyendo meses sin estadía", () => {
  const contrato = { idContrato: "C", idAlumno: "A", fechaDesde: "2026-03-29", fechaHasta: "2026-06-01" };
  assert.ok(correspondeCuota(contrato, "2026-03"));
  assert.ok(correspondeCuota(contrato, "2026-06"));
  assert.equal(correspondeCuota(contrato, "2026-02"), false);
  assert.equal(correspondeCuota(contrato, "2026-07"), false);
  assert.equal(correspondeCuota({ ...contrato, fechaCancelacion: "2026-06-01" }, "2026-06"), false);
  assert.equal(correspondeCuota({ ...contrato, fechaCancelacion: contrato.fechaDesde }, "2026-03"), false);
  for (const periodo of ["2026-13", "2027-01", "", "2026-00"]) assert.equal(correspondeCuota(contrato, periodo), false);
});

test("incluye multas y recargos aplicables, conserva el importe y evita duplicar cuotas y multas", () => {
  const { state, factura } = escenario();
  assert.equal(totalFactura(factura), 51000);
  assert.equal(factura.detalles[1].idMulta, "M01");
  assert.equal(factura.fechaVence, "2026-10-10");
  assert.throws(() => prepararFactura(state, "C03", "2026-10", "F2"), /ya fue facturada/);
  state.multas[0].monto = 9999;
  assert.equal(totalFactura(factura), 51000);
  state.contratos.push({ ...state.contratos[2], idContrato: "C99" });
  assert.equal(prepararFactura(state, "C99", "2026-10", "F2").detalles.length, 1);
});

test("excluye multas pagadas, anuladas, de otro alumno, posteriores al período o con primer período futuro", () => {
  const { state } = escenario();
  state.facturas = [];
  state.multas = state.multas.flatMap((m) => m.idMulta !== "M01" ? [] : [
    { ...m, idMulta: "pagada", estado: "pagada" }, { ...m, idMulta: "anulada", estado: "anulada" },
    { ...m, idMulta: "futura", periodoDesde: "2026-11" }, { ...m, idMulta: "otro", idAlumno: "A01" },
  ]);
  assert.equal(prepararFactura(state, "C03", "2026-10", "F2").detalles.length, 1);
});

test("los cobros parciales reducen deuda; saldar la factura paga sus multas sin mutar el estado anterior", () => {
  const { state, factura } = escenario();
  const parcial = aplicarCobro(state, cobro, "P1");
  assert.equal(saldoFactura(factura, parcial.pagos), 41000);
  assert.equal(estadoFactura(factura, parcial.pagos), "vencida");
  assert.equal(parcial.multas[0].estado, "pendiente");
  const final = aplicarCobro(parcial, { ...cobro, monto: 41000 }, "P2");
  assert.equal(saldoFactura(factura, final.pagos), 0);
  assert.equal(estadoFactura(factura, final.pagos), "pagada");
  assert.equal(final.multas[0].estado, "pagada");
  assert.equal(final.multas[0].montoPagado, 6000);
  assert.equal(final.multas[0].fechaPago, FECHA_REFERENCIA);
  assert.equal(state.pagos.length, 0);
  assert.equal(state.multas[0].estado, "pendiente");
  assert.throws(() => aplicarCobro(final, cobro, "P3"), /importe/);
});

test("rechaza cobros inválidos, sobrepagos, facturas inexistentes y referencias vacías", () => {
  const { state } = escenario();
  for (const monto of [0, -1, NaN, Infinity, 51001, 0.001]) assert.throws(() => aplicarCobro(state, { ...cobro, monto }, "P"));
  for (const fecha of ["2026-10-21", "2026-02-30", "2026-01-01", "no-fecha"]) assert.throws(() => aplicarCobro(state, { ...cobro, fecha }, "P"));
  assert.throws(() => aplicarCobro(state, { ...cobro, idFactura: "inexistente" }, "P"));
  assert.throws(() => aplicarCobro(state, { ...cobro, medio: "transferencia" }, "P"));
  assert.throws(() => aplicarCobro(state, { ...cobro, medio: "inexistente" }, "P"));
  assert.equal(aplicarCobro(state, { ...cobro, monto: 0.01, medio: "transferencia", referencia: " OP123 " }, "P").pagos[0].referencia, "OP123");
});

test("rechaza contratos inexistentes o sin importe y ajusta el vencimiento al último día del mes", () => {
  const { state } = escenario();
  state.facturas = [];
  assert.throws(() => prepararFactura(state, "desconocido", "2026-10", "F"));
  state.contratos[2].montoMensual = undefined;
  assert.throws(() => prepararFactura(state, "C03", "2026-10", "F"), /importe/);
  state.contratos[2].montoMensual = 45000;
  state.contratos[2].fechaDesde = "2026-01-01";
  state.contratos[2].diaVencimientoPago = 31;
  assert.equal(prepararFactura(state, "C03", "2026-02", "F").fechaVence, "2026-02-28");
});

test("el mock vincula sus cobros a las facturas, con casos saldados y deuda por multa", () => {
  const state = createInitialData();
  assert.ok(state.pagos.every((p) => state.facturas.some((f) => f.idFactura === p.idFactura && f.idAlumno === p.idAlumno)));
  assert.ok(state.facturas.some((f) => saldoFactura(f, state.pagos) > 0));
  assert.ok(state.facturas.some((f) => saldoFactura(f, state.pagos) === 0));
});

test("los importes con centavos se muestran sin perder precisión y se pueden saldar exactamente", () => {
  assert.equal(formatARS(45000), "$ 45.000");
  assert.equal(formatARS(45000.01), "$ 45.000,01");
  assert.equal(formatARS(0.99), "$ 0,99");
  const { state, factura } = escenario();
  const parcial = aplicarCobro(state, { ...cobro, monto: 0.01 }, "P1");
  const saldo = saldoFactura(factura, parcial.pagos);
  assert.equal(saldo, 50999.99);
  const final = aplicarCobro(parcial, { ...cobro, monto: saldo }, "P2");
  assert.equal(saldoFactura(factura, final.pagos), 0);
});
