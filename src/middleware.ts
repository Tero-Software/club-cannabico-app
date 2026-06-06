import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const userExpiresAt = req.auth?.user?.expiresAt;
  const path = nextUrl.pathname;
  const isAuthPage = path.startsWith("/login");
  const isProtected =
    path.startsWith("/socio") || path.startsWith("/administrador");
  const isAdminPath = path.startsWith("/administrador");

  if (
    isLoggedIn &&
    role === "VISITANTE" &&
    userExpiresAt &&
    new Date(userExpiresAt).getTime() < Date.now()
  ) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("expired", "1");
    return NextResponse.redirect(url);
  }

  if (isAuthPage && isLoggedIn) {
    const dest = role === "ADMIN" ? "/administrador" : "/socio";
    return NextResponse.redirect(new URL(dest, nextUrl));
  }

  if (isProtected && !isLoggedIn) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("from", path);
    return NextResponse.redirect(url);
  }

  if (isAdminPath && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/socio", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/socio/:path*", "/administrador/:path*", "/login", "/cambiar-password"],
};
