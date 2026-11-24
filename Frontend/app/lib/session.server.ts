import { matchPath, redirect } from "react-router";

export async function exigirSesion(request: Request, pathname: string) {
  const nombreCookie = import.meta.env.PROD ? "__Host-residencia" : "residencia";
  const cookie = request.headers.get("Cookie")?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${nombreCookie}=`));
  if (!cookie) throw redirect("/login", { headers: { "Cache-Control": "no-store" } });

  const backend = process.env.RESIDENCIA_API_ORIGIN || "http://localhost:3000";
  let respuesta: Response;
  try {
    respuesta = await fetch(new URL("/api/auth/sesion", backend), {
      headers: { Cookie: cookie },
      redirect: "error",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(5_000)]),
      cache: "no-store",
    });
  } catch {
    throw new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  if (respuesta.status === 401 || respuesta.status === 403) {
    throw redirect("/login", { headers: { "Cache-Control": "no-store" } });
  }
  if (!respuesta.ok) {
    throw new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const { data } = await respuesta.json();
  const rutaAlumno = matchPath("/estudiante/*", pathname);
  if (data?.rol === "ALUMNO" && !rutaAlumno) {
    throw redirect("/estudiante", { headers: { "Cache-Control": "no-store" } });
  }
  if (data?.rol === "ADMINISTRADOR" && rutaAlumno) {
    throw redirect("/", { headers: { "Cache-Control": "no-store" } });
  }
  if (data?.rol !== "ALUMNO" && data?.rol !== "ADMINISTRADOR") {
    throw redirect("/login", { headers: { "Cache-Control": "no-store" } });
  }
  return null;
}
