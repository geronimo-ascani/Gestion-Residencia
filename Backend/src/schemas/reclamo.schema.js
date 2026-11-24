import { z } from "zod";
import { idCoerce } from "./idHelper.js";

export const TIPOS_RECLAMO_VALIDOS = ["reclamo", "solicitud", "problema"];
export const CATEGORIAS_RECLAMO_VALIDAS = [
  "mantenimiento",
  "limpieza",
  "convivencia",
  "administracion",
  "otro",
];
export const ESTADOS_RECLAMO_VALIDOS = [
  "pendiente",
  "en_revision",
  "resuelto",
  "rechazado",
  "cancelado",
];
export const PRIORIDADES_RECLAMO_VALIDAS = ["normal", "alta"];

/**
 * Esquema para la creación de una nueva presentación o reclamo.
 */
export const createReclamoSchema = z.object({
  idAlumno: idCoerce,
  tipo: z
    .enum(["reclamo", "solicitud", "problema"], {
      error: "Elegí el tipo de presentación: reclamo, solicitud o problema",
    })
    .default("reclamo"),
  categoria: z
    .enum(["mantenimiento", "limpieza", "convivencia", "administracion", "otro"], {
      error: "Elegí una categoría válida",
    })
    .default("mantenimiento"),
  asunto: z
    .string({ error: "El asunto es obligatorio" })
    .trim()
    .min(5, "El asunto debe tener entre 5 y 100 caracteres")
    .max(100, "El asunto no puede superar los 100 caracteres"),
  descripcion: z
    .string({ error: "La descripción es obligatoria" })
    .trim()
    .min(20, "La descripción debe tener entre 20 y 3000 caracteres")
    .max(3000, "La descripción no puede superar los 3000 caracteres"),
  ubicacion: z
    .string({ error: "La ubicación es obligatoria" })
    .trim()
    .min(2, "Elegí una ubicación válida"),
  detalleUbicacion: z
    .string()
    .trim()
    .max(120, "El detalle de ubicación no puede superar los 120 caracteres")
    .optional()
    .default(""),
  prioridad: z
    .enum(["normal", "alta"], {
      error: "La prioridad debe ser normal o alta",
    })
    .default("normal"),
});

/**
 * Esquema para responder o actualizar el estado de un reclamo.
 */
export const responderReclamoSchema = z.object({
  mensaje: z
    .string({ error: "El mensaje es obligatorio" })
    .trim()
    .min(5, "Escribí un mensaje de entre 5 y 2000 caracteres")
    .max(2000, "El mensaje no puede superar los 2000 caracteres"),
  estado: z
    .enum(["pendiente", "en_revision", "resuelto", "rechazado", "cancelado"])
    .optional(),
});

/**
 * Esquema para validar el parámetro ID de Reclamo.
 */
export const reclamoIdParamSchema = z.object({
  id: idCoerce,
});

/**
 * Esquema para listado, filtrado y paginación de reclamos.
 */
export const queryReclamoSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  idAlumno: idCoerce.optional(),
  vista: z.enum(["abiertos", "cerrados", "todos"]).optional(),
  estado: z.string().trim().optional(),
  categoria: z.string().trim().optional(),
  prioridad: z.string().trim().optional(),
  tipo: z.string().trim().optional(),
  search: z.string().trim().optional(),
  busqueda: z.string().trim().optional(),
  orden: z.enum(["recientes", "antiguos", "prioridad"]).default("recientes"),
});
