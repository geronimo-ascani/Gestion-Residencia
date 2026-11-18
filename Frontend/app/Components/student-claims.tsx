import { FormularioConfirmado } from "./ui/formulario-confirmado";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { CATEGORIAS_RECLAMO, ESTADOS_RECLAMO, TIPOS_RECLAMO, reclamoAbierto, reclamosVisibles, ubicacionesReclamo, validarReclamo } from "../lib/reclamos";
import { usuarioActual } from "../lib/session";
import { useData } from "../lib/store";
import { formatFecha, normalizar } from "../lib/format";
import type { EstadoReclamo, NuevoReclamoInput, Reclamo } from "../lib/types";
import { StudentDetail } from "./student-detail";
import { StudentMetric, StudentSection, studentLink } from "./student-ui";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { EmptyState } from "./ui/empty-state";
import { FormErrorSummary } from "./ui/form-error-summary";
import { Icon } from "./ui/icons";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "./ui/table";
import { useToast } from "./ui/toast";

const control = "w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const tipoLabel = (tipo: string) => TIPOS_RECLAMO.find((t) => t.id === tipo)?.label ?? tipo;
const categoriaLabel = (categoria: string) => CATEGORIAS_RECLAMO.find((c) => c.id === categoria)?.label ?? categoria;
const fechaHora = (fecha: string) => `${formatFecha(fecha)} · ${new Date(fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })}`;

export function ClaimStatus({ estado }: { estado: EstadoReclamo }) {
  return <Badge variant={estado === "resuelto" ? "success" : estado === "en_revision" ? "info" : estado === "pendiente" ? "warning" : estado === "rechazado" ? "danger" : "neutral"}>{ESTADOS_RECLAMO.find((e) => e.id === estado)?.label}</Badge>;
}

