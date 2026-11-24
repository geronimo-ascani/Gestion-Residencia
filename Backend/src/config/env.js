import dotenv from "dotenv";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Cargar variables de entorno desde .env local o desde la raíz del Backend
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Esquema de validación estricta para variables de entorno
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, "La variable DATABASE_URL es obligatoria"),
  DIRECT_URL: z.string().optional(),
  CORS_ORIGIN: z.string().default(""),
  TRUST_PROXY_HOPS: z.coerce.number().int().nonnegative().default(0),
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default("7d"),
}).superRefine((config, ctx) => {
  if (config.NODE_ENV === "production" &&
      (!config.JWT_SECRET || config.JWT_SECRET.length < 32 ||
       /super_secret_jwt_key|clave_secreta_para_firmar/i.test(config.JWT_SECRET))) {
    ctx.addIssue({ code: "custom", path: ["JWT_SECRET"], message: "Configurá un secreto aleatorio de al menos 32 caracteres en producción." });
  }
  for (const origin of config.CORS_ORIGIN.split(",").map((value) => value.trim()).filter(Boolean)) {
    let valid = false;
    try {
      const url = new URL(origin);
      valid = url.origin === origin && (url.protocol === "https:" ||
        (config.NODE_ENV !== "production" && url.protocol === "http:"));
    } catch {}
    if (!valid) {
      ctx.addIssue({ code: "custom", path: ["CORS_ORIGIN"], message: "Indicá orígenes concretos y HTTPS en producción." });
    }
  }
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("Error crítico: Variables de entorno inválidas o faltantes:");
  console.error(JSON.stringify(_env.error.issues.map(({ path, message }) => ({ path, message })), null, 2));
  process.exit(1);
}

export const env = { ..._env.data, JWT_SECRET: _env.data.JWT_SECRET || randomBytes(32).toString("hex") };
