import { DataLoadingScreen, DataErrorScreen, ErrorGuardadoBanner } from "../Components/layout/data-loading-screen";
import { aplicarAsignacionHabitacion, editarContrato, editarHabitacion, esFechaISO, validarAltaAlumno, validarAltaHabitacion, validarAltaContrato } from "./gestiones";
import { cargarDatosGuardados, DATOS_KEY } from "./persistence";
import { estadoAcceso } from "./administracion";
import { sincronizarUsuario } from "./session";
import type { Usuario } from "./types";
import { prepararReclamo, actualizarReclamo } from "./reclamos";
import type { NuevoReclamoInput, EstadoReclamo } from "./types";
import { validarParametros, arancelesMulta } from "./parametros";
import type { Parametros } from "./parametros";
import { claveInicial, hashClave } from "./credenciales";
import { restaurarSesion } from "./session";
import { usuarioActual } from "./session";
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
  crearAdministrador: (input: { nombre: string; apellido: string; documento: string; correo: string; telefono: string; gestionaAdministradores: boolean }) => string;
  actualizarAdministrador: (id: string, input: { nombre: string; apellido: string; correo: string; telefono: string }) => void;
  cambiarClave: (actual: string, nueva: string) => Promise<void>;
  crearAccesoAlumno: (idAlumno: string, correo: string) => void;
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
 * Estado compartido del prototipo, persistido en este navegador.
 * El backend deberá reemplazar esta persistencia y validar cada operación.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setStateBase] = useState<DataState>(() => createInitialData());
  const [sesionId, setSesionId] = useState<string | null>(() => restaurarSesion());
  const [errorCarga, setErrorCarga] = useState("");
  const [errorGuardado, setErrorGuardado] = useState(false);
  function setState(actualizar: (previo: DataState) => DataState) {
    const fecha = new Date().toISOString();
    const id = nuevoId("AUD");
    setStateBase((previo) => registrarCambios(previo, actualizar(previo), fecha, id));
  }

  const [listo, setListo] = useState(false);
  useEffect(() => {
    let cancelado = false;

    async function sincronizarConBaseDeDatos() {
      const sesionActualId = restaurarSesion();

      // 1. Carga inmediata desde almacenamiento local si existe
      try {
        const guardado = localStorage.getItem(DATOS_KEY);
        if (guardado) {
          const datosLocales = cargarDatosGuardados(guardado);
          const cuenta = sesionActualId
            ? datosLocales.usuarios.find(
                (u) =>
                  u.idUsuario === sesionActualId ||
                  (usuarioActual.correo && u.correo?.toLowerCase() === usuarioActual.correo.toLowerCase())
              )
            : null;

          if (!cancelado) {
            setStateBase(datosLocales);
            if (cuenta && cuenta.estado === "activo") {
              sincronizarUsuario(cuenta);
              setSesionId(cuenta.idUsuario);
              setListo(true);
            } else if (!sesionActualId) {
              setListo(true);
            }
          }
        }
      } catch (err) {
        console.warn("No se pudieron cargar datos locales:", err);
      }

      // 2. Sincronización en segundo plano con PostgreSQL
      try {
        const datosBD = await getEstadoCompleto();
        if (datosBD && !cancelado) {
          setStateBase(datosBD);
          const id = restaurarSesion();
          const cuenta = datosBD.usuarios.find(
            (u) =>
              u.idUsuario === id ||
              (usuarioActual.correo && u.correo?.toLowerCase() === usuarioActual.correo.toLowerCase())
          );
          if (cuenta && cuenta.estado === "activo") {
            sincronizarUsuario(cuenta);
            setSesionId(cuenta.idUsuario);
          } else if (id && usuarioActual.idUsuario && usuarioActual.estado === "activo") {
            setSesionId(id);
          }
          setListo(true);
          try {
            localStorage.setItem(DATOS_KEY, JSON.stringify(datosBD));
          } catch {}
          return;
        }
      } catch (err) {
        console.warn("No se pudo sincronizar directamente con la base de datos, usando respaldo:", err);
      }

      try {
        const guardado = localStorage.getItem(DATOS_KEY);
        if (guardado) {
          const datos = cargarDatosGuardados(guardado);
          const id = restaurarSesion();
          const cuenta = datos.usuarios.find(
            (u) =>
              u.idUsuario === id ||
              (usuarioActual.correo && u.correo?.toLowerCase() === usuarioActual.correo.toLowerCase())
          );
          if (cuenta && cuenta.estado === "activo") {
            sincronizarUsuario(cuenta);
            setSesionId(cuenta.idUsuario);
          }
          if (!cancelado) {
            setStateBase(datos);
            setListo(true);
          }
        } else if (!cancelado) {
          setListo(true);
        }
      } catch {
        if (!cancelado) {
          setErrorCarga("No se pudieron cargar los datos de la residencia.");
        }
      }
    }

    sincronizarConBaseDeDatos();

    function recibir(event: StorageEvent) {
      if (event.key !== DATOS_KEY) return;
      try { setStateBase(cargarDatosGuardados(event.newValue)); }
      catch { setListo(false); setErrorCarga("Los datos se modificaron en otra pestaña y no se pudieron leer. Conservamos la información original."); }
    }
    window.addEventListener("storage", recibir);
    return () => {
      cancelado = true;
      window.removeEventListener("storage", recibir);
    };
  }, []);
  useEffect(() => {
    if (!listo) return;
    try { localStorage.setItem(DATOS_KEY, JSON.stringify(state)); setErrorGuardado(false); }
    catch { setErrorGuardado(true); }
  }, [state, listo]);
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
      usuarioAutenticado: (() => {
        const idBuscado = sesionId ?? restaurarSesion();
        if (!idBuscado) return null;
        const u = state.usuarios.find(
          (user) =>
            user.idUsuario === idBuscado ||
            (usuarioActual.correo && user.correo?.toLowerCase() === usuarioActual.correo.toLowerCase())
        );
        if (u && u.estado === "activo") return u;
        if (
          usuarioActual &&
          usuarioActual.idUsuario &&
          (usuarioActual.idUsuario === idBuscado ||
            (usuarioActual.correo && u?.correo && usuarioActual.correo.toLowerCase() === u.correo.toLowerCase())) &&
          usuarioActual.estado === "activo"
        ) {
          return usuarioActual;
        }
        return null;
      })(),
      crearReclamo(input) {
        const id = nuevoId("R");
        const fecha = new Date().toISOString();
        const reclamo = prepararReclamo(state, usuarioActual, input, id, fecha);
        setState((previo) => ({ ...previo, reclamos: [reclamo, ...previo.reclamos] }));
        void apiCrearReclamo({ ...input, idAlumno: reclamo.idAlumno });
        return id;
      },
      responderReclamo(id, mensaje, estado) {
        const eventoId = nuevoId("SEG");
        const fecha = new Date().toISOString();
        actualizarReclamo(state, usuarioActual, id, mensaje, estado, eventoId, fecha);
        setState((previo) => actualizarReclamo(previo, usuarioActual, id, mensaje, estado, eventoId, fecha));
        void apiResponderReclamo(id, mensaje, estado);
      },
      guardarOpcionCatalogo(catalogo, opcion) {
        exigirAdministrador(state);
        if (opcion.id && !state[catalogo].some((item) => item.id === opcion.id)) throw new Error("La opción ya no existe.");
        const registro = { ...opcion, id: opcion.id ?? nuevoId("CAT") };
        actualizarCatalogo(state, catalogo, registro);
        setState((previo) => actualizarCatalogo(previo, catalogo, registro));
        void apiGuardarOpcionCatalogo(catalogo, registro);
      },
      guardarParametros(valores) {
        exigirAdministrador(state);
        if (usuarioActual.rol !== "administrador") throw new Error("No tenés permiso para modificar parámetros.");
        validarParametros(valores);
        setState((previo) => ({ ...previo, parametros: { ...valores } }));
        void apiGuardarParametros(valores);
      },
      ajustarImporteContrato(id, monto) {
        exigirAdministrador(state);
        if (usuarioActual.rol !== "administrador" || !Number.isFinite(monto) || monto <= 0 || Math.abs(monto * 100 - Math.round(monto * 100)) > 0.00001) throw new Error("Ingresá un importe positivo con hasta dos decimales.");
        setState((previo) => ({ ...previo, contratos: previo.contratos.map((c) => c.idContrato === id ? { ...c, montoMensual: monto } : c) }));
        void apiActualizarContrato(id, { montoMensual: monto });
      },
      async cambiarClave(actual, nueva) {
        const u = state.usuarios.find((u) => u.idUsuario === usuarioActual.idUsuario);
        if (!u) throw new Error("La cuenta no existe.");
        const esperado = u.passwordHash ?? await hashClave(claveInicial(u.apellido ?? "", u.documento ?? ""));
        if (await hashClave(actual) !== esperado) throw new Error("La contraseña actual no es correcta.");
        if (nueva.length < 8) throw new Error("La nueva contraseña debe tener al menos 8 caracteres.");
        if (nueva === actual) throw new Error("Elegí una contraseña diferente a la actual.");
        const passwordHash = await hashClave(nueva);
        setState((previo) => ({ ...previo, usuarios: previo.usuarios.map((item) => item.idUsuario === u.idUsuario ? { ...item, passwordHash } : item) }));
        void apiCambiarClave(actual, nueva);
      },
      crearAdministrador(input) {
        exigirAdministrador(state);
        if (!puedeGestionarAdministradores(state)) throw new Error("No tenés permiso para gestionar administradores.");
        if (!input.nombre.trim()) throw new Error("Ingresá el nombre completo.");
        const clave = claveInicial(input.apellido, input.documento);
        validarCorreoCuenta(input.correo, state.usuarios);
        const idUsuario = nuevoId("U");
        setState((previo) => {
          validarCorreoCuenta(input.correo, previo.usuarios);
          return { ...previo, usuarios: [...previo.usuarios, { ...input, nombre: `${input.nombre.trim()} ${input.apellido.trim()}`, correo: input.correo.trim().toLowerCase(), idUsuario, rol: "administrador", estado: "activo", fechaAlta: FECHA_REFERENCIA }] };
        });
        void apiCrearAdministrador({ ...input, contrasena: clave });
        return idUsuario;
      },
      actualizarAdministrador(id, input) {
        exigirAdministrador(state);
        if (!puedeGestionarAdministradores(state) && id !== usuarioActual.idUsuario) throw new Error("No tenés permiso para editar este perfil.");
        if (!input.nombre.trim()) throw new Error("Ingresá el nombre completo.");
        validarCorreoCuenta(input.correo, state.usuarios, id);
        setState((previo) => ({ ...previo, usuarios: previo.usuarios.map((u) => u.idUsuario === id && u.rol === "administrador" ? { ...u, nombre: `${input.nombre.trim()} ${input.apellido.trim()}`, apellido: input.apellido.trim(), correo: input.correo.trim().toLowerCase(), telefono: input.telefono.trim() } : u) }));
        void apiActualizarAdministrador(id, input);
      },
      crearAccesoAlumno(idAlumno, correo) {
        exigirAdministrador(state);
        const id = nuevoId("U");
        crearCuentaAlumno(state, idAlumno, correo, id);
        setState((previo) => crearCuentaAlumno(previo, idAlumno, correo, id));
        void apiCrearAccesoAlumno(idAlumno, correo);
      },
      suspenderCuenta(id, suspender) {
        exigirAdministrador(state);
        cambiarEstadoCuenta(state, id, suspender);
        setState((previo) => cambiarEstadoCuenta(previo, id, suspender));
        void apiSuspenderCuenta(id, suspender);
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
        void apiGenerarFactura(idContrato, periodo, reemplazo);
        return id;
      },

      cancelarFactura(idFactura, motivo) {
        exigirAdministrador(state);
        aplicarCancelacionFactura(state, idFactura, motivo);
        setState((previo) => aplicarCancelacionFactura(previo, idFactura, motivo));
        void apiCancelarFactura(idFactura, motivo);
      },

      registrarCobro(input) {
        exigirAdministrador(state);
        const id = nuevoId("P");
        aplicarCobro(state, input, id);
        setState((previo) => aplicarCobro(previo, input, id));
        void apiRegistrarCobro(input);
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
        void apiCrearAmbiente(input);
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
        void apiAgregarEquipamientoAmbiente(idAmbiente, equipo);
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
        void apiRegistrarPagoMulta(idMulta);
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
        void apiAnularMulta(idMulta);
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
        void apiEmitirMulta({ idAlumnos, ...datos });
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
        void apiActualizarMulta({ idMulta, fechaVence, ...datos });
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
        void apiProrrogarMulta(idMulta, motivo.trim());
      },

      asignarHabitacion(idAlumno, idHabitacion) {
        exigirAdministrador(state);
        aplicarAsignacionHabitacion(state, idAlumno, idHabitacion);
        setState((previo) => aplicarAsignacionHabitacion(previo, idAlumno, idHabitacion));
        void apiAsignarHabitacion(idAlumno, idHabitacion);
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
          void apiLiberarHabitacion(idAlumno, asignacion.idHabitacion);
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
        void apiCrearAlumno(input);
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
        void apiActualizarAlumno(idAlumno, input);
      },

      actualizarHabitacion(idHabitacion, input) {
        exigirAdministrador(state);
        editarHabitacion(state, idHabitacion, input);
        setState((previo) => editarHabitacion(previo, idHabitacion, input));
        void apiActualizarHabitacion(idHabitacion, input);
      },
      crearHabitacion(input) {
        exigirAdministrador(state);
        validarAltaHabitacion(state, input);
        const idHabitacion = nuevoId("H");
        setState((previo) => ({ ...previo, habitaciones: [...previo.habitaciones, { ...input, idHabitacion }] }));
        void apiCrearHabitacion(input);
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
        void apiActualizarTareaLimpieza(numero, input);
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
        void apiCrearTareaLimpieza(input);
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
        void apiCrearGrupoLimpieza(input);
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
        void apiActualizarGrupoLimpieza(idGrupoLimpieza, nombreDelGrupo);
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
        void apiEliminarGrupoLimpieza(idGrupoLimpieza);
      },

      guardarAlumnosGrupo(idGrupoLimpieza, idAlumnos) {
        exigirAdministrador(state);
        setState((previo) => actualizarIntegrantesLimpieza(previo, idGrupoLimpieza, idAlumnos));
        void apiGuardarAlumnosGrupo(idGrupoLimpieza, idAlumnos);
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
        void apiAsignarAmbienteGrupo(idGrupoLimpieza, idAmbiente, fechaDesde);
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
        void apiLiberarAmbienteGrupo(idGrupoLimpieza, idAmbiente, FECHA_REFERENCIA);
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
        void apiCancelarContrato(idContrato, fecha, motivo);
      },

      actualizarContrato(idContrato, input) {
        exigirAdministrador(state);
        editarContrato(state, idContrato, input);
        setState((previo) => editarContrato(previo, idContrato, input));
        void apiActualizarContrato(idContrato, input);
      },

      crearContrato(input) {
        exigirAdministrador(state);
        validarAltaContrato(state, input);
        const idContrato = nuevoId("C");
        setState((previo) => ({ ...previo, contratos: [...previo.contratos, { ...input, idContrato }] }));
        void apiCrearContrato(input);
      },
    };
  }, [state, sesionId]);

  if (errorCarga) {
    return <DataErrorScreen error={errorCarga} onErrorDismiss={setErrorCarga} />;
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
