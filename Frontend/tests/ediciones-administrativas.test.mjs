import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && !specifier.match(/\.[a-z]+$/i) && context.parentURL?.endsWith(".ts")) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier, context);
  },
});

const { createInitialData } = await import("../app/lib/mock/data.ts");
const { editarContrato, editarHabitacion } = await import("../app/lib/gestiones.ts");
const { editarEquipamiento } = await import("../app/lib/ambientes.ts");
const { actualizarCatalogo } = await import("../app/lib/catalogos.ts");
const { cargarDatosGuardados } = await import("../app/lib/persistence.ts");
const { actualizarMultaFacturada, aplicarCancelacionFactura, aplicarCobro, aplicarEmisionFactura, cobradoDirectoFactura, cobradoFactura, estadoFactura, facturaActivaDeMulta, prepararFactura, saldoFactura } = await import("../app/lib/facturacion.ts");

test("una factura con saldo puede cancelarse y conserva sus cobros parciales", () => {
  const state = createInitialData();
  const factura = facturaActivaDeMulta(state.facturas, "M01");
  const cobro = { idFactura: factura.idFactura, monto: 100, fecha: "2026-10-20", medio: "efectivo", referencia: "" };
  const parcial = aplicarCobro(state, cobro, "P-TEST");
  assert.throws(() => aplicarCancelacionFactura(parcial, factura.idFactura, " "), /motivo de cancelación/);
  const cancelado = aplicarCancelacionFactura(parcial, factura.idFactura, " Error de emisión ");
  const guardado = cargarDatosGuardados(JSON.stringify(cancelado));
  const cancelada = guardado.facturas.find((item) => item.idFactura === factura.idFactura);
  assert.equal(estadoFactura(cancelada, guardado.pagos), "cancelada");
  assert.equal(cancelada.motivoCancelacion, "Error de emisión");
  assert.equal(saldoFactura(cancelada, guardado.pagos), 0);
  assert.equal(cobradoFactura(cancelada, guardado.pagos), cobradoFactura(factura, parcial.pagos));
  assert.equal(facturaActivaDeMulta(guardado.facturas, "M01"), undefined);
  assert.equal(guardado.multas.find((m) => m.idMulta === "M01").estado, "pendiente");
  assert.throws(() => aplicarCobro(guardado, cobro, "P-OTRO"), /habilitada/);
  assert.throws(() => aplicarCancelacionFactura(guardado, factura.idFactura, "Error"), /saldo pendiente/);
  const pagada = state.facturas.find((item) => estadoFactura(item, state.pagos) === "pagada");
  assert.throws(() => aplicarCancelacionFactura(state, pagada.idFactura, "Error"), /saldo pendiente/);
});

test("el reemplazo permite corregir la cuota y aplica el cobro anterior sin duplicarlo", () => {
  const state = createInitialData();
  const origen = facturaActivaDeMulta(state.facturas, "M01");
  const cancelada = aplicarCancelacionFactura(state, origen.idFactura, "Cuota incorrecta");
  const datos = { idFacturaOrigen: origen.idFactura, concepto: "Alojamiento corregido", monto: 52000, fechaVence: "2026-10-25" };
  assert.throws(() => prepararFactura(state, origen.idContrato, origen.periodo, "TEST", datos), /origen cancelada/);
  assert.throws(() => prepararFactura(cancelada, "C01", origen.periodo, "TEST", datos), /mismo titular/);
  assert.throws(() => prepararFactura(cancelada, origen.idContrato, origen.periodo, "TEST", { ...datos, monto: 1000 }), /crédito disponible/);

  const factura = prepararFactura(cancelada, origen.idContrato, origen.periodo, "TEST", datos);
  assert.equal(factura.idFacturaOrigen, origen.idFactura);
  assert.equal(factura.detalles[0].concepto, datos.concepto);
  assert.equal(factura.detalles[0].monto, datos.monto);
  assert.equal(factura.fechaVence, datos.fechaVence);
  assert.equal(factura.creditoAplicado, cobradoDirectoFactura(origen, state.pagos));
  const emitida = aplicarEmisionFactura(cancelada, factura);
  assert.equal(emitida.pagos, state.pagos);
  assert.equal(cobradoDirectoFactura(factura, emitida.pagos), 0);
  assert.equal(saldoFactura(factura, emitida.pagos), 13000);
  assert.throws(() => prepararFactura(emitida, origen.idContrato, origen.periodo, "OTRA", datos), /ya tiene un reemplazo/);

  const vueltaACancelar = aplicarCancelacionFactura(emitida, factura.idFactura, "Segunda corrección");
  const siguiente = prepararFactura(vueltaACancelar, origen.idContrato, origen.periodo, "SIGUIENTE", { ...datos, idFacturaOrigen: factura.idFactura });
  assert.equal(siguiente.creditoAplicado, factura.creditoAplicado);
  assert.equal(saldoFactura(siguiente, vueltaACancelar.pagos), 13000);
});

