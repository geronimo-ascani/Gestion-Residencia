import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/database.js";

const server = app.listen(env.PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Servidor ejecutándose en el puerto: ${env.PORT}`);
  console.log(`🌍 Entorno: ${env.NODE_ENV}`);
  console.log(`🩺 Health check: http://localhost:${env.PORT}/api/health`);
  console.log(`🔐 Auth:          http://localhost:${env.PORT}/api/auth`);
  console.log(`👤 Alumnos:       http://localhost:${env.PORT}/api/alumnos`);
  console.log(`🛏️  Habitaciones:  http://localhost:${env.PORT}/api/habitaciones`);
  console.log(`📄 Contratos:     http://localhost:${env.PORT}/api/contratos`);
  console.log(`💳 Cuotas:        http://localhost:${env.PORT}/api/cuotas`);
  console.log(`⚠️  Multas:        http://localhost:${env.PORT}/api/multas`);
  console.log(`🧹 Limpieza:      http://localhost:${env.PORT}/api/grupos-limpieza`);
  console.log(`🏡 Ambientes:     http://localhost:${env.PORT}/api/ambientes`);
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
