import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import { saldoCuota } from "../../lib/domain";
import { formatARS, formatMes } from "../../lib/format";
import { useData } from "../../lib/store";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { SelectField } from "../ui/select-field";
import { TextField } from "../ui/text-field";
import { useToast } from "../ui/toast";

export function RegistrarPagoDialog({
  open,
  onClose,
  idCuotaInicial,
}: {
  open: boolean;
  onClose: () => void;
  idCuotaInicial?: string;
}) {
  const { cuotas, alumnoPorId, registrarPagoCuota } = useData();
  const { toast } = useToast();
  const idBase = useId();
  const [idCuota, setIdCuota] = useState("");
  const [monto, setMonto] = useState("");
  const [error, setError] = useState<string | null>(null);

  const pendientes = cuotas
    .filter((cuota) => cuota.estado !== "pagada")
    .sort((a, b) => a.mesAsociado.localeCompare(b.mesAsociado));

  const seleccionada = pendientes.find((cuota) => cuota.idCuota === idCuota);

  useEffect(() => {
    if (!open) return;
    const cuota =
      pendientes.find((item) => item.idCuota === idCuotaInicial) ?? pendientes[0];
    setIdCuota(cuota?.idCuota ?? "");
    setMonto(cuota ? String(saldoCuota(cuota)) : "");
    setError(null);
    // El listado se recalcula en cada render; solo reaccionamos a la apertura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idCuotaInicial]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!seleccionada) {
      setError("Seleccioná una cuota para registrar el pago.");
      return;
    }

    const importe = Number(monto);
    const saldo = saldoCuota(seleccionada);

    if (!Number.isFinite(importe) || importe <= 0) {
      setError("Ingresá un monto mayor a cero.");
      return;
    }
    if (importe > saldo) {
      setError(`El monto no puede superar el saldo de ${formatARS(saldo)}.`);
      return;
    }

    registrarPagoCuota(seleccionada.idCuota, importe);

    const alumno = alumnoPorId.get(seleccionada.idAlumno);
    toast({
      title: "Pago registrado",
      description: `${alumno ? `${alumno.nombre} ${alumno.apellido}` : "Alumno"} · ${formatMes(seleccionada.mesAsociado)} · ${formatARS(importe)}`,
    });
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Registrar pago de cuota"
      description="El pago se imputa a la cuota seleccionada y actualiza su estado."
    >
      {pendientes.length === 0 ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
          No hay cuotas pendientes de pago.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <SelectField
            id={`${idBase}-cuota`}
            label="Cuota"
            value={idCuota}
            required
            onChange={(event) => {
              const id = event.target.value;
              setIdCuota(id);
              const cuota = pendientes.find((item) => item.idCuota === id);
              setMonto(cuota ? String(saldoCuota(cuota)) : "");
              setError(null);
            }}
          >
            {pendientes.map((cuota) => {
              const alumno = alumnoPorId.get(cuota.idAlumno);
              return (
                <option key={cuota.idCuota} value={cuota.idCuota}>
                  {alumno
                    ? `${alumno.apellido}, ${alumno.nombre}`
                    : cuota.idAlumno}{" "}
                  · {formatMes(cuota.mesAsociado)} · saldo{" "}
                  {formatARS(saldoCuota(cuota))}
                </option>
              );
            })}
          </SelectField>

          <TextField
            id={`${idBase}-monto`}
            label="Monto a registrar (ARS)"
            type="number"
            min={1}
            max={seleccionada ? saldoCuota(seleccionada) : undefined}
            step={1}
            value={monto}
            required
            error={error ?? undefined}
            hint={
              seleccionada
                ? `Saldo pendiente: ${formatARS(saldoCuota(seleccionada))}`
                : undefined
            }
            onChange={(event) => {
              setMonto(event.target.value);
              setError(null);
            }}
          />

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Registrar pago</Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
