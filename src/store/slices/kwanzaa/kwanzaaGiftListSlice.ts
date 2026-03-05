import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface KwanzaaGift {
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

interface KwanzaaGiftListState {
  gifts: KwanzaaGift[];
  loading: boolean;
  error: string | null;
  selectedGift: KwanzaaGift | null;
  initialized: boolean;
}

const initialState: KwanzaaGiftListState = {
  gifts: [],
  loading: false,
  error: null,
  selectedGift: null,
  initialized: false,
};

// Async thunks
export const fetchKwanzaaGifts = createAsyncThunk(
  'kwanzaaGiftList/fetchKwanzaaGifts',
  async (_, { getState }) => {
    // Get current state to check if we already have data
    const state = getState() as any;
    const currentGifts = state.kwanzaaGiftList.gifts;
    const isInitialized = state.kwanzaaGiftList.initialized;

    // Only fetch if we haven't initialized yet
    if (isInitialized) {
      return currentGifts;
    }

    // Simulate API call
    const response = await new Promise<KwanzaaGift[]>(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'Kente Cloth',
            description: 'Traditional African fabric for Kwanzaa celebrations',
            price: 45.99,
            recipient: 'Family',
            isCompleted: false,
            store: 'African Heritage Store',
            notes: 'For table decoration during Kwanzaa',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Kinara',
            description: 'Traditional candle holder for the seven principles',
            price: 35.5,
            recipient: 'Home',
            isCompleted: false,
            store: 'Cultural Crafts',
            notes: 'Essential for Kwanzaa celebrations',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }, 1000);
    });
    return response;
  },
);

export const addKwanzaaGift = createAsyncThunk(
  'kwanzaaGiftList/addKwanzaaGift',
  async (gift: Omit<KwanzaaGift, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Simulate API call
    const newGift: KwanzaaGift = {
      ...gift,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 500));
    return newGift;
  },
);

export const updateKwanzaaGift = createAsyncThunk(
  'kwanzaaGiftList/updateKwanzaaGift',
  async (gift: KwanzaaGift) => {
    // Simulate API call
    const updatedGift: KwanzaaGift = {
      ...gift,
      updatedAt: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 500));
    return updatedGift;
  },
);

export const deleteKwanzaaGift = createAsyncThunk(
  'kwanzaaGiftList/deleteKwanzaaGift',
  async (giftId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return giftId;
  },
);

export const toggleKwanzaaGiftCompletion = createAsyncThunk(
  'kwanzaaGiftList/toggleKwanzaaGiftCompletion',
  async (giftId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    return giftId;
  },
);

const kwanzaaGiftListSlice = createSlice({
  name: 'kwanzaaGiftList',
  initialState,
  reducers: {
    setSelectedKwanzaaGift: (state, action: PayloadAction<KwanzaaGift | null>) => {
      state.selectedGift = action.payload;
    },
    clearKwanzaaError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch Kwanzaa gifts
      .addCase(fetchKwanzaaGifts.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchKwanzaaGifts.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts = action.payload;
        state.initialized = true; // Set initialized to true on successful fetch
      })
      .addCase(fetchKwanzaaGifts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch Kwanzaa gifts';
      })
      // Add Kwanzaa gift
      .addCase(addKwanzaaGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addKwanzaaGift.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts.push(action.payload);
      })
      .addCase(addKwanzaaGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add Kwanzaa gift';
      })
      // Update Kwanzaa gift
      .addCase(updateKwanzaaGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateKwanzaaGift.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.gifts.findIndex(gift => gift.id === action.payload.id);
        if (index !== -1) {
          state.gifts[index] = action.payload;
        }
      })
      .addCase(updateKwanzaaGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update Kwanzaa gift';
      })
      // Delete Kwanzaa gift
      .addCase(deleteKwanzaaGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteKwanzaaGift.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts = state.gifts.filter(gift => gift.id !== action.payload);
      })
      .addCase(deleteKwanzaaGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete Kwanzaa gift';
      })
      // Mark Kwanzaa gift as purchased
      .addCase(toggleKwanzaaGiftCompletion.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleKwanzaaGiftCompletion.fulfilled, (state, action) => {
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
      .addCase(toggleKwanzaaGiftCompletion.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || 'Failed to toggle Kwanzaa gift completion';
      });
  },
});

export const { setSelectedKwanzaaGift, clearKwanzaaError } =
  kwanzaaGiftListSlice.actions;
export default kwanzaaGiftListSlice.reducer;
