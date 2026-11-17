import { normalizar } from "./format";
import { TIPOS_AMBIENTE } from "./types";
import type { Ambiente, EquipamientoAmbiente } from "./types";

export interface NuevoAmbienteInput {
  ambiente: string;
  tipo: string;
  ubicacion: string;
  descripcion: string;
  equipamiento: EquipamientoAmbiente[];
}

export function validarNuevoAmbiente(input: NuevoAmbienteInput, ambientes: Ambiente[]): Record<string, string> {
  const errores: Record<string, string> = {};
  if (!input.ambiente.trim()) errores.nombre = "Ingresá el nombre del ambiente.";
  else if (ambientes.some((item) => normalizar(item.ambiente) === normalizar(input.ambiente))) errores.nombre = "Ya existe un ambiente con ese nombre.";
  if (!TIPOS_AMBIENTE.some((tipo) => tipo === input.tipo)) errores.tipo = "Seleccioná un tipo de ambiente.";
  const nombres = new Set<string>();
  input.equipamiento.forEach((equipo, indice) => {
    const nombre = normalizar(equipo.nombre);
    if (!nombre) errores[`objeto-${indice}`] = "Ingresá el nombre del objeto.";
    else if (nombres.has(nombre)) errores[`objeto-${indice}`] = "Este objeto ya está en el inventario. Unificá las cantidades.";
    nombres.add(nombre);
    if (!Number.isSafeInteger(equipo.cantidad) || equipo.cantidad <= 0) errores[`cantidad-${indice}`] = "Ingresá una cantidad entera positiva.";
  });
  return errores;
}
