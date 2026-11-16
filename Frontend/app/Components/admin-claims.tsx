import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useSearchParams } from "react-router";
import { CATEGORIAS_RECLAMO, ESTADOS_RECLAMO, TIPOS_RECLAMO, listarReclamosAdministracion, reclamoAbierto, reclamosVisibles } from "../lib/reclamos";
import { usuarioActual } from "../lib/session";
import { useData } from "../lib/store";
import { formatFecha } from "../lib/format";
import type { EstadoReclamo } from "../lib/types";
import { ClaimStatus, ClaimTimeline } from "./student-claims";
import { Badge } from "./ui/badge";
import { Avatar } from "./ui/avatar";
import { BackToList } from "./ui/back-to-list";
import { Button, ButtonLink } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { EmptyState } from "./ui/empty-state";
import { Icon } from "./ui/icons";
import { ListSummary, ListToolbar } from "./ui/list-page";
import { PageHeader } from "./ui/page-header";
import { Tabs } from "./ui/tabs";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "./ui/table";
import { useToast } from "./ui/toast";

const selectClass = "h-9 max-w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-600 dark:border-slate-700 dark:bg-slate-900";
const categoriaLabel = (id: string) => CATEGORIAS_RECLAMO.find((c) => c.id === id)?.label ?? id;
const tipoLabel = (id: string) => TIPOS_RECLAMO.find((t) => t.id === id)?.label ?? id;

