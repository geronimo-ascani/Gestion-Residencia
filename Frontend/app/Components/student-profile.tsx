import { StudentSection } from "./student-ui";
import { Link } from "react-router";
import { formatFecha } from "../lib/format";
import type { Alumno, Usuario } from "../lib/types";
import { Avatar } from "./ui/avatar";
import { Card, CardContent } from "./ui/card";
import { Icon } from "./ui/icons";
import { StudentDetail } from "./student-detail";

export function StudentProfile({ alumno: a, cuenta }: { alumno: Alumno; cuenta: Usuario }) {
  const contactos = a.contactosEmergencia ?? (a.emergenciaNombre ? [{ nombre: a.emergenciaNombre, vinculo: a.emergenciaVinculo ?? "", telefono: a.emergenciaTelefono ?? "" }] : []);
  return <div className="space-y-6">
    <Card className="flex flex-wrap items-center justify-between gap-5 rounded-3xl bg-brand-50 p-6 dark:bg-brand-900/20">
      <div className="flex items-center gap-4"><Avatar nombre={`${a.nombre} ${a.apellido}`} /><div><h2 className="text-xl font-semibold">{a.nombre} {a.apellido}</h2><p className="mt-1 text-sm text-slate-500">{cuenta.correo}</p><p className="mt-1 text-xs text-slate-500">Alumno de la residencia</p></div></div>
      <Link to="/estudiante/cambiar-clave" className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"><Icon name="settings" className="h-4 w-4" />Cambiar contraseña</Link>
    </Card>
    <StudentSection title="Datos personales" description="Tu información de contacto y domicilio." icon="user"><dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <StudentDetail label="Documento" icon="contracts">{a.documento}</StudentDetail><StudentDetail label="Correo de contacto" icon="user">{a.correo}</StudentDetail><StudentDetail label="Teléfono" icon="user">{a.telefono}</StudentDetail><StudentDetail label="Fecha de nacimiento" icon="calendar">{formatFecha(a.fechaNacimiento)}</StudentDetail><StudentDetail label="Nacionalidad" icon="building">{a.nacionalidad}</StudentDetail><StudentDetail label="Domicilio" icon="building">{a.domicilio}</StudentDetail><StudentDetail label="Localidad" icon="building">{a.localidad}</StudentDetail><StudentDetail label="Provincia" icon="building">{a.provincia}</StudentDetail><StudentDetail label="Código postal" icon="building">{a.codigoPostal}</StudentDetail>
    </dl></StudentSection>
    <StudentSection title="Información académica" description="Tu recorrido académico y datos de cursado." icon="contracts"><dl className="grid gap-3 sm:grid-cols-2"><StudentDetail label="Institución" icon="building">{a.institucion}</StudentDetail><StudentDetail label="Carrera" icon="contracts">{a.carrera}</StudentDetail><StudentDetail label="Año de cursado" icon="calendar">{a.anioCursado}</StudentDetail><StudentDetail label="Legajo" icon="user">{a.legajo}</StudentDetail><StudentDetail label="Materias cursadas" icon="contracts">{a.cantidadMateriasCursadas}</StudentDetail></dl></StudentSection>
    <section aria-labelledby="contactos-emergencia" className="space-y-4"><div><h2 id="contactos-emergencia" className="text-lg font-semibold">Contactos de emergencia</h2><p className="mt-1 text-sm text-slate-500">Personas a las que podemos contactar si necesitás asistencia.</p></div>
      {contactos.length ? <div className="grid gap-4 md:grid-cols-2">{contactos.map((c, i) => <Card key={i} className="overflow-hidden rounded-3xl"><div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/50"><span className="rounded-xl bg-white p-2.5 text-brand-700 dark:bg-slate-900 dark:text-brand-300"><Icon name="user" className="h-5 w-5" /></span><div><p className="text-xs text-slate-500">Contacto {i + 1} · {c.vinculo || "Vínculo sin registrar"}</p><h3 className="mt-1 font-semibold">{c.nombre}</h3></div></div><CardContent><dl><StudentDetail label="Teléfono de emergencia" icon="user">{c.telefono || "Sin registrar"}</StudentDetail></dl></CardContent></Card>)}</div> : <Card className="p-5 text-sm text-slate-500">Sin contactos registrados.</Card>}
    </section>
    <p className="text-sm text-slate-500">Para corregir tus datos personales, académicos o contactos de emergencia, contactá a la administración.</p>
  </div>;
}
