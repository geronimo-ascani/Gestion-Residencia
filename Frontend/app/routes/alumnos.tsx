import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Button } from "../Components/ui/button";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { InputField } from "../Components/ui/input";
import { PageHeader } from "../Components/ui/page-header";
import { Badge } from "../Components/ui/badge";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "../Components/ui/table";
import { asignacionActiva, contratoVigente, diasHasta, estadoContrato } from "../lib/domain";
import { formatFecha } from "../lib/format";
import { useData } from "../lib/store";

type EstadoFiltro = "todos" | "con-habitacion" | "sin-habitacion" | "vence-30";

export function meta() {
  return [{ title: "Alumnos · Gestión de Residencia" }];
}

export default function Alumnos() {
  const { alumnos, contratos, asignaciones, habitaciones } = useData();
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("todos");

  const habitacionPorAlumno = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const asignacion of asignaciones) {
      if (asignacion.fechaHasta !== null) continue;
      const hab = habitaciones.find((h) => h.idHabitacion === asignacion.idHabitacion);
      if (hab) mapa.set(asignacion.idAlumno, `Hab. ${hab.numeroHabitacion}`);
    }
    return mapa;
  }, [asignaciones, habitaciones]);

  const filas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return alumnos
      .map((alumno) => {
        const contrato = contratoVigente(contratos, alumno.idAlumno);
        const asignacion = asignacionActiva(asignaciones, alumno.idAlumno);
        const tieneContrato = Boolean(contrato);
        const tieneHabitacion = Boolean(asignacion);
        const estContrato = contrato ? estadoContrato(contrato) : null;
        const dias = contrato ? diasHasta(contrato.fechaHasta) : null;
        return {
          alumno,
          contrato,
          asignacion,
          tieneContrato,
          tieneHabitacion,
          estContrato,
          dias,
          habitacion: habitacionPorAlumno.get(alumno.idAlumno) ?? null,
        };
      })
      .filter((fila) => {
        if (!termino) return true;
        return (
          fila.alumno.nombre.toLowerCase().includes(termino) ||
          fila.alumno.apellido.toLowerCase().includes(termino) ||
          fila.alumno.documento.toLowerCase().includes(termino) ||
          fila.alumno.correo.toLowerCase().includes(termino)
        );
      })
      .filter((fila) => {
        if (estadoFiltro === "todos") return true;
        if (estadoFiltro === "con-habitacion") return fila.tieneHabitacion;
        if (estadoFiltro === "sin-habitacion") return fila.tieneContrato && !fila.tieneHabitacion;
        if (estadoFiltro === "vence-30") return fila.contrato ? fila.dias !== null && fila.dias >= 0 && fila.dias <= 30 : false;
        return true;
      })
      .sort((a, b) => a.alumno.apellido.localeCompare(b.alumno.apellido));
  }, [alumnos, asignaciones, busqueda, contratos, estadoFiltro, habitacionPorAlumno]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Alumnos"
        title="Listado de alumnos"
        description={`${alumnos.length} alumnos registrados · ${filas.length} mostrados`}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <InputField
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por nombre, apellido o DNI..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={estadoFiltro}
            onChange={(event) => setEstadoFiltro(event.target.value as EstadoFiltro)}
            aria-label="Filtrar alumnos"
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/25 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="todos">Todos</option>
            <option value="con-habitacion">Con habitación</option>
            <option value="sin-habitacion">Sin habitación</option>
            <option value="vence-30">Vence  en menos de 30 días</option>
          </select>
        </div>
      </div>

      <TableWrap>
        <Table>
          <THead>
            <TR>
              <TH>Alumno</TH>
              <TH className="hidden md:table-cell">Contacto</TH>
              <TH>Estado</TH>
              <TH className="hidden sm:table-cell">Habitación</TH>
              <TH className="hidden lg:table-cell">Contrato</TH>
              <TH className="text-right">Acciones</TH>
            </TR>
          </THead>
          <TBody>
            {filas.length === 0 ? (
              <TR>
                <TD colSpan={6}>
                  <EmptyState
                    icon="users"
                    title="Sin resultados"
                    description="No hay alumnos que coincidan con los filtros aplicados."
                  />
                </TD>
              </TR>
            ) : (
              filas.map((fila) => {
                let estadoLabel = "Sin contrato";
                let estadoVariant: "neutral" | "brand" | "success" | "warning" = "neutral";
                if (fila.tieneContrato && !fila.tieneHabitacion) {
                  estadoLabel = "Sin habitación";
                  estadoVariant = "warning";
                } else if (!fila.tieneContrato && fila.tieneHabitacion) {
                  estadoLabel = "Con habitación";
                  estadoVariant = "brand";
                } else if (fila.tieneContrato && fila.tieneHabitacion) {
                  estadoLabel = "Vigente";
                  estadoVariant = "success";
                }
                return (
                  <TR key={fila.alumno.idAlumno}>
                    <TD>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {fila.alumno.apellido}, {fila.alumno.nombre}
                        </p>
                        <p className="text-xs text-slate-500">DNI {fila.alumno.documento}</p>
                      </div>
                    </TD>
                    <TD className="hidden md:table-cell">
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        <p>{fila.alumno.correo}</p>
                        <p className="text-xs text-slate-500">{fila.alumno.telefono}</p>
                      </div>
                    </TD>
                    <TD>
                      <Badge variant={estadoVariant}>{estadoLabel}</Badge>
                    </TD>
                    <TD className="hidden sm:table-cell">
                      {fila.habitacion ? (
                        <span className="text-sm text-slate-700 dark:text-slate-200">{fila.habitacion}</span>
                      ) : (
                        <span className="text-sm text-slate-400">Sin asignar</span>
                      )}
                    </TD>
                    <TD className="hidden lg:table-cell">
                      {fila.contrato ? (
                        <div>
                          <p className="text-sm text-slate-700 dark:text-slate-200">Vence {formatFecha(fila.contrato.fechaHasta)}</p>
                          {fila.dias !== null ? (
                            <p className="text-xs text-slate-500">
                              {fila.dias <= 0 ? "Vencido" : fila.dias <= 30 ? `Vence en ${fila.dias} días` : `Quedan ${fila.dias} días`}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </TD>
                    <TD className="text-right">
                      <Link to={`/alumnos/${fila.alumno.idAlumno}`}>
                        <Button size="sm" variant="outline">
                          Ver ficha
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
