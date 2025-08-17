import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface ChristmasGuest {
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

interface ChristmasGuestListState {
	guests: ChristmasGuest[];
	loading: boolean;
	error: string | null;
	selectedGuest: ChristmasGuest | null;
	initialized: boolean;
}

const initialState: ChristmasGuestListState = {
	guests: [],
	loading: false,
	error: null,
	selectedGuest: null,
	initialized: false,
};

// Async thunks
export const fetchChristmasGuests = createAsyncThunk(
	"christmasGuestList/fetchChristmasGuests",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentGuests = state.christmasGuestList.guests;
		const isInitialized = state.christmasGuestList.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentGuests;
		}

		// Simulate API call
		const response = await new Promise<ChristmasGuest[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						name: "Emily and Tom Wilson",
						email: "emily.wilson@email.com",
						phone: "555-0123",
						address: "123 Pine Street, Anytown, CA 90210",
						rsvpStatus: "confirmed",
						numberOfGuests: 4,
						dietaryRestrictions: "None",
						bringingDish: "Christmas Ham",
						notes: "Will arrive around 3 PM",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "2",
						name: "Grandma Rose",
						email: "grandma.rose@email.com",
						phone: "555-0456",
						address: "456 Oak Avenue, Anytown, CA 90210",
						rsvpStatus: "confirmed",
						numberOfGuests: 1,
						bringingDish: "Christmas Cookies",
						notes: "Will bring the kids' favorite cookies",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "3",
						name: "Uncle Bob and Aunt Mary",
						email: "bob.mary@email.com",
						phone: "555-0789",
						address: "789 Elm Street, Anytown, CA 90210",
						rsvpStatus: "pending",
						numberOfGuests: 2,
						dietaryRestrictions: "Gluten-free",
						bringingDish: "Christmas Pudding",
						notes: "Checking if they can make it this year",
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

export const addChristmasGuest = createAsyncThunk(
	"christmasGuestList/addChristmasGuest",
	async (guest: Omit<ChristmasGuest, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const response = await new Promise<ChristmasGuest>((resolve) => {
			setTimeout(() => {
				const newGuest: ChristmasGuest = {
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

export const updateChristmasGuest = createAsyncThunk(
	"christmasGuestList/updateChristmasGuest",
	async (guest: ChristmasGuest) => {
		// Simulate API call
		const response = await new Promise<ChristmasGuest>((resolve) => {
			setTimeout(() => {
				const updatedGuest: ChristmasGuest = {
					...guest,
					updatedAt: new Date().toISOString(),
				};
				resolve(updatedGuest);
			}, 500);
		});
		return response;
	}
);

export const deleteChristmasGuest = createAsyncThunk(
	"christmasGuestList/deleteChristmasGuest",
	async (guestId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return guestId;
	}
);

export const toggleChristmasGuestCompletion = createAsyncThunk(
	"christmasGuestList/toggleChristmasGuestCompletion",
	async (guestId: string, { getState }) => {
		const state = getState() as any;
		const guest = state.christmasGuestList.guests.find(
			(g: ChristmasGuest) => g.id === guestId
		);

		if (!guest) {
			throw new Error("Guest not found");
		}

		const updatedGuest: ChristmasGuest = {
			...guest,
			isCompleted: !guest.isCompleted,
			completedDate: !guest.isCompleted ? new Date().toISOString() : undefined,
			updatedAt: new Date().toISOString(),
		};

		// Simulate API call
		const response = await new Promise<ChristmasGuest>((resolve) => {
			setTimeout(() => {
				resolve(updatedGuest);
			}, 500);
		});
		return response;
	}
);

const christmasGuestListSlice = createSlice({
	name: "christmasGuestList",
	initialState,
	reducers: {
		setSelectedGuest: (state, action: PayloadAction<ChristmasGuest | null>) => {
			state.selectedGuest = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch guests
			.addCase(fetchChristmasGuests.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchChristmasGuests.fulfilled, (state, action) => {
				state.loading = false;
				state.guests = action.payload;
				state.initialized = true;
			})
			.addCase(fetchChristmasGuests.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch guests";
			})
			// Add guest
			.addCase(addChristmasGuest.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addChristmasGuest.fulfilled, (state, action) => {
				state.loading = false;
				state.guests.push(action.payload);
			})
			.addCase(addChristmasGuest.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add guest";
			})
			// Update guest
			.addCase(updateChristmasGuest.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateChristmasGuest.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.guests.findIndex(
					(guest) => guest.id === action.payload.id
				);
				if (index !== -1) {
					state.guests[index] = action.payload;
				}
			})
			.addCase(updateChristmasGuest.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update guest";
			})
			// Delete guest
			.addCase(deleteChristmasGuest.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteChristmasGuest.fulfilled, (state, action) => {
				state.loading = false;
				state.guests = state.guests.filter(
					(guest) => guest.id !== action.payload
				);
			})
			.addCase(deleteChristmasGuest.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to delete guest";
			})
			// Toggle completion
			.addCase(toggleChristmasGuestCompletion.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(toggleChristmasGuestCompletion.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.guests.findIndex(
					(guest) => guest.id === action.payload.id
				);
				if (index !== -1) {
					state.guests[index] = action.payload;
				}
			})
			.addCase(toggleChristmasGuestCompletion.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to toggle guest completion";
			});
	},
});

export const { setSelectedGuest, clearError } = christmasGuestListSlice.actions;
export default christmasGuestListSlice.reducer;
