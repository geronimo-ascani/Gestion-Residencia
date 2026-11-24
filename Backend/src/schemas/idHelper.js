import { z } from "zod";

/**
 * Coerces an ID that may be either a number, numeric string ("1"),
 * or prefixed string ("A01", "H1", "C01", "M01", "G1", "AM01", "U1").
 */
export const idCoerce = z.preprocess((val) => {
  if (typeof val === "string") {
    const digits = val.replace(/\D/g, "");
    if (digits.length > 0) {
      return Number(digits);
    }
    return val;
  }
  return val;
}, z.coerce.number({ invalid_type_error: "El ID debe ser un número entero válido" }).int().positive("El ID debe ser un número positivo"));
