import { createAsyncThunk } from '@reduxjs/toolkit';
import { setHomeData } from '@/store/slices/homeSlice';
import { setUser } from '@/store/slices/userSlice';
import { setMany as setBudgets } from '@/store/slices/budgetsSlice';
import type { AppDispatch, RootState } from '@/store';
import type { HomeData } from '@/types/home';

type Auth0Profile = {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
};

// Upserted values go through each endpoint's transformResponse, which expects
// the API envelope, so wrap them the way the server would.
const asApiResponse = (data: unknown[]) => ({ success: true, data }) as never;

// The home page and the shared data initializer both ask for this; they share one request.
let inFlight: Promise<HomeData> | null = null;

// Loads /api/home and fans it out to the slices and RTK Query caches that holiday pages read.
const createAppThunk = createAsyncThunk.withTypes<{
  state: RootState;
  dispatch: AppDispatch;
}>();

export const loadHome = createAppThunk(
  'home/load',
  (auth0User: Auth0Profile, { dispatch, getState }) => {
    inFlight ??= (async () => {
      const response = await fetch('/api/home');
      if (!response.ok) {
        throw new Error('Failed to fetch home data');
      }

      const result = await response.json();
      const data = result.data;
      const currentUser = getState().user.user;
      dispatch(setHomeData(data));

      // Dispatch user data to Redux store with subscription info
      if (data?.user) {
        // Keep a downgrade made in the app in the last 30 seconds; anything else the server says wins
        const wasRecentlyDowngraded =
          currentUser?.subscriptionPlan === 'free' &&
          currentUser?.downgradedAt &&
          Date.now() - new Date(currentUser.downgradedAt).getTime() < 30000;

        const subscriptionPlan = wasRecentlyDowngraded
          ? 'free' // Preserve recent downgrade
          : data.user.subscriptionPlan || 'free';

        dispatch(
          setUser({
            sub: data.user.auth0Sub || auth0User.sub, // Fallback to auth0User.sub if API doesn't have it
            email: data.user.email,
            name: data.user.name,
            picture: data.user.picture,
            isInDb: true, // If we have homeData, user is in DB
            subscriptionPlan: subscriptionPlan,
            subscriptionStartDate: wasRecentlyDowngraded
              ? undefined
              : data.user.subscriptionStartDate,
            subscriptionEndDate: wasRecentlyDowngraded
              ? undefined
              : data.user.subscriptionEndDate,
            lastUpdated: wasRecentlyDowngraded
              ? currentUser.lastUpdated
              : new Date().toISOString(),
          }),
        );
      }

      // Also populate budgets slice with budget data from home data
      if (data?.holidayPreferences?.length) {
        const budgets = data.holidayPreferences
          .filter((pref: any) => pref.budget !== undefined)
          .map((pref: any) => ({
            holidayId: pref.holidayId,
            targetAmount: pref.budget,
            spentAmount: 0, // TODO: Calculate from gifts/tasks
            updatedAt: new Date().toISOString(),
          }));

        if (budgets.length > 0) {
          dispatch(setBudgets(budgets));
        }
      }

      // Prefill RTK Query cache with home data to prevent duplicate fetches
      if (data?.holidayPreferences?.length) {
        // Import the API slice to access util methods
        const { api } = await import('@/store/api');

        // Extract all gifts, cards, and tasks from home data
        // This ensures RTK Query hooks resolve from cache without firing network requests
        const allGifts = data.holidayPreferences.flatMap(
          (pref: any) => pref.gifts || [],
        );
        const allCards = data.holidayPreferences.flatMap(
          (pref: any) => pref.cards || [],
        );
        const allTasks = data.holidayPreferences.flatMap(
          (pref: any) => pref.tasks || [],
        );

        // Upsert into RTK Query cache for each endpoint
        dispatch(
          api.util.upsertQueryData(
            'getAllGifts',
            { auth0User },
            asApiResponse(allGifts),
          ),
        );
        dispatch(
          api.util.upsertQueryData(
            'getAllCards',
            { auth0User },
            asApiResponse(allCards),
          ),
        );
        dispatch(
          api.util.upsertQueryData(
            'getAllTasks',
            { auth0User },
            asApiResponse(allTasks),
          ),
        );

        // Also upsert per-holiday data to prevent individual holiday page fetches
        data.holidayPreferences.forEach((pref: any) => {
          if (pref.holidayId) {
            dispatch(
              api.util.upsertQueryData(
                'getGifts',
                { holidayId: pref.holidayId, auth0User },
                asApiResponse(pref.gifts || []),
              ),
            );
            dispatch(
              api.util.upsertQueryData(
                'getCards',
                { holidayId: pref.holidayId, auth0User },
                asApiResponse(pref.cards || []),
              ),
            );
            dispatch(
              api.util.upsertQueryData(
                'getTasks',
                { holidayId: pref.holidayId, auth0User },
                asApiResponse(pref.tasks || []),
              ),
            );

            // Cache filtered task categories
            if (pref.events) {
              dispatch(
                api.util.upsertQueryData(
                  'getEvents',
                  { holidayId: pref.holidayId, auth0User },
                  asApiResponse(pref.events),
                ),
              );
            }
            if (pref.decorations) {
              dispatch(
                api.util.upsertQueryData(
                  'getDecorations',
                  { holidayId: pref.holidayId, auth0User },
                  asApiResponse(pref.decorations),
                ),
              );
            }
            if (pref.kwanzaaPrinciples) {
              dispatch(
                api.util.upsertQueryData(
                  'getKwanzaaPrinciples',
                  { holidayId: pref.holidayId, auth0User },
                  asApiResponse(pref.kwanzaaPrinciples),
                ),
              );
            }
          }
        });
      }

      return data as HomeData;
    })().finally(() => {
      inFlight = null;
    });
    return inFlight;
  },
);
