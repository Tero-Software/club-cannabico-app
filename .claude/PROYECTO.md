# PROYECTO — Gestor de Clubes Cannábicos / Tero Software

Referencia rápida para futuras sesiones. Estado al 20/05/2026.

---

## 1. Quién es quién

- **Operador**: Mariano Álvarez (Uruguay).
- **Empresa de software**: Tero Software — terosoftware.uy. Vehículo comercial; quien vende y factura la app.

## 2. Producto

- **Nombre interno**: gestor de clubes cannábicos (sin nombre comercial definitivo todavía).
- **Stack actual**: Next.js + Tailwind + Geist, deploy en Vercel. Dark theme por default con toggle.
- **Estado**: single-tenant. Una instancia desplegada para El Gordito. **No multi-tenant todavía.**
- **Feature set (espejado al del competidor cannabis.uy y validado)**:
  - Autenticación de socios y admins
  - Panel con stats, alertas de inactividad, actividad mensual
  - Gestión de socios (CI, edad, ingreso, gramos/mes, $/mes, totales históricos)
  - Registro de retiros
  - Catálogo de variedades
  - Infográficos / charts (Chart.js o similar)
  - Podio Top 10 socios por consumo anual
  - Log de auditoría
  - Exportación PDF
  - Configuración (alertas, límites, branding)
- **Preferencia arquitectónica del operador**: por seguridad de datos y compliance, prefiere standalone por cliente antes que multi-tenant compartido. Tensión real con el modelo de precios bajos (ver sección 7).

## 3. Mercado y marco legal

- **Universo**: ~570 clubes habilitados por IRCCA en Uruguay (lista oficial actualizada trimestralmente en ircca.gub.uy).
- **Límites legales por club**: 15-45 socios, máximo 99 plantas, máximo 480g/año/socio, una única sede física.
- **Margen por club**: hasta 8.000 UYU/socio/mes ≈ USD 200/socio. Con 45 socios llenos: ~USD 9.000/mes bruto. Realista: 25-35 socios × USD 200 = USD 5.000-7.000/mes bruto. Esto define el techo de poder adquisitivo del cliente para software.
- **Marco regulatorio**:
  - Ley 19.172 (2013) — legaliza producción, distribución y consumo
  - Decreto 120/014 — operativo
  - IRCCA = autoridad
  - **Art. 12 prohíbe publicidad directa o indirecta del cannabis**. Contenido informativo/educativo está permitido. Esta línea es crítica para todo el marketing.

## 4. Competidores identificados

