import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "../Components/ui/button";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { TextField } from "../Components/ui/text-field";
import { useToast } from "../Components/ui/toast";
import { useData } from "../lib/store";

export function meta() {
  return [{ title: "Editar multa · Gestión de Residencia" }];
}

export default function EditarMulta() {
  const { idMulta } = useParams();
  const { multas, actualizarMulta, alumnoPorId } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const idBase = useId();
  const multa = multas.find((item) => item.idMulta === idMulta);
  const [monto, setMonto] = useState(multa?.monto.toString() ?? "");
  const [fechaVence, setFechaVence] = useState(multa?.fechaVence ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    setMonto(multa?.monto.toString() ?? "");
    setFechaVence(multa?.fechaVence ?? "");
    setError("");
  }, [multa?.idMulta, multa?.monto, multa?.fechaVence]);

  if (!multa || multa.estado !== "pendiente") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Multas"
          title={multa ? "Edición no disponible" : "Multa no encontrada"}
          description={
            multa
              ? "Solo se pueden editar multas pendientes."
              : "No existe una multa con el identificador solicitado."
          }
        />
        <EmptyState
          icon="fines"
          title="No se puede editar"
          description="Volvé al listado de multas para continuar."
          action={
            <Link to="/multas">
              <Button>
                <Icon name="arrow" className="h-4 w-4 rotate-180" />
                Volver a multas
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const importe = Number(monto);
    if (!Number.isFinite(importe) || importe <= 0) {
      setError("Ingresá un monto mayor a cero.");
      return;
    }
    if (!fechaVence || fechaVence < multa!.fechaEmision) {
      setError("El vencimiento debe ser igual o posterior a la emisión.");
      return;
    }

    actualizarMulta({ idMulta: multa!.idMulta, monto: importe, fechaVence });
    toast({
      title: "Multa actualizada",
      description: alumnoPorId.has(multa!.idAlumno)
        ? `${alumnoPorId.get(multa!.idAlumno)?.apellido}, ${alumnoPorId.get(multa!.idAlumno)?.nombre}`
        : multa!.idMulta,
    });
    navigate(`/multas/${multa!.idMulta}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={`Multas · ${multa.idMulta}`}
        title="Editar multa"
        description="Solo se pueden modificar multas que siguen pendientes."
        actions={
          <Link to={`/multas/${multa.idMulta}`}>
            <Button variant="outline">
              <Icon name="arrow" className="h-4 w-4 rotate-180" />
              Volver al detalle
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id={`${idBase}-monto`}
            label="Monto (ARS)"
            type="number"
            min={1}
            step={1}
            value={monto}
            required
            error={error || undefined}
            onChange={(event) => {
              setMonto(event.target.value);
              setError("");
            }}
          />
          <TextField
            id={`${idBase}-vence`}
            label="Fecha de vencimiento"
            type="date"
            min={multa.fechaEmision}
            value={fechaVence}
            required
            onChange={(event) => {
              setFechaVence(event.target.value);
              setError("");
            }}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Link to={`/multas/${multa.idMulta}`}>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit">
            <Icon name="check" className="h-4 w-4" />
            Guardar cambios
          </Button>
        </div>
      </form>
    </div>
  );
}