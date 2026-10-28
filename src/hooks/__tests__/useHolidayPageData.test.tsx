/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { clearHomeData, setHomeData } from '@/store/slices/homeSlice';
import { useHolidayPageData } from '../useHolidayPageData';

const formMutation = {
  holidayId: 'h-1' as string | null,
  mutation: { name: 'mutation' },
  isLoading: false,
  error: null,
  auth0User: { sub: 'auth0|me' },
};
jest.mock('@/hooks/useFormModalMutation', () => ({
  useFormModalMutation: () => formMutation,
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);

const task = (category: string, isCompleted = false) => ({ category, isCompleted });
const holiday = (over: Record<string, unknown> = {}) => ({
  holidayId: 'h-1',
  holiday: 'Christmas',
  tasks: [],
  gifts: [],
  cards: [],
  guestLists: [],
  ...over,
});

const load = (over: Record<string, unknown> = {}) => {
  act(() => {
    store.dispatch(setHomeData({ holidayPreferences: [holiday(over)] } as never));
  });
  return renderHook(() => useHolidayPageData(), { wrapper }).result.current;
};
const progress = (over: Record<string, unknown>, key: string) =>
  load(over).getProgressData(key);

beforeEach(() => {
  formMutation.holidayId = 'h-1';
  act(() => {
    store.dispatch(clearHomeData());
  });
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('useHolidayPageData', () => {
  it('passes through the form mutation state and the matching holiday', () => {
    const data = load();
    expect(data).toMatchObject({
      holidayId: 'h-1',
      auth0User: { sub: 'auth0|me' },
      mutation: { name: 'mutation' },
      isLoading: false,
      error: null,
      homeInitialized: true,
    });
    expect(data.holidayData.holiday).toBe('Christmas');
    expect(data.holidayPreferences).toHaveLength(1);
  });

  describe('getProgressData', () => {
    it('is empty before the home data has loaded', () => {
      const { result } = renderHook(() => useHolidayPageData(), { wrapper });
      expect(result.current.getProgressData('gifts')).toEqual({
        total: 0,
        completed: 0,
        progress: 0,
      });
    });

    it('is empty when this holiday is not in the data', () => {
      formMutation.holidayId = 'other';
      expect(progress({}, 'gifts')).toEqual({ total: 0, completed: 0, progress: 0 });
    });

    it.each(['giftList', 'gifts'])('counts completed gifts for %s', key => {
      const gifts = [
        { isCompleted: true },
        { isCompleted: false },
        { isCompleted: true },
        { isCompleted: false },
      ];
      expect(progress({ gifts }, key)).toEqual({
        total: 4,
        completed: 2,
        progress: 50,
      });
    });

    it('rounds the percentage', () => {
      const gifts = [
        { isCompleted: true },
        { isCompleted: false },
        { isCompleted: false },
      ];
      expect(progress({ gifts }, 'gifts').progress).toBe(33);
    });

    it('counts guests as done when they have confirmed', () => {
      const guestLists = [
        { rsvpStatus: 'confirmed' },
        { rsvpStatus: 'pending' },
        { rsvpStatus: 'declined' },
      ];
      expect(progress({ guestLists }, 'guestList')).toEqual({
        total: 3,
        completed: 1,
        progress: 33,
      });
    });

    it.each([
      ['dateIdeas', 'Date Ideas'],
      ['reservations', 'Reservations'],
      ['events', 'Events'],
      ['decorations', 'Decorations'],
      ['resolutions', 'Resolutions'],
      ['candleLighting', 'Candle Lighting'],
      ['trickOrTreatPrep', 'Trick or Treat Prep'],
      ['costumeIdeas', 'Costume Ideas'],
      ['mealPlanning', 'Meal Planning'],
      ['partyPlanning', 'Party Planning'],
      ['games', 'Games'],
    ])('%s counts only %s tasks', (key, category) => {
      const tasks = [
        task(category, true),
        task(category),
        task('Something else', true),
      ];
      expect(progress({ tasks }, key)).toEqual({
        total: 2,
        completed: 1,
        progress: 50,
      });
    });

    it('reads a category straight from a "tasks:Category" key', () => {
      const tasks = [task('Games', true), task('Games', true), task('Food', true)];
      expect(progress({ tasks }, 'tasks:Games')).toEqual({
        total: 2,
        completed: 2,
        progress: 100,
      });
    });

    it('is zero for a "tasks:" key when the holiday has no tasks array', () => {
      expect(progress({ tasks: undefined }, 'tasks:Games')).toEqual({
        total: 0,
        completed: 0,
        progress: 0,
      });
    });

    describe('cards', () => {
      it('uses Cards tasks when there are any', () => {
        const tasks = [task('Cards', true), task('Cards')];
        const cards = [{ isCompleted: true }];
        expect(progress({ tasks, cards }, 'cards')).toEqual({
          total: 2,
          completed: 1,
          progress: 50,
        });
      });

      it('falls back to the cards collection when there are no Cards tasks', () => {
        const cards = [
          { isCompleted: true },
          { isCompleted: true },
          { isCompleted: false },
        ];
        expect(progress({ tasks: [task('Other')], cards }, 'cards')).toEqual({
          total: 3,
          completed: 2,
          progress: 67,
        });
      });

      it('uses the cards collection when there is no tasks array', () => {
        const cards = [{ isCompleted: true }];
        expect(progress({ tasks: undefined, cards }, 'cards').total).toBe(1);
      });

      it('logs and returns zero when there is nothing at all', () => {
        expect(progress({ tasks: undefined, cards: [] }, 'cards')).toEqual({
          total: 0,
          completed: 0,
          progress: 0,
        });
        expect(console.error).toHaveBeenCalledWith(
          'No cards or tasks data found for progress calculation',
        );
      });
    });

    describe('general tasks', () => {
      it('leaves out tasks that belong to another section', () => {
        const tasks = [
          task('Tasks', true),
          task('To-Do'),
          task('Cards', true),
          task('Events'),
          task('Meal Planning'),
          task('Candle Lighting'),
          task('Shopping', true),
        ];
        expect(progress({ tasks }, 'tasks')).toEqual({
          total: 3,
          completed: 2,
          progress: 67,
        });
      });
    });

    it('is zero for an unknown key with no matching tasks', () => {
      expect(progress({ tasks: [task('Games')] }, 'nothing')).toEqual({
        total: 0,
        completed: 0,
        progress: 0,
      });
    });
  });
});
