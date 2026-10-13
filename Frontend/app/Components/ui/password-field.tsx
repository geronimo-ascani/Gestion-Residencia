import { useState } from "react";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { getPasswordChecks } from "../../lib/validation";
import { FormControl, FormControlError, FormControlLabel } from "./form-control";
import { Input, InputField } from "./input";

export interface PasswordFieldProps
  extends Omit<ComponentProps<"input">, "id" | "type" | "required" | "value"> {
  id: string;
  label: string;
  value: string;
  error?: string;
  hint?: string;
  required?: boolean;
  showRequirements?: boolean;
}

export function PasswordField({
  id,
  label,
  value,
  error,
  hint,
  required = false,
  showRequirements = false,
  className,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <FormControl>
      <FormControlLabel htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-red-600">
            *
          </span>
        ) : null}
      </FormControlLabel>
      <Input>
        <InputField
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          required={required || undefined}
          isInvalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn("pr-11", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-400 transition-colors hover:text-slate-600 focus-visible:text-brand-600 focus-visible:outline-none dark:hover:text-slate-200"
        >
          <EyeIcon open={visible} />
        </button>
      </Input>
      {showRequirements ? <PasswordRequirements value={value} /> : null}
      {error ? (
        <FormControlError id={errorId}>{error}</FormControlError>
      ) : hint ? (
        <p id={hintId} className="text-sm text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      ) : null}
    </FormControl>
  );
}

export function PasswordRequirements({ value }: { value: string }) {
  const checks = getPasswordChecks(value);

  return (
    <ul className="mt-1 flex flex-col gap-1 text-xs">
      {checks.map((check) => (
        <li
          key={check.id}
          className={cn(
            "flex items-center gap-1.5",
            check.met
              ? "text-brand-700 dark:text-brand-400"
              : "text-slate-500 dark:text-slate-400",
          )}
        >
          {check.met ? <CheckIcon /> : <DotIcon />}
          <span>{check.label}</span>
          <span className="sr-only">
            {check.met ? " (cumplido)" : " (pendiente)"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="h-3.5 w-3.5 shrink-0"
    >
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M5 8.2l2 2 4-4.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DotIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="h-3.5 w-3.5 shrink-0"
    >
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="8" r="1.6" fill="currentColor" />
    </svg>
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
