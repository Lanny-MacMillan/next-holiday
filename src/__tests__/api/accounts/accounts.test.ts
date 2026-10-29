/** @jest-environment node */
const requireAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
  requireAuth: (...a: unknown[]) => requireAuth(...a),
  getCurrentUser: jest.fn(),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: require('@/__tests__/support/api').prismaMock,
}));

import {
  apiRequest,
  prismaMock as db,
  readJson,
  resetPrismaMock,
  routeParams,
} from '@/__tests__/support/api';
import {
  GET as listAccounts,
  POST as createAccount,
} from '@/app/api/accounts/route';
import { DELETE, GET, PUT } from '@/app/api/accounts/[id]/route';

const ID = '3f2b8c1e-9a4d-4e6b-8c2f-1a2b3c4d5e6f';
const me = { id: 'me-id', auth0Sub: 'auth0|me', name: 'Me', email: 'me@x.com' };
const FULL = '?q=&sortBy=createdAt&sortOrder=desc';
const withRole = (role: string | null) =>
  db.accountMember.findUnique.mockResolvedValue(role ? { role } : null);

beforeEach(() => {
  resetPrismaMock();
  requireAuth.mockReset().mockResolvedValue(me);
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('GET /api/accounts', () => {
  beforeEach(() => {
    db.account.findMany.mockResolvedValue([{ id: 'a1' }]);
    db.account.count.mockResolvedValue(45);
  });

  it('lists accounts when no query params are given', async () => {
    expect(
      (await readJson(await listAccounts(apiRequest('/api/accounts')))).status,
    ).toBe(200);
  });

  it('lists only accounts the user belongs to, newest first, with the first page of 20', async () => {
    const { status, body } = await readJson(
      await listAccounts(apiRequest(`/api/accounts${FULL}`)),
    );

    expect(status).toBe(200);
    const query = db.account.findMany.mock.calls[0][0];
    expect(query.where).toEqual({ members: { some: { userId: 'me-id' } } });
    expect(query.orderBy).toEqual({ createdAt: 'desc' });
    expect(query).toMatchObject({ skip: 0, take: 20 });
    expect(body.data.data).toEqual([{ id: 'a1' }]);
    expect(body.data.meta).toMatchObject({
      page: 1,
      pageSize: 20,
      total: 45,
      totalPages: 3,
      hasNext: true,
    });
  });

  it('pages, sorts and searches', async () => {
    await listAccounts(
      apiRequest(
        '/api/accounts?page=2&pageSize=10&sortBy=name&sortOrder=desc&q=fam',
      ),
    );
    const query = db.account.findMany.mock.calls[0][0];
    expect(query).toMatchObject({ skip: 10, take: 10, orderBy: { name: 'desc' } });
    expect(query.where.name).toEqual({ contains: 'fam' });
    expect(db.account.count).toHaveBeenCalledWith({ where: query.where });
  });

  it('rejects an unknown sort field', async () => {
    const { status } = await readJson(
      await listAccounts(apiRequest('/api/accounts?sortBy=password')),
    );
    expect(status).toBe(400);
    expect(db.account.findMany).not.toHaveBeenCalled();
  });

  it('returns 500 when the database fails', async () => {
    db.account.findMany.mockRejectedValue(new Error('db down'));
    expect(
      (await readJson(await listAccounts(apiRequest(`/api/accounts${FULL}`))))
        .status,
    ).toBe(500);
  });
});

describe('POST /api/accounts', () => {
  it('creates an account owned by the caller, who is also its first member', async () => {
    db.account.create.mockResolvedValue({ id: 'new' });
    const { status, body } = await readJson(
      await createAccount(apiRequest('/api/accounts', 'POST', { name: 'Smiths' })),
    );

    expect(status).toBe(201);
    expect(body.data).toEqual({ id: 'new' });
    expect(db.account.create.mock.calls[0][0].data).toEqual({
      id: expect.any(String),
      name: 'Smiths',
      ownerUserId: 'me-id',
      members: { create: { userId: 'me-id', role: 'owner' } },
    });
  });

  it.each([{}, { name: '' }, { name: 'x'.repeat(101) }, { name: 5 }])(
    'rejects %j',
    async body => {
      expect(
        (
          await readJson(
            await createAccount(apiRequest('/api/accounts', 'POST', body)),
          )
        ).status,
      ).toBe(400);
      expect(db.account.create).not.toHaveBeenCalled();
    },
  );

  it('returns 500 when the database fails', async () => {
    db.account.create.mockRejectedValue(new Error('db down'));
    expect(
      (
        await readJson(
          await createAccount(apiRequest('/api/accounts', 'POST', { name: 'x' })),
        )
      ).status,
    ).toBe(500);
  });
});

describe('GET /api/accounts/[id]', () => {
  const get = (id = ID) =>
    GET(apiRequest(`/api/accounts/${id}`), routeParams({ id }));

  it('returns the account to a member', async () => {
    withRole('member');
    db.account.findUnique.mockResolvedValue({ id: ID, name: 'Smiths' });
    const { status, body } = await readJson(await get());

    expect(status).toBe(200);
    expect(body.data).toEqual({ id: ID, name: 'Smiths' });
    expect(db.accountMember.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { accountId_userId: { accountId: ID, userId: 'me-id' } },
      }),
    );
  });

  it('rejects an id that is not a UUID', async () => {
    expect((await readJson(await get('not-a-uuid'))).status).toBe(400);
    expect(db.accountMember.findUnique).not.toHaveBeenCalled();
  });

  it('returns 404 when the account is gone', async () => {
    withRole('owner');
    db.account.findUnique.mockResolvedValue(null);
    expect((await readJson(await get())).status).toBe(404);
  });

  it('returns 403 to someone who is not a member', async () => {
    withRole(null);
    expect((await readJson(await get())).status).toBe(403);
  });

  it('does not read the account for someone who is not a member', async () => {
    withRole(null);
    await get();
    expect(db.account.findUnique).not.toHaveBeenCalled();
  });
});

