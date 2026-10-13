import type { Route } from "./+types/forgot-password";
import { AuthLayout } from "../Components/auth-layout";
import { ForgotPasswordForm } from "../Components/forgot-password-form";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Recuperar contraseña · Gestión de Residencia" },
    {
      name: "description",
      content: "Solicita un enlace para restablecer tu contraseña.",
    },
  ];
}

export default function ForgotPassword() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
