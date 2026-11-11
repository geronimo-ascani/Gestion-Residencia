import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Button } from "../Components/ui/button";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { ListSummary, ListToolbar } from "../Components/ui/list-page";
import { PageHeader } from "../Components/ui/page-header";
import { Tabs } from "../Components/ui/tabs";
import { StatusBadge } from "../Components/ui/badge";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "../Components/ui/table";
import { diasHasta, estadoContrato } from "../lib/domain";
import { formatFecha } from "../lib/format";
import { useData } from "../lib/store";
import { useDebouncedValue } from "../lib/use-debounced-value";
import type { EstadoContrato as EstadoContratoTipo } from "../lib/domain";

type FiltroContrato = "todos" | "actuales" | "historial" | EstadoContratoTipo;
type FiltroAlumno = "todos" | "activo" | "inactivo";

const prioridadEstado: Record<EstadoContratoTipo, number> = {
  "por-vencer": 0,
  vigente: 0,
  programado: 1,
  finalizado: 2,
  cancelado: 2,
};

const vistas = [
  { valor: "actuales", etiqueta: "Vigentes" },
  { valor: "programado", etiqueta: "Programados" },
  { valor: "historial", etiqueta: "Finalizados" },
  { valor: "todos", etiqueta: "Todos" },
] as const;

export function meta() {
  return [{ title: "Contratos · Gestión de Residencia" }];
}

export default function Contratos() {
  const { contratos, alumnos, alumnoPorId } = useData();
  const [busqueda, setBusqueda] = useState("");
  const busquedaDebounceada = useDebouncedValue(busqueda);
  const [filtroContrato, setFiltroContrato] = useState<FiltroContrato>("actuales");
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
        if (filtroContrato === "actuales") {
          if (fila.estado !== "vigente" && fila.estado !== "por-vencer") return false;
        } else if (filtroContrato === "historial") {
          if (fila.estado !== "finalizado" && fila.estado !== "cancelado") return false;
        } else if (filtroContrato !== "todos" && fila.estado !== filtroContrato) {
          return false;
        }
        if (filtroAlumno !== "todos" && fila.alumno.estado !== filtroAlumno) return false;
        return true;
      })
      .sort((a, b) => {
        const prioridad = prioridadEstado[a.estado] - prioridadEstado[b.estado];
        if (prioridad !== 0) return prioridad;
        // En el historial, primero los que terminaron más recientemente.
        if (prioridadEstado[a.estado] === 2) {
          const finA = a.estado === "cancelado" ? a.contrato.fechaCancelacion! : a.contrato.fechaHasta;
          const finB = b.estado === "cancelado" ? b.contrato.fechaCancelacion! : b.contrato.fechaHasta;
          return finB.localeCompare(finA) || a.contrato.idContrato.localeCompare(b.contrato.idContrato);
        }
        if (a.estado === "programado" && b.estado === "programado") {
          return a.contrato.fechaDesde.localeCompare(b.contrato.fechaDesde) || a.contrato.idContrato.localeCompare(b.contrato.idContrato);
        }
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
        eyebrow="Residencia"
        title="Contratos"
        description="Consultá las vigencias y el historial de los contratos de la residencia."
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

      <ListSummary title="Resumen de contratos" description="Vigencias y seguimiento de los contratos de la residencia" icon="contracts" items={[
        { label: "Contratos registrados", value: contratos.length },
        { label: "Vigentes", value: contratos.filter((c) => ["vigente", "por-vencer"].includes(estadoContrato(c))).length },
        { label: "Por vencer (30 días)", value: contratos.filter((c) => estadoContrato(c) === "por-vencer").length },
        { label: "Programados", value: contratos.filter((c) => estadoContrato(c) === "programado").length },
      ]} />
      <Tabs label="Vistas de contratos" className="flex-wrap self-start" value={filtroContrato === "vigente" || filtroContrato === "por-vencer" ? "actuales" : filtroContrato === "finalizado" || filtroContrato === "cancelado" ? "historial" : filtroContrato}
        items={vistas.map((vista) => ({ id: vista.valor, label: vista.etiqueta }))}
        onChange={(value) => setFiltroContrato(value as FiltroContrato)} />

      <ListToolbar title="Listado de contratos" count={filas.length} search={busqueda} onSearch={setBusqueda} placeholder="Buscar por contrato, alumno o DNI…" searchLabel="Buscar contratos">
          <select
            value={filtroContrato}
            onChange={(event) => setFiltroContrato(event.target.value as FiltroContrato)}
            aria-label="Filtrar por estado de contrato"
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/25 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="todos">Todos los contratos</option>
            <option value="actuales">Vigentes y por vencer</option>
            <option value="historial">Finalizados y cancelados</option>
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
      </ListToolbar>

      <TableWrap>
        <Table>
          <THead>
            <TR>
              <TH>Contrato</TH>
              <TH>Alumno</TH>
              <TH>Desde</TH>
              <TH>Hasta</TH>
              <TH>Estado</TH>
              <TH className="text-right">Acciones</TH>
            </TR>
          </THead>
          <TBody>
            {filas.length === 0 ? (
              <TR>
                <TD colSpan={6}>
                  <EmptyState
                    icon="contracts"
                    title={contratos.length ? "Sin resultados" : "Sin contratos"}
                    description={
                      contratos.length
                        ? "No hay contratos en esta vista con los filtros aplicados. Podés cambiar de vista o consultar Todos."
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
                    <TD>{formatFecha(fila.contrato.fechaDesde)}</TD>
                    <TD>{formatFecha(fila.contrato.fechaHasta)}</TD>
                    <TD>
                      <StatusBadge estado={fila.estado} />
                    </TD>
                    <TD className="text-right">
                      <Link to={`/contratos/${fila.contrato.idContrato}`} aria-label={`Ver detalle del contrato ${fila.contrato.idContrato}`}>
                        <Button size="sm" variant="outline">
                          Ver detalle
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
