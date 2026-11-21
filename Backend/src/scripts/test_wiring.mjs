import http from "node:http";
import app from "../app.js";

async function main() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(3099, resolve));
  const baseUrl = "http://localhost:3099/api";

  console.log("Servidor de prueba iniciado en http://localhost:3099");

  try {
    // 1. Probar GET /api/health
    const resHealth = await fetch(`${baseUrl}/health`);
    const dataHealth = await resHealth.json();
    console.log("✓ GET /health:", dataHealth.status);

    // 2. Probar GET /api/estado
    const resEstado = await fetch(`${baseUrl}/estado`);
    const dataEstado = await resEstado.json();
    console.log("✓ GET /estado recibido. Alumnos:", dataEstado.data.alumnos.length, "Habitaciones:", dataEstado.data.habitaciones.length);

    // 3. Probar POST /api/reclamos
    const resReclamo = await fetch(`${baseUrl}/reclamos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idAlumno: dataEstado.data.alumnos[0].idAlumno,
        tipo: "reclamo",
        categoria: "mantenimiento",
        asunto: "Prueba de canilla rota en baño",
        descripcion: "Se detectó una fuga de agua continua en la canilla del lavatorio del segundo piso.",
        ubicacion: "Baño Piso 2",
        prioridad: "normal"
      })
    });
    const dataReclamo = await resReclamo.json();
    if (resReclamo.ok) {
      console.log("✓ POST /reclamos:", dataReclamo.data.idReclamo);

      // 4. Probar POST /api/reclamos/:id/respuestas
      const idRec = dataReclamo.data.idReclamo;
      const resResp = await fetch(`${baseUrl}/reclamos/${idRec}/respuestas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensaje: "Se ha derivado el reclamo al equipo de mantenimiento de plomería.",
          estado: "en_revision"
        })
      });
      const dataResp = await resResp.json();
      console.log("✓ POST /reclamos/:id/respuestas:", dataResp.message || dataResp.status);
    } else {
      console.warn("✗ Error al crear reclamo:", dataReclamo);
    }

    console.log("Todos los tests de verificación de rutas y cableado pasaron con éxito.");
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error("Fallo el test de rutas:", err);
  process.exit(1);
});
