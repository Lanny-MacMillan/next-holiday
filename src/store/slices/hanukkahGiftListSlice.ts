import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface HanukkahGift {
	id: string;
	name: string;
	description?: string;
	price: number;
	recipient: string;
	isCompleted: boolean;
	completedDate?: string;
	store?: string;
	productLink?: string;
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

interface HanukkahGiftListState {
	gifts: HanukkahGift[];
	loading: boolean;
	error: string | null;
	selectedGift: HanukkahGift | null;
	initialized: boolean;
}

const initialState: HanukkahGiftListState = {
	gifts: [],
	loading: false,
	error: null,
	selectedGift: null,
	initialized: false,
};

// Async thunks
export const fetchHanukkahGifts = createAsyncThunk(
	"hanukkahGiftList/fetchHanukkahGifts",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentGifts = state.hanukkahGiftList.gifts;
		const isInitialized = state.hanukkahGiftList.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentGifts;
		}

		// Simulate API call
		const response = await new Promise<HanukkahGift[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						name: "Dreidel Set",
						description: "Traditional Hanukkah dreidel game set",
						price: 25.99,
						recipient: "Sarah",
						isCompleted: false,
						store: "Jewish Bookstore",
						notes: "She loves playing dreidel games",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
				]);
			}, 1000);
		});
		return response;
	}
);

export const addHanukkahGift = createAsyncThunk(
	"hanukkahGiftList/addHanukkahGift",
	async (gift: Omit<HanukkahGift, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const newGift: HanukkahGift = {
			...gift,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return newGift;
	}
);

export const updateHanukkahGift = createAsyncThunk(
	"hanukkahGiftList/updateHanukkahGift",
	async (gift: HanukkahGift) => {
		// Simulate API call
		const updatedGift: HanukkahGift = {
			...gift,
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return updatedGift;
	}
);

export const deleteHanukkahGift = createAsyncThunk(
	"hanukkahGiftList/deleteHanukkahGift",
	async (giftId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return giftId;
	}
);

export const toggleHanukkahGiftCompletion = createAsyncThunk(
	"hanukkahGiftList/toggleHanukkahGiftCompletion",
	async (giftId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 300));
		return giftId;
	}
);

const hanukkahGiftListSlice = createSlice({
	name: "hanukkahGiftList",
	initialState,
	reducers: {
		setSelectedHanukkahGift: (
			state,
			action: PayloadAction<HanukkahGift | null>
		) => {
			state.selectedGift = action.payload;
		},
		clearHanukkahError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch Hanukkah gifts
			.addCase(fetchHanukkahGifts.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchHanukkahGifts.fulfilled, (state, action) => {
				state.loading = false;
				state.gifts = action.payload;
				state.initialized = true; // Set initialized to true on successful fetch
			})
			.addCase(fetchHanukkahGifts.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch Hanukkah gifts";
			})
			// Add Hanukkah gift
			.addCase(addHanukkahGift.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addHanukkahGift.fulfilled, (state, action) => {
				state.loading = false;
				state.gifts.push(action.payload);
			})
			.addCase(addHanukkahGift.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add Hanukkah gift";
			})
			// Update Hanukkah gift
			.addCase(updateHanukkahGift.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateHanukkahGift.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.gifts.findIndex(
					(gift) => gift.id === action.payload.id
				);
				if (index !== -1) {
					state.gifts[index] = action.payload;
				}
			})
			.addCase(updateHanukkahGift.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update Hanukkah gift";
			})
			// Delete Hanukkah gift
			.addCase(deleteHanukkahGift.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteHanukkahGift.fulfilled, (state, action) => {
				state.loading = false;
				state.gifts = state.gifts.filter((gift) => gift.id !== action.payload);
			})
			.addCase(deleteHanukkahGift.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to delete Hanukkah gift";
			})
			// Mark Hanukkah gift as purchased
			.addCase(toggleHanukkahGiftCompletion.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(toggleHanukkahGiftCompletion.fulfilled, (state, action) => {
				state.loading = false;
				const gift = state.gifts.find((g) => g.id === action.payload);
				if (gift) {
					gift.isCompleted = !gift.isCompleted;
					if (gift.isCompleted) {
						gift.completedDate = new Date().toISOString();
					} else {
						gift.completedDate = undefined;
					}
				}
			})
			.addCase(toggleHanukkahGiftCompletion.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to toggle Hanukkah gift completion";
			});
	},
});

export const { setSelectedHanukkahGift, clearHanukkahError } =
	hanukkahGiftListSlice.actions;
export default hanukkahGiftListSlice.reducer;
