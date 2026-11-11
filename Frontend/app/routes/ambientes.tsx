import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Badge } from "../Components/ui/badge";
import { Button } from "../Components/ui/button";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { ListSummary, ListToolbar } from "../Components/ui/list-page";
import { PageHeader } from "../Components/ui/page-header";
import { SelectField } from "../Components/ui/select-field";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "../Components/ui/table";
import { normalizar } from "../lib/format";
import { useData } from "../lib/store";

export function meta() {
  return [{ title: "Ambientes · Gestión de Residencia" }];
}

export default function Ambientes() {
  const { ambientes } = useData();
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState("");
  const comunes = useMemo(() => ambientes.filter((ambiente) => ambiente.tipo), [ambientes]);
  const tipos = useMemo(() => [...new Set(comunes.flatMap((ambiente) => ambiente.tipo ? [ambiente.tipo] : []))], [comunes]);
  const filas = useMemo(() => {
    const termino = normalizar(busqueda.trim());
    return comunes.filter((ambiente) =>
      (!tipo || ambiente.tipo === tipo) &&
      normalizar([ambiente.ambiente, ambiente.tipo, ...(ambiente.equipamiento?.map((equipo) => equipo.nombre) ?? [])].join(" ")).includes(termino),
    );
  }, [busqueda, comunes, tipo]);

  function limpiarFiltros() {
    setBusqueda("");
    setTipo("");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Residencia"
        title="Ambientes"
        description="Consultá los espacios comunes y el equipamiento de cada uno."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/ambientes/nuevo">
              <Button>
                <Icon name="plus" className="h-4 w-4" />
                Nuevo ambiente
              </Button>
            </Link>
            <Link to="/limpieza">
              <Button variant="ghost">
                <Icon name="cleaning" className="h-4 w-4" />
                Ver grupos de limpieza
              </Button>
            </Link>
          </div>
        }
      />

      <ListSummary title="Espacios para compartir" description="Inventario de los ambientes comunes de la residencia" icon="building" items={[
        { label: "Ambientes comunes", value: comunes.length },
        { label: "Tipos de ambiente", value: tipos.length },
        { label: "Salas de estudio", value: comunes.filter((ambiente) => ambiente.tipo === "Sala de estudio").length },
        { label: "Cocinas", value: comunes.filter((ambiente) => ambiente.tipo === "Cocina").length },
      ]} />

      <section aria-label="Listado de ambientes" className="flex flex-col gap-4">
        <ListToolbar title="Ambientes comunes" count={filas.length} search={busqueda} onSearch={setBusqueda} placeholder="Buscar ambiente o equipamiento…" searchLabel="Buscar ambiente o equipamiento">
          <SelectField id="tipo-ambiente" label="Tipo de ambiente" value={tipo} onChange={(event) => setTipo(event.target.value)}>
            <option value="">Todos los tipos</option>
            {tipos.map((nombre) => <option key={nombre} value={nombre}>{nombre}</option>)}
          </SelectField>
          {busqueda || tipo ? <Button variant="ghost" onClick={limpiarFiltros}>Limpiar filtros</Button> : null}
        </ListToolbar>
        <p className="text-sm text-slate-600 dark:text-slate-400">{comunes.length} registrados · {filas.length} mostrados.</p>

        <TableWrap className="dark:border-slate-700 dark:bg-slate-900">
          <Table>
            <caption className="sr-only">Ambientes comunes y equipamiento por espacio</caption>
            <THead><TR><TH>Ambiente</TH><TH>Equipamiento</TH><TH className="text-right">Acciones</TH></TR></THead>
            <TBody className="dark:[&>tr:nth-child(even)]:bg-slate-900 dark:[&>tr:hover]:bg-slate-800">
              {filas.length === 0 ? (
                <TR><TD colSpan={3}>
                  <EmptyState icon="building" title={comunes.length ? "Sin resultados" : "Sin ambientes comunes"} description={comunes.length ? "Probá con otro nombre, equipamiento o tipo de ambiente." : "Todavía no hay espacios comunes registrados."} action={comunes.length ? <Button variant="outline" onClick={limpiarFiltros}>Limpiar filtros</Button> : undefined} />
                </TD></TR>
              ) : filas.map((ambiente) => (
                <TR key={ambiente.idAmbiente}>
                  <TD className="min-w-40 align-top">
                    <p className="font-semibold text-slate-900 dark:text-white">{ambiente.ambiente}</p>
                    <Badge className="mt-2" variant="neutral">{ambiente.tipo}</Badge>
                  </TD>
                  <TD className="min-w-52 align-top">
                    {!ambiente.equipamiento?.length ? <span className="text-slate-500 dark:text-slate-400">Sin equipamiento</span> : null}
                    <ul className="space-y-2">
                      {ambiente.equipamiento?.map((equipo) => (
                        <li key={equipo.nombre}>
                          <span className="mr-2 inline-flex min-w-6 justify-center rounded bg-brand-50 px-1.5 font-semibold tabular-nums text-brand-800 dark:bg-brand-900 dark:text-brand-200">{equipo.cantidad}</span>
                          <span className="text-slate-700 dark:text-slate-200">{equipo.nombre}</span>
                        </li>
                      ))}
                    </ul>
                  </TD>
                  <TD className="text-right align-top">
                    <Link to={`/ambientes/${ambiente.idAmbiente}`} aria-label={`Ver detalle de ${ambiente.ambiente}`}>
                      <Button size="sm" variant="outline">Ver detalle<Icon name="arrow" className="h-3.5 w-3.5" /></Button>
                    </Link>
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
