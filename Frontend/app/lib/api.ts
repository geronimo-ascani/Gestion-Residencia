import type {
  DataState,
  EquipamientoAmbiente,
  NuevoReclamoInput,
  ReemplazoFacturaInput,
  RegistrarCobroInput,
  NuevaTareaLimpiezaInput,
} from "./types";
import type {
  NuevoAlumnoInput,
  NuevaMultaInput,
  EditarMultaInput,
  NuevaHabitacionInput,
  NuevoGrupoLimpiezaInput,
  NuevoContratoInput,
} from "./store";
import type { NuevoAmbienteInput } from "./ambientes";
import type { Parametros } from "./parametros";

const API_BASE = "/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("residencia_token") || localStorage.getItem("residencia_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const token = getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    };

    const res = await fetch(`${API_BASE}${path}`, {
      headers,
      credentials: "include",
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      console.warn(`[API] Error en ${path}:`, err?.message || res.statusText);
      return null;
    }
    const json = await res.json();
    return (json.data ?? json) as T;
  } catch (error) {
    console.warn(`[API] Excepción al llamar a ${path}:`, error);
    return null;
  }
}

/**
 * Obtiene el estado completo consolidado desde la base de datos PostgreSQL.
 */
export async function getEstadoCompleto(): Promise<DataState | null> {
  return request<DataState>("/estado");
}

