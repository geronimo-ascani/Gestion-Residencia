import { catalogoInicial } from "./catalogos";
import { PARAMETROS_INICIALES } from "./parametros";
import { TAREAS_LIMPIEZA } from "./domain";
import type { DataState } from "./types";
import { USUARIO_ADMIN_INICIAL } from "./session";

/**
 * Estado inicial limpio del sistema antes de sincronizar con PostgreSQL.
 * Todas las colecciones operativas inician vacías hasta que se hidrata desde /api/estado.
 */
export function createInitialData(): DataState {
  return {
    carreras: catalogoInicial("carreras"),
    vinculos: catalogoInicial("vinculos"),
    reclamos: [],
    facturas: [],
    habitaciones: [],
    alumnos: [],
    asignaciones: [],
    contratos: [],
    pagos: [],
    multas: [],
    tareasLimpieza: TAREAS_LIMPIEZA.map((tarea) => ({ ...tarea, tareas: [...tarea.tareas] })),
    grupos: [],
    grupoAlumnos: [],
    ambientes: [],
    grupoAmbientes: [],
    parametros: { ...PARAMETROS_INICIALES },
    historialAdministrativo: [],
    usuarios: [{ ...USUARIO_ADMIN_INICIAL }],
  };
}

export const createEmptyDataState = createInitialData;

