import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ThanksgivingCountdownState {
	targetDate: string | null;
	isActive: boolean;
}

const initialState: ThanksgivingCountdownState = {
	targetDate: null,
	isActive: false,
};

const thanksgivingCountdownSlice = createSlice({
	name: "thanksgivingCountdown",
	initialState,
	reducers: {
		setThanksgivingCountdown: (state, action: PayloadAction<string>) => {
			state.targetDate = action.payload;
			state.isActive = true;
		},
		updateThanksgivingCountdown: (state, action: PayloadAction<string>) => {
			state.targetDate = action.payload;
			state.isActive = true;
		},
		clearThanksgivingCountdown: (state) => {
			state.targetDate = null;
			state.isActive = false;
		},
	},
});

export const {
	setThanksgivingCountdown,
	updateThanksgivingCountdown,
	clearThanksgivingCountdown,
} = thanksgivingCountdownSlice.actions;
export default thanksgivingCountdownSlice.reducer;
