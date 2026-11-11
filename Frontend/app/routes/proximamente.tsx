import { Link, useLocation } from "react-router";
import { Card } from "../Components/ui/card";
import { EmptyState } from "../Components/ui/empty-state";
import { PageHeader } from "../Components/ui/page-header";

const SECCIONES: Record<string, string> = {
  alumnos: "Alumnos",
  habitaciones: "Habitaciones",
  contratos: "Contratos",
  multas: "Multas",
  limpieza: "Limpieza",
  configuracion: "Configuración",
};

export function meta() {
  return [{ title: "Sección en preparación · Gestión de Residencia" }];
}

export default function Proximamente() {
  const { pathname } = useLocation();
  const seccion = pathname.split("/").filter(Boolean)[0] ?? "";
  const nombre = SECCIONES[seccion] ?? "Sección";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={nombre}
        description="Esta sección se implementa en la próxima etapa."
      />
      <Card>
        <EmptyState
          icon="building"
          title={`${nombre} en preparación`}
          description="Por ahora está disponible el panel principal con el resumen del edificio. Las pantallas de detalle y gestión llegan en la próxima iteración."
          action={
            <Link
              to="/"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Volver al panel
            </Link>
          }
        />
      </Card>
    </div>
  );
}
