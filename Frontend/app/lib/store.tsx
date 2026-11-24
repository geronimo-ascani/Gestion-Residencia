import { DataLoadingScreen, DataErrorScreen, ErrorGuardadoBanner } from "../Components/layout/data-loading-screen";
import { aplicarAsignacionHabitacion, editarContrato, editarHabitacion, esFechaISO, validarAltaAlumno, validarAltaHabitacion, validarAltaContrato } from "./gestiones";
import { estadoAcceso } from "./administracion";
import { CAMBIO_DE_SESION, sincronizarUsuario, usuarioActual } from "./session";
import type { Usuario } from "./types";
import { prepararReclamo, actualizarReclamo } from "./reclamos";
import type { NuevoReclamoInput, EstadoReclamo } from "./types";
import { validarParametros, arancelesMulta } from "./parametros";
import type { Parametros } from "./parametros";
import { cambiarEstadoCuenta, crearCuentaAlumno, puedeGestionarAdministradores, registrarCambios, validarCorreoCuenta } from "./administracion";
import { createContext, useContext, useMemo, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { calendarioMulta, conHistorialMulta, extenderMes, importeMulta, TIPOS_MULTA } from "./multas";
import { estaActiva, asignacionActiva, actualizarIntegrantesLimpieza, validarGrupoLimpieza, validarTareaLimpieza, contratoVigente } from "./domain";
import { FECHA_REFERENCIA } from "./config";
import { actualizarMultaFacturada, aplicarCancelacionFactura, aplicarCobro, aplicarEmisionFactura, facturaActivaDeMulta, prepararFactura } from "./facturacion";
import type { ReemplazoFacturaInput, RegistrarCobroInput } from "./types";
import { normalizar } from "./format";
import { createInitialData } from "./initial-state";
import {
  getEstadoCompleto,
  apiCrearAlumno,
  apiCrearAccesoAlumno,
  apiActualizarAlumno,
  apiAsignarHabitacion,
  apiLiberarHabitacion,
  apiCrearContrato,
  apiActualizarContrato,
  apiCancelarContrato,
  apiEmitirMulta,
  apiActualizarMulta,
  apiProrrogarMulta,
  apiAnularMulta,
  apiRegistrarPagoMulta,
  apiRegistrarCobro,
  apiGenerarFactura,
  apiCancelarFactura,
  apiCrearAmbiente,
  apiAgregarEquipamientoAmbiente,
  apiActualizarEquipamientoAmbiente,
  apiGuardarParametros,
  apiGuardarOpcionCatalogo,
  apiCrearGrupoLimpieza,
  apiActualizarGrupoLimpieza,
  apiEliminarGrupoLimpieza,
  apiGuardarAlumnosGrupo,
  apiCrearTareaLimpieza,
  apiActualizarTareaLimpieza,
  apiAsignarAmbienteGrupo,
  apiLiberarAmbienteGrupo,
  apiCrearReclamo,
  apiResponderReclamo,
  apiCrearAdministrador,
  apiActualizarAdministrador,
  apiSuspenderCuenta,
  apiCambiarClave,
  apiCrearHabitacion,
  apiActualizarHabitacion,
} from "./api";
import { actualizarCatalogo } from "./catalogos";
import { editarEquipamiento, validarNuevoAmbiente } from "./ambientes";
import type { NuevoAmbienteInput } from "./ambientes";
import { TIPOS_AMBIENTE } from "./types";
import type {
  Alumno,
  CatalogoAlumno,
  DatosIngresoAlumno,
  Ambiente,
  DataState,
  EquipamientoAmbiente,
  GrupoDeLimpieza,
  NuevaTareaLimpiezaInput,
  Habitacion,
  Multa,
  OpcionCatalogo,
} from "./types";

let secuencia = 1000;

function nuevoId(prefijo: string): string {
  secuencia += 1;
  return `${prefijo}${Date.now()}-${secuencia}`;
}

function exigirAdministrador(data: DataState) {
  const cuenta = data.usuarios.find((u) => u.idUsuario === usuarioActual.idUsuario);
  if (cuenta?.rol !== "administrador" || estadoAcceso(cuenta, data) !== "activo") throw new Error("No tenés permiso para realizar esta gestión.");
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
export interface EditarMultaInput extends DatosMultaInput { idMulta: string; fechaVence: string; }

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
  usuarioAutenticado: Usuario | null;
  crearReclamo: (input: NuevoReclamoInput) => string;
  responderReclamo: (id: string, mensaje: string, estado?: EstadoReclamo) => void;
  guardarOpcionCatalogo: (catalogo: CatalogoAlumno, opcion: Omit<OpcionCatalogo, "id"> & { id?: string }) => void;
  guardarParametros: (valores: Parametros) => void;
  ajustarImporteContrato: (id: string, monto: number) => void;
  crearAdministrador: (input: { nombre: string; apellido: string; documento: string; correo: string; telefono: string; gestionaAdministradores: boolean }) => Promise<{ idUsuario: string; claveGenerada: string }>;
  actualizarAdministrador: (id: string, input: { nombre: string; apellido: string; correo: string; telefono: string }) => void;
  cambiarClave: (actual: string, nueva: string) => Promise<void>;
  crearAccesoAlumno: (idAlumno: string, correo: string) => Promise<string>;
  suspenderCuenta: (id: string, suspender: boolean) => void;
  generarFactura: (idContrato: string, periodo: string, reemplazo?: ReemplazoFacturaInput) => string;
  cancelarFactura: (idFactura: string, motivo: string) => void;
  registrarCobro: (input: RegistrarCobroInput) => string;
  alumnoPorId: Map<string, Alumno>;
  habitacionPorId: Map<string, Habitacion>;
  grupoPorId: Map<string, GrupoDeLimpieza>;
  ambientePorId: Map<string, Ambiente>;
  crearAmbiente: (input: NuevoAmbienteInput) => string | null;
  agregarEquipamientoAmbiente: (idAmbiente: string, equipo: EquipamientoAmbiente) => boolean;
  actualizarEquipamientoAmbiente: (idAmbiente: string, nombreAnterior: string, equipo?: EquipamientoAmbiente) => void;
  registrarPagoMulta: (idMulta: string) => void;
  anularMulta: (idMulta: string) => void;
  emitirMulta: (input: NuevaMultaInput) => string[];
  actualizarMulta: (input: EditarMultaInput) => void;
  extenderPlazoMulta: (idMulta: string, motivo: string) => void;
  asignarHabitacion: (idAlumno: string, idHabitacion: string) => void;
  liberarHabitacion: (idAlumno: string) => void;
  crearAlumno: (input: NuevoAlumnoInput) => string;
  actualizarAlumno: (idAlumno: string, input: Partial<NuevoAlumnoInput>) => void;
  actualizarHabitacion: (idHabitacion: string, input: NuevaHabitacionInput) => void;
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
  actualizarContrato: (idContrato: string, input: NuevoContratoInput) => void;
  crearContrato: (input: NuevoContratoInput) => void;
  cancelarContrato: (idContrato: string, fecha: string, motivo: string) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

/**
 * Estado compartido en memoria, cargado desde la API con una sesión validada.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setStateBase] = useState<DataState>(() => createInitialData());
  const [sesionId, setSesionId] = useState<string | null>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [errorGuardado, setErrorGuardado] = useState(false);

  function persistir(promesa: Promise<unknown>, accion: string) {
    promesa.catch((err) => {
      console.error(`[Persistencia] Error en ${accion}:`, err);
      setErrorGuardado(true);
    });
  }
  function setState(actualizar: (previo: DataState) => DataState) {
    const fecha = new Date().toISOString();
    const id = nuevoId("AUD");
    setStateBase((previo) => registrarCambios(previo, actualizar(previo), fecha, id));
  }

  const [listo, setListo] = useState(false);
  useEffect(() => {
    const controller = new AbortController();

    async function cargarSesion() {
      try {
        const datos = await getEstadoCompleto(controller.signal);
        if (controller.signal.aborted) return;
        if (datos) {
          const { idUsuarioSesion, ...estado } = datos;
          const cuenta = estado.usuarios.find((u) => u.idUsuario === idUsuarioSesion && u.estado === "activo");
          if (!cuenta) throw new Error("La API no devolvió la cuenta de esta sesión.");
          sincronizarUsuario(cuenta);
          setStateBase(estado);
          setSesionId(cuenta.idUsuario);
        } else {
          sincronizarUsuario(null);
        }
        setListo(true);
      } catch {
        if (!controller.signal.aborted) {
          setErrorCarga("No pudimos verificar tu sesión o cargar los datos de la residencia.");
        }
      }
    }

    void cargarSesion();

    function invalidarSesion() {
      controller.abort();
      sincronizarUsuario(null);
      setStateBase(createInitialData());
      setSesionId(null);
      setErrorCarga("");
      setListo(true);
    }

    const canal = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CAMBIO_DE_SESION);
    canal?.addEventListener("message", invalidarSesion);
    window.addEventListener(CAMBIO_DE_SESION, invalidarSesion);
    return () => {
      controller.abort();
      canal?.close();
      window.removeEventListener(CAMBIO_DE_SESION, invalidarSesion);
    };
  }, []);
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
      usuarioAutenticado: state.usuarios.find((u) => u.idUsuario === sesionId && u.estado === "activo") ?? null,
      crearReclamo(input) {
        const id = nuevoId("R");
        const fecha = new Date().toISOString();
        const reclamo = prepararReclamo(state, usuarioActual, input, id, fecha);
        setState((previo) => ({ ...previo, reclamos: [reclamo, ...previo.reclamos] }));
        persistir(apiCrearReclamo({ ...input, idAlumno: reclamo.idAlumno }), "crearReclamo");
        return id;
      },
      responderReclamo(id, mensaje, estado) {
        const eventoId = nuevoId("SEG");
        const fecha = new Date().toISOString();
        actualizarReclamo(state, usuarioActual, id, mensaje, estado, eventoId, fecha);
        setState((previo) => actualizarReclamo(previo, usuarioActual, id, mensaje, estado, eventoId, fecha));
        persistir(apiResponderReclamo(id, mensaje, estado), "responderReclamo");
      },
      guardarOpcionCatalogo(catalogo, opcion) {
        exigirAdministrador(state);
        if (opcion.id && !state[catalogo].some((item) => item.id === opcion.id)) throw new Error("La opción ya no existe.");
        const registro = { ...opcion, id: opcion.id ?? nuevoId("CAT") };
        actualizarCatalogo(state, catalogo, registro);
        setState((previo) => actualizarCatalogo(previo, catalogo, registro));
        persistir(apiGuardarOpcionCatalogo(catalogo, registro), "guardarOpcionCatalogo");
      },
      guardarParametros(valores) {
        exigirAdministrador(state);
        if (usuarioActual.rol !== "administrador") throw new Error("No tenés permiso para modificar parámetros.");
        validarParametros(valores);
        setState((previo) => ({ ...previo, parametros: { ...valores } }));
        persistir(apiGuardarParametros(valores), "guardarParametros");
      },
      ajustarImporteContrato(id, monto) {
        exigirAdministrador(state);
        if (usuarioActual.rol !== "administrador" || !Number.isFinite(monto) || monto <= 0 || Math.abs(monto * 100 - Math.round(monto * 100)) > 0.00001) throw new Error("Ingresá un importe positivo con hasta dos decimales.");
        setState((previo) => ({ ...previo, contratos: previo.contratos.map((c) => c.idContrato === id ? { ...c, montoMensual: monto } : c) }));
        persistir(apiActualizarContrato(id, { montoMensual: monto }), "ajustarImporteContrato");
      },
      async cambiarClave(actual, nueva) {
        if (nueva === actual) throw new Error("Elegí una contraseña diferente a la actual.");
        await apiCambiarClave(actual, nueva);
      },
      async crearAdministrador(input) {
        exigirAdministrador(state);
        if (!puedeGestionarAdministradores(state)) throw new Error("No tenés permiso para gestionar administradores.");
        if (!input.nombre.trim()) throw new Error("Ingresá el nombre completo.");
        validarCorreoCuenta(input.correo, state.usuarios);
        const cuenta = await apiCrearAdministrador(input);
        const idUsuario = String(cuenta.idUsuario);
        setState((previo) => ({
          ...previo,
          usuarios: [...previo.usuarios, {
            ...input, nombre: input.nombre.trim(), apellido: input.apellido.trim(),
            correo: input.correo.trim().toLowerCase(), idUsuario, rol: "administrador",
            estado: "activo", fechaAlta: FECHA_REFERENCIA,
          }],
        }));
        return { idUsuario, claveGenerada: cuenta.claveGenerada };
      },
      actualizarAdministrador(id, input) {
        exigirAdministrador(state);
        if (!puedeGestionarAdministradores(state) && id !== usuarioActual.idUsuario) throw new Error("No tenés permiso para editar este perfil.");
        if (!input.nombre.trim()) throw new Error("Ingresá el nombre completo.");
        validarCorreoCuenta(input.correo, state.usuarios, id);
        setState((previo) => ({ ...previo, usuarios: previo.usuarios.map((u) => u.idUsuario === id && u.rol === "administrador" ? { ...u, nombre: `${input.nombre.trim()} ${input.apellido.trim()}`, apellido: input.apellido.trim(), correo: input.correo.trim().toLowerCase(), telefono: input.telefono.trim() } : u) }));
        persistir(apiActualizarAdministrador(id, input), "actualizarAdministrador");
      },
      async crearAccesoAlumno(idAlumno, correo) {
        exigirAdministrador(state);
        crearCuentaAlumno(state, idAlumno, correo, "");
        const cuenta = await apiCrearAccesoAlumno(idAlumno, correo);
        setState((previo) => crearCuentaAlumno(previo, idAlumno, correo, String(cuenta.idUsuario)));
        return cuenta.claveGenerada;
      },
      suspenderCuenta(id, suspender) {
        exigirAdministrador(state);
        cambiarEstadoCuenta(state, id, suspender);
        setState((previo) => cambiarEstadoCuenta(previo, id, suspender));
        persistir(apiSuspenderCuenta(id, suspender), "suspenderCuenta");
      },
      alumnoPorId,
      habitacionPorId,
      grupoPorId,
      ambientePorId,

      generarFactura(idContrato, periodo, reemplazo) {
        exigirAdministrador(state);
        const id = nuevoId("F");
        prepararFactura(state, idContrato, periodo, id, reemplazo);
        setState((previo) => {
          if (previo.facturas.some((f) => (!f.fechaCancelacion && f.idContrato === idContrato && f.periodo === periodo) ||
            (reemplazo && f.idFacturaOrigen === reemplazo.idFacturaOrigen))) return previo;
          return aplicarEmisionFactura(previo, prepararFactura(previo, idContrato, periodo, id, reemplazo));
        });
        persistir(apiGenerarFactura(idContrato, periodo, reemplazo), "generarFactura");
        return id;
      },

      cancelarFactura(idFactura, motivo) {
        exigirAdministrador(state);
        aplicarCancelacionFactura(state, idFactura, motivo);
        setState((previo) => aplicarCancelacionFactura(previo, idFactura, motivo));
        persistir(apiCancelarFactura(idFactura, motivo), "cancelarFactura");
      },

      registrarCobro(input) {
        exigirAdministrador(state);
        const id = nuevoId("P");
        aplicarCobro(state, input, id);
        setState((previo) => aplicarCobro(previo, input, id));
        persistir(apiRegistrarCobro(input), "registrarCobro");
        return id;
      },

      crearAmbiente(input) {
        exigirAdministrador(state);
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
        persistir(apiCrearAmbiente(input), "crearAmbiente");
        return idAmbiente;
      },

      agregarEquipamientoAmbiente(idAmbiente, equipo) {
        exigirAdministrador(state);
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
        persistir(apiAgregarEquipamientoAmbiente(idAmbiente, equipo), "agregarEquipamientoAmbiente");
        return true;
      },

      actualizarEquipamientoAmbiente(idAmbiente, nombreAnterior, equipo) {
        exigirAdministrador(state);
        const aplicar = (previo: DataState) => {
          const ambiente = previo.ambientes.find((item) => item.idAmbiente === idAmbiente && item.tipo);
          if (!ambiente) throw new Error("El ambiente no existe.");
          const actualizado = editarEquipamiento(ambiente, nombreAnterior, equipo);
          return { ...previo, ambientes: previo.ambientes.map((item) => item === ambiente ? actualizado : item) };
        };
        aplicar(state);
        setState(aplicar);
        persistir(apiActualizarEquipamientoAmbiente(idAmbiente, nombreAnterior, equipo), "actualizarEquipamientoAmbiente");
      },

      registrarPagoMulta(idMulta) {
        exigirAdministrador(state);
        if (facturaActivaDeMulta(state.facturas, idMulta)) return;
        setState((previo) => ({
          ...previo,
          multas: previo.multas.map((multa) =>
            multa.idMulta === idMulta
              ? { ...multa, estado: "pagada", fechaPago: FECHA_REFERENCIA, montoPagado: importeMulta(multa).total }
              : multa,
          ),
        }));
        persistir(apiRegistrarPagoMulta(idMulta), "registrarPagoMulta");
      },

      anularMulta(idMulta) {
        exigirAdministrador(state);
        if (facturaActivaDeMulta(state.facturas, idMulta)) return;
        setState((previo) => ({
          ...previo,
          multas: previo.multas.map((multa) =>
            multa.idMulta === idMulta
              ? { ...multa, estado: "anulada", fechaPago: null }
              : multa,
          ),
        }));
        persistir(apiAnularMulta(idMulta), "anularMulta");
      },

      emitirMulta({ idAlumnos, ...datos }) {
        exigirAdministrador(state);
        const tipo = arancelesMulta(TIPOS_MULTA, state.parametros).find((t) => t.id === datos.tipo);
        if (!tipo || !datos.motivo.trim() || !Number.isFinite(datos.montoSancion) || datos.montoSancion <= 0 || !Number.isFinite(datos.montoDanios) || datos.montoDanios < 0 || (datos.huboDanios && (!datos.detalleDanios.trim() || datos.montoDanios <= 0))) return [];
        const idEmision = nuevoId("E");
        const nuevas: Multa[] = [...new Set(idAlumnos)].filter((id) => alumnoPorId.has(id)).map((idAlumno) => ({
          ...datos, motivo: datos.motivo.trim(), observaciones: datos.observaciones.trim(),
          detalleDanios: datos.huboDanios ? datos.detalleDanios.trim() : "",
          idMulta: nuevoId("M"), idEmision, idAlumno, recargoPorcentaje: state.parametros.recargoMulta,
          montoSancion: tipo.id === "extraordinaria" ? datos.montoSancion : tipo.monto,
          montoDanios: datos.huboDanios ? datos.montoDanios : 0,
          monto: (tipo.id === "extraordinaria" ? datos.montoSancion : tipo.monto) + (datos.huboDanios ? datos.montoDanios : 0),
          fechaEmision: FECHA_REFERENCIA,
          ...calendarioMulta(FECHA_REFERENCIA, contratoVigente(state.contratos, idAlumno)?.diaVencimientoPago),
          estado: "pendiente", fechaPago: null,
        }));
        setState((previo) => ({ ...previo, multas: [...nuevas, ...previo.multas] }));
        persistir(apiEmitirMulta({ idAlumnos, ...datos }), "emitirMulta");
        return nuevas.map((m) => m.idMulta);
      },

      actualizarMulta({ idMulta, fechaVence, ...datos }) {
        exigirAdministrador(state);
        const aplicar = (previo: DataState) => {
          const anterior = previo.multas.find((m) => m.idMulta === idMulta);
          if (anterior?.estado !== "pendiente") throw new Error("Solo se pueden modificar multas pendientes.");
          const tipo = arancelesMulta(TIPOS_MULTA, previo.parametros).find((t) => t.id === datos.tipo);
          if (!tipo || !datos.motivo.trim() || !Number.isFinite(datos.montoSancion) || datos.montoSancion <= 0 ||
            !Number.isFinite(datos.montoDanios) || datos.montoDanios < 0 ||
            (datos.huboDanios && (!datos.detalleDanios.trim() || datos.montoDanios <= 0))) {
            throw new Error("Revisá el tipo, el motivo y los importes de la multa.");
          }
          if (!esFechaISO(fechaVence) || fechaVence < anterior.fechaEmision) throw new Error("El vencimiento debe ser igual o posterior a la fecha de emisión.");
          const montoSancion = tipo.id === "extraordinaria" ? datos.montoSancion
            : anterior.tipo === tipo.id ? anterior.montoSancion ?? anterior.monto - (anterior.montoDanios ?? 0) : tipo.monto;
          const montoDanios = datos.huboDanios ? datos.montoDanios : 0;
          const multa = conHistorialMulta(anterior, {
            ...anterior, ...datos, fechaVence,
            periodoHasta: fechaVence === anterior.fechaVence ? anterior.periodoHasta : fechaVence.slice(0, 7),
            motivo: datos.motivo.trim(), observaciones: datos.observaciones.trim(),
            montoSancion, montoDanios, monto: Math.round((montoSancion + montoDanios) * 100) / 100,
            detalleDanios: datos.huboDanios ? datos.detalleDanios.trim() : "",
          }, "edicion");
          return actualizarMultaFacturada(previo, anterior, multa);
        };
        aplicar(state);
        setState(aplicar);
        persistir(apiActualizarMulta({ idMulta, fechaVence, ...datos }), "actualizarMulta");
      },

      extenderPlazoMulta(idMulta, motivo) {
        exigirAdministrador(state);
        if (facturaActivaDeMulta(state.facturas, idMulta)) return;
        if (!motivo.trim()) return;
        setState((previo) => ({ ...previo, multas: previo.multas.map((multa) => {
          if (multa.idMulta !== idMulta || multa.estado !== "pendiente") return multa;
          const fechaVence = extenderMes(multa.fechaVence);
          return conHistorialMulta(multa, { ...multa, fechaVence, periodoHasta: fechaVence.slice(0, 7) }, "prorroga", motivo.trim());
        }) }));
        persistir(apiProrrogarMulta(idMulta, motivo.trim()), "extenderPlazoMulta");
      },

      asignarHabitacion(idAlumno, idHabitacion) {
        exigirAdministrador(state);
        aplicarAsignacionHabitacion(state, idAlumno, idHabitacion);
        setState((previo) => aplicarAsignacionHabitacion(previo, idAlumno, idHabitacion));
        persistir(apiAsignarHabitacion(idAlumno, idHabitacion), "asignarHabitacion");
      },

      liberarHabitacion(idAlumno) {
        exigirAdministrador(state);
        const asignacion = asignacionActiva(state.asignaciones, idAlumno);
        setState((previo) => ({
          ...previo,
          asignaciones: previo.asignaciones.map((asignacion) =>
            asignacion.idAlumno === idAlumno && estaActiva(asignacion.fechaDesde, asignacion.fechaHasta)
              ? { ...asignacion, fechaHasta: FECHA_REFERENCIA }
              : asignacion,
          ),
        }));
        if (asignacion?.idHabitacion) {
          persistir(apiLiberarHabitacion(idAlumno, asignacion.idHabitacion), "liberarHabitacion");
        }
      },

      crearAlumno(input) {
        exigirAdministrador(state);
        validarAltaAlumno(state, input);
        const idAlumno = nuevoId("A");
        setState((previo) => ({
          ...previo,
          alumnos: [...previo.alumnos, { ...input, idAlumno, estado: "activo" }],
        }));
        persistir(apiCrearAlumno(input), "crearAlumno");
        return idAlumno;
      },

      actualizarAlumno(idAlumno, input) {
        exigirAdministrador(state);
        const alumno = alumnoPorId.get(idAlumno);
        if (!alumno) throw new Error("El alumno no existe.");
        if (input.nombre !== undefined || input.apellido !== undefined || input.documento !== undefined ||
          input.telefono !== undefined || input.correo !== undefined) {
          validarAltaAlumno(state, { ...alumno, ...input }, idAlumno);
        }
        setState((previo) => ({
          ...previo,
          alumnos: previo.alumnos.map((alumno) => alumno.idAlumno === idAlumno ? { ...alumno, ...input } : alumno),
        }));
        persistir(apiActualizarAlumno(idAlumno, input), "actualizarAlumno");
      },

      actualizarHabitacion(idHabitacion, input) {
        exigirAdministrador(state);
        editarHabitacion(state, idHabitacion, input);
        setState((previo) => editarHabitacion(previo, idHabitacion, input));
        persistir(apiActualizarHabitacion(idHabitacion, input), "actualizarHabitacion");
      },
      crearHabitacion(input) {
        exigirAdministrador(state);
        validarAltaHabitacion(state, input);
        const idHabitacion = nuevoId("H");
        setState((previo) => ({ ...previo, habitaciones: [...previo.habitaciones, { ...input, idHabitacion }] }));
        persistir(apiCrearHabitacion(input), "crearHabitacion");
        return idHabitacion;
      },

      actualizarTareaLimpieza(numero, input) {
        exigirAdministrador(state);
        if (!state.tareasLimpieza.some((tarea) => tarea.numero === numero)) throw new Error("La tarea no existe.");
        const error = validarTareaLimpieza(input, state.tareasLimpieza, numero);
        if (error) throw new Error(error);
        setState((previo) => {
          if (validarTareaLimpieza(input, previo.tareasLimpieza, numero)) return previo;
          return { ...previo, tareasLimpieza: previo.tareasLimpieza.map((tarea) => tarea.numero === numero ? {
            ...tarea, nombre: input.nombre.trim(), tareas: input.tareas.map((actividad) => actividad.trim()),
          } : tarea) };
        });
        persistir(apiActualizarTareaLimpieza(numero, input), "actualizarTareaLimpieza");
      },

      crearTareaLimpieza(input) {
        exigirAdministrador(state);
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
        persistir(apiCrearTareaLimpieza(input), "crearTareaLimpieza");
      },

      crearGrupoLimpieza(input) {
        exigirAdministrador(state);
        const error = validarGrupoLimpieza(state, input);
        if (error) throw new Error(error);
        const idGrupoLimpieza = nuevoId("G");
        setState((previo) => {
          if (validarGrupoLimpieza(previo, input)) return previo;
          return actualizarIntegrantesLimpieza({ ...previo, grupos: [...previo.grupos, {
            idGrupoLimpieza, nombreDelGrupo: input.nombreDelGrupo.trim(), tareaInicial: input.tareaInicial,
          }] }, idGrupoLimpieza, input.idAlumnos);
        });
        persistir(apiCrearGrupoLimpieza(input), "crearGrupoLimpieza");
        return idGrupoLimpieza;
      },

      actualizarGrupoLimpieza(idGrupoLimpieza, nombreDelGrupo) {
        exigirAdministrador(state);
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
        persistir(apiActualizarGrupoLimpieza(idGrupoLimpieza, nombreDelGrupo), "actualizarGrupoLimpieza");
      },

      eliminarGrupoLimpieza(idGrupoLimpieza) {
        exigirAdministrador(state);
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
        persistir(apiEliminarGrupoLimpieza(idGrupoLimpieza), "eliminarGrupoLimpieza");
      },

      guardarAlumnosGrupo(idGrupoLimpieza, idAlumnos) {
        exigirAdministrador(state);
        setState((previo) => actualizarIntegrantesLimpieza(previo, idGrupoLimpieza, idAlumnos));
        persistir(apiGuardarAlumnosGrupo(idGrupoLimpieza, idAlumnos), "guardarAlumnosGrupo");
      },

      asignarAmbienteGrupo(idGrupoLimpieza, idAmbiente, fechaDesde) {
        exigirAdministrador(state);
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
        persistir(apiAsignarAmbienteGrupo(idGrupoLimpieza, idAmbiente, fechaDesde), "asignarAmbienteGrupo");
        return true;
      },

      liberarAmbienteGrupo(idGrupoLimpieza, idAmbiente) {
        exigirAdministrador(state);
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
        persistir(apiLiberarAmbienteGrupo(idGrupoLimpieza, idAmbiente, FECHA_REFERENCIA), "liberarAmbienteGrupo");
      },

      cancelarContrato(idContrato, fecha, motivo) {
        exigirAdministrador(state);
        setState((previo) => {
          const contrato = previo.contratos.find((c) => c.idContrato === idContrato);
          if (!contrato || contrato.fechaCancelacion || fecha < contrato.fechaDesde || fecha > contrato.fechaHasta || fecha > FECHA_REFERENCIA || !motivo.trim()) return previo;
          return {
            ...previo,
            contratos: previo.contratos.map((c) => c.idContrato === idContrato ? { ...c, fechaCancelacion: fecha, motivoCancelacion: motivo.trim() } : c),
            asignaciones: previo.asignaciones.map((a) => a.idAlumno === contrato.idAlumno && a.fechaDesde <= contrato.fechaHasta && (!a.fechaHasta || a.fechaHasta > fecha) ? { ...a, fechaHasta: a.fechaDesde > fecha ? a.fechaDesde : fecha } : a),
          };
        });
        persistir(apiCancelarContrato(idContrato, fecha, motivo), "cancelarContrato");
      },

      actualizarContrato(idContrato, input) {
        exigirAdministrador(state);
        editarContrato(state, idContrato, input);
        setState((previo) => editarContrato(previo, idContrato, input));
        persistir(apiActualizarContrato(idContrato, input), "actualizarContrato");
      },

      crearContrato(input) {
        exigirAdministrador(state);
        validarAltaContrato(state, input);
        const idContrato = nuevoId("C");
        setState((previo) => ({ ...previo, contratos: [...previo.contratos, { ...input, idContrato }] }));
        persistir(apiCrearContrato(input), "crearContrato");
      },
    };
  }, [state, sesionId]);

  if (errorCarga) {
    return <DataErrorScreen error={errorCarga} />;
  }

  if (!listo) {
    return <DataLoadingScreen />;
  }

  return (
    <DataContext.Provider value={value}>
      {errorGuardado ? <ErrorGuardadoBanner /> : null}
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const contexto = useContext(DataContext);
  if (!contexto) {
    throw new Error("useData debe usarse dentro de <DataProvider>");
  }
  return contexto;
}
