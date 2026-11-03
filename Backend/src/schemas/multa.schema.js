import { z } from "zod";

export const ESTADOS_MULTA = ["PENDIENTE", "PAGADA", "ANULADA"];

/**
 * Esquema de validación para la creación de una Multa.
 */
export const createMultaSchema = z
  .object({
    idAlumno: z.coerce
      .number({
        required_error: "El ID del alumno es obligatorio",
        invalid_type_error: "El ID del alumno debe ser un entero",
      })
      .int("El ID del alumno debe ser un entero")
      .positive("El ID del alumno debe ser positivo"),
    monto: z.coerce
      .number({
        required_error: "El monto de la multa es obligatorio",
        invalid_type_error: "El monto debe ser un número válido",
      })
      .positive("El monto de la multa debe ser mayor a 0"),
    fechaEmision: z.coerce
      .date({ invalid_type_error: "La fecha de emisión debe ser una fecha válida" })
      .default(() => new Date()),
    fechaVence: z.coerce.date({
      required_error: "La fecha de vencimiento es obligatoria",
      invalid_type_error: "La fecha de vencimiento debe ser una fecha válida",
    }),
    estadoMulta: z
      .enum(ESTADOS_MULTA, {
        errorMap: () => ({
          message: `El estado debe ser uno de: ${ESTADOS_MULTA.join(", ")}`,
        }),
      })
      .default("PENDIENTE"),
  })
  .refine((data) => data.fechaVence >= data.fechaEmision, {
    message: "La fecha de vencimiento no puede ser anterior a la fecha de emisión",
    path: ["fechaVence"],
  });

/**
 * Esquema de validación para actualización parcial de una Multa.
 */
export const updateMultaSchema = z
  .object({
    monto: z.coerce.number().positive("El monto debe ser mayor a 0").optional(),
    fechaVence: z.coerce.date().optional(),
    estadoMulta: z
      .enum(ESTADOS_MULTA, {
        errorMap: () => ({
          message: `El estado debe ser uno de: ${ESTADOS_MULTA.join(", ")}`,
        }),
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un campo para actualizar",
  });

/**
 * Esquema de validación para cambio rápido de estado de una Multa.
 */
export const cambiarEstadoMultaSchema = z.object({
  estadoMulta: z.enum(ESTADOS_MULTA, {
    errorMap: () => ({
      message: `El estado debe ser uno de: ${ESTADOS_MULTA.join(", ")}`,
    }),
  }),
});

/**
 * Esquema de validación para parámetros de ruta con ID de Multa.
 */
export const multaIdParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: "El ID debe ser un número entero válido" })
    .int("El ID debe ser un número entero")
    .positive("El ID debe ser un número positivo"),
});

/**
 * Esquema de validación para filtros y paginación en listado de Multas.
 */
export const queryMultaSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  idAlumno: z.coerce.number().int().positive().optional(),
  estadoMulta: z.enum(ESTADOS_MULTA).optional(),
  search: z.string().trim().optional(),
  soloVencidas: z
    .preprocess((val) => {
      if (typeof val === "string") {
        if (val.toLowerCase() === "true") return true;
        if (val.toLowerCase() === "false") return false;
      }
      return val;
    }, z.boolean())
    .optional(),
});

