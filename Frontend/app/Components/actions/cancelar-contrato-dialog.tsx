import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import { FECHA_REFERENCIA } from "../../lib/config";
import { useData } from "../../lib/store";
import type { Contrato } from "../../lib/types";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { TextField } from "../ui/text-field";
import { useToast } from "../ui/toast";

export function CancelarContratoDialog({ contrato, onClose }: { contrato: Contrato | null; onClose: () => void }) {
  const { cancelarContrato } = useData();
  const { toast } = useToast();
  const id = useId();
  const [fecha, setFecha] = useState(FECHA_REFERENCIA);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { setFecha(FECHA_REFERENCIA); setMotivo(""); setError(""); }, [contrato]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contrato) return;
    if (!fecha || fecha < contrato.fechaDesde || fecha > contrato.fechaHasta || fecha > FECHA_REFERENCIA || !motivo.trim()) {
      setError("Indicá un motivo y una fecha dentro del contrato, hasta la fecha de referencia.");
      return;
    }
    cancelarContrato(contrato.idContrato, fecha, motivo);
    toast({ title: "Baja registrada", description: "El contrato se conserva en la ficha con su fecha y motivo de cancelación." });
    onClose();
  }
  return <Dialog open={Boolean(contrato)} onClose={onClose} title="Registrar baja del contrato" description="Desde la fecha de baja el alumno deja de residir. Se cierra su asignación de habitación y se conserva el contrato original.">
    <form onSubmit={submit} className="space-y-4">
      <TextField id={`${id}-fecha`} label="Fecha efectiva de baja" type="date" required min={contrato?.fechaDesde} max={FECHA_REFERENCIA} value={fecha} onChange={(e) => setFecha(e.target.value)} />
      <TextField id={`${id}-motivo`} label="Motivo de la baja" required value={motivo} onChange={(e) => setMotivo(e.target.value)} error={error || undefined} />
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Volver</Button><Button type="submit" variant="danger">Registrar baja</Button></div>
    </form>
  </Dialog>;
}
