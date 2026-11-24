import { z } from "zod";
import { idCoerce } from "./idHelper.js";
import { FECHA_REFERENCIA } from "../config/constants.js";

export const TIPOS_AMBIENTE_VALIDOS = [
  "Sala de estudio",
  "Baño",
  "Cocina",
  "Duchas",
  "Comedor",
  "Lavadero",
  "Otro",
];

/**
 * ==========================================
 * ESQUEMAS PARA GRUPOS DE LIMPIEZA
 * ==========================================
 */

export const createGrupoSchema = z
  .object({
    nombreDelGrupo: z
      .string({ required_error: "El nombre del grupo es obligatorio" })
      .trim()
      .min(2, "El nombre del grupo debe tener al menos 2 caracteres")
      .max(100, "El nombre del grupo no puede exceder 100 caracteres"),
    posicionInicial: z.coerce.number().int().min(1).max(4).optional(),
    tareaInicial: z.coerce.number().int().min(1).max(4).optional(),
    idAlumnos: z.array(idCoerce).optional().default([]),
  })
  .transform((data) => ({
    ...data,
    posicionInicial: data.posicionInicial ?? data.tareaInicial ?? 1,
  }));

export const updateGrupoSchema = z
  .object({
    nombreDelGrupo: z.string().trim().min(2).max(100).optional(),
    posicionInicial: z.coerce.number().int().min(1).max(4).optional(),
    tareaInicial: z.coerce.number().int().min(1).max(4).optional(),
  })
  .transform((data) => ({
    ...data,
    posicionInicial: data.posicionInicial ?? data.tareaInicial,
  }))
  .refine(
    (data) => data.nombreDelGrupo !== undefined || data.posicionInicial !== undefined,
    { message: "Debe proporcionar al menos un campo para actualizar" }
  );

export const grupoIdParamSchema = z.object({
  id: idCoerce,
});

export const agregarAlumnoGrupoSchema = z.object({
  idAlumno: idCoerce,
});

export const guardarIntegrantesSchema = z.object({
  idAlumnos: z.array(idCoerce, {
    required_error: "Debe proporcionar la lista de IDs de alumnos integrantes",
  }),
});

export const grupoAlumnoParamsSchema = z.object({
  id: idCoerce,
  idAlumno: idCoerce,
});

export const asignarAmbienteGrupoSchema = z
  .object({
    idAmbiente: idCoerce,
    fechaDesde: z.coerce
      .date({ invalid_type_error: "La fecha de inicio debe ser válida" })
      .default(() => new Date(FECHA_REFERENCIA)),
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
    .default(() => new Date(FECHA_REFERENCIA)),
});

export const grupoAmbienteParamsSchema = z.object({
  id: idCoerce,
  idAmbiente: idCoerce,
});

/**
 * ==========================================
 * ESQUEMAS PARA TAREAS DE LIMPIEZA
 * ==========================================
 */

export const createTareaLimpiezaSchema = z
  .object({
    numero: z.coerce.number().int().positive().optional(),
    nombre: z
      .string({ required_error: "El nombre de la tarea es obligatorio" })
      .trim()
      .min(2, "El nombre de la tarea debe tener al menos 2 caracteres")
      .max(100, "El nombre de la tarea no puede exceder 100 caracteres"),
    enRotacion: z.boolean().default(true),
    actividades: z.array(z.string().trim().min(1, "La actividad no puede estar vacía")).optional(),
    tareas: z.array(z.string().trim().min(1, "La actividad no puede estar vacía")).optional(),
  })
  .transform((data) => ({
    ...data,
    actividades: data.actividades ?? data.tareas ?? [],
  }))
  .refine((data) => Array.isArray(data.actividades) && data.actividades.length > 0, {
    message: "Debe incluir al menos una actividad para la tarea de limpieza",
    path: ["actividades"],
  });

export const updateTareaLimpiezaSchema = z
  .object({
    nombre: z.string().trim().min(2).max(100).optional(),
    enRotacion: z.boolean().optional(),
    actividades: z.array(z.string().trim().min(1)).optional(),
    tareas: z.array(z.string().trim().min(1)).optional(),
  })
  .transform((data) => ({
    ...data,
    actividades: data.actividades ?? data.tareas,
  }))
  .refine(
    (data) =>
      data.nombre !== undefined ||
      data.enRotacion !== undefined ||
      data.actividades !== undefined,
    { message: "Debe proporcionar al menos un campo para actualizar" }
  );

