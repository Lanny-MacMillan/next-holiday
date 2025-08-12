import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface KwanzaaCountdownState {
	targetDate: string | null; // ISO string
	isActive: boolean;
}

const initialState: KwanzaaCountdownState = {
	targetDate: null,
	isActive: false,
};

const kwanzaaCountdownSlice = createSlice({
	name: "kwanzaaCountdown",
	initialState,
	reducers: {
		setKwanzaaCountdown: (state, action: PayloadAction<string>) => {
			state.targetDate = action.payload;
			state.isActive = true;
		},
		clearKwanzaaCountdown: (state) => {
			state.targetDate = null;
			state.isActive = false;
		},
		updateKwanzaaCountdown: (state, action: PayloadAction<string>) => {
			state.targetDate = action.payload;
		},
	},
});

export const {
	setKwanzaaCountdown,
	clearKwanzaaCountdown,
	updateKwanzaaCountdown,
} = kwanzaaCountdownSlice.actions;
export default kwanzaaCountdownSlice.reducer;
