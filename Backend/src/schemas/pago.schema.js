import { z } from "zod";
import { idCoerce } from "./idHelper.js";

/**
 * Esquema para registrar un cobro o pago asociado a una factura.
 */
export const registrarCobroSchema = z
  .object({
    idFactura: idCoerce,
    monto: z.coerce
      .number({ error: "El monto a cobrar es obligatorio" })
      .positive("El monto debe ser mayor a cero")
      .refine(
        (val) => {
          const centavos = Math.round(val * 100);
          return Number.isSafeInteger(centavos) && Math.abs(val * 100 - centavos) <= 0.00001;
        },
        "El importe no puede tener más de dos decimales"
      ),
    fecha: z
      .string({ error: "La fecha de cobro es obligatoria" })
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
    medio: z.enum(["efectivo", "transferencia", "tarjeta"]),
    referencia: z.string().trim().optional().default(""),
  })
  .refine(
    (data) => data.medio === "efectivo" || (data.referencia && data.referencia.trim().length > 0),
    {
      message: "Ingresá la referencia de la operación para pagos por transferencia o tarjeta",
      path: ["referencia"],
    }
  );

/**
 * Esquema para validar el parámetro de ruta ID de pago.
 */
export const pagoIdParamSchema = z.object({
  id: idCoerce,
});

/**
 * Esquema para filtrado y paginación del listado de cobros/pagos.
 */
export const queryPagoSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  idAlumno: idCoerce.optional(),
  idFactura: idCoerce.optional(),
  medio: z.enum(["efectivo", "transferencia", "tarjeta"]).optional(),
  search: z.string().trim().optional(),
});
