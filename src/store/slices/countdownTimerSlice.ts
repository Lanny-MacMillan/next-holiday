import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface CountdownTimerRequest {
	holidayId: string;
	countdownTimer: string | null; // ISO datetime string or null
}

export interface CountdownTimerResponse {
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

interface CountdownTimerState {
	loading: boolean;
	error: string | null;
	updatingHolidayId: string | null;
}

const initialState: CountdownTimerState = {
	loading: false,
	error: null,
	updatingHolidayId: null,
};

// Async thunk to update countdown timer
export const updateCountdownTimer = createAsyncThunk(
	"countdownTimer/updateCountdownTimer",
	async (request: CountdownTimerRequest & { auth0User?: any }) => {
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

		const response = await fetch(
			`/api/holidays/${request.holidayId}/countdown`,
			{
				method: "PUT",
				headers,
				body: JSON.stringify({
					countdownTimer: request.countdownTimer,
				}),
			}
		);

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Failed to update countdown timer");
		}

		const result = await response.json();
		return result.data;
	}
);

// Async thunk to clear countdown timer
export const clearCountdownTimer = createAsyncThunk(
	"countdownTimer/clearCountdownTimer",
	async (request: { holidayId: string; auth0User?: any }) => {
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

		const response = await fetch(
			`/api/holidays/${request.holidayId}/countdown`,
			{
				method: "DELETE",
				headers,
			}
		);

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Failed to clear countdown timer");
		}

		const result = await response.json();
		return result.data;
	}
);

const countdownTimerSlice = createSlice({
	name: "countdownTimer",
	initialState,
	reducers: {
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Update countdown timer
			.addCase(updateCountdownTimer.pending, (state, action) => {
				state.loading = true;
				state.error = null;
				state.updatingHolidayId = action.meta.arg.holidayId;
			})
			.addCase(updateCountdownTimer.fulfilled, (state) => {
				state.loading = false;
				state.updatingHolidayId = null;
			})
			.addCase(updateCountdownTimer.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to update countdown timer";
				state.updatingHolidayId = null;
			})
			// Clear countdown timer
			.addCase(clearCountdownTimer.pending, (state, action) => {
				state.loading = true;
				state.error = null;
				state.updatingHolidayId = action.meta.arg.holidayId;
			})
			.addCase(clearCountdownTimer.fulfilled, (state) => {
				state.loading = false;
				state.updatingHolidayId = null;
			})
			.addCase(clearCountdownTimer.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to clear countdown timer";
				state.updatingHolidayId = null;
			});
	},
});

export const { clearError } = countdownTimerSlice.actions;
export default countdownTimerSlice.reducer;
