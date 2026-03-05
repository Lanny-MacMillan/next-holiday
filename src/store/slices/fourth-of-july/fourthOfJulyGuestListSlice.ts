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

interface FourthOfJulyGuestListState {
  guests: Guest[];
  loading: boolean;
  error: string | null;
  selectedGuest: Guest | null;
  initialized: boolean;
}

const initialState: FourthOfJulyGuestListState = {
  guests: [],
  loading: false,
  error: null,
  selectedGuest: null,
  initialized: false,
};

// Async thunks
export const fetchFourthOfJulyGuests = createAsyncThunk(
  'fourthOfJulyGuestList/fetchFourthOfJulyGuests',
  async (_, { getState }) => {
    // Get current state to check if we already have data
    const state = getState() as any;
    const currentGuests = state.fourthOfJulyGuestList.guests;
    const isInitialized = state.fourthOfJulyGuestList.initialized;

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
            bringingDish: 'Potato Salad',
            notes: 'Will arrive around 4 PM',
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
            bringingDish: 'Apple Pie',
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

export const addFourthOfJulyGuest = createAsyncThunk(
  'fourthOfJulyGuestList/addFourthOfJulyGuest',
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

export const updateFourthOfJulyGuest = createAsyncThunk(
  'fourthOfJulyGuestList/updateFourthOfJulyGuest',
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

export const deleteFourthOfJulyGuest = createAsyncThunk(
  'fourthOfJulyGuestList/deleteFourthOfJulyGuest',
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

export const toggleFourthOfJulyGuestCompletion = createAsyncThunk(
  'fourthOfJulyGuestList/toggleFourthOfJulyGuestCompletion',
  async (guestId: string, { getState }) => {
    const state = getState() as any;
    const guest = state.fourthOfJulyGuestList.guests.find(
      (g: Guest) => g.id === guestId,
    );

    if (!guest) {
      throw new Error('Guest not found');
    }

    // Simulate API call
    const response = await new Promise<Guest>(resolve => {
      setTimeout(() => {
        const updatedGuest: Guest = {
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

const fourthOfJulyGuestListSlice = createSlice({
  name: 'fourthOfJulyGuestList',
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
      .addCase(fetchFourthOfJulyGuests.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFourthOfJulyGuests.fulfilled, (state, action) => {
        state.loading = false;
        state.guests = action.payload;
        state.initialized = true;
      })
      .addCase(fetchFourthOfJulyGuests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch guests';
      })
      // Add guest
      .addCase(addFourthOfJulyGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addFourthOfJulyGuest.fulfilled, (state, action) => {
        state.loading = false;
        state.guests.push(action.payload);
      })
      .addCase(addFourthOfJulyGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add guest';
      })
      // Update guest
      .addCase(updateFourthOfJulyGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFourthOfJulyGuest.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.guests.findIndex(
          guest => guest.id === action.payload.id,
        );
        if (index !== -1) {
          state.guests[index] = action.payload;
        }
      })
      .addCase(updateFourthOfJulyGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update guest';
      })
      // Delete guest
      .addCase(deleteFourthOfJulyGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFourthOfJulyGuest.fulfilled, (state, action) => {
        state.loading = false;
        state.guests = state.guests.filter(guest => guest.id !== action.payload);
      })
      .addCase(deleteFourthOfJulyGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete guest';
      })
      // Toggle guest completion
      .addCase(toggleFourthOfJulyGuestCompletion.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleFourthOfJulyGuestCompletion.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.guests.findIndex(
          guest => guest.id === action.payload.id,
        );
        if (index !== -1) {
          state.guests[index] = action.payload;
        }
      })
      .addCase(toggleFourthOfJulyGuestCompletion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to toggle guest completion';
      });
  },
});

export const { setSelectedGuest, clearError } = fourthOfJulyGuestListSlice.actions;
export default fourthOfJulyGuestListSlice.reducer;
