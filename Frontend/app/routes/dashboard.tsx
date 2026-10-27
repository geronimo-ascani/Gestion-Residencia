import { Link } from "react-router";
import { ActivityFeed } from "../Components/dashboard/activity-feed";
import { AlertStrip } from "../Components/dashboard/alert-strip";
import { RoomMap } from "../Components/dashboard/room-map";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { StatCard } from "../Components/ui/stat-card";
import { FECHA_REFERENCIA } from "../lib/config";
import { calcularOcupacion, totalRecaudado } from "../lib/domain";
import { formatARS, formatFecha, formatPorcentaje } from "../lib/format";
import { usuarioActual } from "../lib/session";
import { useData } from "../lib/store";

const enlaceSecundario =
  "inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white";

export function meta() {
  return [{ title: "Panel · Gestión de Residencia" }];
}

export default function Dashboard() {
  const { habitaciones, asignaciones, pagos } = useData();

  const ocupacion = calcularOcupacion(habitaciones, asignaciones);
  const camasLibres = ocupacion.capacidadTotal - ocupacion.camasOcupadas;
  const habitacionesLibres = habitaciones.length - ocupacion.habitacionesOcupadas;

  const recaudado = totalRecaudado(pagos);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Panel de administración"
        title={`Buenos días, ${usuarioActual.nombre.split(" ")[0]}`}
        description={`Estado del edificio al ${formatFecha(FECHA_REFERENCIA)}. Los datos son de demostración.`}
      />

      <AlertStrip />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
      </div>

      <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Mapa de habitaciones
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {ocupacion.habitacionesOcupadas} de {habitaciones.length} ocupadas
            </p>
          </div>
          <Link to="/habitaciones" className={enlaceSecundario}>
            Ver
            <Icon name="arrow" className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="p-5">
          <RoomMap compact />
        </div>
      </div>

      <div className="w-full">
        <ActivityFeed />
      </div>
    </div>
  );
}
