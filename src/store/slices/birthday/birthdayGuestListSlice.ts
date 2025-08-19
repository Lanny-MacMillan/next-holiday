import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface BirthdayGuest {
	id: string;
	name: string;
	email?: string;
	phone?: string;
	address?: string;
	rsvpStatus: "pending" | "confirmed" | "declined";
	numberOfGuests: number;
	dietaryRestrictions?: string;
	bringingDish?: string;
	notes?: string;
	isCompleted: boolean;
	completedDate?: string;
	createdAt: string;
	updatedAt: string;
}

interface BirthdayGuestListState {
	guests: BirthdayGuest[];
	loading: boolean;
	error: string | null;
	selectedGuest: BirthdayGuest | null;
	initialized: boolean;
}

const initialState: BirthdayGuestListState = {
	guests: [],
	loading: false,
	error: null,
	selectedGuest: null,
	initialized: false,
};

// Async thunks
export const fetchBirthdayGuests = createAsyncThunk(
	"birthdayGuestList/fetchBirthdayGuests",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentGuests = state.birthdayGuestList.guests;
		const isInitialized = state.birthdayGuestList.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentGuests;
		}

		// Simulate API call
		const response = await new Promise<BirthdayGuest[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						name: "Test Guest",
						email: "john@example.com",
						phone: "555-1234",
						rsvpStatus: "confirmed",
						numberOfGuests: 2,
						dietaryRestrictions: "Vegetarian",
						bringingDish: "Birthday cake",
						notes: "Will arrive at 2 PM",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
				]);
			}, 1000);
		});
		return response;
	}
);

export const addBirthdayGuest = createAsyncThunk(
	"birthdayGuestList/addBirthdayGuest",
	async (guest: Omit<BirthdayGuest, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const newGuest: BirthdayGuest = {
			...guest,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return newGuest;
	}
);

export const updateBirthdayGuest = createAsyncThunk(
	"birthdayGuestList/updateBirthdayGuest",
	async (guest: BirthdayGuest) => {
		// Simulate API call
		const updatedGuest: BirthdayGuest = {
			...guest,
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return updatedGuest;
	}
);

export const deleteBirthdayGuest = createAsyncThunk(
	"birthdayGuestList/deleteBirthdayGuest",
	async (guestId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return guestId;
	}
);

export const toggleBirthdayGuestCompletion = createAsyncThunk(
	"birthdayGuestList/toggleBirthdayGuestCompletion",
	async (guestId: string, { getState }) => {
		const state = getState() as any;
		const guest = state.birthdayGuestList.guests.find(
			(g: BirthdayGuest) => g.id === guestId
		);

		if (!guest) {
			throw new Error("Guest not found");
		}

		// Simulate API call
		const response = await new Promise<BirthdayGuest>((resolve) => {
			setTimeout(() => {
				const updatedGuest: BirthdayGuest = {
					...guest,
					isCompleted: !guest.isCompleted,
					completedDate: !guest.isCompleted
						? new Date().toISOString()
						: undefined,
					updatedAt: new Date().toISOString(),
				};
				resolve(updatedGuest);
			}, 500);
		});
		return response;
	}
);

const birthdayGuestListSlice = createSlice({
	name: "birthdayGuestList",
	initialState,
	reducers: {
		setSelectedGuest: (state, action: PayloadAction<BirthdayGuest | null>) => {
			state.selectedGuest = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchBirthdayGuests.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchBirthdayGuests.fulfilled, (state, action) => {
				state.loading = false;
				state.guests = action.payload;
				state.initialized = true;
			})
			.addCase(fetchBirthdayGuests.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch birthday guests";
			})
			.addCase(addBirthdayGuest.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addBirthdayGuest.fulfilled, (state, action) => {
				state.loading = false;
				state.guests.push(action.payload);
			})
			.addCase(addBirthdayGuest.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add birthday guest";
			})
			.addCase(updateBirthdayGuest.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateBirthdayGuest.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.guests.findIndex(
					(guest) => guest.id === action.payload.id
				);
				if (index !== -1) {
					state.guests[index] = action.payload;
				}
			})
			.addCase(updateBirthdayGuest.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update birthday guest";
			})
			.addCase(deleteBirthdayGuest.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteBirthdayGuest.fulfilled, (state, action) => {
				state.loading = false;
				state.guests = state.guests.filter(
					(guest) => guest.id !== action.payload
				);
			})
			.addCase(deleteBirthdayGuest.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to delete birthday guest";
			})
			.addCase(toggleBirthdayGuestCompletion.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(toggleBirthdayGuestCompletion.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.guests.findIndex((g) => g.id === action.payload.id);
				if (index !== -1) {
					state.guests[index] = action.payload;
				}
			})
			.addCase(toggleBirthdayGuestCompletion.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to toggle birthday guest completion";
			});
	},
});

export const { setSelectedGuest, clearError } = birthdayGuestListSlice.actions;
export default birthdayGuestListSlice.reducer;
