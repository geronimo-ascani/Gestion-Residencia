import { Link, useNavigate, useParams } from "react-router";
import { MultaForm } from "../Components/multa-form";
import { PageHeader } from "../Components/ui/page-header";
import { useToast } from "../Components/ui/toast";
import { useData } from "../lib/store";
export function meta() { return [{ title: "Editar multa · Gestión de Residencia" }]; }
export default function EditarMulta() {
  const { idMulta } = useParams();
  const { multas, facturas, actualizarMulta } = useData();
  const multa = multas.find((m) => m.idMulta === idMulta);
  const navigate = useNavigate();
  const { toast } = useToast();
  const factura = facturas.find((f) => f.detalles.some((d) => d.idMulta === idMulta));
  if (factura) return <div className="flex flex-col gap-6"><PageHeader eyebrow="Multas" title="Multa facturada" description="Esta multa ya está incluida en una factura y conserva sus condiciones de emisión." /><Link to={`/facturacion/${factura.idFactura}`} className="text-brand-700 underline">Ver factura {factura.idFactura}</Link></div>;
  if (!multa || multa.estado !== "pendiente") return <div className="space-y-4"><h1 className="text-2xl font-semibold">Edición no disponible</h1><p>Solo se pueden editar multas pendientes existentes.</p><Link to="/multas" className="underline">Volver a multas</Link></div>;
  return <div className="space-y-6"><PageHeader eyebrow={`Multas · ${multa.idMulta}`} title="Editar multa" description="Los cambios se aplican únicamente a esta multa individual. El plazo original de cobro se conserva." /><MultaForm key={multa.idMulta} multa={multa} onSave={(datos) => {
    actualizarMulta({ ...datos, idMulta: multa.idMulta }); toast({ title: "Multa actualizada" }); navigate(`/multas/${multa.idMulta}`);
  }} /></div>;
}
