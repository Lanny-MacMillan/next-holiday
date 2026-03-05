import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FathersDayCountdownState {
  targetDate: string | null;
  isActive: boolean;
}

const initialState: FathersDayCountdownState = {
  targetDate: null,
  isActive: false,
};

const fathersDayCountdownSlice = createSlice({
  name: 'fathersDayCountdown',
  initialState,
  reducers: {
    setFathersDayCountdown: (state, action: PayloadAction<string>) => {
      state.targetDate = action.payload;
      state.isActive = true;
    },
    updateFathersDayCountdown: (state, action: PayloadAction<string>) => {
      state.targetDate = action.payload;
      state.isActive = true;
    },
    clearFathersDayCountdown: state => {
      state.targetDate = null;
      state.isActive = false;
    },
  },
});

export const {
  setFathersDayCountdown,
  updateFathersDayCountdown,
  clearFathersDayCountdown,
} = fathersDayCountdownSlice.actions;

export default fathersDayCountdownSlice.reducer;
