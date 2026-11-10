import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { AsignarHabitacionDialog } from "../Components/actions/asignar-habitacion-dialog";
import { Button } from "../Components/ui/button";
import { ConfirmDialog } from "../Components/ui/confirm-dialog";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { StatCard } from "../Components/ui/stat-card";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "../Components/ui/table";
import { useToast } from "../Components/ui/toast";
import { asignacionesActivas } from "../lib/domain";
import { formatFecha } from "../lib/format";
import { useData } from "../lib/store";
import type { HabitacionAlumno } from "../lib/types";

export function meta() {
  return [{ title: "Detalle de habitación · Gestión de Residencia" }];
}

export default function HabitacionDetalle() {
  const { idHabitacion } = useParams();
  const {
    habitaciones,
    asignaciones,
    alumnoPorId,
    liberarHabitacion,
  } = useData();
  const { toast } = useToast();
  const [dialogoAsignacionAbierto, setDialogoAsignacionAbierto] = useState(false);
  const [asignacionALiberar, setAsignacionALiberar] =
    useState<HabitacionAlumno | null>(null);

  const habitacion = habitaciones.find(
    (item) => item.idHabitacion === idHabitacion,
  );

  const ocupantes = useMemo(() => {
    if (!idHabitacion) return [];
    return asignacionesActivas(asignaciones)
      .filter((asignacion) => asignacion.idHabitacion === idHabitacion)
      .flatMap((asignacion) => {
        const alumno = alumnoPorId.get(asignacion.idAlumno);
        return alumno ? [{ asignacion, alumno }] : [];
      })
      .sort((a, b) => a.alumno.apellido.localeCompare(b.alumno.apellido));
  }, [alumnoPorId, asignaciones, idHabitacion]);

  if (!habitacion) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Habitaciones"
          title="Habitación no encontrada"
          description="No existe una habitación con el identificador solicitado."
        />
        <EmptyState
          icon="rooms"
          title="Sin resultados"
          description="Verificá la ruta o volvé al listado de habitaciones."
          action={
            <Link to="/habitaciones">
              <Button>
                <Icon name="arrow" className="h-4 w-4 rotate-180" />
                Volver a habitaciones
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const cuposDisponibles = Math.max(
    0,
    habitacion.capacidadMaxima - ocupantes.length,
  );
  const porcentajeOcupacion =
    habitacion.capacidadMaxima > 0
      ? (ocupantes.length / habitacion.capacidadMaxima) * 100
      : 0;

  function confirmarLiberacion() {
    if (!asignacionALiberar) return;
    liberarHabitacion(asignacionALiberar.idAlumno);
    const alumno = alumnoPorId.get(asignacionALiberar.idAlumno);
    toast({
      title: "Habitación liberada",
      description: alumno
        ? `${alumno.nombre} ${alumno.apellido} ya no ocupa esta habitación.`
        : "La asignación fue cerrada.",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={
          habitacion.pisoHabitacion === null
            ? "Piso no especificado"
            : `Piso ${habitacion.pisoHabitacion}`
        }
        title={`Habitación ${habitacion.numeroHabitacion}`}
        description={habitacion.descripcion}
        actions={
          <>
            <Link to="/habitaciones">
              <Button variant="outline">
                <Icon name="arrow" className="h-4 w-4 rotate-180" />
                Habitaciones
              </Button>
            </Link>
            <Button
              onClick={() => setDialogoAsignacionAbierto(true)}
              disabled={cuposDisponibles === 0}
              title={cuposDisponibles === 0 ? "La habitación está completa" : undefined}
            >
              <Icon name="plus" className="h-4 w-4" />
              Asignar alumno
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Ocupación"
          value={`${ocupantes.length} / ${habitacion.capacidadMaxima}`}
          hint={`${Math.round(porcentajeOcupacion)}% de la capacidad`}
          icon="users"
          tone={cuposDisponibles === 0 ? "warning" : "brand"}
          progress={porcentajeOcupacion}
        />
        <StatCard
          label="Cupos disponibles"
          value={String(cuposDisponibles)}
          hint={cuposDisponibles === 1 ? "Lugar disponible" : "Lugares disponibles"}
          icon="rooms"
          tone={cuposDisponibles === 0 ? "warning" : "success"}
        />
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Alumnos asignados
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Se muestran las asignaciones vigentes al día de hoy.
          </p>
        </div>

        <TableWrap>
          <Table>
            <THead>
              <TR>
                <TH>Alumno</TH>
                <TH className="hidden sm:table-cell">Documento</TH>
                <TH className="hidden md:table-cell">Asignado desde</TH>
                <TH className="text-right">Acciones</TH>
              </TR>
            </THead>
            <TBody>
              {ocupantes.length === 0 ? (
                <TR>
                  <TD colSpan={4}>
                    <EmptyState
                      icon="users"
                      title="Habitación vacía"
                      description="Todavía no hay alumnos asignados a esta habitación."
                    />
                  </TD>
                </TR>
              ) : (
                ocupantes.map(({ asignacion, alumno }) => (
                  <TR key={`${asignacion.idAlumno}-${asignacion.idHabitacion}`}>
                    <TD>
                      <Link
                        to={`/alumnos/${alumno.idAlumno}`}
                        className="font-medium text-brand-700 hover:underline dark:text-brand-300"
                      >
                        {alumno.apellido}, {alumno.nombre}
                      </Link>
                      <p className="text-xs text-slate-500 sm:hidden">
                        DNI {alumno.documento}
                      </p>
                    </TD>
                    <TD className="hidden sm:table-cell">{alumno.documento}</TD>
                    <TD className="hidden md:table-cell">
                      {formatFecha(asignacion.fechaDesde)}
                    </TD>
                    <TD className="text-right">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setAsignacionALiberar(asignacion)}
                      >
                        <Icon name="close" className="h-3.5 w-3.5" />
                        Liberar
                      </Button>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </TableWrap>
      </section>

      <AsignarHabitacionDialog
        open={dialogoAsignacionAbierto}
        onClose={() => setDialogoAsignacionAbierto(false)}
        idHabitacion={habitacion.idHabitacion}
      />
      <ConfirmDialog
        open={Boolean(asignacionALiberar)}
        onClose={() => setAsignacionALiberar(null)}
        onConfirm={confirmarLiberacion}
        title="Liberar habitación"
        description="Se cerrará la asignación del alumno con fecha de hoy. El registro histórico se conserva."
        confirmLabel="Liberar habitación"
      />
    </div>
  );
}