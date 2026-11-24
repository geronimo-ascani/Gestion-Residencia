import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, before, test } from "node:test";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test@127.0.0.1:9/residencia";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.JWT_EXPIRES_IN = "1h";
delete process.env.JWT_SECRET;

const clave = "Credencial de prueba 41";
const contrasenaHash = await bcrypt.hash(clave, 4);
const alumnos = [
  { idAlumno: 10, nombre: "Residente", apellido: "Uno", estado: "activo", contactosEmergencia: [] },
  { idAlumno: 20, nombre: "Residente", apellido: "Dos", estado: "activo", contactosEmergencia: [] },
];
const cuentas = [
  { idUsuario: 1, correo: "uno@example.test", idRol: 2, rol: { rol: "ALUMNO" }, alumno: alumnos[0] },
  { idUsuario: 2, correo: "admin@example.test", idRol: 1, rol: { rol: "ADMINISTRADOR" }, alumno: null },
].map((cuenta) => ({ ...cuenta, contrasenaHash, estado: "activo", gestionaAdministradores: false }));

const sesiones = new Map();
const auditadas = [];
const desdeAlumno = (registros, where) =>
  registros.filter((registro) => where?.idAlumno === undefined || registro.idAlumno === where.idAlumno);
const sinRegistros = { findMany: async () => [] };

globalThis.prisma = {
  usuario: {
    findUnique: async ({ where }) => cuentas.find((cuenta) => cuenta.correo === where.correo),
    findMany: async ({ where }) =>
      cuentas.filter((cuenta) => where?.idUsuario === undefined || cuenta.idUsuario === where.idUsuario),
  },
  sesion: {
    findUnique: async ({ where }) => sesiones.get(where.tokenHash),
    create: async ({ data }) => {
      assert.equal(sesiones.has(data.tokenHash), false);
      const sesion = {
        ...data,
        idSesion: sesiones.size + 1,
        revocadaEn: null,
        usuario: cuentas.find((cuenta) => cuenta.idUsuario === data.idUsuario),
      };
      sesiones.set(data.tokenHash, sesion);
      return sesion;
    },
    updateMany: async ({ where, data }) => {
      const sesion = [...sesiones.values()].find((sesion) => sesion.idSesion === where.idSesion);
      if (sesion) Object.assign(sesion, data);
      return { count: Number(Boolean(sesion)) };
    },
  },
  parametroSistema: { ...sinRegistros, count: async () => 1 },
  opcionCatalogo: { ...sinRegistros, count: async () => 1 },
  alumno: {
    count: async ({ where }) => desdeAlumno(alumnos, where).length,
    findMany: async ({ where }) => desdeAlumno(alumnos, where),
  },
  habitacion: sinRegistros,
  ambiente: sinRegistros,
  tareaLimpieza: sinRegistros,
  grupoDeLimpieza: sinRegistros,
  grupoLimpiezaAlumno: sinRegistros,
  grupoLimpiezaAmbiente: sinRegistros,
  habitacionAlumno: sinRegistros,
  contrato: sinRegistros,
  factura: sinRegistros,
  pago: sinRegistros,
  multa: sinRegistros,
  cambioAdministrativo: sinRegistros,
  notificacion: {
    count: async () => 0,
    findMany: async ({ where }) => {
      auditadas.push(where.idUsuario);
      return [];
    },
  },
  reclamo: {
    ...sinRegistros,
    findUnique: async () => ({ idAlumno: 10, estado: "pendiente" }),
  },
};

const { default: app } = await import("../app.js");
const { env } = await import("../config/env.js");
let server;
let url;
let alumnoBearer;
let adminBearer;

function request(path, options) {
  return fetch(url + path, options);
}

function json(method, body, headers) {
  return { method, body: JSON.stringify(body), headers: { "Content-Type": "application/json", ...headers } };
}

async function login(correo, headers) {
  const res = await request("/auth/login", json("POST", { correo, contrasena: clave }, headers));
  assert.equal(res.status, 200);
  return { res, data: (await res.json()).data };
}

