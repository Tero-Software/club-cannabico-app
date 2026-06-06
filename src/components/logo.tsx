import Image from "next/image";
import { Link } from "@/components/progress/link";

export function Logo({
  href = "/",
  showUruguay = false,
  hideText = false,
}: {
  href?: string;
  showUruguay?: boolean;
  hideText?: boolean;
}) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Club Cannábico App";
  return (
    <Link href={href} className="flex items-center gap-3 font-semibold transition-transform active:scale-[0.95]">
      <Image
        src="/logo.png"
        alt={appName}
        width={44}
        height={44}
        className="rounded-full object-cover"
        priority
      />
      {!hideText && (
        <span className="flex flex-col leading-tight">
          <span className="font-medium tracking-[0.2em] text-sm text-[var(--foreground)]">
            CLUB CANNÁBICO APP
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
