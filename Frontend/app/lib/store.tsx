import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { calendarioMulta, conHistorialMulta, extenderMes, importeMulta, TIPOS_MULTA } from "./multas";
import { actualizarIntegrantesLimpieza, validarGrupoLimpieza, validarTareaLimpieza, contratoVigente, contratosSuperpuestos } from "./domain";
import { FECHA_REFERENCIA } from "./config";
import { aplicarCobro, prepararFactura } from "./facturacion";
import type { RegistrarCobroInput } from "./types";
import { normalizar } from "./format";
import { createInitialData } from "./mock/data";
import { validarNuevoAmbiente } from "./ambientes";
import type { NuevoAmbienteInput } from "./ambientes";
import { TIPOS_AMBIENTE } from "./types";
import type {
  Alumno,
  DatosIngresoAlumno,
  Ambiente,
  DataState,
  EquipamientoAmbiente,
  GrupoDeLimpieza,
  NuevaTareaLimpiezaInput,
  Habitacion,
  Multa,
} from "./types";

let secuencia = 1000;

function nuevoId(prefijo: string): string {
  secuencia += 1;
  return `${prefijo}${secuencia}`;
}

export interface DatosMultaInput {
  tipo: string;
  motivo: string;
  observaciones: string;
  huboDanios: boolean;
  detalleDanios: string;
  montoSancion: number;
  montoDanios: number;
}
export interface NuevaMultaInput extends DatosMultaInput { idAlumnos: string[]; }
export interface EditarMultaInput extends DatosMultaInput { idMulta: string; }

export interface NuevoAlumnoInput extends DatosIngresoAlumno {
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  documento: string;
}

export interface NuevaHabitacionInput {
  numeroHabitacion: string;
  pisoHabitacion: number | null;
  capacidadMaxima: number;
  descripcion: string;
}

export interface NuevoGrupoLimpiezaInput {
  tareaInicial: number;
  idAlumnos: string[];
  nombreDelGrupo: string;
}

export interface NuevoContratoInput {
  idAlumno: string;
  fechaDesde: string;
  fechaHasta: string;
  fechaFirma?: string;
  montoMensual?: number;
  depositoGarantia?: number;
  diaVencimientoPago?: number;
  observaciones?: string;
}

export interface DataContextValue extends DataState {
  generarFactura: (idContrato: string, periodo: string) => string;
  registrarCobro: (input: RegistrarCobroInput) => string;
  alumnoPorId: Map<string, Alumno>;
  habitacionPorId: Map<string, Habitacion>;
  grupoPorId: Map<string, GrupoDeLimpieza>;
  ambientePorId: Map<string, Ambiente>;
  crearAmbiente: (input: NuevoAmbienteInput) => string | null;
  agregarEquipamientoAmbiente: (idAmbiente: string, equipo: EquipamientoAmbiente) => boolean;
  registrarPagoMulta: (idMulta: string) => void;
  anularMulta: (idMulta: string) => void;
  emitirMulta: (input: NuevaMultaInput) => string[];
  actualizarMulta: (input: EditarMultaInput) => void;
  extenderPlazoMulta: (idMulta: string, motivo: string) => void;
  asignarHabitacion: (idAlumno: string, idHabitacion: string) => void;
  liberarHabitacion: (idAlumno: string) => void;
  crearAlumno: (input: NuevoAlumnoInput) => string;
  crearHabitacion: (input: NuevaHabitacionInput) => string;
  actualizarTareaLimpieza: (numero: number, input: NuevaTareaLimpiezaInput) => void;
  crearTareaLimpieza: (input: NuevaTareaLimpiezaInput) => void;
  crearGrupoLimpieza: (input: NuevoGrupoLimpiezaInput) => string;
  actualizarGrupoLimpieza: (idGrupoLimpieza: string, nombreDelGrupo: string) => void;
  eliminarGrupoLimpieza: (idGrupoLimpieza: string) => void;
  guardarAlumnosGrupo: (idGrupoLimpieza: string, idAlumnos: string[]) => void;
  asignarAmbienteGrupo: (
    idGrupoLimpieza: string,
    idAmbiente: string,
    fechaDesde: string,
  ) => boolean;
  liberarAmbienteGrupo: (idGrupoLimpieza: string, idAmbiente: string) => void;
  crearContrato: (input: NuevoContratoInput) => void;
  cancelarContrato: (idContrato: string, fecha: string, motivo: string) => void;
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

