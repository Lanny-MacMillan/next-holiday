import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { HomeData } from "@/types/home";

interface HomeState {
	data: HomeData | null;
	loading: boolean;
	error: string | null;
	initialized: boolean;
}

const initialState: HomeState = {
	data: null,
	loading: false,
	error: null,
	initialized: false,
};

const homeSlice = createSlice({
	name: "home",
	initialState,
	reducers: {
		setHomeData: (state, action: PayloadAction<HomeData>) => {
			state.data = action.payload;
			state.initialized = true;
			state.loading = false;
			state.error = null;
		},
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.loading = action.payload;
		},
		setError: (state, action: PayloadAction<string | null>) => {
			state.error = action.payload;
			state.loading = false;
		},
		clearHomeData: (state) => {
			state.data = null;
			state.initialized = false;
			state.loading = false;
			state.error = null;
		},
	},
});

// Selectors
export const selectHomeData = (state: { home: HomeState }) => state.home.data;
export const selectHolidayPreferences = (state: { home: HomeState }) =>
	state.home.data?.holidayPreferences || [];
export const selectContacts = (state: { home: HomeState }) =>
	state.home.data?.contacts || [];
export const selectHomeLoading = (state: { home: HomeState }) =>
	state.home.loading;
export const selectHomeError = (state: { home: HomeState }) => state.home.error;
export const selectHomeInitialized = (state: { home: HomeState }) =>
	state.home.initialized;

export const { setHomeData, setLoading, setError, clearHomeData } =
	homeSlice.actions;
export default homeSlice.reducer;
