import { normalizar } from "./format";
import type { CatalogoAlumno, DataState, OpcionCatalogo } from "./types";

export const CARRERAS_INICIALES = ["Ingeniería en Sistemas de Información", "Ingeniería Industrial", "Licenciado en Administración Rural"];
const VINCULOS_INICIALES = ["Madre", "Padre", "Familiar", "Tutor/a", "Pareja", "Amigo/a", "Otro"];

export function catalogoInicial(catalogo: CatalogoAlumno): OpcionCatalogo[] {
  const nombres = catalogo === "carreras" ? CARRERAS_INICIALES : VINCULOS_INICIALES;
  return nombres.map((nombre, indice) => ({ id: `${catalogo}-${indice + 1}`, nombre, activa: true }));
}

export function actualizarCatalogo(data: DataState, catalogo: CatalogoAlumno, opcion: OpcionCatalogo): DataState {
  const nombre = opcion.nombre.trim();
  if (!nombre) throw new Error("Ingresá un nombre.");
  if (data[catalogo].some((item) => item.id !== opcion.id && normalizar(item.nombre) === normalizar(nombre))) {
    throw new Error("Ya existe una opción con ese nombre en el catálogo.");
  }
  const anterior = data[catalogo].find((item) => item.id === opcion.id);
  const nueva = { ...opcion, nombre };
  const opciones = anterior ? data[catalogo].map((item) => item.id === opcion.id ? nueva : item) : [...data[catalogo], nueva];

  if (!anterior || anterior.nombre === nombre) return { ...data, [catalogo]: opciones };
  const coincide = (valor?: string) => valor !== undefined && normalizar(valor) === normalizar(anterior.nombre);
  const alumnos = data.alumnos.map((alumno) => {
    if (catalogo === "carreras") return coincide(alumno.carrera) ? { ...alumno, carrera: nombre } : alumno;
    return {
      ...alumno,
      emergenciaVinculo: coincide(alumno.emergenciaVinculo) ? nombre : alumno.emergenciaVinculo,
      contactosEmergencia: alumno.contactosEmergencia?.map((contacto) =>
        coincide(contacto.vinculo) ? { ...contacto, vinculo: nombre } : contacto),
    };
  });
  return { ...data, [catalogo]: opciones, alumnos };
}