      generarFactura(idContrato, periodo) {
        const id = nuevoId("F");
        prepararFactura(state, idContrato, periodo, id);
        setState((previo) => previo.facturas.some((f) => f.idContrato === idContrato && f.periodo === periodo) ? previo : {
          ...previo, facturas: [...previo.facturas, prepararFactura(previo, idContrato, periodo, id)],
        });
        return id;
      },

      registrarCobro(input) {
        const id = nuevoId("P");
        aplicarCobro(state, input, id);
        setState((previo) => aplicarCobro(previo, input, id));
        return id;
      },

      crearAmbiente(input) {
        const tipo = TIPOS_AMBIENTE.find((valor) => valor === input.tipo);
        if (!tipo || Object.keys(validarNuevoAmbiente(input, state.ambientes)).length) return null;
        const idAmbiente = nuevoId("AM");
        const ambiente: Ambiente = {
          idAmbiente,
          ambiente: input.ambiente.trim(),
          tipo,
          ubicacion: input.ubicacion.trim(),
          descripcion: input.descripcion.trim(),
          equipamiento: input.equipamiento.map((equipo) => ({ nombre: equipo.nombre.trim(), cantidad: equipo.cantidad })),
          tareas: "",
        };
        setState((previo) => Object.keys(validarNuevoAmbiente(input, previo.ambientes)).length ? previo : { ...previo, ambientes: [...previo.ambientes, ambiente] });
        return idAmbiente;
      },

      agregarEquipamientoAmbiente(idAmbiente, equipo) {
        const nombre = equipo.nombre.trim();
        const ambiente = ambientePorId.get(idAmbiente);
        if (!ambiente?.tipo || !nombre || !Number.isSafeInteger(equipo.cantidad) || equipo.cantidad <= 0) return false;
        const existente = ambiente.equipamiento?.find((item) => normalizar(item.nombre) === normalizar(nombre));
        if (existente && !Number.isSafeInteger(existente.cantidad + equipo.cantidad)) return false;

        setState((previo) => ({
          ...previo,
          ambientes: previo.ambientes.map((item) => {
            if (item.idAmbiente !== idAmbiente || !item.tipo) return item;
            const equipamiento = item.equipamiento ?? [];
            const repetido = equipamiento.find((objeto) => normalizar(objeto.nombre) === normalizar(nombre));
            if (repetido && !Number.isSafeInteger(repetido.cantidad + equipo.cantidad)) return item;
            return {
              ...item,
              equipamiento: repetido
                ? equipamiento.map((objeto) => objeto === repetido ? { ...objeto, cantidad: objeto.cantidad + equipo.cantidad } : objeto)
                : [...equipamiento, { nombre, cantidad: equipo.cantidad }],
            };
          }),
        }));
        return true;
      },

      registrarPagoMulta(idMulta) {
        if (state.facturas.some((f) => f.detalles.some((d) => d.idMulta === idMulta))) return;
        setState((previo) => ({
          ...previo,
          multas: previo.multas.map((multa) =>
            multa.idMulta === idMulta
              ? { ...multa, estado: "pagada", fechaPago: FECHA_REFERENCIA, montoPagado: importeMulta(multa).total }
              : multa,
          ),
        }));
      },

      anularMulta(idMulta) {
        if (state.facturas.some((f) => f.detalles.some((d) => d.idMulta === idMulta))) return;
        setState((previo) => ({
          ...previo,
          multas: previo.multas.map((multa) =>
            multa.idMulta === idMulta
              ? { ...multa, estado: "anulada", fechaPago: null }
              : multa,
          ),
        }));
      },

      emitirMulta({ idAlumnos, ...datos }) {
        const tipo = TIPOS_MULTA.find((t) => t.id === datos.tipo);
        if (!tipo || !datos.motivo.trim() || !Number.isFinite(datos.montoSancion) || datos.montoSancion <= 0 || !Number.isFinite(datos.montoDanios) || datos.montoDanios < 0 || (datos.huboDanios && (!datos.detalleDanios.trim() || datos.montoDanios <= 0))) return [];
        const idEmision = nuevoId("E");
        const nuevas: Multa[] = [...new Set(idAlumnos)].filter((id) => alumnoPorId.has(id)).map((idAlumno) => ({
          ...datos, motivo: datos.motivo.trim(), observaciones: datos.observaciones.trim(),
          detalleDanios: datos.huboDanios ? datos.detalleDanios.trim() : "",
          idMulta: nuevoId("M"), idEmision, idAlumno,
          montoSancion: tipo.id === "extraordinaria" ? datos.montoSancion : tipo.monto,
          montoDanios: datos.huboDanios ? datos.montoDanios : 0,
          monto: (tipo.id === "extraordinaria" ? datos.montoSancion : tipo.monto) + (datos.huboDanios ? datos.montoDanios : 0),
          fechaEmision: FECHA_REFERENCIA,
          ...calendarioMulta(FECHA_REFERENCIA, contratoVigente(state.contratos, idAlumno)?.diaVencimientoPago),
          estado: "pendiente", fechaPago: null,
        }));
        setState((previo) => ({ ...previo, multas: [...nuevas, ...previo.multas] }));
        return nuevas.map((m) => m.idMulta);
      },

