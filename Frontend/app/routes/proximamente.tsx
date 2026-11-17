import { Link } from "react-router";
import { Card } from "../Components/ui/card";
import { EmptyState } from "../Components/ui/empty-state";
import { useData } from "../lib/store";
export function meta() { return [{ title: "Página no encontrada · Gestión de Residencia" }]; }
export default function PaginaNoEncontrada() {
  const { usuarioAutenticado } = useData();
  return <Card><EmptyState icon="building" title="Página no encontrada" description="La dirección no existe o la página cambió de ubicación." action={<Link to={usuarioAutenticado?.rol === "alumno" ? "/estudiante" : "/"} className="inline-flex h-10 items-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">Volver al panel</Link>} /></Card>;
}
