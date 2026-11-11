import { useId, useState } from "react";
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
  return [{ title: "Editar grupo de limpieza · Gestión de Residencia" }];
}

export default function EditarGrupoLimpieza() {
  const { idGrupoLimpieza } = useParams();
  const { grupos, actualizarGrupoLimpieza } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const id = useId();
  const grupo = grupos.find((item) => item.idGrupoLimpieza === idGrupoLimpieza);
  const [nombre, setNombre] = useState(grupo?.nombreDelGrupo ?? "");
  const [error, setError] = useState("");

  if (!grupo) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow="Limpieza" title="Grupo no encontrado" />
        <EmptyState
          icon="cleaning"
          title="Sin resultados"
          description="Volvé al listado de grupos de limpieza."
          action={
            <Link to="/limpieza">
              <Button>Volver a grupos</Button>
            </Link>
          }
        />
      </div>
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!grupo) return;
    const nombreNormalizado = nombre.trim();
    if (!nombreNormalizado) {
      setError("Ingresá el nombre del grupo.");
      return;
    }
    if (
      grupos.some(
        (item) =>
          item.idGrupoLimpieza !== grupo.idGrupoLimpieza &&
          item.nombreDelGrupo.toLocaleLowerCase() ===
            nombreNormalizado.toLocaleLowerCase(),
      )
    ) {
      setError("Ya existe un grupo con ese nombre.");
      return;
    }

    actualizarGrupoLimpieza(grupo.idGrupoLimpieza, nombreNormalizado);
    toast({ title: "Grupo actualizado", description: nombreNormalizado });
    navigate(`/limpieza/${grupo.idGrupoLimpieza}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={`Limpieza · ${grupo.idGrupoLimpieza}`}
        title="Editar grupo"
        description="Actualizá el nombre del grupo de limpieza."
        actions={
          <Link to={`/limpieza/${grupo.idGrupoLimpieza}`}>
            <Button variant="outline">
              <Icon name="arrow" className="h-4 w-4 rotate-180" />
              Volver al grupo
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        <TextField
          id={`${id}-nombre`}
          label="Nombre del grupo"
          value={nombre}
          required
          error={error || undefined}
          onChange={(event) => {
            setNombre(event.target.value);
            setError("");
          }}
        />
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Link to={`/limpieza/${grupo.idGrupoLimpieza}`}>
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