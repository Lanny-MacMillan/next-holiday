import { PrismaClient } from '../generated/prisma';
import { installPrismaTracer } from './tracePrisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Add SSL configuration if needed
    ...(process.env.NODE_ENV === 'production' && {
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    }),
  });

// Install Prisma tracer in development
if (process.env.NODE_ENV !== 'production') {
  try {
    installPrismaTracer(prisma);
  } catch (error) {
    console.warn('[trace] Failed to install Prisma tracer:', error);
  }
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
