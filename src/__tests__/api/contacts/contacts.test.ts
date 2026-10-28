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
  GET as listContacts,
  POST as createContact,
} from '@/app/api/contacts/route';
import { DELETE, PUT } from '@/app/api/contacts/[id]/route';

const me = { id: 'me-id', auth0Sub: 'auth0|me', name: 'Me', email: 'me@x.com' };

beforeEach(() => {
  resetPrismaMock();
  requireAuth.mockReset().mockResolvedValue(me);
  db.account.findFirst.mockResolvedValue({ id: 'acc1' });
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

const signedOut = () =>
  requireAuth.mockRejectedValue(new Error('Authentication required'));

describe('GET /api/contacts', () => {
  it("lists the caller's account contacts by name", async () => {
    db.contact.findMany.mockResolvedValue([{ id: 'c1', name: 'Ann' }]);
    const { status, body } = await readJson(
      await listContacts(apiRequest('/api/contacts')),
    );

    expect(status).toBe(200);
    expect(body.data).toEqual([{ id: 'c1', name: 'Ann' }]);
    expect(db.account.findFirst.mock.calls[0][0].where).toEqual({
      members: { some: { userId: 'me-id' } },
    });
    expect(db.contact.findMany).toHaveBeenCalledWith({
      where: { accountId: 'acc1' },
      orderBy: { name: 'asc' },
    });
  });

  it('is forbidden without an account', async () => {
    db.account.findFirst.mockResolvedValue(null);
    expect(
      (await readJson(await listContacts(apiRequest('/api/contacts')))).status,
    ).toBe(403);
  });

  it('is 401 when signed out', async () => {
    signedOut();
    expect(
      (await readJson(await listContacts(apiRequest('/api/contacts')))).status,
    ).toBe(401);
  });

  it('is 500 when the database fails', async () => {
    db.contact.findMany.mockRejectedValue(new Error('db down'));
    expect(
      (await readJson(await listContacts(apiRequest('/api/contacts')))).status,
    ).toBe(500);
  });
});

describe('POST /api/contacts', () => {
  const post = (body: unknown) =>
    createContact(apiRequest('/api/contacts', 'POST', body));

  beforeEach(() => {
    db.contact.create.mockImplementation(
      async ({ data }: { data: unknown }) => data,
    );
  });

  it('creates a contact with blanks stored as null', async () => {
    db.contact.findFirst.mockResolvedValue(null);
    const { status } = await readJson(
      await post({
        name: 'Ann',
        email: 'ann@x.com',
        phone: '555',
        zipCode: '12345',
        city: '',
        notes: '',
      }),
    );

    expect(status).toBe(201);
    expect(db.contact.findFirst).toHaveBeenCalledWith({
      where: { accountId: 'acc1', email: 'ann@x.com' },
    });
    expect(db.contact.create.mock.calls[0][0].data).toMatchObject({
      accountId: 'acc1',
      name: 'Ann',
      email: 'ann@x.com',
      phone: '555',
      postalCode: '12345',
      city: null,
      notes: null,
      createdBy: 'me-id',
    });
  });

  it('creates a contact without an email and skips the duplicate lookup', async () => {
    const { status } = await readJson(await post({ name: 'Bob', email: '' }));
    expect(status).toBe(201);
    expect(db.contact.findFirst).not.toHaveBeenCalled();
    expect(db.contact.create.mock.calls[0][0].data).not.toHaveProperty('email');
  });

  it('refuses an email that already belongs to another contact', async () => {
    db.contact.findFirst.mockResolvedValue({ name: 'Ann' });
    const { status, body } = await readJson(
      await post({ name: 'Annie', email: 'ann@x.com' }),
    );

    expect(status).toBe(400);
    expect(body.error).toContain('already tied to another contact: "Ann"');
    expect(db.contact.create).not.toHaveBeenCalled();
  });

  it.each([
    {},
    { name: '' },
    { name: 'x', email: 'nope' },
    { name: 'x', phone: '1'.repeat(21) },
  ])('rejects %j', async b => {
    expect((await readJson(await post(b))).status).toBe(400);
    expect(db.contact.create).not.toHaveBeenCalled();
  });

  it('is forbidden without an account', async () => {
    db.account.findFirst.mockResolvedValue(null);
    expect((await readJson(await post({ name: 'x' }))).status).toBe(403);
  });

  it('is 401 when signed out', async () => {
    signedOut();
    expect((await readJson(await post({ name: 'x' }))).status).toBe(401);
  });

  it('is 500 when the database fails', async () => {
    db.contact.create.mockRejectedValue(new Error('db down'));
    expect((await readJson(await post({ name: 'x' }))).status).toBe(500);
  });
});

describe('PUT /api/contacts/[id]', () => {
  const put = (body: unknown, id = 'c1') =>
    PUT(apiRequest(`/api/contacts/${id}`, 'PUT', body), routeParams({ id }));

  beforeEach(() => {
    db.contact.findFirst.mockResolvedValue({ id: 'c1' });
    db.contact.update.mockImplementation(
      async ({ data }: { data: unknown }) => data,
    );
  });

  it('only checks contacts inside the caller’s account', async () => {
    await put({ name: 'Ann' });
    expect(db.contact.findFirst).toHaveBeenCalledWith({
      where: { id: 'c1', accountId: 'acc1' },
    });
  });

  it('updates only the fields that were sent and clears blanked ones', async () => {
    const { status } = await readJson(
      await put({ name: 'New', email: '', zipCode: '99999' }),
    );

    expect(status).toBe(200);
    const { where, data } = db.contact.update.mock.calls[0][0];
    expect(where).toEqual({ id: 'c1' });
    expect(data).toMatchObject({ name: 'New', email: null, postalCode: '99999' });
    expect(data).not.toHaveProperty('phone');
    expect(data).not.toHaveProperty('city');
  });

  it('returns 404 for a contact in someone else’s account', async () => {
    db.contact.findFirst.mockResolvedValue(null);
    expect((await readJson(await put({ name: 'x' }))).status).toBe(404);
    expect(db.contact.update).not.toHaveBeenCalled();
  });

  it('rejects an empty phone and an invalid email', async () => {
    expect((await readJson(await put({ phone: '' }))).status).toBe(400);
    expect((await readJson(await put({ email: 'bad' }))).status).toBe(400);
  });

  it('is forbidden without an account, 401 signed out, 500 on db failure', async () => {
    db.account.findFirst.mockResolvedValue(null);
    expect((await readJson(await put({ name: 'x' }))).status).toBe(403);

    db.account.findFirst.mockResolvedValue({ id: 'acc1' });
    db.contact.update.mockRejectedValue(new Error('db down'));
    expect((await readJson(await put({ name: 'x' }))).status).toBe(500);

    signedOut();
    expect((await readJson(await put({ name: 'x' }))).status).toBe(401);
  });
});

describe('DELETE /api/contacts/[id]', () => {
  const del = () =>
    DELETE(apiRequest('/api/contacts/c1', 'DELETE'), routeParams({ id: 'c1' }));

  it('deletes a contact from the caller’s account', async () => {
    db.contact.findFirst.mockResolvedValue({ id: 'c1' });
    const { status, body } = await readJson(await del());

    expect(status).toBe(200);
    expect(body.data).toEqual({ message: 'Contact deleted successfully' });
    expect(db.contact.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
  });

  it('returns 404 and deletes nothing for a contact outside the account', async () => {
    db.contact.findFirst.mockResolvedValue(null);
    expect((await readJson(await del())).status).toBe(404);
    expect(db.contact.delete).not.toHaveBeenCalled();
  });

  it('is forbidden without an account, 401 signed out, 500 on db failure', async () => {
    db.account.findFirst.mockResolvedValue(null);
    expect((await readJson(await del())).status).toBe(403);

    db.account.findFirst.mockResolvedValue({ id: 'acc1' });
    db.contact.findFirst.mockResolvedValue({ id: 'c1' });
    db.contact.delete.mockRejectedValue(new Error('db down'));
    expect((await readJson(await del())).status).toBe(500);

    signedOut();
    expect((await readJson(await del())).status).toBe(401);
  });
});
