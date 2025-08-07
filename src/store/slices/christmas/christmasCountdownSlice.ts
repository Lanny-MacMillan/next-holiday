import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ChristmasCountdownState {
	targetDate: string | null;
	isActive: boolean;
}

const initialState: ChristmasCountdownState = {
	targetDate: null,
	isActive: false,
};

const christmasCountdownSlice = createSlice({
	name: "christmasCountdown",
	initialState,
	reducers: {
		setChristmasCountdown: (state, action: PayloadAction<string>) => {
			state.targetDate = action.payload;
			state.isActive = true;
		},
		updateChristmasCountdown: (state, action: PayloadAction<string>) => {
			state.targetDate = action.payload;
			state.isActive = true;
		},
		clearChristmasCountdown: (state) => {
			state.targetDate = null;
			state.isActive = false;
		},
	},
});

export const {
	setChristmasCountdown,
	updateChristmasCountdown,
	clearChristmasCountdown,
} = christmasCountdownSlice.actions;

export default christmasCountdownSlice.reducer;
