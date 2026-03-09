import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Budget {
  holidayId: string;
  targetAmount: number | null;
  spentAmount?: number;
  updatedAt: string;
}

interface BudgetsState {
  entities: Record<string, Budget>;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: BudgetsState = {
  entities: {},
  loading: false,
  error: null,
  initialized: false,
};

// Async thunks
export const fetchBudgets = createAsyncThunk(
  'budgets/fetchBudgets',
  async (request: { holidayIds: string[]; auth0User?: any }) => {
    const { holidayIds, auth0User } = request;

    if (holidayIds.length === 0) return [];

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication header if auth0User is provided
    if (auth0User) {
      headers['x-test-user'] = JSON.stringify({
        sub: auth0User.sub,
        email: auth0User.email,
        name: auth0User.name,
      });
    }

    // Fetch budgets for all holiday IDs
    const response = await fetch('/api/budgets', {
      method: 'POST',
      headers,
      body: JSON.stringify({ holidayIds }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch budgets');
    }

    const result = await response.json();
    // Extract data from the API response structure { success: true, data }
    return result.data || [];
  },
);

export const updateBudget = createAsyncThunk(
  'budgets/updateBudget',
  async (request: { holidayId: string; targetAmount: number; auth0User?: any }) => {
    const { holidayId, targetAmount, auth0User } = request;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication header if auth0User is provided
    if (auth0User) {
      headers['x-test-user'] = JSON.stringify({
        sub: auth0User.sub,
        email: auth0User.email,
        name: auth0User.name,
      });
    }

    const response = await fetch(`/api/budgets/${holidayId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ targetAmount }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update budget');
    }

    const result = await response.json();
    // Extract data from the API response structure { success: true, data }
    return result.data;
  },
);

const budgetsSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {
    setMany: (state, action: PayloadAction<Budget[]>) => {
      action.payload.forEach((budget: Budget) => {
        state.entities[budget.holidayId] = budget;
      });
      state.initialized = true;
    },
    setOne: (state, action: PayloadAction<Budget>) => {
      state.entities[action.payload.holidayId] = action.payload;
    },
    removeOne: (state, action: PayloadAction<string>) => {
      delete state.entities[action.payload];
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch budgets
      .addCase(fetchBudgets.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBudgets.fulfilled, (state, action) => {
        state.loading = false;
        action.payload.forEach((budget: Budget) => {
          state.entities[budget.holidayId] = budget;
        });
        state.initialized = true;
      })
      .addCase(fetchBudgets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch budgets';
      })
      // Update budget
      .addCase(updateBudget.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBudget.fulfilled, (state, action) => {
        state.loading = false;
        state.entities[action.payload.holidayId] = action.payload;
      })
      .addCase(updateBudget.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update budget';
      });
  },
});

// Selectors
export const selectBudgetByHolidayId = (
  state: { budgets: BudgetsState },
  holidayId: string,
) => state.budgets.entities[holidayId] ?? null;

export const selectBudgetByHolidaySlug = (
  state: { budgets: BudgetsState; holidays: any },
  slug: string,
) => {
  // This will need to be updated when we have a holidays slice
  // For now, we'll need to pass holidayId directly
  return null;
};

export const selectAllBudgets = (state: { budgets: BudgetsState }) =>
  Object.values(state.budgets.entities);

export const selectBudgetsLoading = (state: { budgets: BudgetsState }) =>
  state.budgets.loading;

export const selectBudgetsError = (state: { budgets: BudgetsState }) =>
  state.budgets.error;

export const selectBudgetsInitialized = (state: { budgets: BudgetsState }) =>
  state.budgets.initialized;

export const { setMany, setOne, removeOne, clearError } = budgetsSlice.actions;
export default budgetsSlice.reducer;
