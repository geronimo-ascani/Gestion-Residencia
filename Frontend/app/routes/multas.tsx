import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Badge, StatusBadge } from "../Components/ui/badge";
import { Button } from "../Components/ui/button";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { ListSummary, ListToolbar } from "../Components/ui/list-page";
import { PageHeader } from "../Components/ui/page-header";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "../Components/ui/table";
import { estadoMultaVisual } from "../lib/domain";
import { formatARS, formatFecha } from "../lib/format";
import { useData } from "../lib/store";
import { useDebouncedValue } from "../lib/use-debounced-value";

type FiltroMulta = "todas" | "pendiente" | "vencida" | "pagada" | "anulada";

export function meta() {
  return [{ title: "Multas · Gestión de Residencia" }];
}

export default function Multas() {
  const { multas, alumnoPorId } = useData();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<FiltroMulta>("todas");
  const busquedaDebounceada = useDebouncedValue(busqueda);

  const filas = useMemo(() => {
    const termino = busquedaDebounceada.trim().toLocaleLowerCase();
    return multas
      .map((multa) => ({
        multa,
        alumno: alumnoPorId.get(multa.idAlumno),
        estado: estadoMultaVisual(multa),
      }))
      .filter(({ multa, alumno, estado }) => {
        if (filtro !== "todas" && estado !== filtro) return false;
        if (!termino) return true;
        return [
          multa.idMulta,
          alumno?.nombre ?? "",
          alumno?.apellido ?? "",
          alumno?.documento ?? "",
        ].some((dato) => dato.toLocaleLowerCase().includes(termino));
      })
      .sort((a, b) =>
        a.multa.fechaVence.localeCompare(b.multa.fechaVence) ||
        a.multa.idMulta.localeCompare(b.multa.idMulta),
      );
  }, [alumnoPorId, busquedaDebounceada, filtro, multas]);



  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Residencia"
        title="Multas"
        description="Consultá las multas y el estado de los pagos de los alumnos."
        actions={
          <Link to="/multas/nueva">
            <Button>
              <Icon name="plus" className="h-4 w-4" />
              Emitir multa
            </Button>
          </Link>
        }
      />

      <ListSummary title="Resumen de multas" description="Seguimiento de las sanciones y sus pagos" icon="fines" items={[
        { label: "Multas registradas", value: multas.length },
        { label: "Pendientes", value: multas.filter((m) => estadoMultaVisual(m) === "pendiente").length },
        { label: "Vencidas", value: multas.filter((m) => estadoMultaVisual(m) === "vencida").length },
        { label: "Pagadas", value: multas.filter((m) => estadoMultaVisual(m) === "pagada").length },
      ]} />

      <ListToolbar title="Listado de multas" count={filas.length} search={busqueda} onSearch={setBusqueda} placeholder="Buscar por multa, alumno o DNI…" searchLabel="Buscar multas">
        <select
          value={filtro}
          onChange={(event) => setFiltro(event.target.value as FiltroMulta)}
          aria-label="Filtrar multas por estado"
          className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/25 sm:w-auto dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="todas">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="vencida">Vencidas</option>
          <option value="pagada">Pagadas</option>
          <option value="anulada">Anuladas</option>
        </select>
      </ListToolbar>

      <TableWrap>
        <Table>
          <THead>
            <TR>
              <TH>Multa</TH>
              <TH>Alumno</TH>
              <TH className="hidden sm:table-cell">Emisión</TH>
              <TH>Vencimiento</TH>
              <TH>Estado</TH>
              <TH className="text-right">Monto</TH>
              <TH className="text-right">Acciones</TH>
            </TR>
          </THead>
          <TBody>
            {filas.length === 0 ? (
              <TR>
                <TD colSpan={7}>
                  <EmptyState
                    icon="fines"
                    title={multas.length ? "Sin resultados" : "Sin multas"}
                    description={
                      multas.length
                        ? "No hay multas que coincidan con la búsqueda y el estado seleccionados."
                        : "Todavía no se emitieron multas."
                    }
                    action={
                      multas.length ? undefined : (
                        <Link to="/multas/nueva">
                          <Button>
                            <Icon name="plus" className="h-4 w-4" />
                            Emitir multa
                          </Button>
                        </Link>
                      )
                    }
                  />
                </TD>
              </TR>
            ) : (
              filas.map(({ multa, alumno, estado }) => (
                <TR key={multa.idMulta}>
                  <TD>
                    <Link
                      to={`/multas/${multa.idMulta}`}
                      className="font-medium text-brand-700 hover:underline dark:text-brand-300"
                    >
                      {multa.idMulta}
                    </Link>
                  </TD>
                  <TD>
                    {alumno ? (
                      <Link
                        to={`/alumnos/${alumno.idAlumno}`}
                        className="group flex flex-col"
                      >
                        <span className="font-medium text-slate-900 group-hover:underline dark:text-white">
                          {alumno.apellido}, {alumno.nombre}
                        </span>
                        <span className="text-xs text-slate-500">
                          DNI {alumno.documento}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-slate-500">Alumno no disponible</span>
                    )}
                  </TD>
                  <TD className="hidden sm:table-cell">
                    {formatFecha(multa.fechaEmision)}
                  </TD>
                  <TD>{formatFecha(multa.fechaVence)}</TD>
                  <TD>
                    <StatusBadge estado={estado} />
                  </TD>
                  <TD className="text-right tabular-nums">
                    <Badge variant="neutral">{formatARS(multa.monto)}</Badge>
                  </TD>
                  <TD className="text-right">
                    <div className="flex justify-end gap-1">
                      {multa.estado === "pendiente" ? (
                        <Link to={`/multas/${multa.idMulta}/editar`}>
                          <Button size="sm" variant="ghost">
                            Editar
                          </Button>
                        </Link>
                      ) : null}
                      <Link to={`/multas/${multa.idMulta}`}>
                        <Button size="sm" variant="outline">
                          Ver detalle
                          <Icon name="arrow" className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </TableWrap>
    </div>
  );
}