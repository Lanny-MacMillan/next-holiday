import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface HolidayPreference {
	holiday: string;
	budget?: number;
	countdownTimer?: string; // ISO datetime string
}

export interface SaveHolidayPreferencesRequest {
	accountId: string;
	preferences: HolidayPreference[];
}

export interface HolidayPreferencesResponse {
	holiday: {
		id: string;
		accountId: string;
		holidayType: string;
		name: string;
		description?: string;
		startDate: string;
		endDate?: string;
		countdownTimer?: string;
		colorLight: string;
		colorDark: string;
		isCustom: boolean;
		createdBy: string;
		createdAt: string;
		updatedAt: string;
	};
	budget?: {
		id: string;
		holidayId: string;
		name: string;
		totalBudget: number;
		spentAmount: number;
		remainingAmount: number;
		currency: string;
		startDate: string;
		endDate: string;
		createdBy: string;
		createdAt: string;
		updatedAt: string;
	};
}

interface HolidayPreferencesState {
	loading: boolean;
	error: string | null;
	lastSaved: HolidayPreferencesResponse[] | null;
}

const initialState: HolidayPreferencesState = {
	loading: false,
	error: null,
	lastSaved: null,
};

// Async thunk to save holiday preferences
export const saveHolidayPreferences = createAsyncThunk(
	"holidayPreferences/saveHolidayPreferences",
	async (request: SaveHolidayPreferencesRequest & { auth0User?: any }) => {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};

		// Add authentication header if auth0User is provided
		if (request.auth0User) {
			headers["x-test-user"] = JSON.stringify({
				sub: request.auth0User.sub,
				email: request.auth0User.email,
				name: request.auth0User.name,
			});
		}

		const response = await fetch("/api/holidays/preferences", {
			method: "POST",
			headers,
			body: JSON.stringify({
				accountId: request.accountId,
				preferences: request.preferences,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Failed to save holiday preferences");
		}

		const result = await response.json();
		return result.data;
	}
);

const holidayPreferencesSlice = createSlice({
	name: "holidayPreferences",
	initialState,
	reducers: {
		clearError: (state) => {
			state.error = null;
		},
		clearLastSaved: (state) => {
			state.lastSaved = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Save holiday preferences
			.addCase(saveHolidayPreferences.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(saveHolidayPreferences.fulfilled, (state, action) => {
				state.loading = false;
				state.lastSaved = action.payload;
			})
			.addCase(saveHolidayPreferences.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to save holiday preferences";
			});
	},
});

export const { clearError, clearLastSaved } = holidayPreferencesSlice.actions;
export default holidayPreferencesSlice.reducer;
