import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface BabyShowerGuest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  rsvpStatus: 'pending' | 'confirmed' | 'declined';
  numberOfGuests: number;
  dietaryRestrictions?: string;
  bringingGift?: string;
  notes?: string;
  isCompleted: boolean;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface BabyShowerGuestListState {
  guests: BabyShowerGuest[];
  loading: boolean;
  error: string | null;
  selectedGuest: BabyShowerGuest | null;
  initialized: boolean;
}

const initialState: BabyShowerGuestListState = {
  guests: [],
  loading: false,
  error: null,
  selectedGuest: null,
  initialized: false,
};

// Async thunks
export const fetchBabyShowerGuests = createAsyncThunk(
  'babyShowerGuestList/fetchBabyShowerGuests',
  async (_, { getState }) => {
    // Get current state to check if we already have data
    const state = getState() as any;
    const currentGuests = state.babyShowerGuestList.guests;
    const isInitialized = state.babyShowerGuestList.initialized;

    // Only fetch if we haven't initialized yet
    if (isInitialized) {
      return currentGuests;
    }

    // Simulate API call
    const response = await new Promise<BabyShowerGuest[]>(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@email.com',
            phone: '555-0123',
            address: '456 Maple Ave, Anytown, CA 90210',
            rsvpStatus: 'confirmed',
            numberOfGuests: 2,
            dietaryRestrictions: 'Vegetarian',
            bringingGift: 'Baby Clothes',
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
            numberOfGuests: 1,
            bringingGift: 'Diapers',
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

export const addBabyShowerGuest = createAsyncThunk(
  'babyShowerGuestList/addBabyShowerGuest',
  async (guest: Omit<BabyShowerGuest, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Simulate API call
    const response = await new Promise<BabyShowerGuest>(resolve => {
      setTimeout(() => {
        const newGuest: BabyShowerGuest = {
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

export const updateBabyShowerGuest = createAsyncThunk(
  'babyShowerGuestList/updateBabyShowerGuest',
  async (guest: BabyShowerGuest) => {
    // Simulate API call
    const response = await new Promise<BabyShowerGuest>(resolve => {
      setTimeout(() => {
        const updatedGuest: BabyShowerGuest = {
          ...guest,
          updatedAt: new Date().toISOString(),
        };
        resolve(updatedGuest);
      }, 500);
    });
    return response;
  },
);

export const deleteBabyShowerGuest = createAsyncThunk(
  'babyShowerGuestList/deleteBabyShowerGuest',
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

export const toggleBabyShowerGuestCompletion = createAsyncThunk(
  'babyShowerGuestList/toggleBabyShowerGuestCompletion',
  async (guestId: string, { getState }) => {
    const state = getState() as any;
    const guest = state.babyShowerGuestList.guests.find(
      (g: BabyShowerGuest) => g.id === guestId,
    );

    if (!guest) {
      throw new Error('Guest not found');
    }

    // Simulate API call
    const response = await new Promise<BabyShowerGuest>(resolve => {
      setTimeout(() => {
        const updatedGuest: BabyShowerGuest = {
          ...guest,
          isCompleted: !guest.isCompleted,
          completedDate: !guest.isCompleted ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        };
        resolve(updatedGuest);
      }, 500);
    });
    return response;
  },
);

const babyShowerGuestListSlice = createSlice({
  name: 'babyShowerGuestList',
  initialState,
  reducers: {
    setSelectedGuest: (state, action: PayloadAction<BabyShowerGuest | null>) => {
      state.selectedGuest = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch guests
      .addCase(fetchBabyShowerGuests.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBabyShowerGuests.fulfilled, (state, action) => {
        state.loading = false;
        state.guests = action.payload;
        state.initialized = true;
      })
      .addCase(fetchBabyShowerGuests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch guests';
      })
      // Add guest
      .addCase(addBabyShowerGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addBabyShowerGuest.fulfilled, (state, action) => {
        state.loading = false;
        state.guests.push(action.payload);
      })
      .addCase(addBabyShowerGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add guest';
      })
      // Update guest
      .addCase(updateBabyShowerGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBabyShowerGuest.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.guests.findIndex(
          guest => guest.id === action.payload.id,
        );
        if (index !== -1) {
          state.guests[index] = action.payload;
        }
      })
      .addCase(updateBabyShowerGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update guest';
      })
      // Delete guest
      .addCase(deleteBabyShowerGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBabyShowerGuest.fulfilled, (state, action) => {
        state.loading = false;
        state.guests = state.guests.filter(guest => guest.id !== action.payload);
      })
      .addCase(deleteBabyShowerGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete guest';
      })
      // Toggle guest completion
      .addCase(toggleBabyShowerGuestCompletion.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleBabyShowerGuestCompletion.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.guests.findIndex(
          guest => guest.id === action.payload.id,
        );
        if (index !== -1) {
          state.guests[index] = action.payload;
        }
      })
      .addCase(toggleBabyShowerGuestCompletion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to toggle guest completion';
      });
  },
});

export const { setSelectedGuest, clearError } = babyShowerGuestListSlice.actions;
export default babyShowerGuestListSlice.reducer;