export function StudentClaims({ administracion = false }: { administracion?: boolean }) {
  const data = useData();
  const reclamos = reclamosVisibles(data, usuarioActual);
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const estado = params.get("estado") ?? "todos";
  const tipo = params.get("tipo") ?? "todos";
  const base = administracion ? "/reclamos" : "/estudiante/reclamos";
  function filtrar(clave: string, valor: string) { setParams((previos) => { const nuevos = new URLSearchParams(previos); if (!valor || valor === "todos") nuevos.delete(clave); else nuevos.set(clave, valor); return nuevos; }, { replace: true }); }
  const visibles = reclamos.filter((r) => (estado === "todos" || r.estado === estado) && (tipo === "todos" || r.tipo === tipo) && normalizar(`${r.idReclamo} ${r.asunto} ${r.descripcion} ${r.ubicacion} ${data.alumnoPorId.get(r.idAlumno)?.nombre ?? ""} ${data.alumnoPorId.get(r.idAlumno)?.apellido ?? ""}`).includes(normalizar(q)));

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><p className="max-w-2xl text-sm leading-6 text-slate-500">{administracion ? "Revisá lo que informan los alumnos, respondé y actualizá el estado de cada presentación." : "Informá un problema, hacé un pedido o consultá cómo avanza tu presentación."}</p>{!administracion ? <Link className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" to={`${base}/nuevo`}><Icon name="plus" className="h-4 w-4" />Nuevo reclamo</Link> : null}</div>
    <div className="grid gap-4 sm:grid-cols-3"><StudentMetric label="Presentaciones registradas" value={reclamos.length} description="Reclamos, solicitudes y avisos de problemas." icon="contracts" /><StudentMetric label="Abiertas" value={reclamos.filter(reclamoAbierto).length} description="Pendientes o en revisión por administración." icon="calendar" /><StudentMetric label="Resueltas" value={reclamos.filter((r) => r.estado === "resuelto").length} description="Presentaciones con una resolución registrada." icon="check" /></div>
    <StudentSection title={administracion ? "Bandeja de presentaciones" : "Mis reclamos y solicitudes"} icon="contracts" description="Buscá una presentación y abrí su detalle para consultar el seguimiento." aside={<Badge>{visibles.length} {visibles.length === 1 ? "resultado" : "resultados"}</Badge>}>
      <div className="mb-5 grid gap-3 md:grid-cols-[2fr_1fr_1fr]"><div><label htmlFor="buscar-reclamos" className="mb-2 block text-xs font-medium text-slate-500">Buscar</label><input id="buscar-reclamos" type="search" value={q} onChange={(e) => filtrar("q", e.target.value)} placeholder="Asunto, número o ubicación…" className={control} /></div><div><label htmlFor="estado-reclamos" className="mb-2 block text-xs font-medium text-slate-500">Estado</label><select id="estado-reclamos" className={control} value={estado} onChange={(e) => filtrar("estado", e.target.value)}><option value="todos">Todos los estados</option>{ESTADOS_RECLAMO.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}</select></div><div><label htmlFor="tipo-reclamos" className="mb-2 block text-xs font-medium text-slate-500">Tipo</label><select id="tipo-reclamos" className={control} value={tipo} onChange={(e) => filtrar("tipo", e.target.value)}><option value="todos">Todos los tipos</option>{TIPOS_RECLAMO.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></div></div>
      {visibles.length ? <TableWrap className="rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900"><Table className="min-w-[760px]"><caption className="sr-only">Listado de reclamos y solicitudes</caption><THead><TR><TH>Presentación</TH><TH>{administracion ? "Alumno" : "Ubicación"}</TH><TH>Actualización</TH><TH>Estado</TH><TH className="text-right">Acciones</TH></TR></THead><TBody>{visibles.map((r) => <TR key={r.idReclamo}><TD><p className="max-w-xs truncate font-semibold">{r.asunto}</p><p className="mt-1 text-xs text-slate-500">{tipoLabel(r.tipo)} · {r.idReclamo}</p><div className="mt-2 flex gap-2"><Badge>{categoriaLabel(r.categoria)}</Badge>{r.prioridad === "alta" ? <Badge variant="warning">Prioridad alta</Badge> : null}</div></TD><TD><span className="text-sm">{administracion ? `${data.alumnoPorId.get(r.idAlumno)?.nombre ?? ""} ${data.alumnoPorId.get(r.idAlumno)?.apellido ?? ""}` : r.ubicacion}</span></TD><TD className="whitespace-nowrap">{formatFecha(r.fechaActualizacion)}</TD><TD><ClaimStatus estado={r.estado} /></TD><TD className="text-right"><Link to={`${base}/${r.idReclamo}`} className={`${studentLink} whitespace-nowrap px-3 py-2 text-xs`} aria-label={`Ver detalle de ${r.asunto}`}>Ver detalle<Icon name="arrow" className="h-3.5 w-3.5" /></Link></TD></TR>)}</TBody></Table></TableWrap> : <EmptyState icon="contracts" title={reclamos.length ? "No hay resultados con estos filtros" : "Todavía no hay presentaciones"} description={reclamos.length ? "Probá con otro texto, tipo o estado." : administracion ? "Las presentaciones de los alumnos aparecerán acá." : "Podés informar un problema o realizar una solicitud desde el formulario."} action={reclamos.length ? <Button variant="outline" onClick={() => setParams({})}>Limpiar filtros</Button> : !administracion ? <Link className={studentLink} to={`${base}/nuevo`}>Nuevo reclamo</Link> : undefined} />}
    </StudentSection>
  </div>;
}

export function StudentClaimForm() {
  const data = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const enviando = useRef(false);
  const [ocupado, setOcupado] = useState(false);
  const [input, setInput] = useState<NuevoReclamoInput>({ tipo: "reclamo", categoria: "mantenimiento", asunto: "", descripcion: "", ubicacion: "general", detalleUbicacion: "", prioridad: "normal" });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [intentos, setIntentos] = useState(0);
  const [error, setError] = useState("");
  const ubicaciones = ubicacionesReclamo(data, usuarioActual.idAlumno ?? "");
  function cambiar<K extends keyof NuevoReclamoInput>(campo: K, valor: NuevoReclamoInput[K]) { setInput((previo) => ({ ...previo, [campo]: valor })); setErrores((previos) => { const nuevos = { ...previos }; delete nuevos[campo]; return nuevos; }); }
  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando.current) return;
    setError(""); setIntentos((n) => n + 1);
    const encontrados = validarReclamo(input, ubicaciones); setErrores(encontrados);
    if (Object.keys(encontrados).length) return;
    enviando.current = true; setOcupado(true);
    try { const id = data.crearReclamo(input); toast({ title: "Presentación registrada", description: "Podés consultar su estado y agregar información desde el detalle." }); navigate(`/estudiante/reclamos/${id}`, { replace: true }); }
    catch (err) { setError(err instanceof Error ? err.message : "No se pudo registrar la presentación."); enviando.current = false; setOcupado(false); }
  }
  function errorCampo(campo: string) { return errores[campo] ? <p id={`${campo}-error`} className="mt-1 text-xs text-red-600 dark:text-red-300">{errores[campo]}</p> : null; }

  return <div className="space-y-5"><Link className={studentLink} to="/estudiante/reclamos">← Volver a mis presentaciones</Link><StudentSection title="Contanos qué necesitás" description="Los campos marcados con * son obligatorios." icon="contracts">
    <FormularioConfirmado onSubmit={enviar} noValidate className="space-y-6">
      {Object.keys(errores).length ? <FormErrorSummary key={intentos} errors={Object.entries(errores).map(([id, message]) => ({ id, message }))} /> : null}
      {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
      <fieldset id="tipo"><legend className="mb-3 text-sm font-semibold">¿Qué querés presentar? *</legend><div className="grid gap-3 sm:grid-cols-3">{TIPOS_RECLAMO.map((t) => <label key={t.id} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${input.tipo === t.id ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20" : "border-slate-200 dark:border-slate-700"}`}><input type="radio" name="tipo" value={t.id} checked={input.tipo === t.id} onChange={() => cambiar("tipo", t.id)} className="mt-1 accent-brand-600" /><span><span className="block text-sm font-semibold">{t.label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{t.id === "reclamo" ? "Algo no está funcionando como esperabas." : t.id === "solicitud" ? "Necesitás pedir una gestión o autorización." : "Querés informar una situación en la residencia."}</span></span></label>)}</div>{errorCampo("tipo")}</fieldset>
      <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="categoria" className="mb-2 block text-sm font-medium">Categoría *</label><select id="categoria" className={control} value={input.categoria} onChange={(e) => cambiar("categoria", e.target.value as NuevoReclamoInput["categoria"])} aria-invalid={Boolean(errores.categoria)} aria-describedby={errores.categoria ? "categoria-error" : undefined}>{CATEGORIAS_RECLAMO.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>{errorCampo("categoria")}</div><div><label htmlFor="prioridad" className="mb-2 block text-sm font-medium">Prioridad *</label><select id="prioridad" className={control} value={input.prioridad} onChange={(e) => cambiar("prioridad", e.target.value as NuevoReclamoInput["prioridad"])} aria-invalid={Boolean(errores.prioridad)} aria-describedby="prioridad-ayuda"><option value="normal">Normal · Puede revisarse de manera habitual</option><option value="alta">Alta · Afecta el uso de la residencia</option></select><p id="prioridad-ayuda" className="mt-2 text-xs text-slate-500">Administración revisará la prioridad de tu presentación.</p>{errorCampo("prioridad")}</div></div>
      <div><label htmlFor="asunto" className="mb-2 block text-sm font-medium">Asunto *</label><input id="asunto" className={control} value={input.asunto} maxLength={100} onChange={(e) => cambiar("asunto", e.target.value)} placeholder="Por ejemplo: La luz de mi habitación no funciona" aria-invalid={Boolean(errores.asunto)} aria-describedby={errores.asunto ? "asunto-error" : "asunto-ayuda"} required /><p id="asunto-ayuda" className="mt-2 text-xs text-slate-500">Resumí tu presentación en una frase. {input.asunto.length}/100 caracteres.</p>{errorCampo("asunto")}</div>
      <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="ubicacion" className="mb-2 block text-sm font-medium">Ubicación *</label><select id="ubicacion" className={control} value={input.ubicacion} onChange={(e) => cambiar("ubicacion", e.target.value)} aria-invalid={Boolean(errores.ubicacion)} aria-describedby={errores.ubicacion ? "ubicacion-error" : undefined}>{ubicaciones.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}</select>{errorCampo("ubicacion")}</div><div><label htmlFor="detalleUbicacion" className="mb-2 block text-sm font-medium">Detalle del lugar <span className="font-normal text-slate-500">(opcional)</span></label><input id="detalleUbicacion" className={control} value={input.detalleUbicacion} onChange={(e) => cambiar("detalleUbicacion", e.target.value)} maxLength={120} placeholder="Por ejemplo: luminaria junto a la ventana" aria-invalid={Boolean(errores.detalleUbicacion)} aria-describedby={errores.detalleUbicacion ? "detalleUbicacion-error" : undefined} />{errorCampo("detalleUbicacion")}</div></div>
      <div><label htmlFor="descripcion" className="mb-2 block text-sm font-medium">Descripción *</label><textarea id="descripcion" className={`${control} min-h-40 resize-y`} rows={6} value={input.descripcion} maxLength={3000} onChange={(e) => cambiar("descripcion", e.target.value)} placeholder="Explicá qué ocurrió, desde cuándo y qué necesitás. Cuantos más detalles nos des, mejor podremos ayudarte." required aria-invalid={Boolean(errores.descripcion)} aria-describedby={errores.descripcion ? "descripcion-error" : "descripcion-ayuda"} /><p id="descripcion-ayuda" className="mt-2 text-xs text-slate-500">Mínimo 20 caracteres. {input.descripcion.length}/3000.</p>{errorCampo("descripcion")}</div>
      <div className="rounded-2xl bg-brand-50 p-4 text-sm leading-6 text-brand-800 dark:bg-brand-900/20 dark:text-brand-200">Tu presentación quedará registrada como <strong>Pendiente</strong>. Desde el detalle vas a poder ver las respuestas de administración y agregar información.</div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5 dark:border-slate-800"><Link to="/estudiante/reclamos" className="rounded text-sm text-slate-500 hover:underline">Volver sin enviar</Link><Button type="submit" isLoading={ocupado} className="rounded-xl"><Icon name="plus" className="h-4 w-4" />Enviar presentación</Button></div>
    </FormularioConfirmado>
  </StudentSection></div>;
}

export function StudentClaimDetail({ id, administracion = false }: { id: string; administracion?: boolean }) {
  const data = useData();
  const reclamo = reclamosVisibles(data, usuarioActual).find((r) => r.idReclamo === id);
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState<EstadoReclamo | "">("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const { toast } = useToast();
  const base = administracion ? "/reclamos" : "/estudiante/reclamos";
  async function responder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (ocupado) return;
    setError(""); setOcupado(true);
    try { data.responderReclamo(id, mensaje, estado || undefined); setMensaje(""); setEstado(""); toast({ title: "Seguimiento actualizado" }); }
    catch (err) { setError(err instanceof Error ? err.message : "No se pudo actualizar la presentación."); }
    finally { setOcupado(false); }
  }
  if (!reclamo) return <div className="space-y-5"><Link className={studentLink} to={base}>← Volver al listado</Link><EmptyState icon="contracts" title="Presentación no disponible" description="No existe o no pertenece a tu cuenta." /></div>;
  const alumno = data.alumnoPorId.get(reclamo.idAlumno);
  return <div className="space-y-6"><Link className={studentLink} to={base}>← Volver al listado</Link>
    <StudentSection title={reclamo.asunto} description={`${tipoLabel(reclamo.tipo)} · ${reclamo.idReclamo}`} icon="contracts" aside={<ClaimStatus estado={reclamo.estado} />}>
      <div className="mb-5 flex flex-wrap gap-2"><Badge variant="brand">{categoriaLabel(reclamo.categoria)}</Badge><Badge variant={reclamo.prioridad === "alta" ? "warning" : "neutral"}>Prioridad {reclamo.prioridad}</Badge></div>
      <dl className="grid gap-3 sm:grid-cols-2"><StudentDetail label="Ubicación" icon="building">{reclamo.ubicacion}</StudentDetail><StudentDetail label="Detalle del lugar" icon="rooms">{reclamo.detalleUbicacion || "Sin detalle adicional"}</StudentDetail><StudentDetail label="Fecha de presentación" icon="calendar">{fechaHora(reclamo.fechaCreacion)}</StudentDetail><StudentDetail label="Última actualización" icon="calendar">{fechaHora(reclamo.fechaActualizacion)}</StudentDetail>{administracion ? <StudentDetail label="Alumno" icon="user">{alumno ? `${alumno.nombre} ${alumno.apellido}` : reclamo.idAlumno}</StudentDetail> : null}</dl>
      <div className="mt-6"><h3 className="text-sm font-semibold">Descripción de la presentación</h3><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600 dark:text-slate-300">{reclamo.descripcion}</p></div>
    </StudentSection>
    <StudentSection title="Seguimiento" description="Respuestas, información adicional y cambios de estado." icon="calendar"><ClaimTimeline reclamo={reclamo} /></StudentSection>
    {reclamoAbierto(reclamo) ? <StudentSection title={administracion ? "Responder y gestionar" : "Agregar información"} description={administracion ? "La respuesta y el estado serán visibles para el alumno." : "Podés sumar detalles o cancelar la presentación si ya no corresponde."} icon="contracts"><FormularioConfirmado className="space-y-4" onSubmit={responder}>
      <div><label htmlFor="respuesta-reclamo" className="mb-2 block text-sm font-medium">{estado === "cancelado" ? "Motivo de cancelación" : "Mensaje"} *</label><textarea id="respuesta-reclamo" className={`${control} min-h-28`} rows={4} value={mensaje} minLength={5} maxLength={2000} required onChange={(e) => setMensaje(e.target.value)} placeholder={administracion ? "Informá cómo se está gestionando o la resolución del caso…" : "Agregá información que pueda ayudar a resolver tu presentación…"} /><p className="mt-2 text-xs text-slate-500">Entre 5 y 2000 caracteres.</p></div>
      <div><label htmlFor="accion-reclamo" className="mb-2 block text-sm font-medium">{administracion ? "Estado" : "Acción"}</label><select id="accion-reclamo" className={control} value={estado} onChange={(e) => setEstado(e.target.value as EstadoReclamo | "")}><option value="">{administracion ? "Mantener estado actual" : "Agregar comentario"}</option>{administracion ? ESTADOS_RECLAMO.filter((e) => e.id !== "cancelado").map((e) => <option key={e.id} value={e.id}>{e.label}</option>) : <option value="cancelado">Cancelar mi presentación</option>}</select></div>
      {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button type="submit" isLoading={ocupado} className="rounded-xl" variant={estado === "cancelado" ? "danger" : "solid"}>{estado === "cancelado" ? "Cancelar presentación" : "Enviar actualización"}</Button>
    </FormularioConfirmado></StudentSection> : <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900"><Icon name="check" className="h-5 w-5 shrink-0" />Esta presentación está cerrada. Su historial queda disponible para consulta.</div>}
  </div>;
}

export function ClaimTimeline({ reclamo }: { reclamo: Reclamo }) {
  return <ol className="space-y-6">{reclamo.historial.map((h) => <li key={h.id} className="relative border-l-2 border-brand-100 pl-5 dark:border-brand-900"><span aria-hidden="true" className={`absolute top-1 -left-[7px] h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${h.rol === "administrador" ? "bg-brand-600" : "bg-slate-400"}`} /><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">{h.rol === "administrador" ? "Administración" : h.autor}</p><time dateTime={h.fecha} className="text-xs text-slate-500">{fechaHora(h.fecha)}</time></div><p className="mt-1 text-xs text-slate-500">{h.tipo === "creacion" ? "Presentación registrada" : h.tipo === "estado" ? "Cambio de estado" : "Mensaje de seguimiento"}</p><p className="mt-3 whitespace-pre-wrap break-words rounded-2xl bg-slate-50 p-4 text-sm leading-6 dark:bg-slate-800">{h.mensaje}</p>{h.estado ? <div className="mt-2"><ClaimStatus estado={h.estado} /></div> : null}</li>)}</ol>;
}
