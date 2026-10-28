/** @jest-environment node */
import { prismaMock, resetPrismaMock } from '@/__tests__/support/api';
import { addUserToDb } from '@/lib/server/userActions';

jest.mock('@/lib/prisma', () => ({
  prisma: require('@/__tests__/support/api').prismaMock,
}));
jest.mock('@/lib/auth', () => ({ getCurrentUser: jest.fn() }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('uuid', () => ({ v4: jest.fn(() => 'generated-id') }));

import { revalidatePath } from 'next/cache';

const auth0User = {
  sub: 'auth0|me',
  email: 'me@x.com',
  name: 'Me',
  picture: 'p.png',
};

beforeEach(() => {
  resetPrismaMock();
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('addUserToDb', () => {
  it('does nothing when the user and their account already exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u-1' });
    prismaMock.account.findFirst.mockResolvedValue({ id: 'a-1' });

    await expect(addUserToDb(auth0User)).resolves.toEqual({
      success: true,
      message: 'User already exists',
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('creates the user, an account named after them, and an owner membership', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.upsert.mockResolvedValue({
      id: 'u-1',
      name: 'Me',
      email: 'me@x.com',
    });
    prismaMock.account.findFirst.mockResolvedValue(null);
    prismaMock.account.create.mockResolvedValue({ id: 'a-1' });

    const result = await addUserToDb(auth0User);

    expect(prismaMock.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { auth0Sub: 'auth0|me' },
        create: {
          id: 'generated-id',
          auth0Sub: 'auth0|me',
          email: 'me@x.com',
          name: 'Me',
          picture: 'p.png',
        },
      }),
    );
    expect(prismaMock.account.create).toHaveBeenCalledWith({
      data: { id: 'generated-id', name: "Me's Account", ownerUserId: 'u-1' },
    });
    expect(prismaMock.accountMember.create).toHaveBeenCalledWith({
      data: { accountId: 'a-1', userId: 'u-1', role: 'owner' },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/');
    expect(result).toEqual({
      success: true,
      data: {
        user: { id: 'u-1', name: 'Me', email: 'me@x.com' },
        account: { id: 'a-1' },
      },
    });
  });

  it.each([
    [
      'their email',
      { id: 'u-1', email: 'me@x.com', name: null },
      "me@x.com's Account",
    ],
    ['a default', { id: 'u-1', email: null, name: null }, "My Family's Account"],
  ])(
    'names the account after %s when there is no name',
    async (_l, user, expected) => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.upsert.mockResolvedValue(user);
      prismaMock.account.findFirst.mockResolvedValue(null);
      prismaMock.account.create.mockResolvedValue({ id: 'a-1' });

      await addUserToDb({ sub: 'auth0|me' });
      expect(prismaMock.account.create.mock.calls[0][0].data.name).toBe(expected);
    },
  );

  it('reuses an account the user already has inside the transaction', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u-1' });
    prismaMock.account.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'a-existing' });
    prismaMock.user.upsert.mockResolvedValue({ id: 'u-1' });

    const result = await addUserToDb(auth0User);
    expect(prismaMock.account.create).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      success: true,
      data: { account: { id: 'a-existing' } },
    });
  });

  describe('when another request creates the user first (P2002)', () => {
    beforeEach(() => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      prismaMock.user.upsert.mockRejectedValue(
        Object.assign(new Error('dup'), { code: 'P2002' }),
      );
    });

    it('returns the user that now exists, with their first account', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'u-1',
        accountMembers: [{ account: { id: 'a-1' } }],
      });
      const result = await addUserToDb(auth0User);
      expect(result).toMatchObject({
        success: true,
        data: { account: { id: 'a-1' } },
      });
    });

    it('returns a null account when the user has none yet', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'u-1',
        accountMembers: [],
      });
      const result = await addUserToDb(auth0User);
      expect(result).toMatchObject({ success: true, data: { account: null } });
    });

    it('gives up with a failure result if the user still cannot be found', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      await expect(addUserToDb(auth0User)).resolves.toEqual({
        success: false,
        error: 'Failed to add user to database',
      });
    });

    it('gives up with a failure result if the lookup itself fails', async () => {
      prismaMock.user.findUnique.mockRejectedValueOnce(new Error('db'));
      await expect(addUserToDb(auth0User)).resolves.toEqual({
        success: false,
        error: 'Failed to add user to database',
      });
    });
  });

  it('returns a failure result for any other database error', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.upsert.mockRejectedValue(new Error('connection lost'));
    await expect(addUserToDb(auth0User)).resolves.toEqual({
      success: false,
      error: 'Failed to add user to database',
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
