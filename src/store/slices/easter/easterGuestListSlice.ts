import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface EasterGuest {
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

interface EasterGuestListState {
  guests: EasterGuest[];
  loading: boolean;
  error: string | null;
  selectedGuest: EasterGuest | null;
  initialized: boolean;
}

const initialState: EasterGuestListState = {
  guests: [],
  loading: false,
  error: null,
  selectedGuest: null,
  initialized: false,
};

// Async thunks
export const fetchEasterGuests = createAsyncThunk(
  'easterGuestList/fetchEasterGuests',
  async (_, { getState }) => {
    // Get current state to check if we already have data
    const state = getState() as any;
    const currentGuests = state.easterGuestList.guests;
    const isInitialized = state.easterGuestList.initialized;

    // Only fetch if we haven't initialized yet
    if (isInitialized) {
      return currentGuests;
    }

    // Simulate API call
    const response = await new Promise<EasterGuest[]>(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'The Smith Family',
            email: 'smith.family@email.com',
            phone: '555-0123',
            address: '123 Spring Street, Anytown, CA 90210',
            rsvpStatus: 'confirmed',
            numberOfGuests: 5,
            dietaryRestrictions: 'None',
            bringingDish: 'Easter Ham',
            notes: 'Will bring Easter eggs for the kids',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Aunt Jennifer',
            email: 'jennifer@email.com',
            phone: '555-0456',
            address: '456 Garden Avenue, Anytown, CA 90210',
            rsvpStatus: 'confirmed',
            numberOfGuests: 1,
            bringingDish: 'Easter Bread',
            notes: 'Will help with the Easter egg hunt',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '3',
            name: 'The Johnson Family',
            email: 'johnson.family@email.com',
            phone: '555-0789',
            address: '789 Bloom Street, Anytown, CA 90210',
            rsvpStatus: 'pending',
            numberOfGuests: 3,
            dietaryRestrictions: 'Vegetarian',
            bringingDish: 'Easter Salad',
            notes: 'Checking their schedule for Easter Sunday',
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

export const addEasterGuest = createAsyncThunk(
  'easterGuestList/addEasterGuest',
  async (guest: Omit<EasterGuest, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Simulate API call
    const response = await new Promise<EasterGuest>(resolve => {
      setTimeout(() => {
        const newGuest: EasterGuest = {
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

export const updateEasterGuest = createAsyncThunk(
  'easterGuestList/updateEasterGuest',
  async (guest: EasterGuest) => {
    // Simulate API call
    const response = await new Promise<EasterGuest>(resolve => {
      setTimeout(() => {
        const updatedGuest: EasterGuest = {
          ...guest,
          updatedAt: new Date().toISOString(),
        };
        resolve(updatedGuest);
      }, 500);
    });
    return response;
  },
);

export const deleteEasterGuest = createAsyncThunk(
  'easterGuestList/deleteEasterGuest',
  async (guestId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return guestId;
  },
);

export const toggleEasterGuestCompletion = createAsyncThunk(
  'easterGuestList/toggleEasterGuestCompletion',
  async (guestId: string, { getState }) => {
    const state = getState() as any;
    const guest = state.easterGuestList.guests.find(
      (g: EasterGuest) => g.id === guestId,
    );

    if (!guest) {
      throw new Error('Guest not found');
    }

    const updatedGuest: EasterGuest = {
      ...guest,
      isCompleted: !guest.isCompleted,
      completedDate: !guest.isCompleted ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };

    // Simulate API call
    const response = await new Promise<EasterGuest>(resolve => {
      setTimeout(() => {
        resolve(updatedGuest);
      }, 500);
    });
    return response;
  },
);

const easterGuestListSlice = createSlice({
  name: 'easterGuestList',
  initialState,
  reducers: {
    setSelectedGuest: (state, action: PayloadAction<EasterGuest | null>) => {
      state.selectedGuest = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch guests
      .addCase(fetchEasterGuests.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEasterGuests.fulfilled, (state, action) => {
        state.loading = false;
        state.guests = action.payload;
        state.initialized = true;
      })
      .addCase(fetchEasterGuests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch guests';
      })
      // Add guest
      .addCase(addEasterGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addEasterGuest.fulfilled, (state, action) => {
        state.loading = false;
        state.guests.push(action.payload);
      })
      .addCase(addEasterGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add guest';
      })
      // Update guest
      .addCase(updateEasterGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEasterGuest.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.guests.findIndex(
          guest => guest.id === action.payload.id,
        );
        if (index !== -1) {
          state.guests[index] = action.payload;
        }
      })
      .addCase(updateEasterGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update guest';
      })
      // Delete guest
      .addCase(deleteEasterGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEasterGuest.fulfilled, (state, action) => {
        state.loading = false;
        state.guests = state.guests.filter(guest => guest.id !== action.payload);
      })
      .addCase(deleteEasterGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete guest';
      })
      // Toggle completion
      .addCase(toggleEasterGuestCompletion.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleEasterGuestCompletion.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.guests.findIndex(
          guest => guest.id === action.payload.id,
        );
        if (index !== -1) {
          state.guests[index] = action.payload;
        }
      })
      .addCase(toggleEasterGuestCompletion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to toggle guest completion';
      });
  },
});

export const { setSelectedGuest, clearError } = easterGuestListSlice.actions;
export default easterGuestListSlice.reducer;
