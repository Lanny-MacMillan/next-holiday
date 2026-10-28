/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';

const mutations: Record<string, jest.Mock> = {};
jest.mock(
  '@/store/api',
  () =>
    new Proxy(
      {},
      {
        get: (_t, name: string) => {
          if (!/^use.+Mutation$/.test(name)) return undefined;
          mutations[name] ??= jest.fn();
          return () => [mutations[name]];
        },
      },
    ),
);

const user = { sub: 'auth0|me' };
const HOLIDAY = 'h-1';

type Flag = 'createLoading' | 'updateLoading' | 'deleteLoading';
const cases: Array<[string, string, unknown[], Record<string, unknown>, Flag]> = [
  [
    'createGift',
    'useCreateGiftMutation',
    [{ name: 'g' }],
    { payload: { name: 'g' } },
    'createLoading',
  ],
  [
    'editGift',
    'useEditGiftMutation',
    ['g1', { name: 'g' }],
    { giftId: 'g1', payload: { name: 'g' } },
    'updateLoading',
  ],
  [
    'updateGift',
    'useUpdateGiftMutation',
    ['g1', true],
    { giftId: 'g1', isCompleted: true },
    'updateLoading',
  ],
  ['deleteGift', 'useDeleteGiftMutation', ['g1'], { giftId: 'g1' }, 'deleteLoading'],
  [
    'createTask',
    'useCreateTaskMutation',
    [{ title: 't' }],
    { payload: { title: 't' } },
    'createLoading',
  ],
  [
    'updateTask',
    'useUpdateTaskMutation',
    ['t1', { title: 't' }],
    { taskId: 't1', updates: { title: 't' } },
    'updateLoading',
  ],
  [
    'toggleTask',
    'useToggleTaskCompletionMutation',
    ['t1', false],
    { taskId: 't1', isCompleted: false },
    'updateLoading',
  ],
  ['deleteTask', 'useDeleteTaskMutation', ['t1'], { taskId: 't1' }, 'deleteLoading'],
  [
    'createCard',
    'useCreateCardMutation',
    [{ to: 'c' }],
    { payload: { to: 'c' } },
    'createLoading',
  ],
  [
    'updateCard',
    'useUpdateCardMutation',
    ['c1', true],
    { cardId: 'c1', isCompleted: true },
    'updateLoading',
  ],
  [
    'editCard',
    'useEditCardMutation',
    ['c1', { to: 'c' }],
    { cardId: 'c1', payload: { to: 'c' } },
    'updateLoading',
  ],
  ['deleteCard', 'useDeleteCardMutation', ['c1'], { cardId: 'c1' }, 'deleteLoading'],
  [
    'createGuest',
    'useCreateGuestMutation',
    [{ name: 'n' }],
    { payload: { name: 'n' } },
    'createLoading',
  ],
  [
    'updateGuest',
    'useUpdateGuestMutation',
    ['u1', { name: 'n' }],
    { guestId: 'u1', name: 'n' },
    'updateLoading',
  ],
  [
    'deleteGuest',
    'useDeleteGuestMutation',
    ['u1'],
    { guestId: 'u1' },
    'deleteLoading',
  ],
  [
    'createEvent',
    'useCreateEventMutation',
    [{ title: 'e' }],
    { payload: { title: 'e' } },
    'createLoading',
  ],
  [
    'updateEvent',
    'useUpdateEventMutation',
    ['e1', true],
    { taskId: 'e1', isCompleted: true },
    'updateLoading',
  ],
  [
    'editEvent',
    'useEditEventMutation',
    ['e1', { title: 'e' }],
    { taskId: 'e1', payload: { title: 'e' } },
    'updateLoading',
  ],
  [
    'deleteEvent',
    'useDeleteEventMutation',
    ['e1'],
    { taskId: 'e1' },
    'deleteLoading',
  ],
];

const setup = (holidayId: string | null = HOLIDAY, auth0User: unknown = user) =>
  renderHook(() => useHolidayMutations({ holidayId, auth0User }));

beforeEach(() => {
  Object.values(mutations).forEach(m => m.mockReset());
});

describe.each(cases)('%s', (fn, hook, args, expected, flag) => {
  const call = (result: { current: Record<string, any> }) =>
    result.current[fn](...args);
  const ok = (value: unknown) =>
    mutations[hook].mockReturnValue({ unwrap: () => Promise.resolve(value) });

  it('sends the holiday, user and arguments to the mutation and returns its result', async () => {
    mutations[hook] ??= jest.fn();
    ok({ saved: true });
    const { result } = setup();
    let returned: unknown;
    await act(async () => {
      returned = await call(result);
    });
    expect(mutations[hook]).toHaveBeenCalledWith({
      holidayId: HOLIDAY,
      ...expected,
      auth0User: user,
    });
    expect(returned).toEqual({ saved: true });
    expect(result.current[flag]).toBe(false);
  });

  it('flags loading while in flight and clears it after a failure', async () => {
    let fail!: (e: Error) => void;
    mutations[hook].mockReturnValue({
      unwrap: () => new Promise((_, reject) => (fail = reject)),
    });
    const { result } = setup();

    let pending!: Promise<unknown>;
    act(() => {
      pending = call(result).catch((e: Error) => e);
    });
    expect(result.current[flag]).toBe(true);

    await act(async () => {
      fail(new Error('nope'));
      await pending;
    });
    expect(await pending).toEqual(new Error('nope'));
    expect(result.current[flag]).toBe(false);
  });

  it.each([
    ['holiday id', null, user],
    ['user', HOLIDAY, null],
  ])(
    'refuses without a %s, without calling the API',
    async (_label, holidayId, auth0User) => {
      const { result } = setup(holidayId, auth0User);
      await expect(call(result)).rejects.toThrow('Missing holiday ID or user');
      expect(mutations[hook]).not.toHaveBeenCalled();
    },
  );
});
