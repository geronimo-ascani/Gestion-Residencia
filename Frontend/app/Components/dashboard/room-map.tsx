import { Link } from "react-router";
import { cn } from "../../lib/cn";
import { asignacionesActivas } from "../../lib/domain";
import { useData } from "../../lib/store";

const estados = {
  vacia: {
    texto: "Vacía",
    punto: "bg-slate-300 dark:bg-slate-600",
    barra: "bg-slate-300 dark:bg-slate-600",
  },
  parcial: {
    texto: "Con cupo",
    punto: "bg-brand-500",
    barra: "bg-brand-500",
  },
  llena: {
    texto: "Llena",
    punto: "bg-amber-500",
    barra: "bg-amber-500",
  },
} as const;

export function RoomMap({ compact = false }: { compact?: boolean }) {
  const { habitaciones, asignaciones, alumnoPorId } = useData();
  const activas = asignacionesActivas(asignaciones);

  return (
    <div
      className={cn(
        "grid gap-2",
        compact
          ? "grid-cols-2 sm:grid-cols-3"
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
      )}
    >
      {habitaciones.map((habitacion) => {
        const ocupantes = activas.filter(
          (asignacion) => asignacion.idHabitacion === habitacion.idHabitacion,
        );
        const cantidad = ocupantes.length;
        const estado =
          cantidad === 0
            ? "vacia"
            : cantidad >= habitacion.capacidadMaxima
              ? "llena"
              : "parcial";
        const config = estados[estado];
        const porcentaje =
          habitacion.capacidadMaxima > 0
            ? Math.min(100, (cantidad / habitacion.capacidadMaxima) * 100)
            : 0;
        const nombres = ocupantes
          .map((asignacion) => {
            const alumno = alumnoPorId.get(asignacion.idAlumno);
            return alumno ? `${alumno.nombre} ${alumno.apellido}` : null;
          })
          .filter(Boolean)
          .join(", ");

        return (
          <Link
            key={habitacion.idHabitacion}
            to={`/habitaciones/${habitacion.idHabitacion}`}
            title={
              nombres
                ? `Habitación ${habitacion.numeroHabitacion}: ${nombres}`
                : `Habitación ${habitacion.numeroHabitacion} vacía`
            }
            className={cn(
              "rounded-lg border border-slate-200 bg-white p-3 transition",
              "hover:border-brand-300 hover:shadow-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              "dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {habitacion.numeroHabitacion}
              </span>
              <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {cantidad}/{habitacion.capacidadMaxima}
              </span>
            </div>
            <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <span
                aria-hidden="true"
                className={cn("h-1.5 w-1.5 rounded-full", config.punto)}
              />
              {config.texto}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={cn("h-full rounded-full", config.barra)}
                style={{ width: `${porcentaje}%` }}
              />
            </div>
            {!compact && nombres ? (
              <p className="mt-2 truncate text-[11px] text-slate-500 dark:text-slate-400">
                {nombres}
              </p>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
