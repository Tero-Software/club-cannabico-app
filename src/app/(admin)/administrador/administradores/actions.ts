"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertCan, PERMISSIONS, type Permission } from "@/lib/permissions";
import { audit } from "@/lib/audit";

async function requireSuperadmin() {
  const session = await auth();
  assertCan(session, "admins:manage");
  return session;
}

async function assertCanMutateTarget(targetId: string, actorId: string) {
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { isOwner: true },
  });
  if (!target) throw new Error("Usuario no encontrado");
  if (target.isOwner && targetId !== actorId) {
    throw new Error("No se puede modificar al owner");
  }
  return target;
}

async function isActorOwner(actorId: string) {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { isOwner: true },
  });
  return !!actor?.isOwner;
}

export type AdminFormState = {
  error?: string;
  ok?: boolean;
} | null;

export async function promoverASocioAction(formData: FormData) {
  const session = await requireSuperadmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  if (id === session.user.id) return;
  await assertCanMutateTarget(id, session.user.id);

  await prisma.user.update({
    where: { id },
    data: { role: "ADMIN", permissions: [] },
  });
  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "admin.promote",
    entity: "User",
    entityId: id,
  });
  revalidatePath("/administrador/administradores");
}

export async function degradarAdminAction(formData: FormData) {
  const session = await requireSuperadmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  if (id === session.user.id) return;
  await assertCanMutateTarget(id, session.user.id);

  await prisma.user.update({
    where: { id },
    data: { role: "MEMBER", permissions: [] },
  });
  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "admin.demote",
    entity: "User",
    entityId: id,
  });
  revalidatePath("/administrador/administradores");
}

export async function actualizarPermisosAction(formData: FormData) {
  const session = await requireSuperadmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  if (id === session.user.id) {
    return;
  }
  await assertCanMutateTarget(id, session.user.id);

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isOwner: true, permissions: true },
  });
  const target = await prisma.user.findUnique({
    where: { id },
    select: { permissions: true },
  });
  if (!actor || !target) throw new Error("Usuario no encontrado");

  const validSet = new Set<Permission>(PERMISSIONS);
  const enviados = formData
    .getAll("permissions")
    .filter((p): p is string => typeof p === "string")
    .filter((p): p is Permission => validSet.has(p as Permission));

  const actorScope: Permission[] = actor.isOwner
    ? [...PERMISSIONS]
    : (actor.permissions as Permission[]).filter((p) => validSet.has(p));
  const scopeSet = new Set<Permission>(actorScope);

  const dentroDelScope = enviados.filter((p) => scopeSet.has(p));
  const fueraDelScope = (target.permissions as Permission[]).filter(
    (p) => validSet.has(p) && !scopeSet.has(p)
  );
  const nuevos = Array.from(new Set<Permission>([...dentroDelScope, ...fueraDelScope]));

  await prisma.user.update({
    where: { id },
    data: { permissions: nuevos },
  });
  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "admin.permissions_update",
    entity: "User",
    entityId: id,
    metadata: { permissions: nuevos },
  });
  revalidatePath("/administrador/administradores");
}

export async function otorgarOwnerAction(formData: FormData) {
  const session = await requireSuperadmin();
  if (!(await isActorOwner(session.user.id))) {
    throw new Error("Solo el owner puede otorgar este rol");
  }
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true, isOwner: true },
  });
  if (!target) throw new Error("Usuario no encontrado");
  if (target.role !== "ADMIN") throw new Error("Debe ser admin primero");
  if (target.isOwner) return;

  await prisma.user.update({
    where: { id },
    data: { isOwner: true },
  });
  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "admin.grant_owner",
    entity: "User",
    entityId: id,
  });
  revalidatePath("/administrador/administradores");
}
