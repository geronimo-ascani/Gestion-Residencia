import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

/**
 * Patrón Singleton para el cliente de Prisma.
 * Previene el agotamiento del pool de conexiones en entornos de desarrollo con recarga activa (HMR / Nodemon).
 */
const globalForPrisma = globalThis;

const dbUrl = env.DATABASE_URL.includes("connection_limit")
  ? env.DATABASE_URL
  : `${env.DATABASE_URL}${env.DATABASE_URL.includes("?") ? "&" : "?"}connection_limit=5`;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: dbUrl } },
    log:
      env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
