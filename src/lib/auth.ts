import NextAuth, { CredentialsSignin, type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validators";
import { authConfig } from "@/lib/auth.config";
import {
  getClientIp,
  ipRateLimited,
  lockoutState,
  recordLoginAttempt,
  registerFailedLogin,
  registerSuccessfulLogin,
} from "@/lib/security";
import { verifyTotp } from "@/lib/totp";
import { audit } from "@/lib/audit";
import { headers } from "next/headers";
import { TENANT_HEADER } from "@/lib/tenant";

class AuthError extends CredentialsSignin {
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    session: async (params) => {
      // Mapea token → session con el callback base (única fuente de verdad).
      const session = authConfig.callbacks!.session!(params) as Session;
      // Sobre eso, refresca permisos desde la DB para que los cambios apliquen
      // sin necesidad de re-loguear.
      if (params.token && session.user?.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { permissions: true },
        });
        session.user.permissions = fresh?.permissions ?? [];
      }
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        totp: {},
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) throw new AuthError("invalid_input");

        const { email, password, totp } = parsed.data;
        const ip = await getClientIp();

        // Tenant del host (inyectado por el middleware). Sin tenant no se
        // puede loguear: el login vive siempre bajo un subdominio de club.
        const tenantSlug = (await headers()).get(TENANT_HEADER);
        if (!tenantSlug) throw new AuthError("invalid_credentials");
        const tenant = await prisma.tenant.findUnique({
          where: { slug: tenantSlug },
        });
        if (!tenant || !tenant.active) {
          throw new AuthError("invalid_credentials");
        }

        if (await ipRateLimited(tenant.id, ip)) {
          await recordLoginAttempt(tenant.id, email, false, ip);
          throw new AuthError("ip_rate_limited");
        }

        const user = await prisma.user.findUnique({
          where: { tenantId_email: { tenantId: tenant.id, email } },
        });
        if (!user || !user.active) {
          await recordLoginAttempt(tenant.id, email, false, ip);
          throw new AuthError("invalid_credentials");
        }
        if (user.expiresAt && user.expiresAt < new Date()) {
          await recordLoginAttempt(tenant.id, email, false, ip);
          throw new AuthError("invalid_credentials");
        }

        const lock = lockoutState(user);
        if (lock.locked) {
          await recordLoginAttempt(tenant.id, email, false, ip);
          throw new AuthError("locked");
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          await recordLoginAttempt(tenant.id, email, false, ip);
          await registerFailedLogin(user.id);
          throw new AuthError("invalid_credentials");
        }

        if (user.totpEnabled && user.totpSecret) {
          if (!totp) throw new AuthError("totp_required");
          if (!verifyTotp(user.totpSecret, totp)) {
            await recordLoginAttempt(tenant.id, email, false, ip);
            await registerFailedLogin(user.id);
            throw new AuthError("totp_invalid");
          }
        } else if (user.role === "ADMIN") {
          await recordLoginAttempt(tenant.id, email, true, ip);
          await registerSuccessfulLogin(user.id);
          await audit({
            userId: user.id,
            actorEmail: user.email,
            action: "auth.login.totp_enrollment_required",
          });
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: user.permissions,
            mustChangePassword: user.mustChangePassword,
            totpEnabled: false,
            expiresAt: user.expiresAt ? user.expiresAt.toISOString() : null,
            tenantId: tenant.id,
            tenantSlug: tenant.slug,
          };
        }

        await recordLoginAttempt(tenant.id, email, true, ip);
        await registerSuccessfulLogin(user.id);
        await audit({
          userId: user.id,
          actorEmail: user.email,
          action: "auth.login.success",
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          mustChangePassword: user.mustChangePassword,
          totpEnabled: user.totpEnabled,
          expiresAt: user.expiresAt ? user.expiresAt.toISOString() : null,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
        };
      },
    }),
  ],
});
