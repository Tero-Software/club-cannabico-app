# MAPA — clubapp

Mapa del código actual de `/home/zonca/Programacion/clubapp` (copia sin git de `elgordito.club`). Estado al 2026-05-25. Es referencia para delegar trabajo y para identificar dónde rompe el supuesto single-tenant antes de migrar a SaaS multitenant.

---

## 0. Snapshot técnico

- Stack: Next.js 16.2.3 (App Router, Turbopack) + React 19.2 + TypeScript 5 + Tailwind v4.
- DB: PostgreSQL vía Prisma 7 con `@prisma/adapter-pg` (driver adapter). Cliente generado en `src/generated/prisma`.
- Auth: NextAuth v5 beta (Auth.js) con `Credentials` provider + JWT.
- Otros: Resend (mail), Vercel Blob (uploads), otpauth (TOTP), recharts (charts), zod (validación), bcryptjs.
- Build: `prisma generate && prisma migrate deploy && next build`. Asume DB única en `DATABASE_URL`.

---

## 1. Rutas (`src/app/`)

### Público — `(public)/`
- `/` — landing institucional con JSON-LD `Organization`.
- `/postulacion` — formulario público, server action `crearPostulacionAction` → tabla `Application`.
- `/marco-legal`, `/como-asociarse`, `/contacto` — estáticas. `/contacto` postea a `/api/contact`.

### Auth — `(auth)/`
- `/login` — form de login con `loginAction` que llama `signIn("credentials")`. Soporta TOTP en segundo paso.
- Layout dedicado: solo header con logo.

### Cambio forzado de contraseña
- `/cambiar-password` — fuera de los grupos. Acción `cambiarPasswordAction`. Bloquea hasta que `mustChangePassword=false`.

### Socio — `(dashboard)/socio/`
- `/socio` — home del socio.
- `/socio/retiros` — listado propio + `cancelarRetiroAction`.
- `/socio/retiros/nuevo` — agenda de retiro, `crearRetiroAction`.
- `/socio/perfil` — edita nombre y teléfono, `updatePerfilAction`.
- `/socio/geneticas/[code]` — vista pública de genética por código.

### Admin — `(admin)/administrador/`
- `/administrador` — dashboard con métricas + alertas.
- `/administrador/retiros` — listado + cambios de estado (`updateWithdrawalStatusAction`) + alta manual (`crearRetiroAdminAction`).
- `/administrador/socios` — listado, alta (`createSocioAction`), edición (`editSocioAction`), toggle activo (`toggleSocioActivoAction`), invitación de visitante demo (`createVisitorInviteAction`).
- `/administrador/socios/[id]` — detalle, audit log y login attempts del socio.
- `/administrador/geneticas` — CRUD de `Strain` con upload de fotos a Vercel Blob.
- `/administrador/acopio` — CRUD de `Container` + `ContainerItem` + `Movement` (IN/OUT manual).
- `/administrador/postulaciones` — aprobar (crea User con password temporal), rechazar, eliminar.
- `/administrador/administradores` — promote/demote, edición de permisos, otorgar `isOwner` (solo owner).
- `/administrador/seguridad` — enrolamiento y desactivación TOTP del admin actual.
- `/administrador/configuracion` — edita el row `ClubConfig` único (días hábiles, horarios, cupos, multiplos).
- `/administrador/estadisticas` — gráficos recharts con métricas agregadas.

### Visitante (demo)
- `/visita/[token]` — canjea `VisitorInvite` → crea User `VISITANTE` con email random `visitante+xxx@elgordito.club` y `expiresAt = now + 1h`, hace `signIn` automático. Limpieza retroactiva de visitantes de más de 30 días.
- `/visita/error` — pantalla de error con `?reason=not_found|used|expired`.

### API routes — `src/app/api/`
- `auth/[...nextauth]/route.ts` — re-exporta handlers de NextAuth.
- `blob/upload` — POST, requiere `geneticas:manage`, valida tipo y tamaño (8 MB), guarda en `geneticas/<safeName>`.
- `blob/delete` — POST, requiere `geneticas:manage`, solo permite hosts `*.public.blob.vercel-storage.com`.
- `contact` — POST público con rate limit in-memory (5/h por IP) → Resend.

