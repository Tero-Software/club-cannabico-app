# Diseño y estética

**Cuándo leer este archivo:** trabajar en la landing, la identidad visual, covers de blog, o cualquier decisión estética.

El sistema visual ya existe y está definido en el código: `src/app/globals.css`. No se inventa una estética nueva; se trabaja dentro de la que ya está. Antes de proponer un cambio visual, leer ese archivo.

## Sistema visual actual

La estética está **calcada del sistema de Linear** (valores exactos de su CSS de producción), con el verde institucional del club como acento en lugar del indigo de Linear. Es un diseño oscuro por defecto, con variante clara.

Principio central de Linear que se respeta acá: **la elevación se expresa con color, no con sombra.** El canvas es lo más oscuro; cada nivel de superficie sube en claridad. En dark las sombras son casi nulas.

## Tokens (valores reales del repo)

Superficies dark, del canvas al más elevado:

| Nivel | Valor | Uso |
|---|---|---|
| `--level-0` | `#08090a` | Canvas (fondo de página) |
| `--level-1` | `#0f1011` | Panel |
| `--level-2` | `#141516` | Surface |
| `--level-3` | `#191a1b` | Elementos elevados (cards) |

Texto en 4 niveles: `--foreground #f7f8f8` (primario), `--fg-secondary #d0d6e0`, `--fg-tertiary #8a8f98`, `--fg-quaternary #62666d`.

Acento institucional: **verde** `--accent #4a7a52` (hover `#5a8d63`). Es el color de marca.

Radios: `--radius-sm 6px`, `--radius-md 8px`, `--radius-lg 12px`.

## Reglas de diseño

1. Usar siempre las variables CSS existentes, nunca colores sueltos escritos a mano. Si un color no está en los tokens, es que no pertenece al sistema.
2. La elevación se hace subiendo de nivel de superficie, no agregando sombras.
3. El verde es el único acento de acción. Los colores rasta son solo del logo.
4. Todo tiene que funcionar en dark y en light (`html[data-theme="light"]`). Verificar en ambos.
5. La landing sigue el estilo Linear ya presente: hero con fade-in por scroll (los commits recientes lo trabajan), tipografía limpia, espacio generoso.

## Antes de cambiar algo visual

Aplica el `CLAUDE.md`: Un cambio de diseño se funda en el sistema existente, en un principio aplicable, o en un problema real de lectura/usabilidad.

Si algo del sistema visual no está claro, leer `src/app/globals.css` completo antes de tocar. Los comentarios de ese archivo explican cada decisión.
