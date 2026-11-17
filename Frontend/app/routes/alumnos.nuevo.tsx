import { AlumnoForm } from "../Components/alumno-form";

export function meta() {
  return [{ title: "Ingresar alumno · Gestión de Residencia" }];
}

export default function NuevoAlumno() {
  return <AlumnoForm />;
}
