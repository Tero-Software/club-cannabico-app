"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { CARGOS, cargoLabel, type Cargo } from "./cargos";

const PATH = "/administrador/directiva/comision";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("No autorizado");
  }
  return session;
}

const VALID = new Set<string>(CARGOS.map((c) => c.value));

// Asigna un socio a un cargo. Un cargo es único: al asignarlo, quien lo tenía
// queda sin cargo. userId vacío deja el cargo vacante.
export async function assignCargo(formData: FormData) {
  const session = await requireAdmin();
  const tenantId = session.user.tenantId;

  const cargo = String(formData.get("cargo") || "");
  const userId = String(formData.get("userId") || "");
  if (!VALID.has(cargo)) return { error: "Cargo inválido" };

  // Liberar el cargo de quien lo ocupaba.
  await prisma.user.updateMany({
    where: { tenantId, cargo: cargo as Cargo },
    data: { cargo: null },
  });

  // Asignar al nuevo socio, si se eligió uno.
  if (userId) {
    const socio = await prisma.user.findFirst({
      where: { id: userId, tenantId, role: "MEMBER" },
      select: { id: true },
    });
    if (!socio) return { error: "Socio no encontrado" };

    await prisma.user.update({
      where: { id: userId },
      data: { cargo: cargo as Cargo },
    });
  }

  await audit({
    tenantId,
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "comision.asignar",
    entity: "User",
    entityId: userId || undefined,
    metadata: { cargo: cargoLabel(cargo) },
  });

  revalidatePath(PATH);
  return { ok: true };
}
