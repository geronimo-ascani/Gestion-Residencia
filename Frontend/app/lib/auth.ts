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

export function signInWithEmail(credentials: SignInCredentials): Promise<AuthResult> {
  return post(
    "/api/auth/sign-in/email",
    {
      email: credentials.email,
      password: credentials.password,
      rememberMe: credentials.remember ?? false,
    },
    "El correo electrónico o la contraseña no son correctos.",
  );
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
