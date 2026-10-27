import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
  layout("routes/app-shell.tsx", [
    index("routes/dashboard.tsx"),
    route("alumnos", "routes/alumnos.tsx"),
    route("alumnos/:idAlumno", "routes/alumnos.$idAlumno.tsx"),
    route("*", "routes/proximamente.tsx"),
  ]),
] satisfies RouteConfig;
