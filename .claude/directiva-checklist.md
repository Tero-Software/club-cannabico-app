# Checklist — Soporte de documentos de directiva

> SaaS multi-tenant. NADA es fijo: cargos, plazos, fechas de ejercicio, mínimos de
> antelación, nombres de la directiva, todo es configuración por tenant. El club
> "El Gordito" de `/home/zonca/Programacion/directiva-club` es solo un caso de ejemplo
> de los preformatos a soportar, no la regla.
>
> Trabajamos de a un ítem. Marcar `[x]` al cerrar cada uno.

> **RECORDATORIO — privacidad / mínimos datos.** Pedimos solo los datos mínimos
> necesarios para que la app funcione. No pedimos datos sensibles. Hay que dejar esto
> explicado en algún lado visible para el usuario/admin (texto en la pestaña de settings
> y/o en la landing). Al definir cada campo nuevo (A1/A2/B2) preguntarse: ¿es
> imprescindible para emitir el documento? Si no, no se pide. El PDF y los datos no
> salen a terceros (infra propia, Vercel Blob).

---

## Tipos de documento detectados en los preformatos

Todos comparten esqueleto: encabezado (club) → cuerpo numerado (orden del día) →
bloque de firmas (nombre — cargo). Difieren en cuánto se inyecta de Prisma/settings
y cuánto es texto libre.

1. **Acta de directiva — trámite** — todo derivado (lugar, fecha, presentes, aprobación
   del acta anterior, cierre, firmas). Solo varían número, fecha y presentes.
2. **Acta de directiva — alta/baja de socios** — lo anterior + lista de altas/bajas
   (sale de Prisma: `User` con su alta/baja).
3. **Acta de directiva — con resolución** — lo anterior + párrafos de texto libre
   (convocatoria a AGO, comodato, compras, cuotas…).
4. **Convocatoria a AGO (mail)** — texto mayormente fijo + fecha/hora/lugar/orden del día.
5. **Acta de Asamblea General Ordinaria** — fechas, quórum, integrantes de comisión
   electoral, ejercicio + texto.
6. **Actas de Comisión Electoral** — registro de listas / acto eleccionario / proclamación.
7. **Memoria anual** — resumen del ejercicio + altas/bajas mes a mes (de Prisma).

Conclusión de diseño: es un **documento estructurado A4** (campos auto + bloques de
texto libre), NO un lienzo de objetos sobre PDF. El editor "tipo Canva" del handoff es
sobre-ingeniería; un editor de documento minimalista cubre el 100%. **Confirmado por el usuario? → PENDIENTE.**

---

## Bloque A — Settings de directiva (base de todo lo demás)

Campos nuevos en `Tenant` que los documentos necesitan como variables. Hoy NO existen.

- [ ] **A1.** Definir el modelo de datos de directiva en `Tenant` (schema.prisma).
      Candidatos: departamento (el lugar de las actas: "En <departamento>, el día…";
      revisar si reutilizar `city` o agregar `department`), fecha de cierre de ejercicio
      (día/mes), mínimos de antelación de convocatoria, organismo de control (ej. MEC)
      — todo opcional, sin defaults numéricos cableados.
      NO van: razón social / nombre legal, domicilio social (ningún documento los usa).
- [ ] **A2.** Modelar la **directiva** (integrantes + cargo). Cargos configurables, no
      enum fijo. Definir si es JSON en `Tenant`, tabla aparte, o se deriva de `User`.
      Incluir sindicatura si aplica. Decidir en A1/A2 juntos.
- [ ] **A3.** Migración Prisma (una sola, consolidada con el estilo del repo).
- [ ] **A4.** Extender `configuracion/actions.ts` (schema zod + update) con los campos nuevos.
- [ ] **A5.** Extender `config-form.tsx` + `configuracion/page.tsx` con la sección
      "Directiva" en el form. Mantener patrón actual (campos opcionales → null).
- [ ] **A6.** Seed: setear estos campos en el tenant demo para poder probar.

## Bloque B — Pestaña Directiva (generación + editor)

- [ ] **B1.** Permiso nuevo `directiva:manage` en `permissions.ts` + label + seed.
- [ ] **B2.** Modelo `Document` en Prisma: tipo, número, fecha, estado (borrador/emitido),
      contenido editable (JSON/markdown), ref al PDF en Vercel Blob, tenantId, auditoría.
- [ ] **B3.** Ruta `(admin)/administrador/directiva/` + entrada en el sidebar
      (`layout.tsx`) gated por `directiva:manage`.
- [ ] **B4.** Listado de documentos (filtro por tipo/estado), con su `actions.ts`.
- [ ] **B5.** Generador: elegir tipo → pre-rellenar con Prisma + settings de directiva.
      Una plantilla por tipo de documento (bloque arriba).
- [ ] **B6.** Editor minimalista de documento: campos auto + bloques de texto libre con
      formato básico. Decidir librería (¿contenteditable propio? ¿algo liviano?).
      Sin terceros que reciban los bytes (datos de socios).
- [ ] **B7.** Export a PDF en infra propia → Vercel Blob. Decidir motor de PDF
      (pdf-lib / @react-pdf / impresión del navegador). Guardar ref en `Document`.
- [ ] **B8.** Numeración correlativa por tipo y por tenant (Acta Nº N).

## Bloque C — Notificaciones de tareas pendientes de directiva

- [ ] **C1.** Lógica de "tareas pendientes" derivada de settings (A1/A2) + calendario:
      ej. cierre de ejercicio + antelación → toca convocar AGO; mandato vencido → toca
      elección. Todo parametrizado, nada fijo.
- [ ] **C2.** Badge en el sidebar de Directiva (patrón `BadgeCount` / dot-pulse existente).
- [ ] **C3.** (Opcional) Aviso por mail al admin vía Resend, reusando `lib/resend.ts`.

## Bloque D — Inicio "Actividades próximas" (recuadros dinámicos)

El home del admin (`(admin)/administrador/page.tsx`, título "Actividades próximas") deja de
ser fijo: muestra un recuadro por cada actividad/tarea pendiente del club, no solo retiros.

- [ ] **D1.** Modelo de "actividad próxima": fuente derivada (retiros de hoy/pendientes,
      acta a emitir, control sanitario, cosecha programada, AGO a convocar…). Cada módulo
      aporta sus ítems; nada cableado. Reusar la lógica de C1 para las de directiva.
- [ ] **D2.** Render: una card/`<section>` por tipo de actividad, condicional a que haya
      algo que mostrar y al permiso del módulo. Mismo formato de filas que la card de Retiros.
      Si no hay actividades de un tipo, su card no aparece.
- [ ] **D3.** Orden/priorización de las cards (por urgencia/fecha). Definir cuando existan
      las fuentes (depende de A/B/C y de acopio/sanitaria).

---

## Orden propuesto

A (settings) → B (pestaña/editor) → C (notificaciones), porque B y C dependen de los
campos de A. Empezar por **A1+A2** (modelo de datos), que condiciona todo lo demás.
