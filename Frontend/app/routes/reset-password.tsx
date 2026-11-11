import type { Route } from "./+types/reset-password";
import { AuthLayout } from "../Components/auth-layout";
import { ResetPasswordForm } from "../Components/reset-password-form";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Nueva contraseña · Gestión de Residencia" },
    {
      name: "description",
      content: "Establece una contraseña nueva para tu cuenta.",
    },
  ];
}

export default function ResetPassword() {
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  );
}
