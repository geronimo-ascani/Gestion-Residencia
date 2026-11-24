import http from "node:http";
import app from "../app.js";
import { prisma } from "../config/database.js";
import { iniciarSesionDePrueba } from "./sesion-prueba.mjs";

async function main() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(3097, "127.0.0.1", resolve));
  const baseUrl = "http://127.0.0.1:3097/api";

  console.log("=== INICIANDO AUDITORÍA Y TESTS DE SEGURIDAD RBAC ===");

  try {
    const [sesionA, sesionB, sesionAdmin] = await Promise.all([
      iniciarSesionDePrueba(baseUrl, "ALUMNO_A", "ALUMNO"),
      iniciarSesionDePrueba(baseUrl, "ALUMNO_B", "ALUMNO"),
      iniciarSesionDePrueba(baseUrl, "ADMIN", "ADMINISTRADOR"),
    ]);
    const { token: tokenAlumnoA, usuario: { alumno: alumnoA } } = sesionA;
    const { token: tokenAlumnoB, usuario: { alumno: alumnoB } } = sesionB;
    const { token: tokenAdmin } = sesionAdmin;
    if (alumnoA.idAlumno === alumnoB.idAlumno) {
      throw new Error("La prueba requiere dos residentes distintos.");
    }

    // Helper para verificar código esperado
    async function assertEndpoint(nombre, url, options, expectedStatus) {
      const res = await fetch(url, options);
      const data = await res.json().catch(() => ({}));
      if (res.status === expectedStatus) {
        console.log(`✓ [${res.status}] ${nombre}`);
      } else {
        console.error(`✗ ERROR [${res.status} !== ${expectedStatus}] ${nombre}:`, data);
        throw new Error(`Fallo de autorización en: ${nombre}`);
      }
      return data;
    }

    // 2. Probar acciones administrativas que el Alumno A DEBE TENER PROHIBIDO realizar (403)
    console.log("--- 1. Verificando que Alumno A no puede ejecutar acciones administrativas ---");

    await assertEndpoint(
      "Alumno intenta crear alumno (POST /api/alumnos)",
      `${baseUrl}/alumnos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenAlumnoA}` },
        body: JSON.stringify({
          nombre: "Intruso",
          apellido: "Hacker",
          documento: "99999999",
          correo: "intruso@test.ar",
          telefono: "11223344",
        }),
      },
      403
    );

    await assertEndpoint(
      "Alumno intenta eliminar alumno (DELETE /api/alumnos/:id)",
      `${baseUrl}/alumnos/${alumnoB.idAlumno}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenAlumnoA}` },
      },
      403
    );

    await assertEndpoint(
      "Alumno intenta crear habitación (POST /api/habitaciones)",
      `${baseUrl}/habitaciones`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenAlumnoA}` },
        body: JSON.stringify({
          numeroHabitacion: "999",
          capacidadMaxima: 2,
          pisoHabitacion: 1,
        }),
      },
      403
    );

    await assertEndpoint(
      "Alumno intenta asignar habitación (POST /api/habitaciones/:id/asignar)",
      `${baseUrl}/habitaciones/1/asignar`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenAlumnoA}` },
        body: JSON.stringify({
          idAlumno: alumnoA.idAlumno,
          fechaDesde: "2026-11-20",
        }),
      },
      403
    );

    await assertEndpoint(
      "Alumno intenta emitir multa (POST /api/multas)",
      `${baseUrl}/multas`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenAlumnoA}` },
        body: JSON.stringify({
          idAlumnos: [alumnoB.idAlumno],
          tipo: "grave",
          motivo: "Intento ilegal de multa",
          montoSancion: 50000,
        }),
      },
      403
    );

    await assertEndpoint(
      "Alumno intenta crear contrato (POST /api/contratos)",
      `${baseUrl}/contratos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenAlumnoA}` },
        body: JSON.stringify({
          idAlumno: alumnoA.idAlumno,
          fechaDesde: "2026-01-01",
          fechaHasta: "2026-12-31",
        }),
      },
      403
    );

    await assertEndpoint(
      "Alumno intenta emitir factura masiva (POST /api/facturas/generar-mes)",
      `${baseUrl}/facturas/generar-mes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenAlumnoA}` },
        body: JSON.stringify({
          periodo: "2026-11",
        }),
      },
      403
    );

    await assertEndpoint(
      "Alumno intenta registrar cobro (POST /api/pagos)",
      `${baseUrl}/pagos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenAlumnoA}` },
        body: JSON.stringify({
          idAlumno: alumnoA.idAlumno,
          monto: 5000,
          concepto: "Cobro apócrifo",
        }),
      },
      403
    );

    await assertEndpoint(
      "Alumno intenta modificar parámetros del sistema (PUT /api/parametros)",
      `${baseUrl}/parametros`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenAlumnoA}` },
        body: JSON.stringify({
          cuotaMensual: 10,
        }),
      },
      403
    );

    await assertEndpoint(
      "Alumno intenta consultar auditoría administrativa (GET /api/administracion/historial)",
      `${baseUrl}/administracion/historial`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenAlumnoA}` },
      },
      403
    );

    await assertEndpoint(
      "Alumno intenta listar administradores (GET /api/administradores)",
      `${baseUrl}/administradores`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenAlumnoA}` },
      },
      403
    );

    // 3. Probar aislamiento de datos privados entre Alumnos
    console.log("\n--- 2. Verificando aislamiento de datos privados entre Alumnos ---");

    // Buscar una multa o contrato de Alumno B
    const multaB = await prisma.multa.findFirst({
      where: { idAlumno: alumnoB.idAlumno },
    });

    if (multaB) {
      await assertEndpoint(
        `Alumno A intenta ver multa de Alumno B (GET /api/multas/${multaB.idMulta})`,
        `${baseUrl}/multas/${multaB.idMulta}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${tokenAlumnoA}` },
        },
        403
      );
    }

    const contratoB = await prisma.contrato.findFirst({
      where: { idAlumno: alumnoB.idAlumno },
    });

    if (contratoB) {
      await assertEndpoint(
        `Alumno A intenta ver contrato de Alumno B (GET /api/contratos/${contratoB.idContrato})`,
        `${baseUrl}/contratos/${contratoB.idContrato}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${tokenAlumnoA}` },
        },
        403
      );
    }

    // 4. Probar que las acciones permitidas al Alumno SÍ funcionan correctamente
    console.log("\n--- 3. Verificando acciones legítimas del Alumno ---");

    const nuevoReclamo = await assertEndpoint(
      "Alumno A crea su propia presentación (POST /api/reclamos)",
      `${baseUrl}/reclamos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenAlumnoA}` },
        body: JSON.stringify({
          idAlumno: alumnoA.idAlumno,
          tipo: "reclamo",
          categoria: "mantenimiento",
          asunto: "Prueba autorizada de Alumno A",
          descripcion: "Descripción con más de 20 caracteres para cumplir la validación.",
          ubicacion: "Habitación",
          prioridad: "normal",
        }),
      },
      201
    );

    const idReclamoA = nuevoReclamo.data.idReclamo;

    await assertEndpoint(
      "Alumno A consulta el detalle de su presentación recién creada (GET /api/reclamos/:id)",
      `${baseUrl}/reclamos/${idReclamoA}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenAlumnoA}` },
      },
      200
    );

    await assertEndpoint(
      "Alumno B intenta ver la presentación privada de Alumno A (GET /api/reclamos/:id)",
      `${baseUrl}/reclamos/${idReclamoA}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenAlumnoB}` },
      },
      403
    );

    await assertEndpoint(
      "Alumno A agrega un comentario a su presentación (POST /api/reclamos/:id/respuestas)",
      `${baseUrl}/reclamos/${idReclamoA}/respuestas`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenAlumnoA}` },
        body: JSON.stringify({
          mensaje: "Comentario de seguimiento legítimo del alumno titular.",
        }),
      },
      200
    );

    await assertEndpoint(
      "Alumno B intenta responder al reclamo de Alumno A (POST /api/reclamos/:id/respuestas)",
      `${baseUrl}/reclamos/${idReclamoA}/respuestas`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenAlumnoB}` },
        body: JSON.stringify({
          mensaje: "Intento de respuesta no autorizada.",
        }),
      },
      403
    );

    // 5. Probar que el Administrador sí puede realizar acciones y ver los recursos
    console.log("\n--- 4. Verificando que Administrador conserva todos sus privilegios ---");

    await assertEndpoint(
      "Admin consulta historial administrativo (GET /api/administracion/historial)",
      `${baseUrl}/administracion/historial`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      },
      200
    );

    await assertEndpoint(
      "Admin consulta presentación de Alumno A (GET /api/reclamos/:id)",
      `${baseUrl}/reclamos/${idReclamoA}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      },
      200
    );

    console.log("\n🎉 TODOS LOS CONTROLES DE ACCESO Y SEGURIDAD RBAC FUNCIONAN A LA PERFECCIÓN.");
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error("\n❌ Error durante la ejecución de las pruebas RBAC:", err);
  process.exit(1);
});
