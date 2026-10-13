import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";

import { signInWithEmail } from "../lib/auth";
import { Button } from "./ui/button";
import { FormControl, FormControlError, FormControlLabel } from "./ui/form-control";
import { Input, InputField } from "./ui/input";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  email?: string;
  password?: string;
}

export function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    const value = email.trim();

    if (!value) {
      next.email = "Ingresa tu correo electrónico.";
    } else if (!EMAIL_PATTERN.test(value)) {
      next.email = "Ingresa un correo electrónico válido.";
    }

    if (!password) {
      next.password = "Ingresa tu contraseña.";
    }

    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validate();
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) {
      document
        .getElementById(nextErrors.email ? "email" : "password")
        ?.focus();
      return;
    }

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
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {formError ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
        >
          {formError}
        </p>
      ) : null}

      <FormControl>
        <FormControlLabel htmlFor="email">Correo electrónico</FormControlLabel>
        <Input>
          <InputField
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            placeholder="nombre@ejemplo.com"
            value={email}
            isInvalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            onChange={(event) => {
              setEmail(event.target.value);
              if (errors.email) {
                setErrors((previous) => ({ ...previous, email: undefined }));
              }
            }}
          />
        </Input>
        {errors.email ? (
          <FormControlError id="email-error">{errors.email}</FormControlError>
        ) : null}
      </FormControl>

      <FormControl>
        <FormControlLabel htmlFor="password">Contraseña</FormControlLabel>
        <Input>
          <InputField
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="pr-11"
            value={password}
            isInvalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            onChange={(event) => {
              setPassword(event.target.value);
              if (errors.password) {
                setErrors((previous) => ({
                  ...previous,
                  password: undefined,
                }));
              }
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-400 transition-colors hover:text-slate-600 focus-visible:text-brand-600 focus-visible:outline-none dark:hover:text-slate-200"
          >
            <EyeIcon open={showPassword} />
          </button>
        </Input>
        {errors.password ? (
          <FormControlError id="password-error">
            {errors.password}
          </FormControlError>
        ) : null}
      </FormControl>

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
          to="/recuperar-contrasena"
          className="rounded text-sm font-medium text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-400"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <Button type="submit" size="lg" isLoading={isSubmitting}>
        {isSubmitting ? "Iniciando sesión…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      {open ? null : (
        <path
          d="M4 4l16 16"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
