import { useId, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { FacturaDetalle } from "../Components/factura-detalle";
import { Button } from "../Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { SelectField } from "../Components/ui/select-field";
import { TextField } from "../Components/ui/text-field";
import { useToast } from "../Components/ui/toast";
import { FECHA_REFERENCIA } from "../lib/config";
import { correspondeCuota, prepararFactura } from "../lib/facturacion";
import { formatFecha } from "../lib/format";
import { useData } from "../lib/store";

export function meta() { return [{ title: "Generar factura · Gestión de Residencia" }]; }

export default function NuevaFactura() {
  const data = useData();
  const [params] = useSearchParams();
  const [periodo, setPeriodo] = useState(params.get("periodo") ?? FECHA_REFERENCIA.slice(0, 7));
  const [idContrato, setIdContrato] = useState(params.get("contrato") ?? "");
  const [error, setError] = useState("");
  const id = useId();
  const enviando = useRef(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const opciones = data.contratos.filter((c) => correspondeCuota(c, periodo));
  let factura;
  let errorVista = "";
  if (idContrato) {
    try { factura = prepararFactura(data, idContrato, periodo, "Vista previa"); }
    catch (e) { errorVista = e instanceof Error ? e.message : "Verificá los datos."; }
  }
  return <div className="flex flex-col gap-6">
    <PageHeader eyebrow="Facturación" title="Generar factura" description="Seleccioná el contrato y el mes. Las multas pendientes habilitadas para el período se incorporan automáticamente." actions={<Link to="/facturacion"><Button variant="outline"><Icon name="arrow" className="h-4 w-4 rotate-180" />Volver al listado</Button></Link>} />
    <form className="flex flex-col gap-6" onSubmit={(event) => {
      event.preventDefault();
      if (enviando.current) return;
      enviando.current = true;
      try { const nuevo = data.generarFactura(idContrato, periodo); toast({ title: "Factura generada", variant: "success" }); navigate(`/facturacion/${nuevo}`); }
      catch (e) { enviando.current = false; setError(e instanceof Error ? e.message : "No se pudo generar la factura."); }
    }}>
      <Card><CardHeader><CardTitle>Datos de facturación</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
        <TextField id={`${id}-periodo`} label="Período" type="month" required max={FECHA_REFERENCIA.slice(0, 7)} value={periodo} onChange={(e) => { setPeriodo(e.target.value); setIdContrato(""); setError(""); }} />
        <SelectField id={`${id}-contrato`} label="Alumno y contrato" required value={idContrato} onChange={(e) => { setIdContrato(e.target.value); setError(""); }}><option value="">Seleccioná un contrato</option>{opciones.map((c) => { const a = data.alumnoPorId.get(c.idAlumno); const emitida = data.facturas.some((f) => f.idContrato === c.idContrato && f.periodo === periodo); return <option key={c.idContrato} value={c.idContrato}>{a?.apellido}, {a?.nombre} · {c.idContrato}{emitida ? " · Ya facturado" : ""}</option>; })}</SelectField>
        <p className="text-sm text-slate-500 sm:col-span-2">Se factura el mes completo por cada mes con estadía, hasta la finalización o baja del contrato. No se incluyen depósitos de garantía.</p>
      </CardContent></Card>
      {error || errorVista ? <p role="alert" className="rounded-md border border-red-200 bg-white p-4 text-sm text-red-700 dark:bg-slate-900">{error || errorVista}</p> : null}
      {factura ? <Card><CardHeader><div><CardTitle>Vista previa · {factura.periodo}</CardTitle><p className="mt-1 text-sm text-slate-500">{factura.titular} · DNI {factura.documento} · Vence {formatFecha(factura.fechaVence)}</p></div></CardHeader><CardContent><FacturaDetalle factura={factura} /><p className="mt-4 text-sm text-slate-500">{factura.detalles.length === 1 ? "No hay multas pendientes para incluir en esta factura." : "Las multas se incluyen una sola vez. Los importes quedan registrados al emitir la factura."}</p></CardContent></Card> : null}
      <div className="flex justify-end gap-3"><Link to="/facturacion"><Button type="button" variant="outline">Cancelar</Button></Link><Button type="submit" disabled={!factura}><Icon name="plus" className="h-4 w-4" />Generar factura</Button></div>
    </form>
  </div>;
}
