import { CancelarFacturaButton } from "../Components/actions/cancelar-factura-button";
import { BackToList } from "../Components/ui/back-to-list";
import { Link, useParams } from "react-router";
import { EstadoFacturaBadge, FacturaDetalle } from "../Components/factura-detalle";
import { Button, ButtonLink } from "../Components/ui/button";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "../Components/ui/table";
import { cobradoDirectoFactura, saldoFactura } from "../lib/facturacion";
import { formatARS, formatFecha } from "../lib/format";
import { useData } from "../lib/store";

export function meta() { return [{ title: "Detalle de factura · Gestión de Residencia" }]; }

export default function FacturaDetallePagina() {
  const { idFactura } = useParams();
  const { facturas, pagos } = useData();
  const factura = facturas.find((f) => f.idFactura === idFactura);
  const volver = <BackToList to="/facturacion" />;
  if (!factura) return <div className="flex flex-col gap-6"><PageHeader eyebrow="Facturación" title="Factura no encontrada" description="No existe una factura con el identificador solicitado." actions={volver} /><EmptyState icon="contracts" title="Factura no encontrada" description="Verificá el enlace o volvé al listado de facturas." /></div>;
  const movimientos = pagos.filter((p) => p.idFactura === factura.idFactura).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const saldo = saldoFactura(factura, pagos);
  const reemplazo = facturas.find((f) => f.idFacturaOrigen === factura.idFactura);
  return <div className="flex flex-col gap-6">
    <PageHeader eyebrow="Facturación" title={`Factura ${factura.idFactura}`} description="Detalle de alojamiento, multas y pagos asociados." actions={<div className="flex flex-wrap gap-2">{volver}<Button variant="outline" onClick={() => window.print()}>Imprimir factura</Button>{saldo > 0 ? <ButtonLink to={`/cobros/registrar?factura=${factura.idFactura}`}><Icon name="payments" className="h-4 w-4" />Registrar cobro</ButtonLink> : null}<CancelarFacturaButton factura={factura} />
      {factura.fechaCancelacion ? <ButtonLink to={reemplazo ? `/facturacion/${reemplazo.idFactura}` : `/facturacion/nueva?origen=${encodeURIComponent(factura.idFactura)}`} variant="outline">{reemplazo ? "Ver factura de reemplazo" : "Generar factura de reemplazo"}</ButtonLink> : null}
    </div>} />
    <article className="factura-imprimible mx-auto w-full max-w-5xl overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <header className="border-b-2 border-brand-700 bg-slate-50 px-6 py-6 dark:bg-slate-900 sm:px-10"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Gestión de Residencia · Alojamiento estudiantil</p><div className="mt-2 flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold">Factura de alojamiento</h2><EstadoFacturaBadge factura={factura} pagos={pagos} /></div><p className="mt-2 text-sm text-slate-500">{factura.idFactura} · Período {factura.periodo}</p></header>
      <div className="space-y-7 px-6 py-7 sm:px-10">
        <section><h3 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wide dark:border-slate-800">Datos del alumno y de emisión</h3><dl className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><div><dt className="text-xs uppercase text-slate-500">Titular</dt><dd className="mt-1 font-medium"><Link to={`/alumnos/${factura.idAlumno}`} className="hover:underline">{factura.titular}</Link></dd></div><div><dt className="text-xs uppercase text-slate-500">DNI</dt><dd className="mt-1">{factura.documento}</dd></div><div><dt className="text-xs uppercase text-slate-500">Contrato</dt><dd className="mt-1"><Link to={`/contratos/${factura.idContrato}`} className="hover:underline">{factura.idContrato}</Link></dd></div><div><dt className="text-xs uppercase text-slate-500">Emisión</dt><dd className="mt-1">{formatFecha(factura.fechaEmision)}</dd></div><div><dt className="text-xs uppercase text-slate-500">Vencimiento</dt><dd className="mt-1">{formatFecha(factura.fechaVence)}</dd></div></dl></section>
        {factura.fechaCancelacion ? <section className="rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-900">
          <p className="font-semibold">Cancelada el {formatFecha(factura.fechaCancelacion)}</p>
          {factura.motivoCancelacion ? <p className="mt-1 whitespace-pre-wrap">{factura.motivoCancelacion}</p> : null}
        </section> : null}
        {factura.idFacturaOrigen ? <p className="text-sm">Reemplaza a la factura <Link to={`/facturacion/${factura.idFacturaOrigen}`} className="font-medium underline">{factura.idFacturaOrigen}</Link>.</p> : null}
        <section><h3 className="mb-4 text-sm font-semibold uppercase tracking-wide">Detalle de conceptos</h3><FacturaDetalle factura={factura} /></section>
        <dl className="grid gap-4 rounded-lg bg-brand-50 p-5 sm:grid-cols-2 dark:bg-slate-900"><div><dt className="text-sm text-slate-500">Cobros registrados en esta factura</dt><dd className="mt-1 text-xl font-semibold">{formatARS(cobradoDirectoFactura(factura, pagos))}</dd></div>{factura.creditoAplicado ? <div><dt className="text-sm text-slate-500">Crédito aplicado</dt><dd className="mt-1 text-xl font-semibold">{formatARS(factura.creditoAplicado)}</dd></div> : null}<div><dt className="text-sm text-slate-500">Saldo pendiente</dt><dd className="mt-1 text-xl font-semibold text-brand-800 dark:text-brand-200">{formatARS(saldo)}</dd></div></dl>
        <footer className="border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800">Comprobante interno de la residencia · {factura.idFactura}</footer>
      </div>
    </article>
    <section className="historial-factura flex flex-col gap-4"><h2 className="text-lg font-semibold">Cobros de esta factura</h2><TableWrap><Table><THead><TR><TH>Fecha</TH><TH>Medio</TH><TH>Referencia</TH><TH className="text-right">Importe</TH></TR></THead><TBody>{movimientos.length ? movimientos.map((p) => <TR key={p.idPago}><TD>{formatFecha(p.fecha)}</TD><TD className="capitalize">{p.medio ?? "Sin registrar"}</TD><TD>{p.referencia || "—"}</TD><TD className="text-right">{formatARS(p.monto)}</TD></TR>) : <TR><TD colSpan={4}><EmptyState icon="payments" title="Sin cobros registrados" description="Todavía no se registraron pagos para esta factura." /></TD></TR>}</TBody></Table></TableWrap></section>
  </div>;
}
