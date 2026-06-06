import { prisma } from "@/lib/db";
import { getClientIp, getUserAgent } from "@/lib/security";

export type AuditInput = {
  userId?: string | null;
  actorEmail?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

export async function audit(input: AuditInput): Promise<void> {
  const [ip, userAgent] = await Promise.all([getClientIp(), getUserAgent()]);
  try {
    await prisma.auditLog.create({
      data: {
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
