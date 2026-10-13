import type { Route } from "./+types/register";
import { AuthLayout } from "../Components/auth-layout";
import { RegisterForm } from "../Components/register-form";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Crear cuenta · Gestión de Residencia" },
    {
      name: "description",
      content: "Crea tu cuenta para gestionar la residencia.",
    },
  ];
}

export default function Register() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}
