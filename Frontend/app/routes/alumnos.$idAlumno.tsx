import { AlumnoFichaModulo, DatosModulo } from "../Components/alumno-ficha-modulo";
import { contactosDeAlumno } from "../lib/modulos-alumno";
import { AlumnoCuenta } from "../Components/alumno-cuenta";
import { importeMulta } from "../lib/multas";
import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { AlumnoContratos } from "../Components/alumno-contratos";
import { AsignarHabitacionDialog } from "../Components/actions/asignar-habitacion-dialog";
import { FECHA_REFERENCIA } from "../lib/config";
import { Button, ButtonLink } from "../Components/ui/button";
import { ConfirmDialog } from "../Components/ui/confirm-dialog";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { Badge, StatusBadge } from "../Components/ui/badge";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "../Components/ui/table";
import { Tabs } from "../Components/ui/tabs";
import { useToast } from "../Components/ui/toast";
import { asignacionActiva, contratoVigente, diasHasta, estadoContrato, estadoMultaVisual, sumarDia } from "../lib/domain";
import { formatARS, formatFecha } from "../lib/format";
import { facturaActivaDeMulta } from "../lib/facturacion";
import { useData } from "../lib/store";
import type { Multa } from "../lib/types";

export function meta() {
  return [{ title: "Ficha de alumno · Gestión de Residencia" }];
}

