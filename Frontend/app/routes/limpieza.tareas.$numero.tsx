import { Link, useParams } from "react-router";
import { Button } from "../Components/ui/button";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "../Components/ui/table";
import { useData } from "../lib/store";

export function meta() {
  return [{ title: "Detalle de tarea · Gestión de Residencia" }];
}

export default function DetalleTareaLimpieza() {
  const { numero } = useParams();
  const { tareasLimpieza } = useData();
  const tarea = tareasLimpieza.find((item) => String(item.numero) === numero);
  if (!tarea) return <EmptyState icon="cleaning" title="Tarea no encontrada" description="No existe la tarea solicitada." action={<Link to="/limpieza"><Button><Icon name="arrow" className="h-4 w-4 rotate-180" />Volver al listado</Button></Link>} />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={`Limpieza · Tarea ${tarea.numero}`}
        title={tarea.nombre}
        description={tarea.enRotacion ? "Tarea principal de la rotación semanal." : "Tarea adicional fuera de la rotación semanal."}
        actions={<div className="flex flex-wrap gap-2">
          <Link to="/limpieza"><Button variant="outline"><Icon name="arrow" className="h-4 w-4 rotate-180" />Volver al listado</Button></Link>
          <Link to={`/limpieza/tareas/${tarea.numero}/editar`}><Button><Icon name="settings" className="h-4 w-4" />Modificar tarea</Button></Link>
        </div>}
      />
      <section className="space-y-3" aria-labelledby="actividades-tarea">
        <div className="flex items-center justify-between gap-3">
          <h2 id="actividades-tarea" className="text-lg font-semibold text-slate-900 dark:text-white">Actividades a realizar</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">{tarea.tareas.length} actividades</span>
        </div>
        <TableWrap className="dark:border-slate-700 dark:bg-slate-900">
          <Table>
            <caption className="sr-only">Actividades de {tarea.nombre}</caption>
            <THead>
              <TR>
                <TH className="py-3">Actividad</TH>
                <TH className="w-24 py-3 text-center">Orden</TH>
              </TR>
            </THead>
            <TBody>
              {tarea.tareas.map((actividad, indice) => (
                <TR key={actividad}>
                  <TD className="py-4 font-medium text-slate-700 dark:text-slate-200">{actividad}</TD>
                  <TD className="text-center">
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-brand-50 px-2 text-xs font-semibold tabular-nums text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">{String(indice + 1).padStart(2, "0")}</span>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      </section>
    </div>
  );
}
