import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Button } from "../Components/ui/button";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { InputField } from "../Components/ui/input";
import { PageHeader } from "../Components/ui/page-header";
import { Badge, StatusBadge } from "../Components/ui/badge";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "../Components/ui/table";
import { diasHasta, estadoContrato } from "../lib/domain";
import { formatFecha } from "../lib/format";
import { useData } from "../lib/store";
import { useDebouncedValue } from "../lib/use-debounced-value";
import type { EstadoContrato as EstadoContratoTipo } from "../lib/domain";

type FiltroContrato = "todos" | EstadoContratoTipo;
type FiltroAlumno = "todos" | "activo" | "inactivo";

function textoVencimiento(contrato: { fechaHasta: string }, estado: EstadoContratoTipo) {
  const dias = diasHasta(contrato.fechaHasta);
  if (estado === "cancelado") return "Contrato cancelado";
  if (estado === "programado") return "Aún no iniciado";
  if (estado === "finalizado") {
    if (dias < 0) return `Venció hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? "" : "s"}`;
    return "Finalizado";
  }
  if (dias === 0) return "Vence hoy";
  if (dias > 0) return `Vence en ${dias} día${dias === 1 ? "" : "s"}`;
  return `Venció hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? "" : "s"}`;
}

export function meta() {
  return [{ title: "Contratos · Gestión de Residencia" }];
}

export default function Contratos() {
  const { contratos, alumnos, alumnoPorId } = useData();
  const [busqueda, setBusqueda] = useState("");
  const busquedaDebounceada = useDebouncedValue(busqueda);
  const [filtroContrato, setFiltroContrato] = useState<FiltroContrato>("todos");
  const [filtroAlumno, setFiltroAlumno] = useState<FiltroAlumno>("todos");

  const filas = useMemo(() => {
    const termino = busquedaDebounceada.trim().toLowerCase();
    return contratos
      .map((contrato) => {
        const alumno = alumnoPorId.get(contrato.idAlumno) ?? alumnos.find((a) => a.idAlumno === contrato.idAlumno);
        const estado = estadoContrato(contrato);
        const dias = diasHasta(contrato.fechaHasta);
        return {
          contrato,
          alumno,
          estado,
          dias,
        };
      })
      .filter((fila) => {
        if (!fila.alumno) return false;
        if (termino) {
          const hayCoincidencia =
            fila.contrato.idContrato.toLowerCase().includes(termino) ||
            fila.alumno.nombre.toLowerCase().includes(termino) ||
            fila.alumno.apellido.toLowerCase().includes(termino) ||
            fila.alumno.documento.toLowerCase().includes(termino) ||
            fila.alumno.correo.toLowerCase().includes(termino);
          if (!hayCoincidencia) return false;
        }
        if (filtroContrato !== "todos" && fila.estado !== filtroContrato) return false;
        if (filtroAlumno !== "todos" && fila.alumno.estado !== filtroAlumno) return false;
        return true;
      })
      .sort((a, b) => {
        const diasA = a.dias;
        const diasB = b.dias;
        if (diasA === diasB) {
          return a.contrato.idContrato.localeCompare(b.contrato.idContrato);
        }
        return diasA - diasB;
      });
  }, [alumnoPorId, alumnos, busquedaDebounceada, contratos, filtroAlumno, filtroContrato]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Contratos"
        title="Listado de contratos"
        description={`${contratos.length} contratos registrados · ${filas.length} mostrados`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/contratos/nuevo">
              <Button>
                <Icon name="plus" className="h-4 w-4" />
                Nuevo contrato
              </Button>
            </Link>
            <Link to="/alumnos">
              <Button variant="ghost">
                <Icon name="users" className="h-4 w-4" />
                Ver alumnos
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Icon
            name="search"
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <InputField
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por contrato, alumno o DNI..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filtroContrato}
            onChange={(event) => setFiltroContrato(event.target.value as FiltroContrato)}
            aria-label="Filtrar por estado de contrato"
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/25 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="todos">Todos los contratos</option>
            <option value="vigente">Vigente</option>
            <option value="por-vencer">Por vencer</option>
            <option value="programado">Programado</option>
            <option value="finalizado">Finalizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <select
            value={filtroAlumno}
            onChange={(event) => setFiltroAlumno(event.target.value as FiltroAlumno)}
            aria-label="Filtrar por estado de alumno"
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/25 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="todos">Todos los alumnos</option>
            <option value="activo">Alumnos activos</option>
            <option value="inactivo">Alumnos inactivos</option>
          </select>
        </div>
      </div>

      <TableWrap>
        <Table>
          <THead>
            <TR>
              <TH>Contrato</TH>
              <TH>Alumno</TH>
              <TH>Estado alumno</TH>
              <TH>Desde</TH>
              <TH>Hasta</TH>
              <TH>Estado contrato</TH>
              <TH>Vencimiento</TH>
              <TH className="text-right">Acciones</TH>
            </TR>
          </THead>
          <TBody>
            {filas.length === 0 ? (
              <TR>
                <TD colSpan={8}>
                  <EmptyState
                    icon="contracts"
                    title={contratos.length ? "Sin resultados" : "Sin contratos"}
                    description={
                      contratos.length
                        ? "No hay contratos que coincidan con los filtros aplicados."
                        : "Aún no hay contratos registrados."
                    }
                  />
                </TD>
              </TR>
            ) : (
              filas.map((fila) => {
                if (!fila.alumno) return null;
                return (
                  <TR key={fila.contrato.idContrato}>
                    <TD>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {fila.contrato.idContrato}
                        </span>
                        <Link
                          to={`/contratos/${fila.contrato.idContrato}`}
                          className="text-xs text-brand-600 hover:underline dark:text-brand-300"
                        >
                          Ver ficha
                        </Link>
                      </div>
                    </TD>
                    <TD>
                      <Link
                        to={`/alumnos/${fila.alumno.idAlumno}`}
                        className="group flex flex-col"
                      >
                        <span className="font-medium text-slate-900 group-hover:underline dark:text-white">
                          {fila.alumno.apellido}, {fila.alumno.nombre}
                        </span>
                        <span className="text-xs text-slate-500">
                          DNI {fila.alumno.documento}
                        </span>
                      </Link>
                    </TD>
                    <TD>
                      <Badge variant={fila.alumno.estado === "activo" ? "success" : "neutral"}>
                        {fila.alumno.estado === "activo" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TD>
                    <TD>{formatFecha(fila.contrato.fechaDesde)}</TD>
                    <TD>{formatFecha(fila.contrato.fechaHasta)}</TD>
                    <TD>
                      <StatusBadge estado={fila.estado} />
                    </TD>
                    <TD>
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {textoVencimiento(fila.contrato, fila.estado)}
                      </span>
                    </TD>
                    <TD className="text-right">
                      <Button size="sm" variant="ghost">
                        <Link to={`/alumnos/${fila.alumno.idAlumno}`}>
                          <span className="inline-flex items-center gap-2">
                            Ver alumno
                            <Icon name="chevron" className="h-4 w-4 rotate-[-90deg]" />
                          </span>
                        </Link>
                      </Button>
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
