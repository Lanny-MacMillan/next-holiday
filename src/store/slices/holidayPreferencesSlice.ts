import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface HolidayPreference {
  holiday: string;
  holidayId?: string; // Holiday ID from database (optional when saving new preferences)
  budget?: number;
  countdownTimer?: string; // ISO datetime string
}

export interface SaveHolidayPreferencesRequest {
  accountId: string;
  preferences: HolidayPreference[];
}

export interface FetchHolidayPreferencesRequest {
  accountId: string;
}

export interface HolidayPreferencesResponse {
  holiday: {
    id: string;
    accountId: string;
    holidayType: string;
    name: string;
    description?: string;
    startDate: string;
    endDate?: string;
    countdownTimer?: string;
    colorLight: string;
    colorDark: string;
    isCustom: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  };
  budget?: {
    id: string;
    holidayId: string;
    name: string;
    totalBudget: number;
    spentAmount: number;
    remainingAmount: number;
    currency: string;
    startDate: string;
    endDate: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface HolidayPreferencesState {
  loading: boolean;
  error: string | null;
  lastSaved: HolidayPreferencesResponse[] | null;
  preferences: HolidayPreference[] | null;
  initialized: boolean;
}

const initialState: HolidayPreferencesState = {
  loading: false,
  error: null,
  lastSaved: null,
  preferences: null,
  initialized: false,
};

// Async thunk to fetch holiday preferences
export const fetchHolidayPreferences = createAsyncThunk(
  'holidayPreferences/fetchHolidayPreferences',
  async (request: FetchHolidayPreferencesRequest & { auth0User?: any }) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication header if auth0User is provided
    if (request.auth0User) {
      headers['x-test-user'] = JSON.stringify({
        sub: request.auth0User.sub,
        email: request.auth0User.email,
        name: request.auth0User.name,
      });
    }

    const response = await fetch(
      `/api/holidays/preferences?accountId=${request.accountId}`,
      {
        method: 'GET',
        headers,
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch holiday preferences');
    }

    const result = await response.json();
    return result.data;
  },
);

// Async thunk to save holiday preferences
export const saveHolidayPreferences = createAsyncThunk(
  'holidayPreferences/saveHolidayPreferences',
  async (request: SaveHolidayPreferencesRequest & { auth0User?: any }) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication header if auth0User is provided
    if (request.auth0User) {
      headers['x-test-user'] = JSON.stringify({
        sub: request.auth0User.sub,
        email: request.auth0User.email,
        name: request.auth0User.name,
      });
    }

    const response = await fetch('/api/holidays/preferences', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        accountId: request.accountId,
        preferences: request.preferences,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to save holiday preferences';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        console.error('Holiday preferences error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          requestData: request,
        });
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result.data;
  },
);

const holidayPreferencesSlice = createSlice({
  name: 'holidayPreferences',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    clearLastSaved: state => {
      state.lastSaved = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch holiday preferences
      .addCase(fetchHolidayPreferences.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHolidayPreferences.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        // The API returns the preferences directly, no transformation needed
        state.preferences = action.payload;
      })
      .addCase(fetchHolidayPreferences.rejected, (state, action) => {
        state.loading = false;
        state.initialized = true; // Mark as initialized even on error to prevent infinite retries
        state.error = action.error.message || 'Failed to fetch holiday preferences';
      })
      // Save holiday preferences
      .addCase(saveHolidayPreferences.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveHolidayPreferences.fulfilled, (state, action) => {
        state.loading = false;
        state.lastSaved = action.payload;
        // Update preferences with the saved data
        state.preferences = action.payload.map((item: any) => ({
          holiday: item.holiday.holidayType,
          holidayId: item.holiday.id,
          budget: item.budget?.totalBudget
            ? parseFloat(item.budget.totalBudget.toString())
            : undefined,
          countdownTimer: item.holiday.countdownTimer,
        }));
      })
      .addCase(saveHolidayPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to save holiday preferences';
      });
  },
});

export const { clearError, clearLastSaved } = holidayPreferencesSlice.actions;
export default holidayPreferencesSlice.reducer;
