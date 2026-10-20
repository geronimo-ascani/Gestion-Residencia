export type Rol = "administrador" | "alumno";

export type EstadoUsuario = "activo" | "inactivo";

export type EstadoCuota = "pendiente" | "parcial" | "pagada";

export type EstadoMulta = "pendiente" | "pagada" | "anulada";

export interface Usuario {
  idUsuario: string;
  nombre: string;
  correo: string;
  rol: Rol;
  /** Presente solo cuando el rol es `alumno`. */
  idAlumno?: string;
  estado: EstadoUsuario;
}

export interface Alumno {
  idAlumno: string;
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  documento: string;
}

export interface Habitacion {
  idHabitacion: string;
  numeroHabitacion: string;
  capacidadMaxima: number;
  descripcion: string;
}

/**
 * Asignación física de una habitación. Las filas con `fechaHasta` null son las
 * vigentes; las anteriores quedan como historial y permiten cambios de
 * habitación durante el mismo contrato.
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
}

export interface CuotaMensual {
  idCuota: string;
  idAlumno: string;
  fechaEmision: string;
  /** Formato `YYYY-MM`. */
  mesAsociado: string;
  montoPagado: number;
  estado: EstadoCuota;
  fechaPago: string | null;
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
  cuotas: CuotaMensual[];
  multas: Multa[];
  grupos: GrupoDeLimpieza[];
  grupoAlumnos: GrupoLimpiezaAlumno[];
  ambientes: Ambiente[];
  grupoAmbientes: GrupoLimpiezaAmbiente[];
  usuarios: Usuario[];
}
