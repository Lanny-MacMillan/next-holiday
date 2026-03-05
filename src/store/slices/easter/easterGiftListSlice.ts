import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface EasterGift {
  id: string;
  name: string;
  description?: string;
  price: number;
  recipient: string;
  isCompleted: boolean;
  completedDate?: string;
  store?: string;
  productLink?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface EasterGiftListState {
  gifts: EasterGift[];
  loading: boolean;
  error: string | null;
  selectedGift: EasterGift | null;
  initialized: boolean;
}

const initialState: EasterGiftListState = {
  gifts: [],
  loading: false,
  error: null,
  selectedGift: null,
  initialized: false,
};

// Async thunks
export const fetchEasterGifts = createAsyncThunk(
  'easterGiftList/fetchEasterGifts',
  async (_, { getState }) => {
    // Get current state to check if we already have data
    const state = getState() as any;
    const currentGifts = state.easterGiftList.gifts;
    const isInitialized = state.easterGiftList.initialized;

    // Only fetch if we haven't initialized yet
    if (isInitialized) {
      return currentGifts;
    }

    // Simulate API call
    const response = await new Promise<EasterGift[]>(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'Easter Basket',
            description: 'Traditional Easter basket with treats',
            price: 35.99,
            recipient: 'Emma',
            isCompleted: false,
            store: 'Local Gift Shop',
            notes: 'Include chocolate eggs and small toys',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }, 1000);
    });
    return response;
  },
);

export const addEasterGift = createAsyncThunk(
  'easterGiftList/addEasterGift',
  async (gift: Omit<EasterGift, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Simulate API call
    const newGift: EasterGift = {
      ...gift,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 500));
    return newGift;
  },
);

export const updateEasterGift = createAsyncThunk(
  'easterGiftList/updateEasterGift',
  async (gift: EasterGift) => {
    // Simulate API call
    const updatedGift: EasterGift = {
      ...gift,
      updatedAt: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 500));
    return updatedGift;
  },
);

export const deleteEasterGift = createAsyncThunk(
  'easterGiftList/deleteEasterGift',
  async (giftId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return giftId;
  },
);

export const toggleEasterGiftCompletion = createAsyncThunk(
  'easterGiftList/toggleEasterGiftCompletion',
  async (giftId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    return giftId;
  },
);

const easterGiftListSlice = createSlice({
  name: 'easterGiftList',
  initialState,
  reducers: {
    setSelectedEasterGift: (state, action: PayloadAction<EasterGift | null>) => {
      state.selectedGift = action.payload;
    },
    clearEasterError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch Easter gifts
      .addCase(fetchEasterGifts.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEasterGifts.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts = action.payload;
        state.initialized = true; // Set initialized to true on successful fetch
      })
      .addCase(fetchEasterGifts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch Easter gifts';
      })
      // Add Easter gift
      .addCase(addEasterGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addEasterGift.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts.push(action.payload);
      })
      .addCase(addEasterGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add Easter gift';
      })
      // Update Easter gift
      .addCase(updateEasterGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEasterGift.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.gifts.findIndex(gift => gift.id === action.payload.id);
        if (index !== -1) {
          state.gifts[index] = action.payload;
        }
      })
      .addCase(updateEasterGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update Easter gift';
      })
      // Delete Easter gift
      .addCase(deleteEasterGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEasterGift.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts = state.gifts.filter(gift => gift.id !== action.payload);
      })
      .addCase(deleteEasterGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete Easter gift';
      })
      // Mark Easter gift as purchased
      .addCase(toggleEasterGiftCompletion.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleEasterGiftCompletion.fulfilled, (state, action) => {
        state.loading = false;
        const gift = state.gifts.find(g => g.id === action.payload);
        if (gift) {
          gift.isCompleted = !gift.isCompleted;
          if (gift.isCompleted) {
            gift.completedDate = new Date().toISOString();
          } else {
            gift.completedDate = undefined;
          }
        }
      })
      .addCase(toggleEasterGiftCompletion.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || 'Failed to toggle Easter gift completion';
      });
  },
});

export const { setSelectedEasterGift, clearEasterError } =
  easterGiftListSlice.actions;
export default easterGiftListSlice.reducer;
