import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import { HomeData } from '@/types/home';

/**
 * Centralized selectors for home data
 * Use these instead of ad-hoc selectors throughout the app
 */

// Base selectors
export const selectHomeData = (state: RootState): HomeData | null => state.home.data;

export const selectHomeInitialized = (state: RootState): boolean =>
  state.home.initialized;

export const selectHomeLoading = (state: RootState): boolean => state.home.loading;

export const selectHomeError = (state: RootState): string | null => state.home.error;

// Holiday-specific selectors (memoized)
export const selectHolidayPreferences = createSelector(
  [selectHomeData],
  homeData => homeData?.holidayPreferences || [],
);

export const selectHolidayPrefById = createSelector(
  [
    selectHolidayPreferences,
    (_: RootState, holidayId: string | null | undefined) => holidayId,
  ],
  (holidayPreferences, holidayId) => {
    if (!holidayId) return null;
    return holidayPreferences.find(h => h.holidayId === holidayId) || null;
  },
);

export const selectHolidayBudgetById = createSelector(
  [selectHolidayPrefById],
  holidayPref => holidayPref?.budget,
);

export const selectHolidayCountdownById = createSelector(
  [selectHolidayPrefById],
  holidayPref => holidayPref?.countdownTimer,
);

// Contact selectors (memoized)
export const selectContacts = createSelector(
  [selectHomeData],
  homeData => homeData?.contacts || [],
);

export const selectContactById = createSelector(
  [selectContacts, (_: RootState, contactId: string) => contactId],
  (contacts, contactId) => contacts.find(c => c.id === contactId) || null,
);

// User and account selectors (memoized)
export const selectUser = createSelector(
  [selectHomeData],
  homeData => homeData?.user || null,
);

export const selectAccount = createSelector(
  [selectHomeData],
  homeData => homeData?.account || null,
);

// Setup state selectors (memoized)
export const selectNeedsUserSetup = createSelector(
  [selectHomeData],
  homeData => homeData?.needsUserSetup || false,
);

export const selectNeedsHolidaySelection = createSelector(
  [selectHomeData],
  homeData => homeData?.needsHolidaySelection || false,
);

// Utility selectors for common patterns (memoized)
export const selectHolidayIdByKey = createSelector(
  [selectHolidayPreferences, (_: RootState, holidayKey: string) => holidayKey],
  (holidayPreferences, holidayKey) => {
    if (!holidayPreferences.length || !holidayKey) return null;

    // Try to find by exact holiday type match first
    const preference = holidayPreferences.find(pref => pref.holiday === holidayKey);
    if (preference?.holidayId) {
      return preference.holidayId;
    }

    // Fallback: try normalized matching for edge cases
    const normalizedKey = holidayKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fallbackPreference = holidayPreferences.find(
      pref =>
        pref.holiday?.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedKey,
    );

    if (fallbackPreference?.holidayId) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Found holiday ID using fallback matching:', {
          requested: holidayKey,
          found: fallbackPreference.holiday,
          holidayId: fallbackPreference.holidayId,
        });
      }
      return fallbackPreference.holidayId;
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '❌ No holiday ID found for key:',
        holidayKey,
        'Available preferences:',
        holidayPreferences.map(p => ({ holiday: p.holiday, id: p.holidayId })),
      );
    }
    return null;
  },
);

export const selectHolidayIdByRoute = createSelector(
  [selectHolidayPreferences, (_: RootState, route: string) => route],
  (holidayPreferences, route) => {
    if (!holidayPreferences.length) return null;

    // Map route to holiday type
    const routeToHoliday: Record<string, string> = {
      '/christmas': 'Christmas',
      '/hanukkah': 'Hanukkah',
      '/kwanzaa': 'Kwanzaa',
      '/new-year': 'New Year',
      '/valentines': "Valentine's Day",
      '/easter': 'Easter',
      '/halloween': 'Halloween',
      '/thanksgiving': 'Thanksgiving',
      '/mothers-day': "Mother's Day",
      '/fathers-day': "Father's Day",
      '/fourth-of-july': 'Fourth of July',
      '/birthday': 'Birthday',
      '/anniversary': 'Anniversary',
      '/graduation': 'Graduation',
      '/baby-shower': 'Baby Shower',
    };

    const holidayType = routeToHoliday[route];
    if (!holidayType) return null;

    const holidayPref = holidayPreferences.find(h => h.holiday === holidayType);
    return holidayPref?.holidayId || null;
  },
);
