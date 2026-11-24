import http from "node:http";
import app from "../app.js";
import { iniciarSesionDePrueba } from "./sesion-prueba.mjs";

async function main() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(3098, "127.0.0.1", resolve));
  const baseUrl = "http://127.0.0.1:3098/api";

  console.log("Servidor de pruebas de notificaciones activo en http://127.0.0.1:3098");

  try {
    const [sesionAlumno, sesionAdmin] = await Promise.all([
      iniciarSesionDePrueba(baseUrl, "ALUMNO_A", "ALUMNO"),
      iniciarSesionDePrueba(baseUrl, "ADMIN", "ADMINISTRADOR"),
    ]);
    const { alumno: usuarioAlumno } = sesionAlumno.usuario;
    const { token: adminToken } = sesionAdmin;
    const headersAlumno = { Authorization: `Bearer ${sesionAlumno.token}` };

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
    if (!resMulta.ok) throw new Error(`No se pudo emitir la multa de prueba: ${resMulta.status}`);
    console.log("✓ Multa emitida status:", resMulta.status);

    // Esperar un breve instante para que la promesa en segundo plano asiente en BD
    await new Promise((r) => setTimeout(r, 2000));

    // 3. Consultar notificaciones del alumno
    const resNotifs = await fetch(`${baseUrl}/notificaciones`, { headers: headersAlumno });
    if (!resNotifs.ok) throw new Error(`No se pudieron consultar las notificaciones: ${resNotifs.status}`);
    const dataNotifs = await resNotifs.json();
    const notificaciones = dataNotifs.data?.notificaciones || [];
    console.log("✓ Notificaciones recuperadas para el alumno:", notificaciones.length);

    const notifMulta = notificaciones.find((n) => n.claveEvento === "multa_emitida");
    if (notifMulta) {
      console.log(`✓ Notificación de multa encontrada: "${notifMulta.titulo}" (ID: ${notifMulta.idNotificacion})`);

      // 4. Marcar como leída
      const resLeida = await fetch(`${baseUrl}/notificaciones/${notifMulta.idNotificacion}/leida`, {
        method: "PATCH",
        headers: headersAlumno,
      });
      if (!resLeida.ok) throw new Error(`No se pudo marcar la notificación: ${resLeida.status}`);
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
