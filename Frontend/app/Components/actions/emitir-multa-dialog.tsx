import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import { FECHA_REFERENCIA } from "../../lib/config";
import { formatARS } from "../../lib/format";
import { useData } from "../../lib/store";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { SelectField } from "../ui/select-field";
import { TextField } from "../ui/text-field";
import { useToast } from "../ui/toast";

export function EmitirMultaDialog({
  open,
  onClose,
  idAlumnoInicial,
}: {
  open: boolean;
  onClose: () => void;
  idAlumnoInicial?: string;
}) {
  const { alumnos, alumnoPorId, emitirMulta } = useData();
  const { toast } = useToast();
  const idBase = useId();
  const [idAlumno, setIdAlumno] = useState("");
  const [monto, setMonto] = useState("");
  const [fechaVence, setFechaVence] = useState("2026-11-19");
  const [error, setError] = useState<string | null>(null);

  const alumnosOrdenados = [...alumnos].sort((a, b) =>
    a.apellido.localeCompare(b.apellido),
  );

  useEffect(() => {
    if (!open) return;
    setIdAlumno(idAlumnoInicial ?? alumnosOrdenados[0]?.idAlumno ?? "");
    setMonto("");
    setFechaVence("2026-11-19");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idAlumnoInicial]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const importe = Number(monto);

    if (!idAlumno) {
      setError("Seleccioná un alumno.");
      return;
    }
    if (!Number.isFinite(importe) || importe <= 0) {
      setError("Ingresá un monto mayor a cero.");
      return;
    }
    if (!fechaVence || fechaVence < FECHA_REFERENCIA) {
      setError("La fecha de vencimiento no puede ser anterior a hoy.");
      return;
    }

    emitirMulta({ idAlumno, monto: importe, fechaVence });
    const alumno = alumnoPorId.get(idAlumno);
    toast({
      title: "Multa emitida",
      description: `${alumno ? `${alumno.nombre} ${alumno.apellido}` : "Alumno"} · ${formatARS(importe)}`,
    });
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Emitir multa"
      description="La multa queda pendiente hasta que se registre su pago."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField
          id={`${idBase}-alumno`}
          label="Alumno"
          value={idAlumno}
          required
          disabled={Boolean(idAlumnoInicial)}
          onChange={(event) => {
            setIdAlumno(event.target.value);
            setError(null);
          }}
        >
          {alumnosOrdenados.map((alumno) => (
            <option key={alumno.idAlumno} value={alumno.idAlumno}>
              {alumno.apellido}, {alumno.nombre}
            </option>
          ))}
        </SelectField>

        <TextField
          id={`${idBase}-monto`}
          label="Monto (ARS)"
          type="number"
          min={1}
          step={1}
          value={monto}
          required
          onChange={(event) => {
            setMonto(event.target.value);
            setError(null);
          }}
        />

        <TextField
          id={`${idBase}-vence`}
          label="Fecha de vencimiento"
          type="date"
          min={FECHA_REFERENCIA}
          value={fechaVence}
          required
          error={error ?? undefined}
          onChange={(event) => {
            setFechaVence(event.target.value);
            setError(null);
          }}
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Emitir multa</Button>
        </div>
      </form>
    </Dialog>
  );
}
