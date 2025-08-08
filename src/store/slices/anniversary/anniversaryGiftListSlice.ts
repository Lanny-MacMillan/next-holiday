import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface AnniversaryGift {
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

interface AnniversaryGiftListState {
	gifts: AnniversaryGift[];
	loading: boolean;
	error: string | null;
	selectedGift: AnniversaryGift | null;
	initialized: boolean;
}

const initialState: AnniversaryGiftListState = {
	gifts: [],
	loading: false,
	error: null,
	selectedGift: null,
	initialized: false,
};

// Async thunks
export const fetchAnniversaryGifts = createAsyncThunk(
	"anniversaryGiftList/fetchAnniversaryGifts",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentGifts = state.anniversaryGiftList.gifts;
		const isInitialized = state.anniversaryGiftList.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentGifts;
		}

		// Simulate API call
		const response = await new Promise<AnniversaryGift[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						name: "Romantic Dinner",
						description: "Special anniversary dinner at favorite restaurant",
						price: 150.0,
						recipient: "Spouse",
						isCompleted: false,
						store: "Local Restaurant",
						notes: "Make reservation 2 weeks in advance",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
				]);
			}, 1000);
		});
		return response;
	}
);

export const addAnniversaryGift = createAsyncThunk(
	"anniversaryGiftList/addAnniversaryGift",
	async (gift: Omit<AnniversaryGift, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const newGift: AnniversaryGift = {
			...gift,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return newGift;
	}
);

export const updateAnniversaryGift = createAsyncThunk(
	"anniversaryGiftList/updateAnniversaryGift",
	async (gift: AnniversaryGift) => {
		// Simulate API call
		const updatedGift: AnniversaryGift = {
			...gift,
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return updatedGift;
	}
);

export const deleteAnniversaryGift = createAsyncThunk(
	"anniversaryGiftList/deleteAnniversaryGift",
	async (giftId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return giftId;
	}
);

export const toggleAnniversaryGiftCompletion = createAsyncThunk(
	"anniversaryGiftList/toggleAnniversaryGiftCompletion",
	async (giftId: string, { getState }) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Get current state to find the gift
		const state = getState() as any;
		const gift = state.anniversaryGiftList.gifts.find(
			(g: AnniversaryGift) => g.id === giftId
		);

		if (!gift) {
			throw new Error("Gift not found");
		}

		const updatedGift: AnniversaryGift = {
			...gift,
			isCompleted: !gift.isCompleted,
			completedDate: !gift.isCompleted ? new Date().toISOString() : undefined,
			updatedAt: new Date().toISOString(),
		};

		return updatedGift;
	}
);

const anniversaryGiftListSlice = createSlice({
	name: "anniversaryGiftList",
	initialState,
	reducers: {
		setSelectedGift: (state, action: PayloadAction<AnniversaryGift | null>) => {
			state.selectedGift = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchAnniversaryGifts.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchAnniversaryGifts.fulfilled, (state, action) => {
				state.loading = false;
				state.gifts = action.payload;
				state.initialized = true;
			})
			.addCase(fetchAnniversaryGifts.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to fetch anniversary gifts";
			})
			.addCase(addAnniversaryGift.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addAnniversaryGift.fulfilled, (state, action) => {
				state.loading = false;
				state.gifts.push(action.payload);
			})
			.addCase(addAnniversaryGift.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add anniversary gift";
			})
			.addCase(updateAnniversaryGift.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateAnniversaryGift.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.gifts.findIndex(
					(gift) => gift.id === action.payload.id
				);
				if (index !== -1) {
					state.gifts[index] = action.payload;
				}
			})
			.addCase(updateAnniversaryGift.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to update anniversary gift";
			})
			.addCase(deleteAnniversaryGift.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteAnniversaryGift.fulfilled, (state, action) => {
				state.loading = false;
				state.gifts = state.gifts.filter((gift) => gift.id !== action.payload);
			})
			.addCase(deleteAnniversaryGift.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to delete anniversary gift";
			})
			.addCase(toggleAnniversaryGiftCompletion.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(toggleAnniversaryGiftCompletion.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.gifts.findIndex(
					(gift) => gift.id === action.payload.id
				);
				if (index !== -1) {
					state.gifts[index] = action.payload;
				}
			})
			.addCase(toggleAnniversaryGiftCompletion.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message ||
					"Failed to toggle anniversary gift completion";
			});
	},
});

export const { setSelectedGift, clearError } = anniversaryGiftListSlice.actions;
export default anniversaryGiftListSlice.reducer;
