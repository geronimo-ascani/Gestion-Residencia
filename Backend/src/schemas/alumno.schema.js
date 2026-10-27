import { z } from "zod";

/**
 * Esquema de validación para la creación de un Alumno.
 * Admite idUsuario directamente o correo (para vincular o aprovisionar la cuenta Usuario asociada).
 * Incluye el estado del alumno ("ACTIVO" o "INACTIVO"), con valor por defecto "ACTIVO".
 */
export const createAlumnoSchema = z.object({
  idUsuario: z.coerce
    .number({ invalid_type_error: "El ID de usuario debe ser un número entero válido" })
    .int("El ID de usuario debe ser un entero")
    .positive("El ID de usuario debe ser un número positivo")
    .optional(),
  nombre: z
    .string({ required_error: "El nombre es obligatorio" })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  apellido: z
    .string({ required_error: "El apellido es obligatorio" })
    .trim()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(100, "El apellido no puede exceder 100 caracteres"),
  telefono: z
    .string()
    .trim()
    .max(30, "El teléfono no puede exceder 30 caracteres")
    .optional()
    .nullable(),
  correo: z
    .string()
    .trim()
    .email("Formato de correo electrónico inválido")
    .toLowerCase()
    .optional(),
  documento: z
    .string({ required_error: "El número de documento es obligatorio" })
    .trim()
    .min(4, "El documento debe tener al menos 4 caracteres")
    .max(30, "El documento no puede exceder 30 caracteres"),
  estado: z
    .enum(["ACTIVO", "INACTIVO"], {
      errorMap: () => ({ message: "El estado debe ser 'ACTIVO' o 'INACTIVO'" }),
    })
    .default("ACTIVO"),
});

/**
 * Esquema de validación para actualización parcial de un Alumno.
 */
export const updateAlumnoSchema = createAlumnoSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un campo para actualizar",
  });

/**
 * Esquema de validación para parámetros de ruta con ID de Alumno.
 */
export const alumnoIdParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: "El ID debe ser un número entero válido" })
    .int("El ID debe ser un número entero")
    .positive("El ID debe ser un número positivo"),
});

/**
 * Esquema de validación para filtros y paginación en listado de Alumnos.
 */
export const queryAlumnoSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  estado: z.enum(["ACTIVO", "INACTIVO"]).optional(),
});
