import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface NewYearGift {
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

interface NewYearGiftListState {
	gifts: NewYearGift[];
	loading: boolean;
	error: string | null;
	selectedGift: NewYearGift | null;
	initialized: boolean;
}

const initialState: NewYearGiftListState = {
	gifts: [],
	loading: false,
	error: null,
	selectedGift: null,
	initialized: false,
};

// Async thunks
export const fetchNewYearGifts = createAsyncThunk(
	"newYearGiftList/fetchNewYearGifts",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentGifts = state.newYearGiftList.gifts;
		const isInitialized = state.newYearGiftList.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentGifts;
		}

		// Simulate API call
		const response = await new Promise<NewYearGift[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						name: "Fireworks Set",
						description: "Assorted fireworks for New Year celebration",
						price: 45.99,
						recipient: "Family",
						isCompleted: false,
						store: "Fireworks Store",
						notes: "Make sure to check local regulations",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
				]);
			}, 1000);
		});
		return response;
	}
);

export const addNewYearGift = createAsyncThunk(
	"newYearGiftList/addNewYearGift",
	async (gift: Omit<NewYearGift, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const newGift: NewYearGift = {
			...gift,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return newGift;
	}
);

export const updateNewYearGift = createAsyncThunk(
	"newYearGiftList/updateNewYearGift",
	async (gift: NewYearGift) => {
		// Simulate API call
		const updatedGift: NewYearGift = {
			...gift,
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return updatedGift;
	}
);

export const deleteNewYearGift = createAsyncThunk(
	"newYearGiftList/deleteNewYearGift",
	async (id: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return id;
	}
);

export const toggleNewYearGiftCompletion = createAsyncThunk(
	"newYearGiftList/toggleNewYearGiftCompletion",
	async (id: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return id;
	}
);

const newYearGiftListSlice = createSlice({
	name: "newYearGiftList",
	initialState,
	reducers: {
		setSelectedGift: (state, action: PayloadAction<NewYearGift | null>) => {
			state.selectedGift = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch gifts
			.addCase(fetchNewYearGifts.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchNewYearGifts.fulfilled, (state, action) => {
				state.loading = false;
				state.gifts = action.payload;
				state.initialized = true;
			})
			.addCase(fetchNewYearGifts.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch gifts";
			})
			// Add gift
			.addCase(addNewYearGift.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addNewYearGift.fulfilled, (state, action) => {
				state.loading = false;
				state.gifts.push(action.payload);
			})
			.addCase(addNewYearGift.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add gift";
			})
			// Update gift
			.addCase(updateNewYearGift.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateNewYearGift.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.gifts.findIndex(
					(gift) => gift.id === action.payload.id
				);
				if (index !== -1) {
					state.gifts[index] = action.payload;
				}
			})
			.addCase(updateNewYearGift.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update gift";
			})
			// Delete gift
			.addCase(deleteNewYearGift.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteNewYearGift.fulfilled, (state, action) => {
				state.loading = false;
				state.gifts = state.gifts.filter((gift) => gift.id !== action.payload);
			})
			.addCase(deleteNewYearGift.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to delete gift";
			})
			// Toggle completion
			.addCase(toggleNewYearGiftCompletion.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(toggleNewYearGiftCompletion.fulfilled, (state, action) => {
				state.loading = false;
				const gift = state.gifts.find((gift) => gift.id === action.payload);
				if (gift) {
					gift.isCompleted = !gift.isCompleted;
					gift.completedDate = gift.isCompleted
						? new Date().toISOString()
						: undefined;
				}
			})
			.addCase(toggleNewYearGiftCompletion.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to toggle gift completion";
			});
	},
});

export const { setSelectedGift, clearError } = newYearGiftListSlice.actions;
export default newYearGiftListSlice.reducer;
