import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface ThanksgivingGift {
  id: string;
  name: string;
  description?: string;
  price: number;
  recipient?: string;
  category?: string;
  isCompleted: boolean;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface ThanksgivingGiftListState {
  gifts: ThanksgivingGift[];
  loading: boolean;
  error: string | null;
  selectedGift: ThanksgivingGift | null;
  initialized: boolean;
}

const initialState: ThanksgivingGiftListState = {
  gifts: [],
  loading: false,
  error: null,
  selectedGift: null,
  initialized: false,
};

// Async thunks
export const fetchThanksgivingGifts = createAsyncThunk(
  'thanksgivingGiftList/fetchThanksgivingGifts',
  async (_, { getState }) => {
    const state = getState() as any;
    const currentGifts = state.thanksgivingGiftList.gifts;
    const isInitialized = state.thanksgivingGiftList.initialized;

    if (isInitialized) {
      return currentGifts;
    }

    const response = await new Promise<ThanksgivingGift[]>(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'Turkey',
            description: 'Main turkey for Thanksgiving dinner',
            price: 35.0,
            category: 'Food',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Stuffing Mix',
            description: 'Bread stuffing for turkey',
            price: 8.0,
            category: 'Food',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '3',
            name: 'Mashed Potatoes',
            description: 'Potatoes and ingredients for mashed potatoes',
            price: 12.0,
            category: 'Food',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '4',
            name: 'Cranberry Sauce',
            description: 'Cranberry sauce for dinner',
            price: 4.0,
            category: 'Food',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '5',
            name: 'Wine',
            description: 'Bottle of wine for dinner',
            price: 15.0,
            category: 'Beverages',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '6',
            name: 'Pumpkin Pie',
            description: 'Pumpkin pie for dessert',
            price: 8.0,
            category: 'Food',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '7',
            name: 'Table Decorations',
            description: 'Fall-themed table decorations',
            price: 20.0,
            category: 'Supplies',
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

export const addThanksgivingGift = createAsyncThunk(
  'thanksgivingGiftList/addThanksgivingGift',
  async (gift: Omit<ThanksgivingGift, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await new Promise<ThanksgivingGift>(resolve => {
      setTimeout(() => {
        const newGift: ThanksgivingGift = {
          ...gift,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        resolve(newGift);
      }, 500);
    });

    return response;
  },
);

export const updateThanksgivingGift = createAsyncThunk(
  'thanksgivingGiftList/updateThanksgivingGift',
  async (gift: ThanksgivingGift) => {
    const response = await new Promise<ThanksgivingGift>(resolve => {
      setTimeout(() => {
        const updatedGift: ThanksgivingGift = {
          ...gift,
          updatedAt: new Date().toISOString(),
        };
        resolve(updatedGift);
      }, 500);
    });

    return response;
  },
);

export const deleteThanksgivingGift = createAsyncThunk(
  'thanksgivingGiftList/deleteThanksgivingGift',
  async (giftId: string) => {
    await new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, 500);
    });

    return giftId;
  },
);

export const toggleThanksgivingGiftCompletion = createAsyncThunk(
  'thanksgivingGiftList/toggleThanksgivingGiftCompletion',
  async (giftId: string) => {
    await new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, 500);
    });

    return giftId;
  },
);

const thanksgivingGiftListSlice = createSlice({
  name: 'thanksgivingGiftList',
  initialState,
  reducers: {
    setSelectedGift: (state, action: PayloadAction<ThanksgivingGift | null>) => {
      state.selectedGift = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchThanksgivingGifts.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchThanksgivingGifts.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts = action.payload;
        state.initialized = true;
      })
      .addCase(fetchThanksgivingGifts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch gifts';
      })
      .addCase(addThanksgivingGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addThanksgivingGift.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts.push(action.payload);
      })
      .addCase(addThanksgivingGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add gift';
      })
      .addCase(updateThanksgivingGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateThanksgivingGift.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.gifts.findIndex(gift => gift.id === action.payload.id);
        if (index !== -1) {
          state.gifts[index] = action.payload;
        }
      })
      .addCase(updateThanksgivingGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update gift';
      })
      .addCase(deleteThanksgivingGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteThanksgivingGift.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts = state.gifts.filter(gift => gift.id !== action.payload);
      })
      .addCase(deleteThanksgivingGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete gift';
      })
      .addCase(toggleThanksgivingGiftCompletion.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleThanksgivingGiftCompletion.fulfilled, (state, action) => {
        state.loading = false;
        const gift = state.gifts.find(gift => gift.id === action.payload);
        if (gift) {
          gift.isCompleted = !gift.isCompleted;
          gift.completedDate = gift.isCompleted
            ? new Date().toISOString()
            : undefined;
          gift.updatedAt = new Date().toISOString();
        }
      })
      .addCase(toggleThanksgivingGiftCompletion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to toggle gift completion';
      });
  },
});

export const { setSelectedGift, clearError } = thanksgivingGiftListSlice.actions;
export default thanksgivingGiftListSlice.reducer;
