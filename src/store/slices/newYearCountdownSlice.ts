import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface NewYearCountdownState {
	targetDate: string | null;
	isActive: boolean;
}

const initialState: NewYearCountdownState = {
	targetDate: null,
	isActive: false,
};

const newYearCountdownSlice = createSlice({
	name: "newYearCountdown",
	initialState,
	reducers: {
		setNewYearCountdown: (state, action: PayloadAction<string>) => {
			state.targetDate = action.payload;
			state.isActive = true;
		},
		updateNewYearCountdown: (state, action: PayloadAction<string>) => {
			state.targetDate = action.payload;
			state.isActive = true;
		},
		clearNewYearCountdown: (state) => {
			state.targetDate = null;
			state.isActive = false;
		},
	},
});

export const {
	setNewYearCountdown,
	updateNewYearCountdown,
	clearNewYearCountdown,
} = newYearCountdownSlice.actions;
export default newYearCountdownSlice.reducer;
