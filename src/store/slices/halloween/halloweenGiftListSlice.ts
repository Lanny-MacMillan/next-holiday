import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface HalloweenGift {
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

interface HalloweenGiftListState {
  gifts: HalloweenGift[];
  loading: boolean;
  error: string | null;
  selectedGift: HalloweenGift | null;
  initialized: boolean;
}

const initialState: HalloweenGiftListState = {
  gifts: [],
  loading: false,
  error: null,
  selectedGift: null,
  initialized: false,
};

// Async thunks
export const fetchHalloweenGifts = createAsyncThunk(
  'halloweenGiftList/fetchHalloweenGifts',
  async (_, { getState }) => {
    // Get current state to check if we already have data
    const state = getState() as any;
    const currentGifts = state.halloweenGiftList.gifts;
    const isInitialized = state.halloweenGiftList.initialized;

    // Only fetch if we haven't initialized yet
    if (isInitialized) {
      return currentGifts;
    }

    // Simulate API call
    const response = await new Promise<HalloweenGift[]>(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'Pumpkin Carving Kit',
            description: 'Complete kit with tools and stencils',
            price: 15.99,
            category: 'Decorations',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Halloween Candy',
            description: 'Assorted candy for trick-or-treaters',
            price: 25.0,
            category: 'Trick-or-Treat',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '3',
            name: 'Spider Web Decorations',
            description: 'Fake spider webs for outdoor decoration',
            price: 8.99,
            category: 'Decorations',
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

export const addHalloweenGift = createAsyncThunk(
  'halloweenGiftList/addHalloweenGift',
  async (gift: Omit<HalloweenGift, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Simulate API call
    const response = await new Promise<HalloweenGift>(resolve => {
      setTimeout(() => {
        const newGift: HalloweenGift = {
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

export const updateHalloweenGift = createAsyncThunk(
  'halloweenGiftList/updateHalloweenGift',
  async (gift: HalloweenGift) => {
    // Simulate API call
    const response = await new Promise<HalloweenGift>(resolve => {
      setTimeout(() => {
        const updatedGift: HalloweenGift = {
          ...gift,
          updatedAt: new Date().toISOString(),
        };
        resolve(updatedGift);
      }, 500);
    });

    return response;
  },
);

export const deleteHalloweenGift = createAsyncThunk(
  'halloweenGiftList/deleteHalloweenGift',
  async (giftId: string) => {
    // Simulate API call
    await new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, 500);
    });

    return giftId;
  },
);

export const toggleHalloweenGiftCompletion = createAsyncThunk(
  'halloweenGiftList/toggleHalloweenGiftCompletion',
  async (giftId: string) => {
    // Simulate API call
    await new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, 500);
    });

    return giftId;
  },
);

const halloweenGiftListSlice = createSlice({
  name: 'halloweenGiftList',
  initialState,
  reducers: {
    setSelectedGift: (state, action: PayloadAction<HalloweenGift | null>) => {
      state.selectedGift = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchHalloweenGifts.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHalloweenGifts.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts = action.payload;
        state.initialized = true;
      })
      .addCase(fetchHalloweenGifts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch gifts';
      })
      .addCase(addHalloweenGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addHalloweenGift.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts.push(action.payload);
      })
      .addCase(addHalloweenGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add gift';
      })
      .addCase(updateHalloweenGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateHalloweenGift.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.gifts.findIndex(gift => gift.id === action.payload.id);
        if (index !== -1) {
          state.gifts[index] = action.payload;
        }
      })
      .addCase(updateHalloweenGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update gift';
      })
      .addCase(deleteHalloweenGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteHalloweenGift.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts = state.gifts.filter(gift => gift.id !== action.payload);
      })
      .addCase(deleteHalloweenGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete gift';
      })
      .addCase(toggleHalloweenGiftCompletion.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleHalloweenGiftCompletion.fulfilled, (state, action) => {
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
      .addCase(toggleHalloweenGiftCompletion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to toggle gift completion';
      });
  },
});

export const { setSelectedGift, clearError } = halloweenGiftListSlice.actions;
export default halloweenGiftListSlice.reducer;
