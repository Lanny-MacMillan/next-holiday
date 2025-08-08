import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface FathersDayGift {
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

interface FathersDayGiftListState {
	gifts: FathersDayGift[];
	loading: boolean;
	error: string | null;
	selectedGift: FathersDayGift | null;
	initialized: boolean;
}

const initialState: FathersDayGiftListState = {
	gifts: [],
	loading: false,
	error: null,
	selectedGift: null,
	initialized: false,
};

// Async thunks
export const fetchFathersDayGifts = createAsyncThunk(
	"fathersDayGiftList/fetchFathersDayGifts",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentGifts = state.fathersDayGiftList.gifts;
		const isInitialized = state.fathersDayGiftList.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentGifts;
		}

		// Simulate API call
		const response = await new Promise<FathersDayGift[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						name: "Grill Set",
						description: "Professional grilling tools",
						price: 120.0,
						recipient: "Dad",
						isCompleted: false,
						store: "Home Depot",
						notes: "Perfect for Father's Day BBQ",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
				]);
			}, 1000);
		});
		return response;
	}
);

export const addFathersDayGift = createAsyncThunk(
	"fathersDayGiftList/addFathersDayGift",
	async (gift: Omit<FathersDayGift, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const newGift: FathersDayGift = {
			...gift,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return newGift;
	}
);

export const updateFathersDayGift = createAsyncThunk(
	"fathersDayGiftList/updateFathersDayGift",
	async (gift: FathersDayGift) => {
		// Simulate API call
		const updatedGift: FathersDayGift = {
			...gift,
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return updatedGift;
	}
);

export const deleteFathersDayGift = createAsyncThunk(
	"fathersDayGiftList/deleteFathersDayGift",
	async (giftId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return giftId;
	}
);

export const toggleFathersDayGiftCompletion = createAsyncThunk(
	"fathersDayGiftList/toggleFathersDayGiftCompletion",
	async (giftId: string, { getState }) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Get current state to find the gift
		const state = getState() as any;
		const gift = state.fathersDayGiftList.gifts.find(
			(g: FathersDayGift) => g.id === giftId
		);

		if (!gift) {
			throw new Error("Gift not found");
		}

		return {
			id: giftId,
			isCompleted: !gift.isCompleted,
			completedDate: !gift.isCompleted ? new Date().toISOString() : undefined,
		};
	}
);

const fathersDayGiftListSlice = createSlice({
	name: "fathersDayGiftList",
	initialState,
	reducers: {
		setSelectedGift: (state, action: PayloadAction<FathersDayGift | null>) => {
			state.selectedGift = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchFathersDayGifts.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchFathersDayGifts.fulfilled, (state, action) => {
				state.loading = false;
				state.gifts = action.payload;
				state.initialized = true;
			})
			.addCase(fetchFathersDayGifts.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch gifts";
			})
			.addCase(addFathersDayGift.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addFathersDayGift.fulfilled, (state, action) => {
				state.loading = false;
				state.gifts.push(action.payload);
			})
			.addCase(addFathersDayGift.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add gift";
			})
			.addCase(updateFathersDayGift.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateFathersDayGift.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.gifts.findIndex(
					(gift) => gift.id === action.payload.id
				);
				if (index !== -1) {
					state.gifts[index] = action.payload;
				}
			})
			.addCase(updateFathersDayGift.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update gift";
			})
			.addCase(deleteFathersDayGift.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteFathersDayGift.fulfilled, (state, action) => {
				state.loading = false;
				state.gifts = state.gifts.filter((gift) => gift.id !== action.payload);
			})
			.addCase(deleteFathersDayGift.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to delete gift";
			})
			.addCase(toggleFathersDayGiftCompletion.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(toggleFathersDayGiftCompletion.fulfilled, (state, action) => {
				state.loading = false;
				const gift = state.gifts.find((g) => g.id === action.payload.id);
				if (gift) {
					gift.isCompleted = action.payload.isCompleted;
					gift.completedDate = action.payload.completedDate;
				}
			})
			.addCase(toggleFathersDayGiftCompletion.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to toggle gift completion";
			});
	},
});

export const { setSelectedGift, clearError } = fathersDayGiftListSlice.actions;
export default fathersDayGiftListSlice.reducer;
