# Gestión de Residencia Estudiantil

Sistema integral para la administración de residencias estudiantiles: gestión de residentes, habitaciones, contratos, facturación mensual, cobros, sanciones/multas disciplinarias, grupos de rotación de limpieza y portal de autogestión para alumnos.

---

## Estructura del Proyecto

* **`Frontend/`**: Aplicación web SPA/SSR desarrollada en **React 19**, **React Router v8**, **Tailwind CSS v4** y **TypeScript 5.9** (modo `strict`).
* **`Backend/`**: API REST en **Node.js** y **Express** con arquitectura por capas (rutas, controladores, validadores Zod y servicios), con **Prisma ORM** conectado a **PostgreSQL (Supabase)**.

---

## Puesta en Marcha

### 1. Instalación de dependencias
Instalá las dependencias de ambos proyectos:
```bash
npm --prefix Backend install
npm --prefix Frontend install
```

### 2. Variables de entorno del Backend
Asegurate de contar con el archivo `Backend/.env` con la cadena de conexión a la base de datos PostgreSQL:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
CORS_ORIGIN="http://localhost:5173"
```

### 3. Cargar datos iniciales (Seed)
Para sembrar la base de datos con las tablas y datos reales:
```bash
npm run seed
```

### 4. Iniciar servidores de desarrollo
Desde la raíz del repositorio podés levantar ambos servidores en simultáneo:
```bash
npm run dev
```
* **Frontend:** [http://localhost:5173](http://localhost:5173) (con proxy automático para `/api` hacia el backend).
* **Backend API:** [http://localhost:3000/api](http://localhost:3000/api) (health check público en `/api/health` y carga inicial autenticada en `/api/estado`).

## Seguridad en producción

- Publicá frontend y `/api` bajo el mismo origen HTTPS. Configurá `RESIDENCIA_API_ORIGIN` en el servidor del frontend con la URL del backend y reenviá `Cookie` y `Set-Cookie` a través del proxy. Desplegá ambos servicios juntos.
- Configurá `NODE_ENV=production` y generá un `JWT_SECRET` aleatorio de al menos 32 caracteres. Dejá `CORS_ORIGIN` vacío para servir un solo origen. Si hay consumidores desde otros orígenes, enumerá los orígenes HTTPS exactos. Ajustá `TRUST_PROXY_HOPS` a la topología real si hay proxies de confianza. El límite de intentos de autenticación se aplica por IP e instancia.
- En Supabase, aplicá [proteger-data-api.sql](Backend/prisma/proteger-data-api.sql) después de crear el esquema. El rol de conexión directa de Prisma necesita permisos sobre las tablas y sus secuencias. Esta aplicación usa Prisma. Si otras integraciones tampoco usan REST o GraphQL de Supabase, [desactivá la Data API](https://supabase.com/docs/guides/api/securing-your-api#disable-the-data-api).
- Excluí las cuentas y cargas de demostración de la base de producción. Rotá claves iniciales antiguas derivadas de datos personales y el secreto JWT del despliegue anterior. El registro público queda deshabilitado en producción. La recuperación por correo requiere configurar un proveedor de correo.
- Comprobá en el despliegue con cuentas de prueba que la navegación distingue ambos roles, que el cierre invalida la sesión y que la API devuelve `401` sin sesión. Revisá los registros de acceso disponibles si el endpoint anterior operó con datos reales.


---

## Cuentas y Credenciales de Prueba

La base de datos se siembra mediante `npm run seed` con cuentas preconfiguradas para pruebas y desarrollo:

### 1. Administrador (Gestión Integral)

Cuenta con acceso completo a todos los módulos: alumnos, habitaciones, contratos, facturación, cobros, multas, limpieza, reclamos, parámetros y administración de usuarios.

| Rol | Nombre | Correo Electrónico | Contraseña | Permisos Especiales |
| --- | --- | --- | --- | --- |
| **Administrador** | Ana Pérez | `ana@residencia.ar` | `Pérez123` | Gestión de administradores, parámetros y auditoría |

### 2. Alumnos Residentes (Portal de Autogestión)

Los alumnos autenticados acceden exclusivamente al portal `/estudiante`. Sus consultas y mutaciones están aisladas por titularidad y tienen bloqueadas todas las acciones administrativas (RBAC).

> **Criterio de contraseña inicial:** `[PrimerApellido][Últimos 3 dígitos del DNI]` (respetando mayúsculas y acentos).

| Alumno | Correo Electrónico | Contraseña | DNI | Habitación | Legajo |
| --- | --- | --- | --- | --- | --- |
| **Lucía Fernández** | `alumno01@example.com` | `Fernández001` | `46000001` | Hab. 1 | `2026-01` |
| **Martina López** | `alumno02@example.com` | `López002` | `46000002` | Hab. 1 | `2026-02` |
| **Tomás Gómez** | `alumno03@example.com` | `Gómez003` | `46000003` | Hab. 2 | `2026-03` |
| **Mateo Rodríguez** | `alumno04@example.com` | `Rodríguez004` | `46000004` | Hab. 2 | `2026-04` |
| **Valentina Martínez** | `alumno05@example.com` | `Martínez005` | `46000005` | Hab. 3 | `2026-05` |
| **Camila Pérez** | `alumno06@example.com` | `Pérez006` | `46000006` | Hab. 3 | `2026-06` |
| ... | *Correlativo hasta:* | | | | |
| **Catalina Medina** | `alumno14@example.com` | `Medina014` | `46000014` | Hab. 5 | `2026-14` |

---

## Scripts Disponibles (Raíz)

* `npm run dev`: Inicia Frontend y Backend simultáneamente en paralelo.
* `npm run dev:frontend`: Inicia únicamente el servidor Vite del Frontend.
* `npm run dev:backend`: Inicia únicamente la API Express del backend con el modo de observación de Node.
* `npm run build`: Ejecuta el build de producción del Frontend (cliente y servidor SSR).
* `npm run typecheck`: Ejecuta `react-router typegen && tsc` para validar tipos en Frontend.
* `npm run seed`: Puebla la base de datos PostgreSQL con datos base.
* `npm run test:backend`: Corre la suite de pruebas de integración de la API.
