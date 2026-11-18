import { useId, useState } from "react";
import { useNavigate } from "react-router";
import { cobradoFactura, saldoFactura } from "../../lib/facturacion";
import { useData } from "../../lib/store";
import type { Factura } from "../../lib/types";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { FormularioConfirmado } from "../ui/formulario-confirmado";
import { useToast } from "../ui/toast";

export function CancelarFacturaButton({ factura }: { factura: Factura }) {
  const { pagos, cancelarFactura } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  if (saldoFactura(factura, pagos) <= 0) return null;

  return <>
    <Button variant="danger" onClick={() => { setMotivo(""); setError(""); setAbierto(true); }}>Cancelar factura</Button>
    <Dialog open={abierto} onClose={() => setAbierto(false)} title={`Cancelar factura ${factura.idFactura}`}
      description={`Se cerrará el saldo pendiente y la factura quedará en el historial.${cobradoFactura(factura, pagos) > 0 ? " El importe cobrado quedará disponible como crédito para su reemplazo." : ""}`}>
      <FormularioConfirmado confirmarGuardado={false} className="space-y-4" onSubmit={(event) => {
        event.preventDefault();
        const submitter = (event.nativeEvent as SubmitEvent).submitter;
        try {
          cancelarFactura(factura.idFactura, motivo);
          setAbierto(false);
          toast({ title: "Factura cancelada" });
          if (submitter instanceof HTMLButtonElement && submitter.value === "reemplazar") {
            navigate(`/facturacion/nueva?origen=${encodeURIComponent(factura.idFactura)}`);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "No se pudo cancelar la factura.");
        }
      }}>
        <label htmlFor={id} className="block text-sm font-medium">Motivo de cancelación *</label>
        <textarea id={id} required maxLength={1000} rows={4} value={motivo} onChange={(event) => setMotivo(event.target.value)}
          className="w-full rounded-md border border-slate-400 bg-transparent p-3 text-sm" />
        {error ? <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" data-descartar onClick={() => setAbierto(false)}>Volver</Button>
          <Button type="submit" variant="danger" disabled={!motivo.trim()}>Confirmar cancelación</Button>
          <Button type="submit" value="reemplazar" disabled={!motivo.trim()}>Cancelar y preparar reemplazo</Button>
        </div>
      </FormularioConfirmado>
    </Dialog>
  </>;
}
