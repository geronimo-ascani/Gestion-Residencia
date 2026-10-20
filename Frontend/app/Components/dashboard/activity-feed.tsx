import { useData } from "../../lib/store";
import { formatARS, formatFecha, formatMes } from "../../lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Icon, type IconName } from "../ui/icons";

interface Evento {
  id: string;
  fecha: string;
  titulo: string;
  detalle: string;
  icon: IconName;
  tono: string;
}

export function ActivityFeed() {
  const { cuotas, multas, alumnoPorId } = useData();
  const eventos: Evento[] = [];

  for (const cuota of cuotas) {
    if (!cuota.fechaPago) continue;
    const alumno = alumnoPorId.get(cuota.idAlumno);
    if (!alumno) continue;
    eventos.push({
      id: `cuota-${cuota.idCuota}`,
      fecha: cuota.fechaPago,
      titulo: "Pago registrado",
      detalle: `${alumno.nombre} ${alumno.apellido} · ${formatMes(cuota.mesAsociado)} · ${formatARS(cuota.montoPagado)}`,
      icon: "payments",
      tono: "text-emerald-600 dark:text-emerald-400",
    });
  }

  for (const multa of multas) {
    const alumno = alumnoPorId.get(multa.idAlumno);
    if (!alumno) continue;
    eventos.push({
      id: `multa-${multa.idMulta}`,
      fecha: multa.fechaEmision,
      titulo:
        multa.estado === "anulada"
          ? "Multa anulada"
          : multa.estado === "pagada"
            ? "Multa pagada"
            : "Multa emitida",
      detalle: `${alumno.nombre} ${alumno.apellido} · ${formatARS(multa.monto)}`,
      icon: "fines",
      tono: "text-amber-600 dark:text-amber-400",
    });
  }

  const recientes = eventos
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Actividad reciente</CardTitle>
          <CardDescription>Últimos movimientos de pagos y multas</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {recientes.map((evento) => (
            <li key={evento.id} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Icon
                  name={evento.icon}
                  className={`h-4 w-4 ${evento.tono}`}
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {evento.titulo}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {evento.detalle}
                </p>
              </div>
              <time
                dateTime={evento.fecha}
                className="shrink-0 text-xs text-slate-400"
              >
                {formatFecha(evento.fecha)}
              </time>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
