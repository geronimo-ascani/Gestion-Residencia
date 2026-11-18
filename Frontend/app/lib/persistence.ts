import { catalogoInicial } from "./catalogos";
import { createInitialData } from "./mock/data";
import { PARAMETROS_INICIALES, validarParametros } from "./parametros";
import type { DataState } from "./types";

export const DATOS_KEY = "residencia-datos-v1";
const esObjeto = (valor: unknown): valor is Record<string, unknown> => typeof valor === "object" && valor !== null && !Array.isArray(valor);
const campos: Record<string, string[]> = {
  alumnos: ["idAlumno", "nombre", "apellido", "documento", "correo", "telefono"],
  usuarios: ["idUsuario", "nombre", "correo", "rol", "estado"],
  habitaciones: ["idHabitacion", "numeroHabitacion"], asignaciones: ["idHabitacion", "idAlumno", "fechaDesde"],
  contratos: ["idContrato", "idAlumno", "fechaDesde", "fechaHasta"], pagos: ["idPago", "idAlumno", "fecha", "concepto"],
  multas: ["idMulta", "idAlumno", "estado", "fechaEmision", "fechaVence"], grupos: ["idGrupoLimpieza", "nombreDelGrupo"],
  grupoAlumnos: ["idGrupoLimpieza", "idAlumno"], ambientes: ["idAmbiente", "ambiente"], grupoAmbientes: ["idGrupoLimpieza", "idAmbiente", "fechaDesde"],
  facturas: ["idFactura", "idAlumno", "idContrato", "periodo", "fechaEmision", "fechaVence"],
  tareasLimpieza: ["nombre"], historialAdministrativo: ["id", "idActor", "fecha", "seccion", "accion", "detalle"],
  reclamos: ["idReclamo", "idAlumno", "asunto", "descripcion", "estado", "fechaCreacion", "fechaActualizacion"],
};

/** Migra campos agregados al prototipo sin reemplazar datos existentes. */
export function cargarDatosGuardados(texto: string | null): DataState {
  if (texto === null) return createInitialData();
  const valor: unknown = JSON.parse(texto);
  if (!esObjeto(valor)) throw new Error("El archivo de datos no tiene un formato válido.");
  const datos: Record<string, unknown> = { ...valor };
  for (const [clave, requeridos] of Object.entries(campos)) {
    if (datos[clave] === undefined && ["reclamos", "historialAdministrativo", "facturas"].includes(clave)) datos[clave] = [];
    if (datos[clave] === undefined && clave === "tareasLimpieza") datos[clave] = createInitialData().tareasLimpieza;
    const filas = datos[clave];
    if (!Array.isArray(filas) || !filas.every((fila: unknown) => esObjeto(fila) && requeridos.every((campo) => typeof fila[campo] === "string"))) throw new Error(`No se pudo leer la sección ${clave}.`);
  }
  for (const catalogo of ["carreras", "vinculos"] as const) {
    if (datos[catalogo] === undefined) datos[catalogo] = catalogoInicial(catalogo);
    const opciones = datos[catalogo];
    if (!Array.isArray(opciones) || !opciones.every((o: unknown) => esObjeto(o) && typeof o.id === "string" && typeof o.nombre === "string" && typeof o.activa === "boolean")) {
      throw new Error(`No se pudo leer el catálogo de ${catalogo}.`);
    }
  }
  const result = datos as unknown as DataState;
  if (result.facturas.some((f) => !Array.isArray(f.detalles) || f.detalles.some((d) => !esObjeto(d) || typeof d.concepto !== "string" || typeof d.monto !== "number")) || result.tareasLimpieza.some((t) => !Array.isArray(t.tareas)) || result.reclamos.some((r) => !Array.isArray(r.historial))) throw new Error("Hay detalles incompletos en los datos guardados.");
  result.parametros = { ...PARAMETROS_INICIALES, ...(esObjeto(valor.parametros) ? valor.parametros : {}) };
  validarParametros(result.parametros);
  return result;
}
