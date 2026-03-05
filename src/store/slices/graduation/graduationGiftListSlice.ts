import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface GraduationGift {
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

interface GraduationGiftListState {
  gifts: GraduationGift[];
  loading: boolean;
  error: string | null;
  selectedGift: GraduationGift | null;
  initialized: boolean;
}

const initialState: GraduationGiftListState = {
  gifts: [],
  loading: false,
  error: null,
  selectedGift: null,
  initialized: false,
};

// Async thunks
export const fetchGraduationGifts = createAsyncThunk(
  'graduationGiftList/fetchGraduationGifts',
  async (_, { getState }) => {
    // Get current state to check if we already have data
    const state = getState() as any;
    const currentGifts = state.graduationGiftList.gifts;
    const isInitialized = state.graduationGiftList.initialized;

    // Only fetch if we haven't initialized yet
    if (isInitialized) {
      return currentGifts;
    }

    // Simulate API call
    const response = await new Promise<GraduationGift[]>(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'Graduation Cap',
            description: 'Decorative graduation cap',
            price: 25.0,
            recipient: 'Graduate',
            isCompleted: false,
            store: 'Graduation Store',
            notes: 'Order in school colors',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }, 1000);
    });
    return response;
  },
);

export const addGraduationGift = createAsyncThunk(
  'graduationGiftList/addGraduationGift',
  async (gift: Omit<GraduationGift, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Simulate API call
    const newGift: GraduationGift = {
      ...gift,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 500));
    return newGift;
  },
);

export const updateGraduationGift = createAsyncThunk(
  'graduationGiftList/updateGraduationGift',
  async (gift: GraduationGift) => {
    // Simulate API call
    const updatedGift: GraduationGift = {
      ...gift,
      updatedAt: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 500));
    return updatedGift;
  },
);

export const deleteGraduationGift = createAsyncThunk(
  'graduationGiftList/deleteGraduationGift',
  async (giftId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return giftId;
  },
);

const graduationGiftListSlice = createSlice({
  name: 'graduationGiftList',
  initialState,
  reducers: {
    setSelectedGift: (state, action: PayloadAction<GraduationGift | null>) => {
      state.selectedGift = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchGraduationGifts.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGraduationGifts.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts = action.payload;
        state.initialized = true;
      })
      .addCase(fetchGraduationGifts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch graduation gifts';
      })
      .addCase(addGraduationGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addGraduationGift.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts.push(action.payload);
      })
      .addCase(addGraduationGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add graduation gift';
      })
      .addCase(updateGraduationGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateGraduationGift.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.gifts.findIndex(gift => gift.id === action.payload.id);
        if (index !== -1) {
          state.gifts[index] = action.payload;
        }
      })
      .addCase(updateGraduationGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update graduation gift';
      })
      .addCase(deleteGraduationGift.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteGraduationGift.fulfilled, (state, action) => {
        state.loading = false;
        state.gifts = state.gifts.filter(gift => gift.id !== action.payload);
      })
      .addCase(deleteGraduationGift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete graduation gift';
      });
  },
});

export const { setSelectedGift, clearError } = graduationGiftListSlice.actions;
export default graduationGiftListSlice.reducer;
