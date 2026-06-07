import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ALL_PERMISSIONS = [
  "retiros:manage",
  "socios:manage",
  "geneticas:manage",
  "containers:manage",
  "postulaciones:manage",
  "admins:manage",
  "estadisticas:view",
];

type GeneticaSeed = {
  code: string;
  name: string;
  bank: string | null;
  description: string | null;
  photos: string[];
  sourceUrl: string | null;
};

function loadGeneticas(): GeneticaSeed[] {
  const path = join(__dirname, "geneticas-demo.json");
  return JSON.parse(readFileSync(path, "utf8"));
}

async function seedTenant(opts: {
  slug: string;
  name: string;
  adminEmail: string;
  adminPassword: string;
  geneticas?: GeneticaSeed[];
}) {
  const tenant = await prisma.tenant.upsert({
    where: { slug: opts.slug },
    update: { name: opts.name, active: true },
    create: { slug: opts.slug, name: opts.name },
  });

  const passwordHash = await bcrypt.hash(opts.adminPassword, 10);
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: opts.adminEmail } },
    update: {
      permissions: ALL_PERMISSIONS,
      role: "ADMIN",
      active: true,
      isOwner: true,
      mustChangePassword: false,
    },
    create: {
      tenantId: tenant.id,
      email: opts.adminEmail,
      name: "Admin",
      passwordHash,
      role: "ADMIN",
      permissions: ALL_PERMISSIONS,
      isOwner: true,
      mustChangePassword: false,
    },
  });

  if (opts.geneticas?.length) {
    const count = await prisma.strain.count({ where: { tenantId: tenant.id } });
    if (count === 0) {
      await prisma.strain.createMany({
        data: opts.geneticas.map((g) => ({ ...g, tenantId: tenant.id })),
      });
    }
  }

  console.log(
    `   ${opts.slug} → ${opts.adminEmail} (${opts.geneticas?.length ?? 0} genéticas)`,
  );
}

async function main() {
  await seedTenant({
    slug: "demo",
    name: "Club Demo",
    adminEmail: "admin@clubcannabico.app",
    adminPassword: "Demo2026!",
    geneticas: loadGeneticas(),
  });

  console.log("✅ Seed completado");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