### 4.1 cannabis.uy
- **Quién**: East Coast CC (Punta del Este, Maldonado).
- **Estado**: gestor single-tenant para un solo club. 38/45 socios actuales.
- **Stack**: vanilla JS (un solo app.js de 377KB) + Chart.js, hosteado en Hostinger compartido (init.lt, Lituania). API REST en /api/*.
- **GTM**: ninguno. Sin /pricing, /signup, /demo, /contacto. Todas las rutas devuelven el mismo SPA shell.
- **Marca**: tagline aspiracional "Plataforma regulada bajo ley 19.172". El producto es para un solo club; la marca finge plataforma.
- **UX destacable**: loader sci-fi + splash cinemático + tipografías editoriales (Playfair Display + Cormorant Garamond + Inter). Aesthetic referente para inspiración del demo de Tero.
- **Threat level**: Bajo en mercado, alto en domain real estate (cannabis.uy es el nombre más fuerte de Uruguay para este nicho).

### 4.2 clubcannabico.uy
- **Titular real**: Agustin Solla (agsollamagallanes@gmail.com, +598 91032616, Quijote 2888 Mvd zona Brazo Oriental). Registrado el 22/12/2023, hace 2 años y 5 meses.
- **Marca pública**: "CACUMOL & CHARLY" — probablemente nombre del club que Agustin gestiona con el software.
- **Estado**: "Próximamente / En Construcción". Texto del landing dice "Gestión & Administración de Socios. Gestión & Administración de Operaciones" — mismo nicho exacto.
- **Stack**: AWS US East (18.208.88.157, 98.84.224.111), DNS NS1.com (infra profesional), mail propio en servidorlinux18.com, registrador Netuy.
- **Threat level**: Medio. Infra profesional + dominio hace 2.5 años. Dos lecturas: (a) proyecto lento/abandonado; (b) operando en stealth con clientes específicos.

### 4.3 CannabiSoft @ cogouy.com
- **Quién**: Cannabis Club Cogo Uy. Software custom interno, no comercializado.
- **Estado**: en uso por un solo club. Versión "1.1.18" estancada.
- **Stack**: jQuery 1.11/3.3 + Bootstrap + PHP/Apache, hostado en ColoCrossing US (198.46.82.230). Legacy de ~2018.
- **Threat level**: Nulo. Tercer ejemplo del mismo patrón uruguayo: club + software custom interno + nombre genérico. Sin GitHub, sin sitio propio, sin otros clientes.

### 4.4 clubescannabicos.com (directorio, no gestor)
- Directorio de clubes con páginas individuales (D.N.A., VEINTICUATRO, MISTER COCO, etc.).
- Hosteado en Cloudflare, registrado fuera de Uruguay (probablemente intencional por tema regulatorio).
- Es el dominante actual de queries tipo "club cannábicos Montevideo".
- **No es competidor del gestor; es competidor del directorio si Tero entra a ese vertical.**

### 4.5 cannabisafterclub.com (directorio internacional)
- Página de Uruguay vacía ("No se encontraron clubes en Montevideo"). Underbuilt.

### 4.6 FeCCU — Federación de Clubes Cannábicos del Uruguay
- feccu.org.uy / feccu.uy: webs caídas. Instagram @feccu.uy con ~4K seguidores.
- Institucional, no competidor.

### 4.7 IRCCA — ircca.gub.uy
- Autoridad. Publica lista oficial de clubes habilitados por departamento (actualizada 28/02/2026).
- Fuente, no competidor.

### 4.8 Mercado español — competencia real a futuro
Mientras Uruguay tiene solo 3 builds custom single-tenant, España tiene un ecosistema SaaS maduro. Cualquiera de estos puede expandirse a Uruguay:

| Player | URL | Tamaño / Posición |
|---|---|---|
| Easy CSC | easycsc.com | 500+ clubes, 5+ años, respaldado por MJ Freeway |
| Gestion Verde | softwarecannabis.es | Cloud + app móvil socios, 2 asociaciones Barcelona origen |
| Cannabis Club Systems | cannabisclub.systems | Desde 2014, 11 países, 4 continentes |
| IndicaOnline | indicaonline.com | POS dispensarios/asociaciones |
| CannaVerse | cannaverse.cloud | All-in-one CSC |
| Cannabees | cannabees.cloud | All-in-one CSC alemán/europeo |

**Riesgo real**: el competidor que importa no está en Uruguay, está en España. Easy CSC o Cannabis Club Systems con un movimiento de internacionalización pueden ocupar el mercado uruguayo en 6-12 meses. Esto refuerza la urgencia del market lockin local a precio bajo antes de que llegue.

## 5. Dominios investigados (a 20/05/2026)

| Dominio | Estado | Titular / detalle | Notas |
|---|---|---|---|
| elgordito.club | propio | Mariano | Sitio del club. Vercel + Cloudflare. |
| terosoftware.uy | propio | Mariano | Sitio empresa software. Vercel. |
| cannabis.uy | tomado | East Coast CC | Hostinger, en uso para el club. |
| clubcannabico.uy | tomado | Agustin Solla (agsollamagallanes@gmail.com, +598 91032616, Quijote 2888 Mvd) | Alta 22/12/2023. AWS + Netuy. "CACUMOL & CHARLY" en landing. Competidor real, 2+ años de proyecto. |
| marihuana.uy / thc.uy / cbd.uy | tomado | mismo dueño (Registrar.com.uy IPs) | parked, mismo grupo |
| clubes.uy | tomado | Andrés Ferraro (andres.smn@outlook.com, +598 98042246, Cufre 2313 Mvd) | Alta 16/09/2025, parked en Antel. **WhatsApp enviado 20/05 16:04, esperando respuesta.** |
| club.uy | tomado | Santiago Aramendia (saramendia@gmail.com, 096 392996, Juan Paullier 951 apto 403 Cordón) | Alta 20/07/2012 (13 años), parked en Antel. Profesional 40s. **Mensaje borrador listo, no enviado.** |
| autocultivo.uy | tomado | sin verificar (Antel NS, sin A record) | Probablemente mismo perfil de holder pasivo |
| verde.uy / sativa.uy | tomado | sin verificar | parked |
| faso.uy | libre | — | Brand alternativo. Slang local. |
| clubescannabicos.uy / .com.uy | libre | — | Variantes plurales. |
| clubcannabicos.uy / clubcanabico.uy / clubcanabicos.uy | libre | — | Variantes plural/typo. |
| cannabis.com.uy | libre | — | — |

**Negociaciones activas**:
- clubes.uy: mensaje WhatsApp enviado a Andrés Ferraro pidiendo transferencia para "proyecto personal". Walk-away: USD 800.
- club.uy: pendiente de enviar mensaje (esperar respuesta de Andrés primero). Walk-away: USD 2.500-3.500.

## 6. Modelo comercial discutido

### Pricing target
- Estrategia: precio accesible + market share lockin (no premium boutique).
- Math que cierra: USD 20/mes × 200 clubes ≈ USD 4.000/mes recurrente.
- Tiers propuestos:
  - **Free** (los 15 socios fundadores) — adquisición
  - **Plan Club USD 19/mes** — el grueso de clientes (70%)
  - **Plan Premium USD 49/mes** — dominio propio, backup, branding custom, soporte priority (20%)
  - **Plan Enterprise USD 150/mes** — VPS dedicado, SLA, soporte presencial (5%)

### Arquitectura (ofrecer dos opciones)
- **Opcion A — Multi-tenant real**: shared DB con tenant_id + RLS. Costo infra: USD 1-2/club. Margen alto. Onboarding self-service. Contra: shared DB suena feo a directivos paranoicos.
- **Opcion B — Single-tenant containerizado** (preferido por operador): Docker por club, todos en VPS/k3s. Costo infra: USD 3-5/club. Margen menor pero más limpio legalmente. Cada club tiene su DB aislada, su backup propio.
- **Pendiente**: revisar el código actual del Gordito para decidir cuánto trabajo cuesta llegar a cada camino.

### Posicionamiento Tero Software
- Tero = quien vende. El Gordito = caso de éxito.
- Sección a agregar en terosoftware.uy: `/productos/gestor-clubes-cannabicos` o `/casos/elgordito` con demo en vivo (`demo.terosoftware.uy` con data fake, login `demo/demo`, datos que resetean cada hora).
- Mostrar cinematic intro en demo público (es marketing). Toggleable off para uso diario del admin del club.

### Outreach inicial
- Lista de clubes habilitados está pública en IRCCA, segmentable por departamento.
- Mensaje base: "Soy de Tero Software, construimos el sistema del Club El Gordito y lo ofrecemos a otros clubes. ¿15 minutos para una demo en vivo?". Tasa esperable: 1 de cada 10-15 responde sí.

## 7. Bitácora de acciones (cronológica)

| Fecha | Acción | Estado |
|---|---|---|
| (previa) | Construido el gestor del Gordito, deploy en producción | Hecho |
| (previa) | Sitio elgordito.club publicado en Vercel | Hecho |
| (previa) | terosoftware.uy publicado | Hecho |
| 20/05/2026 | Auditoría SEO de elgordito.club | Hecho |
| 20/05/2026 | Investigación de directorios competidores en UY | Hecho |
| 20/05/2026 | Investigación whois/DNS de dominios .uy del rubro | Hecho |
| 20/05/2026 16:04 | WhatsApp enviado a Andrés Ferraro por clubes.uy | Pendiente respuesta |
| (próximo) | Esperar respuesta de Andrés 24-72hs | En curso |
| (próximo) | Si Andrés no responde o pide locura, enviar a Santiago por club.uy | Pendiente |
| (próximo) | Revisar arquitectura del código actual para decidir camino A vs B | Pendiente |
| (próximo) | Limpiar repo en template de deploy (script, branding parametrizado, migraciones, backups) | Pendiente |
| (próximo) | Crear demo.terosoftware.uy con data fake | Pendiente |
| (próximo) | Agregar sección de producto + case study en terosoftware.uy/es | Pendiente |

## 8. Notas sobre tono de trabajo

- Mariano valora respuestas tight, sin filler, sin listas decorativas, sin que Claude lo empuje a comprar cosas que no pidió.
- Le molesta que Claude liste recomendaciones que él no validó.
- Prefiere análisis estratégico + opciones, no instrucciones prescriptivas.
- Buen estilo de respuesta: datos verificados + lectura honesta + decisión queda en él.
- Reportar honestamente cuando Claude se equivoca (ya pasó con el pricing inicial USD 2.500-4.500 que era irrealista para este mercado).
