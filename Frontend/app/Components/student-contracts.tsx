import { estadoContrato, tipoIngreso } from "../lib/domain";
import { formatARS, formatFecha } from "../lib/format";
import type { Alumno, Contrato } from "../lib/types";
import { Badge, StatusBadge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { EmptyState } from "./ui/empty-state";
import { Icon } from "./ui/icons";
import { StudentDetail } from "./student-detail";

export function StudentContracts({ contratos, alumno }: { contratos: Contrato[]; alumno: Alumno }) {
  if (!contratos.length) return <EmptyState icon="contracts" title="Sin contratos registrados" description="Acá vas a encontrar tu contrato y el historial de tus estadías." />;
  const activos = contratos.filter((c) => ["vigente", "por-vencer", "programado"].includes(estadoContrato(c)));
  const anteriores = contratos.filter((c) => !activos.includes(c));

  function tarjeta(c: Contrato) {
    const vigente = ["vigente", "por-vencer"].includes(estadoContrato(c));
    return <Card key={c.idContrato} className={`overflow-hidden rounded-3xl ${vigente ? "border-brand-200 shadow-sm dark:border-brand-800" : ""}`}>
      <div className={`flex flex-wrap items-start justify-between gap-4 border-b p-5 sm:p-6 ${vigente ? "border-brand-100 bg-linear-to-r from-brand-50 to-white dark:to-slate-900 dark:border-brand-900 dark:bg-brand-900/20" : "border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40"}`}>
        <div className="flex items-center gap-3"><span className={`rounded-xl p-3 ${vigente ? "bg-brand-600 text-white" : "bg-white text-slate-500 dark:bg-slate-800"}`}><Icon name="contracts" className="h-6 w-6" /></span><div><p className="text-xs font-medium text-slate-500">{tipoIngreso(c, contratos)} · {c.idContrato}</p><h3 className="mt-1 text-lg font-semibold">Estadía {c.fechaDesde.slice(0, 4)}{c.fechaDesde.slice(0, 4) !== c.fechaHasta.slice(0, 4) ? ` / ${c.fechaHasta.slice(0, 4)}` : ""}</h3></div></div>
        <StatusBadge estado={estadoContrato(c)} />
      </div>
      <CardContent className="space-y-6 p-5 sm:p-6">
        <div className="grid gap-4 rounded-2xl border border-brand-100 bg-brand-50/50 p-5 sm:grid-cols-3 dark:border-brand-900 dark:bg-brand-900/10">
          <div><p className="text-xs text-slate-500">Cuota mensual</p><p className="mt-1 text-2xl font-semibold tracking-tight">{c.montoMensual === undefined ? "Sin registrar" : formatARS(c.montoMensual)}</p></div>
          <div><p className="text-xs text-slate-500">Depósito de garantía</p><p className="mt-1 text-xl font-semibold">{c.depositoGarantia === undefined ? "Sin registrar" : formatARS(c.depositoGarantia)}</p></div>
          <div><p className="text-xs text-slate-500">Vencimiento de la cuota</p><p className="mt-1 text-xl font-semibold">{c.diaVencimientoPago ? `Día ${c.diaVencimientoPago}` : "Sin registrar"}</p>{c.diaVencimientoPago ? <p className="text-xs text-slate-500">de cada mes</p> : null}</div>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StudentDetail label="Titular" icon="user">{alumno.nombre} {alumno.apellido}</StudentDetail>
          <StudentDetail label="Documento" icon="contracts">{alumno.documento}</StudentDetail>
          <StudentDetail label="Firma del contrato" icon="check">{formatFecha(c.fechaFirma)}</StudentDetail>
          <StudentDetail label="Inicio de la estadía" icon="calendar">{formatFecha(c.fechaDesde)}</StudentDetail>
          <StudentDetail label="Fin pactado" icon="calendar">{formatFecha(c.fechaHasta)}</StudentDetail>
          <StudentDetail label="Tipo de ingreso" icon="building">{tipoIngreso(c, contratos)}</StudentDetail>
        </dl>
        <div><h4 className="text-sm font-semibold">Observaciones del contrato</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-500 dark:text-slate-400">{c.observaciones || "No hay observaciones registradas."}</p></div>
        {c.fechaCancelacion ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20"><h4 className="flex items-center gap-2 text-sm font-semibold text-red-800 dark:text-red-300"><Icon name="alert" className="h-4 w-4" />Baja de la estadía · {formatFecha(c.fechaCancelacion)}</h4><p className="mt-2 whitespace-pre-wrap text-sm text-red-700 dark:text-red-300">{c.motivoCancelacion || "Sin motivo registrado."}</p></div> : null}
      </CardContent>
    </Card>;
  }

  return <div className="space-y-8">
    <div className="flex flex-wrap items-center gap-2"><Badge variant="brand">{contratos.length} {contratos.length === 1 ? "contrato registrado" : "contratos registrados"}</Badge><span className="text-sm text-slate-500">Toda tu trayectoria en la residencia, en un solo lugar.</span></div>
    {activos.length ? <section className="space-y-4" aria-labelledby="contratos-actuales"><h2 id="contratos-actuales" className="text-lg font-semibold">Tu estadía actual y próximos ingresos</h2>{activos.map(tarjeta)}</section> : null}
    {anteriores.length ? <section className="space-y-4" aria-labelledby="contratos-historicos"><div><h2 id="contratos-historicos" className="text-lg font-semibold">Historial de contratos</h2><p className="mt-1 text-sm text-slate-500">Estadías anteriores, finalizadas o dadas de baja.</p></div>{anteriores.map(tarjeta)}</section> : null}
  </div>;
}
