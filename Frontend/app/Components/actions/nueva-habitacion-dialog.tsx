import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import { useData } from "../../lib/store";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { TextField } from "../ui/text-field";
import { useToast } from "../ui/toast";

interface Errores {
  numeroHabitacion?: string;
  pisoHabitacion?: string;
  capacidadMaxima?: string;
  descripcion?: string;
}

export function NuevaHabitacionDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { habitaciones, crearHabitacion } = useData();
  const { toast } = useToast();
  const idBase = useId();
  const [numeroHabitacion, setNumeroHabitacion] = useState("");
  const [pisoHabitacion, setPisoHabitacion] = useState("");
  const [capacidadMaxima, setCapacidadMaxima] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [errores, setErrores] = useState<Errores>({});

  useEffect(() => {
    if (!open) return;
    setNumeroHabitacion("");
    setPisoHabitacion("");
    setCapacidadMaxima("");
    setDescripcion("");
    setErrores({});
  }, [open]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nuevosErrores: Errores = {};
    const numeroNormalizado = numeroHabitacion.trim();
    const piso = pisoHabitacion.trim() ? Number(pisoHabitacion) : null;
    const capacidad = Number(capacidadMaxima);

    if (!numeroNormalizado) {
      nuevosErrores.numeroHabitacion = "Ingresá el número de habitación.";
    } else if (
      habitaciones.some(
        (habitacion) =>
          habitacion.numeroHabitacion.toLowerCase() ===
          numeroNormalizado.toLowerCase(),
      )
    ) {
      nuevosErrores.numeroHabitacion = "Ya existe una habitación con ese número.";
    }

    if (piso !== null && (!Number.isInteger(piso) || piso < 1)) {
      nuevosErrores.pisoHabitacion = "Ingresá un piso mayor que cero.";
    }
    if (!Number.isInteger(capacidad) || capacidad < 1) {
      nuevosErrores.capacidadMaxima = "La capacidad debe ser al menos 1.";
    }
    if (!descripcion.trim()) {
      nuevosErrores.descripcion = "Ingresá una descripción.";
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    crearHabitacion({
      numeroHabitacion: numeroNormalizado,
      pisoHabitacion: piso,
      capacidadMaxima: capacidad,
      descripcion: descripcion.trim(),
    });
    toast({
      title: "Habitación agregada",
      description:
        piso === null
          ? `Habitación ${numeroNormalizado}`
          : `Habitación ${numeroNormalizado} · Piso ${piso}`,
    });
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Agregar habitación"
      description="Completá los datos para incorporarla al inventario."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id={`${idBase}-numero`}
            label="Número de habitación"
            value={numeroHabitacion}
            required
            error={errores.numeroHabitacion}
            onChange={(event) => {
              setNumeroHabitacion(event.target.value);
              setErrores((previo) => ({ ...previo, numeroHabitacion: undefined }));
            }}
          />
          <TextField
            id={`${idBase}-piso`}
            label="Piso (opcional)"
            type="number"
            min={1}
            step={1}
            value={pisoHabitacion}
            hint="Dejalo vacío si no está especificado."
            error={errores.pisoHabitacion}
            onChange={(event) => {
              setPisoHabitacion(event.target.value);
              setErrores((previo) => ({ ...previo, pisoHabitacion: undefined }));
            }}
          />
          <TextField
            id={`${idBase}-capacidad`}
            label="Capacidad máxima"
            type="number"
            min={1}
            step={1}
            value={capacidadMaxima}
            required
            error={errores.capacidadMaxima}
            onChange={(event) => {
              setCapacidadMaxima(event.target.value);
              setErrores((previo) => ({ ...previo, capacidadMaxima: undefined }));
            }}
          />
          <TextField
            id={`${idBase}-descripcion`}
            label="Descripción"
            value={descripcion}
            required
            error={errores.descripcion}
            onChange={(event) => {
              setDescripcion(event.target.value);
              setErrores((previo) => ({ ...previo, descripcion: undefined }));
            }}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Agregar habitación</Button>
        </div>
      </form>
    </Dialog>
  );
}