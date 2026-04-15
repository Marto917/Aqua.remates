import { PrismaClient } from "@prisma/client";
import { runDemoSeed } from "../src/lib/run-demo-seed";

const prisma = new PrismaClient();

async function main() {
  await runDemoSeed(prisma);
  console.log("Seed ejecutado correctamente.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
