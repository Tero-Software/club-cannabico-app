import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

// Superficies nombradas de Linear, copiadas de su design system con sus valores
// exactos (bg/borde/radio/padding/sombra). Cada una declara su elevación fija;
// el nivel sale del tipo de componente que elegís, no del anidamiento.
//
//   Card        bg level-2 translúcido   borde sutil   r8   p24   sin sombra
//   PanelCard   bg level-1               borde 0.08    r12  p24   sombra media
//   FeatureCard bg level-1 translúcido   borde 0.08    r12  p32   sin sombra
//   Modal       bg level-3               borde 0.08    r12  p24   sombra alta
//   Popover     bg level-3               borde 0.08    r8   p0    sombra media
//   Tooltip     bg level-3               borde 0.08    r6   p6/10 sombra baja
//   Toast       bg level-3               borde 0.08    r8   p14   sombra media

type SurfaceProps<T extends ElementType> = {
  as?: T;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

function surface(classes: string) {
  return function Surface<T extends ElementType = "div">({
    as,
    className = "",
    children,
    ...rest
  }: SurfaceProps<T>) {
    const Tag = (as ?? "div") as ElementType;
    return (
      <Tag className={`${classes} ${className}`.trim()} {...rest}>
        {children}
      </Tag>
    );
  };
}

// Default Card: bg blanco al 5%, borde blanco al 5%, r8, p24, sin sombra.
export const Card = surface(
  "bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.05)] rounded-lg p-6 text-foreground",
);

// Panel Card: bg level-1, borde blanco 8%, r12, p24, sombra media + inset.
export const PanelCard = surface(
  "bg-level-1 border border-[rgba(255,255,255,0.08)] rounded-xl p-6 text-foreground " +
    "shadow-[rgba(0,0,0,0.15)_0_4px_12px,rgba(0,0,0,0.2)_0_8px_24px,inset_0_0_0_1px_rgba(255,255,255,0.08)]",
);

// Feature Card: bg blanco 3%, borde blanco 8%, r12, p32, sin sombra.
export const FeatureCard = surface(
  "bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl p-8 text-foreground",
);

// Modal / Dialog: bg level-3, borde blanco 8%, r12, p24, sombra alta + inset.
export const Modal = surface(
  "bg-level-3 border border-[rgba(255,255,255,0.08)] rounded-xl p-6 text-foreground " +
    "shadow-[rgba(0,0,0,0.2)_0_16px_48px,rgba(0,0,0,0.3)_0_32px_72px,inset_0_0_0_1px_rgba(255,255,255,0.1)]",
);

// Popover / Dropdown: bg level-3, borde blanco 8%, r8, p0, sombra media + inset.
export const Popover = surface(
  "bg-level-3 border border-[rgba(255,255,255,0.08)] rounded-lg text-foreground " +
    "shadow-[rgba(0,0,0,0.15)_0_4px_12px,rgba(0,0,0,0.2)_0_8px_24px,inset_0_0_0_1px_rgba(255,255,255,0.08)]",
);

// Tooltip: bg level-3, borde blanco 8%, r6, p6/10, sombra baja.
export const Tooltip = surface(
  "bg-level-3 border border-[rgba(255,255,255,0.08)] rounded-md px-2.5 py-1.5 text-foreground " +
    "shadow-[rgba(0,0,0,0.2)_0_4px_12px]",
);

// Toast / Notification: bg level-3, borde blanco 8%, r8, p14/16, sombra media.
export const Toast = surface(
  "bg-level-3 border border-[rgba(255,255,255,0.08)] rounded-lg px-4 py-3.5 text-foreground " +
    "shadow-[rgba(0,0,0,0.2)_0_8px_24px]",
);
