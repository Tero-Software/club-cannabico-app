"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { postulacionSchema } from "@/lib/validators";
import { requireTenant } from "@/lib/tenant";

export type PostulacionFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
} | null;

export async function crearPostulacionAction(
  _prev: PostulacionFormState,
  formData: FormData,
): Promise<PostulacionFormState> {
  const parsed = postulacionSchema.safeParse({
    name: formData.get("nombre"),
    email: formData.get("email"),
    phone: formData.get("telefono") || "",
    message: formData.get("mensaje") || "",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const { name, email, phone, message } = parsed.data;

  const tenant = await requireTenant();

  const yaEsSocio = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email } },
  });
  if (yaEsSocio) {
    return { fieldErrors: { email: "Ese email ya pertenece a un socio." } };
  }

  const pendiente = await prisma.application.findFirst({
    where: { tenantId: tenant.id, email, status: "PENDING" },
  });
  if (pendiente) {
    return {
      fieldErrors: {
        email: "Ya tenés una postulación pendiente con ese email.",
      },
    };
  }

  await prisma.application.create({
    data: {
      tenantId: tenant.id,
      name,
      email,
      phone: phone || null,
      message: message || null,
    },
  });

  revalidatePath("/administrador/postulaciones");
  return { ok: true };
}
