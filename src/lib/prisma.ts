import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Une seule connexion : la base locale de dev (`prisma dev`) mélange les
// instructions préparées entre connexions concurrentes et coupe les sessions au repos.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  idleTimeoutMillis: 3000,
  keepAlive: true,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
