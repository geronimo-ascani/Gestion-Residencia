import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

// Node strips TypeScript; resolve the extensionless config import used by Vite.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && !specifier.match(/\.[a-z]+$/i) && context.parentURL?.endsWith(".ts")) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});
const { asignacionesAmbienteActivas, contratoVigente, contratosSuperpuestos, estadoContrato, finEstadia, sumarDia, tipoIngreso } = await import("../app/lib/domain.ts");
const original = { idContrato: "C1", idAlumno: "A1", fechaDesde: "2025-03-01", fechaHasta: "2026-02-28" };
const renovacion = { idContrato: "C2", idAlumno: "A1", fechaDesde: "2026-03-01", fechaHasta: "2027-02-28" };

test("el contrato está vigente en las fechas de inicio y fin, pero no antes ni después", () => {
  assert.equal(contratoVigente([original], "A1", "2025-02-28"), undefined);
  assert.equal(contratoVigente([original], "A1", original.fechaDesde), original);
  assert.equal(contratoVigente([original], "A1", original.fechaHasta), original);
  assert.equal(contratoVigente([original], "A1", "2026-03-01"), undefined);
});

test("la baja deja de ser vigente desde su fecha y conserva el fin pactado", () => {
  const baja = { ...original, fechaCancelacion: "2025-10-15", motivoCancelacion: "Baja voluntaria" };
  assert.equal(contratoVigente([baja], "A1", "2025-10-14"), baja);
  assert.equal(contratoVigente([baja], "A1", "2025-10-15"), undefined);
  assert.equal(estadoContrato(baja, "2025-10-15"), "cancelado");
  assert.equal(finEstadia(baja), "2025-10-14");
  assert.equal(baja.fechaHasta, "2026-02-28");
});

test("una renovación conserva el contrato anterior y se distingue de un reingreso", () => {
  const historial = [renovacion, original];
  assert.equal(tipoIngreso(original, historial), "Primer ingreso");
  assert.equal(tipoIngreso(renovacion, historial), "Renovación");
  assert.equal(tipoIngreso({ ...renovacion, fechaDesde: "2026-04-01" }, historial), "Reingreso");
  assert.equal(tipoIngreso(renovacion, [{ ...original, fechaCancelacion: "2025-10-15" }, renovacion]), "Reingreso");
  assert.equal(contratoVigente(historial, "A1", "2026-10-20"), renovacion);
  assert.equal(historial.length, 2);
});

test("no permite superposiciones ni compartir el último día de otro contrato", () => {
  assert.equal(contratosSuperpuestos([original], renovacion), false);
  assert.equal(contratosSuperpuestos([original], { ...renovacion, fechaDesde: original.fechaHasta }), true);
  assert.equal(contratosSuperpuestos([original], { ...renovacion, fechaDesde: "2025-04-01" }), true);
  assert.equal(contratosSuperpuestos([original], { ...original, idAlumno: "A2" }), false);
});

test("permite reingresar desde la baja efectiva, sin superponer la estadía previa", () => {
  const baja = { ...original, fechaCancelacion: "2025-10-15" };
  const reingreso = { ...renovacion, fechaDesde: "2025-10-15" };
  assert.equal(contratosSuperpuestos([baja], reingreso), false);
  assert.equal(contratosSuperpuestos([baja], { ...reingreso, fechaDesde: "2025-10-14" }), true);
  assert.equal(contratoVigente([baja, reingreso], "A1", "2025-10-15"), reingreso);
});

test("no considera residentes a los ingresos futuros y calcula los cambios de mes y año", () => {
  assert.equal(estadoContrato(renovacion, "2026-02-28"), "programado");
  assert.equal(contratoVigente([renovacion], "A1", "2026-02-28"), undefined);
  assert.equal(sumarDia("2026-12-31"), "2027-01-01");
  assert.equal(sumarDia("2024-02-28"), "2024-02-29");
});

test("las asignaciones de ambientes incluyen el inicio y excluyen la fecha final", () => {
  const asignaciones = [
    { idGrupoLimpieza: "G1", idAmbiente: "AM1", fechaDesde: "2026-10-20", fechaHasta: null },
    { idGrupoLimpieza: "G2", idAmbiente: "AM2", fechaDesde: "2026-10-19", fechaHasta: "2026-10-20" },
    { idGrupoLimpieza: "G3", idAmbiente: "AM3", fechaDesde: "2026-10-21", fechaHasta: null },
  ];
  assert.deepEqual(
    asignacionesAmbienteActivas(asignaciones, "2026-10-20").map((asignacion) => asignacion.idAmbiente),
    ["AM1"],
  );
});
