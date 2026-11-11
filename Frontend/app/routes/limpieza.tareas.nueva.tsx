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
  return [{ title: "Crear tarea de limpieza · Gestión de Residencia" }];
}

export default function NuevaTareaLimpieza() {
  const { crearTareaLimpieza } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const id = useId();
  const [nombre, setNombre] = useState("");
  const [actividades, setActividades] = useState("");
  const [error, setError] = useState("");

  function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      crearTareaLimpieza({ nombre, tareas: actividades.trim().split(/\r?\n/) });
      toast({ title: "Tarea creada", description: nombre.trim() });
      navigate("/limpieza");
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo crear la tarea.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Limpieza"
        title="Crear tarea de limpieza"
        description="Registrá una tarea adicional con sus actividades. Quedará fuera de la rotación semanal de los grupos."
        actions={<Link to="/limpieza"><Button variant="outline"><Icon name="arrow" className="h-4 w-4 rotate-180" />Volver al listado</Button></Link>}
      />
      <form onSubmit={guardar} className="max-w-2xl space-y-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <TextField id={`${id}-nombre`} label="Nombre de la tarea" required maxLength={150} value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Ej.: Limpiar el lavadero" />
        <div className="space-y-2">
          <label htmlFor={`${id}-actividades`} className="block text-sm font-medium">Actividades a realizar *</label>
          <p id={`${id}-ayuda`} className="text-sm text-slate-500">Escribí una actividad por renglón.</p>
          <textarea id={`${id}-actividades`} required rows={6} maxLength={4000} aria-describedby={`${id}-ayuda`} value={actividades} onChange={(event) => setActividades(event.target.value)} placeholder="Limpiar el lavarropas\nLimpiar el piso" className="w-full resize-y rounded-md border border-slate-400 bg-slate-100/80 px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
        </div>
        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Link to="/limpieza"><Button type="button" variant="outline">Cancelar</Button></Link>
          <Button type="submit"><Icon name="plus" className="h-4 w-4" />Crear tarea</Button>
        </div>
      </form>
    </div>
  );
}
