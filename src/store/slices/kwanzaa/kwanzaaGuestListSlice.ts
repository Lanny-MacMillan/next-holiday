import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface KwanzaaGuest {
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

interface KwanzaaGuestListState {
  guests: KwanzaaGuest[];
  loading: boolean;
  error: string | null;
  selectedGuest: KwanzaaGuest | null;
  initialized: boolean;
}

const initialState: KwanzaaGuestListState = {
  guests: [],
  loading: false,
  error: null,
  selectedGuest: null,
  initialized: false,
};

// Async thunks
export const fetchKwanzaaGuests = createAsyncThunk(
  'kwanzaaGuestList/fetchKwanzaaGuests',
  async (_, { getState }) => {
    // Get current state to check if we already have data
    const state = getState() as any;
    const currentGuests = state.kwanzaaGuestList.guests;
    const isInitialized = state.kwanzaaGuestList.initialized;

    // Only fetch if we haven't initialized yet
    if (isInitialized) {
      return currentGuests;
    }

    // Simulate API call
    const response = await new Promise<KwanzaaGuest[]>(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'The Jackson Family',
            email: 'jackson.family@email.com',
            phone: '555-0123',
            address: '123 Unity Street, Anytown, CA 90210',
            rsvpStatus: 'confirmed',
            numberOfGuests: 5,
            dietaryRestrictions: 'None',
            bringingDish: 'Kwanzaa Feast',
            notes: 'Will bring traditional Kwanzaa foods',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Auntie Grace',
            email: 'auntie.grace@email.com',
            phone: '555-0456',
            address: '456 Heritage Avenue, Anytown, CA 90210',
            rsvpStatus: 'confirmed',
            numberOfGuests: 1,
            bringingDish: 'Kwanzaa Bread',
            notes: 'Will lead the Kwanzaa ceremony',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '3',
            name: 'The Williams Family',
            email: 'williams.family@email.com',
            phone: '555-0789',
            address: '789 Community Street, Anytown, CA 90210',
            rsvpStatus: 'pending',
            numberOfGuests: 3,
            dietaryRestrictions: 'Vegetarian',
            bringingDish: 'Kwanzaa Salad',
            notes: 'Checking their schedule for the first day',
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

export const addKwanzaaGuest = createAsyncThunk(
  'kwanzaaGuestList/addKwanzaaGuest',
  async (guest: Omit<KwanzaaGuest, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Simulate API call
    const response = await new Promise<KwanzaaGuest>(resolve => {
      setTimeout(() => {
        const newGuest: KwanzaaGuest = {
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

export const updateKwanzaaGuest = createAsyncThunk(
  'kwanzaaGuestList/updateKwanzaaGuest',
  async (guest: KwanzaaGuest) => {
    // Simulate API call
    const response = await new Promise<KwanzaaGuest>(resolve => {
      setTimeout(() => {
        const updatedGuest: KwanzaaGuest = {
          ...guest,
          updatedAt: new Date().toISOString(),
        };
        resolve(updatedGuest);
      }, 500);
    });
    return response;
  },
);

export const deleteKwanzaaGuest = createAsyncThunk(
  'kwanzaaGuestList/deleteKwanzaaGuest',
  async (guestId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return guestId;
  },
);

export const toggleKwanzaaGuestCompletion = createAsyncThunk(
  'kwanzaaGuestList/toggleKwanzaaGuestCompletion',
  async (guestId: string, { getState }) => {
    const state = getState() as any;
    const guest = state.kwanzaaGuestList.guests.find(
      (g: KwanzaaGuest) => g.id === guestId,
    );

    if (!guest) {
      throw new Error('Guest not found');
    }

    const updatedGuest: KwanzaaGuest = {
      ...guest,
      isCompleted: !guest.isCompleted,
      completedDate: !guest.isCompleted ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };

    // Simulate API call
    const response = await new Promise<KwanzaaGuest>(resolve => {
      setTimeout(() => {
        resolve(updatedGuest);
      }, 500);
    });
    return response;
  },
);

const kwanzaaGuestListSlice = createSlice({
  name: 'kwanzaaGuestList',
  initialState,
  reducers: {
    setSelectedGuest: (state, action: PayloadAction<KwanzaaGuest | null>) => {
      state.selectedGuest = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch guests
      .addCase(fetchKwanzaaGuests.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchKwanzaaGuests.fulfilled, (state, action) => {
        state.loading = false;
        state.guests = action.payload;
        state.initialized = true;
      })
      .addCase(fetchKwanzaaGuests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch guests';
      })
      // Add guest
      .addCase(addKwanzaaGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addKwanzaaGuest.fulfilled, (state, action) => {
        state.loading = false;
        state.guests.push(action.payload);
      })
      .addCase(addKwanzaaGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add guest';
      })
      // Update guest
      .addCase(updateKwanzaaGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateKwanzaaGuest.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.guests.findIndex(
          guest => guest.id === action.payload.id,
        );
        if (index !== -1) {
          state.guests[index] = action.payload;
        }
      })
      .addCase(updateKwanzaaGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update guest';
      })
      // Delete guest
      .addCase(deleteKwanzaaGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteKwanzaaGuest.fulfilled, (state, action) => {
        state.loading = false;
        state.guests = state.guests.filter(guest => guest.id !== action.payload);
      })
      .addCase(deleteKwanzaaGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete guest';
      })
      // Toggle completion
      .addCase(toggleKwanzaaGuestCompletion.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleKwanzaaGuestCompletion.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.guests.findIndex(
          guest => guest.id === action.payload.id,
        );
        if (index !== -1) {
          state.guests[index] = action.payload;
        }
      })
      .addCase(toggleKwanzaaGuestCompletion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to toggle guest completion';
      });
  },
});

export const { setSelectedGuest, clearError } = kwanzaaGuestListSlice.actions;
export default kwanzaaGuestListSlice.reducer;
