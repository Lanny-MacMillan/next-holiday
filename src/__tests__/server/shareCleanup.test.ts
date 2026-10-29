/** @jest-environment node */
import { prismaMock, resetPrismaMock } from '@/__tests__/support/api';
import { cleanupUserShareData } from '@/lib/server/shareCleanup';

jest.mock('@/lib/prisma', () => ({
  prisma: require('@/__tests__/support/api').prismaMock,
}));

beforeEach(() => {
  resetPrismaMock();
  for (const model of [
    'task',
    'gift',
    'card',
    'guestList',
    'budget',
    'budgetTransaction',
  ]) {
    prismaMock[model].deleteMany.mockResolvedValue({ count: 0 });
  }
});

describe('cleanupUserShareData', () => {
  it('reports how many rows of each kind it removed', async () => {
    prismaMock.task.deleteMany.mockResolvedValue({ count: 3 });
    prismaMock.gift.deleteMany.mockResolvedValue({ count: 2 });
    prismaMock.card.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.guestList.deleteMany.mockResolvedValue({ count: 4 });
    prismaMock.budget.deleteMany.mockResolvedValue({ count: 5 });
    prismaMock.budgetTransaction.deleteMany.mockResolvedValue({ count: 6 });

    await expect(cleanupUserShareData('s-1', 'u-1')).resolves.toEqual({
      deletedTasks: 3,
      deletedGifts: 2,
      deletedCards: 1,
      deletedGuestLists: 4,
      deletedBudgets: 5,
      deletedBudgetTransactions: 6,
    });
  });

  it('runs everything in one transaction', async () => {
    await cleanupUserShareData('s-1', 'u-1');
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it.each(['task', 'gift', 'card'])(
    'only deletes %ss in this share that the user created or was assigned',
    async model => {
      await cleanupUserShareData('s-1', 'u-1');
      expect(prismaMock[model].deleteMany).toHaveBeenCalledWith({
        where: {
          shareId: 's-1',
          OR: [{ createdBy: 'u-1' }, { assignedTo: 'u-1' }],
        },
      });
    },
  );

  it.each(['guestList', 'budget'])(
    "only deletes %s rows the user created, within this share's holiday",
    async model => {
      await cleanupUserShareData('s-1', 'u-1');
      expect(prismaMock[model].deleteMany).toHaveBeenCalledWith({
        where: { holiday: { shares: { id: 's-1' } }, createdBy: 'u-1' },
      });
    },
  );

  it("limits budget transactions to the user's own budgets in this share", async () => {
    await cleanupUserShareData('s-1', 'u-1');
    expect(prismaMock.budgetTransaction.deleteMany).toHaveBeenCalledWith({
      where: {
        budget: { holiday: { shares: { id: 's-1' } }, createdBy: 'u-1' },
      },
    });
  });

  it('passes a database failure to the caller', async () => {
    prismaMock.gift.deleteMany.mockRejectedValue(new Error('db down'));
    await expect(cleanupUserShareData('s-1', 'u-1')).rejects.toThrow('db down');
  });
});
