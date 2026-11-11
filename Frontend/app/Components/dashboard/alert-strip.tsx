import { Link } from "react-router";
import { FECHA_REFERENCIA } from "../../lib/config";
import { estadoContrato, esMultaVencida } from "../../lib/domain";
import { useData } from "../../lib/store";
import { Icon } from "../ui/icons";

export function AlertStrip() {
  const { multas, contratos } = useData();

  const multasVencidas = multas.filter((multa) =>
    esMultaVencida(multa, FECHA_REFERENCIA),
  ).length;
  const contratosPorVencer = contratos.filter(
    (contrato) => estadoContrato(contrato, FECHA_REFERENCIA) === "por-vencer",
  ).length;

  const alertas = [
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
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        <Icon
          name="check"
          className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400"
        />
        <p>Sin alertas pendientes: multas y contratos al día.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-slate-200 border-l-4 border-l-amber-600 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:border-l-amber-500 dark:bg-slate-900 dark:text-slate-300">
      <Icon
        name="alert"
        className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400"
      />
      <span className="font-medium text-slate-900 dark:text-white">
        Requiere atención:
      </span>
      {alertas.map((alerta, indice) => (
        <span key={alerta.to} className="inline-flex items-center gap-2">
          {indice > 0 ? (
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
              ·
            </span>
          ) : null}
          <Link
            to={alerta.to}
            className="font-medium text-slate-900 underline decoration-amber-600/50 underline-offset-2 hover:text-amber-900 dark:text-slate-100 dark:decoration-amber-500/50 dark:hover:text-amber-200"
          >
            {alerta.texto}
          </Link>
        </span>
      ))}
    </div>
  );
}
