import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CountdownState {
	targetDate: string | null; // ISO string
	isActive: boolean;
}

const initialState: CountdownState = {
	targetDate: null,
	isActive: false,
};

const countdownSlice = createSlice({
	name: "countdown",
	initialState,
	reducers: {
		setCountdown: (state, action: PayloadAction<string>) => {
			state.targetDate = action.payload;
			state.isActive = true;
		},
		clearCountdown: (state) => {
			state.targetDate = null;
			state.isActive = false;
		},
		updateCountdown: (state, action: PayloadAction<string>) => {
			state.targetDate = action.payload;
		},
	},
});

export const { setCountdown, clearCountdown, updateCountdown } =
	countdownSlice.actions;
export default countdownSlice.reducer;
