import { AvisosAlumno, useAvisosLectura } from "./avisos-alumno";
import type { AvisoAlumno } from "./avisos-alumno";
import { StudentMetric, StudentSection } from "./student-ui";

export function StudentNotices({ avisos }: { avisos: AvisoAlumno[] }) {
  const { estaLeido } = useAvisosLectura();
  const sinLeer = avisos.filter((aviso) => !estaLeido(aviso)).length;
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-3"><StudentMetric label="Todos mis avisos" value={avisos.length} description="Vencimientos y novedades de tu cuenta." icon="bell" /><StudentMetric label="Sin leer" value={sinLeer} description="Avisos que todavía no revisaste." icon="alert" /><StudentMetric label="Ya revisados" value={avisos.length - sinLeer} description="Podés volver a consultarlos cuando quieras." icon="check" /></div>
    <StudentSection title="Tu bandeja de avisos" description="Revisá tus novedades y accedé directamente a cada detalle." icon="bell"><AvisosAlumno avisos={avisos} mostrarAcciones /></StudentSection>
  </div>;
}
