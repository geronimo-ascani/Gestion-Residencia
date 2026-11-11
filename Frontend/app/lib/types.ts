export type Rol = "administrador" | "alumno";

export type EstadoAlumno = "activo" | "inactivo";

export type EstadoMulta = "pendiente" | "pagada" | "anulada";

export interface Usuario {
  idUsuario: string;
  nombre: string;
  correo: string;
  rol: Rol;
  /** Presente solo cuando el rol es `alumno`. */
  idAlumno?: string;
  estado: EstadoAlumno;
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
  idPago: string;
  idAlumno: string;
  monto: number;
  fecha: string;
  concepto: string;
}

export interface Multa {
  idMulta: string;
  idAlumno: string;
  monto: number;
  fechaEmision: string;
  fechaVence: string;
  estado: EstadoMulta;
  fechaPago: string | null;
}

export interface GrupoDeLimpieza {
  idGrupoLimpieza: string;
  nombreDelGrupo: string;
}

export interface GrupoLimpiezaAlumno {
  idGrupoLimpieza: string;
  idAlumno: string;
}

export interface Ambiente {
  idAmbiente: string;
  ambiente: string;
  tareas: string;
}

export interface GrupoLimpiezaAmbiente {
  idGrupoLimpieza: string;
  idAmbiente: string;
  fechaDesde: string;
  fechaHasta: string | null;
}

export interface DataState {
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
}
