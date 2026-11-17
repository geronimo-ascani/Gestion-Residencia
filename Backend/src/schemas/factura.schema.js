import { z } from "zod";

/**
 * Esquema para generar una factura individual a partir de un contrato y período.
 */
export const generarFacturaSchema = z.object({
  idContrato: z.coerce
    .number({ required_error: "El ID de contrato es obligatorio" })
    .int()
    .positive("El ID del contrato debe ser un entero positivo"),
  periodo: z
    .string({ required_error: "El período es obligatorio" })
    .trim()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "El período debe tener el formato YYYY-MM"),
});

/**
 * Esquema para generación masiva de facturas de un período mensual.
 */
export const generarFacturasMesSchema = z.object({
  periodo: z
    .string({ required_error: "El período es obligatorio" })
    .trim()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "El período debe tener el formato YYYY-MM"),
});

/**
 * Esquema para validar el parámetro de ruta ID de factura.
 */
export const facturaIdParamSchema = z.object({
  id: z.coerce
    .number({ required_error: "El ID de factura es obligatorio" })
    .int()
    .positive("El ID de la factura debe ser un entero positivo"),
});

/**
 * Esquema para filtrado y paginación del listado de facturas.
 */
export const queryFacturaSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  periodo: z
    .string()
    .trim()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Formato de período inválido (YYYY-MM)")
    .optional(),
  idContrato: z.coerce.number().int().positive().optional(),
  idAlumno: z.coerce.number().int().positive().optional(),
  estado: z.enum(["pagada", "parcial", "vencida", "pendiente"]).optional(),
  search: z.string().trim().optional(),
});
