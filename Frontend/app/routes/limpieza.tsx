import { useState } from "react";
import { Link } from "react-router";
import { Icon } from "../Components/ui/icons";
import { Button } from "../Components/ui/button";
import { EmptyState } from "../Components/ui/empty-state";
import { ListSummary, ListToolbar } from "../Components/ui/list-page";
import { PageHeader } from "../Components/ui/page-header";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "../Components/ui/table";
import { semanaLimpieza, tareaLimpieza, asignacionActiva } from "../lib/domain";
import { FECHA_REFERENCIA } from "../lib/config";
import { normalizar } from "../lib/format";
import { useData } from "../lib/store";
export function meta() { return [{ title: "Limpieza · Gestión de Residencia" }]; }
export default function Limpieza() {
  const { tareasLimpieza, grupos, grupoAlumnos, alumnos, asignaciones, habitacionPorId } = useData();
  const [busqueda, setBusqueda] = useState("");
  const semana = semanaLimpieza();
  const filas = grupos.filter((g) => normalizar(`${g.nombreDelGrupo} ${g.idGrupoLimpieza}`).includes(normalizar(busqueda))).sort((a, b) => a.tareaInicial - b.tareaInicial);
  return <div className="flex flex-col gap-6">
    <PageHeader eyebrow="Residencia" title="Limpieza" description="Cuatro grupos y una rotación semanal de las cuatro tareas principales. Asigná por habitación y ajustá cada integrante." actions={<Link to="/limpieza/nueva"><Button><Icon name="plus" className="h-4 w-4" />Crear grupo</Button></Link>} />
    <ListSummary title="Organización de limpieza" description={`Semana ${semana} del mes · ${FECHA_REFERENCIA.slice(0, 7)}`} icon="cleaning" items={[
      { label: "Grupos configurados", value: `${grupos.length} / 4` },
      { label: "Integrantes asignados", value: new Set(grupoAlumnos.map((a) => a.idAlumno)).size },
      { label: "Alumnos activos sin grupo", value: alumnos.filter((a) => a.estado === "activo" && !grupoAlumnos.some((g) => g.idAlumno === a.idAlumno)).length },
      { label: "Tareas rotativas", value: tareasLimpieza.filter((tarea) => tarea.enRotacion).length },
    ]} />
    {grupos.length < 4 && <p role="status" className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">Faltan {4 - grupos.length} grupo(s) para completar la organización de limpieza. Creá los grupos restantes para completar la rotación.</p>}
    <ListToolbar title="Grupos de limpieza" count={filas.length} search={busqueda} onSearch={setBusqueda} placeholder="Buscar por grupo…" searchLabel="Buscar grupos de limpieza" />
    <TableWrap><Table><THead><TR><TH>Grupo</TH><TH>Integrantes / habitaciones</TH><TH>Tarea de esta semana</TH><TH className="text-right">Acciones</TH></TR></THead><TBody>
      {!filas.length && <TR><TD colSpan={4}><EmptyState icon="cleaning" title={grupos.length ? "Sin resultados" : "Sin grupos"} description="No hay grupos para mostrar." /></TD></TR>}
      {filas.map((g) => {
        const ids = grupoAlumnos.filter((a) => a.idGrupoLimpieza === g.idGrupoLimpieza).map((a) => a.idAlumno);
        const habitaciones = [...new Set(ids.map((id) => habitacionPorId.get(asignacionActiva(asignaciones, id)?.idHabitacion ?? "")?.numeroHabitacion).filter(Boolean))];
        const tarea = tareaLimpieza(g.tareaInicial, semana, tareasLimpieza);
        return <TR key={g.idGrupoLimpieza}><TD><Link className="font-semibold text-brand-700 dark:text-brand-300" to={`/limpieza/${g.idGrupoLimpieza}`}>{g.nombreDelGrupo}</Link></TD><TD>{ids.length} integrantes<p className="text-xs text-slate-500">{habitaciones.length ? `Hab. ${habitaciones.join(", ")}` : "Sin habitación asignada"}</p></TD><TD>{tarea.numero}. {tarea.nombre}{!ids.length && <p className="text-xs text-amber-700 dark:text-amber-300">Sin integrantes para realizar la tarea</p>}</TD><TD className="text-right"><Link to={`/limpieza/${g.idGrupoLimpieza}`}><Button variant="outline" size="sm">Ver detalle<Icon name="arrow" className="h-3.5 w-3.5" /></Button></Link></TD></TR>;
      })}
    </TBody></Table></TableWrap>

    <section className="space-y-3" aria-label="Tareas de limpieza">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Tareas de limpieza</h2>
        <Link to="/limpieza/tareas/nueva"><Button><Icon name="plus" className="h-4 w-4" />Crear tarea</Button></Link>
      </div>
      <p className="text-sm text-slate-500">Las cuatro tareas principales rotan semanalmente. Las tareas nuevas se registran como adicionales y quedan fuera de la rotación.</p>
      <TableWrap>
        <Table>
          <caption className="sr-only">Tareas de limpieza y actividades a realizar</caption>
          <THead><TR><TH>Tarea</TH><TH>Número</TH><TH>Tipo</TH><TH>Actividades a realizar</TH><TH className="text-right">Acciones</TH></TR></THead>
          <TBody>
            {tareasLimpieza.map((tarea) => (
              <TR key={tarea.numero}>
                <TD className="min-w-48 align-top font-semibold">{tarea.nombre}</TD>
                <TD className="align-top">{tarea.numero}</TD>
                <TD className="align-top">{tarea.enRotacion ? "Rotativa" : "Adicional"}</TD>
                <TD><ul className="list-disc space-y-1 pl-5">{tarea.tareas.map((actividad) => <li key={actividad}>{actividad}</li>)}</ul></TD>
                <TD className="text-right align-top"><Link to={`/limpieza/tareas/${tarea.numero}`}><Button size="sm" variant="outline">Ver detalle<Icon name="arrow" className="h-3.5 w-3.5" /></Button></Link></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </TableWrap>
    </section>
    <section className="space-y-3"><h2 className="text-lg font-semibold">Rotación del mes</h2><p className="text-sm text-slate-500">Semana 1: días 1–7; semana 2: 8–14; semana 3: 15–21; semana 4: 22–28; semana 5: 29–31. Cada semana avanza una de las cuatro tareas principales; después de la cuarta vuelve a la primera. El ciclo se reinicia al comenzar cada mes.</p>
      <TableWrap><Table><THead><TR><TH>Grupo</TH>{[1,2,3,4,5].map((s) => <TH key={s}>Semana {s}{s === semana ? " · actual" : ""}</TH>)}</TR></THead><TBody>{grupos.map((g) => <TR key={g.idGrupoLimpieza}><TD>{g.nombreDelGrupo}</TD>{[1,2,3,4,5].map((s) => <TD key={s} className={s === semana ? "bg-brand-50 font-semibold dark:bg-brand-950" : ""}>{tareaLimpieza(g.tareaInicial, s, tareasLimpieza).nombre}</TD>)}</TR>)}</TBody></Table></TableWrap>
    </section>
  </div>;
}
