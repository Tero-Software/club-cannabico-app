import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface User {
    role?: Role;
    permissions?: string[];
    mustChangePassword?: boolean;
    totpEnabled?: boolean;
    expiresAt?: string | null;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      permissions: string[];
      mustChangePassword: boolean;
      totpEnabled: boolean;
      expiresAt: string | null;
    };
  }
}

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        (token as { id?: string }).id = user.id as string;
        (token as { role?: Role }).role = user.role as Role;
        (token as { permissions?: string[] }).permissions =
          (user.permissions as string[]) ?? [];
        (token as { mustChangePassword?: boolean }).mustChangePassword =
          user.mustChangePassword ?? false;
        (token as { totpEnabled?: boolean }).totpEnabled =
          user.totpEnabled ?? false;
        (token as { expiresAt?: string | null }).expiresAt =
          user.expiresAt ?? null;
        if (user.role === "VISITANTE") {
          (token as { exp?: number }).exp =
            Math.floor(Date.now() / 1000) + 60 * 60;
        }
      }
      return token;
    },
    session: ({ session, token }) => {
      if (token && session.user) {
        session.user.id = (token as { id: string }).id;
        session.user.role = (token as { role: Role }).role;
        session.user.permissions =
          (token as { permissions?: string[] }).permissions ?? [];
        session.user.mustChangePassword =
          (token as { mustChangePassword?: boolean }).mustChangePassword ?? false;
        session.user.totpEnabled =
          (token as { totpEnabled?: boolean }).totpEnabled ?? false;
        session.user.expiresAt =
          (token as { expiresAt?: string | null }).expiresAt ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
