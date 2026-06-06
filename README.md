# Club Cannábico App

Plataforma web para clubs cannábicos: landing pública + postulación de socios + panel de socios + panel de administración. Agenda de retiros con reserva de stock, gestión de genéticas, acopio, postulaciones y administradores con permisos granulares.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Prisma 7** + **PostgreSQL**
- **Auth.js v5** (credentials, email + contraseña, TOTP opcional para admins)
- **Tailwind CSS v4**
- **Zod** — validación en todas las server actions

## Requisitos

- Node.js ≥ 20
- PostgreSQL ≥ 14

## Setup inicial

### 1. Base de datos

```bash
sudo -u postgres psql
```

```sql
CREATE USER clubcannabico WITH PASSWORD 'tu-password-seguro';
CREATE DATABASE clubcannabico OWNER clubcannabico;
ALTER USER clubcannabico CREATEDB;
\q
```

### 2. Variables de entorno

```bash
cp .env.example .env
```

Editá `.env`:

```
DATABASE_URL="postgresql://clubcannabico:tu-password-seguro@localhost:5432/clubcannabico?schema=public"
AUTH_SECRET="$(openssl rand -base64 32)"
AUTH_TRUST_HOST="true"
NEXT_PUBLIC_APP_NAME="Club Cannábico App"
```

### 3. Instalar, migrar y seed

```bash
npm install
npm run setup
```

El seed crea los administradores definidos en `prisma/seed.ts` y carga 3 genéticas de muestra si la tabla está vacía. Editá `seed.ts` con los admins reales antes de correrlo en una instancia nueva.

### 4. Desarrollo

```bash
npm run dev
```

→ http://localhost:3000

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Dev server con hot reload |
| `npm run build` | `prisma generate && prisma migrate deploy && next build` |
| `npm run start` | Servidor de producción |
| `npm run db:migrate` | Aplicar migraciones |
| `npm run db:seed` | Cargar datos iniciales |
| `npm run db:reset` | Resetear DB (borra todo) |
| `npm run setup` | Migrar + seed |

## Rutas

| Ruta | Acceso | Descripción |
|---|---|---|
| `/` | Público | Landing |
| `/postulacion` | Público | Postulación de nuevo socio |
| `/login` | Público | Ingreso |
| `/cambiar-password` | Autenticado | Cambio forzado en primer login |
| `/socio` | Socio | Panel del socio |
| `/socio/retiros` | Socio | Mis retiros |
| `/socio/retiros/nuevo` | Socio | Agendar retiro |
| `/socio/perfil` | Socio | Datos personales |
| `/administrador` | Admin | Dashboard con métricas |
| `/administrador/retiros` | Admin | Aprobar / rechazar / completar + nuevo retiro |
| `/administrador/socios` | Admin | Listado, edición, activar/desactivar |
| `/administrador/socios/[id]` | Admin | Detalle + historial de logins + audit log |
| `/administrador/geneticas` | Admin | Gestión de genéticas |
| `/administrador/acopio` | Admin | Containers + movimientos de stock |
| `/administrador/postulaciones` | Admin | Aprobar / rechazar postulaciones |
| `/administrador/administradores` | Admin | Gestión de admins y permisos |
| `/administrador/seguridad` | Admin | TOTP (2FA) personal |

Auth.js redirige según rol tras login: admin → `/administrador`, socio → `/socio`.

## Modelo de permisos

Los admins tienen permisos granulares en `User.permissions` (`string[]`):

- `retiros:manage`
- `socios:manage`
- `geneticas:manage`
- `containers:manage`
- `postulaciones:manage`
- `admins:manage`

El helper `can(session, permiso)` en [src/lib/permissions.ts](src/lib/permissions.ts) gobierna todas las rutas y acciones admin.

## Deploy en producción

1. Crear Postgres y usuario (ver paso 1).
2. En el servidor: clonar, `cp .env.example .env`, editar con `AUTH_SECRET` nuevo y `DATABASE_URL` productiva.
3. Ejecutar:
   ```bash
   npm ci
   npm run build
   npm run start
   ```
4. Proxyar el puerto 3000 con nginx o Caddy + HTTPS.
5. Cambiar la contraseña del admin en el primer login.

Backup recomendado: `pg_dump` diario vía cron. No hay automatización incluida.

## Personalizar por club (estado actual)

Hoy la personalización requiere tocar código:

- `NEXT_PUBLIC_APP_NAME` en `.env` — nombre en títulos y metadatos
- [src/components/logo.tsx](src/components/logo.tsx) — logo del navbar
- [src/app/globals.css](src/app/globals.css) — variables de color (`--primary`, `--accent-*`)
- `prisma/seed.ts` — admins iniciales, genéticas de muestra

Horarios de retiro, cupos mensuales y capacidad por franja están hardcodeados en las server actions correspondientes. Un panel `/administrador/configuracion` para manejarlos desde UI está pendiente.

## Estructura

```
src/
├── app/
│   ├── (public)/           # Landing + postulación
│   ├── (auth)/             # Login
│   ├── cambiar-password/   # Cambio forzado
│   ├── (dashboard)/socio/  # Panel del socio
│   ├── (admin)/administrador/  # Panel admin
│   └── api/auth/           # Auth.js
├── components/
├── lib/
│   ├── auth.ts             # Auth.js (server)
│   ├── auth.config.ts      # Edge-safe (middleware)
│   ├── db.ts               # Prisma client
│   ├── permissions.ts      # Helper can()
│   ├── reservations.ts     # Reserva de stock en transacción
│   ├── totp.ts             # 2FA
│   └── validators.ts       # Schemas Zod
├── generated/prisma/       # Cliente Prisma generado
└── middleware.ts           # Protección de rutas
prisma/
├── schema.prisma
├── seed.ts
└── migrations/
```

## Seguridad

- Passwords bcrypt (10 rounds)
- JWT firmado con `AUTH_SECRET`
- Lockout por intentos fallidos con ventana temporal
- TOTP opcional por admin (otpauth)
- Middleware protege `/socio/*` y `/administrador/*`
- Row-level ownership check en acciones de socio
- Zod en todas las server actions
- Audit log de login y acciones sensibles (tabla `AuditLog`)

Generar `AUTH_SECRET` único por instancia.
