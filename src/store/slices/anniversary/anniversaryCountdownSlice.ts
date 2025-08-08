import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AnniversaryCountdownState {
	targetDate: string | null;
	isActive: boolean;
}

const initialState: AnniversaryCountdownState = {
	targetDate: null,
	isActive: false,
};

const anniversaryCountdownSlice = createSlice({
	name: "anniversaryCountdown",
	initialState,
	reducers: {
		setAnniversaryCountdown: (state, action: PayloadAction<string>) => {
			state.targetDate = action.payload;
			state.isActive = true;
		},
		updateAnniversaryCountdown: (state, action: PayloadAction<string>) => {
			state.targetDate = action.payload;
			state.isActive = true;
		},
		clearAnniversaryCountdown: (state) => {
			state.targetDate = null;
			state.isActive = false;
		},
	},
});

export const {
	setAnniversaryCountdown,
	updateAnniversaryCountdown,
	clearAnniversaryCountdown,
} = anniversaryCountdownSlice.actions;

export default anniversaryCountdownSlice.reducer;
