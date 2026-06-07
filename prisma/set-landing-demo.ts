import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const t = await prisma.tenant.update({
    where: { slug: "demo" },
    data: { name: "Demo Club Cannábico" },
  });
  console.log("updated name:", JSON.stringify(t.name));
}

main()
  .catch((e) => {
    console.error("ERROR", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
