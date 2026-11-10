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
  const [numeroHabitacion, setNumeroHabitacion] = useState(() =>
    String(Math.max(0, ...habitaciones.map((habitacion) => Number(habitacion.numeroHabitacion))) + 1),
  );
  const [capacidadMaxima, setCapacidadMaxima] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [errores, setErrores] = useState<Errores>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nuevosErrores: Errores = {};
    const numero = Number(numeroHabitacion);
    const numeroNormalizado = String(numero);
    const capacidad = Number(capacidadMaxima);

    if (!Number.isInteger(numero) || numero < 1) {
      nuevosErrores.numeroHabitacion = "Ingresá un número entero a partir de 1.";
    } else if (
      habitaciones.some(
        (habitacion) =>
          habitacion.numeroHabitacion.toLowerCase() ===
          numeroNormalizado.toLowerCase(),
      )
    ) {
      nuevosErrores.numeroHabitacion = "Ya existe una habitación con ese número.";
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
      pisoHabitacion: 0,
      capacidadMaxima: capacidad,
      descripcion: descripcion.trim(),
    });
    toast({
      title: "Habitación agregada",
      description: `Habitación ${numeroNormalizado} · Planta baja`,
    });
    navigate(`/habitaciones/${idHabitacion}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Habitaciones"
        title="Agregar habitación"
        description="Las habitaciones de la residencia se encuentran en planta baja."
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
            type="number"
            min={1}
            step={1}
            hint="Se sugiere el siguiente número del listado."
            value={numeroHabitacion}
            required
            error={errores.numeroHabitacion}
            onChange={(event) => {
              setNumeroHabitacion(event.target.value);
              setErrores((previo) => ({ ...previo, numeroHabitacion: undefined }));
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
