import { useState } from "react";
import { Link, useParams } from "react-router";
import { Button } from "../Components/ui/button";
import { ConfirmDialog } from "../Components/ui/confirm-dialog";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { Badge, StatusBadge } from "../Components/ui/badge";
import { useToast } from "../Components/ui/toast";
import { estadoMultaVisual } from "../lib/domain";
import { formatARS, formatFecha } from "../lib/format";
import { useData } from "../lib/store";

export function meta() {
  return [{ title: "Detalle de multa · Gestión de Residencia" }];
}

export default function MultaDetalle() {
  const { idMulta } = useParams();
  const { multas, alumnoPorId, registrarPagoMulta, anularMulta } = useData();
  const { toast } = useToast();
  const [confirmacion, setConfirmacion] = useState<"pago" | "anular" | null>(null);
  const multa = multas.find((item) => item.idMulta === idMulta);
  const alumno = multa ? alumnoPorId.get(multa.idAlumno) : undefined;

  if (!multa) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Multas"
          title="Multa no encontrada"
          description="No existe una multa con el identificador solicitado."
        />
        <EmptyState
          icon="fines"
          title="Sin resultados"
          description="Verificá la ruta o volvé al listado de multas."
          action={
            <Link to="/multas">
              <Button>
                <Icon name="arrow" className="h-4 w-4 rotate-180" />
                Volver a multas
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  function confirmarCambio() {
    if (!multa) return;
    if (confirmacion === "pago") {
      registrarPagoMulta(multa.idMulta);
      toast({
        title: "Pago registrado",
        description: `${formatARS(multa.monto)} · ${multa.idMulta}`,
      });
    } else if (confirmacion === "anular") {
      anularMulta(multa.idMulta);
      toast({
        title: "Multa anulada",
        description: `${formatARS(multa.monto)} · ${multa.idMulta}`,
      });
    }
  }

  const estado = estadoMultaVisual(multa);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Multas"
        title={`Multa ${multa.idMulta}`}
        description="Detalle, estado y acciones de la multa."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {multa.estado === "pendiente" ? (
              <Link to={`/multas/${multa.idMulta}/editar`}>
                <Button variant="outline">
                  <Icon name="check" className="h-4 w-4" />
                  Editar multa
                </Button>
              </Link>
            ) : null}
            <Link to="/multas">
              <Button variant="outline">
                <Icon name="arrow" className="h-4 w-4 rotate-180" />
                Listado de multas
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge estado={estado} />
        <Badge variant="neutral">{formatARS(multa.monto)}</Badge>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Datos de la multa
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">Fecha de emisión</dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                {formatFecha(multa.fechaEmision)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Fecha de vencimiento</dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                {formatFecha(multa.fechaVence)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Fecha de pago</dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                {formatFecha(multa.fechaPago)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Monto</dt>
              <dd className="mt-1 text-sm font-medium tabular-nums text-slate-900 dark:text-white">
                {formatARS(multa.monto)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Alumno
          </h2>
          {alumno ? (
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-500">Titular</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                  <Link
                    to={`/alumnos/${alumno.idAlumno}`}
                    className="text-brand-700 hover:underline dark:text-brand-300"
                  >
                    {alumno.apellido}, {alumno.nombre}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Documento</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                  {alumno.documento}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Correo</dt>
                <dd className="mt-1 break-all text-sm text-slate-900 dark:text-white">
                  {alumno.correo}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              El alumno asociado ya no está disponible.
            </p>
          )}
        </div>
      </section>

      {multa.estado === "pendiente" ? (
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Button variant="outline" onClick={() => setConfirmacion("anular")}>
            Anular multa
          </Button>
          <Button onClick={() => setConfirmacion("pago")}>
            <Icon name="check" className="h-4 w-4" />
            Registrar pago
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmacion === "pago"}
        onClose={() => setConfirmacion(null)}
        onConfirm={confirmarCambio}
        title="Registrar pago"
        description={`Se registrará el pago de ${formatARS(multa.monto)} para esta multa.`}
        confirmLabel="Registrar pago"
        tone="brand"
      />
      <ConfirmDialog
        open={confirmacion === "anular"}
        onClose={() => setConfirmacion(null)}
        onConfirm={confirmarCambio}
        title="Anular multa"
        description="La multa se conservará en el historial con estado anulada."
        confirmLabel="Anular multa"
      />
    </div>
  );
}