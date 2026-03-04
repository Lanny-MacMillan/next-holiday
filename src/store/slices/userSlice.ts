import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  createSelector,
} from '@reduxjs/toolkit';

export interface User {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  isInDb?: boolean;
  subscriptionPlan?: 'free' | 'plus';
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  id?: string;
  isFirstLogin?: boolean;
  lastUpdated?: string;
}

interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: UserState = {
  user: null,
  loading: false,
  error: null,
  initialized: false,
};

// Async thunk to check if user exists in DB
export const checkUserInDb = createAsyncThunk(
  'user/checkUserInDb',
  async (userSub: string) => {
    // Simulate API call to check if user exists in DB
    const response = await new Promise<{ isInDb: boolean }>(resolve => {
      setTimeout(() => {
        // Simulate that user is not in DB (first login)
        resolve({ isInDb: false });
      }, 500);
    });
    return response;
  },
);

// Async thunk to add user to DB
export const addUserToDb = createAsyncThunk(
  'user/addUserToDb',
  async (userData: Omit<User, 'isInDb'>) => {
    // Simulate API call to add user to DB
    const response = await new Promise<User>(resolve => {
      setTimeout(() => {
        resolve({ ...userData, isInDb: true });
      }, 500);
    });
    return response;
  },
);

// Async thunk to upgrade user subscription
export const upgradeUser = createAsyncThunk(
  'user/upgradeUser',
  async ({
    auth0Sub,
    plan = 'plus',
  }: {
    auth0Sub: string;
    plan?: 'free' | 'plus';
  }) => {
    const response = await fetch('/api/upgrade-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth0Sub,
        plan,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upgrade user');
    }

    const result = await response.json();
    return result.user;
  },
);

let setUserCallCount = 0;

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      setUserCallCount++;

      if (!action.payload) {
        state.user = null;
        state.initialized = true;
        return;
      }

      // If we have an existing user and this is the same user
      if (state.user && action.payload.sub === state.user.sub) {
        // Check if new payload has subscription data or if we should preserve existing
        const hasSubscriptionData = 'subscriptionPlan' in action.payload;

        if (hasSubscriptionData) {
          // New payload has subscription data - use it
          state.user = {
            ...state.user,
            ...action.payload,
          };
        } else {
          // New payload doesn't have subscription data - preserve existing
          const preservedSubscription = {
            subscriptionPlan: state.user.subscriptionPlan,
            subscriptionStartDate: state.user.subscriptionStartDate,
            subscriptionEndDate: state.user.subscriptionEndDate,
          };
          state.user = {
            ...state.user,
            ...action.payload,
            ...preservedSubscription,
          };
        }
      } else {
        // New user or no existing user
        state.user = action.payload;
      }

      state.initialized = true;
    },
    clearUser: state => {
      state.user = null;
      state.initialized = true;
    },
    clearError: state => {
      state.error = null;
    },
    updateSubscription: (
      state,
      action: PayloadAction<{
        subscriptionPlan: 'free' | 'plus';
        subscriptionStartDate?: string;
        subscriptionEndDate?: string;
      }>,
    ) => {
      if (state.user) {
        state.user.subscriptionPlan = action.payload.subscriptionPlan;
        state.user.subscriptionStartDate = action.payload.subscriptionStartDate;
        state.user.subscriptionEndDate = action.payload.subscriptionEndDate;
      }
    },
  },

  extraReducers: builder => {
    builder
      // Check user in DB
      .addCase(checkUserInDb.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkUserInDb.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user) {
          state.user.isInDb = action.payload.isInDb;
        }
      })
      .addCase(checkUserInDb.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to check user in DB';
      })
      // Add user to DB
      .addCase(addUserToDb.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addUserToDb.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(addUserToDb.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add user to DB';
      })
      // Upgrade user
      .addCase(upgradeUser.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(upgradeUser.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user) {
          state.user.subscriptionPlan = action.payload.subscriptionPlan;
          state.user.subscriptionStartDate = action.payload.subscriptionStartDate;
          state.user.subscriptionEndDate = action.payload.subscriptionEndDate;
        }
      })
      .addCase(upgradeUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to upgrade user';
      });
  },
});

export const { setUser, clearUser, clearError, updateSubscription } =
  userSlice.actions;

// Selectors
export const selectUser = (state: { user: UserState }) => state.user.user;

export const selectUserSubscriptionPlan = (state: { user: UserState }) => {
  const plan = state.user.user?.subscriptionPlan || 'free';

  return plan;
};

export const selectIsUserPlusMember = (state: { user: UserState }) => {
  const isPlusMember = state.user.user?.subscriptionPlan === 'plus';

  return isPlusMember;
};

export const selectUserSubscriptionData = createSelector(
  (state: { user: UserState }) => state.user.user,
  user => ({
    plan: user?.subscriptionPlan || 'free',
    startDate: user?.subscriptionStartDate,
    endDate: user?.subscriptionEndDate,
  }),
);

export const selectUserLoading = (state: { user: UserState }) => state.user.loading;
export const selectUserError = (state: { user: UserState }) => state.user.error;
export const selectUserInitialized = (state: { user: UserState }) =>
  state.user.initialized;

export default userSlice.reducer;