      actualizarMulta({ idMulta, ...datos }) {
        if (state.facturas.some((f) => f.detalles.some((d) => d.idMulta === idMulta))) throw new Error("La multa ya está facturada y no admite modificaciones.");
        const tipo = TIPOS_MULTA.find((t) => t.id === datos.tipo);
        if (!tipo || !datos.motivo.trim() || !Number.isFinite(datos.montoSancion) || datos.montoSancion <= 0 || !Number.isFinite(datos.montoDanios) || datos.montoDanios < 0 || (datos.huboDanios && (!datos.detalleDanios.trim() || datos.montoDanios <= 0))) return;
        setState((previo) => ({ ...previo, multas: previo.multas.map((multa) =>
          multa.idMulta === idMulta && multa.estado === "pendiente"
            ? conHistorialMulta(multa, { ...multa, ...datos, montoSancion: tipo.id === "extraordinaria" ? datos.montoSancion : tipo.monto, montoDanios: datos.huboDanios ? datos.montoDanios : 0, monto: (tipo.id === "extraordinaria" ? datos.montoSancion : tipo.monto) + (datos.huboDanios ? datos.montoDanios : 0), detalleDanios: datos.huboDanios ? datos.detalleDanios.trim() : "" }, "edicion")
            : multa,
        ) }));
      },

