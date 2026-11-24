import { z } from "zod";
import { idCoerce } from "./idHelper.js";

/**
 * Esquema para generar una factura individual a partir de un contrato y período.
 */
export const generarFacturaSchema = z.object({
  idContrato: idCoerce,
  periodo: z
    .string({ error: "El período es obligatorio" })
    .trim()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "El período debe tener el formato YYYY-MM"),
});

/**
 * Esquema para generación masiva de facturas de un período mensual.
 */
export const generarFacturasMesSchema = z.object({
  periodo: z
    .string({ error: "El período es obligatorio" })
    .trim()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "El período debe tener el formato YYYY-MM"),
});

/**
 * Esquema para validar el parámetro de ruta ID de factura.
 */
export const facturaIdParamSchema = z.object({
  id: idCoerce,
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
  idContrato: idCoerce.optional(),
  idAlumno: idCoerce.optional(),
  estado: z.enum(["pagada", "parcial", "vencida", "pendiente", "cancelada"]).optional(),
  search: z.string().trim().optional(),
});

/**
 * Esquema para cancelar una factura.
 */
export const cancelarFacturaSchema = z.object({
  motivo: z.string().trim().max(300, "El motivo no puede exceder 300 caracteres").optional(),
});

/**
 * Esquema para emitir un reemplazo de una factura cancelada.
 */
export const emitirReemplazoSchema = z.object({
  idFacturaOrigen: idCoerce,
  idContrato: idCoerce,
  periodo: z
    .string({ error: "El período es obligatorio" })
    .trim()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "El período debe tener el formato YYYY-MM"),
  concepto: z
    .string({ error: "El concepto es obligatorio" })
    .trim()
    .min(1, "El concepto no puede estar vacío")
    .max(200, "El concepto no puede exceder 200 caracteres"),
  monto: z.coerce
    .number({ error: "El monto es obligatorio" })
    .positive("El importe debe ser mayor a cero")
    .max(100000000, "El importe no puede superar 100.000.000"),
  fechaVence: z
    .string({ error: "La fecha de vencimiento es obligatoria" })
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha de vencimiento inválido (YYYY-MM-DD)"),
});
