import { Link, useSearchParams } from "react-router";
import { estadoMultaVisual } from "../lib/domain";
import { formatARS, formatFecha } from "../lib/format";
import { importeMulta, TIPOS_MULTA } from "../lib/multas";
import type { Factura, Multa } from "../lib/types";
import { cn } from "../lib/cn";
import { StatusBadge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { EmptyState } from "./ui/empty-state";
import { Icon } from "./ui/icons";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "./ui/table";
import { StudentDetail } from "./student-detail";

export function StudentFines({ multas, facturas }: { multas: Multa[]; facturas: Factura[] }) {
  const [params, setParams] = useSearchParams();
  const filtro = ["pendiente", "pagada", "anulada"].includes(params.get("estado") ?? "") ? params.get("estado")! : "todas";
  function setFiltro(estado: string) { setParams(estado === "todas" ? {} : { estado }, { replace: true }); }
  const pendientes = multas.filter((m) => m.estado === "pendiente");
  const visibles = multas.filter((m) => filtro === "todas" || m.estado === filtro);
  const resumen = [
    { label: "Pendientes", count: pendientes.length, icon: "fines" as const, color: "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300" },
    { label: "Vencidas", count: pendientes.filter((m) => estadoMultaVisual(m) === "vencida").length, icon: "calendar" as const, color: "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-300" },
    { label: "Pagadas", count: multas.filter((m) => m.estado === "pagada").length, icon: "check" as const, color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300" },
  ];
  return <div className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-3">{resumen.map((item) => <Card key={item.label} className="flex items-center gap-4 rounded-2xl border-slate-200 p-5 dark:border-slate-800"><span className={`rounded-xl p-3 ${item.color}`}><Icon name={item.icon} className="h-6 w-6" /></span><div><p className="text-sm text-slate-500">{item.label}</p><p className="text-2xl font-semibold">{item.count}</p></div></Card>)}</div>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar multas">
      {[{ id: "todas", label: "Todas" }, { id: "pendiente", label: "Pendientes" }, { id: "pagada", label: "Pagadas" }, { id: "anulada", label: "Anuladas" }].map((item) => <button key={item.id} type="button" aria-pressed={filtro === item.id} onClick={() => setFiltro(item.id)} className={cn("rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500", filtro === item.id ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300")}>{item.label}</button>)}
    </div>
    <TableWrap className="rounded-3xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
      <Table className="min-w-[760px]">
        <caption className="sr-only">Mis multas: fecha, motivo, vencimiento, importe, estado y acceso al detalle</caption>
        <THead><TR><TH>Multa / motivo</TH><TH>Emisión</TH><TH>Vencimiento</TH><TH className="text-right">Importe total</TH><TH>Estado</TH><TH className="text-right">Acciones</TH></TR></THead>
        <TBody>{visibles.length ? visibles.map((m) => <TR key={m.idMulta}>
          <TD><div className="flex items-center gap-3"><span className="hidden rounded-lg bg-slate-100 p-2 text-slate-500 sm:inline-flex dark:bg-slate-800"><Icon name="fines" className="h-4 w-4" /></span><div className="max-w-xs"><p className="font-semibold">{m.idMulta} · {TIPOS_MULTA.find((t) => t.id === m.tipo)?.nombre ?? m.tipo ?? "Multa de residencia"}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{m.motivo || "Consultá el detalle de la sanción."}</p></div></div></TD>
          <TD className="whitespace-nowrap">{formatFecha(m.fechaEmision)}</TD><TD className="whitespace-nowrap">{formatFecha(m.fechaVence)}</TD>
          <TD className="text-right font-semibold whitespace-nowrap tabular-nums">{formatARS(importeMulta(m, undefined, facturas).total)}</TD><TD><StatusBadge estado={estadoMultaVisual(m)} /></TD>
          <TD className="text-right"><Link to={`/estudiante/multas/${m.idMulta}${filtro === "todas" ? "" : `?estado=${filtro}`}`} aria-label={`Ver detalle de multa ${m.idMulta}`} className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800 hover:border-brand-400 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300">Ver detalle<Icon name="arrow" className="h-3.5 w-3.5" /></Link></TD>
        </TR>) : <TR><TD colSpan={6}><EmptyState icon="check" title={multas.length ? "No hay multas en esta categoría" : "No tenés multas registradas"} description={multas.length ? "Probá con otro filtro para consultar tus sanciones." : "Tu historial de sanciones aparecerá acá cuando corresponda."} /></TD></TR>}</TBody>
      </Table>
    </TableWrap>
    <p className="text-xs leading-5 text-slate-500">Las sanciones pueden estar incluidas en tus facturas. Consultá Facturas y pagos para conocer el saldo a abonar y evitá sumar los mismos importes dos veces.</p>
  </div>;
}

export function StudentFineDetail({ multa: m, facturas }: { multa: Multa; facturas: Factura[] }) {
  const estado = estadoMultaVisual(m);
  const importe = importeMulta(m, undefined, facturas);
  const color = estado === "vencida" ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-300" : estado === "pendiente" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300" : estado === "pagada" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  return <Card className="overflow-hidden rounded-3xl border-slate-200 dark:border-slate-800">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5 dark:border-slate-800"><div className="flex items-center gap-3"><span className={`rounded-xl p-3 ${color}`}><Icon name={m.estado === "pagada" ? "check" : "fines"} className="h-5 w-5" /></span><div><p className="text-xs text-slate-500">Sanción {m.idMulta}</p><h2 className="mt-1 font-semibold">{TIPOS_MULTA.find((t) => t.id === m.tipo)?.nombre ?? m.tipo ?? "Multa de residencia"}</h2></div></div><StatusBadge estado={estado} /></div>
        <CardContent className="space-y-5 p-6">
          <div className={`rounded-2xl p-5 ${color}`}><p className="text-xs font-medium">{m.estado === "pagada" ? "Importe abonado" : m.estado === "anulada" ? "Importe a abonar" : "Importe de la sanción con recargos"}</p><p className="mt-1 text-3xl font-semibold tracking-tight">{formatARS(importe.total)}</p>{m.estado === "pendiente" ? <p className="mt-1 text-xs">{estado === "vencida" ? "El plazo de pago está vencido." : "Dentro del plazo de pago."}</p> : null}</div>
          <div><h3 className="text-sm font-semibold">Motivo de la sanción</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{m.motivo || "No hay un motivo detallado registrado."}</p></div>
          <dl className="grid grid-cols-2 gap-3"><StudentDetail label="Fecha de emisión" icon="calendar">{formatFecha(m.fechaEmision)}</StudentDetail><StudentDetail label="Vencimiento" icon="calendar">{formatFecha(m.fechaVence)}</StudentDetail></dl>
          <dl className="space-y-2 border-y border-slate-100 py-4 text-sm dark:border-slate-800"><div className="flex justify-between gap-3"><dt className="text-slate-500">Importe base</dt><dd className="font-medium">{formatARS(m.monto)}</dd></div>{m.montoSancion !== undefined ? <div className="flex justify-between gap-3 text-xs text-slate-500"><dt>Sanción</dt><dd>{formatARS(m.montoSancion)}</dd></div> : null}{m.montoDanios !== undefined ? <div className="flex justify-between gap-3 text-xs text-slate-500"><dt>Daños</dt><dd>{formatARS(m.montoDanios)}</dd></div> : null}<div className="flex justify-between gap-3"><dt className="text-slate-500">Recargo</dt><dd className={importe.recargo ? "font-medium text-red-700 dark:text-red-400" : "font-medium"}>{formatARS(importe.recargo)}</dd></div>{m.fechaPago ? <div className="flex justify-between gap-3"><dt className="text-slate-500">Fecha de pago</dt><dd className="font-medium">{formatFecha(m.fechaPago)}</dd></div> : null}</dl>
          {m.detalleDanios ? <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><h3 className="text-sm font-semibold">Daños registrados</h3><p className="mt-2 whitespace-pre-wrap text-sm text-slate-500">{m.detalleDanios}</p></div> : null}
          {m.observaciones ? <div><h3 className="text-sm font-semibold">Observaciones</h3><p className="mt-2 whitespace-pre-wrap text-sm text-slate-500">{m.observaciones}</p></div> : null}
          {m.periodoDesde ? <p className="text-xs text-slate-500">Períodos de facturación: {m.periodoDesde} a {m.periodoHasta ?? m.periodoDesde}.</p> : null}
          {m.historial?.length ? <details className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"><summary className="cursor-pointer text-sm font-medium">Historial de cambios ({m.historial.length})</summary><ol className="mt-4 space-y-4">{m.historial.map((cambio, i) => <li key={i} className="border-l-2 border-brand-200 pl-3"><p className="text-xs font-medium">{formatFecha(cambio.fecha)} · {cambio.accion === "prorroga" ? "Prórroga" : "Actualización"}</p>{cambio.motivo ? <p className="mt-1 text-xs text-slate-500">{cambio.motivo}</p> : null}<ul className="mt-2 space-y-1">{cambio.cambios.map((c, j) => <li key={j} className="text-xs text-slate-500">{c.campo}: {c.anterior} → {c.nuevo}</li>)}</ul></li>)}</ol></details> : null}
          {m.estado === "pendiente" ? <Link to="/estudiante/facturas" className="inline-flex items-center gap-2 rounded text-sm font-medium text-brand-700 hover:underline focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-300">Consultar mis facturas <Icon name="arrow" className="h-4 w-4" /></Link> : null}
        </CardContent>
      </Card>;
}
