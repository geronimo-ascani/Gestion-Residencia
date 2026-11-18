import { useParams } from "react-router";
import { HabitacionForm } from "./habitaciones.nueva";
import { BackToList } from "../Components/ui/back-to-list";
import { PageHeader } from "../Components/ui/page-header";
import { useData } from "../lib/store";

export function meta() {
  return [{ title: "Modificar habitación · Gestión de Residencia" }];
}

export default function EditarHabitacion() {
  const { idHabitacion } = useParams();
  const { habitacionPorId } = useData();
  const habitacion = habitacionPorId.get(idHabitacion ?? "");
  if (!habitacion) return <PageHeader eyebrow="Habitaciones" title="Habitación no encontrada" actions={<BackToList to="/habitaciones" />} />;
  return <HabitacionForm key={habitacion.idHabitacion} habitacion={habitacion} />;
}
