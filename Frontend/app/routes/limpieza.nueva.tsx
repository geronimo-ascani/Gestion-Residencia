import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { LimpiezaIntegrantes } from "../Components/limpieza-integrantes";
import { Icon } from "../Components/ui/icons";
import { Button } from "../Components/ui/button";
import { PageHeader } from "../Components/ui/page-header";
import { TextField } from "../Components/ui/text-field";
import { SelectField } from "../Components/ui/select-field";
import { useToast } from "../Components/ui/toast";
import { useData } from "../lib/store";

export function meta() { return [{ title: "Crear grupo de limpieza · Gestión de Residencia" }]; }
export default function NuevoGrupoLimpieza() {
  const { tareasLimpieza, grupos, crearGrupoLimpieza } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const id = useId();
  const [nombre, setNombre] = useState("");
  const [tarea, setTarea] = useState("");
  const [integrantes, setIntegrantes] = useState<string[]>([]);
  const [error, setError] = useState("");
  function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const nuevo = crearGrupoLimpieza({ nombreDelGrupo: nombre, tareaInicial: Number(tarea), idAlumnos: integrantes });
      toast({ title: "Grupo creado", description: nombre.trim() });
      navigate(`/limpieza/${nuevo}`);
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo crear el grupo."); }
  }
  return <div className="flex flex-col gap-6">
    <PageHeader eyebrow="Limpieza" title="Crear grupo" description="Completá los datos, la tarea inicial y los integrantes del grupo." actions={<Link to="/limpieza"><Button variant="outline"><Icon name="arrow" className="h-4 w-4 rotate-180" />Volver al listado</Button></Link>} />
    {grupos.length >= 4 && <p role="status" className="rounded-lg bg-amber-50 p-4 text-amber-900 dark:bg-amber-950 dark:text-amber-200">Ya están configurados los cuatro grupos. Podés modificar sus integrantes desde el detalle. Para reemplazar un grupo, eliminá primero el anterior.</p>}
    <form onSubmit={guardar} className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <fieldset disabled={grupos.length >= 4} className="space-y-6 disabled:opacity-60">
        <legend className="mb-4 text-lg font-semibold">Datos del grupo</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id={`${id}-nombre`} label="Nombre del grupo" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <SelectField id={`${id}-tarea`} label="Tarea de la primera semana del mes" required value={tarea} onChange={(e) => setTarea(e.target.value)} hint="Cada semana avanza una tarea y vuelve a la primera después de la cuarta.">
            <option value="">Seleccioná una tarea disponible</option>
            {tareasLimpieza.filter((t) => t.enRotacion).map((t) => <option key={t.numero} value={t.numero} disabled={grupos.some((g) => g.tareaInicial === t.numero)}>{t.numero}. {t.nombre}</option>)}
          </SelectField>
        </div>
        <LimpiezaIntegrantes seleccionados={integrantes} onChange={setIntegrantes} />
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800"><Link to="/limpieza"><Button type="button" variant="outline">Cancelar</Button></Link><Button type="submit" disabled={grupos.length >= 4}><Icon name="plus" className="h-4 w-4" />Crear grupo</Button></div>
    </form>
  </div>;
}
