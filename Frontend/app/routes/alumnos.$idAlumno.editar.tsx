import { useLocation, useParams } from "react-router";
import { AlumnoForm } from "../Components/alumno-form";
import { ButtonLink } from "../Components/ui/button";
import { EmptyState } from "../Components/ui/empty-state";
import { PageHeader } from "../Components/ui/page-header";
import { esModuloAlumno } from "../lib/modulos-alumno";
import { useData } from "../lib/store";

export function meta() {
  return [{ title: "Editar alumno · Gestión de Residencia" }];
}

export default function EditarAlumno() {
  const { idAlumno, modulo } = useParams();
  const { search } = useLocation();
  const { alumnoPorId } = useData();
  const alumno = idAlumno ? alumnoPorId.get(idAlumno) : undefined;

  if (!alumno) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow="Alumnos" title="Alumno no encontrado" />
        <EmptyState
          icon="users"
          title="Sin resultados"
          description="No existe un alumno con el identificador solicitado."
          action={<ButtonLink to="/alumnos">Volver al listado</ButtonLink>}
        />
      </div>
    );
  }

  if (!esModuloAlumno(modulo)) {
    return (
      <EmptyState
        icon="users"
        title="Sección no encontrada"
        description="Elegí qué datos querés editar desde la ficha del alumno."
        action={<ButtonLink to={`/alumnos/${encodeURIComponent(alumno.idAlumno)}${search}`}>Volver a la ficha</ButtonLink>}
      />
    );
  }

  return <AlumnoForm key={`${alumno.idAlumno}/${modulo}`} alumno={alumno} modulo={modulo} />;
}
