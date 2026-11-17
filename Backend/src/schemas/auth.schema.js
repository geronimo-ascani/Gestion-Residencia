import { z } from "zod";

/**
 * Esquema de validación para inicio de sesión (Login).
 * Acepta 'correo' o 'email', y 'contrasena' o 'password'.
 */
export const loginSchema = z
  .object({
    correo: z.string().trim().email("Formato de correo electrónico inválido").toLowerCase().optional(),
    email: z.string().trim().email("Formato de correo electrónico inválido").toLowerCase().optional(),
    contrasena: z.string().min(1, "La contraseña es obligatoria").optional(),
    password: z.string().min(1, "La contraseña es obligatoria").optional(),
    rememberMe: z.boolean().optional(),
    remember: z.boolean().optional(),
  })
  .refine((data) => data.correo || data.email, {
    message: "El correo electrónico es obligatorio",
    path: ["email"],
  })
  .refine((data) => data.contrasena || data.password, {
    message: "La contraseña es obligatoria",
    path: ["password"],
  })
  .transform((data) => ({
    correo: (data.correo || data.email).toLowerCase().trim(),
    contrasena: data.contrasena || data.password,
    remember: data.rememberMe ?? data.remember ?? false,
  }));

/**
 * Esquema de validación para registro de usuario.
 * Acepta tanto nombres en español como en inglés (Frontend).
 */
export const registerSchema = z
  .object({
    correo: z.string().trim().email("Formato de correo electrónico inválido").toLowerCase().optional(),
    email: z.string().trim().email("Formato de correo electrónico inválido").toLowerCase().optional(),
    contrasena: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
    nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
    name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
    apellido: z.string().trim().optional(),
    documento: z.string().trim().optional(),
    telefono: z.string().trim().optional(),
    rol: z.enum(["ADMINISTRADOR", "ALUMNO", "administrador", "alumno"]).default("ALUMNO"),
  })
  .refine((data) => data.correo || data.email, {
    message: "El correo electrónico es obligatorio",
    path: ["email"],
  })
  .refine((data) => data.contrasena || data.password, {
    message: "La contraseña es obligatoria",
    path: ["password"],
  })
  .transform((data) => {
    const fullName = (data.nombre || data.name || "").trim();
    let nombreFinal = fullName;
    let apellidoFinal = data.apellido || "";

    if (!apellidoFinal && fullName.includes(" ")) {
      const parts = fullName.split(" ");
      nombreFinal = parts[0];
      apellidoFinal = parts.slice(1).join(" ");
    }

    return {
      correo: (data.correo || data.email).toLowerCase().trim(),
      contrasena: data.contrasena || data.password,
      nombre: nombreFinal,
      apellido: apellidoFinal,
      documento: data.documento,
      telefono: data.telefono,
      rol: (data.rol || "ALUMNO").toUpperCase(),
    };
  });

/**
 * Esquema para cambio de contraseña.
 */
export const changePasswordSchema = z.object({
  contrasenaActual: z.string().min(1, "La contraseña actual es obligatoria"),
  nuevaContrasena: z
    .string()
    .min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
});

/**
 * Esquema para solicitud de restablecimiento de contraseña (olvido de clave).
 */
export const forgetPasswordSchema = z
  .object({
    correo: z.string().trim().email("Formato de correo electrónico inválido").toLowerCase().optional(),
    email: z.string().trim().email("Formato de correo electrónico inválido").toLowerCase().optional(),
    redirectTo: z.string().optional(),
  })
  .refine((data) => data.correo || data.email, {
    message: "El correo electrónico es obligatorio",
    path: ["email"],
  })
  .transform((data) => ({
    correo: (data.correo || data.email).toLowerCase().trim(),
    redirectTo: data.redirectTo || "/reset-password",
  }));

/**
 * Esquema para restablecer contraseña con token.
 */
export const resetPasswordSchema = z
  .object({
    token: z.string({ required_error: "El token de restablecimiento es obligatorio" }).min(1),
    newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres").optional(),
    nuevaContrasena: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres").optional(),
  })
  .refine((data) => data.newPassword || data.nuevaContrasena, {
    message: "La nueva contraseña es obligatoria",
    path: ["newPassword"],
  })
  .transform((data) => ({
    token: data.token.trim(),
    nuevaContrasena: data.newPassword || data.nuevaContrasena,
  }));
