import dotenv from "dotenv";
import { z } from "zod";

// Cargar variables de entorno desde .env
dotenv.config();

// Esquema de validación estricta para variables de entorno
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, "La variable DATABASE_URL es obligatoria"),
  DIRECT_URL: z.string().optional(),
  CORS_ORIGIN: z.string().default("*"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("Error crítico: Variables de entorno inválidas o faltantes:");
  console.error(JSON.stringify(_env.error.format(), null, 2));
  process.exit(1);
}

export const env = _env.data;
