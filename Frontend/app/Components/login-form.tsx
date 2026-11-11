import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";

import { signInWithEmail } from "../lib/auth";
import { validateEmail } from "../lib/validation";
import type { FormErrorItem } from "./ui/form-error-summary";
import { Button } from "./ui/button";
import { FormErrorSummary } from "./ui/form-error-summary";
import { PasswordField } from "./ui/password-field";
import { TextField } from "./ui/text-field";

interface LoginErrors {
  email?: string;
  password?: string;
}

export function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  function validateAll(): LoginErrors {
    const next: LoginErrors = {};

    const emailError = validateEmail(email);
    if (emailError) next.email = emailError;

    if (!password) next.password = "Ingresa tu contraseña.";

    return next;
  }

  const errorList: FormErrorItem[] = Object.entries(errors)
    .filter(([, message]) => Boolean(message))
    .map(([id, message]) => ({ id, message: message as string }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setHasSubmitted(true);
    setSubmitCount((count) => count + 1);

    const nextErrors = validateAll();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    const { error } = await signInWithEmail({
      email: email.trim(),
      password,
      remember,
    });
    setIsSubmitting(false);

    if (error) {
      setFormError(error);
      return;
    }

    navigate("/", { replace: true });
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
        Inicia sesión
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Accede con tu cuenta para continuar.
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-8 flex flex-col gap-5"
      >
        {formError ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
          >
            {formError}
          </p>
        ) : null}

        {hasSubmitted && errorList.length > 0 ? (
          <FormErrorSummary key={submitCount} errors={errorList} />
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
          error={errors.email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (errors.email) {
              setErrors((previous) => ({ ...previous, email: undefined }));
            }
          }}
          onBlur={() =>
            setErrors((previous) => ({ ...previous, email: validateAll().email }))
          }
        />

        <PasswordField
          id="password"
          label="Contraseña"
          required
          autoComplete="current-password"
          placeholder="Tu contraseña"
          value={password}
          error={errors.password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (errors.password) {
              setErrors((previous) => ({ ...previous, password: undefined }));
            }
          }}
          onBlur={() =>
            setErrors((previous) => ({
              ...previous,
              password: validateAll().password,
            }))
          }
        />

        <div className="flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              name="remember"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 accent-brand-600"
            />
            Mantener sesión iniciada
          </label>
          <Link
            to="/forgot-password"
            className="rounded text-sm font-medium text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-400"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button type="submit" size="lg" isLoading={isSubmitting}>
          {isSubmitting ? "Iniciando sesión…" : "Iniciar sesión"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
        ¿No tienes una cuenta?{" "}
        <Link
          to="/register"
          className="font-medium text-brand-700 hover:underline dark:text-brand-400"
        >
          Regístrate
        </Link>
      </p>
    </>
  );
}
