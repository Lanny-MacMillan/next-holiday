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
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
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

// Ensure connection is established on startup
if (process.env.NODE_ENV !== 'production') {
  prisma.$connect().catch(err => {
    console.error('Failed to connect to database:', err);
  });
}

/**
 * Helper function to ensure Prisma is connected before running operations
 * This helps prevent "Transaction not found" errors
 */
export async function ensurePrismaConnection() {
  try {
    // Simple query to check connection
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Prisma connection check failed:', error);
    // Try to reconnect
    try {
      await prisma.$connect();
      return true;
    } catch (reconnectError) {
      console.error('Failed to reconnect to database:', reconnectError);
      return false;
    }
  }
}

export default prisma;
