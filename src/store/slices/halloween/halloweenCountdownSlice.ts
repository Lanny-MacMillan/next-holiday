import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface HalloweenCountdownState {
  targetDate: string | null;
  isActive: boolean;
}

const initialState: HalloweenCountdownState = {
  targetDate: null,
  isActive: false,
};

const halloweenCountdownSlice = createSlice({
  name: 'halloweenCountdown',
  initialState,
  reducers: {
    setHalloweenCountdown: (state, action: PayloadAction<string>) => {
      state.targetDate = action.payload;
      state.isActive = true;
    },
    updateHalloweenCountdown: (state, action: PayloadAction<string>) => {
      state.targetDate = action.payload;
      state.isActive = true;
    },
    clearHalloweenCountdown: state => {
      state.targetDate = null;
      state.isActive = false;
    },
  },
});

export const {
  setHalloweenCountdown,
  updateHalloweenCountdown,
  clearHalloweenCountdown,
} = halloweenCountdownSlice.actions;
export default halloweenCountdownSlice.reducer;
