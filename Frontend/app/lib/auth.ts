import { cargarDatosGuardados, DATOS_KEY } from "./persistence";
import { claveInicial, hashClave } from "./credenciales";
import { estadoAcceso } from "./administracion";
import { guardarSesion } from "./session";
export interface AuthResult {
  error?: string;
}

interface ApiErrorBody {
  message?: string;
}

/**
 * Thin wrapper around the auth HTTP API.
 *
 * Paths follow the Better Auth conventions (`/api/auth/...`), so wiring the
 * backend later only requires mounting the handler — no changes here.
 */
async function post(
  path: string,
  body: unknown,
  fallbackMessage: string,
): Promise<AuthResult> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as ApiErrorBody | null;
      return { error: data?.message ?? fallbackMessage };
    }

    if (!response.headers.get("content-type")?.includes("application/json")) return { error: "Este servicio todavía no está disponible. Contactá a la administración." };
    return {};
  } catch {
    return { error: "No se pudo conectar con el servicio. Inténtalo de nuevo." };
  }
}

export interface SignInCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export async function signInWithEmail(credentials: SignInCredentials): Promise<AuthResult> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        remember: credentials.remember,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.data?.usuario) {
        const u = json.data.usuario;
        guardarSesion({
          idUsuario: String(u.idUsuario),
          idAlumno: u.idAlumno ? String(u.idAlumno) : undefined,
          nombre: u.nombre || u.correo,
          apellido: u.apellido || "",
          documento: u.documento || "",
          correo: u.correo,
          rol: u.rol?.toLowerCase() === "administrador" ? "administrador" : "alumno",
          estado: u.estado || "activo",
          gestionaAdministradores: Boolean(u.gestionaAdministradores),
        }, credentials.remember);
        if (json.data.token) {
          try {
            sessionStorage.setItem("residencia_token", json.data.token);
            if (credentials.remember) localStorage.setItem("residencia_token", json.data.token);
          } catch {}
        }
        return {};
      }
    } else {
      const errorJson = await res.json().catch(() => null);
      if (errorJson?.message) {
        return { error: errorJson.message };
      }
    }
  } catch {
    // Si no responde el servidor, fallback de respaldo local
  }

  try {
    const datos = cargarDatosGuardados(localStorage.getItem(DATOS_KEY));
    const u = datos.usuarios.find((u) => u.correo.toLowerCase() === credentials.email.trim().toLowerCase());
    if (!u || estadoAcceso(u, datos) !== "activo") return { error: "Credenciales incorrectas o cuenta sin acceso habilitado." };
    const esperado = u.passwordHash ?? await hashClave(claveInicial(u.apellido ?? "", u.documento ?? ""));
    if (await hashClave(credentials.password) !== esperado) return { error: "El correo o la contraseña no son correctos." };
    guardarSesion(u, credentials.remember);
    return {};
  } catch {
    return { error: "No se pudo iniciar sesión ni leer los datos guardados. Comprobá que el navegador permita guardar datos o contactá a administración." };
  }
}

export interface SignUpCredentials {
  name: string;
  email: string;
  password: string;
}

export function signUpWithEmail(credentials: SignUpCredentials): Promise<AuthResult> {
  return post(
    "/api/auth/sign-up/email",
    {
      name: credentials.name,
      email: credentials.email,
      password: credentials.password,
    },
    "No se pudo crear la cuenta. Inténtalo de nuevo.",
  );
}

/**
 * Requests a password reset link.
 *
 * The endpoint always answers with success regardless of whether the email is
 * registered (account-enumeration prevention), so the caller can show a neutral
 * confirmation message.
 */
export function requestPasswordReset(email: string): Promise<AuthResult> {
  return post(
    "/api/auth/forget-password",
    { email, redirectTo: "/reset-password" },
    "No se pudo enviar el enlace. Inténtalo de nuevo.",
  );
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export function resetPassword(input: ResetPasswordInput): Promise<AuthResult> {
  return post(
    "/api/auth/reset-password",
    { token: input.token, newPassword: input.newPassword },
    "No se pudo restablecer la contraseña. Solicita un enlace nuevo.",
  );
}
