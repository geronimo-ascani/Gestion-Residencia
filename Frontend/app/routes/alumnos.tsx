import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Button } from "../Components/ui/button";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { InputField } from "../Components/ui/input";
import { PageHeader } from "../Components/ui/page-header";
import { Badge } from "../Components/ui/badge";
import { Tabs } from "../Components/ui/tabs";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "../Components/ui/table";
import { asignacionActiva, contratoVigente, diasHasta, finEstadia } from "../lib/domain";
import { FECHA_REFERENCIA } from "../lib/config";
import { formatFecha } from "../lib/format";
import { useData } from "../lib/store";

export function meta() {
  return [{ title: "Alumnos · Gestión de Residencia" }];
}

export default function Alumnos() {
  const { alumnos, contratos, asignaciones, habitaciones, habitacionPorId } = useData();
  const [params, setParams] = useSearchParams();
  const vista = ["historico", "pendientes"].includes(params.get("vista") ?? "") ? params.get("vista")! : "actuales";
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [filtroHabitacion, setFiltroHabitacion] = useState("todas");
  const [orden, setOrden] = useState<{ columna: "alumno" | "habitacion"; direccion: "asc" | "desc" }>({ columna: "alumno", direccion: "asc" });

  function cambiarOrden(columna: "alumno" | "habitacion") {
    setOrden((anterior) => ({
      columna,
      direccion: anterior.columna === columna && anterior.direccion === "asc" ? "desc" : "asc",
    }));
  }

  function encabezadoOrdenable(columna: "alumno" | "habitacion", etiqueta: string) {
    const seleccionado = orden.columna === columna;
    const ascendente = !seleccionado || orden.direccion === "asc";
    return (
      <button
        type="button"
        onClick={() => cambiarOrden(columna)}
        aria-label={`Ordenar por ${etiqueta.toLowerCase()} ${seleccionado && ascendente ? "descendente" : "ascendente"}`}
        title={columna === "alumno" ? "Ordenar por apellido y nombre (A–Z / Z–A)" : "Ordenar por número de habitación"}
        className="inline-flex items-center gap-1.5 rounded-sm py-1 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 dark:hover:text-brand-300"
      >
        {etiqueta}
        <Icon name="arrow" className={`h-3.5 w-3.5 ${ascendente ? "-rotate-90" : "rotate-90"} ${seleccionado ? "text-brand-600 dark:text-brand-300" : "text-slate-400"}`} />
        {columna === "alumno" && seleccionado ? <span className="text-[10px]">{ascendente ? "A–Z" : "Z–A"}</span> : null}
      </button>
    );
  }
  const datos = alumnos.map((alumno) => {
    const historial = contratos.filter((c) => c.idAlumno === alumno.idAlumno).sort((a, b) => b.fechaDesde.localeCompare(a.fechaDesde));
    const contrato = contratoVigente(historial, alumno.idAlumno);
    const anteriores = historial.filter((c) => c.fechaDesde <= FECHA_REFERENCIA && finEstadia(c) >= c.fechaDesde);
    const asignacion = asignacionActiva(asignaciones, alumno.idAlumno);
    const habitacion = asignacion ? habitacionPorId.get(asignacion.idHabitacion) : undefined;
    return { alumno, contrato, historial, anteriores, habitacion };
  });
  const actuales = datos.filter((f) => f.contrato);
  const historico = datos.filter((f) => f.anteriores.length > 0);
  const pendientes = datos.filter((f) => !f.contrato && f.anteriores.length === 0);
  const base = vista === "actuales" ? actuales : vista === "historico" ? historico : pendientes;
  const termino = busqueda.trim().toLocaleLowerCase();
  const habitacionesOrdenadas = [...habitaciones].sort((a, b) => a.numeroHabitacion.localeCompare(b.numeroHabitacion, "es", { numeric: true }));
  const compararAlumno = (a: typeof datos[number], b: typeof datos[number]) =>
    a.alumno.apellido.localeCompare(b.alumno.apellido, "es", { sensitivity: "base" }) ||
    a.alumno.nombre.localeCompare(b.alumno.nombre, "es", { sensitivity: "base" }) ||
    a.alumno.documento.localeCompare(b.alumno.documento);
  const filas = base.filter((f) => `${f.alumno.apellido} ${f.alumno.nombre} ${f.alumno.documento} ${f.alumno.correo}`.toLocaleLowerCase().includes(termino))
    .filter((f) => filtro === "todos" || (filtro === "sin-habitacion" && !f.habitacion) || (filtro === "egresados" && !f.contrato) || (filtro === "residentes" && Boolean(f.contrato)) ||
      (filtro === "vence-30" && f.contrato && diasHasta(f.contrato.fechaHasta) <= 30))
    .filter((f) => {
      if (filtroHabitacion === "todas") return true;
      if (filtroHabitacion === "sin-asignar") return !f.habitacion;
      if (vista === "historico") {
        return asignaciones.some((a) => a.idAlumno === f.alumno.idAlumno && a.idHabitacion === filtroHabitacion &&
          a.fechaDesde <= FECHA_REFERENCIA && (a.fechaHasta === null || a.fechaHasta > a.fechaDesde));
      }
      return f.habitacion?.idHabitacion === filtroHabitacion;
    })
    .sort((a, b) => {
      let comparacion = compararAlumno(a, b);
      if (orden.columna === "habitacion" && vista === "actuales") {
        // Keep unassigned residents at the end in both directions.
        if (!a.habitacion && b.habitacion) return 1;
        if (a.habitacion && !b.habitacion) return -1;
        comparacion = (a.habitacion?.numeroHabitacion ?? "").localeCompare(b.habitacion?.numeroHabitacion ?? "", "es", { numeric: true }) || comparacion;
      }
      return orden.direccion === "asc" ? comparacion : -comparacion;
    });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Alumnos" title="Alumnos de la residencia"
        description="Consultá quiénes residen hoy y el recorrido de cada alumno en la residencia."
        actions={<Link to="/alumnos/nuevo"><Button><Icon name="plus" className="h-4 w-4" />Ingresar alumno</Button></Link>} />
      <Tabs label="Vistas de alumnos" className="flex-wrap self-start" value={vista}
        items={[{ id: "actuales", label: "Residentes actuales", count: actuales.length }, { id: "historico", label: "Histórico", count: historico.length }, { id: "pendientes", label: "Pendientes de ingreso", count: pendientes.length }]}
        onChange={(v) => { setParams(v === "actuales" ? {} : { vista: v }); setFiltro("todos"); setFiltroHabitacion("todas"); setOrden({ columna: "alumno", direccion: "asc" }); }} />
      <div className="rounded-xl border border-slate-300 bg-white shadow-sm p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-semibold text-slate-900 dark:text-white">{vista === "actuales" ? "Residentes actuales" : vista === "historico" ? "Historial de alumnos" : "Alumnos sin estadías previas"}</h2>
        <p className="mt-1 text-sm text-slate-500">{vista === "actuales" ? "Alumnos con contrato vigente. Las bajas y los contratos finalizados se consultan en el histórico." : vista === "historico" ? "Todos los alumnos que tuvieron una estadía, incluidos los residentes actuales. Cada ficha conserva todos sus contratos." : "Alumnos registrados que aún no ingresaron. Incluye contratos programados y registros sin contrato."}</p>
        <p className="mt-2 text-xs text-slate-500">Fecha de referencia del prototipo: {formatFecha(FECHA_REFERENCIA)}</p>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <InputField aria-label="Buscar alumnos" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, DNI o correo…" className="pl-9" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label={vista === "historico" ? "Filtrar por habitación actual o anterior" : "Filtrar por habitación"}
            value={filtroHabitacion}
            onChange={(e) => setFiltroHabitacion(e.target.value)}
            className="h-9 max-w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-600 dark:border-slate-800 dark:bg-slate-900"
          >
            <option value="todas">Todas las habitaciones</option>
            <option value="sin-asignar">Sin habitación actual</option>
            {habitacionesOrdenadas.map((h) => <option key={h.idHabitacion} value={h.idHabitacion}>Habitación {h.numeroHabitacion}</option>)}
          </select>
        {vista !== "pendientes" ? <select aria-label="Filtrar alumnos" value={filtro} onChange={(e) => setFiltro(e.target.value)} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-900">
          <option value="todos">{vista === "historico" ? "Todos los que residieron" : "Todos los residentes"}</option>
          {vista === "historico" ? <><option value="residentes">Residentes</option><option value="egresados">No residentes</option></> : <><option value="sin-habitacion">Sin habitación asignada</option><option value="vence-30">Vencen en 30 días o menos</option></>}
        </select> : null}
        </div>
      </div>
      {vista === "historico" && filtroHabitacion !== "todas" && filtroHabitacion !== "sin-asignar" ? <p className="text-xs text-slate-500">Incluye alumnos que tienen o tuvieron asignada esa habitación.</p> : null}
      <p className="text-sm text-slate-500" aria-live="polite">{filas.length} de {base.length} alumnos</p>
      <TableWrap><Table>
        <THead><TR>
          <TH aria-sort={orden.columna === "alumno" ? orden.direccion === "asc" ? "ascending" : "descending" : "none"}>{encabezadoOrdenable("alumno", "Alumno")}</TH>
          <TH>{vista === "actuales" ? "Contacto" : "Estado"}</TH>
          <TH className="hidden sm:table-cell" aria-sort={vista === "actuales" && orden.columna === "habitacion" ? orden.direccion === "asc" ? "ascending" : "descending" : "none"}>{vista === "actuales" ? encabezadoOrdenable("habitacion", "Habitación") : "Contratos"}</TH><TH className="hidden md:table-cell">{vista === "actuales" ? "Contrato vigente" : "Último período"}</TH><TH className="text-right">Ficha</TH></TR></THead>
        <TBody>{filas.length === 0 ? <TR><TD colSpan={5}><EmptyState icon="users" title="Sin alumnos en esta vista" description="No hay alumnos que coincidan con la vista y los filtros seleccionados." /></TD></TR> : filas.map((f) => {
          const periodo = f.contrato ?? (vista === "historico" ? f.anteriores[0] : f.historial[0]);
          return <TR key={f.alumno.idAlumno}>
            <TD><p className="font-medium text-slate-900 dark:text-white">{f.alumno.apellido}, {f.alumno.nombre}</p><p className="text-xs text-slate-500">DNI {f.alumno.documento}</p></TD>
            <TD>{vista === "actuales" ? (
              <div className="text-sm text-slate-600 dark:text-slate-300">
                <a href={`mailto:${f.alumno.correo}`} className="break-all hover:underline">{f.alumno.correo}</a>
                <p className="mt-1 text-xs text-slate-500">{f.alumno.telefono}</p>
              </div>
            ) : (
              <div>
                <Badge variant={f.contrato ? "success" : "neutral"}>{f.contrato ? "Residente" : "No residente"}</Badge>
                {vista === "pendientes" ? <p className="mt-1 text-xs text-slate-500">{f.historial.some((c) => c.fechaDesde > FECHA_REFERENCIA && !c.fechaCancelacion) ? "Ingreso programado" : "Sin contrato"}</p> : null}
              </div>
            )}</TD>
            <TD className="hidden sm:table-cell">{vista === "actuales" ? f.habitacion ? `Hab. ${f.habitacion.numeroHabitacion}` : "Sin asignar" : `${f.historial.length} ${f.historial.length === 1 ? "contrato" : "contratos"}`}</TD>
            <TD className="hidden md:table-cell">{periodo ? <><p>{formatFecha(periodo.fechaDesde)} — {formatFecha(periodo.fechaHasta)}</p><p className="text-xs text-slate-500">{periodo.fechaCancelacion ? `Baja: ${formatFecha(periodo.fechaCancelacion)}` : f.contrato ? diasHasta(periodo.fechaHasta) === 0 ? "Vence hoy" : `Vence en ${diasHasta(periodo.fechaHasta)} días` : "Fin pactado"}</p></> : "Sin contratos registrados"}</TD>
            <TD className="text-right"><Link to={`/alumnos/${f.alumno.idAlumno}?origen=${vista}`}><Button size="sm" variant="outline">Ver ficha<Icon name="arrow" className="h-3.5 w-3.5" /></Button></Link></TD>
          </TR>;
        })}</TBody>
      </Table></TableWrap>
    </div>
  );
}
