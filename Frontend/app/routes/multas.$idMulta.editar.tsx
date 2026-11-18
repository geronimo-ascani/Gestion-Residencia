import { Link, useNavigate, useParams } from "react-router";
import { MultaForm } from "../Components/multa-form";
import { PageHeader } from "../Components/ui/page-header";
import { useToast } from "../Components/ui/toast";
import { facturaActivaDeMulta } from "../lib/facturacion";
import { useData } from "../lib/store";
export function meta() { return [{ title: "Editar multa · Gestión de Residencia" }]; }
export default function EditarMulta() {
  const { idMulta } = useParams();
  const { multas, facturas, actualizarMulta } = useData();
  const multa = multas.find((m) => m.idMulta === idMulta);
  const navigate = useNavigate();
  const { toast } = useToast();
  const factura = facturaActivaDeMulta(facturas, idMulta);
  if (!multa || multa.estado !== "pendiente") return <div className="space-y-4"><h1 className="text-2xl font-semibold">Edición no disponible</h1><p>Solo se pueden editar multas pendientes existentes.</p><Link to="/multas" className="underline">Volver a multas</Link></div>;
  return <div className="space-y-6"><PageHeader eyebrow={`Multas · ${multa.idMulta}`} title="Editar multa" description={factura ? `Los cambios de importe o concepto se reflejan en la factura ${factura.idFactura}.` : "Editá los datos de esta multa individual."} /><MultaForm key={multa.idMulta} multa={multa} onSave={(datos, _alumnos, fechaVence) => {
    actualizarMulta({ ...datos, fechaVence, idMulta: multa.idMulta }); toast({ title: "Multa actualizada" }); navigate(`/multas/${multa.idMulta}`);
  }} /></div>;
}
