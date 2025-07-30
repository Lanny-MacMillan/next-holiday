import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface Gift {
	id: string;
	name: string;
	description?: string;
	price: number;
	recipient: string;
	isPurchased: boolean;
	purchasedDate?: string;
	store?: string;
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

interface GiftListState {
	gifts: Gift[];
	loading: boolean;
	error: string | null;
	selectedGift: Gift | null;
	initialized: boolean;
}

const initialState: GiftListState = {
	gifts: [],
	loading: false,
	error: null,
	selectedGift: null,
	initialized: false,
};

// Async thunks
export const fetchGifts = createAsyncThunk(
	"giftList/fetchGifts",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentGifts = state.giftList.gifts;
		const isInitialized = state.giftList.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentGifts;
		}

		// Simulate API call
		const response = await new Promise<Gift[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						name: "Wireless Headphones",
						description: "Noise-cancelling wireless headphones",
						price: 199.99,
						recipient: "Dad",
						isPurchased: false,
						store: "Best Buy",
						notes: "He mentioned wanting new headphones",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
				]);
			}, 1000);
		});
		return response;
	}
);

export const addGift = createAsyncThunk(
	"giftList/addGift",
	async (gift: Omit<Gift, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const newGift: Gift = {
			...gift,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return newGift;
	}
);

export const updateGift = createAsyncThunk(
	"giftList/updateGift",
	async (gift: Gift) => {
		// Simulate API call
		const updatedGift: Gift = {
			...gift,
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return updatedGift;
	}
);

export const deleteGift = createAsyncThunk(
	"giftList/deleteGift",
	async (giftId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return giftId;
	}
);

export const markGiftAsPurchased = createAsyncThunk(
	"giftList/markGiftAsPurchased",
	async (giftId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return { giftId, purchasedDate: new Date().toISOString() };
	}
);

const giftListSlice = createSlice({
	name: "giftList",
	initialState,
	reducers: {
		setSelectedGift: (state, action: PayloadAction<Gift | null>) => {
			state.selectedGift = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch gifts
			.addCase(fetchGifts.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchGifts.fulfilled, (state, action) => {
				state.loading = false;
				state.gifts = action.payload;
				state.initialized = true; // Set initialized to true on successful fetch
			})
			.addCase(fetchGifts.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch gifts";
			})
			// Add gift
			.addCase(addGift.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addGift.fulfilled, (state, action) => {
				state.loading = false;
				state.gifts.push(action.payload);
			})
			.addCase(addGift.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add gift";
			})
			// Update gift
			.addCase(updateGift.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateGift.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.gifts.findIndex(
					(gift) => gift.id === action.payload.id
				);
				if (index !== -1) {
					state.gifts[index] = action.payload;
				}
			})
			.addCase(updateGift.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update gift";
			})
			// Delete gift
			.addCase(deleteGift.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteGift.fulfilled, (state, action) => {
				state.loading = false;
				state.gifts = state.gifts.filter((gift) => gift.id !== action.payload);
			})
			.addCase(deleteGift.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to delete gift";
			})
			// Mark gift as purchased
			.addCase(markGiftAsPurchased.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(markGiftAsPurchased.fulfilled, (state, action) => {
				state.loading = false;
				const gift = state.gifts.find((g) => g.id === action.payload.giftId);
				if (gift) {
					gift.isPurchased = true;
					gift.purchasedDate = action.payload.purchasedDate;
				}
			})
			.addCase(markGiftAsPurchased.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to mark gift as purchased";
			});
	},
});

export const { setSelectedGift, clearError } = giftListSlice.actions;
export default giftListSlice.reducer;
