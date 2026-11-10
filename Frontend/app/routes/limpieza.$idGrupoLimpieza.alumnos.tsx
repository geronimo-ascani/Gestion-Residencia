import { useEffect, useId, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "../Components/ui/button";
import { Checkbox } from "../Components/ui/checkbox";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { InputField } from "../Components/ui/input";
import { PageHeader } from "../Components/ui/page-header";
import { useToast } from "../Components/ui/toast";
import { normalizar } from "../lib/format";
import { useData } from "../lib/store";
import { useDebouncedValue } from "../lib/use-debounced-value";

export function meta() {
  return [{ title: "Alumnos del grupo · Gestión de Residencia" }];
}

export default function AlumnosGrupoLimpieza() {
  const { idGrupoLimpieza } = useParams();
  const { grupos, alumnos, grupoAlumnos, guardarAlumnosGrupo } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const idBase = useId();
  const grupo = grupos.find((item) => item.idGrupoLimpieza === idGrupoLimpieza);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const busquedaDebounceada = useDebouncedValue(busqueda);

  useEffect(() => {
    setSeleccionados(
      new Set(
        grupoAlumnos
          .filter((item) => item.idGrupoLimpieza === idGrupoLimpieza)
          .map((item) => item.idAlumno),
      ),
    );
  }, [grupoAlumnos, idGrupoLimpieza]);

  const alumnosFiltrados = useMemo(() => {
    const termino = normalizar(busquedaDebounceada);
    return alumnos
      .filter((alumno) =>
        !termino ||
        normalizar(
          `${alumno.nombre} ${alumno.apellido} ${alumno.documento} ${alumno.correo}`,
        ).includes(termino),
      )
      .sort((a, b) => a.apellido.localeCompare(b.apellido));
  }, [alumnos, busquedaDebounceada]);

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
    guardarAlumnosGrupo(grupo!.idGrupoLimpieza, [...seleccionados]);
    toast({
      title: "Integrantes actualizados",
      description: `${seleccionados.size} alumnos en ${grupo!.nombreDelGrupo}.`,
    });
    navigate(`/limpieza/${grupo!.idGrupoLimpieza}`);
  }

  function alternarAlumno(idAlumno: string, seleccionado: boolean) {
    setSeleccionados((actuales) => {
      const nuevos = new Set(actuales);
      if (seleccionado) nuevos.add(idAlumno);
      else nuevos.delete(idAlumno);
      return nuevos;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={`Limpieza · ${grupo.idGrupoLimpieza}`}
        title={`Integrantes · ${grupo.nombreDelGrupo}`}
        description={`${seleccionados.size} alumnos seleccionados. Un alumno puede pertenecer a más de un grupo.`}
        actions={
          <Link to={`/limpieza/${grupo.idGrupoLimpieza}`}>
            <Button variant="outline">
              <Icon name="arrow" className="h-4 w-4 rotate-180" />
              Volver al grupo
            </Button>
          </Link>
        }
      />

      <div className="relative w-full sm:max-w-sm">
        <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <InputField
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar alumno..."
          aria-label="Buscar alumnos"
          className="pl-9"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {alumnosFiltrados.length === 0 ? (
          <EmptyState
            icon="users"
            title={alumnos.length ? "Sin resultados" : "Sin alumnos"}
            description="No hay alumnos que coincidan con la búsqueda."
          />
        ) : (
          <div className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {alumnosFiltrados.map((alumno) => (
              <div
                key={alumno.idAlumno}
                className="flex items-center justify-between gap-4 py-3"
              >
                <Checkbox
                  id={`${idBase}-${alumno.idAlumno}`}
                  checked={seleccionados.has(alumno.idAlumno)}
                  onChange={(event) =>
                    alternarAlumno(alumno.idAlumno, event.target.checked)
                  }
                  label={
                    <span className="flex flex-col">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {alumno.apellido}, {alumno.nombre}
                      </span>
                      <span className="text-xs text-slate-500">
                        DNI {alumno.documento} · {alumno.correo}
                      </span>
                    </span>
                  }
                />
                <span className="text-xs text-slate-500">
                  {alumno.estado === "activo" ? "Activo" : "Inactivo"}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Link to={`/limpieza/${grupo.idGrupoLimpieza}`}>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit">
            <Icon name="check" className="h-4 w-4" />
            Guardar integrantes
          </Button>
        </div>
      </form>
    </div>
  );
}