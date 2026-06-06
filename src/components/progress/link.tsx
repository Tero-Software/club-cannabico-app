"use client";

import NextLink, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, type ComponentProps } from "react";
import { useProgress } from "./provider";

type Props = ComponentProps<typeof NextLink>;

function isModifiedEvent(event: React.MouseEvent<HTMLAnchorElement>) {
  const target = event.currentTarget.getAttribute("target");
  return (
    (target && target !== "_self") ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    (event.nativeEvent && (event.nativeEvent as MouseEvent).button === 1)
  );
}

function hrefToString(href: LinkProps["href"]): string {
  if (typeof href === "string") return href;
  const { pathname = "", search = "", hash = "", query } = href;
  let qs = typeof search === "string" ? search : "";
  if (!qs && query) {
    const sp = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach((x) => sp.append(k, String(x)));
      else if (v != null) sp.set(k, String(v));
    });
    qs = sp.toString() ? `?${sp.toString()}` : "";
  }
  return `${pathname}${qs}${hash}`;
}

export function Link({ href, children, replace, scroll, onClick, ...rest }: Props) {
  const router = useRouter();
  const startProgress = useProgress();
  return (
    <NextLink
      href={href}
      replace={replace}
      scroll={scroll}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (isModifiedEvent(e)) return;
        e.preventDefault();
        startTransition(() => {
          startProgress();
          const url = hrefToString(href);
          if (replace) router.replace(url, { scroll });
          else router.push(url, { scroll });
        });
      }}
      {...rest}
    >
      {children}
    </NextLink>
  );
}

export default Link;
