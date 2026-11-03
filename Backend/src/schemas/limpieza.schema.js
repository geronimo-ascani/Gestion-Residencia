import { z } from "zod";

/**
 * ==========================================
 * ESQUEMAS PARA GRUPOS DE LIMPIEZA
 * ==========================================
 */

export const createGrupoSchema = z.object({
  nombreDelGrupo: z
    .string({ required_error: "El nombre del grupo es obligatorio" })
    .trim()
    .min(2, "El nombre del grupo debe tener al menos 2 caracteres")
    .max(100, "El nombre del grupo no puede exceder 100 caracteres"),
});

export const updateGrupoSchema = createGrupoSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Debe proporcionar al menos un campo para actualizar" }
);

export const grupoIdParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: "El ID del grupo debe ser un entero" })
    .int("El ID del grupo debe ser un entero")
    .positive("El ID del grupo debe ser positivo"),
});

export const agregarAlumnoGrupoSchema = z.object({
  idAlumno: z.coerce
    .number({ required_error: "El ID del alumno es obligatorio" })
    .int("El ID del alumno debe ser un entero")
    .positive("El ID del alumno debe ser positivo"),
});

export const grupoAlumnoParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  idAlumno: z.coerce.number().int().positive(),
});

export const asignarAmbienteGrupoSchema = z
  .object({
    idAmbiente: z.coerce
      .number({ required_error: "El ID del ambiente es obligatorio" })
      .int("El ID del ambiente debe ser un entero")
      .positive("El ID del ambiente debe ser positivo"),
    fechaDesde: z.coerce
      .date({ invalid_type_error: "La fecha de inicio debe ser válida" })
      .default(() => new Date()),
    fechaHasta: z.coerce
      .date({ invalid_type_error: "La fecha de finalización debe ser válida" })
      .optional()
      .nullable(),
  })
  .refine(
    (data) => !data.fechaHasta || data.fechaHasta >= data.fechaDesde,
    {
      message: "La fecha de finalización debe ser igual o posterior a la fecha de inicio",
      path: ["fechaHasta"],
    }
  );

export const finalizarAsignacionAmbienteSchema = z.object({
  fechaHasta: z.coerce
    .date({ invalid_type_error: "La fecha de cierre debe ser válida" })
    .default(() => new Date()),
});

export const grupoAmbienteParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  idAmbiente: z.coerce.number().int().positive(),
});

/**
 * ==========================================
 * ESQUEMAS PARA AMBIENTES
 * ==========================================
 */

export const createAmbienteSchema = z.object({
  ambiente: z
    .string({ required_error: "El nombre del ambiente es obligatorio" })
    .trim()
    .min(2, "El nombre del ambiente debe tener al menos 2 caracteres")
    .max(100, "El nombre del ambiente no puede exceder 100 caracteres"),
  tareas: z
    .string({ required_error: "La descripción de las tareas es obligatoria" })
    .trim()
    .min(3, "Las tareas deben describirse con al menos 3 caracteres"),
});

export const updateAmbienteSchema = createAmbienteSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Debe proporcionar al menos un campo para actualizar" }
);

export const ambienteIdParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: "El ID del ambiente debe ser un entero" })
    .int("El ID del ambiente debe ser un entero")
    .positive("El ID del ambiente debe ser positivo"),
});

export const queryLimpiezaSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
});

