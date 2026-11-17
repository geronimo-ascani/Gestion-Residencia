import type { ReactNode } from "react";
import { Link } from "react-router";
import type { datosPortalAlumno } from "../lib/portal-alumno";
import { FECHA_REFERENCIA } from "../lib/config";
import { formatARS, formatFecha } from "../lib/format";
import { Badge } from "./ui/badge";
import { Avatar } from "./ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { EmptyState } from "./ui/empty-state";
import { Icon } from "./ui/icons";

const enlace = "inline-flex items-center gap-2 rounded text-sm font-semibold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-300";
const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function Dato({ label, children }: { label: string; children: ReactNode }) {
  return <div><dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt><dd className="mt-1 text-sm font-semibold">{children}</dd></div>;
}

export function InicioAlumno({ portal: p, avisos }: {
  portal: ReturnType<typeof datosPortalAlumno>;
  avisos: ReactNode;
}) {
  const habitacion = p.habitacion;
  const grupo = p.grupo;
  const mes = `${meses[Number(FECHA_REFERENCIA.slice(5, 7)) - 1]} ${FECHA_REFERENCIA.slice(0, 4)}`;
  const card = "overflow-hidden rounded-3xl border-slate-200 shadow-sm dark:border-slate-800";

  return <div className="space-y-7">
    <section aria-labelledby="bienvenida-alumno" className="relative isolate overflow-hidden rounded-3xl bg-linear-to-br from-brand-900 via-brand-800 to-brand-600 px-6 py-8 text-white shadow-lg shadow-brand-900/10 sm:p-9">
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 -right-16 -z-10 h-96 w-96 rounded-full border-[48px] border-white/5" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -bottom-44 -z-10 h-96 w-96 rounded-full border-[48px] border-white/5" />
      <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-brand-100 uppercase">Mi residencia · Mi panel</p>
          <h1 id="bienvenida-alumno" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Hola, {p.alumno?.nombre}</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-brand-100">Tu espacio, tus tareas y tus próximos compromisos. Todo lo que necesitás para organizar tu día en la residencia.</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href="#rotacion" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-800">Ver mi rotación<Icon name="arrow" className="h-4 w-4" /></a>
            <span className="inline-flex items-center gap-2 text-xs text-brand-100"><Icon name="calendar" className="h-4 w-4" />{formatFecha(FECHA_REFERENCIA)}</span>
          </div>
        </div>
        <dl className="grid grid-cols-3 divide-x divide-white/15 rounded-2xl border border-white/15 bg-white/10 py-5 backdrop-blur-sm sm:py-7">
          <div className="px-3 text-center"><Icon name="rooms" className="mx-auto h-5 w-5 text-brand-100" /><dt className="mt-3 text-xs text-brand-100">Habitación</dt><dd className="mt-1 text-2xl font-semibold sm:text-3xl">{habitacion?.numeroHabitacion ?? "—"}</dd></div>
          <div className="px-3 text-center"><Icon name="cleaning" className="mx-auto h-5 w-5 text-brand-100" /><dt className="mt-3 text-xs text-brand-100">Mi grupo</dt><dd className="mt-2 text-sm font-semibold sm:text-lg">{grupo?.nombreDelGrupo ?? "Sin asignar"}</dd></div>
          <div className="px-3 text-center"><Icon name="calendar" className="mx-auto h-5 w-5 text-brand-100" /><dt className="mt-3 text-xs text-brand-100">Semana actual</dt><dd className="mt-1 text-2xl font-semibold sm:text-3xl">{p.semana}<span className="text-sm font-normal text-brand-100"> / {p.rotacion.length || Math.ceil(new Date(Number(FECHA_REFERENCIA.slice(0, 4)), Number(FECHA_REFERENCIA.slice(5, 7)), 0).getDate() / 7)}</span></dd></div>
        </dl>
      </div>
    </section>

    <div className="grid items-stretch gap-6 lg:grid-cols-12">
      <Card id="habitacion" className={`${card} scroll-mt-64 md:scroll-mt-40 lg:col-span-5`}>
        <CardHeader className="items-center border-slate-100 px-6 py-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-brand-50 p-2.5 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"><Icon name="rooms" className="h-5 w-5" /></span><div><CardTitle>Mi habitación</CardTitle><CardDescription>Tu lugar en la residencia</CardDescription></div></div>{habitacion ? <Badge variant="success">Asignada</Badge> : null}</CardHeader>
        <CardContent className="space-y-5 p-6">
          {habitacion ? <>
            <div className="flex items-center gap-5"><div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-5xl font-semibold tracking-tight text-brand-800 dark:bg-brand-900/30 dark:text-brand-200">{habitacion.numeroHabitacion}</div><div><p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Habitación</p><p className="mt-1 text-lg font-semibold">{habitacion.pisoHabitacion === null ? "Piso sin indicar" : habitacion.pisoHabitacion === 0 ? "Planta baja" : `Piso ${habitacion.pisoHabitacion}`}</p><p className="mt-1 text-sm text-slate-500">{p.ocupantesHabitacion.length} residentes · {habitacion.capacidadMaxima} plazas</p></div></div>
            <dl className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60"><Dato label="Asignada desde">{formatFecha(p.asignacion?.fechaDesde)}</Dato><Dato label="Capacidad">{habitacion.capacidadMaxima} personas</Dato></dl>
            {habitacion.descripcion ? <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">{habitacion.descripcion}</p> : null}
            <div className="border-t border-slate-100 pt-5 dark:border-slate-800"><h3 className="mb-3 text-sm font-semibold">Compartís habitación con</h3><ul className="space-y-3">{p.ocupantesHabitacion.map((ocupante, i) => <li key={i} className="flex items-center gap-3"><Avatar nombre={ocupante.nombre} size="sm" /><span className="text-sm font-medium">{ocupante.nombre}</span>{ocupante.esActual ? <span className="ml-auto text-xs text-slate-500">Vos</span> : null}</li>)}</ul></div>
          </> : <EmptyState icon="rooms" title="Habitación pendiente de asignación" description="Cuando administración registre tu habitación, vas a ver sus datos y tus compañeros acá." />}
        </CardContent>
      </Card>

      <Card id="limpieza" className={`${card} scroll-mt-64 md:scroll-mt-40 lg:col-span-7`}>
        <CardHeader className="items-center border-slate-100 px-6 py-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-brand-50 p-2.5 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"><Icon name="cleaning" className="h-5 w-5" /></span><div><CardTitle>Mi grupo de limpieza</CardTitle><CardDescription>{grupo ? `${grupo.nombreDelGrupo} · ${p.integrantes.length} integrantes` : "Tu equipo y las tareas de la semana"}</CardDescription></div></div>{grupo ? <Badge variant="brand">Semana {p.semana}</Badge> : null}</CardHeader>
        <CardContent className="space-y-5 p-6">
          {grupo ? <>
            <div className="rounded-2xl border border-brand-100 bg-brand-50/70 p-5 dark:border-brand-900 dark:bg-brand-900/20"><p className="text-xs font-semibold tracking-wide text-brand-700 uppercase dark:text-brand-300">Esta semana nos toca</p><h3 className="mt-2 text-2xl font-semibold tracking-tight">{p.tarea?.nombre ?? "Sin tarea asignada"}</h3>{p.tarea ? <ul className="mt-4 grid gap-3 sm:grid-cols-2">{p.tarea.tareas.map((actividad, i) => <li key={i} className="flex items-start gap-2 text-sm"><span className="mt-0.5 rounded-full bg-brand-100 p-0.5 text-brand-700 dark:bg-brand-800 dark:text-brand-200"><Icon name="check" className="h-3 w-3" /></span><span>{actividad}</span></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">La administración todavía no configuró tareas en rotación.</p>}</div>
            <div><h3 className="mb-3 text-sm font-semibold">Tu equipo</h3><ul className="grid gap-3 sm:grid-cols-2">{p.integrantes.map((nombre, i) => <li key={i} className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-3 py-2.5 dark:border-slate-800"><Avatar nombre={nombre} size="sm" /><span className="text-sm">{nombre}</span></li>)}</ul></div>
            {p.ambientes.length ? <div><h3 className="mb-3 text-sm font-semibold">Ambientes asignados</h3><ul className="space-y-3">{p.ambientes.map((ambiente) => <li key={ambiente.idAmbiente} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-sm font-medium">{ambiente.ambiente}</p>{ambiente.tareas ? <p className="mt-1 text-xs leading-5 text-slate-500">{ambiente.tareas}</p> : null}</li>)}</ul></div> : null}
          </> : <EmptyState icon="cleaning" title="Grupo pendiente de asignación" description="Tu grupo, sus integrantes y la tarea actual aparecerán cuando administración te asigne." />}
        </CardContent>
      </Card>
    </div>

    <Card id="rotacion" className={`${card} scroll-mt-64 md:scroll-mt-40`}>
      <CardHeader className="flex-wrap items-center px-6 py-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-brand-50 p-2.5 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"><Icon name="calendar" className="h-5 w-5" /></span><div><CardTitle>Tu mes, organizado</CardTitle><CardDescription>Rotación de limpieza · {grupo?.nombreDelGrupo ?? "Sin grupo asignado"}</CardDescription></div></div><Badge variant="brand">{mes}</Badge></CardHeader>
      <CardContent className="p-6">
        {grupo ? <><ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{p.rotacion.map((semana) => <li key={semana.semana} aria-current={semana.actual ? "step" : undefined} className={`relative flex flex-col gap-3 rounded-2xl border p-4 ${semana.actual ? "border-brand-700 bg-brand-700 text-white shadow-md shadow-brand-900/15" : "border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/30"}`}>
          <div className="flex items-center justify-between gap-2"><span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${semana.actual ? "bg-white text-brand-800" : "border border-slate-200 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{String(semana.semana).padStart(2, "0")}</span>{semana.actual ? <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold">ESTA SEMANA</span> : <span className="text-xs text-slate-400">Semana {semana.semana}</span>}</div>
          <p className={`text-xs ${semana.actual ? "text-brand-100" : "text-slate-500"}`}>{formatFecha(semana.desde)} al {formatFecha(semana.hasta)}</p><h3 className="min-h-10 text-sm font-semibold leading-5">{semana.tarea?.nombre ?? "Sin tarea asignada"}</h3><ul className={`space-y-2 text-xs leading-5 ${semana.actual ? "text-brand-50" : "text-slate-500 dark:text-slate-400"}`}>{semana.tarea?.tareas.map((actividad, i) => <li key={i} className="flex items-start gap-1.5"><Icon name="check" className="mt-1 h-3 w-3 shrink-0" /><span>{actividad}</span></li>)}</ul>
        </li>)}</ol><p className="mt-4 text-xs text-slate-500">Las semanas se organizan del 1 al 7, del 8 al 14 y así sucesivamente hasta fin de mes.</p></> : <EmptyState icon="calendar" title="Tu rotación todavía no está disponible" description="El calendario del mes aparecerá cuando tengas un grupo de limpieza asignado." />}
      </CardContent>
    </Card>

    <div className="grid items-start gap-6 lg:grid-cols-12">
      <Card className={`${card} lg:col-span-5`}>
        <CardHeader className="items-center px-6 py-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-brand-50 p-2.5 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"><Icon name="payments" className="h-5 w-5" /></span><div><CardTitle>Mi cuenta</CardTitle><CardDescription>Tus compromisos, a simple vista</CardDescription></div></div></CardHeader>
        <CardContent className="space-y-5 p-6">
          <div className={`rounded-2xl border p-5 ${p.saldo > 0 ? "border-red-100 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300" : "border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300"}`}><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">Saldo facturado pendiente</p><Icon name={p.saldo > 0 ? "alert" : "check"} className="h-5 w-5" /></div><p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">{formatARS(p.saldo)}</p><p className="mt-2 text-xs leading-5">{p.saldo > 0 ? `${p.pendientes.length} ${p.pendientes.length === 1 ? "factura con saldo pendiente" : "facturas con saldo pendiente"}` : "Todas tus facturas emitidas están saldadas."}</p></div>
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-sm font-semibold"><Icon name="calendar" className="h-4 w-4 text-brand-600" />Próxima factura</h3>{p.proximaFactura ? <Badge variant={p.proximaFactura.estimada ? "neutral" : "info"}>{p.proximaFactura.estimada ? "Estimada" : "Emitida"}</Badge> : null}</div>{p.proximaFactura ? <><p className="mt-3 text-2xl font-semibold">{formatARS(p.proximaFactura.monto)}</p><p className="mt-1 text-sm text-slate-500">Período {p.proximaFactura.periodo} · Vence el {formatFecha(p.proximaFactura.fechaVence)}</p>{p.proximaFactura.estimada ? <p className="mt-2 text-xs leading-5 text-slate-500">Según tu cuota y vencimiento contractual. El importe final puede incluir multas u otros conceptos al emitirse.</p> : null}</> : <p className="mt-3 text-sm text-slate-500">No hay próximas cuotas previstas en tus contratos registrados.</p>}</div>
          <dl className="grid grid-cols-2 gap-4"><Dato label="Contrato vigente">{p.contrato?.idContrato ?? "Sin contrato vigente"}</Dato><Dato label="Finaliza">{formatFecha(p.contrato?.fechaHasta)}</Dato></dl><p className="text-xs text-slate-500">El saldo incluye únicamente facturas emitidas.</p>
          <div className="flex flex-wrap gap-4 border-t border-slate-100 pt-4 dark:border-slate-800"><Link to="/estudiante/facturas" className={enlace}>Facturas y pagos<Icon name="arrow" className="h-4 w-4" /></Link><Link to="/estudiante/contratos" className={enlace}>Mis contratos<Icon name="arrow" className="h-4 w-4" /></Link></div>
        </CardContent>
      </Card>
      <Card className={`${card} lg:col-span-7`}><CardHeader className="items-center px-6 py-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-amber-50 p-2.5 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300"><Icon name="bell" className="h-5 w-5" /></span><div><CardTitle>Mis avisos</CardTitle><CardDescription>Vencimientos y novedades de tu cuenta</CardDescription></div></div><Badge variant={p.avisos.length ? "warning" : "success"}>{p.avisos.length}</Badge></CardHeader><CardContent className="space-y-5 p-6">{avisos}<Link to="/estudiante/avisos" className={enlace}>Ver todos los avisos<Icon name="arrow" className="h-4 w-4" /></Link></CardContent></Card>
    </div>
  </div>;
}
