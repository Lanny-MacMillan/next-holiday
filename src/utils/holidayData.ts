import { RootState } from '@/store';

/**
 * Determines if holiday data should be fetched from RTK Query
 * @param holidayId - The holiday ID to check
 * @param state - The Redux store state
 * @returns true if data should be fetched, false if it exists in Redux
 */
export function shouldFetchHolidayData(
  holidayId: string | null | undefined,
  state: RootState,
): boolean {
  // If no holidayId, we can't fetch
  if (!holidayId) return false;

  // Check if home data is initialized and contains this holiday
  const homeData = state.home.data;
  const homeInitialized = state.home.initialized;

  // If home data is not initialized, we need to fetch
  if (!homeInitialized || !homeData?.holidayPreferences) return true;

  // Check if this holiday exists in preferences
  const holidayPref = homeData.holidayPreferences.find(
    h => h.holidayId === holidayId,
  );
  if (!holidayPref) return true;

  // If home data is available and complete, don't fetch from API
  // This prevents duplicate network calls when navigating from home
  return false;
}

/**
 * Creates a skip condition for RTK Query hooks to prevent unnecessary API calls
 * @param holidayId - The holiday ID to check
 * @param auth0User - The authenticated user
 * @param state - The Redux store state
 * @returns true if the query should be skipped
 */
export function shouldSkipHolidayQuery(
  holidayId: string | null | undefined,
  auth0User: any,
  state: RootState,
): boolean {
  // Skip if no auth or no holidayId
  if (!auth0User || !holidayId) return true;

  // Skip if we should NOT fetch (i.e., data exists in Redux)
  return !shouldFetchHolidayData(holidayId, state);
}

/**
 * Gets holiday data from Redux home state if available
 * @param holidayId - The holiday ID to get data for
 * @param state - The Redux store state
 * @returns The holiday preference data or null if not found
 */
export function getHolidayDataFromRedux(
  holidayId: string | null | undefined,
  state: RootState,
) {
  if (!holidayId) {
    return null;
  }

  const homeData = state.home.data;
  if (!homeData?.holidayPreferences) {
    return null;
  }

  const foundHoliday = homeData.holidayPreferences.find(
    h => h.holidayId === holidayId,
  );

  return foundHoliday || null;
}

/**
 * Gets budget information from Redux home state
 * @param holidayId - The holiday ID to get budget for
 * @param state - The Redux store state
 * @returns The budget amount or undefined if not found
 */
export function getBudgetFromRedux(
  holidayId: string | null | undefined,
  state: RootState,
): number | undefined {
  const holidayData = getHolidayDataFromRedux(holidayId, state);
  return holidayData?.budget;
}

/**
 * Creates a skip condition for RTK Query hooks that handles cold entry scenarios
 * This should be used when you need to fetch data even if home data is not initialized
 * @param holidayId - The holiday ID to check
 * @param auth0User - The authenticated user
 * @param state - The Redux store state
 * @param allowColdEntry - Whether to allow fetching when home data is not initialized
 * @returns true if the query should be skipped
 */
export function shouldSkipHolidayQueryWithColdEntry(
  holidayId: string | null | undefined,
  auth0User: any,
  state: RootState,
  allowColdEntry: boolean = false,
): boolean {
  // Skip if no auth
  if (!auth0User) return true;

  // Skip if no holidayId
  if (!holidayId) return true;

  // If cold entry is allowed and home is not initialized, don't skip
  if (allowColdEntry && !state.home.initialized) return false;

  // Otherwise use the normal logic
  return !shouldFetchHolidayData(holidayId, state);
}
