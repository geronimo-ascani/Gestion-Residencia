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
JWT_SECRET="residencia_estudiantil_jwt_secret_key"
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
* **Backend API:** [http://localhost:3000/api](http://localhost:3000/api) (Health check: `/api/health`, Bootstrap de estado: `/api/estado`).

---

## Scripts Disponibles (Raíz)

* `npm run dev`: Inicia Frontend y Backend simultáneamente en paralelo.
* `npm run dev:frontend`: Inicia únicamente el servidor Vite del Frontend.
* `npm run dev:backend`: Inicia únicamente la API Express del Backend con nodemon.
* `npm run build`: Ejecuta el build de producción del Frontend (cliente y servidor SSR).
* `npm run typecheck`: Ejecuta `react-router typegen && tsc` para validar tipos en Frontend.
* `npm run seed`: Puebla la base de datos PostgreSQL con datos base.
* `npm run test:backend`: Corre la suite de pruebas de integración de la API.
