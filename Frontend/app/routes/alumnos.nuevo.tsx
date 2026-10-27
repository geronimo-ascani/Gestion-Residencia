import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../Components/ui/button";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
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
  return [{ title: "Crear alumno · Gestión de Residencia" }];
}

export default function NuevoAlumno() {
  const { crearAlumno } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const idBase = useId();

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [documento, setDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [errores, setErrores] = useState<Errores>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    const idAlumno = crearAlumno({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      documento: documento.trim(),
      telefono: telefono.trim(),
      correo: correo.trim(),
    });

    toast({
      title: "Alumno creado",
      description: `${nombre.trim()} ${apellido.trim()} se agregó al padrón.`,
    });
    navigate(`/alumnos/${idAlumno}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Alumnos"
        title="Crear alumno"
        description="Ingresá los datos personales para agregarlo al padrón."
        actions={
          <Link to="/alumnos">
            <Button variant="outline">
              <Icon name="arrow" className="h-4 w-4 rotate-180" />
              Volver al listado
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
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
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Link to="/alumnos">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit">
            <Icon name="plus" className="h-4 w-4" />
            Crear alumno
          </Button>
        </div>
      </form>
    </div>
  );
}