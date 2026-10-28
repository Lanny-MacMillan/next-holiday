/** @jest-environment node */
const findFirst = jest.fn();
jest.mock('../prisma', () => ({
  prisma: { user: { findFirst: (...a: unknown[]) => findFirst(...a) } },
}));

import { validateAssigneeAccess } from '../assigneeValidation';

beforeEach(() => {
  findFirst.mockReset();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('validateAssigneeAccess', () => {
  it('accepts a user with access and returns them', async () => {
    const user = { id: 'u1', name: 'Ada', email: 'a@x.com' };
    findFirst.mockResolvedValue(user);
    expect(await validateAssigneeAccess('u1', 'h1')).toEqual({ valid: true, user });
  });

  it('checks account membership, share membership and share ownership for that holiday', async () => {
    findFirst.mockResolvedValue(null);
    await validateAssigneeAccess('u1', 'h1');

    const { where } = findFirst.mock.calls[0][0];
    expect(where.id).toBe('u1');
    expect(where.OR).toHaveLength(3);
    expect(JSON.stringify(where.OR)).toContain('"holidays":{"some":{"id":"h1"}}');
    expect(where.OR[1]).toEqual({
      shareMemberships: { some: { share: { holidayId: 'h1' } } },
    });
    expect(where.OR[2]).toEqual({ ownedShares: { some: { holidayId: 'h1' } } });
  });

  it('rejects a user who is missing or has no access', async () => {
    findFirst.mockResolvedValue(null);
    expect(await validateAssigneeAccess('u1', 'h1')).toEqual({
      valid: false,
      error: 'Assigned user does not exist or does not have access to this holiday',
    });
  });

  it('reports a database failure without throwing', async () => {
    findFirst.mockRejectedValue(new Error('db down'));
    expect(await validateAssigneeAccess('u1', 'h1')).toEqual({
      valid: false,
      error: 'Failed to validate user access',
    });
  });
});
