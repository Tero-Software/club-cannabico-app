import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { slugFromHost, TENANT_HEADER } from "@/lib/tenant-host";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const userExpiresAt = req.auth?.user?.expiresAt;
  const tokenTenantSlug = req.auth?.user?.tenantSlug;
  const path = nextUrl.pathname;
  const isAuthPage = path.startsWith("/login");
  const isProtected =
    path.startsWith("/socio") || path.startsWith("/administrador");
  const isAdminPath = path.startsWith("/administrador");

  // Tenant resuelto del host. Se propaga a la app vía header interno.
  const host = req.headers.get("host");
  const tenantSlug = slugFromHost(host);

  // Defensa: una sesión de un tenant no sirve en otro. Si el JWT trae un
  // tenant distinto al del host, se corta la sesión para este request.
  if (
    isLoggedIn &&
    tenantSlug &&
    tokenTenantSlug &&
    tokenTenantSlug !== tenantSlug
  ) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("tenant_mismatch", "1");
    return NextResponse.redirect(url);
  }

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

  // Reescribe el header de tenant para que la app lo lea (no es seteable
  // por el cliente: acá lo pisamos siempre con el valor del host).
  const requestHeaders = new Headers(req.headers);
  if (tenantSlug) requestHeaders.set(TENANT_HEADER, tenantSlug);
  else requestHeaders.delete(TENANT_HEADER);

  if (!tenantSlug) {
    // Apex sin tenant: la raíz es la landing comercial. Se reescribe a
    // /producto (la URL visible sigue siendo "/"). Para no duplicar contenido
    // en dos URLs, /producto explícito redirige a la raíz canónica.
    if (path === "/") {
      const url = nextUrl.clone();
      url.pathname = "/producto";
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }
    if (path === "/producto") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  } else if (path === "/producto") {
    // Bajo un subdominio de club, la landing comercial no existe.
    return NextResponse.rewrite(new URL("/_not-found", nextUrl), {
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  // Corre en todas las rutas de página para resolver el tenant del host y
  // reescribir el apex. Se excluyen los estáticos, el endpoint de API y los
  // assets de Next, que no necesitan resolución de tenant.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)",
  ],
};
