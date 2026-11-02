import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Whether the leaderboard card is collapsed. Persisted with the rest of the UI preferences.
const leaderboardUiSlice = createSlice({
  name: 'leaderboardUi',
  initialState: { collapsed: false },
  reducers: {
    setLeaderboardCollapsed: (state, action: PayloadAction<boolean>) => {
      state.collapsed = action.payload;
    },
  },
});

export const { setLeaderboardCollapsed } = leaderboardUiSlice.actions;
export default leaderboardUiSlice.reducer;
