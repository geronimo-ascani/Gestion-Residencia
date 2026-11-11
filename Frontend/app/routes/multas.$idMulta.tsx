import { Dialog } from "../Components/ui/dialog";
import { hojaMulta, SeccionMulta } from "../Components/multa-form";
import { extenderMes, importeMulta, TIPOS_MULTA } from "../lib/multas";
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
  const { multas, facturas, alumnoPorId, registrarPagoMulta, anularMulta, extenderPlazoMulta } = useData();
  const factura = facturas.find((f) => f.detalles.some((d) => d.idMulta === idMulta));
  const { toast } = useToast();
  const [confirmacion, setConfirmacion] = useState<"pago" | "anular" | null>(null);
  const [prorrogaAbierta, setProrrogaAbierta] = useState(false);
  const [motivoProrroga, setMotivoProrroga] = useState("");
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
        description: `${formatARS(importeMulta(multa).total)} · ${multa.idMulta}`,
      });
    } else if (confirmacion === "anular") {
      anularMulta(multa.idMulta);
      toast({
        title: "Multa cancelada",
        description: `${formatARS(importeMulta(multa).total)} · ${multa.idMulta}`,
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
            {multa.estado === "pendiente" && !factura ? (
              <>
                <Link to={`/multas/${multa.idMulta}/editar`}>
                  <Button variant="outline">Modificar</Button>
                </Link>
                <Button variant="danger" onClick={() => setConfirmacion("anular")}>Cancelar multa</Button>
                <Button variant="outline" onClick={() => { setMotivoProrroga(""); setProrrogaAbierta(true); }}>Extender pago un mes</Button>
                <Button onClick={() => setConfirmacion("pago")}><Icon name="check" className="h-4 w-4" />Registrar pago</Button>
              </>
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

      {factura ? <p className="rounded-lg border border-brand-200 bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-900">Esta multa está incluida en la factura <Link to={`/facturacion/${factura.idFactura}`} className="font-medium text-brand-700 underline dark:text-brand-300">{factura.idFactura}</Link>. Sus cobros se registran desde la factura y sus condiciones de emisión se conservan.</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge estado={estado} />
        <Badge variant="neutral">{formatARS(importeMulta(multa).total)}</Badge>
      </div>

      <article className={hojaMulta}>
        <div className="border-b-2 border-brand-600 pb-5"><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Gestión de Residencia · Administración</p><h2 className="mt-2 text-2xl font-semibold">Acta de sanción económica</h2><p className="mt-2 text-sm text-slate-500">Referencia {multa.idMulta} · Emisión conjunta {multa.idEmision ?? "No registrada"}</p></div>
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
                {formatARS(importeMulta(multa).total)}
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
        <SeccionMulta titulo="Clasificación y fundamento">
          <dl className="space-y-4 text-sm"><div><dt className="text-slate-500">Tipo de multa</dt><dd className="mt-1 font-medium">{TIPOS_MULTA.find((t) => t.id === multa.tipo)?.nombre ?? "Sin clasificación (registro anterior)"}</dd></div><div><dt className="text-slate-500">Motivo</dt><dd className="mt-1 whitespace-pre-wrap">{multa.motivo ?? "No registrado"}</dd></div></dl>
        </SeccionMulta>
        <SeccionMulta titulo="Daños y observaciones">
          <dl className="space-y-4 text-sm"><div><dt className="text-slate-500">Rotura o daño de bienes</dt><dd className="mt-1">{multa.huboDanios === undefined ? "No registrado" : multa.huboDanios ? "Sí" : "No"}</dd></div>{multa.huboDanios && <div><dt className="text-slate-500">Detalle del daño</dt><dd className="mt-1 whitespace-pre-wrap">{multa.detalleDanios || "No registrado"}</dd></div>}<div><dt className="text-slate-500">Observaciones</dt><dd className="mt-1 whitespace-pre-wrap">{multa.observaciones || "Sin observaciones"}</dd></div></dl>
        </SeccionMulta>
        <SeccionMulta titulo="Liquidación y condiciones de cobro">
          <p className="text-sm">Sanción: {formatARS(multa.montoSancion ?? multa.monto)} · Reparación o reposición: {formatARS(multa.montoDanios ?? 0)}</p>
          <dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Período de incorporación</dt><dd>{multa.periodoDesde ?? "No registrado"}</dd></div><div><dt className="text-slate-500">Último período sin recargo</dt><dd>{multa.periodoHasta ?? "No registrado"}</dd></div><div><dt className="text-slate-500">Sanción + daños</dt><dd>{formatARS(multa.monto)}</dd></div><div><dt className="text-slate-500">Recargo único por mora (20%)</dt><dd>{formatARS(importeMulta(multa).recargo)}</dd></div><div><dt className="text-slate-500">{multa.estado === "pagada" ? "Total pagado" : "Total a pagar"}</dt><dd className="text-xl font-semibold">{formatARS(importeMulta(multa).total)}</dd></div></dl>
          <p className="text-sm text-slate-500">La multa se agrega al cobro mensual del mes siguiente. Si se emite después del día 15, puede cancelarse hasta la segunda factura siguiente. El recargo se aplica una sola vez al importe de la multa al superar el vencimiento.</p>
        </SeccionMulta>
        <SeccionMulta titulo="Historial de modificaciones">
          {!multa.historial?.length ? <p className="text-sm text-slate-500">No se registraron modificaciones.</p> : <ol className="space-y-4">{[...multa.historial].reverse().map((entrada, indice) => <li key={`${entrada.fecha}-${indice}`} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex flex-wrap justify-between gap-2"><h3 className="text-sm font-semibold">{entrada.accion === "prorroga" ? "Extensión del plazo de pago" : "Edición de la multa"}</h3><time dateTime={entrada.fecha} className="text-xs text-slate-500">{new Date(entrada.fecha).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}</time></div>
            {entrada.motivo && <p className="mt-2 whitespace-pre-wrap text-sm">Motivo: {entrada.motivo}</p>}
            <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-slate-500"><tr><th className="p-2">Campo</th><th className="p-2">Valor anterior</th><th className="p-2">Nuevo valor</th></tr></thead><tbody>{entrada.cambios.map((cambio) => <tr key={cambio.campo} className="border-t border-slate-100 dark:border-slate-800"><th scope="row" className="p-2 font-medium">{cambio.campo}</th><td className="whitespace-pre-wrap break-words p-2">{cambio.anterior}</td><td className="whitespace-pre-wrap break-words p-2">{cambio.nuevo}</td></tr>)}</tbody></table></div>
          </li>)}</ol>}
        </SeccionMulta>
      </article>



      <Dialog open={prorrogaAbierta} onClose={() => setProrrogaAbierta(false)} title="Extender pago un mes" description="Otorgá un plazo excepcional para esta multa. El cambio quedará registrado en el historial.">
        <form className="space-y-4" onSubmit={(event) => {
          event.preventDefault();
          if (!motivoProrroga.trim()) return;
          extenderPlazoMulta(multa.idMulta, motivoProrroga);
          setProrrogaAbierta(false);
          toast({ title: "Plazo extendido", description: `Nuevo vencimiento: ${formatFecha(extenderMes(multa.fechaVence))}` });
        }}>
          <dl className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-800"><div><dt className="text-slate-500">Vencimiento actual</dt><dd className="mt-1">{formatFecha(multa.fechaVence)}</dd></div><div><dt className="text-slate-500">Nuevo vencimiento</dt><dd className="mt-1 font-semibold">{formatFecha(extenderMes(multa.fechaVence))}</dd></div></dl>
          <p className="text-sm text-slate-500">El recargo se calculará a partir del nuevo vencimiento. La multa mantiene su importe base y su primera factura de cobro.</p>
          <label htmlFor="motivo-prorroga" className="block text-sm font-medium">Motivo de la extensión *<textarea id="motivo-prorroga" required maxLength={4000} value={motivoProrroga} onChange={(event) => setMotivoProrroga(event.target.value)} className="mt-2 min-h-24 w-full rounded-md border border-slate-400 bg-transparent p-3" /></label>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setProrrogaAbierta(false)}>Cancelar</Button><Button type="submit" disabled={!motivoProrroga.trim()}>Confirmar extensión</Button></div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={confirmacion === "pago"}
        onClose={() => setConfirmacion(null)}
        onConfirm={confirmarCambio}
        title="Registrar pago"
        description={`Se registrará el pago de ${formatARS(importeMulta(multa).total)} para esta multa.`}
        confirmLabel="Registrar pago"
        tone="brand"
      />
      <ConfirmDialog
        open={confirmacion === "anular"}
        onClose={() => setConfirmacion(null)}
        onConfirm={confirmarCambio}
        title="Cancelar multa"
        description="La multa se conservará en el historial con estado anulada."
        confirmLabel="Cancelar multa"
      />
    </div>
  );
}
