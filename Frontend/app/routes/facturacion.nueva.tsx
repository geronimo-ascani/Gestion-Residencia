import { useId, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { FacturaDetalle } from "../Components/factura-detalle";
import { Button, ButtonLink } from "../Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { FormularioConfirmado } from "../Components/ui/formulario-confirmado";
import { PageHeader } from "../Components/ui/page-header";
import { SelectField } from "../Components/ui/select-field";
import { TextField } from "../Components/ui/text-field";
import { useToast } from "../Components/ui/toast";
import { FECHA_REFERENCIA } from "../lib/config";
import { cobradoFactura, correspondeCuota, prepararFactura, saldoFactura } from "../lib/facturacion";
import { formatARS, formatFecha } from "../lib/format";
import { useData } from "../lib/store";
import type { Factura } from "../lib/types";

export function meta() { return [{ title: "Generar factura · Gestión de Residencia" }]; }

export default function NuevaFactura() {
  const data = useData();
  const [params] = useSearchParams();
  const origenId = params.get("origen");
  const origen = data.facturas.find((f) => f.idFactura === origenId && f.fechaCancelacion);
  const reemplazo = origen && data.facturas.find((f) => f.idFacturaOrigen === origen.idFactura);
  if (origenId && (!origen || reemplazo)) {
    return <PageHeader eyebrow="Facturación" title="Reemplazo no disponible"
      description={reemplazo ? "La factura de origen ya tiene un reemplazo." : "Seleccioná una factura cancelada para preparar un reemplazo."}
      actions={<ButtonLink to={reemplazo ? `/facturacion/${reemplazo.idFactura}` : "/facturacion"} variant="outline">{reemplazo ? "Ver reemplazo" : "Volver a facturación"}</ButtonLink>} />;
  }
  const contratoInicial = origen?.idContrato ?? params.get("contrato") ?? "";
  const periodoInicial = origen?.periodo ?? params.get("periodo") ?? FECHA_REFERENCIA.slice(0, 7);
  return <FormularioFactura key={origenId ?? `${contratoInicial}-${periodoInicial}`} origen={origen} contratoInicial={contratoInicial} periodoInicial={periodoInicial} />;
}

function FormularioFactura({ origen, contratoInicial, periodoInicial }: { origen?: Factura; contratoInicial: string; periodoInicial: string }) {
  const data = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const id = useId();
  const enviando = useRef(false);
  const alojamiento = origen?.detalles.find((detalle) => !detalle.idMulta);
  const [periodo, setPeriodo] = useState(periodoInicial);
  const [idContrato, setIdContrato] = useState(contratoInicial);
  const [concepto, setConcepto] = useState(alojamiento?.concepto ?? "Alojamiento mensual");
  const [monto, setMonto] = useState(String(alojamiento?.monto ?? ""));
  const [fechaVence, setFechaVence] = useState(origen?.fechaVence ?? "");
  const [error, setError] = useState("");
  const destino = origen ? `/facturacion/${origen.idFactura}` : "/facturacion";
  const credito = origen ? cobradoFactura(origen, data.pagos) : 0;
  const opciones = data.contratos.filter((c) => correspondeCuota(c, periodo) && (!origen || credito <= 0 || c.idAlumno === origen.idAlumno));
  const datosReemplazo = origen ? { idFacturaOrigen: origen.idFactura, concepto, monto: Number(monto), fechaVence } : undefined;
  let factura: Factura | undefined;
  let errorVista = "";
  if (idContrato) {
    try { factura = prepararFactura(data, idContrato, periodo, "Vista previa", datosReemplazo); }
    catch (err) { errorVista = err instanceof Error ? err.message : "Verificá los datos."; }
  }

  return <div className="flex flex-col gap-6">
    <FormularioConfirmado className="flex flex-col gap-6" onSubmit={(event) => {
      event.preventDefault();
      if (enviando.current || !factura) return;
      enviando.current = true;
      try {
        const nuevo = data.generarFactura(idContrato, periodo, datosReemplazo);
        toast({ title: origen ? "Reemplazo generado" : "Factura generada" });
        navigate(`/facturacion/${nuevo}`);
      } catch (err) {
        enviando.current = false;
        setError(err instanceof Error ? err.message : "No se pudo generar la factura.");
      }
    }}>
      <PageHeader eyebrow="Facturación" title={origen ? "Generar factura de reemplazo" : "Generar factura"}
        description={origen ? `Revisá y corregí los datos de emisión de la factura ${origen.idFactura}.` : "Seleccioná el contrato y el mes. Se incluyen las multas pendientes correspondientes al período."}
        actions={<ButtonLink to={destino} variant="outline" data-descartar>{origen ? "Volver a la factura original" : "Volver a facturación"}</ButtonLink>} />
      <Card>
        <CardHeader><CardTitle>Datos de facturación</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <TextField id={`${id}-periodo`} label="Período" type="month" required max={FECHA_REFERENCIA.slice(0, 7)} value={periodo} onChange={(event) => {
            const nuevoPeriodo = event.target.value;
            setPeriodo(nuevoPeriodo);
            if (!origen || !data.contratos.some((c) => c.idContrato === idContrato && correspondeCuota(c, nuevoPeriodo))) setIdContrato("");
            setError("");
          }} />
          <SelectField id={`${id}-contrato`} label="Alumno y contrato" required value={idContrato} onChange={(event) => {
            setIdContrato(event.target.value);
            setError("");
          }}>
            <option value="">Seleccioná un contrato</option>
            {opciones.map((c) => {
              const alumno = data.alumnoPorId.get(c.idAlumno);
              const emitida = data.facturas.some((f) => f.idContrato === c.idContrato && f.periodo === periodo && !f.fechaCancelacion);
              return <option key={c.idContrato} value={c.idContrato}>{alumno?.apellido}, {alumno?.nombre} · {c.idContrato}{emitida ? " · Ya facturado" : ""}</option>;
            })}
          </SelectField>
          {origen ? <>
            <TextField id={`${id}-concepto`} label="Concepto de alojamiento" required maxLength={200} value={concepto} onChange={(event) => { setConcepto(event.target.value); setError(""); }} />
            <TextField id={`${id}-monto`} label="Importe de alojamiento (ARS)" type="number" required min="0.01" step="0.01" value={monto} onChange={(event) => { setMonto(event.target.value); setError(""); }} />
            <TextField id={`${id}-vencimiento`} label="Vencimiento" type="date" required value={fechaVence} onChange={(event) => { setFechaVence(event.target.value); setError(""); }} />
            {credito > 0 ? <p className="self-end text-sm text-slate-600 dark:text-slate-300">Se aplicarán {formatARS(credito)} de crédito al mismo titular.</p> : null}
          </> : <p className="text-sm text-slate-500 sm:col-span-2">Se factura el mes completo por cada mes con estadía, hasta la finalización o baja del contrato.</p>}
        </CardContent>
      </Card>
      {error || errorVista ? <p role="alert" className="rounded-md border border-red-200 bg-white p-4 text-sm text-red-700 dark:bg-slate-900">{error || errorVista}</p> : null}
      {factura ? <Card>
        <CardHeader><div><CardTitle>Vista previa · {factura.periodo}</CardTitle><p className="mt-1 text-sm text-slate-500">{factura.titular} · DNI {factura.documento} · Vence {formatFecha(factura.fechaVence)}</p></div></CardHeader>
        <CardContent>
          <FacturaDetalle factura={factura} />
          <p className="mt-4 text-sm text-slate-500">{factura.detalles.length === 1 ? "Sin multas pendientes para este período." : "Se incluyen las multas pendientes que corresponden al período."}</p>
          {credito > 0 ? <p className="mt-2 text-sm font-semibold">Saldo después del crédito {formatARS(saldoFactura(factura, data.pagos))}</p> : null}
        </CardContent>
      </Card> : null}
      <div className="flex justify-end gap-3">
        <ButtonLink data-descartar to={destino} variant="outline">Cancelar</ButtonLink>
        <Button type="submit" disabled={!factura}>{origen ? "Emitir reemplazo" : "Generar factura"}</Button>
      </div>
    </FormularioConfirmado>
  </div>;
}
