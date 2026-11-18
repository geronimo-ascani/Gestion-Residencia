import { FormularioConfirmado } from "./ui/formulario-confirmado";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import { useData } from "../lib/store";
import type { CatalogoAlumno, OpcionCatalogo } from "../lib/types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { TextField } from "./ui/text-field";
import { useToast } from "./ui/toast";

export function CatalogoAlumnos({ catalogo, titulo }: { catalogo: CatalogoAlumno; titulo: string }) {
  const data = useData();
  const { toast } = useToast();
  const id = useId();
  const [editando, setEditando] = useState<OpcionCatalogo | null>(null);
  const [baja, setBaja] = useState<OpcionCatalogo | null>(null);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");

  function limpiar() {
    setEditando(null);
    setNombre("");
    setError("");
  }

  function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      data.guardarOpcionCatalogo(catalogo, { id: editando?.id, nombre, activa: editando?.activa ?? true });
      toast({ title: editando ? "Opción actualizada" : "Opción agregada" });
      limpiar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la opción.");
    }
  }

  function cambiarEstado(opcion: OpcionCatalogo, activa: boolean) {
    try {
      data.guardarOpcionCatalogo(catalogo, { ...opcion, activa });
      if (editando?.id === opcion.id) limpiar();
      toast({ title: activa ? "Opción reactivada" : "Opción dada de baja" });
    } catch (err) {
      toast({ title: "No se pudo cambiar el estado", description: err instanceof Error ? err.message : undefined, variant: "error" });
    }
  }

  return <Card>
    <CardHeader><CardTitle>{titulo}</CardTitle></CardHeader>
    <CardContent className="space-y-5">
      {data[catalogo].length ? <ul className="divide-y divide-slate-200 dark:divide-slate-800">
        {data[catalogo].map((opcion) => <li key={opcion.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <span className="flex items-center gap-2">{opcion.nombre}{!opcion.activa ? <Badge>De baja</Badge> : null}</span>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" aria-label={`Modificar ${opcion.nombre}`} onClick={() => {
              setEditando(opcion);
              setNombre(opcion.nombre);
              setError("");
              document.getElementById(id)?.focus();
            }}>Modificar</Button>
            {opcion.activa ? <Button size="sm" variant="outline" aria-label={`Dar de baja ${opcion.nombre}`} onClick={() => setBaja(opcion)}>Dar de baja</Button>
              : <Button size="sm" variant="outline" aria-label={`Reactivar ${opcion.nombre}`} onClick={() => cambiarEstado(opcion, true)}>Reactivar</Button>}
          </div>
        </li>)}
      </ul> : <p className="text-sm text-slate-500">El catálogo todavía está vacío.</p>}
      <FormularioConfirmado cambios={nombre !== (editando?.nombre ?? "")} onSubmit={guardar} className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
        <TextField id={id} label={editando ? `Modificar ${editando.nombre}` : "Nombre de la nueva opción"} value={nombre} required onChange={(e) => { setNombre(e.target.value); setError(""); }} />
        {error ? <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit">{editando ? "Guardar cambios" : catalogo === "carreras" ? "Agregar carrera" : "Agregar vínculo"}</Button>
          {editando ? <Button variant="outline" data-descartar onClick={limpiar}>Cancelar edición</Button> : null}
        </div>
      </FormularioConfirmado>
    </CardContent>
    <ConfirmDialog open={baja !== null} onClose={() => setBaja(null)} title="Dar de baja"
      description={`${baja?.nombre ?? ""} dejará de aparecer como opción en nuevas fichas. Las fichas que ya la usan conservarán ese dato.`}
      confirmLabel="Dar de baja" onConfirm={() => { if (baja) cambiarEstado(baja, false); }} />
  </Card>;
}
