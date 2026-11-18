import { z } from "zod";

export const ESTADOS_CONTRATO = ["VIGENTE", "FINALIZADO", "RESCINDIDO", "CANCELADO"];

/**
 * Esquema de validación para la creación de un Contrato.
 */
export const createContratoSchema = z
  .object({
    idAlumno: z.coerce
      .number({
        required_error: "El ID del alumno es obligatorio",
        invalid_type_error: "El ID del alumno debe ser un entero",
      })
      .int("El ID del alumno debe ser un entero")
      .positive("El ID del alumno debe ser positivo"),
    fechaDesde: z.coerce
      .date({ invalid_type_error: "La fecha de inicio debe ser una fecha válida" })
      .default(() => new Date()),
    fechaHasta: z.coerce.date({
      required_error: "La fecha de finalización es obligatoria",
      invalid_type_error: "La fecha de finalización debe ser una fecha válida",
    }),
    estado: z
      .enum(ESTADOS_CONTRATO, {
        errorMap: () => ({
          message: `El estado debe ser uno de: ${ESTADOS_CONTRATO.join(", ")}`,
        }),
      })
      .default("VIGENTE"),
  })
  .refine((data) => data.fechaHasta > data.fechaDesde, {
    message: "La fecha de finalización debe ser posterior a la fecha de inicio",
    path: ["fechaHasta"],
  });

/**
 * Esquema de validación para actualización parcial de un Contrato.
 */
export const updateContratoSchema = z
  .object({
    fechaDesde: z.coerce
      .date({ invalid_type_error: "La fecha de inicio debe ser una fecha válida" })
      .optional(),
    fechaHasta: z.coerce
      .date({ invalid_type_error: "La fecha de finalización debe ser una fecha válida" })
      .optional(),
    estado: z
      .enum(ESTADOS_CONTRATO, {
        errorMap: () => ({
          message: `El estado debe ser uno de: ${ESTADOS_CONTRATO.join(", ")}`,
        }),
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un campo para actualizar",
  })
  .refine(
    (data) => {
      if (data.fechaDesde && data.fechaHasta) {
        return data.fechaHasta > data.fechaDesde;
      }
      return true;
    },
    {
      message: "La fecha de finalización debe ser posterior a la fecha de inicio",
      path: ["fechaHasta"],
    }
  );

/**
 * Esquema de validación para cambio rápido de estado (ej. dar de baja o rescindir).
 */
export const cambiarEstadoContratoSchema = z.object({
  estado: z.enum(ESTADOS_CONTRATO, {
    errorMap: () => ({
      message: `El estado debe ser uno de: ${ESTADOS_CONTRATO.join(", ")}`,
    }),
  }),
});

/**
 * Esquema de validación para parámetros de ruta con ID de Contrato.
 */
export const contratoIdParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: "El ID debe ser un número entero válido" })
    .int("El ID debe ser un número entero")
    .positive("El ID debe ser un número positivo"),
});

/**
 * Esquema de validación para filtros y paginación en listado de Contratos.
 */
export const queryContratoSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  idAlumno: z.coerce.number().int().positive().optional(),
  estado: z.enum(ESTADOS_CONTRATO).optional(),
  search: z.string().trim().optional(),
  porVencerDias: z.coerce.number().int().positive().optional(),
});
