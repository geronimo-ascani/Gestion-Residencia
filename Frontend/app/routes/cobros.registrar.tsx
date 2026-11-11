import { useId, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Button } from "../Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { SelectField } from "../Components/ui/select-field";
import { TextField } from "../Components/ui/text-field";
import { useToast } from "../Components/ui/toast";
import { FECHA_REFERENCIA } from "../lib/config";
import { saldoFactura, totalFactura } from "../lib/facturacion";
import { formatARS } from "../lib/format";
import { useData } from "../lib/store";
import type { RegistrarCobroInput } from "../lib/types";

export function meta() { return [{ title: "Registrar cobro · Gestión de Residencia" }]; }

export default function RegistrarCobro() {
  const { facturas, pagos, registrarCobro } = useData();
  const [params] = useSearchParams();
  const [idFactura, setIdFactura] = useState(params.get("factura") ?? "");
  const factura = facturas.find((f) => f.idFactura === idFactura);
  const pendientes = facturas.filter((f) => saldoFactura(f, pagos) > 0);
  const [monto, setMonto] = useState(() => factura ? String(saldoFactura(factura, pagos)) : "");
  const [fecha, setFecha] = useState(FECHA_REFERENCIA);
  const [medio, setMedio] = useState<RegistrarCobroInput["medio"]>("efectivo");
  const [referencia, setReferencia] = useState("");
  const [error, setError] = useState("");
  const [confirmado, setConfirmado] = useState(false);
  const enviando = useRef(false);
  const id = useId();
  const navigate = useNavigate();
  const { toast } = useToast();
  return <div className="flex flex-col gap-6">
    <PageHeader eyebrow="Cobros" title="Registrar cobro" description="Asociá el pago a una factura. Podés cancelar el saldo completo o registrar un pago parcial." actions={<Link to="/cobros"><Button variant="outline"><Icon name="arrow" className="h-4 w-4 rotate-180" />Volver al listado</Button></Link>} />
    {pendientes.length === 0 ? <EmptyState icon="payments" title="No hay facturas con saldo pendiente" description="Todas las facturas emitidas están pagadas. Podés consultar o generar facturas desde Facturación." action={<Link to="/facturacion"><Button variant="outline">Ir a facturación</Button></Link>} /> : <form className="flex flex-col gap-6" onSubmit={(event) => {
      event.preventDefault();
      if (enviando.current) return;
      enviando.current = true;
      try { registrarCobro({ idFactura, monto: Number(monto), fecha, medio, referencia }); setConfirmado(true); toast({ title: "Cobro registrado", description: `${formatARS(Number(monto))} · ${factura?.titular}`, variant: "success" }); navigate(`/facturacion/${idFactura}`); }
      catch (e) { enviando.current = false; setError(e instanceof Error ? e.message : "No se pudo registrar el cobro."); }
    }}>
      <Card><CardHeader><CardTitle>Factura a cobrar</CardTitle></CardHeader><CardContent className="space-y-5">
        <SelectField id={`${id}-factura`} label="Alumno y factura pendiente" required value={idFactura} onChange={(e) => { const f = facturas.find((item) => item.idFactura === e.target.value); setIdFactura(e.target.value); setMonto(f ? String(saldoFactura(f, pagos)) : ""); setError(""); }}><option value="">Seleccioná una factura</option>{pendientes.map((f) => <option key={f.idFactura} value={f.idFactura}>{f.titular} · {f.periodo} · {f.idFactura} · Saldo {formatARS(saldoFactura(f, pagos))}</option>)}</SelectField>
        {factura ? <dl className="grid gap-4 rounded-lg bg-brand-50 p-4 sm:grid-cols-3 dark:bg-slate-800"><div><dt className="text-sm text-slate-500">Total facturado</dt><dd className="font-semibold">{formatARS(totalFactura(factura))}</dd></div><div><dt className="text-sm text-slate-500">Cobrado</dt><dd className="font-semibold">{formatARS(totalFactura(factura) - saldoFactura(factura, pagos))}</dd></div><div><dt className="text-sm text-slate-500">Saldo pendiente</dt><dd className="font-semibold">{formatARS(saldoFactura(factura, pagos))}</dd></div></dl> : null}
        {idFactura && !factura ? <p role="alert" className="text-sm text-red-700">La factura indicada no existe. Seleccioná una factura pendiente.</p> : null}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Datos del cobro</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
        <TextField id={`${id}-monto`} label="Importe recibido (ARS)" type="number" min="0.01" step="0.01" max={factura ? saldoFactura(factura, pagos) : undefined} required value={monto} onChange={(e) => setMonto(e.target.value)} />
        <TextField id={`${id}-fecha`} label="Fecha de cobro" type="date" min={factura?.fechaEmision} max={FECHA_REFERENCIA} required value={fecha} onChange={(e) => setFecha(e.target.value)} />
        <SelectField id={`${id}-medio`} label="Medio de pago" value={medio} onChange={(e) => { const valor = e.target.value; if (valor === "efectivo" || valor === "transferencia" || valor === "tarjeta") setMedio(valor); }}><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="tarjeta">Tarjeta</option></SelectField>
        <TextField id={`${id}-referencia`} label="Referencia de la operación" required={medio !== "efectivo"} value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Número de comprobante u operación" />
        <p className="text-sm text-slate-500 sm:col-span-2">Las multas incluidas se marcan como pagadas al cancelar el total de la factura.</p>
      </CardContent></Card>
      {error ? <p role="alert" className="rounded-md border border-red-200 bg-white p-4 text-sm text-red-700 dark:bg-slate-900">{error}</p> : null}
      <div className="flex justify-end gap-3"><Link to="/cobros"><Button type="button" variant="outline">Cancelar</Button></Link><Button type="submit" disabled={!factura || saldoFactura(factura, pagos) <= 0 || confirmado}><Icon name="check" className="h-4 w-4" />Registrar cobro</Button></div>
    </form>}
  </div>;
}
