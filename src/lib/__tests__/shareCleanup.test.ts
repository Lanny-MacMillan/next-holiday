/** @jest-environment node */
jest.mock('@/lib/prisma', () => ({
  prisma: require('@/__tests__/support/api').prismaMock,
}));

import { prismaMock as db, resetPrismaMock } from '@/__tests__/support/api';
import { cleanupUserShareData } from '@/lib/server/shareCleanup';

const counts = {
  task: 1,
  gift: 2,
  card: 3,
  guestList: 4,
  budget: 5,
  budgetTransaction: 6,
};

beforeEach(() => {
  resetPrismaMock();
  for (const [model, count] of Object.entries(counts))
    db[model].deleteMany.mockResolvedValue({ count });
});

describe('cleanupUserShareData', () => {
  it('reports how many of each kind it removed', async () => {
    expect(await cleanupUserShareData('s1', 'u1')).toEqual({
      deletedTasks: 1,
      deletedGifts: 2,
      deletedCards: 3,
      deletedGuestLists: 4,
      deletedBudgets: 5,
      deletedBudgetTransactions: 6,
    });
  });

  it('runs in one transaction', async () => {
    await cleanupUserShareData('s1', 'u1');
    expect(db.$transaction).toHaveBeenCalledTimes(1);
  });

  it.each(['task', 'gift', 'card'])(
    'removes only %ss in the share that the user made or was given',
    async model => {
      await cleanupUserShareData('s1', 'u1');
      expect(db[model].deleteMany).toHaveBeenCalledWith({
        where: { shareId: 's1', OR: [{ createdBy: 'u1' }, { assignedTo: 'u1' }] },
      });
    },
  );

  it('removes only the guest list entries and budgets the user created, through the share’s holiday', async () => {
    await cleanupUserShareData('s1', 'u1');
    const via = { holiday: { shares: { id: 's1' } }, createdBy: 'u1' };
    expect(db.guestList.deleteMany).toHaveBeenCalledWith({ where: via });
    expect(db.budget.deleteMany).toHaveBeenCalledWith({ where: via });
  });

  it('removes only transactions on budgets the user created', async () => {
    await cleanupUserShareData('s1', 'u1');
    expect(db.budgetTransaction.deleteMany).toHaveBeenCalledWith({
      where: { budget: { holiday: { shares: { id: 's1' } }, createdBy: 'u1' } },
    });
  });

  it('lets a failure through so the transaction rolls back', async () => {
    db.gift.deleteMany.mockRejectedValue(new Error('db down'));
    await expect(cleanupUserShareData('s1', 'u1')).rejects.toThrow('db down');
  });
});
