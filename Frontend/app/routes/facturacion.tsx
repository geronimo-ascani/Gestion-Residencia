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
import { correspondeCuota, estadoFactura, saldoFactura, totalFactura } from "../lib/facturacion";
import { formatARS, formatFecha, normalizar } from "../lib/format";
import { useData } from "../lib/store";

export function meta() { return [{ title: "Facturación · Gestión de Residencia" }]; }

export default function Facturacion() {
  const { facturas, pagos, contratos, alumnoPorId } = useData();
  const [params] = useSearchParams();
  const [busqueda, setBusqueda] = useState("");
  const [periodo, setPeriodo] = useState(FECHA_REFERENCIA.slice(0, 7));
  const [estado, setEstado] = useState("todos");
  const idAlumno = params.get("alumno");
  const filas = useMemo(() => facturas.filter((f) => (!idAlumno || f.idAlumno === idAlumno) && (!periodo || f.periodo === periodo) &&
    (estado === "todos" || (estado === "adeudan" ? saldoFactura(f, pagos) > 0 : estado === "parcial" ? saldoFactura(f, pagos) > 0 && saldoFactura(f, pagos) < totalFactura(f) : estadoFactura(f, pagos) === estado)) &&
    normalizar(`${f.idFactura} ${f.titular} ${f.documento}`).includes(normalizar(busqueda))).sort((a, b) => b.periodo.localeCompare(a.periodo) || a.titular.localeCompare(b.titular)), [facturas, pagos, periodo, estado, busqueda, idAlumno]);
  const pendientes = useMemo(() => periodo ? contratos.filter((c) => correspondeCuota(c, periodo) && (!idAlumno || c.idAlumno === idAlumno) && !facturas.some((f) => f.idContrato === c.idContrato && f.periodo === periodo)) : [], [contratos, facturas, periodo, idAlumno]);
  return <div className="flex flex-col gap-6">
    <PageHeader eyebrow="Administración" title="Facturación" description="Cuotas mensuales de alojamiento y multas de los alumnos." actions={<div className="flex flex-wrap gap-2"><Link to="/cobros"><Button variant="outline">Consultar cobros</Button></Link><Link to="/facturacion/nueva"><Button><Icon name="plus" className="h-4 w-4" />Generar factura</Button></Link></div>} />
    <ListSummary compactValues title="Resumen de facturación" description="Importes correspondientes a los filtros aplicados." icon="contracts" items={[{ label: "Facturas", value: filas.length }, { label: "Facturado", value: formatARS(filas.reduce((s, f) => s + totalFactura(f), 0)) }, { label: "Saldo pendiente", value: formatARS(filas.reduce((s, f) => s + saldoFactura(f, pagos), 0)) }, { label: "Cuotas sin facturar", value: pendientes.length }]} />
    {idAlumno ? <Link to="/facturacion" className="text-sm text-brand-700 underline dark:text-brand-300">Ver todos los alumnos</Link> : null}
    <ListToolbar title="Facturas emitidas" count={filas.length} search={busqueda} onSearch={setBusqueda} placeholder="Factura, alumno o DNI…" searchLabel="Buscar facturas">
      <label className="text-sm">Período<input type="month" value={periodo} max={FECHA_REFERENCIA.slice(0, 7)} onChange={(e) => setPeriodo(e.target.value)} className="ml-2 rounded-md border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-900" /></label>
      <SelectField id="estado-factura" label="Estado" value={estado} onChange={(e) => setEstado(e.target.value)}><option value="todos">Todos</option><option value="adeudan">Con saldo pendiente</option><option value="pagada">Pagadas</option><option value="pendiente">Pendientes</option><option value="parcial">Con pago parcial</option><option value="vencida">Vencidas</option></SelectField>
    </ListToolbar>
    <TableWrap><Table className="min-w-[720px]"><THead><TR><TH>Factura / período</TH><TH>Alumno</TH><TH>Vencimiento</TH><TH>Total</TH><TH>Saldo</TH><TH>Estado</TH><TH className="text-right">Acciones</TH></TR></THead><TBody>
      {filas.length ? filas.map((f) => <TR key={f.idFactura}><TD><p className="font-medium">{f.idFactura}</p><p className="text-xs text-slate-500">{f.periodo}</p></TD><TD><Link to={`/alumnos/${f.idAlumno}`} className="font-medium hover:underline">{f.titular}</Link><p className="text-xs text-slate-500">DNI {f.documento}</p></TD><TD>{formatFecha(f.fechaVence)}</TD><TD>{formatARS(totalFactura(f))}</TD><TD>{formatARS(saldoFactura(f, pagos))}</TD><TD><EstadoFacturaBadge factura={f} pagos={pagos} /></TD><TD className="text-right"><Link to={`/facturacion/${f.idFactura}`}><Button size="sm" variant="outline">Ver detalle<Icon name="arrow" className="h-3.5 w-3.5" /></Button></Link></TD></TR>) : <TR><TD colSpan={7}><EmptyState icon="contracts" title="Sin facturas en esta vista" description="Cambiá los filtros o generá una factura para una cuota pendiente." /></TD></TR>}
    </TBody></Table></TableWrap>
    {pendientes.length ? <><div><h2 className="text-lg font-semibold">Cuotas pendientes de facturar · {periodo}</h2><p className="text-sm text-slate-500">Una cuota completa por cada mes de estadía, según el importe del contrato.</p></div><TableWrap><Table className="min-w-[720px]"><THead><TR><TH>Contrato</TH><TH>Alumno</TH><TH>Importe mensual</TH><TH className="text-right">Acciones</TH></TR></THead><TBody>{pendientes.map((c) => <TR key={c.idContrato}><TD><Link to={`/contratos/${c.idContrato}`} className="hover:underline">{c.idContrato}</Link></TD><TD>{alumnoPorId.get(c.idAlumno)?.apellido}, {alumnoPorId.get(c.idAlumno)?.nombre}</TD><TD>{c.montoMensual ? formatARS(c.montoMensual) : "Sin importe registrado"}</TD><TD className="text-right"><Link to={`/facturacion/nueva?contrato=${c.idContrato}&periodo=${periodo}`}><Button size="sm" variant="outline">Generar factura<Icon name="arrow" className="h-3.5 w-3.5" /></Button></Link></TD></TR>)}</TBody></Table></TableWrap></> : null}
  </div>;
}
