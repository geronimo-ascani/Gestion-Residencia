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
  numeroHabitacion?: string;
  pisoHabitacion?: string;
  capacidadMaxima?: string;
  descripcion?: string;
}

export function meta() {
  return [{ title: "Agregar habitación · Gestión de Residencia" }];
}

export default function NuevaHabitacion() {
  const { habitaciones, crearHabitacion } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const idBase = useId();
  const [numeroHabitacion, setNumeroHabitacion] = useState("");
  const [pisoHabitacion, setPisoHabitacion] = useState("");
  const [capacidadMaxima, setCapacidadMaxima] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [errores, setErrores] = useState<Errores>({});

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

    const idHabitacion = crearHabitacion({
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
    navigate(`/habitaciones/${idHabitacion}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Habitaciones"
        title="Agregar habitación"
        description="Ingresá los datos para incorporarla al inventario."
        actions={
          <Link to="/habitaciones">
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

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Link to="/habitaciones">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit">
            <Icon name="plus" className="h-4 w-4" />
            Agregar habitación
          </Button>
        </div>
      </form>
    </div>
  );
}