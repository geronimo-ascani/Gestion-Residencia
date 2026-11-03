import { z } from "zod";

export const ESTADOS_CUOTA = ["PENDIENTE", "PAGADA", "VENCIDA", "ANULADA"];

/**
 * Esquema de validación para la creación individual de una Cuota Mensual.
 */
export const createCuotaSchema = z.object({
  idAlumno: z.coerce
    .number({
      required_error: "El ID del alumno es obligatorio",
      invalid_type_error: "El ID del alumno debe ser un entero",
    })
    .int("El ID del alumno debe ser un entero")
    .positive("El ID del alumno debe ser positivo"),
  mesAsociado: z
    .string({ required_error: "El mes asociado es obligatorio" })
    .trim()
    .min(3, "El mes asociado debe tener al menos 3 caracteres")
    .max(30, "El mes asociado no puede exceder 30 caracteres"),
  montoPagado: z.coerce
    .number({
      required_error: "El monto es obligatorio",
      invalid_type_error: "El monto debe ser un número válido",
    })
    .min(0, "El monto no puede ser negativo"),
  fechaEmision: z.coerce
    .date({ invalid_type_error: "La fecha de emisión debe ser una fecha válida" })
    .optional(),
  estadoCuota: z
    .enum(ESTADOS_CUOTA, {
      errorMap: () => ({
        message: `El estado debe ser uno de: ${ESTADOS_CUOTA.join(", ")}`,
      }),
    })
    .default("PENDIENTE"),
});

/**
 * Esquema para generación masiva de cuotas mensuales para todos los alumnos con contrato vigente.
 */
export const generarCuotasMesSchema = z.object({
  mesAsociado: z
    .string({ required_error: "El mes asociado es obligatorio (ej: 2026-03 o Marzo 2026)" })
    .trim()
    .min(3, "El mes asociado debe tener al menos 3 caracteres")
    .max(30, "El mes asociado no puede exceder 30 caracteres"),
  monto: z.coerce
    .number({
      required_error: "El monto de la cuota es obligatorio",
      invalid_type_error: "El monto debe ser un número",
    })
    .positive("El monto debe ser mayor a 0"),
  fechaEmision: z.coerce.date().optional(),
});

/**
 * Esquema de validación para actualización parcial de una Cuota.
 */
export const updateCuotaSchema = z
  .object({
    mesAsociado: z.string().trim().min(3).max(30).optional(),
    montoPagado: z.coerce.number().min(0).optional(),
    estadoCuota: z
      .enum(ESTADOS_CUOTA, {
        errorMap: () => ({
          message: `El estado debe ser uno de: ${ESTADOS_CUOTA.join(", ")}`,
        }),
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un campo para actualizar",
  });

/**
 * Esquema de validación para registrar el pago de una cuota.
 */
export const registrarPagoCuotaSchema = z.object({
  montoPagado: z.coerce
    .number({ invalid_type_error: "El monto debe ser un número" })
    .min(0, "El monto no puede ser negativo")
    .optional(),
});

/**
 * Esquema de validación para parámetros de ruta con ID de Cuota.
 */
export const cuotaIdParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: "El ID debe ser un número entero válido" })
    .int("El ID debe ser un número entero")
    .positive("El ID debe ser un número positivo"),
});

/**
 * Esquema de validación para filtros y paginación en listado de Cuotas.
 */
export const queryCuotaSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  idAlumno: z.coerce.number().int().positive().optional(),
  estadoCuota: z.enum(ESTADOS_CUOTA).optional(),
  mesAsociado: z.string().trim().optional(),
  search: z.string().trim().optional(),
});

