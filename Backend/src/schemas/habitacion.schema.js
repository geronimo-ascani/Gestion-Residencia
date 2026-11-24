import { z } from "zod";
import { idCoerce } from "./idHelper.js";
import { FECHA_REFERENCIA } from "../config/constants.js";

/**
 * Esquema de validación para la creación de una Habitación.
 */
export const createHabitacionSchema = z.object({
  numeroHabitacion: z
    .string({ error: "El número de habitación es obligatorio" })
    .trim()
    .min(1, "El número de habitación no puede estar vacío")
    .max(20, "El número de habitación no puede exceder 20 caracteres"),
  capacidadMaxima: z.coerce
    .number({
      error: "La capacidad máxima debe ser un número entero",
    })
    .int("La capacidad máxima debe ser un número entero")
    .positive("La capacidad máxima debe ser al menos de 1 plaza"),
  pisoHabitacion: z.coerce
    .number({ error: "El piso debe ser un número entero" })
    .int("El piso debe ser un número entero")
    .optional()
    .nullable(),
  descripcion: z
    .string()
    .trim()
    .max(255, "La descripción no puede exceder 255 caracteres")
    .optional()
    .nullable(),
});

/**
 * Esquema de validación para actualización parcial de una Habitación.
 */
export const updateHabitacionSchema = createHabitacionSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un campo para actualizar",
  });

/**
 * Esquema de validación para parámetros de ruta con ID de Habitación.
 */
export const habitacionIdParamSchema = z.object({
  id: idCoerce,
});

/**
 * Esquema de validación para filtros y paginación en listado de Habitaciones.
 */
export const queryHabitacionSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  piso: z.coerce.number().int().optional(),
  soloDisponibles: z
    .preprocess((val) => {
      if (typeof val === "string") {
        if (val.toLowerCase() === "true") return true;
        if (val.toLowerCase() === "false") return false;
      }
      return val;
    }, z.boolean())
    .optional(),
});

/**
 * Esquema de validación para asignar un Alumno a una Habitación.
 */
export const asignarAlumnoSchema = z
  .object({
    idAlumno: idCoerce,
    fechaDesde: z.coerce
      .date({ error: "La fecha de inicio debe ser una fecha válida" })
      .default(() => new Date(FECHA_REFERENCIA)),
    fechaHasta: z.coerce
      .date({ error: "La fecha de fin debe ser una fecha válida" })
      .optional()
      .nullable(),
  })
  .refine(
    (data) => !data.fechaHasta || data.fechaHasta > data.fechaDesde,
    {
      message: "La fecha de finalización debe ser posterior a la fecha de inicio",
      path: ["fechaHasta"],
    }
  );

/**
 * Esquema de validación para desasignar/liberar un Alumno de una Habitación.
 */
export const desasignarAlumnoSchema = z.object({
  idAlumno: idCoerce,
  fechaHasta: z.coerce
    .date({ error: "La fecha de egreso debe ser una fecha válida" })
    .default(() => new Date(FECHA_REFERENCIA)),
});
