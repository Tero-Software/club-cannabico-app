import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Postulaciones PENDING
  const POSTULACIONES = [
    { name: "Ana Pérez", email: "ana.perez@test.com", phone: "+598 99 111 111", message: "Quiero sumarme." },
    { name: "Bruno Silva", email: "bruno.silva@test.com", phone: "+598 99 222 222" },
    { name: "Carla Díaz", email: "carla.diaz@test.com", message: "Hola!" },
  ];
  for (const p of POSTULACIONES) {
    const exists = await prisma.application.findFirst({ where: { email: p.email } });
    if (exists) continue;
    await prisma.application.create({ data: { ...p, status: "PENDING" } });
  }

  // Retiros PENDING — pick first 2 members and create one PENDING retiro each
  const members = await prisma.user.findMany({
    where: { role: "MEMBER", active: true },
    take: 2,
  });
  const strains = await prisma.strain.findMany({ take: 1 });
  if (members.length === 0 || strains.length === 0) {
    console.log("No members or strains to create retiros.");
    return;
  }

  for (const m of members) {
    const already = await prisma.withdrawal.findFirst({
      where: { userId: m.id, status: "PENDING" },
    });
    if (already) continue;
    await prisma.withdrawal.create({
      data: {
        userId: m.id,
        date: new Date(Date.now() + 86400000),
        timeSlot: "18:00-19:00",
        status: "PENDING",
        items: {
          create: [{ strainId: strains[0].id, amount: 10 }],
        },
      },
    });
  }

  const [pRet, pPost] = await Promise.all([
    prisma.withdrawal.count({ where: { status: "PENDING" } }),
    prisma.application.count({ where: { status: "PENDING" } }),
  ]);
  console.log(`PENDING retiros: ${pRet} | PENDING postulaciones: ${pPost}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
