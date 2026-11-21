import http from "node:http";
import jwt from "jsonwebtoken";
import app from "../app.js";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";

async function main() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(3098, resolve));
  const baseUrl = "http://localhost:3098/api";

  console.log("Servidor de pruebas de notificaciones activo en http://localhost:3098");

  try {
    // 1. Obtener un alumno con usuario y un administrador
    const [usuarioAlumno, usuarioAdmin] = await Promise.all([
      prisma.usuario.findFirst({
        where: { idAlumno: { not: null } },
        include: { alumno: true },
      }),
      prisma.usuario.findFirst({
        where: { rol: { rol: "ADMINISTRADOR" } },
      }),
    ]);

    if (!usuarioAlumno || !usuarioAdmin) {
      console.warn("No se encontró usuario de alumno o administrador para probar notificaciones.");
      return;
    }

    const adminToken = jwt.sign(
      { idUsuario: usuarioAdmin.idUsuario, rol: "ADMINISTRADOR" },
      env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log(`Probando con alumno: ${usuarioAlumno.alumno.nombre} ${usuarioAlumno.alumno.apellido} (idAlumno: ${usuarioAlumno.idAlumno}, idUsuario: ${usuarioAlumno.idUsuario})`);

    // 2. Emitir una multa para este alumno y verificar que se genere la notificación (requiere admin)
    const resMulta = await fetch(`${baseUrl}/multas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        idAlumnos: [usuarioAlumno.idAlumno],
        tipo: "leve",
        motivo: "Prueba de notificación automática por multa",
        montoSancion: 10000,
        montoDanios: 0,
      }),
    });
    const dataMulta = await resMulta.json();
    console.log("✓ Multa emitida status:", resMulta.status);

    // Esperar un breve instante para que la promesa en segundo plano asiente en BD
    await new Promise((r) => setTimeout(r, 2000));

    // 3. Consultar notificaciones del alumno
    const resNotifs = await fetch(`${baseUrl}/notificaciones?idUsuario=${usuarioAlumno.idUsuario}`);
    const dataNotifs = await resNotifs.json();
    const notificaciones = dataNotifs.data?.notificaciones || [];
    console.log("✓ Notificaciones recuperadas para el alumno:", notificaciones.length);

    const notifMulta = notificaciones.find((n) => n.claveEvento === "multa_emitida");
    if (notifMulta) {
      console.log(`✓ Notificación de multa encontrada: "${notifMulta.titulo}" (ID: ${notifMulta.idNotificacion})`);

      // 4. Marcar como leída
      const resLeida = await fetch(`${baseUrl}/notificaciones/${notifMulta.idNotificacion}/leida`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idUsuario: usuarioAlumno.idUsuario }),
      });
      const dataLeida = await resLeida.json();
      console.log("✓ Marcar leída status:", resLeida.status, dataLeida.message);
    } else {
      console.log("! No se encontró la notificación específica de multa_emitida, revisando:", notificaciones.map(n => n.claveEvento));
    }

    console.log("Pruebas de notificaciones automáticas completadas con éxito.");
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error("Fallo la prueba de notificaciones:", err);
  process.exit(1);
});
