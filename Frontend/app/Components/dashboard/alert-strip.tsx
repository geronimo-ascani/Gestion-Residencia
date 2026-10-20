import { Link } from "react-router";
import { FECHA_REFERENCIA } from "../../lib/config";
import {
  esCuotaVencida,
  esMultaVencida,
  estadoContrato,
} from "../../lib/domain";
import { useData } from "../../lib/store";
import { Icon } from "../ui/icons";

export function AlertStrip() {
  const { cuotas, multas, contratos } = useData();

  const cuotasVencidas = cuotas.filter((cuota) =>
    esCuotaVencida(cuota, FECHA_REFERENCIA),
  ).length;
  const multasVencidas = multas.filter((multa) =>
    esMultaVencida(multa, FECHA_REFERENCIA),
  ).length;
  const contratosPorVencer = contratos.filter(
    (contrato) => estadoContrato(contrato, FECHA_REFERENCIA) === "por-vencer",
  ).length;

  const alertas = [
    cuotasVencidas > 0
      ? {
          texto: `${cuotasVencidas} ${cuotasVencidas === 1 ? "cuota vencida" : "cuotas vencidas"}`,
          to: "/cuotas",
        }
      : null,
    multasVencidas > 0
      ? {
          texto: `${multasVencidas} ${multasVencidas === 1 ? "multa vencida" : "multas vencidas"}`,
          to: "/multas",
        }
      : null,
    contratosPorVencer > 0
      ? {
          texto: `${contratosPorVencer} ${contratosPorVencer === 1 ? "contrato por vencer" : "contratos por vencer"}`,
          to: "/contratos",
        }
      : null,
  ].filter((alerta): alerta is { texto: string; to: string } =>
    Boolean(alerta),
  );

  if (alertas.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
        <Icon name="check" className="h-4 w-4 shrink-0" />
        <p>Sin alertas pendientes: cuotas, multas y contratos al día.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
      <Icon name="alert" className="h-4 w-4 shrink-0" />
      <span className="font-medium">Requiere atención:</span>
      {alertas.map((alerta, indice) => (
        <span key={alerta.to} className="inline-flex items-center gap-2">
          {indice > 0 ? (
            <span aria-hidden="true" className="text-amber-400">
              ·
            </span>
          ) : null}
          <Link
            to={alerta.to}
            className="font-medium underline decoration-amber-400 underline-offset-2 hover:text-amber-950 dark:hover:text-amber-100"
          >
            {alerta.texto}
          </Link>
        </span>
      ))}
    </div>
  );
}
