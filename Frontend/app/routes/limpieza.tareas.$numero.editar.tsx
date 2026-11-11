import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { EmptyState } from "../Components/ui/empty-state";
import type { TareaLimpieza } from "../lib/types";
import { Button } from "../Components/ui/button";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { TextField } from "../Components/ui/text-field";
import { useToast } from "../Components/ui/toast";
import { useData } from "../lib/store";

export function meta() {
  return [{ title: "Modificar tarea de limpieza · Gestión de Residencia" }];
}

export default function EditarTareaLimpieza() {
  const { numero } = useParams();
  const { tareasLimpieza } = useData();
  const tarea = tareasLimpieza.find((item) => String(item.numero) === numero);
  if (!tarea) return <EmptyState icon="cleaning" title="Tarea no encontrada" description="No existe la tarea solicitada." action={<Link to="/limpieza"><Button><Icon name="arrow" className="h-4 w-4 rotate-180" />Volver al listado</Button></Link>} />;
  return <FormularioEditarTarea key={tarea.numero} tarea={tarea} />;
}

function FormularioEditarTarea({ tarea }: { tarea: TareaLimpieza }) {
  const { actualizarTareaLimpieza } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const id = useId();
  const [nombre, setNombre] = useState(tarea.nombre);
  const [actividades, setActividades] = useState(tarea.tareas.join("\n"));
  const [error, setError] = useState("");

  function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      actualizarTareaLimpieza(tarea.numero, { nombre, tareas: actividades.trim().split(/\r?\n/) });
      toast({ title: "Tarea actualizada", description: nombre.trim() });
      navigate(`/limpieza/tareas/${tarea.numero}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo actualizar la tarea.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PageHeader
        eyebrow="Limpieza"
        title="Modificar tarea de limpieza"
        description="Actualizá el nombre y las actividades de esta tarea."
        actions={<Link to={`/limpieza/tareas/${tarea.numero}`}><Button variant="outline"><Icon name="arrow" className="h-4 w-4 rotate-180" />Volver al detalle</Button></Link>}
      />
      <form onSubmit={guardar} className="w-full space-y-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <TextField id={`${id}-nombre`} label="Nombre de la tarea" required maxLength={150} value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Ej.: Limpiar el lavadero" />
        <div className="space-y-2">
          <label htmlFor={`${id}-actividades`} className="block text-sm font-medium">Actividades a realizar *</label>
          <p id={`${id}-ayuda`} className="text-sm text-slate-500">Escribí una actividad por renglón.</p>
          <textarea id={`${id}-actividades`} required rows={6} maxLength={4000} aria-describedby={`${id}-ayuda`} value={actividades} onChange={(event) => setActividades(event.target.value)} placeholder="Limpiar el lavarropas\nLimpiar el piso" className="w-full resize-y rounded-md border border-slate-400 bg-slate-100/80 px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
        </div>
        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Link to={`/limpieza/tareas/${tarea.numero}`}><Button type="button" variant="outline">Cancelar</Button></Link>
          <Button type="submit"><Icon name="check" className="h-4 w-4" />Guardar cambios</Button>
        </div>
      </form>
    </div>
  );
}
