import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";

import { signUpWithEmail } from "../lib/auth";
import { validateEmail, validatePassword, validateRequired } from "../lib/validation";
import type { FormErrorItem } from "./ui/form-error-summary";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { FormErrorSummary } from "./ui/form-error-summary";
import { PasswordField } from "./ui/password-field";
import { TextField } from "./ui/text-field";

interface RegisterErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

export function RegisterForm() {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  function setValue(field: keyof typeof values, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    if (errors[field]) {
      setErrors((previous) => ({ ...previous, [field]: undefined }));
    }
  }

  function validateAll(): RegisterErrors {
    const next: RegisterErrors = {};

    const name = validateRequired(values.name, "Ingresa tu nombre completo.");
    if (name) next.name = name;

    const email = validateEmail(values.email);
    if (email) next.email = email;

    const password = validatePassword(values.password);
    if (password) next.password = password;

    if (!values.confirmPassword) {
      next.confirmPassword = "Confirma tu contraseña.";
    } else if (values.confirmPassword !== values.password) {
      next.confirmPassword = "Las contraseñas no coinciden.";
    }

    if (!terms) {
      next.terms = "Debes aceptar los términos y la política de privacidad.";
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
    const { error } = await signUpWithEmail({
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
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
        Crea tu cuenta
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Completa tus datos para empezar a usar el panel.
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

        <TextField
          id="name"
          label="Nombre completo"
          required
          autoFocus
          autoComplete="name"
          placeholder="Ana Pérez"
          value={values.name}
          error={errors.name}
          onChange={(event) => setValue("name", event.target.value)}
          onBlur={() =>
            setErrors((previous) => ({ ...previous, name: validateAll().name }))
          }
        />

        <TextField
          id="email"
          label="Correo electrónico"
          type="email"
          inputMode="email"
          required
          autoComplete="email"
          placeholder="nombre@ejemplo.com"
          value={values.email}
          error={errors.email}
          onChange={(event) => setValue("email", event.target.value)}
          onBlur={() =>
            setErrors((previous) => ({ ...previous, email: validateAll().email }))
          }
        />

        <PasswordField
          id="password"
          label="Contraseña"
          required
          showRequirements
          autoComplete="new-password"
          placeholder="Crea una contraseña"
          value={values.password}
          error={errors.password}
          onChange={(event) => setValue("password", event.target.value)}
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
          value={values.confirmPassword}
          error={errors.confirmPassword}
          onChange={(event) => setValue("confirmPassword", event.target.value)}
          onBlur={() =>
            setErrors((previous) => ({
              ...previous,
              confirmPassword: validateAll().confirmPassword,
            }))
          }
        />

        <Checkbox
          id="terms"
          checked={terms}
          error={errors.terms}
          label="Acepto los términos y la política de privacidad."
          onChange={(event) => {
            setTerms(event.target.checked);
            if (errors.terms) {
              setErrors((previous) => ({ ...previous, terms: undefined }));
            }
          }}
        />

        <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-1">
          {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
        ¿Ya tienes una cuenta?{" "}
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
