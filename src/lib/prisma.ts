import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Une seule connexion : la base locale de dev (`prisma dev`) mélange les
// instructions préparées entre connexions concurrentes et coupe les sessions au repos,
// et le pooler Supabase en mode session plafonne à 15 clients pour toutes les instances.
const connectionString = process.env.DATABASE_URL;

// Supabase impose SSL ; la base locale (`prisma dev`) n'en a pas.
const isLocalDb = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString ?? "");

const adapter = new PrismaPg({
  connectionString,
  ssl: isLocalDb ? undefined : { rejectUnauthorized: false },
  max: 1,
  idleTimeoutMillis: 3000,
  keepAlive: true,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