### Metadata
- `app/layout.tsx`, `app/manifest.ts`, `app/sitemap.ts`, `app/robots.ts` — todos leen `NEXT_PUBLIC_CLUB_NAME` y `NEXT_PUBLIC_SITE_URL` con fallback hardcoded a "El Gordito Club" / `https://elgordito.club`.

---

## 2. Modelo de datos (`prisma/schema.prisma`)

### Entidades

| Modelo | Mapeo SQL | Rol |
|---|---|---|
| `User` | `User` | Socios, admins y visitantes. Campos: `role` (enum `ADMIN`/`MEMBER`/`VISITANTE`), `permissions String[]`, `isOwner`, `mustChangePassword`, `totpSecret`/`totpEnabled`, `failedLoginCount`, `lockedUntil`, `expiresAt` (TTL de visitantes). |
| `VisitorInvite` | `InvitacionVisitante` | Token de invitación demo, expira a 24h. |
| `LoginAttempt` | `LoginAttempt` | Historial de login para rate limit por IP y lockout. |
| `AuditLog` | `AuditLog` | Eventos sensibles. `actorEmail` redundante por si el user se borra. |
| `Strain` | `Genetica` | Variedades. Tiene `code` único opcional para URLs públicas. |
| `Withdrawal` | `Retiro` | Retiro de un socio con fecha + horario + estado. |
| `WithdrawalItem` | `RetiroItem` | Línea de retiro: cantidad por genética. |
| `Reservation` | `Reservation` | Reserva temporal de gramos sobre un `ContainerItem` mientras el retiro está PENDING/APPROVED. |
| `Container` | `Container` | Lote de acopio numerado, activable. |
| `ContainerItem` | `ContainerItem` | Subdivisión por planta/genética. `currentWeight` se descuenta al consumir. |
| `Movement` | `Movement` | IN/OUT manual o derivado de retiro completado. |
| `ClubConfig` | `ClubConfig` | **Singleton (`id="singleton"`)**. Días hábiles, horarios, cupo mensual, mínimos, paso de gramos. |
| `Application` | `Postulacion` | Postulación pública. |

### Enums
`Role`, `WithdrawalStatus` (`PENDING/APPROVED/REJECTED/COMPLETED/CANCELLED`), `ApplicationStatus` (`PENDING/APPROVED/REJECTED`), `MovementType` (`IN/OUT`).

### Relaciones clave
- `User 1—N Withdrawal`, `Withdrawal 1—N WithdrawalItem`, `WithdrawalItem N—1 Strain`.
- `WithdrawalItem 1—N Reservation N—1 ContainerItem`.
- `Container 1—N ContainerItem 1—N Movement`.
- `Movement N—1 WithdrawalItem?` (cuando es OUT por retiro entregado).

---

## 3. Flujos críticos

### 3.1 Auth (`src/lib/auth.ts` + `auth.config.ts` + `middleware.ts`)
1. Login POST → `loginAction` valida zod → `signIn("credentials")` → `authorize`.
2. `authorize`: rate limit IP (`ipRateLimited`), lookup user, check `active` y `expiresAt`, lockout, bcrypt, TOTP si está habilitado. Si es ADMIN sin TOTP, deja entrar pero loguea `auth.login.totp_enrollment_required`.
3. JWT: `jwt` callback en `auth.config.ts` injecta `id/role/permissions/mustChangePassword/totpEnabled/expiresAt`. Para `VISITANTE` fuerza `exp = now + 1h`.
4. `session` callback en `auth.ts` re-lee `permissions` de DB en cada request para que cambios apliquen sin re-login.
5. Middleware (`src/middleware.ts`): redirige según rol, expira visitantes vencidos.

