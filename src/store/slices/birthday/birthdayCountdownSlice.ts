import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface BirthdayCountdownState {
	targetDate: string | null;
	isActive: boolean;
}

const initialState: BirthdayCountdownState = {
	targetDate: null,
	isActive: false,
};

const birthdayCountdownSlice = createSlice({
	name: "birthdayCountdown",
	initialState,
	reducers: {
		setBirthdayCountdown: (state, action: PayloadAction<string>) => {
			state.targetDate = action.payload;
			state.isActive = true;
		},
		updateBirthdayCountdown: (state, action: PayloadAction<string>) => {
			state.targetDate = action.payload;
			state.isActive = true;
		},
		clearBirthdayCountdown: (state) => {
			state.targetDate = null;
			state.isActive = false;
		},
	},
});

export const {
	setBirthdayCountdown,
	updateBirthdayCountdown,
	clearBirthdayCountdown,
} = birthdayCountdownSlice.actions;

export default birthdayCountdownSlice.reducer;
