import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma 7 requires an explicit driver adapter rather than a `url` in the
 * schema. We use the pooled runtime URL here; migrations use `DIRECT_URL`
 * via prisma.config.ts.
 */
function connectionString(): string {
  const url =
    process.env.DATABASE_URL ??
    'postgresql://user:password@localhost:5432/auraos';

  // Neon and most managed providers require TLS; enable it unless the
  // developer is pointing at a local database.
  if (!url.includes('localhost') && !url.includes('sslmode')) {
    return `${url}${url.includes('?') ? '&' : '?'}sslmode=require`;
  }
  return url;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: connectionString() });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

// Reuse a single client across hot reloads in development.
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;