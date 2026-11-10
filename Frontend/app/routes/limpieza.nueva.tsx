import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../Components/ui/button";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { TextField } from "../Components/ui/text-field";
import { useToast } from "../Components/ui/toast";
import { useData } from "../lib/store";

export function meta() {
  return [{ title: "Crear grupo de limpieza · Gestión de Residencia" }];
}

export default function NuevoGrupoLimpieza() {
  const { grupos, crearGrupoLimpieza } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const id = useId();
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nombreNormalizado = nombre.trim();
    if (!nombreNormalizado) {
      setError("Ingresá el nombre del grupo.");
      return;
    }
    if (
      grupos.some(
        (grupo) =>
          grupo.nombreDelGrupo.toLocaleLowerCase() ===
          nombreNormalizado.toLocaleLowerCase(),
      )
    ) {
      setError("Ya existe un grupo con ese nombre.");
      return;
    }

    const idGrupoLimpieza = crearGrupoLimpieza({
      nombreDelGrupo: nombreNormalizado,
    });
    toast({
      title: "Grupo creado",
      description: nombreNormalizado,
    });
    navigate(`/limpieza/${idGrupoLimpieza}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Limpieza"
        title="Crear grupo"
        description="Después podrás asignarle alumnos y ambientes."
        actions={
          <Link to="/limpieza">
            <Button variant="outline">
              <Icon name="arrow" className="h-4 w-4 rotate-180" />
              Volver a grupos
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
          <Link to="/limpieza">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit">
            <Icon name="plus" className="h-4 w-4" />
            Crear grupo
          </Button>
        </div>
      </form>
    </div>
  );
}