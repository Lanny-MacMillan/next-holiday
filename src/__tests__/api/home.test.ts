/** @jest-environment node */
const getCurrentUser = jest.fn();
jest.mock('@/lib/auth', () => ({
  getCurrentUser: (...a: unknown[]) => getCurrentUser(...a),
  requireAuth: jest.fn(),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: require('@/__tests__/support/api').prismaMock,
}));

import {
  apiRequest,
  prismaMock as db,
  readJson,
  resetPrismaMock,
} from '@/__tests__/support/api';
import { GET } from '@/app/api/home/route';

const at = new Date('2025-03-04T05:06:07Z');
const iso = at.toISOString();
const user = {
  id: 'me-id',
  email: 'me@x.com',
  name: 'Me',
  picture: 'p.png',
  subscriptionPlan: 'plus',
  subscriptionStartDate: at,
  subscriptionEndDate: at,
  createdAt: at,
};
const contact = {
  id: 'c1',
  name: 'Ann',
  email: 'a@x.com',
  phone: '1',
  createdAt: at,
  updatedAt: at,
};
const prefs = {
  id: 'np1',
  assignmentNotifications: true,
  completionNotifications: true,
  inviteNotifications: true,
  emailNotifications: false,
  digestFrequency: 'immediate',
  createdAt: at,
  updatedAt: at,
};

const holiday = (over: Record<string, unknown> = {}) => ({
  id: 'h1',
  holidayType: 'Christmas',
  countdownTimer: at,
  budgets: [],
  gifts: [],
  cards: [],
  tasks: [],
  guestLists: [],
  ...over,
});

const get = async () => readJson(await GET(apiRequest('/api/home')));

