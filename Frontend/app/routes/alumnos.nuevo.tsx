import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Button } from "../Components/ui/button";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { SelectField } from "../Components/ui/select-field";
import type { BorradorContrato, ContactoEmergencia } from "../lib/types";
import { TextField } from "../Components/ui/text-field";
import { useToast } from "../Components/ui/toast";
import { useData } from "../lib/store";

interface Errores {
  nombre?: string;
  apellido?: string;
  documento?: string;
  telefono?: string;
  correo?: string;
}

export function meta() {
  return [{ title: "Ingresar alumno · Gestión de Residencia" }];
}

export default function NuevoAlumno() {
  const { crearAlumno, alumnos } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const contratoBorrador = (location.state as { contratoBorrador?: BorradorContrato } | null)?.contratoBorrador;
  const destinoVolver = contratoBorrador ? "/contratos/nuevo" : "/alumnos";
  const idBase = useId();

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [documento, setDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [errorIngreso, setErrorIngreso] = useState("");
  const [datosIngreso, setDatosIngreso] = useState<Record<string, string>>({});
  const [contactos, setContactos] = useState<Array<ContactoEmergencia & { id: number }>>([
    { id: 0, nombre: "", vinculo: "", telefono: "" },
  ]);
  const [siguienteContacto, setSiguienteContacto] = useState(1);
  function actualizarContacto(id: number, campo: keyof ContactoEmergencia, valor: string) {
    setContactos((previos) => previos.map((contacto) => contacto.id === id ? { ...contacto, [campo]: valor } : contacto));
  }
  const [errores, setErrores] = useState<Errores>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorIngreso("");
    const nuevosErrores: Errores = {};

    if (!nombre.trim()) nuevosErrores.nombre = "Ingresá el nombre.";
    if (!apellido.trim()) nuevosErrores.apellido = "Ingresá el apellido.";
    if (!documento.trim()) nuevosErrores.documento = "Ingresá el documento.";
    if (!telefono.trim()) nuevosErrores.telefono = "Ingresá el teléfono.";
    if (!correo.trim()) {
      nuevosErrores.correo = "Ingresá el correo.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      nuevosErrores.correo = "Ingresá un correo válido.";
    }

    const normalizarDocumento = (valor: string) => valor.replace(/[.\s-]/g, "").toLowerCase();
    if (alumnos.some((a) => normalizarDocumento(a.documento) === normalizarDocumento(documento))) {
      nuevosErrores.documento = "Ya existe un alumno con este documento. Buscalo en Alumnos para registrar un reingreso.";
    }
    if (datosIngreso.fechaNacimiento && datosIngreso.fechaNacimiento >= new Date().toISOString().slice(0, 10)) {
      setErrorIngreso("La fecha de nacimiento debe ser anterior a hoy.");
      return;
    }
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    if (!datosIngreso.carrera || !["Ingeniería Industrial", "Ingeniería en Sistemas de Información", "Licenciado en Administración Rural"].includes(datosIngreso.carrera) ||
      !datosIngreso.cantidadMateriasCursadas || !Number.isInteger(Number(datosIngreso.cantidadMateriasCursadas)) || Number(datosIngreso.cantidadMateriasCursadas) < 0 ||
      contactos.some((contacto) => !contacto.nombre.trim() || !contacto.vinculo || !contacto.telefono.trim())) {
      setErrorIngreso("Completá la carrera, la cantidad de materias cursadas y los datos de cada contacto de emergencia.");
      return;
    }
    const idAlumno = crearAlumno({
      ...datosIngreso,
      cantidadMateriasCursadas: Number(datosIngreso.cantidadMateriasCursadas),
      contactosEmergencia: contactos.map(({ nombre, vinculo, telefono }) => ({ nombre: nombre.trim(), vinculo, telefono: telefono.trim() })),
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      documento: documento.trim(),
      telefono: telefono.trim(),
      correo: correo.trim(),
    });

    toast({
      title: "Alumno ingresado",
      description: `${nombre.trim()} ${apellido.trim()} se agregó al padrón.`,
    });
    if (contratoBorrador) {
      navigate("/contratos/nuevo", { replace: true, state: { contratoBorrador: { ...contratoBorrador, idAlumno } } });
    } else {
      navigate(`/alumnos/${idAlumno}`);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Alumnos"
        title="Ingresar alumno"
        description="Completá la ficha de ingreso del alumno. Los campos con asterisco son obligatorios."
        actions={
          <Link to={destinoVolver} state={contratoBorrador ? { contratoBorrador } : undefined}>
            <Button variant="outline">
              <Icon name="arrow" className="h-4 w-4 rotate-180" />
              {contratoBorrador ? "Volver al contrato" : "Volver al listado"}
            </Button>
          </Link>
        }
      />

      {contratoBorrador ? <p className="rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-100">Estás cargando el titular de un nuevo contrato. Al guardar volverás al formulario de contrato con este alumno seleccionado y los datos que ya completaste.</p> : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-xl border border-slate-300 bg-white shadow-sm p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-brand-900">Datos personales</h2>
          <p className="mt-1 mb-6 border-b border-slate-200 pb-4 text-sm text-slate-600">Identificación y medios de contacto del alumno.</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <TextField
            id={`${idBase}-nombre`}
            label="Nombre"
            value={nombre}
            required
            autoComplete="given-name"
            error={errores.nombre}
            onChange={(event) => {
              setNombre(event.target.value);
              setErrores((previo) => ({ ...previo, nombre: undefined }));
            }}
          />
          <TextField
            id={`${idBase}-apellido`}
            label="Apellido"
            value={apellido}
            required
            autoComplete="family-name"
            error={errores.apellido}
            onChange={(event) => {
              setApellido(event.target.value);
              setErrores((previo) => ({ ...previo, apellido: undefined }));
            }}
          />
          <TextField
            id={`${idBase}-documento`}
            label="Documento"
            value={documento}
            required
            error={errores.documento}
            onChange={(event) => {
              setDocumento(event.target.value);
              setErrores((previo) => ({ ...previo, documento: undefined }));
            }}
          />
          <TextField
            id={`${idBase}-telefono`}
            label="Teléfono"
            type="tel"
            value={telefono}
            required
            autoComplete="tel"
            error={errores.telefono}
            onChange={(event) => {
              setTelefono(event.target.value);
              setErrores((previo) => ({ ...previo, telefono: undefined }));
            }}
          />
          <TextField
            id={`${idBase}-correo`}
            label="Correo electrónico"
            type="email"
            value={correo}
            required
            autoComplete="email"
            error={errores.correo}
            onChange={(event) => {
              setCorreo(event.target.value);
              setErrores((previo) => ({ ...previo, correo: undefined }));
            }}
          />
          <TextField id={`${idBase}-fechaNacimiento`} label="Fecha de nacimiento" type="date" required value={datosIngreso.fechaNacimiento ?? ""} onChange={(event) => setDatosIngreso((previo) => ({ ...previo, fechaNacimiento: event.target.value }))} />
          <TextField id={`${idBase}-nacionalidad`} label="Nacionalidad" type="text" value={datosIngreso.nacionalidad ?? ""} onChange={(event) => setDatosIngreso((previo) => ({ ...previo, nacionalidad: event.target.value }))} />
        </div>

        </section>
        <section className="rounded-xl border border-slate-300 bg-white shadow-sm p-6 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-lg font-semibold text-brand-900">Domicilio</h2><p className="mt-1 mb-6 border-b border-slate-200 pb-4 text-sm text-slate-600">Domicilio de origen del alumno.</p><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <TextField id={`${idBase}-domicilio`} label="Domicilio de origen" type="text" required value={datosIngreso.domicilio ?? ""} onChange={(event) => setDatosIngreso((previo) => ({ ...previo, domicilio: event.target.value }))} />
          <TextField id={`${idBase}-localidad`} label="Localidad" type="text" required value={datosIngreso.localidad ?? ""} onChange={(event) => setDatosIngreso((previo) => ({ ...previo, localidad: event.target.value }))} />
          <TextField id={`${idBase}-provincia`} label="Provincia" type="text" required value={datosIngreso.provincia ?? ""} onChange={(event) => setDatosIngreso((previo) => ({ ...previo, provincia: event.target.value }))} />
          <TextField id={`${idBase}-codigoPostal`} label="Código postal" type="text" value={datosIngreso.codigoPostal ?? ""} onChange={(event) => setDatosIngreso((previo) => ({ ...previo, codigoPostal: event.target.value }))} />
        </div></section>
        <section className="rounded-xl border border-slate-300 bg-white shadow-sm p-6 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-lg font-semibold text-brand-900">Información académica</h2><p className="mt-1 mb-6 border-b border-slate-200 pb-4 text-sm text-slate-600">Estudiante de la Facultad Regional Trenque Lauquen.</p><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField id={`${idBase}-carrera`} label="Carrera" required value={datosIngreso.carrera ?? ""} onChange={(event) => setDatosIngreso((previo) => ({ ...previo, carrera: event.target.value }))}>
            <option value="" disabled>Seleccionar</option>
            {["Ingeniería Industrial", "Ingeniería en Sistemas de Información", "Licenciado en Administración Rural"].map((carrera) => <option key={carrera} value={carrera}>{carrera}</option>)}
          </SelectField>
          <TextField id={`${idBase}-cantidadMateriasCursadas`} label="Cantidad de materias cursadas" type="number" min={0} step={1} required value={datosIngreso.cantidadMateriasCursadas ?? ""} onChange={(event) => setDatosIngreso((previo) => ({ ...previo, cantidadMateriasCursadas: event.target.value }))} />
          <TextField id={`${idBase}-legajo`} label="Legajo estudiantil" type="text" value={datosIngreso.legajo ?? ""} onChange={(event) => setDatosIngreso((previo) => ({ ...previo, legajo: event.target.value }))} />
        </div></section>
        <section className="rounded-xl border border-slate-300 bg-white shadow-sm p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-lg font-semibold text-brand-900">Contacto de emergencia</h2><p className="mt-1 text-sm text-slate-500">Personas a quienes contactar ante una urgencia. Indicá su vínculo con el alumno.</p></div>
            <Button type="button" variant="outline" onClick={() => {
              setContactos((previos) => [...previos, { id: siguienteContacto, nombre: "", vinculo: "", telefono: "" }]);
              setSiguienteContacto((previo) => previo + 1);
            }}><Icon name="plus" className="h-4 w-4" />Agregar</Button>
          </div>
          <div className="space-y-5">
            {contactos.map((contacto, indice) => (
              <fieldset key={contacto.id} className="rounded-lg border border-slate-300 bg-slate-50 p-4 dark:border-slate-700">
                <legend className="px-2 text-sm font-medium">Contacto {indice + 1}</legend>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <TextField id={`${idBase}-contacto-${contacto.id}-nombre`} label="Nombre y apellido del contacto" required value={contacto.nombre} onChange={(event) => actualizarContacto(contacto.id, "nombre", event.target.value)} />
                  <SelectField id={`${idBase}-contacto-${contacto.id}-vinculo`} label="Vínculo" required value={contacto.vinculo} onChange={(event) => actualizarContacto(contacto.id, "vinculo", event.target.value)}>
                    <option value="" disabled>Seleccionar</option>
                    {["Madre", "Padre", "Familiar", "Tutor/a", "Pareja", "Amigo/a", "Otro"].map((vinculo) => <option key={vinculo} value={vinculo}>{vinculo}</option>)}
                  </SelectField>
                  <TextField id={`${idBase}-contacto-${contacto.id}-telefono`} label="Teléfono de emergencia" type="tel" required value={contacto.telefono} onChange={(event) => actualizarContacto(contacto.id, "telefono", event.target.value)} />
                </div>
                {contactos.length > 1 ? <div className="mt-3 flex justify-end"><Button type="button" variant="ghost" aria-label={`Quitar contacto ${indice + 1}`} onClick={() => setContactos((previos) => previos.filter((item) => item.id !== contacto.id))}>Quitar contacto</Button></div> : null}
              </fieldset>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-slate-300 bg-white shadow-sm p-6 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-lg font-semibold text-brand-900">Información adicional</h2><p className="mt-1 mb-6 border-b border-slate-200 pb-4 text-sm text-slate-600">Observaciones relevantes para la gestión del ingreso.</p><div>
          <label htmlFor={`${idBase}-observaciones`} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Observaciones</label>
          <textarea id={`${idBase}-observaciones`} rows={6} maxLength={2000} value={datosIngreso.observaciones ?? ""} onChange={(event) => setDatosIngreso((previo) => ({ ...previo, observaciones: event.target.value }))} placeholder="Agregá información relevante para el ingreso del alumno…" className="w-full resize-y rounded-lg border border-slate-400 bg-slate-100/80 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:bg-white focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          <p className="mt-1.5 text-right text-xs text-slate-500">{(datosIngreso.observaciones ?? "").length}/2000 caracteres</p>
        </div></section>
        <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">Al guardar se crea la ficha del alumno. El contrato y la habitación se gestionan después; el alumno figurará como pendiente de ingreso hasta tener un contrato vigente.</p>
        {errorIngreso ? <p role="alert" className="text-sm text-red-600">{errorIngreso}</p> : null}
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Link to={destinoVolver} state={contratoBorrador ? { contratoBorrador } : undefined}>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit">
            <Icon name="plus" className="h-4 w-4" />
            {contratoBorrador ? "Guardar alumno y continuar contrato" : "Ingresar alumno"}
          </Button>
        </div>
      </form>
    </div>
  );
}
