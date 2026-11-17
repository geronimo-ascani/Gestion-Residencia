import { Link } from "react-router";
import type { datosPortalAlumno } from "../lib/portal-alumno";
import type { Factura, Pago } from "../lib/types";
import { saldoFactura, totalFactura } from "../lib/facturacion";
import { formatARS, formatFecha } from "../lib/format";
import { EstadoFacturaBadge, FacturaDetalle } from "./factura-detalle";
import { Badge } from "./ui/badge";
import { EmptyState } from "./ui/empty-state";
import { Icon } from "./ui/icons";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "./ui/table";
import { StudentDetail } from "./student-detail";
import { StudentMetric, StudentSection, studentLink } from "./student-ui";

export function StudentBilling({ portal: p }: { portal: ReturnType<typeof datosPortalAlumno> }) {
  const ultimo = p.pagos[0];
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-3"><StudentMetric label="Saldo facturado pendiente" value={formatARS(p.saldo)} description={`${p.pendientes.length} ${p.pendientes.length === 1 ? "factura" : "facturas"} con saldo. Incluye solo importes emitidos.`} icon="payments" danger={p.saldo > 0} /><StudentMetric label="Facturas saldadas" value={p.facturas.length - p.pendientes.length} description={`${p.facturas.length} facturas registradas en tu cuenta.`} icon="check" /><StudentMetric label="Último pago registrado" value={ultimo ? formatARS(ultimo.monto) : "Sin pagos"} description={ultimo ? `Registrado el ${formatFecha(ultimo.fecha)}.` : "Tus pagos aparecerán cuando se registren."} icon="calendar" /></div>
    <StudentSection title="Mis facturas" description="Consultá los períodos, sus vencimientos y el saldo de cada factura." icon="contracts" aside={<Badge variant="brand">{p.facturas.length} facturas</Badge>} flush>
      {p.facturas.length ? <TableWrap className="rounded-none border-0 shadow-none dark:bg-slate-900"><Table className="min-w-[720px]"><caption className="sr-only">Facturas de mi cuenta</caption><THead><TR><TH>Período / factura</TH><TH>Vencimiento</TH><TH className="text-right">Total</TH><TH className="text-right">Saldo</TH><TH>Estado</TH><TH className="text-right">Acciones</TH></TR></THead><TBody>{p.facturas.map((f) => <TR key={f.idFactura}><TD><p className="font-semibold">{f.periodo}</p><p className="mt-1 text-xs text-slate-500">{f.idFactura}</p></TD><TD className="whitespace-nowrap">{formatFecha(f.fechaVence)}</TD><TD className="text-right whitespace-nowrap tabular-nums">{formatARS(totalFactura(f))}</TD><TD className={`text-right font-semibold whitespace-nowrap tabular-nums ${saldoFactura(f, p.pagos) > 0 ? "text-red-700 dark:text-red-300" : "text-slate-500"}`}>{formatARS(saldoFactura(f, p.pagos))}</TD><TD><EstadoFacturaBadge factura={f} pagos={p.pagos} /></TD><TD className="text-right"><Link to={`/estudiante/facturas/${f.idFactura}`} aria-label={`Ver detalle de factura ${f.idFactura}`} className={`${studentLink} whitespace-nowrap px-3 py-2 text-xs`}>Ver detalle<Icon name="arrow" className="h-3.5 w-3.5" /></Link></TD></TR>)}</TBody></Table></TableWrap> : <EmptyState icon="contracts" title="Todavía no hay facturas emitidas" description="Cuando administración emita una factura, vas a encontrarla acá." />}
    </StudentSection>
    <StudentSection title="Historial de pagos" description="Todos los pagos que administración registró en tu cuenta." icon="payments" aside={<Badge>{p.pagos.length} pagos</Badge>} flush>
      {p.pagos.length ? <TableWrap className="rounded-none border-0 shadow-none dark:bg-slate-900"><Table className="min-w-[620px]"><caption className="sr-only">Pagos registrados de mi cuenta</caption><THead><TR><TH>Fecha / recibo</TH><TH>Concepto</TH><TH>Medio y referencia</TH><TH className="text-right">Importe</TH></TR></THead><TBody>{p.pagos.map((pago) => <TR key={pago.idPago}><TD><p className="font-medium">{formatFecha(pago.fecha)}</p><p className="mt-1 text-xs text-slate-500">{pago.idPago}</p></TD><TD>{pago.concepto}</TD><TD><Badge>{pago.medio ?? "Sin indicar"}</Badge><p className="mt-1 text-xs text-slate-500">{pago.referencia || "Sin referencia"}</p></TD><TD className="text-right font-semibold whitespace-nowrap tabular-nums">{formatARS(pago.monto)}</TD></TR>)}</TBody></Table></TableWrap> : <EmptyState icon="payments" title="Sin pagos registrados" description="Tu historial se actualizará cuando administración registre un pago." />}
    </StudentSection>
    <p className="flex items-start gap-2 px-1 text-xs leading-5 text-slate-500"><Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />Las multas incluidas en una factura ya forman parte de su total. Consultá con administración para abonar o solicitar una revisión.</p>
  </div>;
}

export function StudentInvoiceDetail({ factura: f, pagos }: { factura: Factura; pagos: Pago[] }) {
  const saldo = saldoFactura(f, pagos);
  const movimientos = pagos.filter((p) => p.idFactura === f.idFactura);
  return <div className="space-y-6">
    <StudentSection title={`Factura ${f.idFactura}`} description={`Alojamiento y conceptos del período ${f.periodo}`} icon="contracts" aside={<EstadoFacturaBadge factura={f} pagos={pagos} />}>
      <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-brand-50 p-5 dark:bg-brand-900/20"><p className="text-xs text-brand-700 dark:text-brand-300">Total de la factura</p><p className="mt-2 text-3xl font-semibold tracking-tight">{formatARS(totalFactura(f))}</p></div><div className={`rounded-2xl p-5 ${saldo > 0 ? "bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-300" : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300"}`}><p className="text-xs">Saldo pendiente</p><p className="mt-2 text-3xl font-semibold tracking-tight">{formatARS(saldo)}</p></div></div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2"><StudentDetail label="Titular" icon="user">{f.titular}</StudentDetail><StudentDetail label="Documento" icon="contracts">{f.documento}</StudentDetail><StudentDetail label="Emisión" icon="calendar">{formatFecha(f.fechaEmision)}</StudentDetail><StudentDetail label="Vencimiento" icon="calendar">{formatFecha(f.fechaVence)}</StudentDetail></dl>
    </StudentSection>
    <StudentSection title="Detalle de conceptos" description="Desglose de los importes incluidos en esta factura." icon="payments"><FacturaDetalle factura={f} /></StudentSection>
    <StudentSection title="Pagos de esta factura" icon="check">{movimientos.length ? <ul className="space-y-3">{movimientos.map((pago) => <li key={pago.idPago} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><div><p className="text-sm font-medium">{formatFecha(pago.fecha)} · {pago.medio ?? "Medio sin indicar"}</p><p className="mt-1 text-xs text-slate-500">{pago.referencia || pago.idPago}</p></div><p className="font-semibold">{formatARS(pago.monto)}</p></li>)}</ul> : <p className="text-sm text-slate-500">No hay pagos registrados para esta factura.</p>}</StudentSection>
    <p className="text-xs leading-5 text-slate-500">Los pagos se muestran una vez registrados por la residencia. Para abonar o consultar un movimiento, contactá a la administración.</p>
  </div>;
}
