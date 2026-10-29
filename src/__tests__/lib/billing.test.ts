/** @jest-environment node */
jest.mock('@/lib/prisma', () => ({
  prisma: require('@/__tests__/support/api').prismaMock,
}));
const cleanup = jest.fn();
jest.mock('@/lib/server/subscriptionCleanup', () => ({
  cleanupSharesOnDowngrade: (...a: unknown[]) => cleanup(...a),
}));

import { prismaMock as db, resetPrismaMock } from '@/__tests__/support/api';
import { activatePlus, deactivatePlus } from '@/lib/server/billing';

beforeEach(() => {
  resetPrismaMock();
  cleanup.mockReset().mockResolvedValue({});
  db.user.update.mockResolvedValue({});
});

describe('activatePlus', () => {
  it('puts the user on Plus from now, with no fixed end date', async () => {
    await activatePlus('u1');
    const { where, data } = db.user.update.mock.calls[0][0];
    expect(where).toEqual({ id: 'u1' });
    expect(data.subscriptionPlan).toBe('plus');
    expect(data.subscriptionStartDate).toBeInstanceOf(Date);
    expect(data.subscriptionEndDate).toBeNull();
  });
});

describe('deactivatePlus', () => {
  it('cleans up sharing first, then puts the user back on free', async () => {
    const order: string[] = [];
    cleanup.mockImplementation(async () => order.push('cleanup'));
    db.user.update.mockImplementation(async () => order.push('update'));

    await deactivatePlus('u1');

    expect(order).toEqual(['cleanup', 'update']);
    expect(cleanup).toHaveBeenCalledWith('u1');
    const { data } = db.user.update.mock.calls[0][0];
    expect(data).toMatchObject({
      subscriptionPlan: 'free',
      subscriptionStartDate: null,
      subscriptionEndDate: null,
    });
  });
});
