import type { Parametros } from "./parametros";
export type Rol = "administrador" | "alumno";

export type EstadoAlumno = "activo" | "inactivo";
export type EstadoCuenta = "pendiente" | "activo" | "suspendido" | "inactivo";

export interface CambioAdministrativo {
  id: string;
  idActor: string;
  fecha: string;
  seccion: string;
  accion: string;
  detalle: string;
}

export type EstadoMulta = "pendiente" | "pagada" | "anulada";

export interface Usuario {
  apellido?: string;
  documento?: string;
  passwordHash?: string;
  idUsuario: string;
  nombre: string;
  correo: string;
  rol: Rol;
  /** Presente solo cuando el rol es `alumno`. */
  idAlumno?: string;
  estado: EstadoCuenta;
  gestionaAdministradores?: boolean;
  telefono?: string;
  fechaAlta?: string;
}

export interface ContactoEmergencia {
  nombre: string;
  vinculo: string;
  telefono: string;
}

export interface DatosIngresoAlumno {
  contactosEmergencia?: ContactoEmergencia[];
  cantidadMateriasCursadas?: number;
  fechaNacimiento?: string;
  nacionalidad?: string;
  domicilio?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;
  institucion?: string;
  carrera?: string;
  anioCursado?: string;
  legajo?: string;
  emergenciaNombre?: string;
  emergenciaVinculo?: string;
  emergenciaTelefono?: string;
  observaciones?: string;
}

export interface Alumno extends DatosIngresoAlumno {
  idAlumno: string;
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  documento: string;
  estado: EstadoAlumno;
}

export interface Habitacion {
  idHabitacion: string;
  numeroHabitacion: string;
  pisoHabitacion: number | null;
  capacidadMaxima: number;
  descripcion: string;
}

/**
 * Asignación física de una habitación. `fechaHasta` es un límite exclusivo;
 * null indica una asignación vigente. Las anteriores quedan como historial.
 */
export interface HabitacionAlumno {
  idHabitacion: string;
  idAlumno: string;
  fechaDesde: string;
  fechaHasta: string | null;
}

export interface Contrato {
  idContrato: string;
  idAlumno: string;
  fechaDesde: string;
  fechaHasta: string;
  fechaFirma?: string;
  montoMensual?: number;
  depositoGarantia?: number;
  diaVencimientoPago?: number;
  observaciones?: string;
  /** Baja efectiva: desde esta fecha ya no reside. Se conserva el fin pactado. */
  fechaCancelacion?: string;
  motivoCancelacion?: string;
}

export interface BorradorContrato {
  idAlumno: string;
  fechaDesde: string;
  fechaHasta: string;
  fechaFirma: string;
  montoMensual: string;
  depositoGarantia: string;
  diaVencimientoPago: string;
  observaciones: string;
}

export interface Pago {
  idFactura?: string;
  medio?: "efectivo" | "transferencia" | "tarjeta";
  referencia?: string;
  idPago: string;
  idAlumno: string;
  monto: number;
  fecha: string;
  concepto: string;
}

export interface CambioMulta {
  fecha: string;
  accion: "edicion" | "prorroga";
  motivo?: string;
  cambios: { campo: string; anterior: string; nuevo: string }[];
}

export interface Multa {
  recargoPorcentaje?: number;
  idMulta: string;
  idAlumno: string;
  monto: number;
  fechaEmision: string;
  fechaVence: string;
  estado: EstadoMulta;
  fechaPago: string | null;
  tipo?: string;
  motivo?: string;
  observaciones?: string;
  huboDanios?: boolean;
  detalleDanios?: string;
  periodoDesde?: string;
  periodoHasta?: string;
  idEmision?: string;
  historial?: CambioMulta[];
  montoPagado?: number;
  montoSancion?: number;
  montoDanios?: number;
}

export interface TareaLimpieza {
  enRotacion: boolean;
  numero: number;
  nombre: string;
  tareas: string[];
}

export interface NuevaTareaLimpiezaInput {
  nombre: string;
  tareas: string[];
}

export interface GrupoDeLimpieza {
  tareaInicial: number;
  idGrupoLimpieza: string;
  nombreDelGrupo: string;
}

export interface GrupoLimpiezaAlumno {
  idGrupoLimpieza: string;
  idAlumno: string;
}

export const TIPOS_AMBIENTE = ["Sala de estudio", "Baño", "Cocina", "Duchas", "Comedor", "Lavadero", "Otro"] as const;
export type TipoAmbienteComun = (typeof TIPOS_AMBIENTE)[number];

export interface EquipamientoAmbiente {
  nombre: string;
  cantidad: number;
}

export interface Ambiente {
  idAmbiente: string;
  ambiente: string;
  tareas: string;
  tipo?: TipoAmbienteComun;
  equipamiento?: EquipamientoAmbiente[];
  ubicacion?: string;
  descripcion?: string;
}

export interface GrupoLimpiezaAmbiente {
  idGrupoLimpieza: string;
  idAmbiente: string;
  fechaDesde: string;
  fechaHasta: string | null;
}

export interface DataState {
  reclamos: Reclamo[];
  parametros: Parametros;
  facturas: Factura[];
  tareasLimpieza: TareaLimpieza[];
  alumnos: Alumno[];
  habitaciones: Habitacion[];
  asignaciones: HabitacionAlumno[];
  contratos: Contrato[];
  pagos: Pago[];
  multas: Multa[];
  grupos: GrupoDeLimpieza[];
  grupoAlumnos: GrupoLimpiezaAlumno[];
  ambientes: Ambiente[];
  grupoAmbientes: GrupoLimpiezaAmbiente[];
  usuarios: Usuario[];
  historialAdministrativo: CambioAdministrativo[];
}

export type TipoReclamo = "reclamo" | "solicitud" | "problema";
export type CategoriaReclamo = "mantenimiento" | "limpieza" | "convivencia" | "administracion" | "otro";
export type EstadoReclamo = "pendiente" | "en_revision" | "resuelto" | "rechazado" | "cancelado";

export interface NuevoReclamoInput {
  tipo: TipoReclamo;
  categoria: CategoriaReclamo;
  asunto: string;
  descripcion: string;
  ubicacion: string;
  detalleUbicacion: string;
  prioridad: "normal" | "alta";
}

export interface SeguimientoReclamo {
  id: string;
  fecha: string;
  autor: string;
  rol: Rol;
  tipo: "creacion" | "comentario" | "estado";
  mensaje: string;
  estado?: EstadoReclamo;
}

export interface Reclamo extends Omit<NuevoReclamoInput, "ubicacion"> {
  idReclamo: string;
  idAlumno: string;
  ubicacion: string;
  estado: EstadoReclamo;
  fechaCreacion: string;
  fechaActualizacion: string;
  historial: SeguimientoReclamo[];
}

export interface DetalleFactura {
  concepto: string;
  monto: number;
  idMulta?: string;
}

export interface Factura {
  idFactura: string;
  idContrato: string;
  idAlumno: string;
  titular: string;
  documento: string;
  periodo: string;
  fechaEmision: string;
  fechaVence: string;
  detalles: DetalleFactura[];
}

export interface RegistrarCobroInput {
  idFactura: string;
  monto: number;
  fecha: string;
  medio: NonNullable<Pago["medio"]>;
  referencia: string;
}
