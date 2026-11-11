import { Link } from "react-router";
import { estadoContrato, tipoIngreso } from "../lib/domain";
import { formatFecha } from "../lib/format";
import type { Contrato } from "../lib/types";
import { Badge, StatusBadge } from "./ui/badge";
import { EmptyState } from "./ui/empty-state";

export function AlumnoContratos({ contratos, idVigente }: { contratos: Contrato[]; idVigente?: string }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
    <h2 className="text-base font-semibold text-slate-900 dark:text-white">Historial de contratos</h2>
    <p className="mt-1 text-sm text-slate-500">Todos los períodos, del más reciente al más antiguo. Las renovaciones y los reingresos conservan sus fechas.</p>
    {contratos.length === 0 ? <EmptyState icon="contracts" title="Sin contratos registrados" description="Creá el primer contrato para registrar el ingreso del alumno." /> :
      <ol className="mt-5 space-y-4">{contratos.map((c) => <li key={c.idContrato} className={`rounded-lg border p-4 ${c.idContrato === idVigente ? "border-brand-200 bg-brand-50/50 dark:border-brand-800 dark:bg-brand-900/20" : "border-slate-200 dark:border-slate-800"}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2"><Link className="font-medium text-brand-700 hover:underline dark:text-brand-300" to={`/contratos/${c.idContrato}`}>{c.idContrato}</Link><Badge>{tipoIngreso(c, contratos)}</Badge>{c.idContrato === idVigente ? <Badge variant="success">Actual</Badge> : null}</div>
          <StatusBadge estado={estadoContrato(c)} />
        </div>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div><dt className="text-xs text-slate-500">Inicio del contrato</dt><dd className="mt-1">{formatFecha(c.fechaDesde)}</dd></div>
          <div><dt className="text-xs text-slate-500">Fin pactado</dt><dd className="mt-1">{formatFecha(c.fechaHasta)}</dd></div>
          <div><dt className="text-xs text-slate-500">Baja efectiva</dt><dd className="mt-1">{c.fechaCancelacion ? formatFecha(c.fechaCancelacion) : estadoContrato(c) === "finalizado" ? formatFecha(c.fechaHasta) : "—"}</dd></div>
        </dl>
        {c.motivoCancelacion ? <p className="mt-3 break-words text-sm text-slate-600 dark:text-slate-300">Motivo de baja: {c.motivoCancelacion}</p> : null}
      </li>)}</ol>}
  </section>;
}
