import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface UserPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  displayMode: 'professional' | 'gamified';
  showCompletedItems: boolean;
  showCountdown: boolean;
  showProgressBars: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  reminderNotifications: boolean;
  taskDueReminders: boolean;
  holidayCountdownAlerts: boolean;
  timezone: string;
  locale: string;
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  createdAt: string;
  updatedAt: string;
}

interface UserPreferencesState {
  preferences: UserPreferences | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: UserPreferencesState = {
  preferences: null,
  loading: false,
  error: null,
  initialized: false,
};

// Async thunk to get current user preferences
export const getCurrentUserPreferences = createAsyncThunk(
  'userPreferences/getCurrentUserPreferences',
  async (auth0Sub: string) => {
    const response = await fetch(
      `/api/users/me/preferences?auth0Sub=${encodeURIComponent(auth0Sub)}`,
    );
    if (!response.ok) {
      throw new Error('Failed to fetch user preferences');
    }
    const preferencesData = await response.json();
    return preferencesData;
  },
);

// Async thunk to update user preferences
export const updateUserPreferences = createAsyncThunk(
  'userPreferences/updateUserPreferences',
  async ({
    preferencesData,
    auth0Sub,
  }: {
    preferencesData: Partial<UserPreferences>;
    auth0Sub: string;
  }) => {
    const response = await fetch('/api/users/me/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...preferencesData, auth0Sub }),
    });

    if (!response.ok) {
      throw new Error('Failed to update user preferences');
    }

    const updatedPreferences = await response.json();
    return updatedPreferences;
  },
);

const userPreferencesSlice = createSlice({
  name: 'userPreferences',
  initialState,
  reducers: {
    setPreferences: (state, action: PayloadAction<UserPreferences | null>) => {
      state.preferences = action.payload;
      state.initialized = true;
    },
    clearPreferences: state => {
      state.preferences = null;
      state.initialized = true;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Get current user preferences
      .addCase(getCurrentUserPreferences.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentUserPreferences.fulfilled, (state, action) => {
        state.loading = false;
        state.preferences = action.payload;
        state.initialized = true;
        
        // Update localStorage with fetched preferences to keep them in sync
        if (typeof window !== 'undefined' && action.payload) {
          const { theme, displayMode } = action.payload;
          
          // Update theme in localStorage if present in preferences
          if (theme) {
            localStorage.setItem('theme', theme);
          }
          
          // Update userSettings in localStorage if display mode is present
          if (displayMode) {
            try {
              const existingSettings = localStorage.getItem('userSettings');
              const settings = existingSettings ? JSON.parse(existingSettings) : {};
              settings.displayMode = displayMode;
              localStorage.setItem('userSettings', JSON.stringify(settings));
            } catch (error) {
              console.error('Error updating localStorage userSettings:', error);
            }
          }
        }
      })
      .addCase(getCurrentUserPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to get user preferences';
      })
      // Update user preferences
      .addCase(updateUserPreferences.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        state.loading = false;
        if (state.preferences) {
          state.preferences = { ...state.preferences, ...action.payload };
        }
        
        // Update localStorage with updated preferences to keep them in sync
        if (typeof window !== 'undefined' && action.payload) {
          const { theme, displayMode } = action.payload;
          
          // Update theme in localStorage if present in updated preferences
          if (theme) {
            localStorage.setItem('theme', theme);
          }
          
          // Update userSettings in localStorage if display mode is present
          if (displayMode) {
            try {
              const existingSettings = localStorage.getItem('userSettings');
              const settings = existingSettings ? JSON.parse(existingSettings) : {};
              settings.displayMode = displayMode;
              localStorage.setItem('userSettings', JSON.stringify(settings));
            } catch (error) {
              console.error('Error updating localStorage userSettings:', error);
            }
          }
        }
      })
      .addCase(updateUserPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update user preferences';
      });
  },
});

export const { setPreferences, clearPreferences, clearError } =
  userPreferencesSlice.actions;
export default userPreferencesSlice.reducer;