export async function apiCrearAlumno(input: NuevoAlumnoInput): Promise<string | null> {
  const res = await request<{ idAlumno: number | string }>("/alumnos", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res ? String(res.idAlumno) : null;
}

export async function apiActualizarAlumno(idAlumno: string, input: Partial<NuevoAlumnoInput>): Promise<void> {
  await request(`/alumnos/${idAlumno}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function apiAsignarHabitacion(idAlumno: string, idHabitacion: string): Promise<void> {
  await request(`/habitaciones/${idHabitacion}/asignar`, {
    method: "POST",
    body: JSON.stringify({ idAlumno, fechaDesde: new Date().toISOString().slice(0, 10) }),
  });
}

export async function apiLiberarHabitacion(idAlumno: string, idHabitacion?: string): Promise<void> {
  const ruta = idHabitacion ? `/habitaciones/${idHabitacion}/desasignar` : `/habitaciones/1/desasignar`;
  await request(ruta, {
    method: "PUT",
    body: JSON.stringify({ idAlumno, fechaHasta: new Date().toISOString().slice(0, 10) }),
  });
}

export async function apiCrearContrato(input: NuevoContratoInput): Promise<string | null> {
  const res = await request<{ idContrato: number | string }>("/contratos", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res ? String(res.idContrato) : null;
}

export async function apiEmitirMulta(input: NuevaMultaInput): Promise<string[] | null> {
  const res = await request<unknown>("/multas", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res ? [String(res)] : null;
}

export async function apiRegistrarCobro(input: RegistrarCobroInput): Promise<string | null> {
  const res = await request<{ idPago: number | string }>("/cobros", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res ? String(res.idPago) : null;
}

export async function apiGenerarFactura(idContrato: string, periodo: string, reemplazo?: ReemplazoFacturaInput): Promise<string | null> {
  if (reemplazo) {
    const res = await request<{ idFactura: number | string }>("/facturas/reemplazo", {
      method: "POST",
      body: JSON.stringify({ idContrato, periodo, ...reemplazo }),
    });
    return res ? String(res.idFactura) : null;
  }
  const res = await request<{ idFactura: number | string }>("/facturas", {
    method: "POST",
    body: JSON.stringify({ idContrato, periodo }),
  });
  return res ? String(res.idFactura) : null;
}

export async function apiCancelarFactura(idFactura: string, motivo: string): Promise<void> {
  await request(`/facturas/${idFactura}/cancelar`, {
    method: "POST",
    body: JSON.stringify({ motivo }),
  });
}

export async function apiCrearAmbiente(input: NuevoAmbienteInput): Promise<string | null> {
  const res = await request<{ idAmbiente: number | string }>("/ambientes", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res ? String(res.idAmbiente) : null;
}

export async function apiAgregarEquipamientoAmbiente(idAmbiente: string, equipo: EquipamientoAmbiente): Promise<boolean> {
  const res = await request(`/ambientes/${idAmbiente}/equipamiento`, {
    method: "POST",
    body: JSON.stringify(equipo),
  });
  return res !== null;
}

export async function apiGuardarParametros(valores: Parametros): Promise<void> {
  await request("/parametros", {
    method: "PUT",
    body: JSON.stringify(valores),
  });
}

export async function apiGuardarOpcionCatalogo(catalogo: string, opcion: { id?: string; nombre: string; activa: boolean }): Promise<void> {
  if (opcion.id) {
    await request(`/catalogos/${catalogo}/${opcion.id}`, {
      method: "PUT",
      body: JSON.stringify({ nombre: opcion.nombre, activa: opcion.activa }),
    });
  } else {
    await request(`/catalogos/${catalogo}`, {
      method: "POST",
      body: JSON.stringify({ nombre: opcion.nombre }),
    });
  }
}

export async function apiCrearGrupoLimpieza(input: NuevoGrupoLimpiezaInput): Promise<string | null> {
  const res = await request<{ idGrupoLimpieza: number | string }>("/grupos-limpieza", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res ? String(res.idGrupoLimpieza) : null;
}

export async function apiActualizarGrupoLimpieza(idGrupoLimpieza: string, nombreDelGrupo: string): Promise<void> {
  await request(`/grupos-limpieza/${idGrupoLimpieza}`, {
    method: "PUT",
    body: JSON.stringify({ nombreDelGrupo }),
  });
}

export async function apiEliminarGrupoLimpieza(idGrupoLimpieza: string): Promise<void> {
  await request(`/grupos-limpieza/${idGrupoLimpieza}`, {
    method: "DELETE",
  });
}

export async function apiGuardarAlumnosGrupo(idGrupoLimpieza: string, idAlumnos: string[]): Promise<void> {
  await request(`/grupos-limpieza/${idGrupoLimpieza}/integrantes`, {
    method: "PUT",
    body: JSON.stringify({ idAlumnos }),
  });
}

// ==========================================
// RECLAMOS
// ==========================================
export async function apiCrearReclamo(input: NuevoReclamoInput & { idAlumno: string }): Promise<string | null> {
  const res = await request<{ idReclamo: number | string }>("/reclamos", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res ? String(res.idReclamo) : null;
}

export async function apiResponderReclamo(idReclamo: string, mensaje: string, estado?: string): Promise<void> {
  await request(`/reclamos/${idReclamo}/respuestas`, {
    method: "POST",
    body: JSON.stringify({ mensaje, ...(estado ? { estado } : {}) }),
  });
}

// ==========================================
// ADMINISTRADORES Y CUENTAS
// ==========================================
export async function apiCrearAdministrador(input: {
  nombre: string;
  apellido: string;
  documento?: string;
  correo: string;
  telefono?: string;
  gestionaAdministradores?: boolean;
}): Promise<string | null> {
  const res = await request<{ idUsuario: number | string }>("/administracion/administradores", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res ? String(res.idUsuario) : null;
}

export async function apiActualizarAdministrador(id: string, input: {
  nombre?: string;
  apellido?: string;
  correo?: string;
  telefono?: string;
  gestionaAdministradores?: boolean;
}): Promise<void> {
  await request(`/administracion/administradores/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function apiSuspenderCuenta(id: string, suspender: boolean): Promise<void> {
  await request(`/administracion/usuarios/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ suspender }),
  });
}

export async function apiCambiarClave(actual: string, nueva: string): Promise<boolean> {
  const res = await request("/auth/change-password", {
    method: "PUT",
    body: JSON.stringify({ contrasenaActual: actual, nuevaContrasena: nueva }),
  });
  return res !== null;
}

// ==========================================
// HABITACIONES
// ==========================================
export async function apiCrearHabitacion(input: NuevaHabitacionInput): Promise<string | null> {
  const res = await request<{ idHabitacion: number | string }>("/habitaciones", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res ? String(res.idHabitacion) : null;
}

export async function apiActualizarHabitacion(idHabitacion: string, input: Partial<NuevaHabitacionInput>): Promise<void> {
  await request(`/habitaciones/${idHabitacion}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

// ==========================================
// CONTRATOS
// ==========================================
export async function apiActualizarContrato(idContrato: string, input: Partial<NuevoContratoInput>): Promise<void> {
  await request(`/contratos/${idContrato}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function apiCancelarContrato(idContrato: string, fecha: string, motivo: string): Promise<void> {
  await request(`/contratos/${idContrato}/estado`, {
    method: "PATCH",
    body: JSON.stringify({
      estado: "CANCELADO",
      fechaCancelacion: fecha,
      motivoCancelacion: motivo,
    }),
  });
}

// ==========================================
// MULTAS
// ==========================================
export async function apiActualizarMulta(input: EditarMultaInput): Promise<void> {
  await request(`/multas/${input.idMulta}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function apiProrrogarMulta(idMulta: string, motivo: string, nuevaFechaVence?: string): Promise<void> {
  await request(`/multas/${idMulta}/prorrogar`, {
    method: "POST",
    body: JSON.stringify({ motivo, ...(nuevaFechaVence ? { nuevaFechaVence } : {}) }),
  });
}

export async function apiAnularMulta(idMulta: string, motivo = "Anulada por administración"): Promise<void> {
  await request(`/multas/${idMulta}/anular`, {
    method: "POST",
    body: JSON.stringify({ motivo }),
  });
}

export async function apiRegistrarPagoMulta(idMulta: string): Promise<void> {
  await request(`/multas/${idMulta}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estadoMulta: "PAGADA" }),
  });
}

// ==========================================
// LIMPIEZA ADICIONAL
// ==========================================
export async function apiCrearTareaLimpieza(input: NuevaTareaLimpiezaInput): Promise<void> {
  await request("/grupos-limpieza/tareas", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function apiActualizarTareaLimpieza(numero: number, input: NuevaTareaLimpiezaInput): Promise<void> {
  await request(`/grupos-limpieza/tareas/${numero}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function apiAsignarAmbienteGrupo(idGrupoLimpieza: string, idAmbiente: string, fechaDesde: string): Promise<void> {
  await request(`/grupos-limpieza/${idGrupoLimpieza}/ambientes`, {
    method: "POST",
    body: JSON.stringify({ idAmbiente, fechaDesde }),
  });
}

export async function apiLiberarAmbienteGrupo(idGrupoLimpieza: string, idAmbiente: string, fechaHasta: string): Promise<void> {
  await request(`/grupos-limpieza/${idGrupoLimpieza}/ambientes/${idAmbiente}/finalizar`, {
    method: "PUT",
    body: JSON.stringify({ fechaHasta }),
  });
}
