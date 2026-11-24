import { iniciarSesionDePrueba } from "./sesion-prueba.mjs";

async function main() {
  const baseUrl = "http://127.0.0.1:3000/api";
  const { token } = await iniciarSesionDePrueba(baseUrl, "ADMIN", "ADMINISTRADOR");
  const respuesta = await fetch(`${baseUrl}/estado`, { headers: { Authorization: `Bearer ${token}` } });
  if (!respuesta.ok) throw new Error(`No se pudo consultar el estado: ${respuesta.status}`);
  const { data: estado } = await respuesta.json();
  console.log("Keys in estado:", Object.keys(estado));
  console.log("Counts in estado:", {
    alumnos: estado.alumnos.length,
    habitaciones: estado.habitaciones.length,
    asignaciones: estado.asignaciones.length,
    contratos: estado.contratos.length,
    facturas: estado.facturas.length,
    pagos: estado.pagos.length,
    multas: estado.multas.length,
    grupos: estado.grupos.length,
    grupoAlumnos: estado.grupoAlumnos.length,
    ambientes: estado.ambientes.length,
    usuarios: estado.usuarios.length,
    tareasLimpieza: estado.tareasLimpieza.length,
    carreras: estado.carreras.length,
    vinculos: estado.vinculos.length,
    parametros: Object.keys(estado.parametros).length,
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
