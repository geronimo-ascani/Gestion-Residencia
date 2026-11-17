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
const { validarNuevoAmbiente } = await import("../app/lib/ambientes.ts");
const { createInitialData } = await import("../app/lib/mock/data.ts");
const datos = { ambiente: "Sala de estudio 3", tipo: "Sala de estudio", ubicacion: "Sector patio", descripcion: "", equipamiento: [] };

test("permite registrar espacios con o sin inventario inicial y de tipo Otro", () => {
  assert.deepEqual(validarNuevoAmbiente(datos, []), {});
  assert.deepEqual(validarNuevoAmbiente({ ...datos, tipo: "Otro", equipamiento: [{ nombre: "Mesas", cantidad: 3 }] }, []), {});
});

test("rechaza nombres vacíos o duplicados sin distinguir acentos y mayúsculas, y tipos desconocidos", () => {
  const ambientes = [{ idAmbiente: "AM1", ambiente: "Salón", tareas: "" }];
  assert.ok(validarNuevoAmbiente({ ...datos, ambiente: " SALON " }, ambientes).nombre);
  const errores = validarNuevoAmbiente({ ...datos, ambiente: "   ", tipo: "inexistente" }, []);
  assert.ok(errores.nombre);
  assert.ok(errores.tipo);
});

test("rechaza objetos repetidos, sin nombre, y cantidades inválidas", () => {
  for (const cantidad of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.ok(validarNuevoAmbiente({ ...datos, equipamiento: [{ nombre: "Mesas", cantidad }] }, [])["cantidad-0"]);
  }
  const errores = validarNuevoAmbiente({ ...datos, equipamiento: [{ nombre: " SILLAS ", cantidad: 2 }, { nombre: "sillas", cantidad: 1 }, { nombre: "  ", cantidad: 1 }] }, []);
  assert.ok(errores["objeto-1"]);
  assert.ok(errores["objeto-2"]);
});

test("el inventario inicial incluye diez ambientes comunes y un lavadero con un lavarropas", () => {
  const { ambientes, grupoAmbientes } = createInitialData();
  assert.equal(ambientes.filter((ambiente) => ambiente.tipo).length, 10);
  assert.deepEqual(ambientes.find((ambiente) => ambiente.tipo === "Lavadero").equipamiento, [{ nombre: "Lavarropas", cantidad: 1 }]);
  assert.equal(new Set(ambientes.map((ambiente) => ambiente.idAmbiente)).size, ambientes.length);
  assert.ok(grupoAmbientes.every((asignacion) => ambientes.some((ambiente) => ambiente.idAmbiente === asignacion.idAmbiente)));
});
