import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../Components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Components/ui/card";
import { FormErrorSummary } from "../Components/ui/form-error-summary";
import { PageHeader } from "../Components/ui/page-header";
import { SelectField } from "../Components/ui/select-field";
import { TextField } from "../Components/ui/text-field";
import { useToast } from "../Components/ui/toast";
import { validarNuevoAmbiente } from "../lib/ambientes";
import { useData } from "../lib/store";
import { TIPOS_AMBIENTE } from "../lib/types";

export function meta() {
  return [{ title: "Nuevo ambiente · Gestión de Residencia" }];
}

export default function NuevoAmbiente() {
  const { ambientes, crearAmbiente } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const idBase = useId();
  const secuencia = useRef(0);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [objetos, setObjetos] = useState<{ id: number; nombre: string; cantidad: string }[]>([]);
  const [errores, setErrores] = useState<Record<string, string>>({});

  function actualizarObjeto(id: number, campo: "nombre" | "cantidad", valor: string) {
    setObjetos((previos) => previos.map((objeto) => objeto.id === id ? { ...objeto, [campo]: valor } : objeto));
    setErrores({});
  }

  function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = {
      ambiente: nombre, tipo, ubicacion, descripcion,
      equipamiento: objetos.map((objeto) => ({ nombre: objeto.nombre, cantidad: Number(objeto.cantidad) })),
    };
    const nuevosErrores = validarNuevoAmbiente(input, ambientes);
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length) return;
    const idAmbiente = crearAmbiente(input);
    if (!idAmbiente) {
      setErrores({ nombre: "No se pudo registrar el ambiente. Verificá los datos y que el nombre sea único." });
      return;
    }
    toast({ title: "Ambiente registrado", description: nombre.trim(), variant: "success" });
    navigate(`/ambientes/${idAmbiente}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Ambientes" title="Nuevo ambiente" description="Registrá un espacio común de la residencia y su equipamiento inicial." />
      <form onSubmit={guardar} noValidate className="flex flex-col gap-6">
        {Object.keys(errores).length ? <FormErrorSummary title="Verificá los datos antes de guardar:" errors={Object.entries(errores).map(([campo, message]) => ({ id: `${idBase}-${campo}`, message }))} /> : null}
        <Card>
          <CardHeader><div><CardTitle>Datos del ambiente</CardTitle><CardDescription>Identificá el espacio y su ubicación dentro de la residencia.</CardDescription></div></CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <TextField id={`${idBase}-nombre`} label="Nombre del ambiente" placeholder="Ej.: Sala de estudio 3" value={nombre} onChange={(event) => setNombre(event.target.value)} required error={errores.nombre} />
            <SelectField id={`${idBase}-tipo`} label="Tipo de ambiente" value={tipo} onChange={(event) => setTipo(event.target.value)} required error={errores.tipo}>
              <option value="">Seleccioná un tipo</option>
              {TIPOS_AMBIENTE.map((valor) => <option key={valor} value={valor}>{valor}</option>)}
            </SelectField>
            <div className="sm:col-span-2"><TextField id={`${idBase}-ubicacion`} label="Ubicación (opcional)" placeholder="Ej.: sector del patio, junto a la cocina" value={ubicacion} onChange={(event) => setUbicacion(event.target.value)} /></div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor={`${idBase}-descripcion`} className="text-sm font-medium text-slate-700 dark:text-slate-300">Descripción (opcional)</label>
              <textarea id={`${idBase}-descripcion`} rows={3} value={descripcion} onChange={(event) => setDescripcion(event.target.value)} placeholder="Características o referencias útiles para identificar el espacio." className="w-full resize-y rounded-md border border-slate-400 bg-slate-100/80 px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><div><CardTitle>Equipamiento inicial</CardTitle><CardDescription>Cargá los objetos y sus cantidades. Podés completarlo más adelante desde el detalle.</CardDescription></div></CardHeader>
          <CardContent className="flex flex-col gap-4">
            {objetos.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">No se cargó equipamiento inicial.</p> : objetos.map((objeto, indice) => (
              <fieldset key={objeto.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <legend className="px-2 text-sm font-medium text-slate-700 dark:text-slate-300">Objeto {indice + 1}</legend>
                <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
                  <TextField id={`${idBase}-objeto-${indice}`} label="Nombre del objeto" placeholder="Ej.: Lavarropas" required value={objeto.nombre} onChange={(event) => actualizarObjeto(objeto.id, "nombre", event.target.value)} error={errores[`objeto-${indice}`]} />
                  <TextField id={`${idBase}-cantidad-${indice}`} label="Cantidad" type="number" min={1} step={1} required value={objeto.cantidad} onChange={(event) => actualizarObjeto(objeto.id, "cantidad", event.target.value)} error={errores[`cantidad-${indice}`]} />
                  <Button type="button" variant="ghost" className="sm:mt-7" aria-label={`Quitar objeto ${indice + 1}`} onClick={() => { setObjetos((previos) => previos.filter((item) => item.id !== objeto.id)); setErrores({}); }}>Quitar</Button>
                </div>
              </fieldset>
            ))}
            <div><Button type="button" variant="outline" onClick={() => { secuencia.current += 1; setObjetos((previos) => [...previos, { id: secuencia.current, nombre: "", cantidad: "1" }]); }}>Agregar objeto</Button></div>
          </CardContent>
        </Card>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-300 pt-5 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">Los campos marcados con * son obligatorios.</p>
          <div className="flex gap-3"><Link to="/ambientes"><Button type="button" variant="outline">Cancelar</Button></Link><Button type="submit">Registrar ambiente</Button></div>
        </div>
      </form>
    </div>
  );
}
