import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface BirthdayCard {
	id: string;
	recipient: string;
	message: string;
	isCompleted: boolean;
	completedDate?: string;
	dueDate?: string;
	priority: "low" | "medium" | "high";
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

interface BirthdayCardsState {
	cards: BirthdayCard[];
	loading: boolean;
	error: string | null;
	selectedCard: BirthdayCard | null;
	initialized: boolean;
}

const initialState: BirthdayCardsState = {
	cards: [],
	loading: false,
	error: null,
	selectedCard: null,
	initialized: false,
};

// Async thunks
export const fetchBirthdayCards = createAsyncThunk(
	"birthdayCards/fetchBirthdayCards",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentCards = state.birthdayCards.cards;
		const isInitialized = state.birthdayCards.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentCards;
		}

		// Simulate API call
		const response = await new Promise<BirthdayCard[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						recipient: "Mom",
						message:
							"Happy Birthday! Wishing you a wonderful day filled with joy and love.",
						isCompleted: false,
						priority: "high",
						notes: "Send by mail",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
				]);
			}, 1000);
		});
		return response;
	}
);

export const addBirthdayCard = createAsyncThunk(
	"birthdayCards/addBirthdayCard",
	async (card: Omit<BirthdayCard, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const newCard: BirthdayCard = {
			...card,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return newCard;
	}
);

export const updateBirthdayCard = createAsyncThunk(
	"birthdayCards/updateBirthdayCard",
	async (card: BirthdayCard) => {
		// Simulate API call
		const updatedCard: BirthdayCard = {
			...card,
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return updatedCard;
	}
);

export const deleteBirthdayCard = createAsyncThunk(
	"birthdayCards/deleteBirthdayCard",
	async (cardId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return cardId;
	}
);

const birthdayCardsSlice = createSlice({
	name: "birthdayCards",
	initialState,
	reducers: {
		setSelectedCard: (state, action: PayloadAction<BirthdayCard | null>) => {
			state.selectedCard = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchBirthdayCards.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchBirthdayCards.fulfilled, (state, action) => {
				state.loading = false;
				state.cards = action.payload;
				state.initialized = true;
			})
			.addCase(fetchBirthdayCards.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch birthday cards";
			})
			.addCase(addBirthdayCard.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addBirthdayCard.fulfilled, (state, action) => {
				state.loading = false;
				state.cards.push(action.payload);
			})
			.addCase(addBirthdayCard.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add birthday card";
			})
			.addCase(updateBirthdayCard.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateBirthdayCard.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.cards.findIndex(
					(card) => card.id === action.payload.id
				);
				if (index !== -1) {
					state.cards[index] = action.payload;
				}
			})
			.addCase(updateBirthdayCard.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update birthday card";
			})
			.addCase(deleteBirthdayCard.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteBirthdayCard.fulfilled, (state, action) => {
				state.loading = false;
				state.cards = state.cards.filter((card) => card.id !== action.payload);
			})
			.addCase(deleteBirthdayCard.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to delete birthday card";
			});
	},
});

export const { setSelectedCard, clearError } = birthdayCardsSlice.actions;
export default birthdayCardsSlice.reducer;