### 3.2 Postulación → alta de socio
1. Público envía `/postulacion` → `Application(status=PENDING)`.
2. Admin entra a `/administrador/postulaciones` → `aprobarPostulacionAction`:
   - chequea duplicado por email y `socioCount >= 45` (límite legal IRCCA hardcoded);
   - genera password temporal (base64url 12 chars);
   - crea `User(role=MEMBER, mustChangePassword=true)` + marca `Application(APPROVED)` en una transacción;
   - devuelve el password al admin (no se manda mail; lo comunica manualmente).
3. Primer login del socio cae en `/cambiar-password` por `mustChangePassword`.

### 3.3 Retiro (reserva de stock)
1. Socio agenda en `/socio/retiros/nuevo` con zod `retiroSchema`.
2. `crearRetiroAction` valida: fecha futura, día hábil, horario válido, sin variedades repetidas, tope mensual no superado (`maxGramosMes` de `ClubConfig`).
3. Crea `Withdrawal(status=PENDING)` con sus `WithdrawalItem`. **No reserva todavía.**
4. Admin cambia estado en `/administrador/retiros`:
   - `→ APPROVED`: `reserveForWithdrawal(tx, id)` en `lib/reservations.ts`. Reparte cada item entre `ContainerItem` activos con stock libre (current − reservas), de menor a mayor. Si no alcanza tira `InsufficientStockError`.
   - `→ COMPLETED`: si venía de otro estado reserva primero, después `consumeReservationsForWithdrawal` que crea `Movement(OUT)` y decrementa `currentWeight`, borra reservas.
   - `→ REJECTED/CANCELLED` desde PENDING/APPROVED: `releaseReservationsForWithdrawal` borra reservas.
5. Alta de retiro por admin (`crearRetiroAdminAction`) lo crea ya en `APPROVED` con reservas.
6. Cancelación del socio (`cancelarRetiroAction`) libera y pasa a `CANCELLED`.
7. Bloqueo especial: si el `Withdrawal` es de un user `VISITANTE`, los admins no pueden cambiar estado (es demo).

### 3.4 Configuración del club
- `src/lib/config.ts` expone `getClubConfig` con `unstable_cache` (tag `club-config`).
- Lee siempre el row `id="singleton"`, lo crea con defaults si no existe (upsert).
- `updateClubConfigAction` (admin) escribe el singleton e invalida con `revalidateTag`.

### 3.5 Visitante demo
- Admin con `socios:manage` crea `VisitorInvite` en `/administrador/socios` → link `proto://host/visita/<token>` (host derivado de headers).
- Canje crea User efímero, `signIn` automático, sesión JWT con `exp=now+1h`, además `expiresAt` en DB.
- Cualquier modificación o cancelación de retiro queda marcada con `metadata.isDemo=true`.
- Cron implícito: cada invitación nueva borra `User(role=VISITANTE, createdAt < now-30d)`. No hay job aparte.

### 3.6 Auditoría
- Toda action sensible llama `audit({...})` (`src/lib/audit.ts`).
- `audit` lee IP (`x-forwarded-for` o `x-real-ip`) y `user-agent` y los persiste. Captura excepciones para no romper el flujo.

### 3.7 Seguridad anti-fuerza-bruta
- `LOCKOUT_THRESHOLD=5` fallos → `lockedUntil=now+15m`, contador a cero.
- `LOGIN_IP_MAX=20` fallos por IP en ventana de 15m bloquean el login.
- TOTP: `otpauth`. Issuer hardcoded `"El Gordito Club"`.

---

## 4. Capas y helpers

