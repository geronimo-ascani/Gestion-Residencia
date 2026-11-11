import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Badge, StatusBadge } from "../Components/ui/badge";
import { Button } from "../Components/ui/button";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { ListSummary, ListToolbar } from "../Components/ui/list-page";
import { Tabs } from "../Components/ui/tabs";
import { PageHeader } from "../Components/ui/page-header";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "../Components/ui/table";
import { importeMulta } from "../lib/multas";
import { estadoMultaVisual } from "../lib/domain";
import { formatARS, formatFecha } from "../lib/format";
import { useData } from "../lib/store";
import { useDebouncedValue } from "../lib/use-debounced-value";

const vistas = [
  { id: "pendiente", label: "Vigentes" },
  { id: "vencida", label: "Vencidas" },
  { id: "pagada", label: "Pagas" },
  { id: "todas", label: "Todas" },
] as const;
type FiltroMulta = (typeof vistas)[number]["id"];
const prioridadEstado = { pendiente: 0, vencida: 1, pagada: 2, anulada: 3 };

export function meta() {
  return [{ title: "Multas · Gestión de Residencia" }];
}

export default function Multas() {
  const { multas, alumnoPorId } = useData();
  const [params] = useSearchParams();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<FiltroMulta>(params.get("vista") === "vencida" ? "vencida" : "pendiente");
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
        prioridadEstado[a.estado] - prioridadEstado[b.estado] ||
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

      <Tabs label="Vistas de multas" className="flex-wrap self-start" value={filtro}
        items={vistas.map((vista) => ({ ...vista, count: vista.id === "todas" ? multas.length : multas.filter((multa) => estadoMultaVisual(multa) === vista.id).length }))}
        onChange={(value) => setFiltro(value as FiltroMulta)} />

      <ListToolbar title="Listado de multas" count={filas.length} search={busqueda} onSearch={setBusqueda} placeholder="Buscar por multa, alumno o DNI…" searchLabel="Buscar multas" />

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
                        ? "No hay multas en esta vista con la búsqueda aplicada. Podés cambiar de vista o consultar Todas."
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
                    <Badge variant="neutral">{formatARS(importeMulta(multa).total)}</Badge>
                  </TD>
                  <TD className="text-right">
                    <div className="flex justify-end gap-1">
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
