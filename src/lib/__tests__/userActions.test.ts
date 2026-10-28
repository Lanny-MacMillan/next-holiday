/** @jest-environment node */
jest.mock('@/lib/prisma', () => ({
  prisma: require('@/__tests__/support/api').prismaMock,
}));
jest.mock('@/lib/auth', () => ({ getCurrentUser: jest.fn() }));
const revalidatePath = jest.fn();
jest.mock('next/cache', () => ({
  revalidatePath: (...a: unknown[]) => revalidatePath(...a),
}));

import { prismaMock as db, resetPrismaMock } from '@/__tests__/support/api';
import { addUserToDb } from '@/lib/server/userActions';

const auth0User = {
  sub: 'auth0|new',
  email: 'new@x.com',
  name: 'New',
  picture: 'p.png',
};

beforeEach(() => {
  resetPrismaMock();
  revalidatePath.mockReset();
  db.user.findUnique.mockResolvedValue(null);
  db.user.upsert.mockImplementation(
    async ({ create }: { create: Record<string, unknown> }) => create,
  );
  db.account.findFirst.mockResolvedValue(null);
  db.account.create.mockImplementation(
    async ({ data }: { data: Record<string, unknown> }) => data,
  );
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('addUserToDb', () => {
  it('creates the user, an owned account and the owner membership', async () => {
    const result = await addUserToDb(auth0User);

    expect(result.success).toBe(true);
    expect(db.user.upsert.mock.calls[0][0]).toMatchObject({
      where: { auth0Sub: 'auth0|new' },
      create: {
        auth0Sub: 'auth0|new',
        email: 'new@x.com',
        name: 'New',
        picture: 'p.png',
      },
    });
    const account = db.account.create.mock.calls[0][0].data;
    expect(account).toMatchObject({ name: "New's Account" });
    const userId = db.user.upsert.mock.calls[0][0].create.id;
    expect(account.ownerUserId).toBe(userId);
    expect(db.accountMember.create).toHaveBeenCalledWith({
      data: { accountId: account.id, userId, role: 'owner' },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });

  it('names the account after the email, then a default, when there is no name', async () => {
    await addUserToDb({ sub: 'a', email: 'e@x.com' });
    expect(db.account.create.mock.calls[0][0].data.name).toBe("e@x.com's Account");

    await addUserToDb({ sub: 'b' });
    expect(db.account.create.mock.calls[1][0].data.name).toBe("My Family's Account");
  });

  it('does nothing for a user who already has an account', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'u1' });
    db.account.findFirst.mockResolvedValue({ id: 'acc1' });

    expect(await addUserToDb(auth0User)).toEqual({
      success: true,
      message: 'User already exists',
    });
    expect(db.user.upsert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('gives an existing user without an account one, without creating a second account if one appears', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'u1' });
    db.account.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'racing-account' });
    db.user.upsert.mockResolvedValue({ id: 'u1', name: 'New' });
    const result = await addUserToDb(auth0User);

    expect(result).toMatchObject({
      success: true,
      data: { account: { id: 'racing-account' } },
    });
    expect(db.account.create).not.toHaveBeenCalled();
  });

  describe('when a concurrent request created the user first (P2002)', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      db.user.upsert.mockRejectedValue({ code: 'P2002' });
    });

    const run = async () => {
      const pending = addUserToDb(auth0User);
      await jest.advanceTimersByTimeAsync(100);
      return pending;
    };

    it('waits briefly, then returns the user the other request made', async () => {
      db.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'u1',
          accountMembers: [{ account: { id: 'acc1' } }],
        });

      expect(await run()).toEqual({
        success: true,
        data: {
          user: expect.objectContaining({ id: 'u1' }),
          account: { id: 'acc1' },
        },
      });
    });

    it('returns a null account if the user has none yet', async () => {
      db.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'u1', accountMembers: [] });
      expect((await run()).data?.account).toBeNull();
    });

    it('fails cleanly if the user still cannot be found', async () => {
      expect(await run()).toEqual({
        success: false,
        error: 'Failed to add user to database',
      });
    });

    it('fails cleanly if the recovery lookup throws', async () => {
      db.user.findUnique
        .mockResolvedValueOnce(null)
        .mockRejectedValueOnce(new Error('db down'));
      expect((await run()).success).toBe(false);
    });
  });

  it('reports other database errors as a failure instead of throwing', async () => {
    db.user.upsert.mockRejectedValue(new Error('db down'));
    expect(await addUserToDb(auth0User)).toEqual({
      success: false,
      error: 'Failed to add user to database',
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
