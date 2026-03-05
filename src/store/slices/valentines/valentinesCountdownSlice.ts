import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ValentinesCountdownState {
  targetDate: string | null;
  isActive: boolean;
}

const initialState: ValentinesCountdownState = {
  targetDate: null,
  isActive: false,
};

const valentinesCountdownSlice = createSlice({
  name: 'valentinesCountdown',
  initialState,
  reducers: {
    setValentinesCountdown: (state, action: PayloadAction<string>) => {
      state.targetDate = action.payload;
      state.isActive = true;
    },
    updateValentinesCountdown: (state, action: PayloadAction<string>) => {
      state.targetDate = action.payload;
      state.isActive = true;
    },
    clearValentinesCountdown: state => {
      state.targetDate = null;
      state.isActive = false;
    },
  },
});

export const {
  setValentinesCountdown,
  updateValentinesCountdown,
  clearValentinesCountdown,
} = valentinesCountdownSlice.actions;
export default valentinesCountdownSlice.reducer;
