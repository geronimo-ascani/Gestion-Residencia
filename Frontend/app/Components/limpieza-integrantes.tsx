import { useId, useState } from "react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { TextField } from "./ui/text-field";
import { asignacionActiva, asignacionesActivas } from "../lib/domain";
import { normalizar } from "../lib/format";
import { useData } from "../lib/store";

export function LimpiezaIntegrantes({ seleccionados, onChange, idGrupo }: {
  seleccionados: string[]; onChange: (ids: string[]) => void; idGrupo?: string;
}) {
  const { alumnos, habitaciones, asignaciones, grupoAlumnos, grupoPorId } = useData();
  const id = useId();
  const [busqueda, setBusqueda] = useState("");
  const activos = alumnos.filter((a) => a.estado === "activo");
  const filtrados = activos.filter((a) => {
          const h = habitaciones.find((h) => h.idHabitacion === asignacionActiva(asignaciones, a.idAlumno)?.idHabitacion);
          return normalizar(`${a.nombre} ${a.apellido} ${a.documento} ${h ? `Habitación ${h.numeroHabitacion}` : "Sin habitación"}`).includes(normalizar(busqueda));
        });
  const trasladados = seleccionados.filter((idAlumno) => grupoAlumnos.some((g) => g.idAlumno === idAlumno && g.idGrupoLimpieza !== idGrupo));
  function alternar(ids: string[], agregar: boolean) {
    onChange(agregar ? [...new Set([...seleccionados, ...ids])] : seleccionados.filter((a) => !ids.includes(a)));
  }
  return <div className="space-y-5">
    <fieldset className="space-y-3">
      <legend className="font-semibold text-slate-900 dark:text-white">Asignar por habitación</legend>
      <p className="text-sm text-slate-500">Sumá los residentes de una o varias habitaciones y ajustá los integrantes debajo. La selección corresponde a los residentes actuales.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {habitaciones.map((h) => {
          const ids = asignacionesActivas(asignaciones).filter((a) => a.idHabitacion === h.idHabitacion && activos.some((al) => al.idAlumno === a.idAlumno)).map((a) => a.idAlumno);
          const cantidad = ids.filter((a) => seleccionados.includes(a)).length;
          return <div key={h.idHabitacion} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <p className="font-medium">Habitación {h.numeroHabitacion}</p>
            <p className="my-2 text-sm text-slate-500">{cantidad} de {ids.length} residentes seleccionados</p>
            <Button type="button" size="sm" variant="outline" disabled={!ids.length} onClick={() => alternar(ids, cantidad !== ids.length)}>{cantidad === ids.length && ids.length ? "Quitar residentes" : "Agregar residentes"}</Button>
          </div>;
        })}
      </div>
    </fieldset>
    <TextField id={`${id}-buscar`} label="Buscar integrantes" placeholder="Nombre, apellido, DNI o habitación" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
    <fieldset>
      <legend className="mb-3 font-semibold">Integrantes · {seleccionados.length} seleccionados</legend>
      <div className="max-h-96 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
        {!filtrados.length && <p className="py-4 text-sm text-slate-500">No hay alumnos que coincidan con la búsqueda.</p>}
        {filtrados.map((a) => {
          const h = habitaciones.find((h) => h.idHabitacion === asignacionActiva(asignaciones, a.idAlumno)?.idHabitacion);
          const actual = grupoPorId.get(grupoAlumnos.find((g) => g.idAlumno === a.idAlumno)?.idGrupoLimpieza ?? "");
          return <div className="py-3" key={a.idAlumno}><Checkbox id={`${id}-${a.idAlumno}`} checked={seleccionados.includes(a.idAlumno)} onChange={(e) => alternar([a.idAlumno], e.target.checked)} label={<span><span className="block font-medium">{a.apellido}, {a.nombre}</span><span className="text-xs text-slate-500">DNI {a.documento} · {h ? `Habitación ${h.numeroHabitacion}` : "Sin habitación"} · {actual?.nombreDelGrupo ?? "Sin grupo"}</span></span>} /></div>;
        })}
      </div>
    </fieldset>
    {trasladados.length > 0 && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">Al guardar, {trasladados.length} integrante(s) se trasladarán desde su grupo actual. Cada alumno pertenece a un solo grupo.</p>}
  </div>;
}
