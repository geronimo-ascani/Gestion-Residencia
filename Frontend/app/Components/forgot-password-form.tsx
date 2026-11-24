import { Link } from "react-router";

export function ForgotPasswordForm() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
        Recuperá tu contraseña
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Contactá a la administración de la residencia para recuperar el acceso a tu cuenta.
      </p>
      <Link to="/login" className="mt-6 inline-block text-sm font-medium text-brand-700 hover:underline dark:text-brand-400">
        Volver a iniciar sesión
      </Link>
    </>
  );
}
