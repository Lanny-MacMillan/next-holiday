import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface HanukkahCountdownState {
	targetDate: string | null; // ISO string
	isActive: boolean;
}

const initialState: HanukkahCountdownState = {
	targetDate: null,
	isActive: false,
};

const hanukkahCountdownSlice = createSlice({
	name: "hanukkahCountdown",
	initialState,
	reducers: {
		setHanukkahCountdown: (state, action: PayloadAction<string>) => {
			state.targetDate = action.payload;
			state.isActive = true;
		},
		clearHanukkahCountdown: (state) => {
			state.targetDate = null;
			state.isActive = false;
		},
		updateHanukkahCountdown: (state, action: PayloadAction<string>) => {
			state.targetDate = action.payload;
		},
	},
});

export const {
	setHanukkahCountdown,
	clearHanukkahCountdown,
	updateHanukkahCountdown,
} = hanukkahCountdownSlice.actions;
export default hanukkahCountdownSlice.reducer;
