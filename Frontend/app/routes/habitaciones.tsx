import { useMemo, useState } from "react";
import { Link } from "react-router";
import { StatusBadge } from "../Components/ui/badge";
import { Button } from "../Components/ui/button";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { InputField } from "../Components/ui/input";
import { PageHeader } from "../Components/ui/page-header";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "../Components/ui/table";
import { asignacionesActivas, calcularOcupacion } from "../lib/domain";
import { useData } from "../lib/store";
import { useDebouncedValue } from "../lib/use-debounced-value";

export function meta() {
  return [{ title: "Habitaciones · Gestión de Residencia" }];
}

export default function Habitaciones() {
  const { habitaciones, asignaciones } = useData();
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<{
    columna: "habitacion" | "estado";
    direccion: "asc" | "desc";
  }>({ columna: "habitacion", direccion: "asc" });
  const busquedaDebounceada = useDebouncedValue(busqueda);
  const resumen = calcularOcupacion(habitaciones, asignaciones);

  const filas = useMemo(() => {
    const ocupacionPorHabitacion = new Map<string, number>();
    for (const asignacion of asignacionesActivas(asignaciones)) {
      ocupacionPorHabitacion.set(
        asignacion.idHabitacion,
        (ocupacionPorHabitacion.get(asignacion.idHabitacion) ?? 0) + 1,
      );
    }

    const termino = busquedaDebounceada.trim().toLocaleLowerCase("es");
    return habitaciones
          .map((habitacion) => {
        const ocupadas = ocupacionPorHabitacion.get(habitacion.idHabitacion) ?? 0;
        const capacidad = habitacion.capacidadMaxima;
        return {
          habitacion,
          ocupadas,
          disponibles: Math.max(0, capacidad - ocupadas),
        };
      })
      .filter(({ habitacion, ocupadas, disponibles }) => {
        const estado = ocupadas === 0 ? "vacia" : disponibles === 0 ? "llena" : "disponible";
        return [habitacion.numeroHabitacion, habitacion.pisoHabitacion === 0 ? "planta baja" : String(habitacion.pisoHabitacion ?? ""), estado, estado === "vacia" ? "vacía" : ""]
          .some((dato) => dato.toLocaleLowerCase("es").includes(termino));
      })
      .sort(
        (a, b) => {
          const pisoA = a.habitacion.pisoHabitacion;
          const pisoB = b.habitacion.pisoHabitacion;
          if (pisoA === null && pisoB !== null) return 1;
          if (pisoA !== null && pisoB === null) return -1;
          const comparacionHabitacion =
            (pisoA ?? 0) - (pisoB ?? 0) ||
            a.habitacion.numeroHabitacion.localeCompare(
              b.habitacion.numeroHabitacion,
              "es",
              { numeric: true },
            );
          const comparacion = orden.columna === "estado"
            ? (a.disponibles === a.habitacion.capacidadMaxima ? 0 : a.disponibles === 0 ? 2 : 1) - (b.disponibles === b.habitacion.capacidadMaxima ? 0 : b.disponibles === 0 ? 2 : 1)
            : comparacionHabitacion;
          return orden.direccion === "asc" ? comparacion : -comparacion;
        },
      );
  }, [asignaciones, busquedaDebounceada, habitaciones, orden]);

  function encabezadoOrdenable(columna: "habitacion" | "estado", texto: string) {
    const seleccionado = orden.columna === columna;
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-sm hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        aria-label={`Ordenar por ${texto.toLowerCase()} ${seleccionado && orden.direccion === "asc" ? "descendente" : "ascendente"}`}
        onClick={() => setOrden((actual) => ({
          columna,
          direccion: actual.columna === columna && actual.direccion === "asc" ? "desc" : "asc",
        }))}
      >
        {texto}
        <Icon name="chevron" className={`h-3.5 w-3.5 ${seleccionado && orden.direccion === "desc" ? "rotate-180" : ""}`} />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Residencia"
        title="Habitaciones"
        description="Consultá la capacidad y los lugares disponibles de cada habitación."
        actions={
          <Link to="/habitaciones/nueva">
            <Button>
              <Icon name="plus" className="h-4 w-4" />
              Agregar habitación
            </Button>
          </Link>
        }
      />

      <section aria-label="Resumen de habitaciones" className="overflow-hidden rounded-xl border border-brand-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-brand-200 bg-brand-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-800">
          <Icon name="building" className="h-5 w-5 text-brand-700 dark:text-brand-300" />
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Distribución de la residencia</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Un único piso · Planta baja</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-y-5 px-5 py-5 sm:grid-cols-4">
          {[
            { label: "Habitaciones", valor: habitaciones.length },
            { label: "Plazas totales", valor: resumen.capacidadTotal },
            { label: "Plazas ocupadas", valor: resumen.camasOcupadas },
            { label: "Plazas libres", valor: Math.max(0, resumen.capacidadTotal - resumen.camasOcupadas) },
          ].map(({ label, valor }) => (
            <div key={label}>
              <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
              <dd className="mt-1 text-3xl font-semibold tabular-nums text-brand-900 dark:text-brand-200">{valor}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="listado-habitaciones" className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 id="listado-habitaciones" className="text-lg font-semibold text-slate-900 dark:text-white">Listado de habitaciones</h2>
            <p aria-live="polite" className="text-sm text-slate-500 dark:text-slate-400">{habitaciones.length} registradas · {filas.length} mostradas</p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <InputField
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar por habitación o piso..."
              aria-label="Buscar habitaciones"
              className="pl-9"
            />
          </div>
        </div>

        <TableWrap className="dark:border-slate-700 dark:bg-slate-900">
          <Table>
            <caption className="sr-only">Capacidad, ocupación y disponibilidad por habitación, ordenadas por número.</caption>
            <THead>
              <TR>
                <TH aria-sort={orden.columna === "habitacion" ? orden.direccion === "asc" ? "ascending" : "descending" : "none"}>{encabezadoOrdenable("habitacion", "Habitación")}</TH>
                <TH className="text-center">Capacidad</TH>
                <TH>Ocupación</TH>
                <TH className="text-center">Plazas libres</TH>
                <TH aria-sort={orden.columna === "estado" ? orden.direccion === "asc" ? "ascending" : "descending" : "none"}>{encabezadoOrdenable("estado", "Estado")}</TH>
                <TH className="text-right">Administración</TH>
              </TR>
            </THead>
            <TBody>
              {filas.length === 0 ? (
                <TR>
                  <TD colSpan={6}>
                    <EmptyState
                      icon="rooms"
                      title={habitaciones.length ? "Sin resultados" : "Sin habitaciones"}
                      description={
                        habitaciones.length
                          ? "No hay habitaciones que coincidan con la búsqueda."
                          : "No hay habitaciones registradas en la residencia."
                      }
                      action={habitaciones.length > 0 ? <Button variant="outline" onClick={() => setBusqueda("")}>Limpiar búsqueda</Button> : undefined}
                    />
                  </TD>
                </TR>
              ) : (
                filas.map(({ habitacion, ocupadas, disponibles }) => {
                  const estado =
                    ocupadas === 0
                      ? "vacia"
                      : disponibles === 0
                        ? "llena"
                        : "disponible";

                  return (
                    <TR key={habitacion.idHabitacion}>
                      <TD>
                        <div className="flex items-center gap-3 py-2">
                          <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-lg font-semibold tabular-nums text-brand-800 dark:border-brand-800 dark:bg-slate-800 dark:text-brand-200">{habitacion.numeroHabitacion}</span>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              Habitación {habitacion.numeroHabitacion}
                            </p>
                            <p className="text-xs text-slate-500">
                              {habitacion.pisoHabitacion === null
                                ? "Piso no especificado"
                                : habitacion.pisoHabitacion === 0 ? "Planta baja" : `Piso ${habitacion.pisoHabitacion}`}
                            </p>
                          </div>
                        </div>
                      </TD>
                      <TD className="text-center">
                        <span className="font-semibold tabular-nums">{habitacion.capacidadMaxima}</span>
                        <span className="ml-1 text-slate-500 dark:text-slate-400">personas</span>
                      </TD>
                      <TD className="min-w-40">
                        <div className="flex flex-col gap-1.5">
                          <div
                            className="flex min-h-3 items-center gap-1.5"
                            role="img"
                            aria-label={`${ocupadas} de ${habitacion.capacidadMaxima} plazas ocupadas`}
                          >
                            {Array.from(
                              { length: Math.min(habitacion.capacidadMaxima, 8) },
                              (_, indice) => (
                                <span
                                  key={indice}
                                  aria-hidden="true"
                                  className={`h-2.5 w-2.5 rounded-full ${
                                    indice < ocupadas
                                      ? "bg-emerald-700 dark:bg-emerald-500"
                                      : "bg-slate-200 dark:bg-slate-700"
                                  }`}
                                />
                              ),
                            )}
                            {habitacion.capacidadMaxima > 8 && (
                              <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                                +{habitacion.capacidadMaxima - 8}
                              </span>
                            )}
                          </div>
                          <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                            {ocupadas} / {habitacion.capacidadMaxima}
                          </span>
                        </div>
                      </TD>
                      <TD className="text-center">
                        <span className={disponibles > 0 ? "font-semibold tabular-nums text-emerald-800 dark:text-emerald-300" : "font-semibold tabular-nums text-slate-500"}>{disponibles}</span>
                      </TD>
                      <TD>
                        <StatusBadge estado={estado} />
                      </TD>
                      <TD className="text-right">
                        <Link to={`/habitaciones/${habitacion.idHabitacion}`} aria-label={`Ver habitación ${habitacion.numeroHabitacion}`}>
                          <Button size="sm" variant="outline">
                            Administrar
                            <Icon name="arrow" className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </TD>
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>
        </TableWrap>
        {resumen.camasOcupadas === 0 && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
            No hay alumnos asignados. Registrá a los residentes y asignalos desde el detalle de cada habitación.
            <Link to="/alumnos/nuevo" className="font-medium text-brand-700 underline underline-offset-4 dark:text-brand-300">Registrar alumno</Link>
          </p>
        )}
      </section>
    </div>
  );
}
