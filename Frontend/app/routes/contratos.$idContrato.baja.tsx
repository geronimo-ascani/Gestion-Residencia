import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "../Components/ui/button";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { TextField } from "../Components/ui/text-field";
import { useToast } from "../Components/ui/toast";
import { FECHA_REFERENCIA } from "../lib/config";
import { formatFecha } from "../lib/format";
import { useData } from "../lib/store";

export function meta() {
  return [{ title: "Registrar baja · Gestión de Residencia" }];
}

export default function BajaContrato() {
  const { idContrato } = useParams();
  const { contratos, alumnoPorId, cancelarContrato } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const idBase = useId();
  const contrato = contratos.find((item) => item.idContrato === idContrato);
  const alumno = contrato ? alumnoPorId.get(contrato.idAlumno) : undefined;
  const [fecha, setFecha] = useState(FECHA_REFERENCIA);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");

  if (
    !contrato ||
    contrato.fechaCancelacion ||
    contrato.fechaDesde > FECHA_REFERENCIA ||
    contrato.fechaHasta < FECHA_REFERENCIA
  ) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Contratos"
          title="Baja no disponible"
          description="El contrato no existe o no está vigente para registrar una baja."
        />
        <EmptyState
          icon="contracts"
          title="No se puede registrar la baja"
          description="Volvé a la ficha del alumno o al listado de contratos."
          action={
            <Link to="/contratos">
              <Button>
                <Icon name="arrow" className="h-4 w-4 rotate-180" />
                Volver a contratos
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !fecha ||
      fecha < contrato!.fechaDesde ||
      fecha > contrato!.fechaHasta ||
      fecha > FECHA_REFERENCIA ||
      !motivo.trim()
    ) {
      setError("Indicá un motivo y una fecha dentro del contrato, hasta hoy.");
      return;
    }

    cancelarContrato(contrato!.idContrato, fecha, motivo);
    toast({
      title: "Baja registrada",
      description: alumno
        ? `${alumno.apellido}, ${alumno.nombre} · ${formatFecha(fecha)}`
        : formatFecha(fecha),
    });
    navigate(`/contratos/${contrato!.idContrato}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={`Contratos · ${contrato.idContrato}`}
        title="Registrar baja"
        description={
          alumno
            ? `Contrato de ${alumno.apellido}, ${alumno.nombre}. La baja conserva el historial y libera su habitación.`
            : "La baja conserva el historial del contrato y libera la habitación."
        }
        actions={
          <Link to={`/contratos/${contrato.idContrato}`}>
            <Button variant="outline">
              <Icon name="arrow" className="h-4 w-4 rotate-180" />
              Volver al contrato
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id={`${idBase}-fecha`}
            label="Fecha efectiva de baja"
            type="date"
            required
            min={contrato.fechaDesde}
            max={FECHA_REFERENCIA}
            value={fecha}
            onChange={(event) => {
              setFecha(event.target.value);
              setError("");
            }}
          />
          <TextField
            id={`${idBase}-motivo`}
            label="Motivo de la baja"
            required
            value={motivo}
            error={error || undefined}
            onChange={(event) => {
              setMotivo(event.target.value);
              setError("");
            }}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Link to={`/contratos/${contrato.idContrato}`}>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" variant="danger">
            Registrar baja
          </Button>
        </div>
      </form>
    </div>
  );
}