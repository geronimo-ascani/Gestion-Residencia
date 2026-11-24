import { z } from "zod";
import { idCoerce } from "./idHelper.js";
import { FECHA_REFERENCIA } from "../config/constants.js";

export const ESTADOS_CONTRATO = ["VIGENTE", "FINALIZADO", "RESCINDIDO", "CANCELADO"];

/**
 * Esquema de validación para la creación de un Contrato.
 */
export const createContratoSchema = z
  .object({
    idAlumno: idCoerce,
    fechaDesde: z.coerce
      .date({ invalid_type_error: "La fecha de inicio debe ser una fecha válida" })
      .default(() => new Date(FECHA_REFERENCIA)),
    fechaHasta: z.coerce.date({
      required_error: "La fecha de finalización es obligatoria",
      invalid_type_error: "La fecha de finalización debe ser una fecha válida",
    }),
    estado: z
      .enum(ESTADOS_CONTRATO, {
        errorMap: () => ({
          message: `El estado debe ser uno de: ${ESTADOS_CONTRATO.join(", ")}`,
        }),
      })
      .default("VIGENTE"),
    fechaFirma: z.coerce.date().optional().nullable(),
    montoMensual: z.coerce
      .number({ invalid_type_error: "El monto mensual debe ser un número" })
      .positive("El monto mensual debe ser positivo")
      .max(100000000, "El monto mensual no puede superar 100.000.000")
      .optional()
      .default(180000),
    depositoGarantia: z.coerce
      .number({ invalid_type_error: "El depósito debe ser un número" })
      .min(0, "El depósito no puede ser negativo")
      .max(100000000, "El depósito no puede superar 100.000.000")
      .optional()
      .default(0),
    diaVencimientoPago: z.coerce
      .number({ invalid_type_error: "El día de vencimiento debe ser un número" })
      .int("El día de vencimiento debe ser un entero")
      .min(1, "El día debe estar entre 1 y 31")
      .max(31, "El día debe estar entre 1 y 31")
      .optional()
      .default(10),
    observaciones: z.string().max(500, "Las observaciones no pueden superar 500 caracteres").optional().nullable(),
  })
  .refine((data) => data.fechaHasta > data.fechaDesde, {
    message: "La fecha de finalización debe ser posterior a la fecha de inicio",
    path: ["fechaHasta"],
  });

/**
 * Esquema de validación para actualización parcial de un Contrato.
 */
export const updateContratoSchema = z
  .object({
    fechaDesde: z.coerce
      .date({ invalid_type_error: "La fecha de inicio debe ser una fecha válida" })
      .optional(),
    fechaHasta: z.coerce
      .date({ invalid_type_error: "La fecha de finalización debe ser una fecha válida" })
      .optional(),
    estado: z
      .enum(ESTADOS_CONTRATO, {
        errorMap: () => ({
          message: `El estado debe ser uno de: ${ESTADOS_CONTRATO.join(", ")}`,
        }),
      })
      .optional(),
    fechaFirma: z.coerce.date().optional().nullable(),
    montoMensual: z.coerce
      .number({ invalid_type_error: "El monto mensual debe ser un número" })
      .positive("El monto mensual debe ser positivo")
      .max(100000000, "El monto mensual no puede superar 100.000.000")
      .optional(),
    depositoGarantia: z.coerce
      .number({ invalid_type_error: "El depósito debe ser un número" })
      .min(0, "El depósito no puede ser negativo")
      .max(100000000, "El depósito no puede superar 100.000.000")
      .optional(),
    diaVencimientoPago: z.coerce
      .number({ invalid_type_error: "El día de vencimiento debe ser un número" })
      .int("El día de vencimiento debe ser un entero")
      .min(1, "El día debe estar entre 1 y 31")
      .max(31, "El día debe estar entre 1 y 31")
      .optional(),
    observaciones: z.string().max(500, "Las observaciones no pueden superar 500 caracteres").optional().nullable(),
    fechaCancelacion: z.coerce.date().optional().nullable(),
    motivoCancelacion: z.string().max(500).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un campo para actualizar",
  })
  .refine(
    (data) => {
      if (data.fechaDesde && data.fechaHasta) {
        return data.fechaHasta > data.fechaDesde;
      }
      return true;
    },
    {
      message: "La fecha de finalización debe ser posterior a la fecha de inicio",
      path: ["fechaHasta"],
    }
  );

/**
 * Esquema de validación para cambio rápido de estado (ej. dar de baja o rescindir).
 */
export const cambiarEstadoContratoSchema = z.object({
  estado: z.enum(ESTADOS_CONTRATO, {
    errorMap: () => ({
      message: `El estado debe ser uno de: ${ESTADOS_CONTRATO.join(", ")}`,
    }),
  }),
  fechaCancelacion: z.coerce.date().optional().nullable(),
  motivoCancelacion: z.string().trim().max(500).optional().nullable(),
});

/**
 * Esquema de validación para parámetros de ruta con ID de Contrato.
 */
export const contratoIdParamSchema = z.object({
  id: idCoerce,
});

/**
 * Esquema de validación para filtros y paginación en listado de Contratos.
 */
export const queryContratoSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  idAlumno: idCoerce.optional(),
  estado: z.enum(ESTADOS_CONTRATO).optional(),
  search: z.string().trim().optional(),
  porVencerDias: z.coerce.number().int().positive().optional(),
});