### `src/lib/`
- `auth.ts` — config de NextAuth + `signIn/signOut/auth`.
- `auth.config.ts` — config edge-safe que importa el middleware.
- `auth-handlers.ts` — re-export para el route handler.
- `db.ts` — singleton de Prisma con `globalThis.prisma` en dev.
- `permissions.ts` — `PERMISSIONS`, `PERMISSION_LABELS`, `can`, `assertCan`, `hasAnyAdminPermission`. Permisos: `retiros:manage`, `socios:manage`, `geneticas:manage`, `containers:manage`, `postulaciones:manage`, `admins:manage`, `estadisticas:view` (en la lista runtime hay además `blog:moderate` en `prisma/seed.ts` — desincronizado con el array de `PERMISSIONS`).
- `reservations.ts` — `reserve/release/consumeReservationsForWithdrawal` + `InsufficientStockError`.
- `config.ts` — `getClubConfig` cacheado por tag.
- `validators.ts` — zod schemas: `loginSchema`, `passwordPolicy`, `cambiarPasswordSchema`, `retiroSchema`, `postulacionSchema`, `createSocioSchema`, `editSocioSchema`, `geneticaSchema`.
- `security.ts` — IP, user-agent, lockout, rate limit IP.
- `audit.ts` — registro de `AuditLog`.
- `totp.ts` — generación, URI y verificación.
- `stats.ts` — helpers de fechas, agrupaciones, top-N, buckets.
- `format.ts` — locale es-AR para fechas, gramos, estados.
- `resend.ts` — `sendContactEmail` con `from`/`to` por env `CONTACT_FROM_EMAIL`/`CONTACT_TO_EMAIL` (defaults hardcoded a El Gordito).

### `src/components/`
- `logo.tsx`, `theme-toggle.tsx`, `mobile-menu.tsx`, `settings-menu.tsx`, `institutional.tsx` (Hero/Section/Eyebrow), `photo-carousel.tsx`, `badge-count.tsx`, `confirm-button.tsx`, `submit-with-spinner.tsx`, `saving-spinner.tsx`, `progress/*`.

### `src/middleware.ts`
Matcher: `/socio/:path*`, `/administrador/:path*`, `/login`, `/cambiar-password`. Redirige por rol y caduca visitantes vencidos.

### `scripts/`
Vacío (la carpeta existe pero no tiene scripts).

### `prisma/`
- `schema.prisma` — modelos.
- `seed.ts` — crea admins (`jacobo@elgordito.club`, `zoncabe@elgordito.club` como owner) y 4 genéticas BSF demo si la tabla está vacía. Lista de permisos del seed incluye `blog:moderate` que no está en `lib/permissions.ts`.
- `seed-pendings.ts` — semilla de postulaciones (auxiliar).
- `import-socios.ts` — script para importar socios del Gordito reales con sus fechas históricas.
- `migrations/` — 20 migraciones con fechas 2026-04-14 a 2026-05-20.

---

## 5. Integraciones externas

| Servicio | Uso | Configuración |
|---|---|---|
| Neon / PostgreSQL | DB | `DATABASE_URL` |
| Auth.js v5 | Sesiones JWT | `AUTH_SECRET`, `AUTH_TRUST_HOST` |
| Resend | Email de contacto | `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL` |
| Vercel Blob | Subida de fotos de genéticas | Token implícito de Vercel (`@vercel/blob`). `next.config.ts` permite imágenes desde `*.public.blob.vercel-storage.com`. |
| otpauth | TOTP de admins | Sin red |

Headers de seguridad estrictos en `next.config.ts` (CSP self-only excepto `img-src https:`, HSTS preload, frame-ancestors none, etc.).

---

## 6. Puntos donde el código asume single-tenant

Cada uno de estos asume "hay una sola entidad club" en este código. Son la lista de roturas a resolver al pasar a SaaS.

### 6.1 Esquema de datos (lo crítico)
1. **No existe `Tenant`/`Club`**. Ninguna tabla tiene `tenantId`. Todo se identifica por unicidad global.
2. `User.email` es `@unique` global. Dos clubes no pueden compartir email (real con marido y mujer en distintos clubes, por ejemplo). Necesita pasar a `@@unique([tenantId, email])`.
3. `ClubConfig.id` es literalmente `"singleton"` y `getClubConfig` hace `upsert({where:{id:"singleton"}})`. Esto colisiona inmediatamente al haber más de un club por DB.
4. `Container.number` es `@unique` global. Dos clubes no pueden tener un "contenedor #1".
5. `Strain.code` es `@unique` global. Tampoco se puede repetir entre clubes.
6. `User.isOwner` es global, pero el concepto de "dueño" debería ser **owner del tenant**, no del sistema.
7. Permisos en `User.permissions` son strings sueltos: no hay scope de tenant. Un admin migrado a otro club arrastra permisos.