before(async () => {
  await new Promise((resolve) => { server = app.listen(0, "127.0.0.1", resolve); });
  url = `http://127.0.0.1:${server.address().port}/api`;
  alumnoBearer = { Authorization: `Bearer ${(await login(cuentas[0].correo)).data.token}` };
  adminBearer = { Authorization: `Bearer ${(await login(cuentas[1].correo)).data.token}` };
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

test("la API exige sesión en todos los módulos y mantiene público el health check", async () => {
  assert.equal((await request("/health")).status, 200);
  const privadas = [
    "/estado", "/bootstrap", "/administracion/estado", "/administracion/bootstrap", "/alumnos",
    "/habitaciones", "/contratos", "/facturas", "/facturacion", "/pagos", "/cobros", "/cuotas",
    "/multas", "/grupos-limpieza", "/limpieza", "/tareas-limpieza", "/ambientes", "/reclamos",
    "/parametros", "/catalogos/carreras", "/notificaciones", "/administracion/notificaciones",
    "/auth/me", "/auth/sesiones",
    "/auth/sesion",
  ];
  for (const ruta of privadas) {
    const respuesta = await request(ruta);
    assert.equal(respuesta.status, 401, ruta);
    assert.equal(respuesta.headers.get("Cache-Control"), "no-store");
  }
  assert.equal((await request("/auth/logout", { method: "POST" })).status, 401);
});

test("las cuatro rutas de estado y el padrón respetan el alcance de la cuenta", async () => {
  for (const ruta of ["/estado", "/bootstrap", "/administracion/estado", "/administracion/bootstrap"]) {
    const res = await request(ruta, { headers: alumnoBearer });
    assert.equal(res.status, 200, ruta);
    const { data } = await res.json();
    assert.equal(data.idUsuarioSesion, "1");
    assert.deepEqual(data.alumnos.map((residente) => residente.idAlumno), ["10"]);
    assert.equal(data.usuarios.length, 1);
    assert.equal(data.historialAdministrativo.length, 0);
    assert.equal("contrasenaHash" in data.usuarios[0], false);
  }
  const listado = await request("/alumnos", { headers: alumnoBearer });
  assert.equal(listado.status, 200);
  assert.deepEqual((await listado.json()).data.alumnos.map((residente) => residente.idAlumno), [10]);
  assert.equal((await request("/alumnos/20", { headers: alumnoBearer })).status, 403);
  assert.equal((await request("/alumnos/-10", { headers: alumnoBearer })).status, 400);

  const panel = await request("/estado", { headers: adminBearer });
  assert.equal(panel.status, 200);
  assert.equal((await panel.json()).data.alumnos.length, 2);
});

test("la sesión y el permiso de gestión determinan qué operaciones están autorizadas", async () => {
  const habitaciones = await request("/habitaciones", { headers: alumnoBearer });
  assert.equal(habitaciones.status, 403);

  const update = await request("/administracion/administradores/2", json("PUT", {
    gestionaAdministradores: true,
  }, adminBearer));
  assert.equal(update.status, 403);

  const reclamo = await request("/reclamos/1/respuestas", json("POST", {
    mensaje: "Mensaje de prueba", estado: "resuelto",
  }, alumnoBearer));
  assert.equal(reclamo.status, 400);

  const notificaciones = await request("/notificaciones?idUsuario=2", { headers: alumnoBearer });
  assert.equal(notificaciones.status, 200);
  assert.equal(auditadas.at(-1), 1);
});

test("solo sirven las sesiones existentes, vigentes y con una cuenta activa", async () => {
  const tokenSinSesion = jwt.sign({ idUsuario: 1 }, env.JWT_SECRET, { expiresIn: "1h" });
  assert.equal((await request("/estado", { headers: { Authorization: `Bearer ${tokenSinSesion}` } })).status, 401);
  const hash = createHash("sha256").update(alumnoBearer.Authorization.slice(7)).digest("hex");
  const sesion = sesiones.get(hash);
  cuentas[0].estado = "suspendido";
  try {
    assert.equal((await request("/estado", { headers: alumnoBearer })).status, 401);
  } finally {
    cuentas[0].estado = "activo";
  }
  const expiraEn = sesion.expiraEn;
  sesion.expiraEn = new Date(0);
  try {
    assert.equal((await request("/estado", { headers: alumnoBearer })).status, 401);
  } finally {
    sesion.expiraEn = expiraEn;
  }
});

test("el navegador recibe una cookie HttpOnly y cerrar sesión revoca el acceso", async () => {
  const browser = { "X-Residencia-Request": "browser" };
  const { res, data } = await login(cuentas[0].correo, browser);
  const setCookie = res.headers.get("set-cookie");
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Strict/);
  assert.equal("token" in data, false);
  const headers = { ...browser, Cookie: setCookie.split(";")[0] };

  assert.equal((await request("/estado", { headers })).status, 200);
  assert.equal((await request("/auth/logout", { method: "POST", headers: { Cookie: headers.Cookie } })).status, 403);
  assert.equal((await request("/auth/logout", {
    method: "POST", headers: { ...headers, Origin: "https://otro.example.test" },
  })).status, 403);
  const cerrada = await request("/auth/logout", { method: "POST", headers });
  assert.equal(cerrada.status, 200);
  assert.match(cerrada.headers.get("set-cookie"), /residencia=;/);
  assert.equal((await request("/estado", { headers })).status, 401);
});

test("los alias de inicio de sesión comparten el límite de solicitudes", async () => {
  for (let intento = 0; intento < 27; intento += 1) {
    const ruta = intento % 2 ? "/auth/login" : "/auth/sign-in/email";
    const respuesta = await request(ruta, json("POST", {}));
    assert.equal(respuesta.status, 400);
  }
  const limitada = await request("/auth/login", json("POST", {}));
  assert.equal(limitada.status, 429);
  assert.ok(Number(limitada.headers.get("Retry-After")) > 0);
});
