import {
  shouldFetchHolidayData,
  shouldSkipHolidayQuery,
  getHolidayDataFromRedux,
  getBudgetFromRedux,
} from '../holidayData';
import { RootState } from '@/store';

// Mock Redux state for testing
const createMockState = (overrides: Partial<RootState> = {}): RootState =>
  ({
    home: {
      data: {
        holidayPreferences: [
          {
            holiday: 'Christmas',
            holidayId: 'christmas-123',
            budget: 500,
            countdownTimer: '2024-12-25T00:00:00Z',
          },
          {
            holiday: 'Hanukkah',
            holidayId: 'hanukkah-456',
            budget: 300,
            countdownTimer: '2024-12-07T00:00:00Z',
          },
        ],
        contacts: [],
        user: null,
        account: null,
        needsUserSetup: false,
        needsHolidaySelection: false,
      },
      initialized: true,
      loading: false,
      error: null,
    },
  }) as RootState;

describe('holidayData utilities', () => {
  describe('shouldFetchHolidayData', () => {
    it('should return false when holidayId is null/undefined', () => {
      const state = createMockState();
      expect(shouldFetchHolidayData(null, state)).toBe(false);
      expect(shouldFetchHolidayData(undefined, state)).toBe(false);
    });

    it('should return true when home data is not initialized', () => {
      const state = createMockState({
        home: {
          ...createMockState().home,
          initialized: false,
        },
      });
      expect(shouldFetchHolidayData('christmas-123', state)).toBe(true);
    });

    it('should return true when holiday preferences are empty', () => {
      const state = createMockState({
        home: {
          ...createMockState().home,
          data: {
            ...createMockState().home.data,
            holidayPreferences: [],
          },
        },
      });
      expect(shouldFetchHolidayData('christmas-123', state)).toBe(true);
    });

    it('should return true when holiday is not found in preferences', () => {
      const state = createMockState();
      expect(shouldFetchHolidayData('unknown-holiday', state)).toBe(true);
    });

    it('should return false when holiday exists in preferences', () => {
      const state = createMockState();
      expect(shouldFetchHolidayData('christmas-123', state)).toBe(false);
      expect(shouldFetchHolidayData('hanukkah-456', state)).toBe(false);
    });
  });

  describe('shouldSkipHolidayQuery', () => {
    it('should return true when holidayId is missing', () => {
      const state = createMockState();
      const auth0User = { sub: 'user-123' };
      expect(shouldSkipHolidayQuery(null, auth0User, state)).toBe(true);
      expect(shouldSkipHolidayQuery(undefined, auth0User, state)).toBe(true);
    });

    it('should return true when auth0User is missing', () => {
      const state = createMockState();
      expect(shouldSkipHolidayQuery('christmas-123', null, state)).toBe(true);
      expect(shouldSkipHolidayQuery('christmas-123', undefined, state)).toBe(true);
    });

    it('should return true when shouldFetchHolidayData returns false', () => {
      const state = createMockState();
      const auth0User = { sub: 'user-123' };
      expect(shouldSkipHolidayQuery('christmas-123', auth0User, state)).toBe(true);
    });

    it('should return false when shouldFetchHolidayData returns true', () => {
      const state = createMockState({
        home: {
          ...createMockState().home,
          initialized: false,
        },
      });
      const auth0User = { sub: 'user-123' };
      expect(shouldSkipHolidayQuery('christmas-123', auth0User, state)).toBe(false);
    });
  });

  describe('getHolidayDataFromRedux', () => {
    it('should return null when holidayId is missing', () => {
      const state = createMockState();
      expect(getHolidayDataFromRedux(null, state)).toBe(null);
      expect(getHolidayDataFromRedux(undefined, state)).toBe(null);
    });

    it('should return null when home data is missing', () => {
      const state = createMockState({
        home: {
          ...createMockState().home,
          data: null,
        },
      });
      expect(getHolidayDataFromRedux('christmas-123', state)).toBe(null);
    });

    it('should return null when holiday preferences are missing', () => {
      const state = createMockState({
        home: {
          ...createMockState().home,
          data: {
            ...createMockState().home.data,
            holidayPreferences: null,
          },
        },
      });
      expect(getHolidayDataFromRedux('christmas-123', state)).toBe(null);
    });

    it('should return holiday data when found', () => {
      const state = createMockState();
      const result = getHolidayDataFromRedux('christmas-123', state);
      expect(result).toEqual({
        holiday: 'Christmas',
        holidayId: 'christmas-123',
        budget: 500,
        countdownTimer: '2024-12-25T00:00:00Z',
      });
    });

    it('should return null when holiday not found', () => {
      const state = createMockState();
      expect(getHolidayDataFromRedux('unknown-holiday', state)).toBe(null);
    });
  });

  describe('getBudgetFromRedux', () => {
    it('should return undefined when holidayId is missing', () => {
      const state = createMockState();
      expect(getBudgetFromRedux(null, state)).toBeUndefined();
      expect(getBudgetFromRedux(undefined, state)).toBeUndefined();
    });

    it('should return budget when holiday exists', () => {
      const state = createMockState();
      expect(getBudgetFromRedux('christmas-123', state)).toBe(500);
      expect(getBudgetFromRedux('hanukkah-456', state)).toBe(300);
    });

    it('should return undefined when holiday not found', () => {
      const state = createMockState();
      expect(getBudgetFromRedux('unknown-holiday', state)).toBeUndefined();
    });
  });
});
