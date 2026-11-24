import { z } from "zod";

/**
 * Coerces an ID that may be either a number, numeric string ("1"),
 * or prefixed string ("A01", "H1", "C01", "M01", "G1", "AM01", "U1").
 */
export const idCoerce = z.preprocess((val) => {
  if (typeof val === "string") {
    const match = /^(?:[A-Za-z]{1,3})?(\d+)$/.exec(val);
    return match ? Number(match[1]) : val;
  }
  return val;
}, z.number({ error: "El ID debe ser un número entero válido" }).int().min(1).max(2_147_483_647));
