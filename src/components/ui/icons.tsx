/**
 * Íconos compartidos de la app. Un solo lugar para el trazo de cada uno, para
 * poder cambiarlo una vez y que se refleje en todas las pantallas.
 */

type IconProps = {
  size?: number;
  className?: string;
};

/** Lápiz de "editar". Usado en socios, acopio, genéticas y comisión. */
export function PencilIcon({ size = 15, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
      <path d="M15 5l3 3" />
    </svg>
  );
}