export default function AlumnoDetalle() {
  const { idAlumno } = useParams();
  const [params] = useSearchParams();
  const origen = params.get("origen");
  const volver = origen === "historico" || origen === "pendientes" ? `/alumnos?vista=${origen}` : "/alumnos";
  const { alumnos, contratos, asignaciones, habitaciones, pagos, facturas, multas, registrarPagoMulta, anularMulta } = useData();
  const { toast } = useToast();

  const [tab, setTab] = useState("resumen");
  const [multaAAnular, setMultaAAnular] = useState<Multa | null>(null);
  const [cambioHabitacionAbierto, setCambioHabitacionAbierto] = useState(false);

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

  const contratosAlumno = useMemo(() => contratos.filter((c) => c.idAlumno === idAlumno).sort((a, b) => b.fechaDesde.localeCompare(a.fechaDesde)), [contratos, idAlumno]);
  const proximoContrato = contratosAlumno.filter((c) => c.fechaDesde > FECHA_REFERENCIA && !c.fechaCancelacion).sort((a, b) => a.fechaDesde.localeCompare(b.fechaDesde))[0];
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
            <ButtonLink to={volver}>
                <Icon name="arrow" className="h-4 w-4 rotate-180" />
                Volver a alumnos
              </ButtonLink>
          }
        />
      </div>
    );
  }

  function pagarMulta(multa: Multa) {
    registrarPagoMulta(multa.idMulta);
    toast({
      title: "Pago de multa registrado",
      description: `${alumno!.nombre} ${alumno!.apellido} · ${formatARS(importeMulta(multa).total)}`,
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

  const contactos = contactosDeAlumno(alumno);
  const search = params.toString();

  const tabs = [
    { id: "resumen", label: "Ficha general" },
    { id: "contrato", label: "Contratos", count: contratosAlumno.length },
    { id: "habitacion", label: "Habitación" },
    { id: "pagos", label: "Pagos", count: pagosAlumno.length },
    { id: "multas", label: "Multas", count: multasAlumno.length },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Alumnos"
        title={`${alumno.apellido}, ${alumno.nombre}`}
        description={`DNI ${alumno.documento} · ${alumno.correo || "Sin correo"} · ${alumno.telefono}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink to={`/facturacion?alumno=${alumno.idAlumno}`} variant="outline"><Icon name="payments" className="h-4 w-4" />Facturas y saldos</ButtonLink>
            <ButtonLink to={volver} variant="outline">
                <Icon name="arrow" className="h-4 w-4 rotate-180" />
                Volver a alumnos
              </ButtonLink>
            <ButtonLink to={`/multas/nueva?alumno=${encodeURIComponent(alumno.idAlumno)}`}>
                <Icon name="fines" className="h-4 w-4" />
                Emitir multa
              </ButtonLink>
          </div>
        }
      />

      <section className="rounded-xl border border-brand-200 bg-brand-50/50 p-5 dark:border-brand-800 dark:bg-brand-900/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Situación vigente · {formatFecha(FECHA_REFERENCIA)}</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{contrato ? "Residente actual" : proximoContrato ? "Próximo ingreso programado" : contratosAlumno.length ? "Actualmente no reside" : "Pendiente de ingreso"}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{contrato ? `Contrato ${contrato.idContrato} · ${formatFecha(contrato.fechaDesde)} al ${formatFecha(contrato.fechaHasta)}` : proximoContrato ? `Próximo contrato: ${formatFecha(proximoContrato.fechaDesde)} al ${formatFecha(proximoContrato.fechaHasta)}` : "La ficha conserva los datos personales y todos los períodos registrados."}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {contrato ? <StatusBadge estado={estadoContrato(contrato)} /> : null}
              {contrato ? <Badge variant={habitacion ? "brand" : "warning"}>{habitacion ? `Hab. ${habitacion.numeroHabitacion}` : "Sin habitación asignada"}</Badge> : null}
              {multasPendientes > 0 ? <Badge variant="warning">{multasPendientes} multas pendientes</Badge> : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink to={`/contratos/nuevo?alumno=${encodeURIComponent(alumno.idAlumno)}&desde=${contrato ? sumarDia(contrato.fechaHasta) : FECHA_REFERENCIA}`}>{contrato ? "Renovar contrato" : contratosAlumno.length ? "Registrar reingreso" : "Crear primer contrato"}</ButtonLink>
            {contrato ? (
              <ButtonLink to={`/contratos/${contrato.idContrato}/baja`} variant="outline">Registrar baja</ButtonLink>
            ) : null}
          </div>
        </div>
        {contrato && proximoContrato ? <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Próximo contrato confirmado: {formatFecha(proximoContrato.fechaDesde)} al {formatFecha(proximoContrato.fechaHasta)}.</p> : null}
      </section>

      <AlumnoCuenta key={alumno.idAlumno} alumno={alumno} />

      <Tabs items={tabs} value={tab} onChange={setTab} label="Secciones del alumno" className="flex-wrap self-start" />

      {tab === "resumen" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <AlumnoFichaModulo modulo="personales" search={search}>
            <DatosModulo campos={[
              ["Nombre completo", alumno.apellido + ", " + alumno.nombre],
              ["Documento", alumno.documento],
              ["Correo", alumno.correo],
              ["Teléfono", alumno.telefono],
              ["Fecha de nacimiento", alumno.fechaNacimiento ? formatFecha(alumno.fechaNacimiento) : undefined],
              ["Nacionalidad", alumno.nacionalidad],
            ]} />
          </AlumnoFichaModulo>
          <div className="rounded-lg border border-slate-300 bg-white shadow-sm p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Estado actual</h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Contrato</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-white">{contrato ? `Vence ${formatFecha(contrato.fechaHasta)} (${estContrato})` : "Sin contrato"}</dd>
                {dias !== null ? <p className="mt-0.5 text-xs text-slate-500">{dias === 0 ? "Vence hoy" : dias <= 30 ? `Vence en ${dias} días` : `Quedan ${dias} días`}</p> : null}
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

      {tab === "resumen" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <AlumnoFichaModulo modulo="domicilio" search={search}>
            <DatosModulo campos={[
              ["Domicilio de origen", alumno.domicilio],
              ["Localidad", alumno.localidad],
              ["Provincia", alumno.provincia],
              ["Código postal", alumno.codigoPostal],
            ]} />
          </AlumnoFichaModulo>
          <AlumnoFichaModulo modulo="academica" search={search}>
            <DatosModulo campos={[
              ["Carrera", alumno.carrera],
              ["Cantidad de materias cursadas", alumno.cantidadMateriasCursadas],
              ["Legajo estudiantil", alumno.legajo],
            ]} />
          </AlumnoFichaModulo>
          <AlumnoFichaModulo modulo="emergencia" search={search}>
            {contactos.length ? (
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {contactos.map((contacto, indice) => (
                  <li key={indice} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                    <p className="font-medium">{contacto.nombre || "Contacto " + (indice + 1)}</p>
                    <p className="mt-1 text-sm text-slate-500">{contacto.vinculo}</p>
                    <p className="mt-1 text-sm">{contacto.telefono}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-4 text-sm text-slate-500">Sin contactos registrados.</p>}
          </AlumnoFichaModulo>
          <AlumnoFichaModulo modulo="adicional" search={search}>
            <DatosModulo campos={[["Observaciones", alumno.observaciones]]} />
          </AlumnoFichaModulo>
        </div>
      ) : null}

      {tab === "resumen" || tab === "contrato" ? <AlumnoContratos contratos={contratosAlumno} idVigente={contrato?.idContrato} /> : null}

      {tab === "habitacion" ? (
        asignacion && habitacion ? (
          <div className="rounded-lg border border-slate-300 bg-white shadow-sm p-5 dark:border-slate-800 dark:bg-slate-900">
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
            <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
              <Button variant="outline" onClick={() => setCambioHabitacionAbierto(true)}>
                <Icon name="arrow" className="h-4 w-4" />
                Cambiar de habitación
              </Button>
            </div>
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
                  const factura = facturaActivaDeMulta(facturas, multa.idMulta);
                  return (
                    <TR key={multa.idMulta}>
                      <TD>
                        <Link
                          to={`/multas/${multa.idMulta}`}
                          className="text-brand-700 hover:underline dark:text-brand-300"
                        >
                          {formatFecha(multa.fechaEmision)}
                        </Link>
                        <p className="text-xs text-slate-500">{multa.idMulta}</p>
                      </TD>
                      <TD>{formatFecha(multa.fechaVence)}</TD>
                      <TD>
                        <StatusBadge estado={ev} />
                      </TD>
                      <TD className="text-right tabular-nums">{formatARS(importeMulta(multa, undefined, facturas).total)}</TD>
                      <TD className="text-right">
                        {factura ? <ButtonLink to={`/facturacion/${factura.idFactura}`} size="sm" variant="outline">Ver factura</ButtonLink> : multa.estado === "pendiente" ? (
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

      <ConfirmDialog
        open={Boolean(multaAAnular)}
        onClose={() => setMultaAAnular(null)}
        onConfirm={confirmarAnulacion}
        title="Anular multa"
        description={multaAAnular ? `Se anulará la multa de ${alumno.nombre} ${alumno.apellido} por ${formatARS(multaAAnular.monto)}.` : undefined}
        confirmLabel="Anular multa"
      />
      <AsignarHabitacionDialog
        open={cambioHabitacionAbierto}
        onClose={() => setCambioHabitacionAbierto(false)}
        idAlumno={alumno.idAlumno}
      />
    </div>
  );
}
