import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface HanukkahGuest {
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

interface HanukkahGuestListState {
	guests: HanukkahGuest[];
	loading: boolean;
	error: string | null;
	selectedGuest: HanukkahGuest | null;
	initialized: boolean;
}

const initialState: HanukkahGuestListState = {
	guests: [],
	loading: false,
	error: null,
	selectedGuest: null,
	initialized: false,
};

// Async thunks
export const fetchHanukkahGuests = createAsyncThunk(
	"hanukkahGuestList/fetchHanukkahGuests",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentGuests = state.hanukkahGuestList.guests;
		const isInitialized = state.hanukkahGuestList.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentGuests;
		}

		// Simulate API call
		const response = await new Promise<HanukkahGuest[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						name: "The Cohen Family",
						email: "cohen.family@email.com",
						phone: "555-0123",
						address: "123 Menorah Street, Anytown, CA 90210",
						rsvpStatus: "confirmed",
						numberOfGuests: 6,
						dietaryRestrictions: "Kosher",
						bringingDish: "Latkes",
						notes: "Will bring dreidels for the kids",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "2",
						name: "Rabbi Goldstein",
						email: "rabbi.goldstein@email.com",
						phone: "555-0456",
						address: "456 Temple Avenue, Anytown, CA 90210",
						rsvpStatus: "confirmed",
						numberOfGuests: 2,
						bringingDish: "Sufganiyot",
						notes: "Will lead the Hanukkah blessings",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "3",
						name: "The Rosenberg Family",
						email: "rosenberg.family@email.com",
						phone: "555-0789",
						address: "789 Star Street, Anytown, CA 90210",
						rsvpStatus: "pending",
						numberOfGuests: 4,
						dietaryRestrictions: "Vegetarian",
						bringingDish: "Hanukkah Cookies",
						notes: "Checking their schedule for the first night",
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

export const addHanukkahGuest = createAsyncThunk(
	"hanukkahGuestList/addHanukkahGuest",
	async (guest: Omit<HanukkahGuest, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const response = await new Promise<HanukkahGuest>((resolve) => {
			setTimeout(() => {
				const newGuest: HanukkahGuest = {
					...guest,
					id: Date.now().toString(),
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};
				resolve(newGuest);
			}, 500);
		});
		return response;
	}
);

export const updateHanukkahGuest = createAsyncThunk(
	"hanukkahGuestList/updateHanukkahGuest",
	async (guest: HanukkahGuest) => {
		// Simulate API call
		const response = await new Promise<HanukkahGuest>((resolve) => {
			setTimeout(() => {
				const updatedGuest: HanukkahGuest = {
					...guest,
					updatedAt: new Date().toISOString(),
				};
				resolve(updatedGuest);
			}, 500);
		});
		return response;
	}
);

export const deleteHanukkahGuest = createAsyncThunk(
	"hanukkahGuestList/deleteHanukkahGuest",
	async (guestId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return guestId;
	}
);

export const toggleHanukkahGuestCompletion = createAsyncThunk(
	"hanukkahGuestList/toggleHanukkahGuestCompletion",
	async (guestId: string, { getState }) => {
		const state = getState() as any;
		const guest = state.hanukkahGuestList.guests.find(
			(g: HanukkahGuest) => g.id === guestId
		);

		if (!guest) {
			throw new Error("Guest not found");
		}

		const updatedGuest: HanukkahGuest = {
			...guest,
			isCompleted: !guest.isCompleted,
			completedDate: !guest.isCompleted ? new Date().toISOString() : undefined,
			updatedAt: new Date().toISOString(),
		};

		// Simulate API call
		const response = await new Promise<HanukkahGuest>((resolve) => {
			setTimeout(() => {
				resolve(updatedGuest);
			}, 500);
		});
		return response;
	}
);

const hanukkahGuestListSlice = createSlice({
	name: "hanukkahGuestList",
	initialState,
	reducers: {
		setSelectedGuest: (state, action: PayloadAction<HanukkahGuest | null>) => {
			state.selectedGuest = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch guests
			.addCase(fetchHanukkahGuests.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchHanukkahGuests.fulfilled, (state, action) => {
				state.loading = false;
				state.guests = action.payload;
				state.initialized = true;
			})
			.addCase(fetchHanukkahGuests.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch guests";
			})
			// Add guest
			.addCase(addHanukkahGuest.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addHanukkahGuest.fulfilled, (state, action) => {
				state.loading = false;
				state.guests.push(action.payload);
			})
			.addCase(addHanukkahGuest.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add guest";
			})
			// Update guest
			.addCase(updateHanukkahGuest.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateHanukkahGuest.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.guests.findIndex(
					(guest) => guest.id === action.payload.id
				);
				if (index !== -1) {
					state.guests[index] = action.payload;
				}
			})
			.addCase(updateHanukkahGuest.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update guest";
			})
			// Delete guest
			.addCase(deleteHanukkahGuest.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteHanukkahGuest.fulfilled, (state, action) => {
				state.loading = false;
				state.guests = state.guests.filter(
					(guest) => guest.id !== action.payload
				);
			})
			.addCase(deleteHanukkahGuest.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to delete guest";
			})
			// Toggle completion
			.addCase(toggleHanukkahGuestCompletion.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(toggleHanukkahGuestCompletion.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.guests.findIndex(
					(guest) => guest.id === action.payload.id
				);
				if (index !== -1) {
					state.guests[index] = action.payload;
				}
			})
			.addCase(toggleHanukkahGuestCompletion.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to toggle guest completion";
			});
	},
});

export const { setSelectedGuest, clearError } = hanukkahGuestListSlice.actions;
export default hanukkahGuestListSlice.reducer;
