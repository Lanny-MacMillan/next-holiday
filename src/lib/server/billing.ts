import { prisma } from '@/lib/prisma';
import { cleanupSharesOnDowngrade } from '@/lib/server/subscriptionCleanup';

export async function activatePlus(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionPlan: 'plus',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: null,
      updatedAt: new Date(),
    },
  });
}

export async function deactivatePlus(userId: string) {
  await cleanupSharesOnDowngrade(userId);
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionPlan: 'free',
      subscriptionStartDate: null,
      subscriptionEndDate: null,
      updatedAt: new Date(),
    },
  });
}
