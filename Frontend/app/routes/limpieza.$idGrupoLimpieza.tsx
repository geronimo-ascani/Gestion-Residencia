import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "../Components/ui/button";
import { ConfirmDialog } from "../Components/ui/confirm-dialog";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { StatCard } from "../Components/ui/stat-card";
import { Badge } from "../Components/ui/badge";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "../Components/ui/table";
import { useToast } from "../Components/ui/toast";
import { FECHA_REFERENCIA } from "../lib/config";
import { asignacionesAmbienteActivas } from "../lib/domain";
import { formatFecha } from "../lib/format";
import { useData } from "../lib/store";
import type { GrupoLimpiezaAmbiente } from "../lib/types";

export function meta() {
  return [{ title: "Grupo de limpieza · Gestión de Residencia" }];
}

export default function GrupoLimpiezaDetalle() {
  const { idGrupoLimpieza } = useParams();
  const {
    grupos,
    alumnos,
    grupoAlumnos,
    ambientes,
    grupoAmbientes,
    alumnoPorId,
    eliminarGrupoLimpieza,
    liberarAmbienteGrupo,
  } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [ambienteALiberar, setAmbienteALiberar] =
    useState<GrupoLimpiezaAmbiente | null>(null);
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
  const grupo = grupos.find((item) => item.idGrupoLimpieza === idGrupoLimpieza);
  const miembros = grupoAlumnos
    .filter((asignacion) => asignacion.idGrupoLimpieza === idGrupoLimpieza)
    .map((asignacion) => alumnoPorId.get(asignacion.idAlumno))
    .filter((alumno) => alumno !== undefined)
    .sort((a, b) => a.apellido.localeCompare(b.apellido));
  const asignacionesActivas = asignacionesAmbienteActivas(grupoAmbientes);
  const historialAmbientes = grupoAmbientes
    .filter((asignacion) => asignacion.idGrupoLimpieza === idGrupoLimpieza)
    .map((asignacion) => ({
      asignacion,
      ambiente: ambientes.find(
        (item) => item.idAmbiente === asignacion.idAmbiente,
      ),
      activo: asignacionesActivas.includes(asignacion),
    }))
    .filter((item) => item.ambiente)
    .sort((a, b) => b.asignacion.fechaDesde.localeCompare(a.asignacion.fechaDesde));
  const ambientesActivos = asignacionesActivas.filter(
    (asignacion) => asignacion.idGrupoLimpieza === idGrupoLimpieza,
  ).length;

  if (!grupo) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Limpieza"
          title="Grupo no encontrado"
          description="No existe un grupo con el identificador solicitado."
        />
        <EmptyState
          icon="cleaning"
          title="Sin resultados"
          description="Volvé al listado de grupos de limpieza."
          action={
            <Link to="/limpieza">
              <Button>
                <Icon name="arrow" className="h-4 w-4 rotate-180" />
                Volver a grupos
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  function liberarAmbiente() {
    if (!ambienteALiberar) return;
    liberarAmbienteGrupo(
      ambienteALiberar.idGrupoLimpieza,
      ambienteALiberar.idAmbiente,
    );
    toast({
      title: "Ambiente liberado",
      description:
        ambientes.find(
          (item) => item.idAmbiente === ambienteALiberar.idAmbiente,
        )?.ambiente ?? "La asignación se cerró y conserva su historial.",
    });
  }

  function eliminarGrupo() {
    eliminarGrupoLimpieza(grupo!.idGrupoLimpieza);
    toast({ title: "Grupo eliminado", description: grupo!.nombreDelGrupo });
    navigate("/limpieza");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={`Limpieza · ${grupo.idGrupoLimpieza}`}
        title={grupo.nombreDelGrupo}
        description="Integrantes, ambientes asignados e historial del grupo."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/limpieza/${grupo.idGrupoLimpieza}/editar`}>
              <Button variant="outline">
                <Icon name="settings" className="h-4 w-4" />
                Editar grupo
              </Button>
            </Link>
            <Button
              variant="danger"
              onClick={() => setConfirmarEliminacion(true)}
            >
              Eliminar grupo
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Integrantes"
          value={String(miembros.length)}
          hint="Alumnos vinculados al grupo"
          icon="users"
          tone="brand"
        />
        <StatCard
          label="Ambientes activos"
          value={String(ambientesActivos)}
          hint="Con asignación vigente"
          icon="building"
          tone={ambientesActivos ? "success" : "neutral"}
        />
      </section>

      <section className="flex flex-col gap-3">
        <PageHeader
          title="Integrantes"
          description="La relación admite alumnos en más de un grupo."
          actions={
            <Link to={`/limpieza/${grupo.idGrupoLimpieza}/alumnos`}>
              <Button variant="outline">
                <Icon name="users" className="h-4 w-4" />
                Administrar alumnos
              </Button>
            </Link>
          }
        />
        {miembros.length === 0 ? (
          <EmptyState
            icon="users"
            title="Sin integrantes"
            description="Agregá alumnos para completar este grupo."
            action={
              <Link to={`/limpieza/${grupo.idGrupoLimpieza}/alumnos`}>
                <Button>Administrar alumnos</Button>
              </Link>
            }
          />
        ) : (
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH>Alumno</TH>
                  <TH>Documento</TH>
                  <TH>Estado</TH>
                </TR>
              </THead>
              <TBody>
                {miembros.map((alumno) => (
                  <TR key={alumno.idAlumno}>
                    <TD>
                      <Link
                        to={`/alumnos/${alumno.idAlumno}`}
                        className="font-medium text-brand-700 hover:underline dark:text-brand-300"
                      >
                        {alumno.apellido}, {alumno.nombre}
                      </Link>
                    </TD>
                    <TD>{alumno.documento}</TD>
                    <TD>{alumno.estado === "activo" ? "Activo" : "Inactivo"}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <PageHeader
          title="Ambientes asignados"
          description="Las asignaciones cerradas se conservan como historial."
          actions={
            <Link to={`/limpieza/${grupo.idGrupoLimpieza}/ambientes/nuevo`}>
              <Button variant="outline" disabled={!ambientes.length}>
                <Icon name="plus" className="h-4 w-4" />
                Asignar ambiente
              </Button>
            </Link>
          }
        />
        {historialAmbientes.length === 0 ? (
          <EmptyState
            icon="building"
            title="Sin ambientes asignados"
            description="Asigná un ambiente para registrar las tareas de este grupo."
            action={
              <Link to={`/limpieza/${grupo.idGrupoLimpieza}/ambientes/nuevo`}>
                <Button>Asignar ambiente</Button>
              </Link>
            }
          />
        ) : (
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH>Ambiente</TH>
                  <TH className="hidden md:table-cell">Tareas</TH>
                  <TH>Desde</TH>
                  <TH>Hasta</TH>
                  <TH>Estado</TH>
                  <TH className="text-right">Acciones</TH>
                </TR>
              </THead>
              <TBody>
                {historialAmbientes.map(({ asignacion, ambiente, activo }) => {
                  const programado = asignacion.fechaDesde > FECHA_REFERENCIA;
                  return (
                    <TR
                      key={`${asignacion.idAmbiente}-${asignacion.fechaDesde}`}
                    >
                      <TD className="font-medium text-slate-900 dark:text-white">
                        {ambiente!.ambiente}
                      </TD>
                      <TD className="hidden max-w-sm md:table-cell">
                        <span className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                          {ambiente!.tareas}
                        </span>
                      </TD>
                      <TD>{formatFecha(asignacion.fechaDesde)}</TD>
                      <TD>{formatFecha(asignacion.fechaHasta)}</TD>
                      <TD>
                        <Badge
                          variant={
                            activo ? "success" : programado ? "info" : "neutral"
                          }
                        >
                          {activo ? "Activo" : programado ? "Programado" : "Finalizado"}
                        </Badge>
                      </TD>
                      <TD className="text-right">
                        {activo ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAmbienteALiberar(asignacion)}
                          >
                            Liberar
                          </Button>
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
        )}
      </section>

      <ConfirmDialog
        open={Boolean(ambienteALiberar)}
        onClose={() => setAmbienteALiberar(null)}
        onConfirm={liberarAmbiente}
        title="Liberar ambiente"
        description={`Se cerrará la asignación desde ${formatFecha(FECHA_REFERENCIA)} y quedará en el historial.`}
        confirmLabel="Liberar ambiente"
        tone="brand"
      />
      <ConfirmDialog
        open={confirmarEliminacion}
        onClose={() => setConfirmarEliminacion(false)}
        onConfirm={eliminarGrupo}
        title="Eliminar grupo"
        description="Se eliminarán también sus integrantes y todo el historial de ambientes asignados. Esta acción no se puede deshacer."
        confirmLabel="Eliminar grupo"
      />
    </div>
  );
}