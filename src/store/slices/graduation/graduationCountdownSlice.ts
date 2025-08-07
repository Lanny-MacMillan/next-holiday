import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface GraduationCountdownState {
	targetDate: string | null;
	isActive: boolean;
}

const initialState: GraduationCountdownState = {
	targetDate: null,
	isActive: false,
};

const graduationCountdownSlice = createSlice({
	name: "graduationCountdown",
	initialState,
	reducers: {
		setGraduationCountdown: (state, action: PayloadAction<string>) => {
			state.targetDate = action.payload;
			state.isActive = true;
		},
		updateGraduationCountdown: (state, action: PayloadAction<string>) => {
			state.targetDate = action.payload;
			state.isActive = true;
		},
		clearGraduationCountdown: (state) => {
			state.targetDate = null;
			state.isActive = false;
		},
	},
});

export const {
	setGraduationCountdown,
	updateGraduationCountdown,
	clearGraduationCountdown,
} = graduationCountdownSlice.actions;

export default graduationCountdownSlice.reducer;
