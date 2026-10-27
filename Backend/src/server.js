import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/database.js";

const server = app.listen(env.PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Servidor ejecutándose en el puerto: ${env.PORT}`);
  console.log(`🌍 Entorno: ${env.NODE_ENV}`);
  console.log(`🩺 Health check: http://localhost:${env.PORT}/api/health`);
  console.log(`📚 Endpoint Alumnos: http://localhost:${env.PORT}/api/alumnos`);
  console.log(`===============================================`);
});

/**
 * Cierre elegante (Graceful Shutdown) del servidor y desconexión de Prisma.
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n⚠️  Señal ${signal} recibida. Iniciando cierre elegante...`);

  server.close(async () => {
    console.log("🛑 Servidor HTTP Express cerrado.");
    try {
      await prisma.$disconnect();
      console.log("🔌 Conexión con PostgreSQL (Prisma) cerrada exitosamente.");
      process.exit(0);
    } catch (error) {
      console.error("❌ Error al desconectar Prisma:", error);
      process.exit(1);
    }
  });

  // Forzar cierre si no responde en 10 segundos
  setTimeout(() => {
    console.error("⏱️  Cierre forzado por tiempo límite excedido.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
