import { useState } from "react";
import { Link } from "react-router";
import { EmitirMultaDialog } from "../Components/actions/emitir-multa-dialog";
import { ActivityFeed } from "../Components/dashboard/activity-feed";
import { AlertStrip } from "../Components/dashboard/alert-strip";
import { RoomMap } from "../Components/dashboard/room-map";
import { Badge, StatusBadge } from "../Components/ui/badge";
import { Button } from "../Components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../Components/ui/card";
import { ConfirmDialog } from "../Components/ui/confirm-dialog";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { StatCard } from "../Components/ui/stat-card";
import { Table, TBody, TD, TH, THead, TR, TableWrap } from "../Components/ui/table";
import { useToast } from "../Components/ui/toast";
import { FECHA_REFERENCIA } from "../lib/config";
import {
  calcularOcupacion,
  diasHasta,
  estadoContrato,
  estadoMultaVisual,
  totalRecaudado,
} from "../lib/domain";
import { formatARS, formatFecha, formatPorcentaje } from "../lib/format";
import { usuarioActual } from "../lib/session";
import { useData } from "../lib/store";
import type { Multa } from "../lib/types";

const enlaceSecundario =
  "inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white";

export function meta() {
  return [{ title: "Panel · Gestión de Residencia" }];
}

export default function Dashboard() {
  const {
    habitaciones,
    asignaciones,
    contratos,
    pagos,
    multas,
    grupos,
    grupoAlumnos,
    grupoAmbientes,
    alumnoPorId,
    registrarPagoMulta,
    anularMulta,
  } = useData();
  const { toast } = useToast();

  const [multaAbierta, setMultaAbierta] = useState(false);
  const [multaAAnular, setMultaAAnular] = useState<Multa | null>(null);

  const ocupacion = calcularOcupacion(habitaciones, asignaciones);
  const camasLibres = ocupacion.capacidadTotal - ocupacion.camasOcupadas;
  const habitacionesLibres = habitaciones.length - ocupacion.habitacionesOcupadas;

  const recaudado = totalRecaudado(pagos);

  const multasPendientes = [...multas]
    .filter((multa) => multa.estado === "pendiente")
    .sort((a, b) => a.fechaVence.localeCompare(b.fechaVence));
  const totalMultasPendientes = multasPendientes.reduce(
    (total, multa) => total + multa.monto,
    0,
  );

  const contratosPorVencer = [...contratos]
    .filter(
      (contrato) =>
        estadoContrato(contrato, FECHA_REFERENCIA) === "por-vencer",
    )
    .sort((a, b) => a.fechaHasta.localeCompare(b.fechaHasta));

  const gruposResumen = grupos.map((grupo) => ({
    ...grupo,
    integrantes: grupoAlumnos.filter(
      (fila) => fila.idGrupoLimpieza === grupo.idGrupoLimpieza,
    ).length,
    ambientes: grupoAmbientes.filter(
      (fila) =>
        fila.idGrupoLimpieza === grupo.idGrupoLimpieza &&
        (fila.fechaHasta === null || fila.fechaHasta >= FECHA_REFERENCIA),
    ).length,
  }));

  function pagarMulta(multa: Multa) {
    const alumno = alumnoPorId.get(multa.idAlumno);
    registrarPagoMulta(multa.idMulta);
    toast({
      title: "Pago de multa registrado",
      description: `${alumno ? `${alumno.nombre} ${alumno.apellido}` : "Alumno"} · ${formatARS(multa.monto)}`,
    });
  }

  function confirmarAnulacion() {
    if (!multaAAnular) return;
    const alumno = alumnoPorId.get(multaAAnular.idAlumno);
    anularMulta(multaAAnular.idMulta);
    toast({
      title: "Multa anulada",
      description: `${alumno ? `${alumno.nombre} ${alumno.apellido}` : "Alumno"} · ${formatARS(multaAAnular.monto)}`,
    });
  }

  const alumnoAnulacion = multaAAnular
    ? alumnoPorId.get(multaAAnular.idAlumno)
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Panel de administración"
        title={`Buenos días, ${usuarioActual.nombre.split(" ")[0]}`}
        description={`Estado del edificio al ${formatFecha(FECHA_REFERENCIA)}. Los datos son de demostración.`}
        actions={
          <Button onClick={() => setMultaAbierta(true)}>
            <Icon name="fines" className="h-4 w-4" />
            Emitir multa
          </Button>
        }
      />

      <AlertStrip />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ocupación"
          value={`${ocupacion.camasOcupadas}/${ocupacion.capacidadTotal}`}
          hint={`${formatPorcentaje(ocupacion.porcentaje)} · ${ocupacion.habitacionesLlenas} habitaciones llenas`}
          icon="rooms"
          progress={ocupacion.porcentaje}
        />
        <StatCard
          label="Recaudado"
          value={formatARS(recaudado)}
          hint={`${pagos.length} pagos registrados`}
          icon="money"
        />
        <StatCard
          label="Camas libres"
          value={String(camasLibres)}
          hint={`${habitacionesLibres} habitaciones sin ocupar`}
          icon="building"
        />
        <StatCard
          label="Multas pendientes"
          value={formatARS(totalMultasPendientes)}
          hint={`${multasPendientes.length} sin resolver`}
          icon="fines"
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Mapa de habitaciones</CardTitle>
            <CardDescription>
              {ocupacion.habitacionesOcupadas} de {habitaciones.length} ocupadas
            </CardDescription>
          </div>
          <Link to="/habitaciones" className={enlaceSecundario}>
            Ver
            <Icon name="arrow" className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          <RoomMap compact />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Multas pendientes</CardTitle>
              <CardDescription>
                {multasPendientes.length} sin resolver ·{" "}
                {multasPendientes.filter(
                  (multa) => estadoMultaVisual(multa) === "vencida",
                ).length}{" "}
                vencidas
              </CardDescription>
            </div>
            <Link to="/multas" className={enlaceSecundario}>
              Ver todas
              <Icon name="arrow" className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {multasPendientes.length === 0 ? (
              <EmptyState
                icon="check"
                title="Sin multas pendientes"
                description="Todas las multas están pagadas o anuladas."
              />
            ) : (
              <TableWrap>
                <Table>
                  <THead>
                    <TR>
                      <TH>Alumno</TH>
                      <TH className="hidden sm:table-cell">Monto</TH>
                      <TH>Estado</TH>
                      <TH className="text-right">Acciones</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {multasPendientes.slice(0, 6).map((multa) => {
                      const alumno = alumnoPorId.get(multa.idAlumno);
                      return (
                        <TR key={multa.idMulta}>
                          <TD>
                            <Link
                              to={`/alumnos/${multa.idAlumno}`}
                              className="block text-sm font-medium text-slate-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-300"
                            >
                              {alumno
                                ? `${alumno.nombre} ${alumno.apellido}`
                                : multa.idAlumno}
                            </Link>
                            <span className="text-xs text-slate-500 sm:hidden">
                              {formatARS(multa.monto)} · vence{" "}
                              {formatFecha(multa.fechaVence)}
                            </span>
                            <span className="hidden text-xs text-slate-500 sm:block">
                              Vence {formatFecha(multa.fechaVence)}
                            </span>
                          </TD>
                          <TD className="hidden tabular-nums sm:table-cell">
                            {formatARS(multa.monto)}
                          </TD>
                          <TD>
                            <StatusBadge estado={estadoMultaVisual(multa)} />
                          </TD>
                          <TD>
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => pagarMulta(multa)}
                              >
                                Pagar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setMultaAAnular(multa)}
                              >
                                Anular
                              </Button>
                            </div>
                          </TD>
                        </TR>
                      );
                    })}
                  </TBody>
                </Table>
              </TableWrap>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Contratos por vencer</CardTitle>
              <CardDescription>Próximos 30 días</CardDescription>
            </div>
            <Link to="/contratos" className={enlaceSecundario}>
              Ver
              <Icon name="arrow" className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {contratosPorVencer.length === 0 ? (
              <EmptyState
                icon="check"
                title="Sin vencimientos próximos"
                description="No hay contratos que venzan en los próximos 30 días."
              />
            ) : (
              <div className="space-y-1">
                {contratosPorVencer.slice(0, 5).map((contrato) => {
                  const alumno = alumnoPorId.get(contrato.idAlumno);
                  const dias = diasHasta(contrato.fechaHasta);
                  return (
                    <Link
                      key={contrato.idContrato}
                      to={`/alumnos/${contrato.idAlumno}`}
                      className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                          {alumno
                            ? `${alumno.nombre} ${alumno.apellido}`
                            : contrato.idAlumno}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Vence el {formatFecha(contrato.fechaHasta)}
                        </p>
                      </div>
                      <Badge variant="warning">
                        {dias <= 0 ? "Hoy" : `${dias} días`}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Limpieza</CardTitle>
              <CardDescription>Grupos y ambientes asignados</CardDescription>
            </div>
            <Link to="/limpieza" className={enlaceSecundario}>
              Ver
              <Icon name="arrow" className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {gruposResumen.map((grupo) => (
                <Link
                  key={grupo.idGrupoLimpieza}
                  to={`/limpieza/${grupo.idGrupoLimpieza}`}
                  className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                      {grupo.nombreDelGrupo}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {grupo.integrantes}{" "}
                      {grupo.integrantes === 1 ? "integrante" : "integrantes"} ·{" "}
                      {grupo.ambientes}{" "}
                      {grupo.ambientes === 1 ? "ambiente" : "ambientes"}
                    </p>
                  </div>
                  <Icon
                    name="arrow"
                    className="h-4 w-4 shrink-0 text-slate-400"
                  />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <ActivityFeed />
      </div>

      <EmitirMultaDialog
        open={multaAbierta}
        onClose={() => setMultaAbierta(false)}
      />
      <ConfirmDialog
        open={Boolean(multaAAnular)}
        onClose={() => setMultaAAnular(null)}
        onConfirm={confirmarAnulacion}
        title="Anular multa"
        description={
          multaAAnular
            ? `Se anulará la multa de ${alumnoAnulacion ? `${alumnoAnulacion.nombre} ${alumnoAnulacion.apellido}` : "el alumno"} por ${formatARS(multaAAnular.monto)}. Esta acción no se puede deshacer.`
            : undefined
        }
        confirmLabel="Anular multa"
      />
    </div>
  );
}
