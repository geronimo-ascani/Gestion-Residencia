import { Link, useParams } from "react-router";
import { Button } from "../Components/ui/button";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { Badge, StatusBadge } from "../Components/ui/badge";
import { asignacionActiva, diasHasta, estadoContrato } from "../lib/domain";
import { formatFecha, formatARS } from "../lib/format";
import { useData } from "../lib/store";

export function meta() {
  return [{ title: "Detalle de contrato · Gestión de Residencia" }];
}

export default function ContratoDetalle() {
  const { idContrato } = useParams();
  const { contratos, alumnos, asignaciones, alumnoPorId } = useData();

  const contrato = contratos.find((c) => c.idContrato === idContrato);
  const alumno = contrato ? alumnoPorId.get(contrato.idAlumno) ?? alumnos.find((a) => a.idAlumno === contrato.idAlumno) : undefined;
  const asignacion = contrato && ["vigente", "por-vencer"].includes(estadoContrato(contrato)) ? asignacionActiva(asignaciones, contrato.idAlumno) : undefined;

  if (!contrato || !alumno) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Contratos"
          title="Contrato no encontrado"
          description="El contrato solicitado no existe o fue eliminado."
          actions={
            <Button variant="ghost">
              <Link to="/contratos">
                <span className="inline-flex items-center gap-2">
                  <Icon name="chevron" className="h-4 w-4 rotate-90" />
                  Volver a contratos
                </span>
              </Link>
            </Button>
          }
        />
        <EmptyState
          icon="contracts"
          title="Contrato no encontrado"
          description="Verificá el enlace o volvé al listado de contratos."
          action={
            <Button>
              <Link to="/contratos"><span>Ir a contratos</span></Link>
            </Button>
          }
        />
      </div>
    );
  }

  const estado = estadoContrato(contrato);
  const dias = diasHasta(contrato.fechaHasta);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Contratos"
        title={`Contrato ${contrato.idContrato}`}
        description="Ficha formal con los datos y condiciones registrados para este contrato."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost">
              <Link to="/contratos">
                <span className="inline-flex items-center gap-2">
                  <Icon name="chevron" className="h-4 w-4 rotate-90" />
                  Volver a contratos
                </span>
              </Link>
            </Button>
            <Button>
              <Link to={`/alumnos/${alumno.idAlumno}`}>
                <span className="inline-flex items-center gap-2">
                  Ver ficha del alumno
                  <Icon name="chevron" className="h-4 w-4 rotate-[-90deg]" />
                </span>
              </Link>
            </Button>
            <Link to={`/facturacion/nueva?contrato=${contrato.idContrato}`}><Button variant="outline"><Icon name="payments" className="h-4 w-4" />Generar factura</Button></Link>
          </div>
        }
      />

      <article className="mx-auto w-full max-w-5xl overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
        <header className="border-b-2 border-brand-700 bg-slate-50 px-6 py-6 dark:bg-slate-900 sm:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Gestión de Residencia · Contrato de alojamiento</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Ficha del contrato</h2>
            <p className="mt-1 text-sm text-slate-500">Identificación: {contrato.idContrato}</p>
          </div>
        </header>
        <div className="space-y-8 px-6 py-7 sm:px-10">
          <section>
            <h3 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-800 dark:text-slate-200">1. Datos del titular</h3>
            <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Apellido y nombre</dt><dd className="mt-1 font-medium text-slate-900 dark:text-white">{alumno.apellido}, {alumno.nombre}</dd></div>
              <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Documento</dt><dd className="mt-1">{alumno.documento}</dd></div>
              <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Teléfono</dt><dd className="mt-1">{alumno.telefono}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Correo electrónico</dt><dd className="mt-1 break-words">{alumno.correo}</dd></div>
              {alumno.domicilio ? <div className="sm:col-span-2"><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Domicilio de origen</dt><dd className="mt-1">{alumno.domicilio}{alumno.localidad ? `, ${alumno.localidad}` : ""}{alumno.provincia ? `, ${alumno.provincia}` : ""}</dd></div> : null}
            </dl>
          </section>
          <section>
            <h3 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-800 dark:text-slate-200">2. Identificación y vigencia</h3>
            <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Número de contrato</dt><dd className="mt-1 font-medium">{contrato.idContrato}</dd></div>
              <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Fecha de firma</dt><dd className="mt-1">{contrato.fechaFirma ? formatFecha(contrato.fechaFirma) : "Sin registrar"}</dd></div>
              <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Desde</dt><dd className="mt-1">{formatFecha(contrato.fechaDesde)}</dd></div>
              <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Hasta</dt><dd className="mt-1">{formatFecha(contrato.fechaHasta)}</dd></div>
              <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Habitación</dt><dd className="mt-1">{["vigente", "por-vencer"].includes(estado) ? asignacion?.idHabitacion ?? "Sin habitación asignada" : "No corresponde"}</dd></div>
              {contrato.fechaCancelacion ? <div className="sm:col-span-2 lg:col-span-3"><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Baja efectiva y motivo</dt><dd className="mt-1">{formatFecha(contrato.fechaCancelacion)}{contrato.motivoCancelacion ? ` · ${contrato.motivoCancelacion}` : ""}</dd></div> : null}
            </dl>
          </section>
          <section>
            <h3 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-800 dark:text-slate-200">3. Condiciones económicas</h3>
            <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Importe mensual</dt><dd className="mt-1 font-semibold">{contrato.montoMensual !== undefined ? formatARS(contrato.montoMensual) : "Sin registrar"}</dd></div>
              <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Depósito de garantía</dt><dd className="mt-1">{contrato.depositoGarantia !== undefined ? formatARS(contrato.depositoGarantia) : "Sin registrar"}</dd></div>
              <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Vencimiento del pago</dt><dd className="mt-1">{contrato.diaVencimientoPago ? `Día ${contrato.diaVencimientoPago} de cada mes` : "Sin registrar"}</dd></div>
            </dl>
          </section>
          <section>
            <h3 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-800 dark:text-slate-200">4. Observaciones y condiciones particulares</h3>
            <p className="mt-4 min-h-12 whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-300">{contrato.observaciones?.trim() || "Sin observaciones registradas."}</p>
          </section>
          <footer className="border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800">Documento de consulta · Datos correspondientes al contrato {contrato.idContrato}</footer>
        </div>
      </article>
    </div>
  );
}