### 6.2 Lógica de aplicación
8. `socios:manage` y `postulaciones:manage` chequean `socioCount >= 45` global. Tiene que ser por tenant.
9. Rate limit IP de login (`ipRateLimited`) cuenta sobre `LoginAttempt` global. En SaaS multitenant un cliente puede DOS-ear a otro vecino. Debería scopearse por tenant + IP, o seguir global pero documentado.
10. `recordLoginAttempt` y lockout también globales.
11. `audit` no graba tenant. Para multitenant compartido es indispensable.
12. `reserveForWithdrawal` selecciona `ContainerItem` activos por `strainId` y `container.active`. Si dos clubes comparten la misma genética/strain comparten stock — ruptura grave si se usa shared DB.
13. `getClubConfig` cachea con `unstable_cache(["club-config"])` sin clave de tenant. Cachearía la config del primer club que pegue.
14. `lib/totp.ts` issuer hardcoded `"El Gordito Club"` — afecta cómo aparece en Google Authenticator.
15. Visitor invite emails se generan como `visitante+xxx@elgordito.club`. Choca con el unique global y con la imagen de marca de cada tenant.

### 6.3 Branding y deploy
16. Fallbacks hardcoded `"El Gordito Club"` / `"https://elgordito.club"` en `app/layout.tsx`, `manifest.ts`, `sitemap.ts`, `robots.ts`, `public/page.tsx`, `como-asociarse/page.tsx`, `(public)/layout.tsx`, `components/logo.tsx`, `components/institutional.tsx`, `configuracion/page.tsx`.
17. `components/logo.tsx` muestra hardcoded el texto `"EL GORDITO CLUB"` y referencia `/logo.jpg` estático.
18. `app/(public)/contacto/page.tsx` tiene `instagram.com/elgorditoclub` y "Escribinos a El Gordito Club" hardcoded.
19. `seed.ts` crea admins con emails `@elgordito.club` y password texto plano `"1813"` y `"Campeon2122!"`. Reusable solo con edición manual antes de cada deploy nuevo.
20. `next.config.ts` `images.remotePatterns` permite solo `*.public.blob.vercel-storage.com`. Si en SaaS se usan otros buckets (R2, S3) hay que ampliarlo.
21. `CONTACT_FROM_EMAIL`/`CONTACT_TO_EMAIL` default a direcciones del Gordito.
22. `prisma/import-socios.ts` y `prisma/seed-pendings.ts` traen data del Gordito acoplada por código.

### 6.4 Auth y middleware
23. `signOut({redirectTo: "/"})` y `redirect("/socio")`/`redirect("/administrador")` se asumen rutas absolutas del único club. En modelo de subdominios (`<club>.app.com`) puede funcionar tal cual; en path-based (`/c/<slug>`) hay que reescribir.
24. Middleware no resuelve tenant a partir del host. Cualquier solución multitenant precisa, antes que nada, que el middleware identifique el tenant del request (subdomain o slug) y lo propague a server actions y queries.

### 6.5 Build pipeline
25. `npm run build` corre `prisma migrate deploy` contra UNA `DATABASE_URL`. En arquitectura "DB por tenant" (opción B del proyecto) hay que orquestar migraciones por instancia. En "DB compartida con tenant_id" (opción A) basta una sola DB.

---

## 7. Decisiones pendientes que afectan el mapa

Del PROYECTO.md y la conversación con Mariano:
- **Opción A (multi-tenant en DB compartida)** vs **Opción B (single-tenant containerizado por club)**. El esquema actual no soporta A sin tocar todas las tablas. Para B el trabajo es menos invasivo en código pero más caro en infra y orquestación.
- Pricing 19/49/150 USD/mes y techo de ~570 clubes IRCCA en Uruguay condicionan el cap de infra por cliente.

Este mapa se actualiza antes de cerrar cualquier sesión que toque código.
