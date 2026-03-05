import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface BirthdayGift {
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

interface BirthdayGiftListState {
  gifts: BirthdayGift[];
  loading: boolean;
  error: string | null;
  selectedGift: BirthdayGift | null;
  initialized: boolean;
}

const initialState: BirthdayGiftListState = {
  gifts: [],
  loading: false,
  error: null,
  selectedGift: null,
  initialized: false,
};

// Async thunks
export const fetchBirthdayGifts = createAsyncThunk(
  'birthdayGiftList/fetchBirthdayGifts',
  async (_, { getState }) => {
    // Get current state to check if we already have data
    const state = getState() as any;
    const currentGifts = state.birthdayGiftList.gifts;
    const isInitialized = state.birthdayGiftList.initialized;

    // Only fetch if we haven't initialized yet
    if (isInitialized) {
      return currentGifts;
    }

    // Simulate API call
    const response = await new Promise<BirthdayGift[]>(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'Birthday Cake',
            description: 'Delicious birthday cake',
            price: 45.0,
            recipient: 'Friend',
            isCompleted: false,
            store: 'Local Bakery',
            notes: 'Order 2 days in advance',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }, 1000);
    });
    return response;
  },
);

export const addBirthdayGift = createAsyncThunk(
  'birthdayGiftList/addBirthdayGift',
  async (gift: Omit<BirthdayGift, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Simulate API call
    const newGift: BirthdayGift = {
      ...gift,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 500));
    return newGift;
  },
);

export const updateBirthdayGift = createAsyncThunk(
  'birthdayGiftList/updateBirthdayGift',
  async (gift: BirthdayGift) => {
    // Simulate API call
    const updatedGift: BirthdayGift = {
      ...gift,
      updatedAt: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 500));
    return updatedGift;
  },
);

export const deleteBirthdayGift = createAsyncThunk(
  'birthdayGiftList/deleteBirthdayGift',
  async (giftId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return giftId;
  },
);

export const toggleBirthdayGiftCompletion = createAsyncThunk(
  'birthdayGiftList/toggleBirthdayGiftCompletion',
  async (giftId: string, { getState }) => {
    const state = getState() as any;
    const gift = state.birthdayGiftList.gifts.find(
      (g: BirthdayGift) => g.id === giftId,
    );

    if (!gift) {
      throw new Error('Gift not found');
    }

    // Simulate API call
    const response = await new Promise<BirthdayGift>(resolve => {
      setTimeout(() => {
        const updatedGift: BirthdayGift = {
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

const birthdayGiftListSlice = createSlice({
  name: 'birthdayGiftList',
  initialState,
  reducers: {
    setSelectedGift: (state, action: PayloadAction<BirthdayGift | null>) => {
      state.selectedGift = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchBirthdayGifts.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBirthdayGifts.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts = action.payload;
        state.initialized = true;
      })
      .addCase(fetchBirthdayGifts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch birthday gifts';
      })
      .addCase(addBirthdayGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addBirthdayGift.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts.push(action.payload);
      })
      .addCase(addBirthdayGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add birthday gift';
      })
      .addCase(updateBirthdayGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBirthdayGift.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.gifts.findIndex(gift => gift.id === action.payload.id);
        if (index !== -1) {
          state.gifts[index] = action.payload;
        }
      })
      .addCase(updateBirthdayGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update birthday gift';
      })
      .addCase(deleteBirthdayGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBirthdayGift.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts = state.gifts.filter(gift => gift.id !== action.payload);
      })
      .addCase(deleteBirthdayGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete birthday gift';
      })
      .addCase(toggleBirthdayGiftCompletion.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleBirthdayGiftCompletion.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.gifts.findIndex(g => g.id === action.payload.id);
        if (index !== -1) {
          state.gifts[index] = action.payload;
        }
      })
      .addCase(toggleBirthdayGiftCompletion.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || 'Failed to toggle birthday gift completion';
      });
  },
});

export const { setSelectedGift, clearError } = birthdayGiftListSlice.actions;
export default birthdayGiftListSlice.reducer;
