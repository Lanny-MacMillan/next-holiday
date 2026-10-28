/** @jest-environment node */
const findUnique = jest.fn();
jest.mock('../prisma', () => ({
  prisma: { accountMember: { findUnique: (...a: unknown[]) => findUnique(...a) } },
}));

import {
  requireAccountAccess,
  requireAccountAdmin,
  requireAccountOwner,
} from '../rbac';

const asRole = (role: string | null) =>
  findUnique.mockResolvedValue(role ? { role } : null);
const rejection = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    return e as Response;
  }
  return null;
};

beforeEach(() => findUnique.mockReset());

describe('account access', () => {
  it('looks the membership up by account and user', async () => {
    asRole('member');
    await requireAccountAccess('acc-1', 'user-1');
    expect(findUnique).toHaveBeenCalledWith({
      where: { accountId_userId: { accountId: 'acc-1', userId: 'user-1' } },
      select: { role: true },
    });
  });

  it.each(['owner', 'admin', 'member'])('lets a %s in by default', async role => {
    asRole(role);
    expect(await rejection(requireAccountAccess('a', 'u'))).toBeNull();
  });

  it('refuses someone who is not a member, with a 403', async () => {
    asRole(null);
    const res = await rejection(requireAccountAccess('a', 'u'));
    expect(res?.status).toBe(403);
    expect(await res?.json()).toEqual({ success: false, error: 'Forbidden' });
  });

  it('refuses a role that is not in the allowed list', async () => {
    asRole('member');
    expect(
      (await rejection(requireAccountAccess('a', 'u', ['owner'])))?.status,
    ).toBe(403);
  });
});

describe('owner and admin helpers', () => {
  it('owner-only', async () => {
    asRole('owner');
    expect(await rejection(requireAccountOwner('a', 'u'))).toBeNull();
    asRole('admin');
    expect((await rejection(requireAccountOwner('a', 'u')))?.status).toBe(403);
  });

  it('admin includes the owner but not a member', async () => {
    asRole('owner');
    expect(await rejection(requireAccountAdmin('a', 'u'))).toBeNull();
    asRole('admin');
    expect(await rejection(requireAccountAdmin('a', 'u'))).toBeNull();
    asRole('member');
    expect((await rejection(requireAccountAdmin('a', 'u')))?.status).toBe(403);
  });
});
