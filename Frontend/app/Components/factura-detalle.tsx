import { Badge, StatusBadge } from "./ui/badge";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "./ui/table";
import { estadoFactura, saldoFactura, totalFactura } from "../lib/facturacion";
import { formatARS } from "../lib/format";
import type { Factura, Pago } from "../lib/types";

export function EstadoFacturaBadge({ factura, pagos }: { factura: Factura; pagos: Pago[] }) {
  const estado = estadoFactura(factura, pagos);
  return <span className="inline-flex flex-wrap gap-2"><StatusBadge estado={estado === "parcial" ? "pendiente" : estado} />{saldoFactura(factura, pagos) > 0 && saldoFactura(factura, pagos) < totalFactura(factura) ? <Badge variant="warning">Pago parcial</Badge> : null}</span>;
}

export function FacturaDetalle({ factura }: { factura: Factura }) {
  return <TableWrap><Table><THead><TR><TH>Concepto</TH><TH className="text-right">Importe</TH></TR></THead><TBody>
    {factura.detalles.map((detalle, indice) => <TR key={indice}><TD><span className="whitespace-normal">{detalle.concepto}</span></TD><TD className="text-right whitespace-nowrap tabular-nums">{formatARS(detalle.monto)}</TD></TR>)}
    <TR><TD className="font-semibold">Total de la factura</TD><TD className="text-right font-semibold whitespace-nowrap tabular-nums">{formatARS(totalFactura(factura))}</TD></TR>
  </TBody></Table></TableWrap>;
}
