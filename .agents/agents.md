# AGENTS.md — Gestión de Residencia

> Documento de contexto y reglas para cualquier agente que trabaje en este
> repositorio. Leerlo completo antes de modificar código. Si el código contradice
> una regla de este documento, investigar primero y actualizar ambos: el código y
> este archivo no deben quedar desalineados.

---

## 1. Qué es este proyecto

Aplicación web de gestión de una residencia estudiantil. Permite administrar
alumnos, habitaciones, contratos, pagos, multas y grupos de limpieza.

**Estado actual: prototipo frontend.** No hay backend, base de datos ni
autenticación real. Los datos viven en memoria (mock) y se reinician al recargar
la página. El objetivo es validar flujos, reglas de negocio y UI antes de
conectar una API.

### Stack

| Área | Tecnología |
| --- | --- |
| Framework | React Router v8 (SSR activado) |
| UI | React 19 + Tailwind CSS v4 |
| Lenguaje | TypeScript 5.9 en modo `strict` |
| Build | Vite 8 |
| Iconos | SVG propios (`Components/ui/icons.tsx`) |
| Estado | Context API + `useState` (`lib/store.tsx`) |

### Fuera de alcance por ahora

- Backend, ORM, base de datos o rutas de API propias.
- Autenticación real y protección de rutas (las pantallas de auth existen, pero
  dependen de endpoints `/api/auth/*` que no están implementados).
- Persistencia entre recargas (`localStorage`, cookies, etc.).
- Envío real de correos, pagos o notificaciones.

No agregar dependencias externas sin una razón concreta y aprobación. El
proyecto se mantiene deliberadamente sin librerías de UI, formularios ni fechas.

---

## 2. Comandos

Ejecutar siempre desde `Frontend/`.

```bash
npm install       # instalar dependencias
npm run dev       # servidor de desarrollo (http://localhost:5173)
npm run typecheck # react-router typegen + tsc
npm run build     # build de producción
npm run start     # servir el build
```

Antes de dar una tarea por terminada:

1. `npm run typecheck`
2. `npm run build`
3. Probar manualmente las rutas afectadas (incluido el caso “no encontrado” y los
   filtros/búsquedas).

---

## 3. Estructura del proyecto

