import { z } from "zod";
import { idCoerce } from "./idHelper.js";

/**
 * Esquema para un contacto de emergencia individual.
 */
export const contactoEmergenciaSchema = z.object({
  idContacto: z.coerce.number().int().positive().optional(),
  nombre: z
    .string({ required_error: "El nombre del contacto es obligatorio" })
    .trim()
    .min(1, "El nombre del contacto no puede estar vacío")
    .max(100, "El nombre del contacto no puede exceder 100 caracteres"),
  vinculo: z
    .string({ required_error: "El vínculo es obligatorio" })
    .trim()
    .min(1, "El vínculo no puede estar vacío")
    .max(50, "El vínculo no puede exceder 50 caracteres"),
  telefono: z
    .string({ required_error: "El teléfono del contacto es obligatorio" })
    .trim()
    .min(1, "El teléfono del contacto no puede estar vacío")
    .max(50, "El teléfono del contacto no puede exceder 50 caracteres"),
  orden: z.coerce.number().int().positive().optional().default(1),
});

/**
 * Esquema de validación para la creación de un Alumno con datos extendidos de perfil.
 */
export const createAlumnoSchema = z.object({
  // Identificación y datos personales
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
  documento: z
    .string({ required_error: "El número de documento es obligatorio" })
    .trim()
    .min(4, "El documento debe tener al menos 4 caracteres")
    .max(30, "El documento no puede exceder 30 caracteres"),
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
    .optional()
    .nullable(),
  correoContacto: z
    .string()
    .trim()
    .email("Formato de correo de contacto inválido")
    .toLowerCase()
    .optional()
    .nullable(),
  estado: z
    .enum(["activo", "inactivo", "ACTIVO", "INACTIVO"], {
      errorMap: () => ({ message: "El estado debe ser 'activo' o 'inactivo'" }),
    })
    .default("activo"),
  fechaNacimiento: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)")
    .optional()
    .nullable(),
  nacionalidad: z
    .string()
    .trim()
    .max(100, "La nacionalidad no puede exceder 100 caracteres")
    .optional()
    .nullable(),

  // Domicilio y procedencia
  domicilio: z
    .string()
    .trim()
    .max(200, "El domicilio no puede exceder 200 caracteres")
    .optional()
    .nullable(),
  localidad: z
    .string()
    .trim()
    .max(100, "La localidad no puede exceder 100 caracteres")
    .optional()
    .nullable(),
  provincia: z
    .string()
    .trim()
    .max(100, "La provincia no puede exceder 100 caracteres")
    .optional()
    .nullable(),
  codigoPostal: z
    .string()
    .trim()
    .max(20, "El código postal no puede exceder 20 caracteres")
    .optional()
    .nullable(),

  // Información académica
  institucion: z
    .string()
    .trim()
    .max(150, "La institución no puede exceder 150 caracteres")
    .optional()
    .nullable(),
  carrera: z
    .string()
    .trim()
    .max(150, "La carrera no puede exceder 150 caracteres")
    .optional()
    .nullable(),
  anioCursado: z
    .string()
    .trim()
    .max(50, "El año de cursado no puede exceder 50 caracteres")
    .optional()
    .nullable(),
  cantidadMateriasCursadas: z.coerce
    .number()
    .int("La cantidad de materias debe ser un número entero")
    .min(0, "La cantidad de materias cursadas no puede ser negativa")
    .optional()
    .nullable(),
  legajo: z
    .string()
    .trim()
    .max(50, "El legajo no puede exceder 50 caracteres")
    .optional()
    .nullable(),

  // Observaciones adicionales
  observaciones: z
    .string()
    .trim()
    .max(1000, "Las observaciones no pueden exceder 1000 caracteres")
    .optional()
    .nullable(),

  // Contactos de emergencia
  contactosEmergencia: z.array(contactoEmergenciaSchema).optional(),
  emergenciaNombre: z.string().trim().optional().nullable(),
  emergenciaVinculo: z.string().trim().optional().nullable(),
  emergenciaTelefono: z.string().trim().optional().nullable(),

  // Vinculación o aprovisionamiento opcional de usuario
  idUsuario: z.coerce.number().int().positive().optional(),
  contrasena: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
});

/**
 * Esquema de validación para actualización parcial de un Alumno o una de sus secciones.
 */
export const updateAlumnoSchema = createAlumnoSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un campo para actualizar",
  });

/**
 * Esquema para validar el parámetro de ruta con ID de Alumno.
 */
export const alumnoIdParamSchema = z.object({
  id: idCoerce,
});

/**
 * Esquema para parámetros de ruta de contactos de emergencia.
 */
export const contactoEmergenciaParamSchema = z.object({
  id: idCoerce,
  idContacto: idCoerce,
});

/**
 * Esquema de validación para filtros y paginación en listado de Alumnos.
 */
export const queryAlumnoSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  estado: z.string().trim().optional(),
  carrera: z.string().trim().optional(),
  localidad: z.string().trim().optional(),
  provincia: z.string().trim().optional(),
});
