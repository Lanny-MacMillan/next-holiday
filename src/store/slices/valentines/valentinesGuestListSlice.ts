import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface ValentinesGuest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  rsvpStatus: 'pending' | 'confirmed' | 'declined';
  numberOfGuests: number;
  dietaryRestrictions?: string;
  bringingDish?: string;
  notes?: string;
  isCompleted: boolean;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface ValentinesGuestListState {
  guests: ValentinesGuest[];
  loading: boolean;
  error: string | null;
  selectedGuest: ValentinesGuest | null;
  initialized: boolean;
}

const initialState: ValentinesGuestListState = {
  guests: [],
  loading: false,
  error: null,
  selectedGuest: null,
  initialized: false,
};

// Async thunks
export const fetchValentinesGuests = createAsyncThunk(
  'valentinesGuestList/fetchValentinesGuests',
  async (_, { getState }) => {
    // Get current state to check if we already have data
    const state = getState() as any;
    const currentGuests = state.valentinesGuestList.guests;
    const isInitialized = state.valentinesGuestList.initialized;

    // Only fetch if we haven't initialized yet
    if (isInitialized) {
      return currentGuests;
    }

    // Simulate API call
    const response = await new Promise<ValentinesGuest[]>(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'Sarah and Mike',
            email: 'sarah.mike@email.com',
            phone: '555-0123',
            address: '123 Love Street, Anytown, CA 90210',
            rsvpStatus: 'confirmed',
            numberOfGuests: 2,
            dietaryRestrictions: 'None',
            bringingDish: 'Chocolate Covered Strawberries',
            notes: 'Will bring romantic desserts',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Jennifer and David',
            email: 'jennifer.david@email.com',
            phone: '555-0456',
            address: '456 Heart Avenue, Anytown, CA 90210',
            rsvpStatus: 'confirmed',
            numberOfGuests: 2,
            bringingDish: "Valentine's Day Cake",
            notes: 'Will bring a romantic cake',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '3',
            name: 'Emma and James',
            email: 'emma.james@email.com',
            phone: '555-0789',
            address: '789 Rose Street, Anytown, CA 90210',
            rsvpStatus: 'pending',
            numberOfGuests: 2,
            dietaryRestrictions: 'Vegetarian',
            bringingDish: "Valentine's Salad",
            notes: "Checking their schedule for Valentine's Day",
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }, 1000);
    });
    return response;
  },
);

export const addValentinesGuest = createAsyncThunk(
  'valentinesGuestList/addValentinesGuest',
  async (guest: Omit<ValentinesGuest, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Simulate API call
    const response = await new Promise<ValentinesGuest>(resolve => {
      setTimeout(() => {
        const newGuest: ValentinesGuest = {
          ...guest,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        resolve(newGuest);
      }, 500);
    });
    return response;
  },
);

export const updateValentinesGuest = createAsyncThunk(
  'valentinesGuestList/updateValentinesGuest',
  async (guest: ValentinesGuest) => {
    // Simulate API call
    const response = await new Promise<ValentinesGuest>(resolve => {
      setTimeout(() => {
        const updatedGuest: ValentinesGuest = {
          ...guest,
          updatedAt: new Date().toISOString(),
        };
        resolve(updatedGuest);
      }, 500);
    });
    return response;
  },
);

export const deleteValentinesGuest = createAsyncThunk(
  'valentinesGuestList/deleteValentinesGuest',
  async (guestId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return guestId;
  },
);

export const toggleValentinesGuestCompletion = createAsyncThunk(
  'valentinesGuestList/toggleValentinesGuestCompletion',
  async (guestId: string, { getState }) => {
    const state = getState() as any;
    const guest = state.valentinesGuestList.guests.find(
      (g: ValentinesGuest) => g.id === guestId,
    );

    if (!guest) {
      throw new Error('Guest not found');
    }

    const updatedGuest: ValentinesGuest = {
      ...guest,
      isCompleted: !guest.isCompleted,
      completedDate: !guest.isCompleted ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };

    // Simulate API call
    const response = await new Promise<ValentinesGuest>(resolve => {
      setTimeout(() => {
        resolve(updatedGuest);
      }, 500);
    });
    return response;
  },
);

const valentinesGuestListSlice = createSlice({
  name: 'valentinesGuestList',
  initialState,
  reducers: {
    setSelectedGuest: (state, action: PayloadAction<ValentinesGuest | null>) => {
      state.selectedGuest = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch guests
      .addCase(fetchValentinesGuests.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchValentinesGuests.fulfilled, (state, action) => {
        state.loading = false;
        state.guests = action.payload;
        state.initialized = true;
      })
      .addCase(fetchValentinesGuests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch guests';
      })
      // Add guest
      .addCase(addValentinesGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addValentinesGuest.fulfilled, (state, action) => {
        state.loading = false;
        state.guests.push(action.payload);
      })
      .addCase(addValentinesGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add guest';
      })
      // Update guest
      .addCase(updateValentinesGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateValentinesGuest.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.guests.findIndex(
          guest => guest.id === action.payload.id,
        );
        if (index !== -1) {
          state.guests[index] = action.payload;
        }
      })
      .addCase(updateValentinesGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update guest';
      })
      // Delete guest
      .addCase(deleteValentinesGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteValentinesGuest.fulfilled, (state, action) => {
        state.loading = false;
        state.guests = state.guests.filter(guest => guest.id !== action.payload);
      })
      .addCase(deleteValentinesGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete guest';
      })
      // Toggle completion
      .addCase(toggleValentinesGuestCompletion.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleValentinesGuestCompletion.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.guests.findIndex(
          guest => guest.id === action.payload.id,
        );
        if (index !== -1) {
          state.guests[index] = action.payload;
        }
      })
      .addCase(toggleValentinesGuestCompletion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to toggle guest completion';
      });
  },
});

export const { setSelectedGuest, clearError } = valentinesGuestListSlice.actions;
export default valentinesGuestListSlice.reducer;
