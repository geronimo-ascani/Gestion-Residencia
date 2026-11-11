import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router";
import { Button } from "../Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { EmptyState } from "../Components/ui/empty-state";
import { PageHeader } from "../Components/ui/page-header";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "../Components/ui/table";
import { TextField } from "../Components/ui/text-field";
import { useToast } from "../Components/ui/toast";
import { useData } from "../lib/store";

export function meta() {
  return [{ title: "Detalle de ambiente · Gestión de Residencia" }];
}

export default function AmbienteDetalle() {
  const { idAmbiente } = useParams();
  const { ambientePorId, agregarEquipamientoAmbiente } = useData();
  const ambiente = ambientePorId.get(idAmbiente ?? "");
  const { toast } = useToast();
  const formId = useId();
  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [error, setError] = useState("");

  if (!ambiente?.tipo) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow="Ambientes" title="Ambiente no encontrado" description="No existe un ambiente común con el identificador solicitado." />
        <EmptyState icon="building" title="Sin resultados" description="Verificá la ruta o volvé al listado de ambientes." action={<Link to="/ambientes"><Button>Volver a ambientes</Button></Link>} />
      </div>
    );
  }

  function agregarObjeto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!idAmbiente || !agregarEquipamientoAmbiente(idAmbiente, { nombre, cantidad: Number(cantidad) })) {
      setError("Ingresá un nombre y una cantidad entera positiva válida.");
      return;
    }
    setNombre("");
    setCantidad("1");
    setError("");
    toast({ title: "Equipamiento agregado", variant: "success" });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Ambientes" title={ambiente.ambiente} description={ambiente.tipo} actions={<Link to="/ambientes"><Button variant="outline">Volver a ambientes</Button></Link>} />
      {ambiente.ubicacion || ambiente.descripcion ? (
        <Card><CardHeader><CardTitle>Datos del ambiente</CardTitle></CardHeader><CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            {ambiente.ubicacion ? <div><dt className="text-sm text-slate-500 dark:text-slate-400">Ubicación</dt><dd className="mt-1 text-slate-900 dark:text-white">{ambiente.ubicacion}</dd></div> : null}
            {ambiente.descripcion ? <div><dt className="text-sm text-slate-500 dark:text-slate-400">Descripción</dt><dd className="mt-1 whitespace-pre-wrap text-slate-900 dark:text-white">{ambiente.descripcion}</dd></div> : null}
          </dl>
        </CardContent></Card>
      ) : null}
      <section aria-label="Equipamiento del ambiente" className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Equipamiento</h2>
        <TableWrap className="dark:border-slate-700 dark:bg-slate-900">
          <Table>
            <caption className="sr-only">Equipamiento de {ambiente.ambiente}</caption>
            <THead><TR><TH>Objeto</TH><TH className="text-right">Cantidad</TH></TR></THead>
            <TBody className="dark:[&>tr:nth-child(even)]:bg-slate-900 dark:[&>tr:hover]:bg-slate-800">
              {ambiente.equipamiento?.length ? ambiente.equipamiento.map((equipo) => (
                <TR key={equipo.nombre}><TD className="text-slate-900 dark:text-white">{equipo.nombre}</TD><TD className="text-right font-semibold tabular-nums text-brand-800 dark:text-brand-200">{equipo.cantidad}</TD></TR>
              )) : <TR><TD colSpan={2}><EmptyState icon="building" title="Sin equipamiento" description="Agregá el primer objeto a este ambiente desde el formulario." /></TD></TR>}
            </TBody>
          </Table>
        </TableWrap>
      </section>
      <Card>
        <CardHeader><CardTitle>Agregar objeto</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={agregarObjeto} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
              <TextField id={`${formId}-nombre`} label="Nombre del objeto" placeholder="Ej.: Ventiladores" required value={nombre} onChange={(event) => setNombre(event.target.value)} />
              <TextField id={`${formId}-cantidad`} label="Cantidad" type="number" min={1} step={1} required value={cantidad} onChange={(event) => setCantidad(event.target.value)} />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Si el nombre ya existe en este ambiente, se suma la cantidad ingresada.</p>
            {error ? <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
            <div><Button type="submit">Agregar objeto</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
