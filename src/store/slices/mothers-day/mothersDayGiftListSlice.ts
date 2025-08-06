import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface MothersDayGift {
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

interface MothersDayGiftListState {
	gifts: MothersDayGift[];
	loading: boolean;
	error: string | null;
	selectedGift: MothersDayGift | null;
	initialized: boolean;
}

const initialState: MothersDayGiftListState = {
	gifts: [],
	loading: false,
	error: null,
	selectedGift: null,
	initialized: false,
};

// Async thunks
export const fetchMothersDayGifts = createAsyncThunk(
	"mothersDayGiftList/fetchMothersDayGifts",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentGifts = state.mothersDayGiftList.gifts;
		const isInitialized = state.mothersDayGiftList.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentGifts;
		}

		// Simulate API call
		const response = await new Promise<MothersDayGift[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						name: "Flowers",
						description: "Beautiful bouquet of roses",
						price: 75.0,
						recipient: "Mom",
						isCompleted: false,
						store: "Local Florist",
						notes: "Order early for Mother's Day",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
				]);
			}, 1000);
		});
		return response;
	}
);

export const addMothersDayGift = createAsyncThunk(
	"mothersDayGiftList/addMothersDayGift",
	async (gift: Omit<MothersDayGift, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const newGift: MothersDayGift = {
			...gift,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return newGift;
	}
);

export const updateMothersDayGift = createAsyncThunk(
	"mothersDayGiftList/updateMothersDayGift",
	async (gift: MothersDayGift) => {
		// Simulate API call
		const updatedGift: MothersDayGift = {
			...gift,
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return updatedGift;
	}
);

export const deleteMothersDayGift = createAsyncThunk(
	"mothersDayGiftList/deleteMothersDayGift",
	async (giftId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return giftId;
	}
);

const mothersDayGiftListSlice = createSlice({
	name: "mothersDayGiftList",
	initialState,
	reducers: {
		setSelectedGift: (state, action: PayloadAction<MothersDayGift | null>) => {
			state.selectedGift = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchMothersDayGifts.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchMothersDayGifts.fulfilled, (state, action) => {
				state.loading = false;
				state.gifts = action.payload;
				state.initialized = true;
			})
			.addCase(fetchMothersDayGifts.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch gifts";
			})
			.addCase(addMothersDayGift.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addMothersDayGift.fulfilled, (state, action) => {
				state.loading = false;
				state.gifts.push(action.payload);
			})
			.addCase(addMothersDayGift.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add gift";
			})
			.addCase(updateMothersDayGift.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateMothersDayGift.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.gifts.findIndex(
					(gift) => gift.id === action.payload.id
				);
				if (index !== -1) {
					state.gifts[index] = action.payload;
				}
			})
			.addCase(updateMothersDayGift.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update gift";
			})
			.addCase(deleteMothersDayGift.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteMothersDayGift.fulfilled, (state, action) => {
				state.loading = false;
				state.gifts = state.gifts.filter((gift) => gift.id !== action.payload);
			})
			.addCase(deleteMothersDayGift.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to delete gift";
			});
	},
});

export const { setSelectedGift, clearError } = mothersDayGiftListSlice.actions;
export default mothersDayGiftListSlice.reducer;
