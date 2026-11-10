import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Badge, StatusBadge } from "../Components/ui/badge";
import { Button } from "../Components/ui/button";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { InputField } from "../Components/ui/input";
import { PageHeader } from "../Components/ui/page-header";
import { Progress } from "../Components/ui/progress";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "../Components/ui/table";
import { asignacionesActivas } from "../lib/domain";
import { useData } from "../lib/store";
import { useDebouncedValue } from "../lib/use-debounced-value";

export function meta() {
  return [{ title: "Habitaciones · Gestión de Residencia" }];
}

export default function Habitaciones() {
  const { habitaciones, asignaciones } = useData();
  const [busqueda, setBusqueda] = useState("");
  const busquedaDebounceada = useDebouncedValue(busqueda);

  const filas = useMemo(() => {
    const ocupacionPorHabitacion = new Map<string, number>();
    for (const asignacion of asignacionesActivas(asignaciones)) {
      ocupacionPorHabitacion.set(
        asignacion.idHabitacion,
        (ocupacionPorHabitacion.get(asignacion.idHabitacion) ?? 0) + 1,
      );
    }

    const termino = busquedaDebounceada.trim().toLowerCase();
    return habitaciones
      .map((habitacion) => {
        const ocupadas = ocupacionPorHabitacion.get(habitacion.idHabitacion) ?? 0;
        const capacidad = habitacion.capacidadMaxima;
        return {
          habitacion,
          ocupadas,
          disponibles: Math.max(0, capacidad - ocupadas),
          porcentaje: capacidad > 0 ? (ocupadas / capacidad) * 100 : 0,
        };
      })
      .filter(({ habitacion }) =>
        [habitacion.numeroHabitacion, habitacion.pisoHabitacion ?? ""]
          .some((dato) => String(dato).toLowerCase().includes(termino)),
      )
      .sort(
        (a, b) => {
          const pisoA = a.habitacion.pisoHabitacion;
          const pisoB = b.habitacion.pisoHabitacion;
          if (pisoA === null && pisoB !== null) return 1;
          if (pisoA !== null && pisoB === null) return -1;
          return (
            (pisoA ?? 0) - (pisoB ?? 0) ||
            a.habitacion.numeroHabitacion.localeCompare(
              b.habitacion.numeroHabitacion,
            )
          );
        },
      );
  }, [asignaciones, busquedaDebounceada, habitaciones]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Residencia"
        title="Habitaciones"
        description={`${habitaciones.length} habitaciones · ${filas.length} mostradas`}
        actions={
          <Link to="/habitaciones/nueva">
            <Button>
              <Icon name="plus" className="h-4 w-4" />
              Agregar habitación
            </Button>
          </Link>
        }
      />

      <div className="relative w-full sm:max-w-sm">
        <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <InputField
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar por habitación o piso..."
          aria-label="Buscar habitaciones"
          className="pl-9"
        />
      </div>

      <TableWrap>
        <Table>
          <THead>
            <TR>
              <TH>Habitación</TH>
              <TH>Ocupación</TH>
              <TH>Disponibilidad</TH>
              <TH className="text-right">Detalle</TH>
            </TR>
          </THead>
          <TBody>
            {filas.length === 0 ? (
              <TR>
                <TD colSpan={4}>
                  <EmptyState
                    icon="rooms"
                    title={habitaciones.length ? "Sin resultados" : "Sin habitaciones"}
                    description={
                      habitaciones.length
                        ? "No hay habitaciones que coincidan con la búsqueda."
                        : "No hay habitaciones registradas en la residencia."
                    }
                  />
                </TD>
              </TR>
            ) : (
              filas.map(({ habitacion, ocupadas, disponibles, porcentaje }) => {
                const estado =
                  ocupadas === 0
                    ? "vacia"
                    : disponibles === 0
                      ? "llena"
                      : "disponible";
                const tono = estado === "llena" ? "warning" : "brand";

                return (
                  <TR key={habitacion.idHabitacion}>
                    <TD>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          Hab. {habitacion.numeroHabitacion}
                        </p>
                        <p className="text-xs text-slate-500">
                          {habitacion.pisoHabitacion === null
                            ? "Piso no especificado"
                            : `Piso ${habitacion.pisoHabitacion}`}
                        </p>
                      </div>
                    </TD>
                    <TD className="min-w-36">
                      <div className="flex items-center gap-2">
                        <span className="w-12 shrink-0 text-sm tabular-nums text-slate-700 dark:text-slate-200">
                          {ocupadas}/{habitacion.capacidadMaxima}
                        </span>
                        <Progress value={porcentaje} tone={tono} />
                      </div>
                    </TD>
                    <TD>
                      <div className="flex flex-col items-start gap-1.5">
                        <StatusBadge estado={estado} />
                        <Badge variant="neutral">
                          {disponibles} {disponibles === 1 ? "cupo" : "cupos"}
                        </Badge>
                      </div>
                    </TD>
                    <TD className="text-right">
                      <Link to={`/habitaciones/${habitacion.idHabitacion}`}>
                        <Button size="sm" variant="outline">
                          Ver habitación
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
    </div>
  );
}