export function AdminClaims() {
  const data = useData();
  const [params, setParams] = useSearchParams();
  const reclamos = reclamosVisibles(data, usuarioActual);
  const vista = ["abiertos", "cerrados", "todos"].includes(params.get("vista") ?? "") ? params.get("vista")! : "abiertos";
  const busqueda = params.get("q") ?? "";
  const filas = listarReclamosAdministracion(data, usuarioActual, { vista, busqueda, estado: params.get("estado") ?? undefined, categoria: params.get("categoria") ?? undefined, tipo: params.get("tipo") ?? undefined, prioridad: params.get("prioridad") ?? undefined, orden: params.get("orden") ?? "prioridad" });
  function filtro(clave: string, valor: string) {
    setParams((previos) => { const nuevos = new URLSearchParams(previos); if (!valor || ["todos", "todas"].includes(valor) && clave !== "vista") nuevos.delete(clave); else nuevos.set(clave, valor); if (clave === "vista") nuevos.delete("estado"); return nuevos; }, { replace: true });
  }
  const abiertos = reclamos.filter(reclamoAbierto);
  const consulta = params.toString();
  const hayFiltros = Boolean(busqueda || ["estado", "categoria", "prioridad", "tipo"].some((key) => params.has(key)));

  return <div className="flex flex-col gap-6">
    <PageHeader eyebrow="Residentes" title="Reclamos" description="Recibí los reclamos, solicitudes y avisos de los alumnos. Consultá su seguimiento y gestioná su resolución." />
    <ListSummary title="Resumen de reclamos" description="Estado de las presentaciones recibidas desde el portal del alumno." icon="contracts" items={[
      { label: "Pendientes de revisión", value: reclamos.filter((r) => r.estado === "pendiente").length },
      { label: "En revisión", value: reclamos.filter((r) => r.estado === "en_revision").length },
      { label: "Abiertos con prioridad alta", value: abiertos.filter((r) => r.prioridad === "alta").length },
      { label: "Resueltos", value: reclamos.filter((r) => r.estado === "resuelto").length },
    ]} />
    <Tabs label="Vistas de reclamos" className="flex-wrap self-start" value={vista} items={[{ id: "abiertos", label: "Por gestionar", count: abiertos.length }, { id: "cerrados", label: "Cerrados", count: reclamos.length - abiertos.length }, { id: "todos", label: "Todos", count: reclamos.length }]} onChange={(valor) => filtro("vista", valor)} />
    <ListToolbar title="Bandeja de reclamos" count={filas.length} search={busqueda} onSearch={(valor) => filtro("q", valor)} placeholder="Buscar alumno, DNI, asunto o número…" searchLabel="Buscar reclamos">
      <select className={selectClass} aria-label="Filtrar por estado" value={params.get("estado") ?? "todos"} onChange={(e) => filtro("estado", e.target.value)}><option value="todos">Todos los estados</option>{ESTADOS_RECLAMO.filter((e) => vista === "todos" || (vista === "abiertos" ? ["pendiente", "en_revision"].includes(e.id) : !["pendiente", "en_revision"].includes(e.id))).map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}</select>
      <select className={selectClass} aria-label="Filtrar por prioridad" value={params.get("prioridad") ?? "todas"} onChange={(e) => filtro("prioridad", e.target.value)}><option value="todas">Todas las prioridades</option><option value="alta">Prioridad alta</option><option value="normal">Prioridad normal</option></select>
      <select className={selectClass} aria-label="Ordenar reclamos" value={params.get("orden") ?? "prioridad"} onChange={(e) => filtro("orden", e.target.value)}><option value="prioridad">Ordenar por prioridad</option><option value="recientes">Última actualización</option><option value="antiguos">Más antiguos primero</option></select>
    </ListToolbar>
    <div className="-mt-2 flex flex-wrap items-center gap-3"><select className={selectClass} aria-label="Filtrar por categoría" value={params.get("categoria") ?? "todas"} onChange={(e) => filtro("categoria", e.target.value)}><option value="todas">Todas las categorías</option>{CATEGORIAS_RECLAMO.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select><select className={selectClass} aria-label="Filtrar por tipo" value={params.get("tipo") ?? "todos"} onChange={(e) => filtro("tipo", e.target.value)}><option value="todos">Todos los tipos</option>{TIPOS_RECLAMO.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select>{hayFiltros ? <Button variant="ghost" size="sm" onClick={() => setParams({ vista })}>Limpiar filtros</Button> : null}</div>
    <TableWrap><Table className="min-w-[920px]"><caption className="sr-only">Reclamos recibidos de los alumnos</caption><THead><TR><TH>Reclamo</TH><TH>Alumno</TH><TH>Ubicación</TH><TH>Prioridad / estado</TH><TH>Actualización</TH><TH className="text-right">Acciones</TH></TR></THead><TBody>{filas.length ? filas.map((r) => {
      const alumno = data.alumnoPorId.get(r.idAlumno);
      return <TR key={r.idReclamo}>
        <TD><p className="max-w-xs truncate font-semibold" title={r.asunto}>{r.asunto}</p><p className="mt-1 text-xs text-slate-500">{r.idReclamo}</p><div className="mt-2 flex flex-wrap gap-2"><Badge>{tipoLabel(r.tipo)}</Badge><span className="text-xs text-slate-500">{categoriaLabel(r.categoria)}</span></div></TD>
        <TD><Link to={`/alumnos/${r.idAlumno}`} className="font-medium text-brand-800 hover:underline dark:text-brand-300">{alumno ? `${alumno.apellido}, ${alumno.nombre}` : r.idAlumno}</Link>{alumno ? <p className="mt-1 text-xs text-slate-500">DNI {alumno.documento}</p> : null}</TD>
        <TD><p className="max-w-40 text-sm">{r.ubicacion}</p>{r.detalleUbicacion ? <p className="mt-1 max-w-40 truncate text-xs text-slate-500">{r.detalleUbicacion}</p> : null}</TD>
        <TD><div className="flex flex-col items-start gap-2"><Badge variant={r.prioridad === "alta" ? "warning" : "neutral"}>Prioridad {r.prioridad}</Badge><ClaimStatus estado={r.estado} /></div></TD>
        <TD className="whitespace-nowrap"><p>{formatFecha(r.fechaActualizacion)}</p><p className="mt-1 text-xs text-slate-500">Creado {formatFecha(r.fechaCreacion)}</p></TD>
        <TD className="text-right"><ButtonLink to={`/reclamos/${r.idReclamo}${consulta ? `?${consulta}` : ""}`} aria-label={`${reclamoAbierto(r) ? "Gestionar" : "Ver detalle de"} ${r.asunto}`} size="sm" variant="outline">{reclamoAbierto(r) ? "Gestionar" : "Ver detalle"}<Icon name="arrow" className="h-3.5 w-3.5" /></ButtonLink></TD>
      </TR>;
    }) : <TR><TD colSpan={6}><EmptyState icon="contracts" title={reclamos.length ? "No hay reclamos en esta vista" : "Todavía no se recibieron reclamos"} description={reclamos.length ? "Probá otra vista o ajustá los filtros." : "Los reclamos enviados por los alumnos aparecerán automáticamente en esta bandeja."} action={reclamos.length ? <Button variant="outline" onClick={() => setParams({ vista: "todos" })}>Ver todos los reclamos</Button> : undefined} /></TD></TR>}</TBody></Table></TableWrap>
    <p className="text-xs text-slate-500">Las respuestas y los cambios de estado quedan registrados en el historial y se notifican al alumno.</p>
  </div>;
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return <div><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{children}</dd></div>;
}

export function AdminClaimDetail({ id }: { id: string }) {
  const data = useData();
  const [params] = useSearchParams();
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState<EstadoReclamo | "">("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const { toast } = useToast();
  const reclamo = reclamosVisibles(data, usuarioActual).find((r) => r.idReclamo === id);
  const volver = `/reclamos${params.size ? `?${params.toString()}` : ""}`;
  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (ocupado) return;
    setError(""); setOcupado(true);
    try { data.responderReclamo(id, mensaje, estado || undefined); setMensaje(""); setEstado(""); toast({ title: "Reclamo actualizado", description: "El alumno podrá consultar la respuesta y recibirá una notificación." }); }
    catch (err) { setError(err instanceof Error ? err.message : "No se pudo actualizar el reclamo."); }
    finally { setOcupado(false); }
  }
  if (!reclamo) return <div className="space-y-6"><BackToList to={volver} /><EmptyState title="Reclamo no encontrado" description="El reclamo no existe o no está disponible para esta cuenta." /></div>;
  const alumno = data.alumnoPorId.get(reclamo.idAlumno);
  return <div className="space-y-6">
    <PageHeader eyebrow="Residentes · Reclamos" title="Detalle del reclamo" description={`${reclamo.idReclamo} · Recibido el ${formatFecha(reclamo.fechaCreacion)}`} actions={<BackToList to={volver} />} />
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
      <div className="min-w-0 space-y-6">
        <Card className="overflow-hidden rounded-xl"><CardHeader className="flex-wrap items-center bg-brand-50 dark:bg-slate-800"><div className="flex min-w-0 items-start gap-3"><Icon name="contracts" className="mt-0.5 h-5 w-5 shrink-0 text-brand-700 dark:text-brand-300" /><div><CardTitle className="break-words text-lg">{reclamo.asunto}</CardTitle><p className="mt-1 text-sm text-slate-500">{tipoLabel(reclamo.tipo)} · {categoriaLabel(reclamo.categoria)}</p></div></div><ClaimStatus estado={reclamo.estado} /></CardHeader><CardContent className="space-y-5"><dl className="grid gap-5 sm:grid-cols-2"><Campo label="Ubicación">{reclamo.ubicacion}</Campo><Campo label="Detalle del lugar">{reclamo.detalleUbicacion || "Sin detalle adicional"}</Campo><Campo label="Prioridad"><Badge variant={reclamo.prioridad === "alta" ? "warning" : "neutral"}>{reclamo.prioridad === "alta" ? "Alta" : "Normal"}</Badge></Campo><Campo label="Última actualización">{formatFecha(reclamo.fechaActualizacion)}</Campo></dl><div className="border-t border-slate-100 pt-5 dark:border-slate-800"><h3 className="text-sm font-semibold">Descripción del alumno</h3><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600 dark:text-slate-300">{reclamo.descripcion}</p></div></CardContent></Card>
        <Card className="overflow-hidden rounded-xl"><CardHeader><div><CardTitle>Historial y seguimiento</CardTitle><p className="mt-1 text-sm text-slate-500">Mensajes y cambios de estado, en orden cronológico.</p></div><Badge>{reclamo.historial.length} movimientos</Badge></CardHeader><CardContent><ClaimTimeline reclamo={reclamo} /></CardContent></Card>
      </div>
      <div className="space-y-6 xl:sticky xl:top-24">
        <Card className="overflow-hidden rounded-xl"><CardHeader><CardTitle>Alumno que realizó el reclamo</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex items-center gap-3"><Avatar nombre={alumno ? `${alumno.nombre} ${alumno.apellido}` : reclamo.idAlumno} /><div><p className="font-semibold">{alumno ? `${alumno.apellido}, ${alumno.nombre}` : reclamo.idAlumno}</p>{alumno ? <p className="mt-1 text-xs text-slate-500">DNI {alumno.documento}</p> : null}</div></div>{alumno ? <dl className="space-y-3"><Campo label="Correo">{alumno.correo || "Sin registrar"}</Campo><Campo label="Teléfono">{alumno.telefono || "Sin registrar"}</Campo></dl> : null}<Link to={`/alumnos/${reclamo.idAlumno}`} className="inline-flex items-center gap-2 rounded text-sm font-medium text-brand-700 hover:underline focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-300">Ver ficha del alumno<Icon name="arrow" className="h-4 w-4" /></Link></CardContent></Card>
        <Card className="overflow-hidden rounded-xl"><CardHeader className="bg-brand-50 dark:bg-slate-800"><div><CardTitle>Gestionar reclamo</CardTitle><p className="mt-1 text-xs text-slate-500">Estado actual: <span className="font-medium">{ESTADOS_RECLAMO.find((e) => e.id === reclamo.estado)?.label}</span></p></div></CardHeader><CardContent>
          {reclamoAbierto(reclamo) ? <form onSubmit={guardar} className="space-y-4"><div><label htmlFor="estado-gestion" className="mb-2 block text-sm font-medium">Cambiar estado</label><select id="estado-gestion" className={`${selectClass} h-11 w-full`} value={estado} onChange={(e) => setEstado(e.target.value as EstadoReclamo | "")}><option value="">Mantener estado actual</option>{ESTADOS_RECLAMO.filter((e) => e.id !== "cancelado").map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}</select></div><div><label htmlFor="respuesta-gestion" className="mb-2 block text-sm font-medium">Respuesta o motivo del cambio *</label><textarea id="respuesta-gestion" required minLength={5} maxLength={2000} rows={5} value={mensaje} onChange={(e) => setMensaje(e.target.value)} className="w-full resize-y rounded-md border border-slate-300 bg-slate-50 p-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-slate-700 dark:bg-slate-900" placeholder="Explicá qué se está gestionando o cuál fue la resolución…" aria-describedby="respuesta-gestion-ayuda" /><p id="respuesta-gestion-ayuda" className="mt-1 text-xs text-slate-500">Entre 5 y 2000 caracteres. Esta respuesta será visible para el alumno.</p></div>{error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}<div className="flex items-start gap-2 rounded-lg bg-brand-50 p-3 text-xs leading-5 text-brand-800 dark:bg-brand-900/20 dark:text-brand-200"><Icon name="bell" className="mt-0.5 h-4 w-4 shrink-0" />Al guardar se registrará el cambio en el historial y se notificará al alumno.</div><Button type="submit" isLoading={ocupado} className="w-full"><Icon name="check" className="h-4 w-4" />Guardar actualización</Button></form> : <div className="space-y-3"><ClaimStatus estado={reclamo.estado} /><p className="text-sm leading-6 text-slate-500">Este reclamo está cerrado. La información y el historial permanecen disponibles para consulta.</p></div>}
        </CardContent></Card>
      </div>
    </div>
  </div>;
}
