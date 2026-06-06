import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const allPermissions = [
    "retiros:manage",
    "socios:manage",
    "geneticas:manage",
    "containers:manage",
    "postulaciones:manage",
    "admins:manage",
    "estadisticas:view",
    "blog:moderate",
  ];

  const OWNER_EMAIL = "zoncabe@clubcannabico.app";
  const admins: { email: string; name: string; password: string }[] = [
    { email: "jacobo@clubcannabico.app", name: "Jacobo", password: "1813" },
    { email: OWNER_EMAIL, name: "Zoncabe", password: "Campeon2122!" },
  ];

  for (const a of admins) {
    const passwordHash = await bcrypt.hash(a.password, 10);
    const isOwner = a.email === OWNER_EMAIL;
    await prisma.user.upsert({
      where: { email: a.email },
      update: { permissions: allPermissions, role: "ADMIN", active: true, isOwner },
      create: {
        email: a.email,
        name: a.name,
        passwordHash,
        role: "ADMIN",
        permissions: allPermissions,
        isOwner,
      },
    });
  }

  await prisma.user.deleteMany({ where: { email: "admin@clubcannabico.app" } });

  const geneticasCount = await prisma.strain.count();
  if (geneticasCount === 0) {
    await prisma.strain.createMany({
      data: [
        {
          name: "Blueberry",
          bank: "BSF",
          description:
            "Predominantemente índica. Produce cogollos muy grandes, compactos y cubiertos de una gran capa de resina. Se recomienda para cultivadores con experiencia.",
          photos: [
            "/geneticas/blueberry-0.png",
            "/geneticas/blueberry-1.png",
            "/geneticas/blueberry-2.png",
            "/geneticas/blueberry-3.png",
          ],
          sourceUrl: "https://www.bsfseeds.com.ar/producto/blue-berry/",
        },
        {
          name: "Orange Blossom",
          bank: "BSF",
          description:
            "Cruce entre un clon de California Orange y la Skunk. Variedad perfecta para aplicar técnicas de poda como SCROG o SOG.",
          photos: [
            "/geneticas/orange-blossom-0.png",
            "/geneticas/orange-blossom-1.png",
            "/geneticas/orange-blossom-2.png",
            "/geneticas/orange-blossom-3.png",
          ],
          sourceUrl: "https://www.bsfseeds.com.ar/producto/orange-blossom/",
        },
        {
          name: "Rainbows",
          bank: "BSF",
          description:
            "Cruce de Zkittlez x Zkittlez con sabor a coctel de frutas y cogollos con toques violetas, lilas, rosas y verdes.",
          photos: [
            "/geneticas/Rainbows-1.png",
            "/geneticas/Rainbows-2.png",
            "/geneticas/Rainbows-3.png",
            "/geneticas/Rainbows-4.png",
          ],
          sourceUrl: "https://www.bsfseeds.com.ar/producto/rainbows/",
        },
        {
          name: "Lebron Haze",
          bank: "BSF",
          description:
            "La evolución de las sativas: vigorosa en su crecimiento, rápida en su floración y con una gran producción.",
          photos: [
            "/geneticas/lebron-haze-0.png",
            "/geneticas/lebron-haze-1.png",
            "/geneticas/lebron-haze-2.png",
            "/geneticas/lebron-haze-3.png",
          ],
          sourceUrl: "https://www.bsfseeds.com.ar/producto/lebron-haze/",
        },
      ],
    });
  }

  console.log("✅ Seed completado");
  console.log(`   Admins: ${admins.map((a) => a.email).join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
