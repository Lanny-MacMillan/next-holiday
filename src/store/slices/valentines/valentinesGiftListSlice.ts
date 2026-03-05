import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface ValentinesGift {
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

interface ValentinesGiftListState {
  gifts: ValentinesGift[];
  loading: boolean;
  error: string | null;
  selectedGift: ValentinesGift | null;
  initialized: boolean;
}

const initialState: ValentinesGiftListState = {
  gifts: [],
  loading: false,
  error: null,
  selectedGift: null,
  initialized: false,
};

// Async thunks
export const fetchValentinesGifts = createAsyncThunk(
  'valentinesGiftList/fetchValentinesGifts',
  async (_, { getState }) => {
    // Get current state to check if we already have data
    const state = getState() as any;
    const currentGifts = state.valentinesGiftList.gifts;
    const isInitialized = state.valentinesGiftList.initialized;

    // Only fetch if we haven't initialized yet
    if (isInitialized) {
      return currentGifts;
    }

    // Simulate API call
    const response = await new Promise<ValentinesGift[]>(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'Romantic Dinner',
            description: 'Reservation at favorite restaurant',
            price: 150.0,
            recipient: 'Partner',
            isCompleted: false,
            store: 'Local Restaurant',
            notes: "Make sure to book early for Valentine's Day",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }, 1000);
    });
    return response;
  },
);

export const addValentinesGift = createAsyncThunk(
  'valentinesGiftList/addValentinesGift',
  async (gift: Omit<ValentinesGift, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Simulate API call
    const newGift: ValentinesGift = {
      ...gift,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 500));
    return newGift;
  },
);

export const updateValentinesGift = createAsyncThunk(
  'valentinesGiftList/updateValentinesGift',
  async (gift: ValentinesGift) => {
    // Simulate API call
    const updatedGift: ValentinesGift = {
      ...gift,
      updatedAt: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 500));
    return updatedGift;
  },
);

export const deleteValentinesGift = createAsyncThunk(
  'valentinesGiftList/deleteValentinesGift',
  async (giftId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return giftId;
  },
);

export const toggleValentinesGiftCompletion = createAsyncThunk(
  'valentinesGiftList/toggleValentinesGiftCompletion',
  async (giftId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    return giftId;
  },
);

const valentinesGiftListSlice = createSlice({
  name: 'valentinesGiftList',
  initialState,
  reducers: {
    setSelectedValentinesGift: (
      state,
      action: PayloadAction<ValentinesGift | null>,
    ) => {
      state.selectedGift = action.payload;
    },
    clearValentinesError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch Valentine's gifts
      .addCase(fetchValentinesGifts.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchValentinesGifts.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts = action.payload;
        state.initialized = true; // Set initialized to true on successful fetch
      })
      .addCase(fetchValentinesGifts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch Valentine's gifts";
      })
      // Add Valentine's gift
      .addCase(addValentinesGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addValentinesGift.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts.push(action.payload);
      })
      .addCase(addValentinesGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to add Valentine's gift";
      })
      // Update Valentine's gift
      .addCase(updateValentinesGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateValentinesGift.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.gifts.findIndex(gift => gift.id === action.payload.id);
        if (index !== -1) {
          state.gifts[index] = action.payload;
        }
      })
      .addCase(updateValentinesGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update Valentine's gift";
      })
      // Delete Valentine's gift
      .addCase(deleteValentinesGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteValentinesGift.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts = state.gifts.filter(gift => gift.id !== action.payload);
      })
      .addCase(deleteValentinesGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete Valentine's gift";
      })
      // Mark Valentine's gift as purchased
      .addCase(toggleValentinesGiftCompletion.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleValentinesGiftCompletion.fulfilled, (state, action) => {
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
      .addCase(toggleValentinesGiftCompletion.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to toggle Valentine's gift completion";
      });
  },
});

export const { setSelectedValentinesGift, clearValentinesError } =
  valentinesGiftListSlice.actions;
export default valentinesGiftListSlice.reducer;
