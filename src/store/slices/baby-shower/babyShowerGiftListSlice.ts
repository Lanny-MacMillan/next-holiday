import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface BabyShowerGift {
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

interface BabyShowerGiftListState {
  gifts: BabyShowerGift[];
  loading: boolean;
  error: string | null;
  selectedGift: BabyShowerGift | null;
  initialized: boolean;
}

const initialState: BabyShowerGiftListState = {
  gifts: [],
  loading: false,
  error: null,
  selectedGift: null,
  initialized: false,
};

// Async thunks
export const fetchBabyShowerGifts = createAsyncThunk(
  'babyShowerGiftList/fetchBabyShowerGifts',
  async (_, { getState }) => {
    // Get current state to check if we already have data
    const state = getState() as any;
    const currentGifts = state.babyShowerGiftList.gifts;
    const isInitialized = state.babyShowerGiftList.initialized;

    // Only fetch if we haven't initialized yet
    if (isInitialized) {
      return currentGifts;
    }

    // Simulate API call
    const response = await new Promise<BabyShowerGift[]>(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'Baby Clothes',
            description: 'Cute baby outfits',
            price: 35.0,
            recipient: 'Baby',
            isCompleted: false,
            store: 'Baby Store',
            notes: 'Get various sizes',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }, 1000);
    });
    return response;
  },
);

export const addBabyShowerGift = createAsyncThunk(
  'babyShowerGiftList/addBabyShowerGift',
  async (gift: Omit<BabyShowerGift, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Simulate API call
    const newGift: BabyShowerGift = {
      ...gift,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 500));
    return newGift;
  },
);

export const updateBabyShowerGift = createAsyncThunk(
  'babyShowerGiftList/updateBabyShowerGift',
  async (gift: BabyShowerGift) => {
    // Simulate API call
    const updatedGift: BabyShowerGift = {
      ...gift,
      updatedAt: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 500));
    return updatedGift;
  },
);

export const deleteBabyShowerGift = createAsyncThunk(
  'babyShowerGiftList/deleteBabyShowerGift',
  async (giftId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return giftId;
  },
);

export const toggleBabyShowerGiftCompletion = createAsyncThunk(
  'babyShowerGiftList/toggleBabyShowerGiftCompletion',
  async (giftId: string, { getState }) => {
    const state = getState() as any;
    const gift = state.babyShowerGiftList.gifts.find(
      (g: BabyShowerGift) => g.id === giftId,
    );

    if (!gift) {
      throw new Error('Gift not found');
    }

    // Simulate API call
    const response = await new Promise<BabyShowerGift>(resolve => {
      setTimeout(() => {
        const updatedGift: BabyShowerGift = {
          ...gift,
          isCompleted: !gift.isCompleted,
          completedDate: !gift.isCompleted ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        };
        resolve(updatedGift);
      }, 500);
    });
    return response;
  },
);

const babyShowerGiftListSlice = createSlice({
  name: 'babyShowerGiftList',
  initialState,
  reducers: {
    setSelectedGift: (state, action: PayloadAction<BabyShowerGift | null>) => {
      state.selectedGift = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchBabyShowerGifts.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBabyShowerGifts.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts = action.payload;
        state.initialized = true;
      })
      .addCase(fetchBabyShowerGifts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch baby shower gifts';
      })
      .addCase(addBabyShowerGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addBabyShowerGift.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts.push(action.payload);
      })
      .addCase(addBabyShowerGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add baby shower gift';
      })
      .addCase(updateBabyShowerGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBabyShowerGift.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.gifts.findIndex(gift => gift.id === action.payload.id);
        if (index !== -1) {
          state.gifts[index] = action.payload;
        }
      })
      .addCase(updateBabyShowerGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update baby shower gift';
      })
      .addCase(deleteBabyShowerGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBabyShowerGift.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts = state.gifts.filter(gift => gift.id !== action.payload);
      })
      .addCase(deleteBabyShowerGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete baby shower gift';
      })
      .addCase(toggleBabyShowerGiftCompletion.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleBabyShowerGiftCompletion.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.gifts.findIndex(gift => gift.id === action.payload.id);
        if (index !== -1) {
          state.gifts[index] = action.payload;
        }
      })
      .addCase(toggleBabyShowerGiftCompletion.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || 'Failed to toggle baby shower gift completion';
      });
  },
});

export const { setSelectedGift, clearError } = babyShowerGiftListSlice.actions;
export default babyShowerGiftListSlice.reducer;
