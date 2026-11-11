import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Badge } from "../Components/ui/badge";
import { Button } from "../Components/ui/button";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { ListSummary, ListToolbar } from "../Components/ui/list-page";
import { PageHeader } from "../Components/ui/page-header";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "../Components/ui/table";
import { asignacionesAmbienteActivas } from "../lib/domain";
import { useData } from "../lib/store";
import { useDebouncedValue } from "../lib/use-debounced-value";

export function meta() {
  return [{ title: "Grupos de limpieza · Gestión de Residencia" }];
}

export default function Limpieza() {
  const { grupos, grupoAlumnos, grupoAmbientes, ambientes } = useData();
  const [busqueda, setBusqueda] = useState("");
  const busquedaDebounceada = useDebouncedValue(busqueda);

  const filas = useMemo(() => {
    const termino = busquedaDebounceada.trim().toLocaleLowerCase();
    const asignacionesActivas = asignacionesAmbienteActivas(grupoAmbientes);
    return grupos
      .map((grupo) => {
        const alumnos = grupoAlumnos.filter(
          (asignacion) => asignacion.idGrupoLimpieza === grupo.idGrupoLimpieza,
        ).length;
        const ambientesActivos = asignacionesActivas.filter(
          (asignacion) => asignacion.idGrupoLimpieza === grupo.idGrupoLimpieza,
        ).length;
        return { grupo, alumnos, ambientesActivos };
      })
      .filter(({ grupo }) =>
        [grupo.nombreDelGrupo, grupo.idGrupoLimpieza].some((dato) =>
          dato.toLocaleLowerCase().includes(termino),
        ),
      )
      .sort((a, b) => a.grupo.nombreDelGrupo.localeCompare(b.grupo.nombreDelGrupo));
  }, [busquedaDebounceada, grupoAlumnos, grupoAmbientes, grupos]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Residencia"
        title="Limpieza"
        description="Organizá los grupos y la distribución de los ambientes de limpieza."
        actions={
          <Link to="/limpieza/nueva">
            <Button>
              <Icon name="plus" className="h-4 w-4" />
              Crear grupo
            </Button>
          </Link>
        }
      />

      <ListSummary title="Resumen de limpieza" description="Organización de los grupos y ambientes de la residencia" icon="cleaning" items={[
        { label: "Grupos registrados", value: grupos.length },
        { label: "Alumnos en grupos", value: new Set(grupoAlumnos.map((a) => a.idAlumno)).size },
        { label: "Ambientes asignados", value: new Set(asignacionesAmbienteActivas(grupoAmbientes).map((a) => a.idAmbiente)).size },
        { label: "Ambientes sin asignar", value: ambientes.filter((ambiente) => !asignacionesAmbienteActivas(grupoAmbientes).some((a) => a.idAmbiente === ambiente.idAmbiente)).length },
      ]} />

      <ListToolbar title="Listado de grupos de limpieza" count={filas.length} search={busqueda} onSearch={setBusqueda} placeholder="Buscar por grupo…" searchLabel="Buscar grupos de limpieza" />

      <TableWrap>
        <Table>
          <THead>
            <TR>
              <TH>Grupo</TH>
              <TH>Alumnos</TH>
              <TH>Ambientes activos</TH>
              <TH className="text-right">Acciones</TH>
            </TR>
          </THead>
          <TBody>
            {filas.length === 0 ? (
              <TR>
                <TD colSpan={4}>
                  <EmptyState
                    icon="cleaning"
                    title={grupos.length ? "Sin resultados" : "Sin grupos"}
                    description={
                      grupos.length
                        ? "No hay grupos que coincidan con la búsqueda."
                        : "Todavía no se crearon grupos de limpieza."
                    }
                    action={
                      grupos.length ? undefined : (
                        <Link to="/limpieza/nueva">
                          <Button>
                            <Icon name="plus" className="h-4 w-4" />
                            Crear grupo
                          </Button>
                        </Link>
                      )
                    }
                  />
                </TD>
              </TR>
            ) : (
              filas.map(({ grupo, alumnos, ambientesActivos }) => (
                <TR key={grupo.idGrupoLimpieza}>
                  <TD>
                    <Link
                      to={`/limpieza/${grupo.idGrupoLimpieza}`}
                      className="font-medium text-brand-700 hover:underline dark:text-brand-300"
                    >
                      {grupo.nombreDelGrupo}
                    </Link>
                    <p className="text-xs text-slate-500">{grupo.idGrupoLimpieza}</p>
                  </TD>
                  <TD>
                    <Badge variant="neutral">{alumnos}</Badge>
                  </TD>
                  <TD>
                    <Badge variant={ambientesActivos ? "success" : "neutral"}>
                      {ambientesActivos}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    <Link to={`/limpieza/${grupo.idGrupoLimpieza}`}>
                      <Button size="sm" variant="outline">
                        Ver grupo
                        <Icon name="arrow" className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </TableWrap>
    </div>
  );
}