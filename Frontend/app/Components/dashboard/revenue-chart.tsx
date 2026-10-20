import { MES_ACTUAL } from "../../lib/config";
import { esperadoDe, recaudadoDe, ultimosMeses } from "../../lib/domain";
import {
  formatARS,
  formatMes,
  formatMesCorto,
} from "../../lib/format";
import { useData } from "../../lib/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Table, TBody, TD, TH, THead, TR, TableWrap } from "../ui/table";

const ANCHO = 600;
const ALTO = 180;
const MARGEN_SUPERIOR = 12;
const ALTURA_BARRAS = ALTO - MARGEN_SUPERIOR;
const BARRA = 24;
const SEPARACION = 6;

export function RevenueChart() {
  const { cuotas } = useData();

  const meses = ultimosMeses(MES_ACTUAL, 6).map((mes) => {
    const delMes = cuotas.filter((cuota) => cuota.mesAsociado === mes);
    const esperado = esperadoDe(delMes);
    const recaudado = recaudadoDe(delMes);
    return {
      mes,
      esperado,
      recaudado,
      pendiente: Math.max(0, esperado - recaudado),
    };
  });

  const maximo = Math.max(
    ...meses.map((mes) => Math.max(mes.esperado, mes.recaudado)),
    1,
  );
  const paso = ANCHO / meses.length;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Recaudación mensual</CardTitle>
          <CardDescription>
            Esperado vs. cobrado en los últimos 6 meses
          </CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-brand-600" />
            Cobrado
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-200 dark:bg-slate-700" />
            Esperado
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-1 text-[11px] text-slate-400">
          Máximo del período: {formatARS(maximo)}
        </p>

        <svg
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          preserveAspectRatio="none"
          className="h-44 w-full"
          role="img"
          aria-label={`Recaudación de los últimos 6 meses. Máximo ${formatARS(maximo)}.`}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((proporcion) => {
            const y =
              MARGEN_SUPERIOR + ALTURA_BARRAS - proporcion * ALTURA_BARRAS;
            return (
              <line
                key={proporcion}
                x1={0}
                x2={ANCHO}
                y1={y}
                y2={y}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth={1}
                strokeDasharray={proporcion === 0 ? undefined : "3 5"}
              />
            );
          })}

          {meses.map((mes, indice) => {
            const centro = paso * (indice + 0.5);
            const xEsperado = centro - BARRA - SEPARACION / 2;
            const xRecaudado = centro + SEPARACION / 2;
            const alturaEsperado = (mes.esperado / maximo) * ALTURA_BARRAS;
            const alturaRecaudado = (mes.recaudado / maximo) * ALTURA_BARRAS;
            const base = MARGEN_SUPERIOR + ALTURA_BARRAS;

            return (
              <g key={mes.mes}>
                <rect
                  x={xEsperado}
                  y={base - alturaEsperado}
                  width={BARRA}
                  height={Math.max(alturaEsperado, 0)}
                  rx={3}
                  className="fill-slate-200 dark:fill-slate-700"
                >
                  <title>{`${formatMes(mes.mes)} · Esperado ${formatARS(mes.esperado)}`}</title>
                </rect>
                <rect
                  x={xRecaudado}
                  y={base - alturaRecaudado}
                  width={BARRA}
                  height={Math.max(alturaRecaudado, 0)}
                  rx={3}
                  className="fill-brand-600"
                >
                  <title>{`${formatMes(mes.mes)} · Cobrado ${formatARS(mes.recaudado)}`}</title>
                </rect>
              </g>
            );
          })}
        </svg>

        <div className="mt-2 grid grid-cols-6 text-center text-xs text-slate-500 dark:text-slate-400">
          {meses.map((mes) => (
            <span key={mes.mes} className="capitalize">
              {formatMesCorto(mes.mes)}
            </span>
          ))}
        </div>

        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-brand-700 select-none dark:text-brand-300">
            Ver detalle por mes
          </summary>
          <TableWrap className="mt-3">
            <Table>
              <THead>
                <TR>
                  <TH>Mes</TH>
                  <TH className="text-right">Esperado</TH>
                  <TH className="text-right">Cobrado</TH>
                  <TH className="text-right">Pendiente</TH>
                </TR>
              </THead>
              <TBody>
                {meses.map((mes) => (
                  <TR key={mes.mes}>
                    <TD className="capitalize">{formatMes(mes.mes)}</TD>
                    <TD className="text-right tabular-nums">
                      {formatARS(mes.esperado)}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {formatARS(mes.recaudado)}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {formatARS(mes.pendiente)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        </details>
      </CardContent>
    </Card>
  );
}
