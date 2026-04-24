import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const fallbackDatabaseUrl = "postgresql://invalid:invalid@127.0.0.1:5432/invalid?schema=public";
const databaseUrl = process.env.DATABASE_URL ?? fallbackDatabaseUrl;

/** Solo servidor: en el bundle del cliente `DATABASE_URL` no existe y no debe confundir al diagnóstico. */
if (
  typeof window === "undefined" &&
  process.env.NODE_ENV === "production" &&
  !process.env.DATABASE_URL
) {
  console.error(
    "[prisma] DATABASE_URL no está definida en producción. El login y los datos no funcionarán hasta configurarla en el hosting.",
  );
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