beforeEach(() => {
  resetPrismaMock();
  getCurrentUser.mockReset().mockResolvedValue(user);
  db.account.findFirst.mockResolvedValue({ id: 'acc1', name: 'Acct' });
  db.holiday.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
  db.contact.findMany.mockResolvedValue([]);
  db.notificationPreferences.findUnique.mockResolvedValue(prefs);
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('GET /api/home', () => {
  it('asks the user to sign up when nobody is signed in', async () => {
    getCurrentUser.mockResolvedValue(null);
    const { status, body } = await get();

    expect(status).toBe(200);
    expect(body.data).toMatchObject({
      user: null,
      account: null,
      needsUserSetup: true,
      needsHolidaySelection: false,
    });
    expect(db.account.findFirst).not.toHaveBeenCalled();
  });

  it('asks for user setup when the user has no account yet', async () => {
    db.account.findFirst.mockResolvedValue(null);
    const { body } = await get();

    expect(body.data).toMatchObject({
      account: null,
      holidayPreferences: null,
      needsUserSetup: true,
      user: { id: 'me-id', subscriptionStartDate: iso, subscriptionPlan: 'plus' },
    });
    expect(db.holiday.findMany).not.toHaveBeenCalled();
  });

  it('flags holiday selection when the account has no holidays', async () => {
    const { body } = await get();
    expect(body.data).toMatchObject({
      needsUserSetup: false,
      needsHolidaySelection: true,
      holidayPreferences: [],
    });
  });

  it('returns the user, account, contacts and notification preferences', async () => {
    db.contact.findMany.mockResolvedValue([contact]);
    const { body } = await get();

    expect(body.data.user).toMatchObject({
      id: 'me-id',
      createdAt: iso,
      subscriptionEndDate: iso,
    });
    expect(body.data.account).toEqual({ id: 'acc1', name: 'Acct' });
    expect(body.data.contacts).toHaveLength(1);
    expect(body.data.notificationPreferences).toEqual({
      ...prefs,
      createdAt: iso,
      updatedAt: iso,
    });
    expect(db.contact.findMany).toHaveBeenCalledWith({
      where: { accountId: 'acc1' },
      orderBy: { name: 'asc' },
    });
  });

  it('creates default notification preferences the first time', async () => {
    db.notificationPreferences.findUnique.mockResolvedValue(null);
    db.notificationPreferences.create.mockResolvedValue(prefs);
    await get();

    expect(db.notificationPreferences.create.mock.calls[0][0].data).toEqual({
      userId: 'me-id',
      assignmentNotifications: true,
      completionNotifications: true,
      inviteNotifications: true,
      emailNotifications: false,
      digestFrequency: 'immediate',
    });
  });

  it('looks up owned holidays by account and shared ones through shares, excluding the user’s own account', async () => {
    await get();

    const [owned, shared] = db.holiday.findMany.mock.calls.map(
      (c: unknown[]) => (c[0] as { where: unknown }).where,
    );
    expect(owned).toEqual({ accountId: 'acc1' });
    expect(shared).toEqual({
      shares: { members: { some: { userId: 'me-id' } } },
      NOT: { accountId: 'acc1' },
    });
  });

  describe('each holiday entry', () => {
    const run = async (...holidays: ReturnType<typeof holiday>[]) => {
      db.holiday.findMany
        .mockReset()
        .mockResolvedValueOnce(holidays)
        .mockResolvedValueOnce([]);
      return (await get()).body.data.holidayPreferences;
    };

    it('carries the type, id, countdown and budget', async () => {
      const [entry] = await run(
        holiday({ budgets: [{ totalBudget: { toString: () => '250.5' } }] }),
      );
      expect(entry).toMatchObject({
        holiday: 'Christmas',
        holidayId: 'h1',
        countdownTimer: iso,
        budget: 250.5,
      });
    });

    it('leaves budget undefined when there is none', async () => {
      const [entry] = await run(holiday());
      expect(entry.budget).toBeUndefined();
    });

    it('lists shared holidays after owned ones', async () => {
      db.holiday.findMany
        .mockReset()
        .mockResolvedValueOnce([holiday({ id: 'own' })])
        .mockResolvedValueOnce([holiday({ id: 'shared', holidayType: 'Easter' })]);
      const list = (await get()).body.data.holidayPreferences;
      expect(list.map((h: { holidayId: string }) => h.holidayId)).toEqual([
        'own',
        'shared',
      ]);
    });

    it('names a gift’s recipient and assignee, with Unknown as the fallback', async () => {
      const gift = (id: string, extra: object) => ({
        id,
        createdAt: at,
        updatedAt: at,
        completedDate: null,
        ...extra,
      });
      const [entry] = await run(
        holiday({
          gifts: [
            gift('g1', {
              contact: { name: 'Ann' },
              assignedUser: { name: 'Bob' },
              assignedTo: 'u-bob',
            }),
            gift('g2', {
              contact: null,
              assignedUser: null,
              assignedTo: null,
              completedDate: at,
            }),
          ],
        }),
      );

      expect(entry.gifts[0]).toMatchObject({
        recipient: 'Ann',
        assignedTo: 'u-bob',
        assignedToName: 'Bob',
        createdAt: iso,
        completedDate: null,
      });
      expect(entry.gifts[1]).toMatchObject({
        recipient: 'Unknown',
        assignedToName: null,
        completedDate: iso,
      });
    });

    it('splits tasks by category and keeps them all in tasks', async () => {
      const tasks = [
        { id: 't1', category: 'Events' },
        { id: 't2', category: 'Decorations' },
        { id: 't3', category: 'Kwanzaa Principles' },
        { id: 't4', category: 'Shopping' },
      ];
      const [entry] = await run(holiday({ tasks }));

      expect(entry.tasks).toHaveLength(4);
      expect(entry.events).toEqual([tasks[0]]);
      expect(entry.decorations).toEqual([tasks[1]]);
      expect(entry.kwanzaaPrinciples).toEqual([tasks[2]]);
    });

    it('flattens guest lists with their contact, tolerating a missing contact or rsvp date', async () => {
      const guest = (id: string, extra: object) => ({
        id,
        holidayId: 'h1',
        contactId: 'c1',
        rsvpStatus: 'yes',
        notes: null,
        createdBy: 'me-id',
        createdAt: at,
        updatedAt: at,
        ...extra,
      });
      const [entry] = await run(
        holiday({
          guestLists: [
            guest('gl1', { rsvpDate: at, contact }),
            guest('gl2', { rsvpDate: null, contact: null }),
          ],
        }),
      );

      expect(entry.guestLists[0]).toMatchObject({
        id: 'gl1',
        rsvpDate: iso,
        contact: { id: 'c1', name: 'Ann', createdAt: iso },
      });
      expect(entry.guestLists[1]).toMatchObject({ id: 'gl2', contact: null });
      expect(entry.guestLists[1].rsvpDate).toBeUndefined();
    });
  });

  it('is 500 when the database fails', async () => {
    db.account.findFirst.mockRejectedValue(new Error('db down'));
    expect((await get()).status).toBe(500);
  });
});
