# Backend - Sistema de Gestión de Residencia Estudiantil

API REST desarrollada con Node.js, Express y Prisma ORM conectada a PostgreSQL (Supabase).

## Estructura del Proyecto

Arquitectura en capas:
- `src/schemas`: Validaciones de entrada y esquemas de datos con Zod.
- `src/services`: Lógica de negocio y consultas con Prisma Client.
- `src/controllers`: Manejadores de solicitudes HTTP y respuestas estandarizadas.
- `src/routes`: Enrutadores modulares de Express.
- `src/middlewares`: Autenticación JWT, control de acceso por roles (RBAC), validación y manejo centralizado de errores.
- `prisma/`: Esquema relacional de base de datos (`schema.prisma`).

## Módulos de la API

- `/api/auth`: Registro, login, verificación de sesión y cambio de contraseña con JWT y bcrypt.
- `/api/alumnos`: Gestión integral de alumnos y perfiles asociados a usuarios.
- `/api/habitaciones`: Catálogo de habitaciones, disponibilidad de plazas y asignación histórica.
- `/api/contratos`: Contratos de estadía, vigencias y bajas anticipadas.
- `/api/cuotas`: Emisión, cobro y generación masiva de cuotas mensuales.
- `/api/multas`: Registro, vencimiento y cobro de multas disciplinarias.
- `/api/grupos-limpieza`: Grupos de aseo, miembros y turnos.
- `/api/ambientes`: Catálogo de ambientes comunes y tareas de limpieza.

## Comandos Principales

```bash
# Iniciar servidor en modo desarrollo
npm run dev

# Iniciar servidor en modo producción
npm start

# Sincronizar cambios en la base de datos con Prisma
npx prisma db push

# Explorar la base de datos visualmente
npm run prisma:studio
```
