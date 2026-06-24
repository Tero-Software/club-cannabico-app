import Image from "next/image";
import Link from "next/link";

export function Logo({
  href = "/",
  name,
  showUruguay = false,
  hideText = false,
  size = 44,
}: {
  href?: string;
  /** Nombre a mostrar. Si no se pasa, cae al nombre de la app (env). */
  name?: string;
  showUruguay?: boolean;
  hideText?: boolean;
  /** Lado del ícono en px. Por defecto 44 (navbar público). */
  size?: number;
}) {
  const appName = name ?? process.env.NEXT_PUBLIC_APP_NAME ?? "Club Cannábico App";
  return (
    <Link href={href} className="flex items-center gap-3 font-semibold transition-transform active:scale-[0.95]">
      <Image
        src="/logo.png"
        alt={appName}
        width={size}
        height={size}
        className="rounded-full object-cover"
        priority
      />
      {!hideText && (
        <span className="flex flex-col leading-tight">
          <span className="font-medium tracking-[0.2em] text-sm text-[var(--foreground)]">
            {appName.toUpperCase()}
          </span>
          {showUruguay && (
            <span className="text-[0.6rem] text-[var(--muted-foreground)] tracking-[0.3em]">
              URUGUAY
            </span>
          )}
        </span>
      )}
      <span className="sr-only">{appName}</span>
    </Link>
  );
}
