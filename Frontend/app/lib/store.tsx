import { aplicarAsignacionHabitacion, validarAltaAlumno, validarAltaHabitacion, validarAltaContrato } from "./gestiones";
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
import { estaActiva, actualizarIntegrantesLimpieza, validarGrupoLimpieza, validarTareaLimpieza, contratoVigente } from "./domain";
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
  usuarioAutenticado: Usuario | null;
  crearReclamo: (input: NuevoReclamoInput) => string;
  responderReclamo: (id: string, mensaje: string, estado?: EstadoReclamo) => void;
  guardarParametros: (valores: Parametros) => void;
  ajustarImporteContrato: (id: string, monto: number) => void;
  crearAdministrador: (input: { nombre: string; apellido: string; documento: string; correo: string; telefono: string; gestionaAdministradores: boolean }) => string;
  actualizarAdministrador: (id: string, input: { nombre: string; apellido: string; correo: string; telefono: string }) => void;
  cambiarClave: (actual: string, nueva: string) => Promise<void>;
  crearAccesoAlumno: (idAlumno: string, correo: string) => void;
  suspenderCuenta: (id: string, suspender: boolean) => void;
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
 * Estado compartido del prototipo, persistido en este navegador.
 * El backend deberá reemplazar esta persistencia y validar cada operación.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setStateBase] = useState<DataState>(() => createInitialData());
  const [sesionId, setSesionId] = useState<string | null>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [errorGuardado, setErrorGuardado] = useState(false);
  function setState(actualizar: (previo: DataState) => DataState) {
    const fecha = new Date().toISOString();
    const id = nuevoId("AUD");
    setStateBase((previo) => registrarCambios(previo, actualizar(previo), fecha, id));
  }

  const [listo, setListo] = useState(false);
  useEffect(() => {
    try {
      const datos = cargarDatosGuardados(localStorage.getItem(DATOS_KEY));
      const id = restaurarSesion();
      const cuenta = datos.usuarios.find((u) => u.idUsuario === id);
      if (cuenta && estadoAcceso(cuenta, datos) === "activo") { sincronizarUsuario(cuenta); setSesionId(cuenta.idUsuario); }
      setStateBase(datos);
      setListo(true);
    } catch { setErrorCarga("No se pudieron cargar los datos guardados. Conservamos la información original para que puedas recuperarla."); }
    function recibir(event: StorageEvent) {
      if (event.key !== DATOS_KEY) return;
      try { setStateBase(cargarDatosGuardados(event.newValue)); }
      catch { setListo(false); setErrorCarga("Los datos se modificaron en otra pestaña y no se pudieron leer. Conservamos la información original."); }
    }
    window.addEventListener("storage", recibir);
    return () => window.removeEventListener("storage", recibir);
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
      usuarioAutenticado: (() => { const u = state.usuarios.find((u) => u.idUsuario === sesionId); return u && estadoAcceso(u, state) === "activo" ? u : null; })(),
      crearReclamo(input) {
        const id = nuevoId("R");
        const fecha = new Date().toISOString();
        const reclamo = prepararReclamo(state, usuarioActual, input, id, fecha);
        setState((previo) => ({ ...previo, reclamos: [reclamo, ...previo.reclamos] }));
        return id;
      },
      responderReclamo(id, mensaje, estado) {
        const eventoId = nuevoId("SEG");
        const fecha = new Date().toISOString();
        actualizarReclamo(state, usuarioActual, id, mensaje, estado, eventoId, fecha);
        setState((previo) => actualizarReclamo(previo, usuarioActual, id, mensaje, estado, eventoId, fecha));
      },
      guardarParametros(valores) {
        exigirAdministrador(state);
        if (usuarioActual.rol !== "administrador") throw new Error("No tenés permiso para modificar parámetros.");
        validarParametros(valores);
        setState((previo) => ({ ...previo, parametros: { ...valores } }));
      },
      ajustarImporteContrato(id, monto) {
        exigirAdministrador(state);
        if (usuarioActual.rol !== "administrador" || !Number.isFinite(monto) || monto <= 0 || Math.abs(monto * 100 - Math.round(monto * 100)) > 0.00001) throw new Error("Ingresá un importe positivo con hasta dos decimales.");
        setState((previo) => ({ ...previo, contratos: previo.contratos.map((c) => c.idContrato === id ? { ...c, montoMensual: monto } : c) }));
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
      },
      crearAdministrador(input) {
        exigirAdministrador(state);
        if (!puedeGestionarAdministradores(state)) throw new Error("No tenés permiso para gestionar administradores.");
        if (!input.nombre.trim()) throw new Error("Ingresá el nombre completo.");
        claveInicial(input.apellido, input.documento);
        validarCorreoCuenta(input.correo, state.usuarios);
        const idUsuario = nuevoId("U");
        setState((previo) => {
          validarCorreoCuenta(input.correo, previo.usuarios);
          return { ...previo, usuarios: [...previo.usuarios, { ...input, nombre: `${input.nombre.trim()} ${input.apellido.trim()}`, correo: input.correo.trim().toLowerCase(), idUsuario, rol: "administrador", estado: "activo", fechaAlta: FECHA_REFERENCIA }] };
        });
        return idUsuario;
      },
      actualizarAdministrador(id, input) {
        exigirAdministrador(state);
        if (!puedeGestionarAdministradores(state) && id !== usuarioActual.idUsuario) throw new Error("No tenés permiso para editar este perfil.");
        if (!input.nombre.trim()) throw new Error("Ingresá el nombre completo.");
        validarCorreoCuenta(input.correo, state.usuarios, id);
        setState((previo) => ({ ...previo, usuarios: previo.usuarios.map((u) => u.idUsuario === id && u.rol === "administrador" ? { ...u, nombre: `${input.nombre.trim()} ${input.apellido.trim()}`, apellido: input.apellido.trim(), correo: input.correo.trim().toLowerCase(), telefono: input.telefono.trim() } : u) }));
      },
      crearAccesoAlumno(idAlumno, correo) {
        exigirAdministrador(state);
        const id = nuevoId("U");
        crearCuentaAlumno(state, idAlumno, correo, id);
        setState((previo) => crearCuentaAlumno(previo, idAlumno, correo, id));
      },
      suspenderCuenta(id, suspender) {
        exigirAdministrador(state);
        cambiarEstadoCuenta(state, id, suspender);
        setState((previo) => cambiarEstadoCuenta(previo, id, suspender));
      },
      alumnoPorId,
      habitacionPorId,
      grupoPorId,
      ambientePorId,

      generarFactura(idContrato, periodo) {
        exigirAdministrador(state);
        const id = nuevoId("F");
        prepararFactura(state, idContrato, periodo, id);
        setState((previo) => previo.facturas.some((f) => f.idContrato === idContrato && f.periodo === periodo) ? previo : {
          ...previo, facturas: [...previo.facturas, prepararFactura(previo, idContrato, periodo, id)],
        });
        return id;
      },

      registrarCobro(input) {
        exigirAdministrador(state);
        const id = nuevoId("P");
        aplicarCobro(state, input, id);
        setState((previo) => aplicarCobro(previo, input, id));
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
        return true;
      },

      registrarPagoMulta(idMulta) {
        exigirAdministrador(state);
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
        exigirAdministrador(state);
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
        return nuevas.map((m) => m.idMulta);
      },

      actualizarMulta({ idMulta, ...datos }) {
        exigirAdministrador(state);
        if (state.facturas.some((f) => f.detalles.some((d) => d.idMulta === idMulta))) throw new Error("La multa ya está facturada y no admite modificaciones.");
        const anterior = state.multas.find((m) => m.idMulta === idMulta);
        const tipo = arancelesMulta(TIPOS_MULTA, state.parametros).map((t) => anterior?.tipo === t.id ? { ...t, monto: anterior.montoSancion ?? anterior.monto - (anterior.montoDanios ?? 0) } : t).find((t) => t.id === datos.tipo);
        if (!tipo || !datos.motivo.trim() || !Number.isFinite(datos.montoSancion) || datos.montoSancion <= 0 || !Number.isFinite(datos.montoDanios) || datos.montoDanios < 0 || (datos.huboDanios && (!datos.detalleDanios.trim() || datos.montoDanios <= 0))) return;
        setState((previo) => ({ ...previo, multas: previo.multas.map((multa) =>
          multa.idMulta === idMulta && multa.estado === "pendiente"
            ? conHistorialMulta(multa, { ...multa, ...datos, montoSancion: tipo.id === "extraordinaria" ? datos.montoSancion : tipo.monto, montoDanios: datos.huboDanios ? datos.montoDanios : 0, monto: (tipo.id === "extraordinaria" ? datos.montoSancion : tipo.monto) + (datos.huboDanios ? datos.montoDanios : 0), detalleDanios: datos.huboDanios ? datos.detalleDanios.trim() : "" }, "edicion")
            : multa,
        ) }));
      },

      extenderPlazoMulta(idMulta, motivo) {
        exigirAdministrador(state);
        if (state.facturas.some((f) => f.detalles.some((d) => d.idMulta === idMulta))) return;
        if (!motivo.trim()) return;
        setState((previo) => ({ ...previo, multas: previo.multas.map((multa) => {
          if (multa.idMulta !== idMulta || multa.estado !== "pendiente") return multa;
          const fechaVence = extenderMes(multa.fechaVence);
          return conHistorialMulta(multa, { ...multa, fechaVence, periodoHasta: fechaVence.slice(0, 7) }, "prorroga", motivo.trim());
        }) }));
      },

      asignarHabitacion(idAlumno, idHabitacion) {
        exigirAdministrador(state);
        aplicarAsignacionHabitacion(state, idAlumno, idHabitacion);
        setState((previo) => aplicarAsignacionHabitacion(previo, idAlumno, idHabitacion));
      },

      liberarHabitacion(idAlumno) {
        exigirAdministrador(state);
        setState((previo) => ({
          ...previo,
          asignaciones: previo.asignaciones.map((asignacion) =>
            asignacion.idAlumno === idAlumno && estaActiva(asignacion.fechaDesde, asignacion.fechaHasta)
              ? { ...asignacion, fechaHasta: FECHA_REFERENCIA }
              : asignacion,
          ),
        }));
      },

      crearAlumno(input) {
        exigirAdministrador(state);
        validarAltaAlumno(state, input);
        const idAlumno = nuevoId("A");
        setState((previo) => ({
          ...previo,
          alumnos: [...previo.alumnos, { ...input, idAlumno, estado: "activo" }],
        }));
        return idAlumno;
      },

      crearHabitacion(input) {
        exigirAdministrador(state);
        validarAltaHabitacion(state, input);
        const idHabitacion = nuevoId("H");
        setState((previo) => ({ ...previo, habitaciones: [...previo.habitaciones, { ...input, idHabitacion }] }));
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
      },

      guardarAlumnosGrupo(idGrupoLimpieza, idAlumnos) {
        exigirAdministrador(state);
        setState((previo) => actualizarIntegrantesLimpieza(previo, idGrupoLimpieza, idAlumnos));
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
      },

      crearContrato(input) {
        exigirAdministrador(state);
        validarAltaContrato(state, input);
        const idContrato = nuevoId("C");
        setState((previo) => ({ ...previo, contratos: [...previo.contratos, { ...input, idContrato }] }));
      },
    };
  }, [state, sesionId]);

  if (errorCarga) return <main className="mx-auto max-w-xl space-y-5 p-8"><h1 className="text-2xl font-semibold">No pudimos abrir la residencia</h1><p role="alert" className="text-sm leading-6 text-slate-600 dark:text-slate-300">{errorCarga}</p><div className="flex flex-wrap gap-3"><button type="button" className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white" onClick={() => window.location.reload()}>Reintentar</button><button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm" onClick={() => { try { const copia = localStorage.getItem(DATOS_KEY); if (!copia) return; const url = URL.createObjectURL(new Blob([copia], { type: "application/json" })); const enlace = document.createElement("a"); enlace.href = url; enlace.download = "residencia-respaldo.json"; enlace.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch { setErrorCarga("El navegador no permite acceder a los datos guardados. Revisá sus permisos de almacenamiento."); } }}>Descargar copia de los datos</button></div></main>;
  return <DataContext.Provider value={value}>{listo ? <>{errorGuardado ? <div role="alert" className="relative z-50 border-b border-red-200 bg-red-50 p-4 text-center text-sm text-red-800">No se pudieron guardar los últimos cambios. No cierres esta pestaña hasta recuperar el almacenamiento disponible.</div> : null}{children}</> : null}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const contexto = useContext(DataContext);
  if (!contexto) {
    throw new Error("useData debe usarse dentro de <DataProvider>");
  }
  return contexto;
}
