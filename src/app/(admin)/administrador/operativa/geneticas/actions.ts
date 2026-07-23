"use server";

import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { geneticaSchema } from "@/lib/validators";
import { assertCan } from "@/lib/permissions";
import { audit } from "@/lib/audit";

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

async function deleteBlobs(urls: string[]) {
  const blobUrls = urls.filter((u) => {
    try {
      return new URL(u).hostname.endsWith(BLOB_HOST_SUFFIX);
    } catch {
      return false;
    }
  });
  if (blobUrls.length === 0) return;
  try {
    await del(blobUrls);
  } catch (e) {
    console.error("blob delete failed", e);
  }
}

export type GeneticaFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
} | null;

async function requireAdmin() {
  const session = await auth();
  assertCan(session, "geneticas:manage");
  return session;
}

export async function createProductoAction(
  _prev: GeneticaFormState,
  formData: FormData,
): Promise<GeneticaFormState> {
  const session = await requireAdmin();

  const photos = String(formData.get("photos") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const parsed = geneticaSchema.safeParse({
    name: formData.get("name"),
    bank: formData.get("bank") || "",
    description: formData.get("description") || "",
    sourceUrl: formData.get("sourceUrl") || "",
    photos,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const created = await prisma.strain.create({
    data: {
      tenantId: session.user.tenantId,
      name: parsed.data.name,
      bank: parsed.data.bank || null,
      description: parsed.data.description || null,
      sourceUrl: parsed.data.sourceUrl || null,
      photos: parsed.data.photos,
    },
  });

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "genetica.create",
    entity: "Genetica",
    entityId: created.id,
    metadata: { name: created.name },
  });

  revalidatePath("/administrador/operativa/geneticas");
  return { ok: true };
}

export async function updateProductoAction(formData: FormData) {
  const session = await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string") return;

  const photos = String(formData.get("photos") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const parsed = geneticaSchema.safeParse({
    name: formData.get("name"),
    bank: formData.get("bank") || "",
    description: formData.get("description") || "",
    sourceUrl: formData.get("sourceUrl") || "",
    photos,
  });
  if (!parsed.success) return;

  const before = await prisma.strain.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });
  if (!before) return;

  const after = {
    name: parsed.data.name,
    bank: parsed.data.bank || null,
    description: parsed.data.description || null,
    sourceUrl: parsed.data.sourceUrl || null,
    photos: parsed.data.photos,
  };

  await prisma.strain.update({ where: { id: before.id }, data: after });

  const removedPhotos = before.photos.filter((p) => !after.photos.includes(p));
  if (removedPhotos.length > 0) await deleteBlobs(removedPhotos);

  const changes: Record<string, { from: unknown; to: unknown }> = {};
  if (before.name !== after.name) changes.name = { from: before.name, to: after.name };
  if (before.bank !== after.bank) changes.bank = { from: before.bank, to: after.bank };
  if (before.description !== after.description)
    changes.description = { from: before.description, to: after.description };
  if (before.sourceUrl !== after.sourceUrl)
    changes.sourceUrl = { from: before.sourceUrl, to: after.sourceUrl };
  if (JSON.stringify(before.photos) !== JSON.stringify(after.photos))
    changes.photos = { from: before.photos.length, to: after.photos.length };

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "genetica.update",
    entity: "Genetica",
    entityId: id,
    metadata: { name: before.name, changes },
  });

  revalidatePath("/administrador/operativa/geneticas");
}

export async function deleteProductoAction(
  formData: FormData,
): Promise<{ error?: string } | void> {
  const session = await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const strain = await prisma.strain.findFirst({
    where: { id, tenantId: session.user.tenantId },
    select: { id: true, photos: true },
  });
  if (!strain) return;

  const itemsCount = await prisma.withdrawalItem.count({
    where: { strainId: strain.id, tenantId: session.user.tenantId },
  });
  if (itemsCount > 0) {
    return { error: "Esta genética tiene retiros asociados y no se puede eliminar." };
  }

  await prisma.strain.delete({ where: { id: strain.id } });
  if (strain.photos.length) await deleteBlobs(strain.photos);

  await audit({
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "genetica.delete",
    entity: "Genetica",
    entityId: id,
  });
  revalidatePath("/administrador/operativa/geneticas");
}
