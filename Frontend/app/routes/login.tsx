import type { Route } from "./+types/login";
import { AuthLayout } from "../Components/auth-layout";
import { LoginForm } from "../Components/login-form";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Iniciar sesión · Gestión de Residencia" },
    {
      name: "description",
      content: "Accede al panel de gestión de la residencia.",
    },
  ];
}

export default function Login() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