export const tareaNumeroParamSchema = z.object({
  numero: z.coerce
    .number({ invalid_type_error: "El número de tarea debe ser un entero positivo" })
    .int()
    .positive(),
});

/**
 * ==========================================
 * ESQUEMAS PARA AMBIENTES Y EQUIPAMIENTO
 * ==========================================
 */

export const equipamientoItemSchema = z.object({
  nombre: z
    .string({ required_error: "El nombre del equipamiento u objeto es obligatorio" })
    .trim()
    .min(1, "El nombre no puede estar vacío"),
  cantidad: z.coerce
    .number({ required_error: "La cantidad es obligatoria" })
    .int("La cantidad debe ser un número entero")
    .positive("La cantidad debe ser un entero positivo"),
});

export const createAmbienteSchema = z
  .object({
    ambiente: z.string().trim().min(2).max(100).optional(),
    nombre: z.string().trim().min(2).max(100).optional(),
    tipo: z
      .enum(["Sala de estudio", "Baño", "Cocina", "Duchas", "Comedor", "Lavadero", "Otro"], {
        errorMap: () => ({ message: "Seleccioná un tipo de ambiente válido" }),
      })
      .optional()
      .nullable(),
    ubicacion: z.string().trim().max(200).optional().default(""),
    descripcion: z.string().trim().max(1000).optional().default(""),
    tareas: z.string().trim().max(1000).optional().default(""),
    equipamiento: z.array(equipamientoItemSchema).optional().default([]),
  })
  .transform((data) => ({
    ...data,
    nombre: data.nombre ?? data.ambiente,
  }))
  .refine((data) => Boolean(data.nombre && data.nombre.length >= 2), {
    message: "El nombre del ambiente es obligatorio y debe tener al menos 2 caracteres",
    path: ["nombre"],
  });

export const updateAmbienteSchema = z
  .object({
    ambiente: z.string().trim().min(2).max(100).optional(),
    nombre: z.string().trim().min(2).max(100).optional(),
    tipo: z
      .enum(["Sala de estudio", "Baño", "Cocina", "Duchas", "Comedor", "Lavadero", "Otro"])
      .optional()
      .nullable(),
    ubicacion: z.string().trim().max(200).optional(),
    descripcion: z.string().trim().max(1000).optional(),
    tareas: z.string().trim().max(1000).optional(),
  })
  .transform((data) => ({
    ...data,
    nombre: data.nombre ?? data.ambiente,
  }))
  .refine(
    (data) =>
      data.nombre !== undefined ||
      data.tipo !== undefined ||
      data.ubicacion !== undefined ||
      data.descripcion !== undefined ||
      data.tareas !== undefined,
    { message: "Debe proporcionar al menos un campo para actualizar" }
  );

export const ambienteIdParamSchema = z.object({
  id: idCoerce,
});

export const agregarEquipamientoSchema = equipamientoItemSchema;

export const actualizarEquipamientoPorNombreSchema = z.object({
  nombreAnterior: z.string().trim().min(1, "El nombre anterior es obligatorio"),
  nombre: z.string().trim().min(1, "El nuevo nombre es obligatorio"),
  cantidad: z.coerce.number().int().positive("La cantidad debe ser un entero positivo"),
});

export const eliminarEquipamientoPorNombreSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre del equipamiento es obligatorio"),
});

export const updateEquipamientoSchema = z
  .object({
    nombre: z.string().trim().min(1, "El nombre del equipamiento no puede estar vacío").optional(),
    cantidad: z.coerce
      .number()
      .int("La cantidad debe ser un número entero")
      .positive("La cantidad debe ser un entero positivo")
      .optional(),
  })
  .refine((data) => data.nombre !== undefined || data.cantidad !== undefined, {
    message: "Debe proporcionar al menos un campo para actualizar (nombre o cantidad)",
  });

export const equipamientoIdParamSchema = z.object({
  id: idCoerce,
  idEquipamiento: idCoerce,
});

export const queryLimpiezaSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  fecha: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const queryAmbienteSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  search: z.string().trim().optional(),
  tipo: z.string().trim().optional(),
});
