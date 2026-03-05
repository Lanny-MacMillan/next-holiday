import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface HalloweenGuest {
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

interface HalloweenGuestListState {
  guests: HalloweenGuest[];
  loading: boolean;
  error: string | null;
  selectedGuest: HalloweenGuest | null;
  initialized: boolean;
}

const initialState: HalloweenGuestListState = {
  guests: [],
  loading: false,
  error: null,
  selectedGuest: null,
  initialized: false,
};

// Async thunks
export const fetchHalloweenGuests = createAsyncThunk(
  'halloweenGuestList/fetchHalloweenGuests',
  async (_, { getState }) => {
    const state = getState() as any;
    const currentGuests = state.halloweenGuestList.guests;
    const isInitialized = state.halloweenGuestList.initialized;

    if (isInitialized) {
      return currentGuests;
    }

    const response = await new Promise<HalloweenGuest[]>(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'The Peterson Family',
            email: 'peterson.family@email.com',
            phone: '555-0123',
            address: '123 Spooky Street, Anytown, CA 90210',
            rsvpStatus: 'confirmed',
            numberOfGuests: 4,
            dietaryRestrictions: 'None',
            bringingDish: 'Halloween Candy',
            notes: 'Will bring extra candy for trick-or-treaters',
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

export const addHalloweenGuest = createAsyncThunk(
  'halloweenGuestList/addHalloweenGuest',
  async (guest: Omit<HalloweenGuest, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await new Promise<HalloweenGuest>(resolve => {
      setTimeout(() => {
        const newGuest: HalloweenGuest = {
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

export const updateHalloweenGuest = createAsyncThunk(
  'halloweenGuestList/updateHalloweenGuest',
  async (guest: HalloweenGuest) => {
    const response = await new Promise<HalloweenGuest>(resolve => {
      setTimeout(() => {
        const updatedGuest: HalloweenGuest = {
          ...guest,
          updatedAt: new Date().toISOString(),
        };
        resolve(updatedGuest);
      }, 500);
    });
    return response;
  },
);

export const deleteHalloweenGuest = createAsyncThunk(
  'halloweenGuestList/deleteHalloweenGuest',
  async (guestId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return guestId;
  },
);

export const toggleHalloweenGuestCompletion = createAsyncThunk(
  'halloweenGuestList/toggleHalloweenGuestCompletion',
  async (guestId: string, { getState }) => {
    const state = getState() as any;
    const guest = state.halloweenGuestList.guests.find(
      (g: HalloweenGuest) => g.id === guestId,
    );

    if (!guest) {
      throw new Error('Guest not found');
    }

    const updatedGuest: HalloweenGuest = {
      ...guest,
      isCompleted: !guest.isCompleted,
      completedDate: !guest.isCompleted ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };

    const response = await new Promise<HalloweenGuest>(resolve => {
      setTimeout(() => {
        resolve(updatedGuest);
      }, 500);
    });
    return response;
  },
);

const halloweenGuestListSlice = createSlice({
  name: 'halloweenGuestList',
  initialState,
  reducers: {
    setSelectedGuest: (state, action: PayloadAction<HalloweenGuest | null>) => {
      state.selectedGuest = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchHalloweenGuests.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHalloweenGuests.fulfilled, (state, action) => {
        state.loading = false;
        state.guests = action.payload;
        state.initialized = true;
      })
      .addCase(fetchHalloweenGuests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch guests';
      })
      .addCase(addHalloweenGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addHalloweenGuest.fulfilled, (state, action) => {
        state.loading = false;
        state.guests.push(action.payload);
      })
      .addCase(addHalloweenGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add guest';
      })
      .addCase(updateHalloweenGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateHalloweenGuest.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.guests.findIndex(
          guest => guest.id === action.payload.id,
        );
        if (index !== -1) {
          state.guests[index] = action.payload;
        }
      })
      .addCase(updateHalloweenGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update guest';
      })
      .addCase(deleteHalloweenGuest.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteHalloweenGuest.fulfilled, (state, action) => {
        state.loading = false;
        state.guests = state.guests.filter(guest => guest.id !== action.payload);
      })
      .addCase(deleteHalloweenGuest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete guest';
      })
      .addCase(toggleHalloweenGuestCompletion.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleHalloweenGuestCompletion.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.guests.findIndex(
          guest => guest.id === action.payload.id,
        );
        if (index !== -1) {
          state.guests[index] = action.payload;
        }
      })
      .addCase(toggleHalloweenGuestCompletion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to toggle guest completion';
      });
  },
});

export const { setSelectedGuest, clearError } = halloweenGuestListSlice.actions;
export default halloweenGuestListSlice.reducer;
