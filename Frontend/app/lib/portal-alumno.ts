import { proximaFacturaAlumno } from "./proxima-factura";
import { FECHA_REFERENCIA } from "./config";
import { asignacionActiva, contratoVigente, estaActiva, semanaLimpieza, tareaLimpieza } from "./domain";
import { saldoFactura } from "./facturacion";
import { formatFecha } from "./format";
import type { DataState, TareaLimpieza, Usuario } from "./types";

/** Conserva los bloques semanales 1–7, 8–14, etc. usados por la residencia. */
export function rotacionMesAlumno(tareaInicial: number, tareas: TareaLimpieza[], fecha = FECHA_REFERENCIA) {
  const [anio, mes] = fecha.split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const periodo = fecha.slice(0, 7);
  return Array.from({ length: Math.ceil(ultimoDia / 7) }, (_, indice) => {
    const semana = indice + 1;
    return {
      semana,
      desde: `${periodo}-${String(indice * 7 + 1).padStart(2, "0")}`,
      hasta: `${periodo}-${String(Math.min(semana * 7, ultimoDia)).padStart(2, "0")}`,
      actual: semana === semanaLimpieza(fecha),
      tarea: tareaLimpieza(tareaInicial, semana, tareas),
    };
  });
}

/** La identidad proviene de la cuenta, nunca de un parámetro de la URL. */
export function datosPortalAlumno(data: DataState, usuario: Usuario) {
  const alumno = usuario.rol === "alumno" && usuario.idAlumno
    ? data.alumnos.find((a) => a.idAlumno === usuario.idAlumno) : undefined;
  const id = alumno?.idAlumno;
  const contratos = data.contratos.filter((c) => Boolean(id) && c.idAlumno === id)
    .sort((a, b) => b.fechaDesde.localeCompare(a.fechaDesde));
  const pagos = data.pagos.filter((p) => Boolean(id) && p.idAlumno === id && p.fecha <= FECHA_REFERENCIA)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const facturas = data.facturas.filter((f) => Boolean(id) && f.idAlumno === id && f.fechaEmision <= FECHA_REFERENCIA)
    .sort((a, b) => b.periodo.localeCompare(a.periodo));
  const multas = data.multas.filter((m) => Boolean(id) && m.idAlumno === id && m.fechaEmision <= FECHA_REFERENCIA)
    .sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision));
  const asignacion = id ? asignacionActiva(data.asignaciones, id) : undefined;
  const habitacion = data.habitaciones.find((h) => h.idHabitacion === asignacion?.idHabitacion);
  const ocupantesHabitacion = habitacion ? data.asignaciones.filter((asignada) =>
    asignada.idHabitacion === habitacion.idHabitacion && estaActiva(asignada.fechaDesde, asignada.fechaHasta),
  ).flatMap((asignada) => data.alumnos.filter((a) => a.idAlumno === asignada.idAlumno)
    .map((a) => ({ nombre: `${a.nombre} ${a.apellido}`, esActual: a.idAlumno === id }))) : [];
  const membresia = data.grupoAlumnos.find((g) => Boolean(id) && g.idAlumno === id);
  const grupo = data.grupos.find((g) => g.idGrupoLimpieza === membresia?.idGrupoLimpieza);
  const semana = semanaLimpieza();
  const tarea = grupo ? tareaLimpieza(grupo.tareaInicial, semana, data.tareasLimpieza) : undefined;
  // Los compañeros se exponen solamente con su nombre, sin datos de contacto.
  const integrantes = grupo ? data.grupoAlumnos.filter((g) => g.idGrupoLimpieza === grupo.idGrupoLimpieza)
    .flatMap((g) => data.alumnos.filter((a) => a.idAlumno === g.idAlumno).map((a) => `${a.nombre} ${a.apellido}`)) : [];
  const ambientes = grupo ? data.grupoAmbientes.filter((g) => g.idGrupoLimpieza === grupo.idGrupoLimpieza && estaActiva(g.fechaDesde, g.fechaHasta))
    .flatMap((g) => data.ambientes.filter((a) => a.idAmbiente === g.idAmbiente)) : [];
  const rotacion = grupo ? rotacionMesAlumno(grupo.tareaInicial, data.tareasLimpieza) : [];
  const pendientes = facturas.filter((f) => saldoFactura(f, pagos) > 0);
  const contrato = id ? contratoVigente(contratos, id) : undefined;
  const avisos: { id: string; titulo: string; detalle: string; to: string }[] = [];
  for (const factura of pendientes) avisos.push({ id: factura.idFactura, titulo: factura.fechaVence < FECHA_REFERENCIA ? "Factura vencida" : "Factura pendiente", detalle: `Período ${factura.periodo} · Vence ${formatFecha(factura.fechaVence)}`, to: `/estudiante/facturas/${factura.idFactura}` });
  for (const multa of multas.filter((m) => m.estado === "pendiente")) avisos.push({ id: multa.idMulta, titulo: "Multa pendiente", detalle: multa.motivo || "Consultá el detalle de la sanción.", to: `/estudiante/multas/${multa.idMulta}` });
  if (contrato && contrato.fechaHasta <= new Date(Date.parse(`${FECHA_REFERENCIA}T00:00:00Z`) + 30 * 86400000).toISOString().slice(0, 10)) avisos.push({ id: contrato.idContrato, titulo: "Tu contrato está por finalizar", detalle: `Finaliza el ${formatFecha(contrato.fechaHasta)}. Consultá a administración por la renovación.`, to: "/estudiante/contratos" });
  if (alumno && !habitacion) avisos.push({ id: "habitacion", titulo: "Habitación pendiente de asignación", detalle: "La administración todavía no registró una habitación vigente.", to: "/estudiante#habitacion" });
  if (alumno && !grupo) avisos.push({ id: "grupo", titulo: "Grupo de limpieza pendiente", detalle: "La administración todavía no te asignó un grupo.", to: "/estudiante#limpieza" });
  for (const reclamo of (data.reclamos ?? []).filter((r) => Boolean(id) && r.idAlumno === id)) {
    const ultimaRespuesta = reclamo.historial.filter((h) => h.rol === "administrador").at(-1);
    if (ultimaRespuesta) avisos.push({ id: `reclamo-${ultimaRespuesta.id}`, titulo: "Novedades en tu presentación", detalle: `${reclamo.asunto} · ${ultimaRespuesta.mensaje.slice(0, 160)}${ultimaRespuesta.mensaje.length > 160 ? "…" : ""}`, to: `/estudiante/reclamos/${reclamo.idReclamo}` });
  }
  const proximaFactura = proximaFacturaAlumno(contratos, data.facturas.filter((f) => Boolean(id) && f.idAlumno === id), pagos);
  return { proximaFactura, alumno, contratos, contrato, pagos, facturas, multas, asignacion, habitacion, grupo, tarea, semana, integrantes, ambientes, ocupantesHabitacion, rotacion, pendientes, avisos,
    saldo: pendientes.reduce((suma, f) => suma + saldoFactura(f, pagos), 0) };
}
