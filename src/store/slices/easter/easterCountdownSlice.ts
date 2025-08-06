import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface EasterCountdownState {
	targetDate: string | null;
	isActive: boolean;
}

const initialState: EasterCountdownState = {
	targetDate: null,
	isActive: false,
};

const easterCountdownSlice = createSlice({
	name: "easterCountdown",
	initialState,
	reducers: {
		setEasterCountdown: (state, action: PayloadAction<string>) => {
			state.targetDate = action.payload;
			state.isActive = true;
		},
		updateEasterCountdown: (state, action: PayloadAction<string>) => {
			state.targetDate = action.payload;
			state.isActive = true;
		},
		clearEasterCountdown: (state) => {
			state.targetDate = null;
			state.isActive = false;
		},
	},
});

export const {
	setEasterCountdown,
	updateEasterCountdown,
	clearEasterCountdown,
} = easterCountdownSlice.actions;
export default easterCountdownSlice.reducer;
