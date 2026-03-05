import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FourthOfJulyCountdownState {
  targetDate: string | null;
  isActive: boolean;
}

const initialState: FourthOfJulyCountdownState = {
  targetDate: null,
  isActive: false,
};

const fourthOfJulyCountdownSlice = createSlice({
  name: 'fourthOfJulyCountdown',
  initialState,
  reducers: {
    setFourthOfJulyCountdown: (state, action: PayloadAction<string>) => {
      state.targetDate = action.payload;
      state.isActive = true;
    },
    updateFourthOfJulyCountdown: (state, action: PayloadAction<string>) => {
      state.targetDate = action.payload;
      state.isActive = true;
    },
    clearFourthOfJulyCountdown: state => {
      state.targetDate = null;
      state.isActive = false;
    },
  },
});

export const {
  setFourthOfJulyCountdown,
  updateFourthOfJulyCountdown,
  clearFourthOfJulyCountdown,
} = fourthOfJulyCountdownSlice.actions;

export default fourthOfJulyCountdownSlice.reducer;
