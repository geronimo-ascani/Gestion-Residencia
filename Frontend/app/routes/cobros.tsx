import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { EstadoFacturaBadge } from "../Components/factura-detalle";
import { Button } from "../Components/ui/button";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { ListSummary, ListToolbar } from "../Components/ui/list-page";
import { PageHeader } from "../Components/ui/page-header";
import { SelectField } from "../Components/ui/select-field";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "../Components/ui/table";
import { FECHA_REFERENCIA } from "../lib/config";
import { correspondeCuota, saldoFactura, totalFactura } from "../lib/facturacion";
import { formatARS, formatFecha, normalizar } from "../lib/format";
import { useData } from "../lib/store";

export function meta() { return [{ title: "Cobros · Gestión de Residencia" }]; }

export default function Cobros() {
  const { facturas, pagos, contratos, alumnoPorId } = useData();
  const [params] = useSearchParams();
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState(params.get("estado") === "adeudan" ? "adeudan" : "todos");
  const [periodo, setPeriodo] = useState(params.get("periodo") === "todos" ? "" : FECHA_REFERENCIA.slice(0, 7));
  const base = useMemo(() => facturas.filter((f) => (!periodo || f.periodo === periodo) && normalizar(`${f.titular} ${f.documento} ${f.idFactura}`).includes(normalizar(busqueda))), [facturas, periodo, busqueda]);
  const filas = useMemo(() => base.filter((f) => estado === "todos" || (estado === "pagaron" ? saldoFactura(f, pagos) === 0 : saldoFactura(f, pagos) > 0)).sort((a, b) => b.periodo.localeCompare(a.periodo) || a.titular.localeCompare(b.titular)), [base, estado, pagos]);
  const movimientos = useMemo(() => pagos.filter((p) => (!periodo || p.fecha.startsWith(periodo)) && normalizar(`${alumnoPorId.get(p.idAlumno)?.apellido} ${alumnoPorId.get(p.idAlumno)?.nombre} ${alumnoPorId.get(p.idAlumno)?.documento} ${p.idFactura ?? ""}`).includes(normalizar(busqueda))).sort((a, b) => b.fecha.localeCompare(a.fecha)), [pagos, periodo, busqueda, alumnoPorId]);
  const deudores = new Set(base.filter((f) => saldoFactura(f, pagos) > 0).map((f) => f.idAlumno));
  const sinFacturar = useMemo(() => periodo ? contratos.filter((c) => {
    const alumno = alumnoPorId.get(c.idAlumno);
    return correspondeCuota(c, periodo) && !facturas.some((f) => f.idContrato === c.idContrato && f.periodo === periodo) && normalizar(`${alumno?.apellido} ${alumno?.nombre} ${alumno?.documento} ${c.idContrato}`).includes(normalizar(busqueda));
  }) : [], [contratos, facturas, periodo, busqueda, alumnoPorId]);
  return <div className="flex flex-col gap-6">
    <PageHeader eyebrow="Administración" title="Cobros" description="Registrá los ingresos y consultá quiénes pagaron y quiénes mantienen saldo pendiente." actions={<Link to="/cobros/registrar"><Button><Icon name="plus" className="h-4 w-4" />Registrar cobro</Button></Link>} />
    <ListSummary compactValues title="Estado de cobranza" description="Saldos de las facturas del período seleccionado. Los movimientos se filtran por fecha de cobro." icon="payments" items={[{ label: "Alumnos al día", value: new Set(base.filter((f) => !deudores.has(f.idAlumno)).map((f) => f.idAlumno)).size }, { label: "Alumnos con deuda", value: deudores.size }, { label: "Cobrado de facturas", value: formatARS(base.reduce((s, f) => s + totalFactura(f) - saldoFactura(f, pagos), 0)) }, { label: "Saldo pendiente", value: formatARS(base.reduce((s, f) => s + saldoFactura(f, pagos), 0)) }]} />
    <ListToolbar title="Control de pagos" count={filas.length} search={busqueda} onSearch={setBusqueda} placeholder="Alumno, DNI o factura…" searchLabel="Buscar cobros">
      <label className="text-sm">Período<input type="month" max={FECHA_REFERENCIA.slice(0, 7)} value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="ml-2 rounded-md border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-900" /></label>
      <SelectField id="estado-cobro" label="Estado de pago" value={estado} onChange={(e) => setEstado(e.target.value)}><option value="todos">Todos</option><option value="pagaron">Pagaron</option><option value="adeudan">Adeudan</option></SelectField>
    </ListToolbar>
    <TableWrap><Table className="min-w-[720px]"><THead><TR><TH>Alumno / factura</TH><TH>Total</TH><TH>Cobrado</TH><TH>Saldo</TH><TH>Estado</TH><TH className="text-right">Acciones</TH></TR></THead><TBody>{filas.length ? filas.map((f) => <TR key={f.idFactura}><TD><Link to={`/alumnos/${f.idAlumno}`} className="font-medium hover:underline">{f.titular}</Link><p className="text-xs text-slate-500">{f.idFactura} · {f.periodo}</p></TD><TD>{formatARS(totalFactura(f))}</TD><TD>{formatARS(totalFactura(f) - saldoFactura(f, pagos))}</TD><TD className="font-medium">{formatARS(saldoFactura(f, pagos))}</TD><TD><EstadoFacturaBadge factura={f} pagos={pagos} /></TD><TD className="text-right"><Link to={saldoFactura(f, pagos) > 0 ? `/cobros/registrar?factura=${f.idFactura}` : `/facturacion/${f.idFactura}`}><Button size="sm" variant="outline">{saldoFactura(f, pagos) > 0 ? "Registrar cobro" : "Ver factura"}<Icon name="arrow" className="h-3.5 w-3.5" /></Button></Link></TD></TR>) : <TR><TD colSpan={6}><EmptyState icon="payments" title="Sin resultados" description="No hay facturas con los filtros aplicados." /></TD></TR>}</TBody></Table></TableWrap>
    {sinFacturar.length && estado !== "pagaron" ? <section className="flex flex-col gap-4"><div><h2 className="text-lg font-semibold">Cuotas sin facturar · {periodo}</h2><p className="text-sm text-slate-500">{sinFacturar.length} cuotas generadas por los contratos. Emití su factura para registrar el cobro.</p></div><TableWrap><Table className="min-w-[720px]"><THead><TR><TH>Alumno</TH><TH>Contrato</TH><TH>Importe mensual</TH><TH className="text-right">Acciones</TH></TR></THead><TBody>{sinFacturar.map((c) => <TR key={c.idContrato}><TD>{alumnoPorId.get(c.idAlumno)?.apellido}, {alumnoPorId.get(c.idAlumno)?.nombre}</TD><TD>{c.idContrato}</TD><TD>{c.montoMensual ? formatARS(c.montoMensual) : "Sin importe registrado"}</TD><TD className="text-right"><Link to={`/facturacion/nueva?contrato=${c.idContrato}&periodo=${periodo}`}><Button variant="outline" size="sm">Generar factura<Icon name="arrow" className="h-3.5 w-3.5" /></Button></Link></TD></TR>)}</TBody></Table></TableWrap></section> : null}
    <p className="text-sm text-slate-500">Los saldos del resumen corresponden a las facturas emitidas. <Link to="/facturacion" className="text-brand-700 underline dark:text-brand-300">Consultar facturación.</Link></p>
    <div><h2 className="text-lg font-semibold">Historial de cobros</h2><p className="text-sm text-slate-500">{movimientos.length} movimientos · Ingresos reales por fecha de cobro</p></div>
    <TableWrap><Table className="min-w-[720px]"><THead><TR><TH>Fecha</TH><TH>Alumno</TH><TH>Concepto</TH><TH>Medio / referencia</TH><TH className="text-right">Importe</TH></TR></THead><TBody>{movimientos.length ? movimientos.map((p) => <TR key={p.idPago}><TD>{formatFecha(p.fecha)}</TD><TD>{alumnoPorId.get(p.idAlumno)?.apellido}, {alumnoPorId.get(p.idAlumno)?.nombre}</TD><TD>{p.idFactura ? <Link to={`/facturacion/${p.idFactura}`} className="hover:underline">{p.concepto}</Link> : p.concepto}</TD><TD><span className="capitalize">{p.medio ?? "Sin registrar"}</span><p className="text-xs text-slate-500">{p.referencia}</p></TD><TD className="text-right">{formatARS(p.monto)}</TD></TR>) : <TR><TD colSpan={5}><EmptyState icon="payments" title="Sin cobros registrados" description="No hay movimientos para la búsqueda y el período seleccionados." /></TD></TR>}</TBody></Table></TableWrap>
  </div>;
}
