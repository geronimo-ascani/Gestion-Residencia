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

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Datos de la habitación</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Completá el número, las plazas disponibles y una descripción para identificarla.
            </p>
          </div>
          <div className="grid gap-x-6 gap-y-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <TextField
            id={`${idBase}-numero`}
            label="Número de habitación"
            type="number"
            min={1}
            step={1}
            hint="Propuesta: siguiente número disponible. Podés modificarlo."
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
            label="Cantidad de plazas"
            type="number"
            min={1}
            step={1}
            hint="Número máximo de residentes que pueden alojarse."
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
            label="Descripción o referencia"
            placeholder="Ej.: habitación compartida, junto al patio…"
            hint="Agregá una referencia útil para identificar este espacio."
            value={descripcion}
            required
            error={errores.descripcion}
            onChange={(event) => {
              setDescripcion(event.target.value);
              setErrores((previo) => ({ ...previo, descripcion: undefined }));
            }}
          />
          </div>
          <div className="flex items-start gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
            <Icon name="building" className="mt-0.5 h-4 w-4 shrink-0 text-brand-700 dark:text-brand-300" />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Ubicación: <span className="font-medium text-slate-800 dark:text-slate-100">planta baja</span>. La residencia cuenta con un único piso.
            </p>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Los campos marcados con * son obligatorios.
          </p>
          <div className="flex gap-2">
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
        </div>
      </form>
    </div>
  );
}
