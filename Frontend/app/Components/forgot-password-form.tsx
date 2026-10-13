import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router";

import { requestPasswordReset } from "../lib/auth";
import { validateEmail } from "../lib/validation";
import { Button } from "./ui/button";
import { TextField } from "./ui/text-field";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const emailError = validateEmail(email);
    setError(emailError);
    if (emailError) return;

    setIsSubmitting(true);
    const { error: requestError } = await requestPasswordReset(email.trim());
    setIsSubmitting(false);

    if (requestError) {
      setFormError(requestError);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Revisa tu correo
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Si existe una cuenta asociada a{" "}
          <span className="font-medium text-slate-900 dark:text-white">
            {email.trim()}
          </span>
          , te enviamos un enlace para restablecer tu contraseña.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Button size="lg" onClick={() => setSent(false)}>
            Usar otro correo
          </Button>
          <Link
            to="/login"
            className="text-center text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
          >
            Volver a iniciar sesión
          </Link>
        </div>

        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          Revisa también la carpeta de spam o correo no deseado.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
        Recupera tu contraseña
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Escribe tu correo y te enviaremos un enlace para restablecerla.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-5">
        {formError ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
          >
            {formError}
          </p>
        ) : null}

        <TextField
          id="email"
          label="Correo electrónico"
          type="email"
          inputMode="email"
          required
          autoFocus
          autoComplete="email"
          placeholder="nombre@ejemplo.com"
          value={email}
          error={error}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError(undefined);
          }}
          onBlur={() => setError(validateEmail(email))}
        />

        <Button type="submit" size="lg" isLoading={isSubmitting}>
          {isSubmitting ? "Enviando…" : "Enviar enlace"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
        ¿Recordaste tu contraseña?{" "}
        <Link
          to="/login"
          className="font-medium text-brand-700 hover:underline dark:text-brand-400"
        >
          Inicia sesión
        </Link>
      </p>
    </>
  );
}
