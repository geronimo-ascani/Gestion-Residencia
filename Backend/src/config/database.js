import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

/**
 * Patrón Singleton para el cliente de Prisma.
 * Previene el agotamiento del pool de conexiones en entornos de desarrollo con recarga activa (HMR / Nodemon).
 */
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
