import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { FECHA_REFERENCIA } from "./config";
import { createInitialData } from "./mock/data";
import type {
  Alumno,
  Ambiente,
  DataState,
  GrupoDeLimpieza,
  Habitacion,
} from "./types";

let secuencia = 1000;

function nuevoId(prefijo: string): string {
  secuencia += 1;
  return `${prefijo}${secuencia}`;
}

export interface NuevaMultaInput {
  idAlumno: string;
  monto: number;
  fechaVence: string;
}

export interface NuevoAlumnoInput {
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  documento: string;
}

export interface NuevoContratoInput {
  idAlumno: string;
  fechaDesde: string;
  fechaHasta: string;
}

export interface DataContextValue extends DataState {
  alumnoPorId: Map<string, Alumno>;
  habitacionPorId: Map<string, Habitacion>;
  grupoPorId: Map<string, GrupoDeLimpieza>;
  ambientePorId: Map<string, Ambiente>;
  registrarPagoMulta: (idMulta: string) => void;
  anularMulta: (idMulta: string) => void;
  emitirMulta: (input: NuevaMultaInput) => void;
  asignarHabitacion: (idAlumno: string, idHabitacion: string) => void;
  liberarHabitacion: (idAlumno: string) => void;
  crearAlumno: (input: NuevoAlumnoInput) => string;
  crearContrato: (input: NuevoContratoInput) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

/**
 * Store en memoria para el prototipo. Se reinicia al recargar la página; todas
 * las páginas comparten el mismo estado mientras dure la navegación.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>(() => createInitialData());

  const value = useMemo<DataContextValue>(() => {
    const alumnoPorId = new Map(
      state.alumnos.map((alumno) => [alumno.idAlumno, alumno]),
    );
    const habitacionPorId = new Map(
      state.habitaciones.map((habitacion) => [
        habitacion.idHabitacion,
        habitacion,
      ]),
    );
    const grupoPorId = new Map(
      state.grupos.map((grupo) => [grupo.idGrupoLimpieza, grupo]),
    );
    const ambientePorId = new Map(
      state.ambientes.map((ambiente) => [ambiente.idAmbiente, ambiente]),
    );

    return {
      ...state,
      alumnoPorId,
      habitacionPorId,
      grupoPorId,
      ambientePorId,

      registrarPagoMulta(idMulta) {
        setState((previo) => ({
          ...previo,
          multas: previo.multas.map((multa) =>
            multa.idMulta === idMulta
              ? { ...multa, estado: "pagada", fechaPago: FECHA_REFERENCIA }
              : multa,
          ),
        }));
      },

      anularMulta(idMulta) {
        setState((previo) => ({
          ...previo,
          multas: previo.multas.map((multa) =>
            multa.idMulta === idMulta
              ? { ...multa, estado: "anulada", fechaPago: null }
              : multa,
          ),
        }));
      },

      emitirMulta({ idAlumno, monto, fechaVence }) {
        const idMulta = nuevoId("M");
        setState((previo) => ({
          ...previo,
          multas: [
            {
              idMulta,
              idAlumno,
              monto: Math.max(0, Math.round(monto)),
              fechaEmision: FECHA_REFERENCIA,
              fechaVence,
              estado: "pendiente",
              fechaPago: null,
            },
            ...previo.multas,
          ],
        }));
      },

      asignarHabitacion(idAlumno, idHabitacion) {
        setState((previo) => {
          const asignaciones = previo.asignaciones.map((asignacion) =>
            asignacion.idAlumno === idAlumno &&
            (asignacion.fechaHasta === null ||
              asignacion.fechaHasta >= FECHA_REFERENCIA)
              ? { ...asignacion, fechaHasta: FECHA_REFERENCIA }
              : asignacion,
          );

          asignaciones.push({
            idAlumno,
            idHabitacion,
            fechaDesde: FECHA_REFERENCIA,
            fechaHasta: null,
          });

          return { ...previo, asignaciones };
        });
      },

      liberarHabitacion(idAlumno) {
        setState((previo) => ({
          ...previo,
          asignaciones: previo.asignaciones.map((asignacion) =>
            asignacion.idAlumno === idAlumno &&
            (asignacion.fechaHasta === null ||
              asignacion.fechaHasta >= FECHA_REFERENCIA)
              ? { ...asignacion, fechaHasta: FECHA_REFERENCIA }
              : asignacion,
          ),
        }));
      },

      crearAlumno(input) {
        const idAlumno = nuevoId("A");
        setState((previo) => ({
          ...previo,
          alumnos: [...previo.alumnos, { ...input, idAlumno }],
        }));
        return idAlumno;
      },

      crearContrato({ idAlumno, fechaDesde, fechaHasta }) {
        const idContrato = nuevoId("C");
        setState((previo) => ({
          ...previo,
          contratos: [
            ...previo.contratos,
            { idContrato, idAlumno, fechaDesde, fechaHasta },
          ],
        }));
      },
    };
  }, [state]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const contexto = useContext(DataContext);
  if (!contexto) {
    throw new Error("useData debe usarse dentro de <DataProvider>");
  }
  return contexto;
}
