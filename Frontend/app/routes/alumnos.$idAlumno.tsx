import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { EmitirMultaDialog } from "../Components/actions/emitir-multa-dialog";
import { Button } from "../Components/ui/button";
import { ConfirmDialog } from "../Components/ui/confirm-dialog";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { Badge, StatusBadge } from "../Components/ui/badge";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "../Components/ui/table";
import { Tabs } from "../Components/ui/tabs";
import { useToast } from "../Components/ui/toast";
import { asignacionActiva, contratoVigente, diasHasta, estadoContrato, estadoMultaVisual } from "../lib/domain";
import { formatARS, formatFecha } from "../lib/format";
import { useData } from "../lib/store";
import type { Multa } from "../lib/types";

export function meta() {
  return [{ title: "Ficha de alumno · Gestión de Residencia" }];
}

export default function AlumnoDetalle() {
  const { idAlumno } = useParams();
  const { alumnos, contratos, asignaciones, habitaciones, pagos, multas, registrarPagoMulta, anularMulta } = useData();
  const { toast } = useToast();

  const [tab, setTab] = useState("resumen");
  const [multaAbierta, setMultaAbierta] = useState(false);
  const [multaAAnular, setMultaAAnular] = useState<Multa | null>(null);

  const alumno = useMemo(() => alumnos.find((a) => a.idAlumno === idAlumno), [alumnos, idAlumno]);

  const contrato = useMemo(() => (alumno ? contratoVigente(contratos, alumno.idAlumno) : undefined), [alumno, contratos]);
  const asignacion = useMemo(() => (alumno ? asignacionActiva(asignaciones, alumno.idAlumno) : undefined), [alumno, asignaciones]);
  const habitacion = useMemo(() => (asignacion ? habitaciones.find((h) => h.idHabitacion === asignacion.idHabitacion) : undefined), [asignacion, habitaciones]);

  const pagosAlumno = useMemo(
    () => [...pagos].filter((p) => p.idAlumno === idAlumno).sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [pagos, idAlumno],
  );
  const multasAlumno = useMemo(
    () => [...multas].filter((m) => m.idAlumno === idAlumno).sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision)),
    [multas, idAlumno],
  );

  const estContrato = contrato ? estadoContrato(contrato) : null;
  const dias = contrato ? diasHasta(contrato.fechaHasta) : null;
  const multasPendientes = multasAlumno.filter((m) => m.estado === "pendiente").length;

  if (!alumno) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Alumnos"
          title="Alumno no encontrado"
          description="No existe un alumno con el identificador solicitado."
        />
        <EmptyState
          icon="users"
          title="Sin resultados"
          description="Verificá la ruta o volvé al listado."
          action={
            <Link to="/alumnos">
              <Button>
                <Icon name="arrow" className="h-4 w-4 rotate-180" />
                Volver a alumnos
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  function pagarMulta(multa: Multa) {
    registrarPagoMulta(multa.idMulta);
    toast({
      title: "Pago de multa registrado",
      description: `${alumno!.nombre} ${alumno!.apellido} · ${formatARS(multa.monto)}`,
    });
  }

  function confirmarAnulacion() {
    if (!multaAAnular) return;
    anularMulta(multaAAnular.idMulta);
    toast({
      title: "Multa anulada",
      description: `${alumno!.nombre} ${alumno!.apellido} · ${formatARS(multaAAnular.monto)}`,
    });
  }

  const tabs = [
    { id: "resumen", label: "Resumen" },
    { id: "contrato", label: "Contrato" },
    { id: "habitacion", label: "Habitación" },
    { id: "pagos", label: "Pagos", count: pagosAlumno.length },
    { id: "multas", label: "Multas", count: multasAlumno.length },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Alumnos"
        title={`${alumno.apellido}, ${alumno.nombre}`}
        description={`DNI ${alumno.documento} · ${alumno.correo} · ${alumno.telefono}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/alumnos">
              <Button variant="outline">
                <Icon name="arrow" className="h-4 w-4 rotate-180" />
                Volver a alumnos
              </Button>
            </Link>
            <Button onClick={() => setMultaAbierta(true)}>
              <Icon name="fines" className="h-4 w-4" />
              Emitir multa
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {contrato ? <Badge variant="success">Contrato vigente</Badge> : <Badge variant="neutral">Sin contrato</Badge>}
        {asignacion ? <Badge variant="brand">Con habitación</Badge> : <Badge variant="warning">Sin habitación</Badge>}
        {multasPendientes > 0 ? <Badge variant="warning">{multasPendientes} multas pendientes</Badge> : null}
      </div>

      <Tabs items={tabs} value={tab} onChange={setTab} label="Secciones del alumno" />

      {tab === "resumen" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Datos personales</h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Nombre completo</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-white">{alumno.apellido}, {alumno.nombre}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Documento</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-white">{alumno.documento}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Correo</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-white">{alumno.correo}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Teléfono</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-white">{alumno.telefono}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Estado actual</h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Contrato</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-white">{contrato ? `Vence ${formatFecha(contrato.fechaHasta)} (${estContrato})` : "Sin contrato"}</dd>
                {dias !== null ? <p className="mt-0.5 text-xs text-slate-500">{dias <= 0 ? "Vencido" : dias <= 30 ? `Vence en ${dias} días` : `Quedan ${dias} días`}</p> : null}
              </div>
              <div>
                <dt className="text-xs text-slate-500">Habitación</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-white">{habitacion ? `Hab. ${habitacion.numeroHabitacion}` : "Sin asignar"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Pagos registrados</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-white">{pagosAlumno.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Multas</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-white">{multasAlumno.length} ({multasPendientes} pendientes)</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}

      {tab === "contrato" ? (
        contrato ? (
          <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Contrato vigente</h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-500">Desde</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-white">{formatFecha(contrato.fechaDesde)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Hasta</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-white">{formatFecha(contrato.fechaHasta)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Estado / Días</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-white">{estContrato} {dias !== null ? `· ${dias <= 0 ? "Vencido" : `${dias} días`}` : ""}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <EmptyState icon="search" title="Sin contrato" description="Este alumno no tiene un contrato vigente." />
        )
      ) : null}

      {tab === "habitacion" ? (
        asignacion && habitacion ? (
          <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Asignación activa</h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-4">
              <div>
                <dt className="text-xs text-slate-500">Habitación</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-white">Hab. {habitacion.numeroHabitacion}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Capacidad</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-white">{habitacion.capacidadMaxima} personas</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Desde</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-white">{formatFecha(asignacion.fechaDesde)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Descripción</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-white">{habitacion.descripcion}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <EmptyState icon="building" title="Sin asignación" description="Este alumno no tiene una habitación asignada actualmente." />
        )
      ) : null}

      {tab === "pagos" ? (
        pagosAlumno.length === 0 ? (
          <EmptyState icon="payments" title="Sin pagos" description="No hay pagos registrados para este alumno." />
        ) : (
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH>Fecha</TH>
                  <TH>Concepto</TH>
                  <TH className="text-right">Monto</TH>
                </TR>
              </THead>
              <TBody>
                {pagosAlumno.map((pago) => (
                  <TR key={pago.idPago}>
                    <TD>{formatFecha(pago.fecha)}</TD>
                    <TD>{pago.concepto}</TD>
                    <TD className="text-right tabular-nums">{formatARS(pago.monto)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        )
      ) : null}

      {tab === "multas" ? (
        multasAlumno.length === 0 ? (
          <EmptyState icon="fines" title="Sin multas" description="No hay multas registradas para este alumno." />
        ) : (
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH>Fecha emisión</TH>
                  <TH>Vence</TH>
                  <TH>Estado</TH>
                  <TH className="text-right">Monto</TH>
                  <TH className="text-right">Acciones</TH>
                </TR>
              </THead>
              <TBody>
                {multasAlumno.map((multa) => {
                  const ev = estadoMultaVisual(multa);
                  return (
                    <TR key={multa.idMulta}>
                      <TD>{formatFecha(multa.fechaEmision)}</TD>
                      <TD>{formatFecha(multa.fechaVence)}</TD>
                      <TD>
                        <StatusBadge estado={ev} />
                      </TD>
                      <TD className="text-right tabular-nums">{formatARS(multa.monto)}</TD>
                      <TD className="text-right">
                        {multa.estado === "pendiente" ? (
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="outline" onClick={() => pagarMulta(multa)}>
                              Pagar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setMultaAAnular(multa)}>
                              Anular
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </TableWrap>
        )
      ) : null}

      <EmitirMultaDialog open={multaAbierta} onClose={() => setMultaAbierta(false)} />

      <ConfirmDialog
        open={Boolean(multaAAnular)}
        onClose={() => setMultaAAnular(null)}
        onConfirm={confirmarAnulacion}
        title="Anular multa"
        description={multaAAnular ? `Se anulará la multa de ${alumno.nombre} ${alumno.apellido} por ${formatARS(multaAAnular.monto)}.` : undefined}
        confirmLabel="Anular multa"
      />
    </div>
  );
}
