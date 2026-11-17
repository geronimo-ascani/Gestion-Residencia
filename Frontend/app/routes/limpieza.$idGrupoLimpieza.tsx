import { BackToList } from "../Components/ui/back-to-list";
import { rotacionMesAlumno } from "../lib/portal-alumno";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button, ButtonLink } from "../Components/ui/button";
import { ConfirmDialog } from "../Components/ui/confirm-dialog";
import { EmptyState } from "../Components/ui/empty-state";
import { PageHeader } from "../Components/ui/page-header";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "../Components/ui/table";
import { useToast } from "../Components/ui/toast";
import { asignacionActiva, semanaLimpieza, tareaLimpieza } from "../lib/domain";
import { useData } from "../lib/store";
export function meta() { return [{ title: "Detalle de grupo · Gestión de Residencia" }]; }
export default function GrupoLimpieza() {
  const { idGrupoLimpieza } = useParams();
  const { tareasLimpieza, grupoPorId, grupoAlumnos, alumnoPorId, asignaciones, habitacionPorId, eliminarGrupoLimpieza } = useData();
  const grupo = grupoPorId.get(idGrupoLimpieza ?? "");
  const [eliminar, setEliminar] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  if (!grupo) return <EmptyState icon="cleaning" title="Grupo no encontrado" description="No existe el grupo solicitado." action={<BackToList to="/limpieza" />} />;
  const miembros = grupoAlumnos.filter((a) => a.idGrupoLimpieza === grupo.idGrupoLimpieza).map((a) => alumnoPorId.get(a.idAlumno)).filter((a) => a !== undefined).sort((a,b) => a.apellido.localeCompare(b.apellido));
  const tarea = tareaLimpieza(grupo.tareaInicial, semanaLimpieza(), tareasLimpieza);
  return <div className="flex flex-col gap-6">
    <PageHeader eyebrow="Limpieza" title={grupo.nombreDelGrupo} description="Integrantes y tareas del grupo de limpieza." actions={<div className="flex flex-wrap gap-2"><BackToList to="/limpieza" /><ButtonLink to={`/limpieza/${grupo.idGrupoLimpieza}/editar`} variant="outline">Editar grupo</ButtonLink><Button variant="danger" onClick={() => setEliminar(true)}>Eliminar grupo</Button></div>} />

    <section className="space-y-4"><PageHeader title={`Integrantes (${miembros.length})`} description="Podés combinar habitaciones y trasladar alumnos desde otros grupos." actions={<ButtonLink to={`/limpieza/${grupo.idGrupoLimpieza}/alumnos`}>Modificar integrantes</ButtonLink>} />
      {!miembros.length ? <EmptyState icon="users" title="Sin integrantes" description="Agregá residentes por habitación o de forma individual para cubrir la tarea." /> : <TableWrap><Table><THead><TR><TH>Alumno</TH><TH>Habitación actual</TH><TH>Documento</TH></TR></THead><TBody>{miembros.map((a) => {
        const h = habitacionPorId.get(asignacionActiva(asignaciones, a.idAlumno)?.idHabitacion ?? "");
        return <TR key={a.idAlumno}><TD><Link className="font-medium text-brand-700 dark:text-brand-300" to={`/alumnos/${a.idAlumno}`}>{a.apellido}, {a.nombre}</Link></TD><TD>{h ? `Habitación ${h.numeroHabitacion}` : "Sin habitación"}</TD><TD>{a.documento}</TD></TR>;
      })}</TBody></Table></TableWrap>}
    </section>
    {tarea ? <section className="rounded-xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-800 dark:bg-brand-950"><p className="text-sm">Semana {semanaLimpieza()} · Tarea {tarea.numero}</p><h2 className="mt-1 text-xl font-semibold">{tarea.nombre}</h2><ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{tarea.tareas.map((t) => <li key={t}>{t}</li>)}</ul><p className="mt-4 text-sm">La tarea cambia cada siete días, desde el día 1. Al comenzar el mes se reinicia la rotación.</p></section> : <EmptyState icon="cleaning" title="Sin tarea configurada" description="Configurá las tareas rotativas para organizar la limpieza." />}
    <section className="space-y-3"><h2 className="text-lg font-semibold">Rotación mensual del grupo</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{rotacionMesAlumno(grupo.tareaInicial, tareasLimpieza).map((bloque) => <div key={bloque.semana} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"><p className="text-sm text-slate-500">Semana {bloque.semana} · días {Number(bloque.desde.slice(-2))}–{Number(bloque.hasta.slice(-2))}</p><p className="mt-2 font-medium">{bloque.tarea?.nombre ?? "Sin tarea configurada"}</p></div>)}</div></section>
    <ConfirmDialog open={eliminar} onClose={() => setEliminar(false)} title="Eliminar grupo" description="Sus integrantes quedarán sin grupo y se eliminará su historial de ambientes. Creá luego un reemplazo para volver a cubrir las cuatro tareas." confirmLabel="Eliminar grupo" onConfirm={() => { eliminarGrupoLimpieza(grupo.idGrupoLimpieza); toast({ title: "Grupo eliminado" }); navigate("/limpieza"); }} />
  </div>;
}
