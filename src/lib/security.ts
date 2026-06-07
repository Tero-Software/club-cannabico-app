import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export const LOCKOUT_THRESHOLD = 5;
export const LOCKOUT_MINUTES = 15;
export const LOGIN_IP_WINDOW_MINUTES = 15;
export const LOGIN_IP_MAX = 20;

export async function getClientIp(): Promise<string | null> {
  try {
    const h = await headers();
    const fwd = h.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0]!.trim();
    return h.get("x-real-ip") ?? null;
  } catch {
    return null;
  }
}

export async function getUserAgent(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get("user-agent");
  } catch {
    return null;
  }
}

export async function recordLoginAttempt(
  tenantId: string,
  email: string,
  success: boolean,
  ip: string | null,
) {
  await prisma.loginAttempt.create({
    data: { tenantId, email: email.toLowerCase(), success, ip },
  });
}

export async function ipRateLimited(
  tenantId: string,
  ip: string | null,
): Promise<boolean> {
  if (!ip) return false;
  const since = new Date(Date.now() - LOGIN_IP_WINDOW_MINUTES * 60_000);
  const count = await prisma.loginAttempt.count({
    where: { tenantId, ip, success: false, createdAt: { gte: since } },
  });
  return count >= LOGIN_IP_MAX;
}

export type LockoutState = {
  locked: boolean;
  unlockAt?: Date;
};

export function lockoutState(user: {
  lockedUntil: Date | null;
}): LockoutState {
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { locked: true, unlockAt: user.lockedUntil };
  }
  return { locked: false };
}

export async function registerFailedLogin(userId: string): Promise<void> {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { failedLoginCount: { increment: 1 } },
    select: { failedLoginCount: true },
  });
  if (updated.failedLoginCount >= LOCKOUT_THRESHOLD) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60_000),
        failedLoginCount: 0,
      },
    });
  }
}

export async function registerSuccessfulLogin(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });
}
