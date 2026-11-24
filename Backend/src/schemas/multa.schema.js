import { z } from "zod";
import { idCoerce } from "./idHelper.js";

export const TIPOS_MULTA_VALIDOS = ["leve", "moderada", "grave", "extraordinaria"];
export const ESTADOS_MULTA = ["PENDIENTE", "PAGADA", "ANULADA", "pendiente", "pagada", "anulada", "vencida"];

/**
 * Esquema para la emisión de multas (individual o por lote de alumnos).
 */
export const emitirMultaSchema = z
  .object({
    idAlumno: idCoerce.optional(),
    idAlumnos: z.array(idCoerce).optional(),
    tipo: z.enum(["leve", "moderada", "grave", "extraordinaria"], {
      error: "El tipo de multa debe ser leve, moderada, grave o extraordinaria",
    }),
    motivo: z
      .string({ error: "El motivo de la sanción es obligatorio" })
      .trim()
      .min(3, "El motivo debe tener al menos 3 caracteres")
      .max(4000, "El motivo no puede exceder 4000 caracteres"),
    observaciones: z.string().trim().max(4000).optional().default(""),
    huboDanios: z.boolean().default(false),
    detalleDanios: z.string().trim().max(4000).optional().default(""),
    montoSancion: z.coerce
      .number({ error: "El importe de la sanción es obligatorio" })
      .positive("El importe de la sanción debe ser mayor a 0"),
    montoDanios: z.coerce.number().min(0, "El importe de daños no puede ser negativo").optional().default(0),
    recargoPorcentaje: z.coerce.number().min(0).max(100).optional().default(20),
    fechaEmision: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    fechaVence: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    periodoDesde: z.string().trim().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
    periodoHasta: z.string().trim().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
  })
  .refine(
    (data) => (data.idAlumno !== undefined && data.idAlumno > 0) || (Array.isArray(data.idAlumnos) && data.idAlumnos.length > 0),
    {
      message: "Debe especificar 'idAlumno' o una lista de 'idAlumnos'",
      path: ["idAlumno"],
    }
  )
  .refine(
    (data) => !data.huboDanios || (data.detalleDanios && data.detalleDanios.trim().length > 0),
    {
      message: "Debe detallar el bien y daño ocasionado si se registraron daños",
      path: ["detalleDanios"],
    }
  )
  .refine(
    (data) => !data.huboDanios || (Number(data.montoDanios) > 0),
    {
      message: "El importe de daños debe ser mayor a cero si se declararon daños",
      path: ["montoDanios"],
    }
  );

export const createMultaSchema = emitirMultaSchema;

/**
 * Esquema para actualización parcial de una multa.
 */
export const updateMultaSchema = z
  .object({
    tipo: z.enum(["leve", "moderada", "grave", "extraordinaria"]).optional(),
    motivo: z.string().trim().min(3).max(4000).optional(),
    observaciones: z.string().trim().max(4000).optional(),
    huboDanios: z.boolean().optional(),
    detalleDanios: z.string().trim().max(4000).optional(),
    montoSancion: z.coerce.number().positive().optional(),
    montoDanios: z.coerce.number().min(0).optional(),
    monto: z.coerce.number().positive().optional(),
    recargoPorcentaje: z.coerce.number().min(0).max(100).optional(),
    fechaVence: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    periodoHasta: z.string().trim().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
    estadoMulta: z.enum(["PENDIENTE", "PAGADA", "ANULADA", "pendiente", "pagada", "anulada"]).optional(),
    motivoCambio: z.string().trim().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un campo para actualizar",
  });

/**
 * Esquema para solicitud de prórroga o extensión de plazo de una multa.
 */
export const prorrogarMultaSchema = z.object({
  motivo: z
    .string({ error: "El motivo de la prórroga es obligatorio" })
    .trim()
    .min(3, "El motivo debe tener al menos 3 caracteres")
    .max(500, "El motivo no puede exceder 500 caracteres"),
  dias: z.coerce.number().int().positive().optional(),
  nuevaFechaVence: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * Esquema para anulación de una multa.
 */
export const anularMultaSchema = z.object({
  motivo: z
    .string({ error: "El motivo de la anulación es obligatorio" })
    .trim()
    .min(3, "El motivo debe tener al menos 3 caracteres")
    .max(500, "El motivo no puede exceder 500 caracteres"),
});

/**
 * Esquema para cambio de estado tradicional.
 */
export const cambiarEstadoMultaSchema = z.object({
  estadoMulta: z.enum(["PENDIENTE", "PAGADA", "ANULADA", "pendiente", "pagada", "anulada"]),
  motivo: z.string().trim().optional(),
});

/**
 * Esquema para validar el parámetro ID de Multa.
 */
export const multaIdParamSchema = z.object({
  id: idCoerce,
});

/**
 * Esquema para filtrado y paginación en listado de Multas.
 */
export const queryMultaSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  idAlumno: idCoerce.optional(),
  estado: z.string().trim().optional(),
  estadoMulta: z.string().trim().optional(),
  tipo: z.string().trim().optional(),
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
