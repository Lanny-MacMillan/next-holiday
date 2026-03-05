import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface NewYearGuest {
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

interface NewYearGuestListState {
  guests: NewYearGuest[];
  loading: boolean;
  error: string | null;
  selectedGuest: NewYearGuest | null;
  initialized: boolean;
}

const initialState: NewYearGuestListState = {
  guests: [],
  loading: false,
  error: null,
  selectedGuest: null,
  initialized: false,
};

// Async thunks
export const fetchNewYearGuests = createAsyncThunk(
  'newYearGuestList/fetchNewYearGuests',
  async (_, { getState }) => {
    // Get current state to check if we already have data
    const state = getState() as any;
    const currentGuests = state.newYearGuestList.guests;
    const isInitialized = state.newYearGuestList.initialized;

    // Only fetch if we haven't initialized yet
    if (isInitialized) {
      return currentGuests;
    }

    // Simulate API call
    const response = await new Promise<NewYearGuest[]>(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'The Martinez Family',
            email: 'martinez.family@email.com',
            phone: '555-0123',
            address: '123 Celebration Street, Anytown, CA 90210',
            rsvpStatus: 'confirmed',
            numberOfGuests: 4,
            dietaryRestrictions: 'None',
            bringingDish: "New Year's Eve Appetizers",
            notes: 'Will bring champagne for midnight toast',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Uncle Carlos',
            email: 'uncle.carlos@email.com',
            phone: '555-0456',
            address: '456 Party Avenue, Anytown, CA 90210',
            rsvpStatus: 'confirmed',
            numberOfGuests: 1,
            bringingDish: 'Spanish Tapas',
            notes: 'Will bring traditional Spanish New Year foods',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '3',
            name: 'The Thompson Family',
            email: 'thompson.family@email.com',
            phone: '555-0789',
            address: '789 Countdown Street, Anytown, CA 90210',
            rsvpStatus: 'pending',
            numberOfGuests: 3,
            dietaryRestrictions: 'Gluten-free',
            bringingDish: "New Year's Desserts",
            notes: 'Checking if they can make it for the countdown',
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

export const addNewYearGuest = createAsyncThunk(
  'newYearGuestList/addNewYearGuest',
  async (guest: Omit<NewYearGuest, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Simulate API call
    const response = await new Promise<NewYearGuest>(resolve => {
      setTimeout(() => {
        const newGuest: NewYearGuest = {
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

export const updateNewYearGuest = createAsyncThunk(
  'newYearGuestList/updateNewYearGuest',
  async (guest: NewYearGuest) => {
    // Simulate API call
    const response = await new Promise<NewYearGuest>(resolve => {
      setTimeout(() => {
        const updatedGuest: NewYearGuest = {
          ...guest,
          updatedAt: new Date().toISOString(),
        };
        resolve(updatedGuest);
      }, 500);
    });
    return response;
  },
);

export const deleteNewYearGuest = createAsyncThunk(
  'newYearGuestList/deleteNewYearGuest',
  async (guestId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return guestId;
  },
);

export const toggleNewYearGuestCompletion = createAsyncThunk(
  'newYearGuestList/toggleNewYearGuestCompletion',
  async (guestId: string, { getState }) => {
    const state = getState() as any;
    const guest = state.newYearGuestList.guests.find(
      (g: NewYearGuest) => g.id === guestId,
    );

    if (!guest) {
      throw new Error('Guest not found');
    }

    const updatedGuest: NewYearGuest = {
      ...guest,
      isCompleted: !guest.isCompleted,
      completedDate: !guest.isCompleted ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };

    // Simulate API call
    const response = await new Promise<NewYearGuest>(resolve => {
      setTimeout(() => {
        resolve(updatedGuest);
      }, 500);
    });
    return response;
  },
);

const newYearGuestListSlice = createSlice({
  name: 'newYearGuestList',
  initialState,
  reducers: {
    setSelectedGuest: (state, action: PayloadAction<NewYearGuest | null>) => {
      state.selectedGuest = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch guests
      .addCase(fetchNewYearGuests.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNewYearGuests.fulfilled, (state, action) => {
        state.loading = false;
        state.guests = action.payload;
        state.initialized = true;
      })
      .addCase(fetchNewYearGuests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch guests';
      })
      // Add guest
      .addCase(addNewYearGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addNewYearGuest.fulfilled, (state, action) => {
        state.loading = false;
        state.guests.push(action.payload);
      })
      .addCase(addNewYearGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add guest';
      })
      // Update guest
      .addCase(updateNewYearGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNewYearGuest.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.guests.findIndex(
          guest => guest.id === action.payload.id,
        );
        if (index !== -1) {
          state.guests[index] = action.payload;
        }
      })
      .addCase(updateNewYearGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update guest';
      })
      // Delete guest
      .addCase(deleteNewYearGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNewYearGuest.fulfilled, (state, action) => {
        state.loading = false;
        state.guests = state.guests.filter(guest => guest.id !== action.payload);
      })
      .addCase(deleteNewYearGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete guest';
      })
      // Toggle completion
      .addCase(toggleNewYearGuestCompletion.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleNewYearGuestCompletion.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.guests.findIndex(
          guest => guest.id === action.payload.id,
        );
        if (index !== -1) {
          state.guests[index] = action.payload;
        }
      })
      .addCase(toggleNewYearGuestCompletion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to toggle guest completion';
      });
  },
});

export const { setSelectedGuest, clearError } = newYearGuestListSlice.actions;
export default newYearGuestListSlice.reducer;
