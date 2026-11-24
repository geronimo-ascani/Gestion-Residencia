import { limpiarDatosDeSesionAnteriores, notificarCambioDeSesion } from "./session";

export interface AuthResult {
  error?: string;
  rol?: "administrador" | "alumno";
}

interface ApiErrorBody {
  message?: string;
}

async function post(
  path: string,
  body: unknown,
  fallbackMessage: string,
): Promise<AuthResult> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
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
      headers: { "Content-Type": "application/json", "X-Residencia-Request": "browser" },
      credentials: "same-origin",
      body: JSON.stringify(credentials),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) return { error: json?.message ?? "No se pudo iniciar sesión." };

    const rol = json?.data?.usuario?.rol?.toLowerCase();
    if (rol !== "administrador" && rol !== "alumno") {
      return { error: "No se pudo verificar la cuenta." };
    }
    limpiarDatosDeSesionAnteriores();
    notificarCambioDeSesion();
    return { rol };
  } catch {
    return { error: "No se pudo conectar con el servicio. Volvé a intentar." };
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
