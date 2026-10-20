import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import { useData } from "../../lib/store";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { TextField } from "../ui/text-field";
import { useToast } from "../ui/toast";

interface Errores {
  nombre?: string;
  apellido?: string;
  documento?: string;
  telefono?: string;
  correo?: string;
}

export function NuevoAlumnoDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
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

  useEffect(() => {
    if (!open) return;
    setNombre("");
    setApellido("");
    setDocumento("");
    setTelefono("");
    setCorreo("");
    setErrores({});
  }, [open]);

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
    onClose();
    navigate(`/alumnos/${idAlumno}`);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Nuevo alumno"
      description="Después de crearlo podés asignarle una habitación y un contrato."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id={`${idBase}-nombre`}
            label="Nombre"
            value={nombre}
            required
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
            error={errores.apellido}
            onChange={(event) => {
              setApellido(event.target.value);
              setErrores((previo) => ({ ...previo, apellido: undefined }));
            }}
          />
        </div>

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

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id={`${idBase}-telefono`}
            label="Teléfono"
            type="tel"
            value={telefono}
            required
            error={errores.telefono}
            onChange={(event) => {
              setTelefono(event.target.value);
              setErrores((previo) => ({ ...previo, telefono: undefined }));
            }}
          />
          <TextField
            id={`${idBase}-correo`}
            label="Correo"
            type="email"
            value={correo}
            required
            error={errores.correo}
            onChange={(event) => {
              setCorreo(event.target.value);
              setErrores((previo) => ({ ...previo, correo: undefined }));
            }}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Crear alumno</Button>
        </div>
      </form>
    </Dialog>
  );
}