```
Frontend/
├─ app/
│  ├─ root.tsx                 # Layout HTML, ErrorBoundary, estilos globales
│  ├─ routes.ts                # Configuración central de rutas
│  ├─ app.css                  # Tailwind + tema (paleta brand)
│  ├─ Components/
│  │  ├─ actions/              # Diálogos de acción (asignar, multa, contrato…)
│  │  ├─ dashboard/            # Widgets del panel
│  │  ├─ layout/               # AppShell (sidebar, topbar, breadcrumbs)
│  │  └─ ui/                   # Sistema de componentes reutilizables
│  ├─ lib/
│  │  ├─ config.ts             # FECHA_REFERENCIA y nombre del sistema
│  │  ├─ types.ts              # Modelo de datos (fuente de verdad)
│  │  ├─ domain.ts             # Reglas y derivaciones de negocio
│  │  ├─ store.tsx             # DataProvider + acciones en memoria
│  │  ├─ mock/data.ts          # Generación determinista de datos mock
│  │  ├─ format.ts             # Formatos de fecha, moneda, porcentaje
│  │  ├─ auth.ts               # Cliente HTTP de auth (sin backend todavía)
│  │  ├─ session.ts            # Usuario logueado mock
│  │  ├─ validation.ts         # Reglas de validación de formularios
│  │  └─ cn.ts                 # Joiner de clases
│  ├─ routes/                  # Páginas (una por ruta)
│  └─ welcome/                 # Assets de la plantilla original
├─ react-router.config.ts      # ssr: true
├─ vite.config.ts              # Tailwind + React Router + tsconfigPaths
└─ tsconfig.json               # Alias `~/*` → `./app/*`
```

### Dónde va cada cosa

- **Entidad o campo nuevo** → `lib/types.ts`, luego `lib/mock/data.ts` y
  `lib/store.tsx` si requiere acciones.
- **Regla derivada** (estados, días, ocupación) → `lib/domain.ts`. No duplicar
  fórmulas en las páginas.
- **Formato de presentación** → `lib/format.ts`.
- **Datos de ejemplo** → `lib/mock/data.ts`. Deben ser deterministas.
- **Componente reutilizable** → `Components/ui/`. Si es específico de una
  entidad, `Components/actions/` o `Components/dashboard/`.
- **Página** → `app/routes/` y registrar la ruta en `app/routes.ts`.

---

## 4. Modelo de datos

Fuente de verdad: `app/lib/types.ts`. Todos los identificadores son `string`.
Todas las fechas son ISO `YYYY-MM-DD` (sin hora ni zona horaria).

### 4.1 Usuario

| Campo | Tipo | Reglas |
| --- | --- | --- |
| `idUsuario` | `string` | PK. Formato `U1`, `U2`… |
| `nombre` | `string` | Nombre visible |
| `correo` | `string` | Único en la práctica |
| `rol` | `"administrador" \| "alumno"` | Define permisos futuros |
| `idAlumno` | `string?` | Obligatorio solo si `rol === "alumno"` |
| `estado` | `EstadoAlumno` | `"activo" \| "inactivo"` |

`session.ts` expone un `usuarioActual` mock con rol administrador. No asumir que
existe una sesión real.

### 4.2 Alumno

| Campo | Tipo | Reglas |
| --- | --- | --- |
| `idAlumno` | `string` | PK. Formato `A01`, `A02`… |
| `nombre` | `string` | — |
| `apellido` | `string` | — |
| `telefono` | `string` | — |
| `correo` | `string` | Validar formato en formularios |
| `documento` | `string` | DNI; se muestra como `DNI {documento}` |
| `estado` | `EstadoAlumno` | `"activo" \| "inactivo"` |

**Borrado lógico:** un alumno nunca se elimina físicamente. Se marca
`estado: "inactivo"` y se conserva todo su historial (contratos, pagos, multas,
asignaciones).

### 4.3 Habitación

| Campo | Tipo | Reglas |
| --- | --- | --- |
| `idHabitacion` | `string` | PK. Inventario inicial `H1`–`H5`; altas con ID interno único |
| `numeroHabitacion` | `string` | Se muestra como `Hab. {número}` |
| `pisoHabitacion` | `number \| null` | `0` = planta baja; residencia de un único piso |
| `capacidadMaxima` | `number` | Entero > 0; cupos totales |
| `descripcion` | `string` | Solo se muestra en ficha/diálogos, **no** en el listado |

El listado de habitaciones **no** debe incluir la columna “Descripción”. El
buscador filtra únicamente por `numeroHabitacion` o `pisoHabitacion`.

### 4.4 Asignación habitación–alumno (`HabitacionAlumno`)

| Campo | Tipo | Reglas |
| --- | --- | --- |
| `idHabitacion` | `string` | FK → `Habitacion` |
| `idAlumno` | `string` | FK → `Alumno` |
| `fechaDesde` | `string` | ISO |
| `fechaHasta` | `string \| null` | ISO; `null` = asignación abierta |

- Es una tabla histórica: cada mudanza conserva el registro anterior.
- `fechaHasta` es un **límite exclusivo**. Una asignación está activa si
  `fechaDesde <= hoy` y (`fechaHasta === null` o `fechaHasta > hoy`).
- Un alumno tiene como máximo **una** asignación activa a la vez.
- Al reasignar, la asignación anterior se cierra con `fechaHasta = hoy`.
- No se debe superar `capacidadMaxima` de la habitación.

### 4.5 Contrato

| Campo | Tipo | Reglas |
| --- | --- | --- |
| `idContrato` | `string` | PK. Formato `C01`, `C02`… |
| `idAlumno` | `string` | FK → `Alumno` |
| `fechaDesde` | `string` | ISO |
| `fechaHasta` | `string` | ISO; debe ser posterior a `fechaDesde` |

- Un alumno puede tener varios contratos a lo largo del tiempo (histórico).
- Puede existir como máximo un contrato vigente por alumno.
- **Invariante del negocio:** todo alumno debe tener contrato. Un alumno sin
  contrato es un estado inválido del modelo (ver deuda en §12).
- El contrato no se elimina: se deja vencer o se reemplaza por uno nuevo.

### 4.6 Pago

| Campo | Tipo | Reglas |
| --- | --- | --- |
| `idPago` | `string` | PK. Formato `P01`, `P02`… |
| `idAlumno` | `string` | FK → `Alumno` |
| `monto` | `number` | ARS; entero positivo |
| `fecha` | `string` | ISO |
| `concepto` | `string` | Ej.: `"Residencia"` |

Los pagos son inmutables en el prototipo: solo se listan y se suman. No hay
acción para registrar un pago nuevo (sí para pagar multas).

### 4.7 Multa

| Campo | Tipo | Reglas |
| --- | --- | --- |
| `idMulta` | `string` | PK. Formato `M01`, `M02`… |
| `idAlumno` | `string` | FK → `Alumno` |
| `monto` | `number` | ARS; entero > 0 |
| `fechaEmision` | `string` | ISO |
| `fechaVence` | `string` | ISO; no anterior a hoy al emitir |
| `estado` | `EstadoMulta` | `"pendiente" \| "pagada" \| "anulada"` |
| `fechaPago` | `string \| null` | Solo si está pagada |

- Una multa `pendiente` con `fechaVence < hoy` se muestra como **vencida**
  (estado visual, no se persiste).
- Pagar una multa → `estado: "pagada"`, `fechaPago = FECHA_REFERENCIA`.
- Anular una multa → `estado: "anulada"`, `fechaPago = null`.
- Una multa pagada o anulada ya no admite acciones.

### 4.8 Limpieza

`GrupoDeLimpieza`: `idGrupoLimpieza` (PK, `G1`…), `nombreDelGrupo`.
`GrupoLimpiezaAlumno`: `idGrupoLimpieza` + `idAlumno` (pertenencia).
`Ambiente`: `idAmbiente` (PK, `AM01`…), `ambiente` (nombre), `tareas` (texto).
`GrupoLimpiezaAmbiente`: `idGrupoLimpieza`, `idAmbiente`, `fechaDesde`,
`fechaHasta` (mismo criterio histórico que las asignaciones de habitación).

La sección de Limpieza todavía no tiene página propia ni acciones en el store.

### 4.9 Estado global (`DataState`)

```ts
interface DataState {
  alumnos: Alumno[];
  habitaciones: Habitacion[];
  asignaciones: HabitacionAlumno[];
  contratos: Contrato[];
  pagos: Pago[];
  multas: Multa[];
  grupos: GrupoDeLimpieza[];
  grupoAlumnos: GrupoLimpiezaAlumno[];
  ambientes: Ambiente[];
  grupoAmbientes: GrupoLimpiezaAmbiente[];
  usuarios: Usuario[];
}
```

### 4.10 Relaciones

- `Alumno` 1 → N `Contrato`, `Pago`, `Multa`, `HabitacionAlumno`,
  `GrupoLimpiezaAlumno`.
- `Habitacion` 1 → N `HabitacionAlumno`.
- `GrupoDeLimpieza` 1 → N `GrupoLimpiezaAlumno` y `GrupoLimpiezaAmbiente`.
- `Ambiente` 1 → N `GrupoLimpiezaAmbiente`.
- `Usuario` 0..1 → 1 `Alumno` (solo rol alumno).

No hay claves foráneas reales: la integridad se mantiene en el store y en las
validaciones de UI. Al crear acciones nuevas, verificar que las referencias
existan antes de escribir.

---

## 5. Reglas de negocio

Todas las reglas de fechas y estados se calculan contra `FECHA_REFERENCIA`
(`app/lib/config.ts`, actualmente `"2026-10-20"`). **Nunca** usar `new Date()` ni
`Date.now()` para mostrar estados, días restantes o vencimientos.

### 5.1 Fechas

- Formato interno y de comparación: ISO `YYYY-MM-DD`. La comparación
  lexicográfica es equivalente a la cronológica.
- `diasHasta(fecha)` devuelve la diferencia en días contra `FECHA_REFERENCIA`
  (negativo si ya pasó).
- `fechaHasta` de asignaciones es exclusivo; `fechaHasta` de contratos se
  considera vigente durante todo ese día.

### 5.2 Estado del contrato (`estadoContrato`)

| Condición | Estado |
| --- | --- |
| `fechaDesde > hoy` | `programado` |
| `fechaHasta < hoy` | `finalizado` |
| `fechaHasta` a 30 días o menos | `por-vencer` |
| Resto | `vigente` |

- “Por vencer” = `diasHasta(fechaHasta) <= 30`.
- `contratoVigente()` busca un contrato con `fechaDesde <= hoy <= fechaHasta`.
- El día `fechaHasta` el contrato sigue vigente; pasa a `finalizado` al día
  siguiente.
- El listado de contratos se ordena por vencimiento ascendente (los más urgentes
  primero) y desempata por `idContrato`.

### 5.3 Estado del alumno

- `activo`: puede tener contrato, habitación, pagos y multas.
- `inactivo`: borrado lógico. Conserva historial, pero no debería recibir nuevas
  asignaciones ni contratos.
- Un alumno activo puede estar **sin habitación** (es un estado válido y
  filtrable), pero **no** debe estar sin contrato.

### 5.4 Ocupación

- Se calcula solo con asignaciones activas (`asignacionesActivas`).
- `camasOcupadas = asignaciones activas`.
- `capacidadTotal = suma de capacidadMaxima`.
- Una habitación está `llena` si `ocupadas >= capacidadMaxima`, `vacía` si
  `ocupadas === 0`, y `disponible` en el resto.
- El porcentaje de ocupación es `camasOcupadas / capacidadTotal * 100`.

### 5.5 Multas

- `estadoMultaVisual`: `pagada` → `pagada`; `anulada` → `anulada`;
  `pendiente` con `fechaVence < hoy` → `vencida`; resto → `pendiente`.
- Una multa que vence hoy todavía está pendiente (el vencimiento es al día
  siguiente).
- Al emitir: monto > 0 y `fechaVence >= FECHA_REFERENCIA`.
- El monto se normaliza a entero no negativo (`Math.round`, `Math.max(0, …)`).

### 5.6 Habitaciones

- La asignación se cierra (no se borra) al liberar o reasignar.
- Liberar una habitación cierra la asignación activa con fecha de hoy.
- Una habitación llena no permite nuevas asignaciones; la UI debe deshabilitar la
  acción y el store/validación debe rechazarla.
- No mostrar `descripcion` en la tabla del listado.

### 5.7 Contratos

- `fechaHasta > fechaDesde` (validado en el diálogo).
- No crear contratos superpuestos para el mismo alumno.
- No crear contratos para alumnos inactivos.
- Al crear un alumno debe crearse también su contrato (ver §12).

### 5.8 Limpieza (regla prevista)

- Cada alumno pertenece a un grupo.
- Cada grupo tiene ambientes asignados con vigencia (`fechaDesde`/`fechaHasta`).
- Las tareas se describen en `Ambiente.tareas`.
- La UI de esta sección aún no está implementada; respetar el modelo al hacerla.

---

## 6. Store y estado

`app/lib/store.tsx` expone `DataProvider` y `useData()`. El layout
`routes/app-shell.tsx` envuelve la aplicación con `DataProvider` y
`ToastProvider`.

### Reglas del store

- El estado es **en memoria** y se reinicia al recargar. No agregar persistencia
  sin decisión explícita.
- Todas las mutaciones usan `setState` funcional y crean objetos/arrays nuevos
  (inmutabilidad). No mutar el estado directamente.
- Los IDs nuevos se generan con `nuevoId(prefijo)` (secuencia global desde 1000).
  Prefijos actuales: `A` alumno, `C` contrato, `M` multa.
- Cada acción nueva debe:
  1. agregarse a `DataContextValue` con su tipo de entrada,
  2. implementarse en el `useMemo` del provider,
  3. devolver el ID cuando la página necesite navegar al detalle,
  4. validar referencias y reglas de negocio (no confiar solo en la UI).
- Los mapas derivados (`alumnoPorId`, `habitacionPorId`, `grupoPorId`,
  `ambientePorId`) se recalculan con `useMemo`; usarlos en las páginas en lugar
  de recorrer arrays repetidamente.
- `registrarPagoMulta` y `anularMulta` usan `FECHA_REFERENCIA` como fecha de pago.
- `asignarHabitacion` cierra la asignación vigente del alumno y agrega una nueva
  con `fechaDesde = FECHA_REFERENCIA` y `fechaHasta = null`.

### Acciones disponibles

| Acción | Efecto |
| --- | --- |
| `registrarPagoMulta(idMulta)` | Marca la multa como pagada |
| `anularMulta(idMulta)` | Marca la multa como anulada |
| `emitirMulta(input)` | Crea una multa pendiente |
| `asignarHabitacion(idAlumno, idHabitacion)` | Cierra la anterior y crea la nueva |
| `liberarHabitacion(idAlumno)` | Cierra la asignación activa |
| `crearAlumno(input)` | Crea alumno activo y devuelve `idAlumno` |
| `crearContrato(input)` | Agrega un contrato |

No existen todavía acciones para editar/inactivar alumnos, editar/eliminar
contratos, registrar pagos ni gestionar limpieza.

---

## 7. Rutas y páginas

Configuración central: `app/routes.ts`.

| Ruta | Archivo | Estado |
| --- | --- | --- |
| `/` | `routes/dashboard.tsx` | Implementado |
| `/alumnos` | `routes/alumnos.tsx` | Implementado |
| `/alumnos/nuevo` | `routes/alumnos.nuevo.tsx` | Implementado |
| `/alumnos/:idAlumno` | `routes/alumnos.$idAlumno.tsx` | Implementado |
| `/habitaciones` | `routes/habitaciones.tsx` | Implementado |
| `/habitaciones/:idHabitacion` | `routes/habitaciones.$idHabitacion.tsx` | Implementado |
| `/contratos` | `routes/contratos.tsx` | Implementado |
| `/contratos/:idContrato` | `routes/contratos.$idContrato.tsx` | Implementado |
| `/multas` | fallback `proximamente.tsx` | Pendiente |
| `/limpieza` | fallback `proximamente.tsx` | Pendiente |
| `/configuracion` | fallback `proximamente.tsx` | Pendiente |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | `routes/*.tsx` | UI lista; backend pendiente |
| `*` | `routes/proximamente.tsx` | Fallback |

- Las rutas de auth están fuera del `AppShell`. No hay guard de sesión: entrar
  directo a `/` muestra el panel con el usuario mock.
- Para una sección nueva, crear el archivo de ruta **y** registrarlo en
  `routes.ts`; si no, cae en `proximamente`.

### Patrón de página

1. `export function meta()` con `[{ title: "Sección · Gestión de Residencia" }]`.
2. `export default function Pagina()`.
3. `PageHeader` con `eyebrow`, `title`, `description` y `actions` opcionales.
4. Contenido en `div className="flex flex-col gap-6"`.
5. En listados:
   - estado local para búsqueda y filtros,
   - `useMemo` para filas derivadas, filtrado y orden,
   - descripción con conteos (“X registrados · Y mostrados”),
   - `EmptyState` cuando no hay resultados,
   - `TableWrap` + `Table` con `colSpan` correcto.
6. En fichas de detalle:
   - resolver la entidad por `useParams`,
   - si no existe, `PageHeader` + `EmptyState` + enlace de vuelta (nunca romper),
   - mostrar badges de estado y enlaces cruzados,
   - acciones con diálogos, no con `window.confirm`.

---

## 8. Convenciones de código

- **Idioma:** UI, mensajes, nombres de funciones de negocio y comentarios en
  español. Nombres de tipos/entidades del modelo también en español
  (`Alumno`, `Habitacion`, `idAlumno`).
- **TypeScript estricto.** No usar `any` si se puede evitar. Preferir uniones de
  strings a `enum`.
- **Imports de tipos:** `import type { … }` (el proyecto usa
  `verbatimModuleSyntax`).
- **Rutas internas:** `react-router` (`Link`, `useNavigate`, `useParams`). No
  usar `<a href>` para navegación interna.
- **Exports:** componentes con export nombrado; páginas con `export default`.
- **Estilo:** 2 espacios, comillas dobles, punto y coma, trailing commas.
- **Nombres:** componentes en PascalCase; archivos de rutas en minúsculas con
  puntos (`alumnos.$idAlumno.tsx`); helpers en camelCase.
- **Clases CSS:** Tailwind v4 con la paleta `brand-*`. Respetar los pares
  `dark:` existentes. Para condicionales usar `cn()`.
- **Sin dependencias nuevas** salvo justificación explícita.
- **Sin `Intl`** para fechas/números (ver §10).

### Alias de imports

`tsconfig.json` define `~/*` → `./app/*`, pero el código existente usa imports
relativos. Mantener el estilo relativo para no mezclar convenciones.

---

## 9. Componentes UI

Catálogo en `app/Components/ui/`. Antes de crear un componente nuevo, revisar si
ya existe uno equivalente.

| Componente | Uso / API importante |
| --- | --- |
| `Button` | `variant`: `solid`, `outline`, `ghost`, `danger`; `size`: `sm`, `md`, `lg`; `isLoading`. **No soporta `asChild`.** Para navegar, envolver con `<Link>`: `<Link to="…"><Button>…</Button></Link>`. |
| `Badge` | `variant`: `neutral`, `brand`, `success`, `warning`, `danger`, `info`. |
| `StatusBadge` | Recibe **`estado`** (no `variant` ni `label`). Valores: `pagada`, `pendiente`, `vencida`, `anulada`, `vigente`, `por-vencer`, `finalizado`, `programado`, `activo`, `inactivo`, `disponible`, `vacia`, `llena`. |
| `Icon` | `name` debe pertenecer a `IconName`. Valores válidos: `dashboard`, `users`, `rooms`, `contracts`, `payments`, `fines`, `cleaning`, `settings`, `search`, `bell`, `menu`, `panel`, `close`, `chevron`, `logout`, `plus`, `check`, `arrow`, `calendar`, `alert`, `user`, `money`, `filter`, `building`. No inventar nombres. |
| `Input` / `InputField` | `Input` es el wrapper relativo; `InputField` el `<input>`. `isInvalid` marca error. |
| `SearchField` | Campo de búsqueda controlado (`value`, `onChange`). Los listados actuales usan `InputField` + `Icon`, pero se puede migrar. |
| `TextField` | `id`, `label`, `error`, `hint`, `required`; el resto pasa al `<input>`. |
| `SelectField` | Igual que `TextField`, para `<select>`; requiere `children` con `<option>`. |
| `Checkbox` | `id`, `label`, `error`. |
| `PasswordField` | `id`, `label`, `value`, `error`, `showRequirements`. |
| `Dialog` | `open`, `onClose`, `title`, `description`, `size` (`sm`, `md`, `lg`). Maneja Escape, foco y portal. |
| `ConfirmDialog` | `open`, `onClose`, `onConfirm`, `title`, `description`, `confirmLabel`, `tone` (`danger` o `brand`). |
| `Toast` / `useToast` | `toast({ title, description?, variant? })`; requiere `ToastProvider`. |
| `PageHeader` | `eyebrow`, `title`, `description`, `actions`. |
| `EmptyState` | `icon`, `title`, `description`, `action`. Usar en listados vacíos y entidades inexistentes. |
| `StatCard` | `label`, `value`, `hint`, `icon`, `tone`, `progress`. |
| `Tabs` | Controlado: `items`, `value`, `onChange`, `label`. |
| `Table` + `TableWrap`, `THead`, `TBody`, `TR`, `TH`, `TD` | `TableWrap` da scroll horizontal. `TD colSpan` debe coincidir con la cantidad de columnas visibles. |
| `Progress` | `value` 0–100, `tone`. |
| `Avatar` | `nombre`, `apellido`, `size`. |
| `Skeleton`, `SkeletonText` | Estados de carga (aún no usados en páginas). |
| `FormErrorSummary` | Resumen de errores con foco automático. |

### Reglas de accesibilidad

- Todo input/select debe tener `label` o `aria-label`.
- Los errores usan `role="alert"` (ya incluido en los componentes).
- Los botones solo-icono necesitan `aria-label` o texto visible.
- Mantener el foco y el cierre con Escape en diálogos (ya resuelto por `Dialog`).
- Usar `TH` en encabezados de tabla y `colSpan` correcto.
- No duplicar `id` en formularios: usar `useId()` como en los diálogos.

---

## 10. Formato, fechas y SSR

`react-router.config.ts` tiene `ssr: true`. El HTML del servidor y del cliente
debe coincidir para evitar errores de hidratación.

- Usar `FECHA_REFERENCIA` para toda derivación temporal.
- No usar `new Date()` para mostrar datos ni `Math.random()` para generar mock.
- Usar los helpers de `lib/format.ts`:
  - `formatFecha(iso)` → `dd/mm/yyyy` (o `—` si es nulo),
  - `formatARS(valor)` → `$ 45.000`,
  - `formatNumero(valor)` → `45.000`,
  - `formatPorcentaje(valor)` → `45%`,
  - `iniciales(nombre, apellido)`,
  - `normalizar(texto)` para búsquedas sin acentos.
- **No usar `Intl`** (formatos distintos entre servidor y cliente).
- Evitar acceder a `window`, `document` o `localStorage` durante el render;
  hacerlo dentro de `useEffect`.
- Los datos mock son deterministas a propósito; no introducir aleatoriedad.

### Búsquedas

- Normalizar con `trim().toLowerCase()` (y `normalizar()` si se busca con
  acentos).
- Buscar por los campos indicados en cada pantalla; no ampliar sin necesidad.
- Los filtros y la búsqueda se combinan (AND).

---

## 11. Datos mock

`app/lib/mock/data.ts` genera siempre el mismo estado inicial:

- **5 habitaciones** (`H1`–`H5`), numeradas del 1 al 5 en planta baja (`pisoHabitacion: 0`).
- Capacidades: **2, 2, 4, 4 y 5 personas**, respectivamente; **17 plazas** totales.
- **14 alumnos ficticios** (`A01`–`A14`) con ficha personal, domicilio, carrera y dos contactos de emergencia. Los correos usan `example.com`.
- **14 asignaciones vigentes** distribuidas 2, 2, 3, 4 y 3 por habitación: 14 plazas ocupadas y 3 libres; dos asignaciones históricas cerradas.
- **16 contratos**: uno vigente por alumno (tres por vencer), más dos históricos para probar renovación y reingreso sin superposiciones.
- **28 pagos** (septiembre y octubre de 2026) y **3 multas** (vencida, pendiente y pagada).
- Un grupo de limpieza y un ambiente por habitación; cada residente pertenece al grupo de su habitación.
- Un administrador de prueba de `session.ts` y un usuario por alumno. Todos los datos personales y movimientos son de ejemplo.
- El alta de habitaciones sugiere el número siguiente y fija la ubicación en planta baja.

Reglas para modificar el mock:

- Mantener los datos coherentes con las reglas de §5 (fechas, capacidades,
  estados).
- No romper los IDs ni los conteos que usan las páginas.
- Si se agrega una entidad, actualizarla también en `types.ts`, `DataState` y
  los mapas del store si corresponde.
- Recordar que los cambios en memoria se pierden al recargar.

---

## 12. Deuda conocida y próximos pasos

Estos puntos son inconsistencias reales del prototipo. No tratarlos como
comportamiento deseado; corregirlos al tocar las áreas involucradas.

1. **Alta de alumno sin contrato.** `crearAlumno` no crea contrato, aunque la
   regla dice que ningún alumno puede quedar sin contrato. El flujo de
   `/alumnos/nuevo` debería crear ambos o redirigir a la creación de contrato.
2. **Sin acciones de edición/baja.** No hay UI para editar alumno, marcarlo
   inactivo, editar/eliminar contratos ni registrar pagos.
3. **Detección de habitación en el listado de alumnos.** `alumnos.tsx` usa
   `asignacion.fechaHasta !== null` para descartar asignaciones; lo correcto es
   usar `asignacionActiva` (las fechas mandan).
4. **Filtro “vence en menos de 30 días”.** Usa `dias >= 0 && dias < 30`, mientras
   que `estadoContrato` considera “por vencer” con `<= 30`. Unificar el criterio.
5. **Diálogos incluyen alumnos inactivos.** `AsignarHabitacionDialog`,
   `NuevoContratoDialog` y `EmitirMultaDialog` listan todos los alumnos. Deberían
   filtrar según la regla (al menos no asignar habitación ni contrato a
   inactivos).
6. **Contratos superpuestos.** `NuevoContratoDialog` solo valida el orden de las
   fechas; falta validar que no se superponga con otro contrato del alumno.
7. **Capacidad validada solo en UI.** El store no rechaza asignaciones que
   excedan `capacidadMaxima`; la validación debería vivir también en la acción.
8. **Multas y limpieza sin ruta.** El menú enlaza a `/multas` y `/limpieza`, pero
   no hay páginas registradas: caen en `proximamente.tsx`.
9. **Auth sin backend.** `lib/auth.ts` apunta a `/api/auth/*`; no hay servidor.
   Las rutas del panel no están protegidas.
10. **Sin persistencia.** Recargar reinicia todos los cambios. Es esperado en el
    prototipo, pero no confundirlo con un bug.
11. **`Habitacion.descripcion`** sigue en el modelo aunque no se muestra en el
    listado; se usa en ficha y diálogo de asignación.
12. **`estadoContrato` y `contratoVigente`** usan criterios de borde distintos
    solo en apariencia: el contrato sigue vigente el día `fechaHasta` y pasa a
    finalizado al día siguiente. Documentar cualquier cambio de este criterio.

---

## 13. Checklist para implementar una sección

1. Leer `types.ts`, `domain.ts` y este documento.
2. Definir/ajustar tipos y reglas derivadas en `lib/domain.ts`.
3. Actualizar `DataState`, el mock y el store si hay datos/acciones nuevas.
4. Crear la página en `routes/` y registrarla en `routes.ts`.
5. Usar `PageHeader`, `TableWrap`/`Table`, `EmptyState`, `Badge`/`StatusBadge`
   y los helpers de formato existentes.
6. Mantener el español, los acentos y el tono de los textos (“Verificá…”,
   “Volvé…”).
7. Probar:
   - listado con datos y sin resultados,
   - búsqueda y cada filtro,
   - ficha con ID válido e inválido,
   - acciones (crear/asignar/pagar/anular) y sus toasts,
   - navegación cruzada entre alumnos, habitaciones y contratos.
8. Ejecutar `npm run typecheck` y `npm run build`.
9. Si se cambió una regla, actualizar este `AGENTS.md`.

## 14. No hacer

- No borrar físicamente alumnos, contratos, asignaciones, pagos ni multas.
- No usar `new Date()`/`Date.now()` para estados ni vencimientos.
- No reemplazar `FECHA_REFERENCIA` por la fecha real sin migrar todo el dominio.
- No duplicar lógica de `domain.ts` en las páginas.
- No usar `Intl`, `Math.random()` ni datos no deterministas.
- No agregar `localStorage`, cookies o llamadas a APIs inexistentes como si
  funcionaran.
- No asumir autenticación real ni roles aplicados.
- No romper el SSR accediendo a APIs del navegador durante el render.
- No introducir librerías de UI, formularios o fechas sin aprobación.
- No usar `asChild` en `Button` ni props inexistentes en `StatusBadge`/`Icon`.
- No mostrar la descripción en el listado de habitaciones.
- No eliminar columnas o cambiar `colSpan` sin ajustar el encabezado y el estado
  vacío.
