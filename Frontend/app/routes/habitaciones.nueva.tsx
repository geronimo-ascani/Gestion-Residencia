import { FormularioConfirmado } from "../Components/ui/formulario-confirmado";
import { BackToList } from "../Components/ui/back-to-list";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import { Button, ButtonLink } from "../Components/ui/button";
import { Icon } from "../Components/ui/icons";
import { PageHeader } from "../Components/ui/page-header";
import { TextField } from "../Components/ui/text-field";
import { useToast } from "../Components/ui/toast";
import { useData } from "../lib/store";
import type { Habitacion } from "../lib/types";

interface Errores {
  numeroHabitacion?: string;
  capacidadMaxima?: string;
  descripcion?: string;
}

export function meta() {
  return [{ title: "Agregar habitación · Gestión de Residencia" }];
}

export default function NuevaHabitacion() {
  return <HabitacionForm />;
}

export function HabitacionForm({ habitacion }: { habitacion?: Habitacion }) {
  const { habitaciones, crearHabitacion, actualizarHabitacion } = useData();
  const destino = habitacion ? `/habitaciones/${habitacion.idHabitacion}` : "/habitaciones";
  const { toast } = useToast();
  const navigate = useNavigate();
  const idBase = useId();
  const [numeroHabitacion, setNumeroHabitacion] = useState(() =>
    habitacion?.numeroHabitacion ?? String(Math.max(0, ...habitaciones.map((habitacion) => Number(habitacion.numeroHabitacion)).filter(Number.isFinite)) + 1),
  );
  const [capacidadMaxima, setCapacidadMaxima] = useState(habitacion ? String(habitacion.capacidadMaxima) : "");
  const [piso, setPiso] = useState(String(habitacion?.pisoHabitacion ?? ""));
  const [error, setError] = useState("");
  const [descripcion, setDescripcion] = useState(habitacion?.descripcion ?? "");
  const [errores, setErrores] = useState<Errores>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const nuevosErrores: Errores = {};
    const numero = Number(numeroHabitacion);
    const numeroNormalizado = String(numero);
    const capacidad = Number(capacidadMaxima);

    if (!Number.isInteger(numero) || numero < 1) {
      nuevosErrores.numeroHabitacion = "Ingresá un número entero a partir de 1.";
    } else if (
      habitaciones.some(
        (item) => item.idHabitacion !== habitacion?.idHabitacion && Number(item.numeroHabitacion) === numero,
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

    let idHabitacion: string;
    const input = {
      numeroHabitacion: numeroNormalizado,
      pisoHabitacion: habitacion ? (piso === "" ? null : Number(piso)) : 0,
      capacidadMaxima: capacidad,
      descripcion: descripcion.trim(),
    };
    try {
      if (habitacion) {
        idHabitacion = habitacion.idHabitacion;
        actualizarHabitacion(idHabitacion, input);
      } else {
        idHabitacion = crearHabitacion(input);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la habitación.");
      return;
    }
    toast({
      title: habitacion ? "Habitación actualizada" : "Habitación agregada",
      description: `Habitación ${numeroNormalizado} · ${capacidad} plazas`,
    });
    navigate(`/habitaciones/${idHabitacion}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Habitaciones"
        title={habitacion ? `Modificar habitación ${habitacion.numeroHabitacion}` : "Agregar habitación"}
        description={habitacion ? "Editá los datos y la capacidad de la habitación." : "Las habitaciones de la residencia se encuentran en planta baja."}
        actions={
          habitacion ? <ButtonLink to={destino} variant="outline">Volver a la habitación</ButtonLink> : <BackToList to={destino} />
        }
      />

      <FormularioConfirmado onSubmit={handleSubmit} className="w-full space-y-6">
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
            hint={habitacion ? undefined : "Propuesta: siguiente número disponible. Podés modificarlo."}
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
          {habitacion ? <TextField id={`${idBase}-piso`} label="Piso" type="number" step={1} hint="Ingresá 0 para planta baja." value={piso} onChange={(event) => setPiso(event.target.value)} /> : null}
          </div>
          {!habitacion ? <div className="flex items-start gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
            <Icon name="building" className="mt-0.5 h-4 w-4 shrink-0 text-brand-700 dark:text-brand-300" />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Ubicación: <span className="font-medium text-slate-800 dark:text-slate-100">planta baja</span>. La residencia cuenta con un único piso.
            </p>
          </div> : null}
        </section>
        {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Los campos marcados con * son obligatorios.
          </p>
          <div className="flex gap-2">
          <ButtonLink data-descartar to={destino} variant="outline">
              Cancelar
            </ButtonLink>
          <Button type="submit">
            <Icon name={habitacion ? "check" : "plus"} className="h-4 w-4" />
            {habitacion ? "Guardar cambios" : "Agregar habitación"}
          </Button>
          </div>
        </div>
      </FormularioConfirmado>
    </div>
  );
}
