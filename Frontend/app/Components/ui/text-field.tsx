import type { ComponentProps } from "react";
import { FormControl, FormControlError, FormControlLabel } from "./form-control";
import { Input, InputField } from "./input";

export interface TextFieldProps
  extends Omit<ComponentProps<"input">, "id" | "required"> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function TextField({
  id,
  label,
  error,
  hint,
  required = false,
  className,
  ...props
}: TextFieldProps) {
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
          required={required || undefined}
          isInvalid={Boolean(error)}
          aria-describedby={describedBy}
          className={className}
          {...props}
        />
      </Input>
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