      extenderPlazoMulta(idMulta, motivo) {
        if (state.facturas.some((f) => f.detalles.some((d) => d.idMulta === idMulta))) return;
        if (!motivo.trim()) return;
        setState((previo) => ({ ...previo, multas: previo.multas.map((multa) => {
          if (multa.idMulta !== idMulta || multa.estado !== "pendiente") return multa;
          const fechaVence = extenderMes(multa.fechaVence);
          return conHistorialMulta(multa, { ...multa, fechaVence, periodoHasta: fechaVence.slice(0, 7) }, "prorroga", motivo.trim());
        }) }));
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
          alumnos: [...previo.alumnos, { ...input, idAlumno, estado: "activo" }],
        }));
        return idAlumno;
      },

      crearHabitacion(input) {
        const idHabitacion = nuevoId("H");
        setState((previo) => ({ ...previo, habitaciones: [...previo.habitaciones, { ...input, idHabitacion }] }));
        return idHabitacion;
      },

      actualizarTareaLimpieza(numero, input) {
        if (!state.tareasLimpieza.some((tarea) => tarea.numero === numero)) throw new Error("La tarea no existe.");
        const error = validarTareaLimpieza(input, state.tareasLimpieza, numero);
        if (error) throw new Error(error);
        setState((previo) => {
          if (validarTareaLimpieza(input, previo.tareasLimpieza, numero)) return previo;
          return { ...previo, tareasLimpieza: previo.tareasLimpieza.map((tarea) => tarea.numero === numero ? {
            ...tarea, nombre: input.nombre.trim(), tareas: input.tareas.map((actividad) => actividad.trim()),
          } : tarea) };
        });
      },

      crearTareaLimpieza(input) {
        const error = validarTareaLimpieza(input, state.tareasLimpieza);
        if (error) throw new Error(error);
        setState((previo) => {
          if (validarTareaLimpieza(input, previo.tareasLimpieza)) return previo;
          const numero = Math.max(0, ...previo.tareasLimpieza.map((tarea) => tarea.numero)) + 1;
          return { ...previo, tareasLimpieza: [...previo.tareasLimpieza, {
            numero,
            enRotacion: false,
            nombre: input.nombre.trim(),
            tareas: input.tareas.map((actividad) => actividad.trim()),
          }] };
        });
      },

      crearGrupoLimpieza(input) {
        const error = validarGrupoLimpieza(state, input);
        if (error) throw new Error(error);
        const idGrupoLimpieza = nuevoId("G");
        setState((previo) => {
          if (validarGrupoLimpieza(previo, input)) return previo;
          return actualizarIntegrantesLimpieza({ ...previo, grupos: [...previo.grupos, {
            idGrupoLimpieza, nombreDelGrupo: input.nombreDelGrupo.trim(), tareaInicial: input.tareaInicial,
          }] }, idGrupoLimpieza, input.idAlumnos);
        });
        return idGrupoLimpieza;
      },

      actualizarGrupoLimpieza(idGrupoLimpieza, nombreDelGrupo) {
        nombreDelGrupo = nombreDelGrupo.trim();
        if (!nombreDelGrupo || state.grupos.some((g) => g.idGrupoLimpieza !== idGrupoLimpieza && g.nombreDelGrupo.trim().toLowerCase() === nombreDelGrupo.toLowerCase())) return;
        setState((previo) => ({
          ...previo,
          grupos: previo.grupos.map((grupo) =>
            grupo.idGrupoLimpieza === idGrupoLimpieza
              ? { ...grupo, nombreDelGrupo }
              : grupo,
          ),
        }));
      },

      eliminarGrupoLimpieza(idGrupoLimpieza) {
        setState((previo) => ({
          ...previo,
          grupos: previo.grupos.filter(
            (grupo) => grupo.idGrupoLimpieza !== idGrupoLimpieza,
          ),
          grupoAlumnos: previo.grupoAlumnos.filter(
            (asignacion) => asignacion.idGrupoLimpieza !== idGrupoLimpieza,
          ),
          grupoAmbientes: previo.grupoAmbientes.filter(
            (asignacion) => asignacion.idGrupoLimpieza !== idGrupoLimpieza,
          ),
        }));
      },

      guardarAlumnosGrupo(idGrupoLimpieza, idAlumnos) {
        setState((previo) => actualizarIntegrantesLimpieza(previo, idGrupoLimpieza, idAlumnos));
      },

      asignarAmbienteGrupo(idGrupoLimpieza, idAmbiente, fechaDesde) {
        const yaAsignado = state.grupoAmbientes.some(
          (asignacion) =>
            asignacion.idAmbiente === idAmbiente &&
            (asignacion.fechaHasta === null ||
              asignacion.fechaHasta > fechaDesde),
        );
        if (yaAsignado) return false;

        setState((previo) => {
          const ocupado = previo.grupoAmbientes.some(
            (asignacion) =>
              asignacion.idAmbiente === idAmbiente &&
              (asignacion.fechaHasta === null ||
                asignacion.fechaHasta > fechaDesde),
          );
          if (ocupado) return previo;
          return {
            ...previo,
            grupoAmbientes: [
              ...previo.grupoAmbientes,
              {
                idGrupoLimpieza,
                idAmbiente,
                fechaDesde,
                fechaHasta: null,
              },
            ],
          };
        });
        return true;
      },

      liberarAmbienteGrupo(idGrupoLimpieza, idAmbiente) {
        setState((previo) => ({
          ...previo,
          grupoAmbientes: previo.grupoAmbientes.map((asignacion) =>
            asignacion.idGrupoLimpieza === idGrupoLimpieza &&
            asignacion.idAmbiente === idAmbiente &&
            asignacion.fechaDesde <= FECHA_REFERENCIA &&
            (asignacion.fechaHasta === null ||
              asignacion.fechaHasta > FECHA_REFERENCIA)
              ? { ...asignacion, fechaHasta: FECHA_REFERENCIA }
              : asignacion,
          ),
        }));
      },

      cancelarContrato(idContrato, fecha, motivo) {
        setState((previo) => {
          const contrato = previo.contratos.find((c) => c.idContrato === idContrato);
          if (!contrato || contrato.fechaCancelacion || fecha < contrato.fechaDesde || fecha > contrato.fechaHasta || fecha > FECHA_REFERENCIA || !motivo.trim()) return previo;
          return {
            ...previo,
            contratos: previo.contratos.map((c) => c.idContrato === idContrato ? { ...c, fechaCancelacion: fecha, motivoCancelacion: motivo.trim() } : c),
            asignaciones: previo.asignaciones.map((a) => a.idAlumno === contrato.idAlumno && a.fechaDesde <= contrato.fechaHasta && (!a.fechaHasta || a.fechaHasta > fecha) ? { ...a, fechaHasta: a.fechaDesde > fecha ? a.fechaDesde : fecha } : a),
          };
        });
      },

      crearContrato(input) {
        const { idAlumno, fechaDesde, fechaHasta } = input;
        const idContrato = nuevoId("C");
        setState((previo) => contratosSuperpuestos(previo.contratos, { idAlumno, fechaDesde, fechaHasta }) || fechaHasta <= fechaDesde ? previo : ({
          ...previo,
          contratos: [
            ...previo.contratos,
            { ...input, idContrato },
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
