/** @jest-environment node */
import {
  apiRequest,
  prismaMock as db,
  readJson,
  resetPrismaMock,
  routeParams,
} from '@/__tests__/support/api';

const requireAuth = jest.fn();
const assertHolidayAccess = jest.fn();
jest.mock('@/lib/auth', () => ({
  requireAuth: (...a: unknown[]) => requireAuth(...a),
  assertHolidayAccess: (...a: unknown[]) => assertHolidayAccess(...a),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: require('@/__tests__/support/api').prismaMock,
}));

import {
  DELETE,
  GET,
  PATCH,
  POST,
  PUT,
} from '@/app/api/holidays/[id]/guest-lists/route';

const HOLIDAY = 'holiday-1';
const ME = '11111111-1111-4111-8111-111111111111';
const GUEST = 'guest-1';
const CONTACT = '44444444-4444-4444-8444-444444444444';
const ctx = routeParams({ id: HOLIDAY });

const forbiddenResponse = () =>
  new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
    status: 403,
  });
const entry = (over = {}) => ({
  id: GUEST,
  holidayId: HOLIDAY,
  contactId: CONTACT,
  rsvpStatus: 'pending',
  notes: null,
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  resetPrismaMock();
  requireAuth.mockResolvedValue({ id: ME });
  assertHolidayAccess.mockResolvedValue(null);
  db.account.findFirst.mockResolvedValue({ id: 'acct-1' });
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe.each([
  ['POST', () => POST(apiRequest('/x', 'POST', { name: 'Ann' }), ctx)],
  ['GET', () => GET(apiRequest('/x'), ctx)],
  [
    'PUT',
    () => PUT(apiRequest('/x', 'PUT', { guestId: GUEST, isCompleted: true }), ctx),
  ],
  [
    'PATCH',
    () => PATCH(apiRequest('/x', 'PATCH', { guestId: GUEST, notes: 'n' }), ctx),
  ],
  ['DELETE', () => DELETE(apiRequest(`/x?guestId=${GUEST}`, 'DELETE'), ctx)],
])('%s access control', (_, call) => {
  it('refuses a caller with no access to the holiday', async () => {
    assertHolidayAccess.mockResolvedValue(forbiddenResponse());
    expect((await readJson(await call())).status).toBe(403);
    expect(assertHolidayAccess).toHaveBeenCalledWith(HOLIDAY, ME);
    expect(db.guestList.upsert).not.toHaveBeenCalled();
    expect(db.guestList.update).not.toHaveBeenCalled();
    expect(db.guestList.delete).not.toHaveBeenCalled();
  });

  it('returns 401 when authentication fails', async () => {
    requireAuth.mockRejectedValue(new Error('Authentication required'));
    expect((await readJson(await call())).status).toBe(401);
  });
});

describe('POST /guest-lists', () => {
  const post = (body: unknown) => POST(apiRequest('/x', 'POST', body), ctx);
  const errorMessage = (body: any) => body.error[0].message;

  beforeEach(() => {
    db.guestList.upsert.mockResolvedValue(entry());
    db.guestList.findUnique.mockResolvedValue({
      ...entry(),
      contact: { id: CONTACT, name: 'Ann' },
    });
  });

  it.each([
    [{}],
    [{ name: '' }],
    [{ name: 'a'.repeat(101) }],
    [{ name: 'Ann', email: 'nope' }],
    [{ name: 'Ann', rsvpStatus: 'attending' }],
    [{ name: 'Ann', numberOfGuests: 0 }],
    [{ contact_id: 'not-a-uuid' }],
  ])('rejects an invalid body %p with 400', async body => {
    expect((await readJson(await post(body))).status).toBe(400);
    expect(db.guestList.upsert).not.toHaveBeenCalled();
  });

  it('answers 400 when the caller has no account', async () => {
    db.account.findFirst.mockResolvedValue(null);
    const { status, body } = await readJson(await post({ name: 'Ann' }));
    expect(status).toBe(400);
    expect(errorMessage(body)).toBe('No account access');
  });

  it("creates a contact in the caller's account and adds it to the list", async () => {
    db.contact.create.mockResolvedValue({ id: CONTACT });
    const { status, body } = await readJson(
      await post({
        name: 'Ann',
        email: 'ann@x.com',
        phone: '555',
        address: '1 Main St',
        rsvpStatus: 'confirmed',
        notes: 'n',
      }),
    );

    expect(status).toBe(201);
    expect(db.account.findFirst.mock.calls[0][0].where).toEqual({
      members: { some: { userId: ME } },
    });
    expect(db.contact.create.mock.calls[0][0].data).toMatchObject({
      accountId: 'acct-1',
      name: 'Ann',
      email: 'ann@x.com',
      phone: '555',
      streetAddress: '1 Main St',
      createdBy: ME,
    });
    expect(db.guestList.upsert).toHaveBeenCalledWith({
      where: { holidayId_contactId: { holidayId: HOLIDAY, contactId: CONTACT } },
      update: { rsvpStatus: 'confirmed', notes: 'n' },
      create: {
        holidayId: HOLIDAY,
        contactId: CONTACT,
        rsvpStatus: 'confirmed',
        notes: 'n',
        createdBy: ME,
      },
    });
    expect(body.data.contact.name).toBe('Ann');
  });

  it('stores blank optional fields as null', async () => {
    db.contact.create.mockResolvedValue({ id: CONTACT });
    await post({ name: 'Ann', email: '', phone: '', address: '' });
    expect(db.contact.create.mock.calls[0][0].data).toMatchObject({
      email: null,
      phone: null,
      streetAddress: null,
    });
    expect(db.contact.findFirst).not.toHaveBeenCalled();
    expect(db.guestList.upsert.mock.calls[0][0].create).toMatchObject({
      rsvpStatus: null,
      notes: null,
    });
  });

  it('reuses an existing contact with the same email and name, ignoring case', async () => {
    db.contact.findFirst.mockResolvedValue({ id: CONTACT, name: 'ANN ' });
    await post({ name: 'ann', email: 'ann@x.com' });
    expect(db.contact.findFirst).toHaveBeenCalledWith({
      where: { accountId: 'acct-1', email: 'ann@x.com' },
    });
    expect(db.contact.create).not.toHaveBeenCalled();
    expect(
      db.guestList.upsert.mock.calls[0][0].where.holidayId_contactId.contactId,
    ).toBe(CONTACT);
  });

  it('refuses an email already tied to a differently named contact', async () => {
    db.contact.findFirst.mockResolvedValue({ id: CONTACT, name: 'Bob' });
    const { status, body } = await readJson(
      await post({ name: 'Ann', email: 'bob@x.com' }),
    );
    expect(status).toBe(400);
    expect(errorMessage(body)).toBe(
      'Email "bob@x.com" is already tied to another contact: "Bob"',
    );
    expect(db.guestList.upsert).not.toHaveBeenCalled();
  });

  describe('with an existing contact', () => {
    const body = { contact_id: CONTACT, rsvpStatus: 'maybe' };

    it('adds a contact from the caller’s own account', async () => {
      db.contact.findUnique.mockResolvedValue({ id: CONTACT, accountId: 'acct-1' });
      expect((await readJson(await post(body))).status).toBe(201);
      expect(db.contact.create).not.toHaveBeenCalled();
      expect(db.guestList.upsert.mock.calls[0][0].create).toMatchObject({
        contactId: CONTACT,
        rsvpStatus: 'maybe',
      });
    });

    it('answers 400 when the contact does not exist', async () => {
      db.contact.findUnique.mockResolvedValue(null);
      const res = await readJson(await post(body));
      expect(res.status).toBe(400);
      expect(errorMessage(res.body)).toBe('Contact not found');
    });

    it("refuses a contact from someone else's account", async () => {
      db.contact.findUnique.mockResolvedValue({
        id: CONTACT,
        accountId: 'acct-other',
      });
      const res = await readJson(await post(body));
      expect(res.status).toBe(400);
      expect(errorMessage(res.body)).toBe('Contact access denied');
      expect(db.guestList.upsert).not.toHaveBeenCalled();
    });
  });

  it('returns 500 when the database fails', async () => {
    db.contact.create.mockRejectedValue(new Error('db'));
    expect((await readJson(await post({ name: 'Ann' }))).status).toBe(500);
  });
});

describe('PUT /guest-lists, RSVP toggle', () => {
  const put = (body: unknown) => PUT(apiRequest('/x', 'PUT', body), ctx);

  it.each([
    [{}],
    [{ guestId: GUEST }],
    [{ isCompleted: true }],
    [{ guestId: GUEST, isCompleted: 'yes' }],
  ])('rejects the body %p with 400', async body => {
    expect((await readJson(await put(body))).status).toBe(400);
    expect(db.guestList.update).not.toHaveBeenCalled();
  });

  it('answers 400 when the guest does not exist', async () => {
    db.guestList.findUnique.mockResolvedValue(null);
    const { status, body } = await readJson(
      await put({ guestId: GUEST, isCompleted: true }),
    );
    expect(status).toBe(400);
    expect(body.error[0].message).toBe('Guest not found');
  });

  it.each([
    ['pending', 'confirmed'],
    ['declined', 'confirmed'],
    [null, 'confirmed'],
    ['confirmed', 'pending'],
  ])('flips an RSVP of %p to %p', async (from, to) => {
    db.guestList.findUnique.mockResolvedValue(entry({ rsvpStatus: from }));
    db.guestList.update.mockResolvedValue(entry({ rsvpStatus: to }));
    const { status, body } = await readJson(
      await put({ guestId: GUEST, isCompleted: true }),
    );

    expect(status).toBe(200);
    expect(db.guestList.update).toHaveBeenCalledWith({
      where: { id: GUEST, holidayId: HOLIDAY },
      data: { rsvpStatus: to },
      include: { contact: true },
    });
    expect(body.data.rsvpStatus).toBe(to);
  });

  it('only looks up guests that belong to the authorised holiday', async () => {
    db.guestList.findUnique.mockResolvedValue(entry());
    db.guestList.update.mockResolvedValue(entry());
    await put({ guestId: GUEST, isCompleted: true });
    expect(db.guestList.findUnique.mock.calls[0][0].where).toMatchObject({
      holidayId: HOLIDAY,
    });
  });

  it('returns 500 when the database fails', async () => {
    db.guestList.findUnique.mockRejectedValue(new Error('db'));
    expect(
      (await readJson(await put({ guestId: GUEST, isCompleted: true }))).status,
    ).toBe(500);
  });
});

describe('PATCH /guest-lists', () => {
  const patch = (body: Record<string, unknown>) =>
    PATCH(apiRequest('/x', 'PATCH', { guestId: GUEST, ...body }), ctx);

  it('needs a guestId', async () => {
    const { status, body } = await readJson(
      await PATCH(apiRequest('/x', 'PATCH', { notes: 'n' }), ctx),
    );
    expect(status).toBe(400);
    expect(body.error[0].message).toBe('Guest ID is required');
  });

  it('updates the RSVP and notes without touching the contact', async () => {
    db.guestList.update.mockResolvedValue(
      entry({ rsvpStatus: 'declined', notes: 'n' }),
    );
    const { status, body } = await readJson(
      await patch({ rsvpStatus: 'declined', notes: 'n' }),
    );

    expect(status).toBe(200);
    expect(db.guestList.update).toHaveBeenCalledWith({
      where: { id: GUEST, holidayId: HOLIDAY },
      data: { rsvpStatus: 'declined', notes: 'n' },
      include: { contact: true },
    });
    expect(db.contact.update).not.toHaveBeenCalled();
    expect(body.data.rsvpStatus).toBe('declined');
  });

  it('leaves unsent fields alone', async () => {
    db.guestList.update.mockResolvedValue(entry());
    await patch({});
    expect(db.guestList.update.mock.calls[0][0].data).toEqual({
      rsvpStatus: undefined,
      notes: undefined,
    });
  });

  it("updates the guest's contact details too and returns the refreshed entry", async () => {
    db.guestList.update.mockResolvedValue(entry());
    db.guestList.findUnique.mockResolvedValue({
      ...entry(),
      contact: { name: 'Ann B' },
    });
    const { body } = await readJson(
      await patch({ name: 'Ann B', email: 'a@x.com', phone: '1', address: '2 St' }),
    );

    const { where, data } = db.contact.update.mock.calls[0][0];
    expect(where).toEqual({ id: CONTACT });
    expect(data).toMatchObject({
      name: 'Ann B',
      email: 'a@x.com',
      phone: '1',
      streetAddress: '2 St',
    });
    expect(body.data.contact.name).toBe('Ann B');
  });

  it('updates the contact when only one detail is sent', async () => {
    db.guestList.update.mockResolvedValue(entry());
    db.guestList.findUnique.mockResolvedValue(entry());
    await patch({ phone: '9' });
    expect(db.contact.update.mock.calls[0][0].data).toMatchObject({
      phone: '9',
      name: undefined,
      email: undefined,
    });
  });

  it('only updates guests that belong to the authorised holiday', async () => {
    db.guestList.update.mockResolvedValue(entry());
    await patch({ notes: 'n' });
    expect(db.guestList.update.mock.calls[0][0].where).toMatchObject({
      holidayId: HOLIDAY,
    });
  });

  it('returns 500 when the database fails', async () => {
    db.guestList.update.mockRejectedValue(new Error('db'));
    expect((await readJson(await patch({ notes: 'n' }))).status).toBe(500);
  });
});

describe('DELETE /guest-lists', () => {
  it('needs a guestId', async () => {
    const { status, body } = await readJson(
      await DELETE(apiRequest('/x', 'DELETE'), ctx),
    );
    expect(status).toBe(400);
    expect(body.error[0].message).toBe('Guest ID is required');
  });

  it('deletes the entry', async () => {
    const { status, body } = await readJson(
      await DELETE(apiRequest(`/x?guestId=${GUEST}`, 'DELETE'), ctx),
    );
    expect(status).toBe(200);
    expect(body.data).toEqual({ success: true });
    expect(db.guestList.delete).toHaveBeenCalledWith({
      where: { id: GUEST, holidayId: HOLIDAY },
    });
  });

  it('only deletes guests that belong to the authorised holiday', async () => {
    await DELETE(apiRequest(`/x?guestId=${GUEST}`, 'DELETE'), ctx);
    expect(db.guestList.delete.mock.calls[0][0].where).toMatchObject({
      holidayId: HOLIDAY,
    });
  });

  it('returns 500 when the database fails', async () => {
    db.guestList.delete.mockRejectedValue(new Error('db'));
    expect(
      (
        await readJson(
          await DELETE(apiRequest(`/x?guestId=${GUEST}`, 'DELETE'), ctx),
        )
      ).status,
    ).toBe(500);
  });
});

describe('GET /guest-lists', () => {
  it("lists the holiday's guests with their contacts, newest first", async () => {
    db.guestList.findMany.mockResolvedValue([entry()]);
    const { status, body } = await readJson(await GET(apiRequest('/x'), ctx));
    expect(status).toBe(200);
    expect(body.data).toEqual([entry()]);
    expect(db.guestList.findMany).toHaveBeenCalledWith({
      where: { holidayId: HOLIDAY },
      include: { contact: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('returns 500 when the database fails', async () => {
    db.guestList.findMany.mockRejectedValue(new Error('db'));
    expect((await readJson(await GET(apiRequest('/x'), ctx))).status).toBe(500);
  });
});
