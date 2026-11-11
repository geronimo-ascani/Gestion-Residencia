import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "../Components/ui/button";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { SelectField } from "../Components/ui/select-field";
import { TextField } from "../Components/ui/text-field";
import { useToast } from "../Components/ui/toast";
import { FECHA_REFERENCIA } from "../lib/config";
import { useData } from "../lib/store";

export function meta() {
  return [{ title: "Asignar ambiente · Grupos de limpieza" }];
}

export default function NuevoAmbienteGrupo() {
  const { idGrupoLimpieza } = useParams();
  const { grupos, ambientes, grupoAmbientes, asignarAmbienteGrupo } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const grupo = grupos.find((item) => item.idGrupoLimpieza === idGrupoLimpieza);
  const [idAmbiente, setIdAmbiente] = useState("");
  const [fechaDesde, setFechaDesde] = useState(FECHA_REFERENCIA);
  const [error, setError] = useState("");

  const ambientesDisponibles = useMemo(
    () =>
      ambientes.filter(
        (ambiente) =>
          !grupoAmbientes.some(
            (asignacion) =>
              asignacion.idAmbiente === ambiente.idAmbiente &&
              (asignacion.fechaHasta === null ||
                asignacion.fechaHasta > fechaDesde),
          ),
      ),
    [ambientes, fechaDesde, grupoAmbientes],
  );

  if (!grupo) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow="Limpieza" title="Grupo no encontrado" />
        <EmptyState
          icon="cleaning"
          title="Sin resultados"
          description="Volvé al listado de grupos de limpieza."
        />
      </div>
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!idAmbiente || !ambientesDisponibles.some((item) => item.idAmbiente === idAmbiente)) {
      setError("Seleccioná un ambiente disponible.");
      return;
    }
    if (!fechaDesde || fechaDesde < FECHA_REFERENCIA) {
      setError("La asignación no puede comenzar antes de hoy.");
      return;
    }
    if (!asignarAmbienteGrupo(grupo!.idGrupoLimpieza, idAmbiente, fechaDesde)) {
      setError("El ambiente ya está asignado en ese período.");
      return;
    }

    const ambiente = ambientes.find((item) => item.idAmbiente === idAmbiente);
    toast({
      title: "Ambiente asignado",
      description: `${ambiente?.ambiente ?? idAmbiente} · ${grupo!.nombreDelGrupo}`,
    });
    navigate(`/limpieza/${grupo!.idGrupoLimpieza}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={`Limpieza · ${grupo.idGrupoLimpieza}`}
        title="Asignar ambiente"
        description={`Elegí un ambiente libre para ${grupo.nombreDelGrupo}.`}
        actions={
          <Link to={`/limpieza/${grupo.idGrupoLimpieza}`}>
            <Button variant="outline">
              <Icon name="arrow" className="h-4 w-4 rotate-180" />
              Volver al grupo
            </Button>
          </Link>
        }
      />

      {ambientesDisponibles.length === 0 ? (
        <EmptyState
          icon="building"
          title="No hay ambientes disponibles"
          description="Todos los ambientes tienen una asignación que se superpone con esta fecha."
          action={
            <Link to={`/limpieza/${grupo.idGrupoLimpieza}`}>
              <Button variant="outline">Volver al grupo</Button>
            </Link>
          }
        />
      ) : (
        <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              id="ambiente"
              label="Ambiente"
              value={idAmbiente}
              required
              onChange={(event) => {
                setIdAmbiente(event.target.value);
                setError("");
              }}
            >
              <option value="">Seleccionar ambiente</option>
              {ambientesDisponibles.map((ambiente) => (
                <option key={ambiente.idAmbiente} value={ambiente.idAmbiente}>
                  {ambiente.ambiente} · {ambiente.tareas}
                </option>
              ))}
            </SelectField>
            <TextField
              id="fecha-desde"
              label="Fecha de inicio"
              type="date"
              min={FECHA_REFERENCIA}
              value={fechaDesde}
              required
              error={error || undefined}
              onChange={(event) => {
                setFechaDesde(event.target.value);
                setError("");
              }}
            />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            La asignación queda vigente hasta que se libere; el historial conserva las fechas.
          </p>
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <Link to={`/limpieza/${grupo.idGrupoLimpieza}`}>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit">
              <Icon name="check" className="h-4 w-4" />
              Asignar ambiente
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}