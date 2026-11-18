import { z } from "zod";

/**
 * Esquema para actualización de parámetros del sistema.
 */
export const updateParametrosSchema = z
  .object({
    multaLeve: z.coerce.number().min(0.01).max(100000000).optional(),
    multaModerada: z.coerce.number().min(0.01).max(100000000).optional(),
    multaGrave: z.coerce.number().min(0.01).max(100000000).optional(),
    recargoMulta: z.coerce.number().min(0).max(100).optional(),
    cuotaMensual: z.coerce.number().min(0.01).max(100000000).optional(),
    deposito: z.coerce.number().min(0).max(100000000).optional(),
    diaVencimiento: z.coerce.number().int().min(1).max(31).optional(),
    duracionContrato: z.coerce.number().int().min(1).max(3650).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un parámetro para actualizar",
  });

/**
 * Esquema para registro de auditoría en CambioAdministrativo.
 */
export const crearCambioAdministrativoSchema = z.object({
  idActor: z.coerce.number().int().positive().optional(),
  seccion: z.string().trim().min(2, "La sección debe tener al menos 2 caracteres"),
  accion: z.string().trim().min(2, "La acción debe tener al menos 2 caracteres"),
  referencia: z.string().trim().optional(),
  detalle: z.string().trim().min(2, "El detalle es obligatorio"),
});

/**
 * Esquema para consulta de historial administrativo.
 */
export const queryCambioAdministrativoSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  seccion: z.string().trim().optional(),
  accion: z.string().trim().optional(),
  idActor: z.coerce.number().int().positive().optional(),
  search: z.string().trim().optional(),
});

/**
 * Esquema para creación de una notificación interna.
 */
export const crearNotificacionSchema = z.object({
  idUsuario: z.coerce.number().int().positive({ required_error: "El ID de usuario es obligatorio" }),
  claveEvento: z.string().trim().min(2, "La clave de evento es obligatoria"),
  tipo: z.enum(["info", "alerta", "vencimiento", "sancion"]).default("info"),
  titulo: z.string().trim().min(2, "El título es obligatorio").max(200),
  detalle: z.string().trim().min(2, "El detalle es obligatorio").max(1000),
  destino: z.string().trim().optional().default(""),
});

/**
 * Esquema para ID de Notificación.
 */
export const notificacionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * Esquema para consulta de notificaciones.
 */
export const queryNotificacionesSchema = z.object({
  soloNoLeidas: z
    .preprocess((val) => {
      if (typeof val === "string") {
        if (val.toLowerCase() === "true") return true;
        if (val.toLowerCase() === "false") return false;
      }
      return val;
    }, z.boolean())
    .optional(),
});
