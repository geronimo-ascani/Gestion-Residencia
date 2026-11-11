import { useMemo } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { EstadoFacturaBadge } from "../Components/factura-detalle";
import { Badge, StatusBadge } from "../Components/ui/badge";
import { Button } from "../Components/ui/button";
import { EmptyState } from "../Components/ui/empty-state";
import { Icon } from "../Components/ui/icons";
import type { IconName } from "../Components/ui/icons";
import { ListSummary } from "../Components/ui/list-page";
import { PageHeader } from "../Components/ui/page-header";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "../Components/ui/table";
import { FECHA_REFERENCIA } from "../lib/config";
import { diasHasta } from "../lib/domain";
import { formatARS, formatFecha, formatPorcentaje } from "../lib/format";
import { resumenPanel } from "../lib/panel";
import { useData } from "../lib/store";

export function meta() {
  return [{ title: "Panel · Gestión de Residencia" }];
}

function SeccionPanel({ title, description, to, label, children }: {
  title: string; description: string; to: string; label: string; children: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p></div>
        <Link to={to}><Button variant="outline" size="sm">{label}<Icon name="arrow" className="h-3.5 w-3.5" /></Button></Link>
      </div>
      {children}
    </section>
  );
}

export default function Dashboard() {
  const data = useData();
  const panel = useMemo(() => resumenPanel(data), [data]);
  const avisos: { title: string; description: string; count: number; icon: IconName; to: string }[] = [
    { title: "Facturas vencidas", description: "Consultá los saldos y registrá los cobros.", count: panel.facturasVencidas, icon: "payments", to: "/cobros?periodo=todos&estado=adeudan" },
    { title: "Cuotas sin facturar", description: `Contratos del período ${panel.periodo} pendientes de emisión.`, count: panel.sinFacturar.length, icon: "contracts", to: "/facturacion" },
    { title: "Multas vencidas", description: "Revisá las sanciones pendientes de pago.", count: panel.multasVencidas, icon: "fines", to: "/multas?vista=vencida" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Administración" title="Panel" description={`Resumen de la residencia al ${formatFecha(FECHA_REFERENCIA)}. Consultá los pendientes y accedé a cada gestión.`} actions={
        <div className="flex flex-wrap gap-2">
          <Link to="/alumnos/nuevo"><Button variant="outline"><Icon name="plus" className="h-4 w-4" />Nuevo alumno</Button></Link>
          <Link to="/cobros/registrar"><Button><Icon name="payments" className="h-4 w-4" />Registrar cobro</Button></Link>
        </div>
      } />

      <ListSummary title="Estado de la residencia" description={`${formatPorcentaje(panel.ocupacion.porcentaje)} de ocupación · ${data.habitaciones.length} habitaciones registradas`} icon="building" items={[
        { label: "Residentes actuales", value: panel.residentes.length },
        { label: "Plazas ocupadas", value: `${panel.ocupacion.camasOcupadas} / ${panel.ocupacion.capacidadTotal}` },
        { label: "Plazas disponibles", value: Math.max(0, panel.ocupacion.capacidadTotal - panel.ocupacion.camasOcupadas) },
        { label: "Contratos por vencer", value: panel.porVencer.length },
      ]} />

      <section aria-label="Gestiones pendientes" className="grid gap-3 md:grid-cols-3">
        {avisos.map((aviso) => <Link key={aviso.title} to={aviso.to} className="group flex items-start gap-3 rounded-xl border border-slate-300 bg-white p-4 transition hover:border-brand-400 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800">
          <span className="rounded-md bg-brand-50 p-2 text-brand-700 dark:bg-slate-800 dark:text-brand-300"><Icon name={aviso.icon} className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold group-hover:underline">{aviso.title}</h2><Badge variant={aviso.count ? "warning" : "success"}>{aviso.count}</Badge></div><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{aviso.description}</p></div>
          <Icon name="arrow" className="mt-2 h-4 w-4 shrink-0 text-slate-400" />
        </Link>)}
      </section>

      <ListSummary compactValues title="Resumen de cobros" description={`Ingresos de ${panel.periodo} y deuda acumulada de las facturas emitidas.`} icon="payments" items={[
        { label: "Cobrado en el mes", value: formatARS(panel.cobradoMes) },
        { label: "Saldo facturado pendiente", value: formatARS(panel.saldoPendiente) },
        { label: "Alumnos con saldo", value: panel.alumnosConSaldo },
        { label: "Facturas por cobrar", value: panel.pendientes.length },
      ]} />

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <SeccionPanel title="Facturas por cobrar" description={`${panel.pendientes.length} ${panel.pendientes.length === 1 ? "factura pendiente" : "facturas pendientes"} · Hasta 5, por vencimiento.`} to="/cobros?periodo=todos&estado=adeudan" label="Ver cobros">
          <TableWrap><Table className="min-w-[480px]"><THead><TR><TH>Alumno / factura</TH><TH>Vence</TH><TH className="text-right">Saldo</TH><TH className="text-right">Acciones</TH></TR></THead><TBody>
            {panel.pendientes.length ? panel.pendientes.slice(0, 5).map(({ factura, saldo }) => <TR key={factura.idFactura}>
              <TD><Link to={`/facturacion/${factura.idFactura}`} className="font-medium text-brand-800 hover:underline dark:text-brand-300">{factura.titular}</Link><p className="mt-1 text-xs text-slate-500">{factura.periodo} · {factura.idFactura}</p><div className="mt-2"><EstadoFacturaBadge factura={factura} pagos={data.pagos} /></div></TD>
              <TD className="whitespace-nowrap">{formatFecha(factura.fechaVence)}</TD><TD className="text-right font-medium whitespace-nowrap">{formatARS(saldo)}</TD>
              <TD className="text-right"><Link to={`/cobros/registrar?factura=${factura.idFactura}`}><Button variant="outline" size="sm">Cobrar<Icon name="arrow" className="h-3.5 w-3.5" /></Button></Link></TD>
            </TR>) : <TR><TD colSpan={4}><EmptyState icon="check" title="Sin saldos facturados pendientes" description="Todas las facturas emitidas están saldadas. Las cuotas sin emitir se consultan en Facturación." /></TD></TR>}
          </TBody></Table></TableWrap>
        </SeccionPanel>

        <SeccionPanel title="Contratos por vencer" description={`${panel.porVencer.length} ${panel.porVencer.length === 1 ? "contrato finaliza" : "contratos finalizan"} dentro de los próximos 30 días.`} to="/contratos" label="Ver contratos">
          <TableWrap><Table className="min-w-[450px]"><THead><TR><TH>Alumno / contrato</TH><TH>Finaliza</TH><TH>Plazo</TH><TH className="text-right">Acciones</TH></TR></THead><TBody>
            {panel.porVencer.length ? panel.porVencer.slice(0, 5).map((contrato) => {
              const alumno = data.alumnoPorId.get(contrato.idAlumno);
              const dias = diasHasta(contrato.fechaHasta);
              return <TR key={contrato.idContrato}><TD><Link to={`/alumnos/${contrato.idAlumno}`} className="font-medium hover:underline">{alumno ? `${alumno.apellido}, ${alumno.nombre}` : contrato.idAlumno}</Link><p className="mt-1 text-xs text-slate-500">{contrato.idContrato}</p></TD><TD className="whitespace-nowrap">{formatFecha(contrato.fechaHasta)}</TD><TD><Badge variant="warning">{dias === 0 ? "Hoy" : `${dias} días`}</Badge></TD><TD className="text-right"><Link to={`/contratos/${contrato.idContrato}`}><Button variant="outline" size="sm">Ver detalle<Icon name="arrow" className="h-3.5 w-3.5" /></Button></Link></TD></TR>;
            }) : <TR><TD colSpan={4}><EmptyState icon="contracts" title="Sin vencimientos próximos" description="No hay contratos que finalicen dentro de los próximos 30 días." /></TD></TR>}
          </TBody></Table></TableWrap>
        </SeccionPanel>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <SeccionPanel title="Ocupación por habitación" description={`${panel.ocupacion.camasOcupadas} plazas ocupadas de ${panel.ocupacion.capacidadTotal} plazas totales.`} to="/habitaciones" label="Ver habitaciones">
          <TableWrap><Table className="min-w-[420px]"><THead><TR><TH>Habitación</TH><TH>Ocupadas</TH><TH>Libres</TH><TH>Estado</TH></TR></THead><TBody>
            {panel.habitaciones.length ? panel.habitaciones.map(({ habitacion, ocupadas, libres }) => <TR key={habitacion.idHabitacion}><TD><Link to={`/habitaciones/${habitacion.idHabitacion}`} className="font-medium text-brand-800 hover:underline dark:text-brand-300">Hab. {habitacion.numeroHabitacion}</Link></TD><TD>{ocupadas} / {habitacion.capacidadMaxima}</TD><TD>{libres}</TD><TD><StatusBadge estado={ocupadas === 0 ? "vacia" : libres === 0 ? "llena" : "disponible"} /></TD></TR>) : <TR><TD colSpan={4}><EmptyState icon="rooms" title="Sin habitaciones" description="Registrá habitaciones para consultar su ocupación." /></TD></TR>}
          </TBody></Table></TableWrap>
        </SeccionPanel>

        <SeccionPanel title="Limpieza de la semana" description={`Semana ${panel.semana} del mes · ${panel.residentesSinGrupo ? `${panel.residentesSinGrupo} residentes sin grupo.` : "Todos los residentes tienen grupo asignado."}`} to="/limpieza" label="Ver limpieza">
          <TableWrap><Table className="min-w-[420px]"><THead><TR><TH>Grupo</TH><TH>Integrantes</TH><TH>Tarea asignada</TH></TR></THead><TBody>
            {panel.grupos.length ? panel.grupos.map(({ grupo, tarea, integrantes }) => <TR key={grupo.idGrupoLimpieza}><TD><Link to={`/limpieza/${grupo.idGrupoLimpieza}`} className="font-medium text-brand-800 hover:underline dark:text-brand-300">{grupo.nombreDelGrupo}</Link></TD><TD>{integrantes}{integrantes === 0 ? <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Sin integrantes</p> : null}</TD><TD>{tarea ? <Link to={`/limpieza/tareas/${tarea.numero}`} className="hover:underline">{tarea.nombre}</Link> : "Sin tarea asignada"}</TD></TR>) : <TR><TD colSpan={3}><EmptyState icon="cleaning" title="Sin grupos de limpieza" description="Creá los grupos y asigná integrantes para organizar las tareas semanales." /></TD></TR>}
          </TBody></Table></TableWrap>
        </SeccionPanel>
      </div>
    </div>
  );
}
