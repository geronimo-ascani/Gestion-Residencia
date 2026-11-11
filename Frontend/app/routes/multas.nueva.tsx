import { Button } from "../Components/ui/button";
import { Icon } from "../Components/ui/icons";
import { Link, useNavigate, useSearchParams } from "react-router";
import { MultaForm } from "../Components/multa-form";
import { PageHeader } from "../Components/ui/page-header";
import { useToast } from "../Components/ui/toast";
import { useData } from "../lib/store";
export function meta() { return [{ title: "Emitir multa · Gestión de Residencia" }]; }
export default function NuevaMulta() {
  const { emitirMulta } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  return <div className="space-y-6"><PageHeader eyebrow="Multas" title="Emitir multa" description="Registrá la sanción y los alumnos involucrados en una misma acta." actions={<Link to="/multas"><Button variant="outline"><Icon name="arrow" className="h-4 w-4 rotate-180" />Volver al listado de multas</Button></Link>} /><MultaForm alumnoInicial={params.get("alumno") ?? ""} onSave={(datos, idAlumnos) => {
    const ids = emitirMulta({ ...datos, idAlumnos });
    if (!ids.length) return;
    toast({ title: ids.length === 1 ? "Multa emitida" : "Multas emitidas", description: `${ids.length} multas individuales registradas.` });
    navigate(ids.length === 1 ? `/multas/${ids[0]}` : "/multas");
  }} /></div>;
}
