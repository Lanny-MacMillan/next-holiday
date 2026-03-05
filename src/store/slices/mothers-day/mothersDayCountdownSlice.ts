import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MothersDayCountdownState {
  targetDate: string | null;
  isActive: boolean;
}

const initialState: MothersDayCountdownState = {
  targetDate: null,
  isActive: false,
};

const mothersDayCountdownSlice = createSlice({
  name: 'mothersDayCountdown',
  initialState,
  reducers: {
    setMothersDayCountdown: (state, action: PayloadAction<string>) => {
      state.targetDate = action.payload;
      state.isActive = true;
    },
    updateMothersDayCountdown: (state, action: PayloadAction<string>) => {
      state.targetDate = action.payload;
      state.isActive = true;
    },
    clearMothersDayCountdown: state => {
      state.targetDate = null;
      state.isActive = false;
    },
  },
});

export const {
  setMothersDayCountdown,
  updateMothersDayCountdown,
  clearMothersDayCountdown,
} = mothersDayCountdownSlice.actions;

export default mothersDayCountdownSlice.reducer;
