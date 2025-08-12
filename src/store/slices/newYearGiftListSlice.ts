import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Gift {
	id: string;
	name: string;
	price: number;
	recipient: string;
	isCompleted: boolean;
	notes: string;
	createdAt: string;
	updatedAt: string;
}

interface NewYearGiftListState {
	gifts: Gift[];
	loading: boolean;
	error: string | null;
}

const initialState: NewYearGiftListState = {
	gifts: [],
	loading: false,
	error: null,
};

const newYearGiftListSlice = createSlice({
	name: "newYearGiftList",
	initialState,
	reducers: {
		setNewYearGifts: (state, action: PayloadAction<Gift[]>) => {
			state.gifts = action.payload;
			state.loading = false;
			state.error = null;
		},
		addNewYearGift: (state, action: PayloadAction<Gift>) => {
			state.gifts.push(action.payload);
		},
		updateNewYearGift: (state, action: PayloadAction<Gift>) => {
			const index = state.gifts.findIndex(
				(gift) => gift.id === action.payload.id
			);
			if (index !== -1) {
				state.gifts[index] = action.payload;
			}
		},
		deleteNewYearGift: (state, action: PayloadAction<string>) => {
			state.gifts = state.gifts.filter(
				(gift) => gift.id !== action.payload
			);
		},
		toggleNewYearGiftCompletion: (state, action: PayloadAction<string>) => {
			const gift = state.gifts.find((gift) => gift.id === action.payload);
			if (gift) {
				gift.isCompleted = !gift.isCompleted;
				gift.updatedAt = new Date().toISOString();
			}
		},
		setNewYearGiftsLoading: (state, action: PayloadAction<boolean>) => {
			state.loading = action.payload;
		},
		setNewYearGiftsError: (state, action: PayloadAction<string | null>) => {
			state.error = action.payload;
			state.loading = false;
		},
	},
});

export const {
	setNewYearGifts,
	addNewYearGift,
	updateNewYearGift,
	deleteNewYearGift,
	toggleNewYearGiftCompletion,
	setNewYearGiftsLoading,
	setNewYearGiftsError,
} = newYearGiftListSlice.actions;

// Async thunk for fetching New Year gifts
export const fetchNewYearGifts = () => async (dispatch: any) => {
	dispatch(setNewYearGiftsLoading(true));
	try {
		// Simulate API call - replace with actual API endpoint
		const response = await fetch("/api/new-year-gifts");
		if (!response.ok) {
			throw new Error("Failed to fetch New Year gifts");
		}
		const gifts = await response.json();
		dispatch(setNewYearGifts(gifts));
	} catch (error) {
		dispatch(setNewYearGiftsError(error instanceof Error ? error.message : "Unknown error"));
	}
};

// Async thunk for creating a new New Year gift
export const createNewYearGift = (giftData: Omit<Gift, "id" | "createdAt" | "updatedAt">) => async (dispatch: any) => {
	try {
		const newGift: Gift = {
			...giftData,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		dispatch(addNewYearGift(newGift));
	} catch (error) {
		dispatch(setNewYearGiftsError(error instanceof Error ? error.message : "Unknown error"));
	}
};

// Async thunk for updating a New Year gift
export const updateNewYearGiftAsync = (giftData: Gift) => async (dispatch: any) => {
	try {
		const updatedGift: Gift = {
			...giftData,
			updatedAt: new Date().toISOString(),
		};
		dispatch(updateNewYearGift(updatedGift));
	} catch (error) {
		dispatch(setNewYearGiftsError(error instanceof Error ? error.message : "Unknown error"));
	}
};

// Async thunk for deleting a New Year gift
export const deleteNewYearGiftAsync = (giftId: string) => async (dispatch: any) => {
	try {
		dispatch(deleteNewYearGift(giftId));
	} catch (error) {
		dispatch(setNewYearGiftsError(error instanceof Error ? error.message : "Unknown error"));
	}
};

export default newYearGiftListSlice.reducer; 