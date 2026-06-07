import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getClientIp, getUserAgent } from "@/lib/security";
import { TENANT_HEADER } from "@/lib/tenant";

export type AuditInput = {
  /** Si no se pasa, se resuelve del tenant del host (header del middleware). */
  tenantId?: string;
  userId?: string | null;
  actorEmail?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

async function resolveTenantId(explicit?: string): Promise<string | null> {
  if (explicit) return explicit;
  try {
    const slug = (await headers()).get(TENANT_HEADER);
    if (!slug) return null;
    const t = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    return t?.id ?? null;
  } catch {
    return null;
  }
}

export async function audit(input: AuditInput): Promise<void> {
  const [ip, userAgent, tenantId] = await Promise.all([
    getClientIp(),
    getUserAgent(),
    resolveTenantId(input.tenantId),
  ]);
  if (!tenantId) {
    console.error("audit log skipped: no tenant", input.action);
    return;
  }
  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: input.userId ?? null,
        actorEmail: input.actorEmail ?? null,
        action: input.action,
        entity: input.entity ?? null,
        entityId: input.entityId ?? null,
        metadata: input.metadata
          ? (input.metadata as unknown as object)
          : undefined,
        ip,
        userAgent,
      },
    });
  } catch (err) {
    console.error("audit log failed", err);
  }
}
