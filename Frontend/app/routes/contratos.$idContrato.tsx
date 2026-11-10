import { Link, useParams } from "react-router";
import { Button } from "../Components/ui/button";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { Badge, StatusBadge } from "../Components/ui/badge";
import { asignacionActiva, diasHasta, estadoContrato } from "../lib/domain";
import { formatFecha } from "../lib/format";
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
        description="Detalle del contrato, alumno y asignación asociada"
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
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge estado={estado} />
        <Badge variant={alumno.estado === "activo" ? "success" : "neutral"}>
          Alumno {alumno.estado === "activo" ? "activo" : "inactivo"}
        </Badge>
        {["vigente", "por-vencer"].includes(estadoContrato(contrato)) ? asignacion ? <Badge variant="brand">Con habitación</Badge> : <Badge variant="warning">Sin habitación</Badge> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-300 bg-white shadow-sm p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <header className="mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Datos del contrato</h2>
            <p className="text-sm text-slate-500">Vigencia y estado calculado</p>
          </header>
          {contrato.fechaCancelacion ? <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">Baja efectiva: {formatFecha(contrato.fechaCancelacion)} · {contrato.motivoCancelacion}</p> : null}
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">ID Contrato</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{contrato.idContrato}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Días</dt>
              <dd className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                {estado === "cancelado" ? `Baja: ${formatFecha(contrato.fechaCancelacion!)}` : estado === "finalizado" ? (dias < 0 ? `Venció hace ${Math.abs(dias)} días` : "Finalizado") : dias === 0 ? "Vence hoy" : dias > 0 ? `Faltan ${dias} días` : `Venció hace ${Math.abs(dias)} días`}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Fecha desde</dt>
              <dd className="mt-1 text-sm text-slate-700 dark:text-slate-200">{formatFecha(contrato.fechaDesde)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Fecha hasta</dt>
              <dd className="mt-1 text-sm text-slate-700 dark:text-slate-200">{formatFecha(contrato.fechaHasta)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-300 bg-white shadow-sm p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <header className="mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Datos del alumno</h2>
            <p className="text-sm text-slate-500">Información del titular</p>
          </header>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Alumno</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                {alumno.apellido}, {alumno.nombre}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Documento</dt>
              <dd className="mt-1 text-sm text-slate-700 dark:text-slate-200">{alumno.documento}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Teléfono</dt>
              <dd className="mt-1 text-sm text-slate-700 dark:text-slate-200">{alumno.telefono}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Correo</dt>
              <dd className="mt-1 text-sm text-slate-700 dark:text-slate-200">{alumno.correo}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