test("una corrección de multa pendiente actualiza el concepto y el saldo facturado", () => {
  const state = createInitialData();
  const multa = state.multas.find((m) => m.idMulta === "M01");
  const factura = facturaActivaDeMulta(state.facturas, multa.idMulta);
  const actualizado = actualizarMultaFacturada(state, multa, { ...multa, monto: 8000, motivo: "Importe corregido" });
  const editada = facturaActivaDeMulta(actualizado.facturas, multa.idMulta);
  assert.equal(saldoFactura(editada, actualizado.pagos) - saldoFactura(factura, state.pagos), 3000);
  assert.match(editada.detalles.find((d) => d.idMulta === multa.idMulta).concepto, /Importe corregido/);
  const conCobro = aplicarCobro(state, { idFactura: factura.idFactura, monto: 2000, fecha: "2026-10-20", medio: "efectivo", referencia: "" }, "P-TEST");
  assert.throws(() => actualizarMultaFacturada(conCobro, multa, { ...multa, monto: 1000 }), /por debajo del importe ya cobrado/);
  const saldada = actualizarMultaFacturada(conCobro, multa, { ...multa, monto: 2000 });
  assert.equal(saldada.multas.find((item) => item.idMulta === multa.idMulta).estado, "pagada");
  assert.equal(estadoFactura(facturaActivaDeMulta(saldada.facturas, multa.idMulta), saldada.pagos), "pagada");
});

test("editar conserva el identificador del contrato y evita reducir la habitación por debajo de su ocupación", () => {
  const state = createInitialData();
  const contrato = state.contratos[0];
  const editado = editarContrato(state, contrato.idContrato, { ...contrato, observaciones: "Dato corregido" });
  assert.equal(editado.contratos[0].idContrato, contrato.idContrato);
  assert.equal(editado.contratos[0].observaciones, "Dato corregido");
  assert.throws(() => editarContrato(state, contrato.idContrato, { ...contrato, idAlumno: state.alumnos[1].idAlumno }), /titular/);
  const habitacion = state.habitaciones[0];
  assert.throws(() => editarHabitacion(state, habitacion.idHabitacion, { ...habitacion, capacidadMaxima: 1 }), /residentes asignados/);
  const ampliada = editarHabitacion(state, habitacion.idHabitacion, { ...habitacion, capacidadMaxima: 3 });
  assert.equal(ampliada.habitaciones[0].capacidadMaxima, 3);
  assert.equal(ampliada.asignaciones, state.asignaciones);
});

test("el equipamiento permite cambiar nombre y cantidad y eliminar sin alterar otros objetos", () => {
  const original = { idAmbiente: "A", ambiente: "Cocina", tareas: "", equipamiento: [{ nombre: "Mesas", cantidad: 2 }, { nombre: "Sillas", cantidad: 6 }] };
  assert.throws(() => editarEquipamiento(original, "Mesas", { nombre: "sillas", cantidad: 1 }), /mismo nombre|ese nombre/);
  const editado = editarEquipamiento(original, "Mesas", { nombre: "Bancos", cantidad: 3 });
  assert.deepEqual(editado.equipamiento[0], { nombre: "Bancos", cantidad: 3 });
  assert.deepEqual(editarEquipamiento(editado, "Bancos").equipamiento, [{ nombre: "Sillas", cantidad: 6 }]);
});

test("los catálogos se incorporan a guardados anteriores y las bajas preservan los datos existentes", () => {
  const { carreras, vinculos, ...anterior } = createInitialData();
  const state = cargarDatosGuardados(JSON.stringify(anterior));
  assert.deepEqual(state.carreras, carreras);
  assert.deepEqual(state.vinculos, vinculos);
  const carrera = carreras.find((item) => item.nombre === state.alumnos[0].carrera);
  const renombrado = actualizarCatalogo(state, "carreras", { ...carrera, nombre: "Nombre corregido" });
  assert.equal(renombrado.alumnos[0].carrera, "Nombre corregido");
  const madre = vinculos.find((item) => item.nombre === "Madre");
  const baja = actualizarCatalogo(renombrado, "vinculos", { ...madre, activa: false });
  assert.equal(baja.vinculos.find((item) => item.id === madre.id).activa, false);
  assert.equal(baja.alumnos[0].contactosEmergencia[0].vinculo, "Madre");
});
