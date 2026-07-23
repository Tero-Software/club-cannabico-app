# Tareas

**Cuándo leer este archivo:** para saber qué está pendiente, en curso o hecho en el frente de Santiago (ventas, marketing, SEO). Es el estado de trabajo, no la guía de método. El método de cada frente vive en su archivo (`seo-blog.md`, `captacion-mailing.md`, `diseno.md`, `contexto-producto.md`).

## Objetivo vigente

Rankear en Google apuntando al **cliente objetivo: el administrador o comisión directiva de un club cannábico** de Uruguay que decide contratar el software. No es el socio final. Referencia: `contexto-producto.md` y `seo-blog.md`.

El sitio de venta del software es **clubcannabico.app**. La empresa que lo produce es **Tero Software** (`terosoftware.uy`). `elgordito.club` es una instancia real del producto (un club) y sirve como referencia de técnicas SEO ya aplicadas, no como sitio de venta.

## Los tres dominios y su rol

| Dominio | Rol | Público |
|---|---|---|
| `clubcannabico.app` | Sitio de venta del software | Administrador de club (comprador) |
| `terosoftware.uy` | Empresa creadora del software | Cliente de software en general |
| `elgordito.club` | Instancia real del producto | Socio final (referencia SEO) |

## Estado de partida (verificado en repo)

`clubcannabico.app` tiene iconos genéricos, `sitemap.ts`, `robots.ts`, `manifest.ts`, y una landing pública mínima (home, contacto, marco-legal, postulación). El blog fue copiado desde `elgordito.club` a `src/content/blog/` (6 posts) pero está **huérfano**: no hay ruta `/blog` ni componente que lo renderice.

`terosoftware.uy` es un proyecto Next 16 muy inicial: solo `favicon.ico`, `robots.ts`, `sitemap.ts` y estructura i18n (`[lang]`). Ya tiene verificación de Google Search Console cargada.

`elgordito.club` tiene el SEO técnico completo (metadatos por página, JSON-LD, iconos, OpenGraph, blog con 8 posts). Es la fuente de las técnicas a replicar.

---

## Checklist

### 1. Iconos de marca — clubcannabico.app

Reemplazar la hoja genérica de Next por el diseño actual del logo (`public/logo.png`, 512x512 ya existe).

- [ ] Regenerar `src/app/icon.png` (32x32) desde el logo.
- [ ] Regenerar `src/app/icon-192.png` (192x192).
- [ ] Regenerar `src/app/icon-512.png` (512x512).
- [ ] Regenerar `src/app/icon-512-maskable.png` (512x512, con zona segura para máscara).
- [ ] Regenerar `src/app/apple-icon.png` (180x180).
- [ ] Regenerar `src/app/favicon.ico` (multi-resolución 16/32).
- [ ] Verificar que el manifest referencie los iconos existentes, sin rutas a 404.

### 2. Landing de features — clubcannabico.app

Página que describa todas las features del producto, para el administrador de club.

- [ ] Relevar los features reales desde `contexto-producto.md` y el README (no inventar).
- [ ] Estudiar ejemplos de secciones "features highlight" de páginas SaaS bien rankeadas (Linear, Vercel, Stripe). Requiere navegación web en vivo: ejecutar cuando la capacidad esté disponible. Extraer el patrón de estructura, no copiar texto.
- [ ] Diseñar la landing dentro del sistema visual existente (`diseno.md`, `globals.css`).
- [ ] Un solo H1, encabezados en orden, metadatos escritos a mano (`seo-blog.md`).
- [ ] Un solo llamado a la acción claro (postulación o contacto).

### 3. Integrar el blog huérfano — clubcannabico.app

Conectar el blog copiado desde el gordito al sistema. Va a ser parte del sistema de usuario socio y búsqueda de clubes que construye el dueño del proyecto.

- [ ] Crear la ruta `/blog` (índice) que renderice `BLOG_POSTS` de `src/content/blog/posts.ts`.
- [ ] Crear la ruta `/blog/[slug]` (detalle) que renderice cada post.
- [ ] Agregar las rutas del blog al `sitemap.ts`.
- [ ] Revisar que cada post apunte al público correcto; reescribir los que hablen al socio final si el sitio es de venta de software (coordinar con el dueño, ver nota abajo).
- [ ] Agregar JSON-LD `Article` en el detalle de cada post (técnica del gordito).

### 4. Landing de empresa — terosoftware.uy

Sitio de la empresa creadora del software, conectado a clubcannabico.app.

- [ ] Agregar iconos requeridos: `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `icon.png` (común 32x32), `apple-icon.png`, `favicon.ico`.
- [ ] Agregar `manifest.ts`.
- [ ] Definir un estilo visual propio para Tero Software (ver nota: identidad no definida).
- [ ] Escribir la landing: qué es Tero Software, que es la empresa creadora de clubcannabico.app.
- [ ] Enlace claro desde terosoftware.uy hacia clubcannabico.app (empresa → producto).
- [ ] Metadatos escritos a mano, un solo H1.

### 5. SEO técnico transversal (técnicas del gordito)

Replicar en clubcannabico.app y terosoftware.uy lo que ya funciona en elgordito.club.

- [ ] `export const viewport` con `themeColor` en el root layout.
- [ ] Metadatos por página (title, description, canonical, OpenGraph, Twitter).
- [ ] `opengraph-image.png` (1200x630) por sitio.
- [ ] JSON-LD `Organization` en la home de cada sitio.
- [ ] `lang="es-UY"` en el html.
- [ ] `robots.ts` con rutas privadas bloqueadas y sitemap declarado.

### 6. Push

- [ ] Revisar el diff completo antes de commitear.
- [ ] Commit y push (coordinar con el dueño: hay cambios sin commitear de la reorganización de rutas del admin en el árbol de trabajo).

---

## Datos a confirmar con el dueño

- Nombre comercial, precio y modalidad de onboarding siguen sin definir (`contexto-producto.md`). No usarlos en material de venta hasta que estén fijados.
- Identidad visual de Tero Software: no hay sistema definido. Definir antes de la landing de la tarea 4.
- El blog en clubcannabico.app fue copiado del gordito, que apunta al socio final. Confirmar si en el sitio de venta se reorienta al administrador o se deja para el módulo de usuario socio que va a construir el dueño.
