import { ButtonLink } from "./button";
import { Icon } from "./icons";

/** Formato único para regresar a cualquier listado. */
export function BackToList({ to }: { to: string }) {
  return <ButtonLink to={to} variant="outline"><Icon name="arrow" className="h-4 w-4 rotate-180" />Volver al listado</ButtonLink>;
}
