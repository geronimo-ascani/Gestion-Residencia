export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRequired(
  value: string,
  message: string,
): string | undefined {
  return value.trim() ? undefined : message;
}

export function validateEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Ingresa tu correo electrónico.";
  if (!EMAIL_PATTERN.test(trimmed)) return "Ingresa un correo electrónico válido.";
  return undefined;
}

export interface PasswordRule {
  id: string;
  label: string;
  failure: string;
  test: (value: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: "Al menos 8 caracteres",
    failure: "Debe tener al menos 8 caracteres.",
    test: (value) => value.length >= 8,
  },
  {
    id: "letter",
    label: "Una letra",
    failure: "Debe incluir al menos una letra.",
    test: (value) => /[A-Za-zÀ-ÿ]/.test(value),
  },
  {
    id: "number",
    label: "Un número",
    failure: "Debe incluir al menos un número.",
    test: (value) => /\d/.test(value),
  },
];

export interface PasswordCheck extends PasswordRule {
  met: boolean;
}

export function getPasswordChecks(value: string): PasswordCheck[] {
  return PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(value) }));
}

export function validatePassword(value: string): string | undefined {
  if (!value) return "Crea una contraseña.";
  return PASSWORD_RULES.find((rule) => !rule.test(value))?.failure;
}
