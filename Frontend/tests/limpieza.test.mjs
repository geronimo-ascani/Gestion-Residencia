import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && !specifier.match(/\.[a-z]+$/i) && context.parentURL?.endsWith(".ts")) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});
const { validarTareaLimpieza, semanaLimpieza, tareaLimpieza, validarGrupoLimpieza, actualizarIntegrantesLimpieza } = await import("../app/lib/domain.ts");
const { createInitialData } = await import("../app/lib/mock/data.ts");

test("hay cuatro grupos y cada residente está en un único grupo; dos habitaciones comparten grupo", () => {
  const state = createInitialData();
  assert.equal(state.grupos.length, 4);
  assert.equal(new Set(state.grupos.map((g) => g.tareaInicial)).size, 4);
  assert.equal(state.grupoAlumnos.length, state.alumnos.length);
  assert.equal(new Set(state.grupoAlumnos.map((g) => g.idAlumno)).size, state.alumnos.length);
  const grupo = state.grupoAlumnos.filter((g) => g.idGrupoLimpieza === "G4");
  assert.equal(new Set(state.asignaciones.filter((a) => a.fechaHasta === null && grupo.some((g) => g.idAlumno === a.idAlumno)).map((a) => a.idHabitacion)).size, 2);
});

test("rotación en límites semanales, quinta semana y reinicio mensual", () => {
  for (const [dia, semana] of [[1,1],[7,1],[8,2],[14,2],[15,3],[21,3],[22,4],[28,4],[29,5],[31,5]]) {
    assert.equal(semanaLimpieza(`2026-10-${String(dia).padStart(2,"0")}`), semana);
  }
  assert.deepEqual([1,2,3,4,5].map((s) => tareaLimpieza(1,s).numero), [1,2,3,4,1]);
  assert.deepEqual([1,2,3,4].map((t) => tareaLimpieza(t,2).numero), [2,3,4,1]);
  assert.equal(semanaLimpieza("2026-11-01"), 1);
  for (const semana of [1,2,3,4,5]) assert.equal(new Set([1,2,3,4].map((t) => tareaLimpieza(t,semana).numero)).size,4);
});

test("trasladar alumnos quita su pertenencia anterior, deduplica y conserva los demás grupos", () => {
  const state = createInitialData();
  const ids = state.grupoAlumnos.filter((a) => a.idGrupoLimpieza === "G2").map((a) => a.idAlumno);
  const traslado = state.grupoAlumnos.find((a) => a.idGrupoLimpieza === "G1").idAlumno;
  const nuevo = actualizarIntegrantesLimpieza(state, "G2", [...ids, traslado, traslado]);
  assert.deepEqual(nuevo.grupoAlumnos.filter((a) => a.idAlumno === traslado), [{ idAlumno: traslado, idGrupoLimpieza: "G2" }]);
  assert.deepEqual(nuevo.grupoAlumnos.filter((a) => a.idGrupoLimpieza === "G3"), state.grupoAlumnos.filter((a) => a.idGrupoLimpieza === "G3"));
  assert.notEqual(nuevo, state);
  assert.ok(state.grupoAlumnos.some((a) => a.idAlumno === traslado && a.idGrupoLimpieza === "G1"));
  assert.equal(actualizarIntegrantesLimpieza(state, "inexistente", ids), state);
  assert.equal(actualizarIntegrantesLimpieza(state, "G2", ["inexistente"]), state);
  const inactivo = { ...state, alumnos: state.alumnos.map((a) => a.idAlumno === traslado ? { ...a, estado: "inactivo" } : a) };
  assert.equal(actualizarIntegrantesLimpieza(inactivo, "G2", [traslado]), inactivo);
});

test("alta exige cupo, nombre único, integrantes activos y tarea disponible", () => {
  const state = createInitialData();
  const input = { nombreDelGrupo: "Reemplazo", tareaInicial: 4, idAlumnos: ["A01"] };
  assert.ok(validarGrupoLimpieza(state, input));
  const parcial = { ...state, grupos: state.grupos.slice(0,3) };
  assert.equal(validarGrupoLimpieza(parcial, input), "");
  for (const cambio of [{ nombreDelGrupo: " " }, { nombreDelGrupo: " GRUPO 1 " }, { tareaInicial: 1 }, { tareaInicial: 5 }, { tareaInicial: NaN }, { idAlumnos: [] }, { idAlumnos: ["inexistente"] }]) {
    assert.ok(validarGrupoLimpieza(parcial, { ...input, ...cambio }));
  }
});


test("alta de tareas exige nombre único y actividades completas sin duplicados", () => {
  const tareas = createInitialData().tareasLimpieza;
  const input = { nombre: "Limpiar lavadero", tareas: ["Limpiar lavarropas", "Limpiar piso"] };
  assert.equal(validarTareaLimpieza(input, tareas), "");
  for (const cambio of [{ nombre: " " }, { nombre: " LIMPIAR BANOS " }, { tareas: [] }, { tareas: [" "] }, { tareas: ["Piso", " PÍSO "] }]) {
    assert.ok(validarTareaLimpieza({ ...input, ...cambio }, tareas));
  }
});

test("las tareas adicionales se muestran en catálogo sin modificar la rotación de los cuatro grupos", () => {
  const originales = createInitialData().tareasLimpieza;
  const tareas = [...originales, { enRotacion: false, numero: 5, nombre: "Limpiar lavadero", tareas: ["Limpiar lavarropas"] }];
  assert.equal(tareas.length, 5);
  assert.equal(tareas[4].nombre, "Limpiar lavadero");
  for (const semana of [1,2,3,4,5,6,7,8]) {
    for (const grupo of [1,2,3,4]) {
      assert.deepEqual(tareaLimpieza(grupo,semana,tareas), tareaLimpieza(grupo,semana,originales));
    }
    assert.equal(new Set([1,2,3,4].map((grupo) => tareaLimpieza(grupo,semana,tareas).numero)).size,4);
  }
  assert.equal(tareaLimpieza(1,5,tareas).numero, 1);
  assert.equal(tareaLimpieza(4,2,tareas).numero, 1);
});