describe('PUT /api/accounts/[id]', () => {
  const put = (body: unknown, id = ID) =>
    PUT(apiRequest(`/api/accounts/${id}`, 'PUT', body), routeParams({ id }));

  it('lets an admin rename the account', async () => {
    withRole('admin');
    db.account.update.mockResolvedValue({ id: ID, name: 'Renamed' });
    const { status, body } = await readJson(await put({ name: 'Renamed' }));

    expect(status).toBe(200);
    expect(body.data.name).toBe('Renamed');
    expect(db.account.update.mock.calls[0][0]).toMatchObject({
      where: { id: ID },
      data: { name: 'Renamed' },
    });
  });

  it('does not let a plain member update it', async () => {
    withRole('member');
    await put({ name: 'x' });
    expect(db.account.update).not.toHaveBeenCalled();
  });

  it('rejects a bad id and a bad body', async () => {
    expect((await readJson(await put({ name: 'x' }, 'nope'))).status).toBe(400);
    withRole('owner');
    expect((await readJson(await put({ name: '' }))).status).toBe(400);
    expect(db.account.update).not.toHaveBeenCalled();
  });

  it('returns 404 when Prisma reports the record is missing', async () => {
    withRole('owner');
    db.account.update.mockRejectedValue(new Error('Record to update not found.'));
    expect((await readJson(await put({ name: 'x' }))).status).toBe(404);
  });

  it('returns 500 for other database errors', async () => {
    withRole('owner');
    db.account.update.mockRejectedValue(new Error('db down'));
    expect((await readJson(await put({ name: 'x' }))).status).toBe(500);
  });
});

describe('DELETE /api/accounts/[id]', () => {
  const del = (id = ID) =>
    DELETE(apiRequest(`/api/accounts/${id}`, 'DELETE'), routeParams({ id }));

  it('lets the owner delete the account', async () => {
    withRole('owner');
    db.account.delete.mockResolvedValue({});
    const { status, body } = await readJson(await del());

    expect(status).toBe(200);
    expect(body.data).toEqual({ message: 'Account deleted successfully' });
    expect(db.account.delete).toHaveBeenCalledWith({ where: { id: ID } });
  });

  it.each(['admin', 'member'])('does not let a %s delete it', async role => {
    withRole(role);
    await del();
    expect(db.account.delete).not.toHaveBeenCalled();
  });

  it('rejects a bad id', async () => {
    expect((await readJson(await del('nope'))).status).toBe(400);
  });

  it('returns 404 when Prisma reports it is already gone', async () => {
    withRole('owner');
    db.account.delete.mockRejectedValue(
      new Error('Record to delete does not exist.'),
    );
    expect((await readJson(await del())).status).toBe(404);
  });

  it('returns 500 for other database errors', async () => {
    withRole('owner');
    db.account.delete.mockRejectedValue(new Error('db down'));
    expect((await readJson(await del())).status).toBe(500);
  });
});

describe('when nobody is signed in', () => {
  it('returns 401', async () => {
    requireAuth.mockRejectedValue(new Error('Authentication required'));
    expect(
      (await readJson(await listAccounts(apiRequest(`/api/accounts${FULL}`))))
        .status,
    ).toBe(401);
  });
});
