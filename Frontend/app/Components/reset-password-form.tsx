import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { resetPassword } from "../lib/auth";
import { validatePassword } from "../lib/validation";
import type { FormErrorItem } from "./ui/form-error-summary";
import { Button } from "./ui/button";
import { FormErrorSummary } from "./ui/form-error-summary";
import { PasswordField } from "./ui/password-field";

interface ResetErrors {
  password?: string;
  confirmPassword?: string;
}

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<ResetErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          El enlace no es válido
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          El enlace para restablecer la contraseña es inválido o ya expiró.
          Solicita uno nuevo para continuar.
        </p>
        <Button
          size="lg"
          className="mt-8 w-full"
          onClick={() => navigate("/forgot-password")}
        >
          Solicitar un enlace nuevo
        </Button>
      </>
    );
  }

  if (done) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Contraseña actualizada
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Tu contraseña se cambió correctamente. Ya puedes iniciar sesión con tus
          nuevas credenciales.
        </p>
        <Button
          size="lg"
          className="mt-8 w-full"
          onClick={() => navigate("/login")}
        >
          Iniciar sesión
        </Button>
      </>
    );
  }

  function validateAll(): ResetErrors {
    const next: ResetErrors = {};

    const passwordError = validatePassword(password);
    if (passwordError) next.password = passwordError;

    if (!confirmPassword) {
      next.confirmPassword = "Confirma tu contraseña.";
    } else if (confirmPassword !== password) {
      next.confirmPassword = "Las contraseñas no coinciden.";
    }

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
    const { error } = await resetPassword({ token, newPassword: password });
    setIsSubmitting(false);

    if (error) {
      setFormError(error);
      return;
    }

    setDone(true);
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
        Nueva contraseña
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Elige una contraseña nueva para tu cuenta.
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

        {hasSubmitted && errorList.length > 0 ? (
          <FormErrorSummary key={submitCount} errors={errorList} />
        ) : null}

        <PasswordField
          id="password"
          label="Nueva contraseña"
          required
          autoFocus
          showRequirements
          autoComplete="new-password"
          placeholder="Crea una contraseña"
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

        <PasswordField
          id="confirmPassword"
          label="Confirmar contraseña"
          required
          autoComplete="new-password"
          placeholder="Repite la contraseña"
          value={confirmPassword}
          error={errors.confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            if (errors.confirmPassword) {
              setErrors((previous) => ({
                ...previous,
                confirmPassword: undefined,
              }));
            }
          }}
          onBlur={() =>
            setErrors((previous) => ({
              ...previous,
              confirmPassword: validateAll().confirmPassword,
            }))
          }
        />

        <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-1">
          {isSubmitting ? "Actualizando…" : "Actualizar contraseña"}
        </Button>
      </form>
    </>
  );
}
