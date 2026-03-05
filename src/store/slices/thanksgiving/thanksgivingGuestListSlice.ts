import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Guest {
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

interface ThanksgivingGuestListState {
  guests: Guest[];
  loading: boolean;
  error: string | null;
  selectedGuest: Guest | null;
  initialized: boolean;
}

const initialState: ThanksgivingGuestListState = {
  guests: [],
  loading: false,
  error: null,
  selectedGuest: null,
  initialized: false,
};

// Async thunks
export const fetchThanksgivingGuests = createAsyncThunk(
  'thanksgivingGuestList/fetchThanksgivingGuests',
  async (_, { getState }) => {
    // Get current state to check if we already have data
    const state = getState() as any;
    const currentGuests = state.thanksgivingGuestList.guests;
    const isInitialized = state.thanksgivingGuestList.initialized;

    // Only fetch if we haven't initialized yet
    if (isInitialized) {
      return currentGuests;
    }

    // Simulate API call
    const response = await new Promise<Guest[]>(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@email.com',
            phone: '555-0123',
            address: '456 Maple Ave, Anytown, CA 90210',
            rsvpStatus: 'confirmed',
            numberOfGuests: 3,
            dietaryRestrictions: 'Vegetarian',
            bringingDish: 'Green Bean Casserole',
            notes: 'Will arrive around 2 PM',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Mike and Lisa Chen',
            email: 'mike.chen@email.com',
            phone: '555-0456',
            address: '789 Oak Street, Anytown, CA 90210',
            rsvpStatus: 'pending',
            numberOfGuests: 2,
            bringingDish: 'Pumpkin Pie',
            notes: 'Checking their schedule',
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

export const addThanksgivingGuest = createAsyncThunk(
  'thanksgivingGuestList/addThanksgivingGuest',
  async (guest: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Simulate API call
    const response = await new Promise<Guest>(resolve => {
      setTimeout(() => {
        const newGuest: Guest = {
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

export const updateThanksgivingGuest = createAsyncThunk(
  'thanksgivingGuestList/updateThanksgivingGuest',
  async (guest: Guest) => {
    // Simulate API call
    const response = await new Promise<Guest>(resolve => {
      setTimeout(() => {
        const updatedGuest: Guest = {
          ...guest,
          updatedAt: new Date().toISOString(),
        };
        resolve(updatedGuest);
      }, 500);
    });
    return response;
  },
);

export const deleteThanksgivingGuest = createAsyncThunk(
  'thanksgivingGuestList/deleteThanksgivingGuest',
  async (guestId: string) => {
    // Simulate API call
    await new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, 500);
    });
    return guestId;
  },
);

export const toggleThanksgivingGuestCompletion = createAsyncThunk(
  'thanksgivingGuestList/toggleThanksgivingGuestCompletion',
  async (guestId: string, { getState }) => {
    const state = getState() as any;
    const guest = state.thanksgivingGuestList.guests.find(
      (g: Guest) => g.id === guestId,
    );

    if (!guest) {
      throw new Error('Guest not found');
    }

    // Simulate API call
    const response = await new Promise<Guest>(resolve => {
      setTimeout(() => {
        // Toggle RSVP status between pending and confirmed
        const newRsvpStatus =
          guest.rsvpStatus === 'pending' ? 'confirmed' : 'pending';

        const updatedGuest: Guest = {
          ...guest,
          rsvpStatus: newRsvpStatus,
          updatedAt: new Date().toISOString(),
        };
        resolve(updatedGuest);
      }, 500);
    });
    return response;
  },
);

const thanksgivingGuestListSlice = createSlice({
  name: 'thanksgivingGuestList',
  initialState,
  reducers: {
    setSelectedGuest: (state, action: PayloadAction<Guest | null>) => {
      state.selectedGuest = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch guests
      .addCase(fetchThanksgivingGuests.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchThanksgivingGuests.fulfilled, (state, action) => {
        state.loading = false;
        state.guests = action.payload;
        state.initialized = true;
      })
      .addCase(fetchThanksgivingGuests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch guests';
      })
      // Add guest
      .addCase(addThanksgivingGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addThanksgivingGuest.fulfilled, (state, action) => {
        state.loading = false;
        state.guests.push(action.payload);
      })
      .addCase(addThanksgivingGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add guest';
      })
      // Update guest
      .addCase(updateThanksgivingGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateThanksgivingGuest.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.guests.findIndex(
          guest => guest.id === action.payload.id,
        );
        if (index !== -1) {
          state.guests[index] = action.payload;
        }
      })
      .addCase(updateThanksgivingGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update guest';
      })
      // Delete guest
      .addCase(deleteThanksgivingGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteThanksgivingGuest.fulfilled, (state, action) => {
        state.loading = false;
        state.guests = state.guests.filter(guest => guest.id !== action.payload);
      })
      .addCase(deleteThanksgivingGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete guest';
      })
      // Toggle guest completion
      .addCase(toggleThanksgivingGuestCompletion.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleThanksgivingGuestCompletion.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.guests.findIndex(
          guest => guest.id === action.payload.id,
        );
        if (index !== -1) {
          state.guests[index] = action.payload;
        }
      })
      .addCase(toggleThanksgivingGuestCompletion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to toggle RSVP status';
      });
  },
});

export const { setSelectedGuest, clearError } = thanksgivingGuestListSlice.actions;
export default thanksgivingGuestListSlice.reducer;
