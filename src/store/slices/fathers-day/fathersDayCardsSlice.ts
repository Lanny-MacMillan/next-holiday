import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface FathersDayCard {
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

interface FathersDayCardsState {
	cards: FathersDayCard[];
	loading: boolean;
	error: string | null;
	selectedCard: FathersDayCard | null;
	initialized: boolean;
}

const initialState: FathersDayCardsState = {
	cards: [],
	loading: false,
	error: null,
	selectedCard: null,
	initialized: false,
};

// Async thunks
export const fetchFathersDayCards = createAsyncThunk(
	"fathersDayCards/fetchFathersDayCards",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentCards = state.fathersDayCards.cards;
		const isInitialized = state.fathersDayCards.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentCards;
		}

		// Simulate API call
		const response = await new Promise<FathersDayCard[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						recipient: "Dad",
						message:
							"Happy Father's Day! Thank you for everything you do. You're the best dad ever!",
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

export const addFathersDayCard = createAsyncThunk(
	"fathersDayCards/addFathersDayCard",
	async (card: Omit<FathersDayCard, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const newCard: FathersDayCard = {
			...card,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return newCard;
	}
);

export const updateFathersDayCard = createAsyncThunk(
	"fathersDayCards/updateFathersDayCard",
	async (card: FathersDayCard) => {
		// Simulate API call
		const updatedCard: FathersDayCard = {
			...card,
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return updatedCard;
	}
);

export const deleteFathersDayCard = createAsyncThunk(
	"fathersDayCards/deleteFathersDayCard",
	async (cardId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return cardId;
	}
);

const fathersDayCardsSlice = createSlice({
	name: "fathersDayCards",
	initialState,
	reducers: {
		setSelectedCard: (state, action: PayloadAction<FathersDayCard | null>) => {
			state.selectedCard = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchFathersDayCards.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchFathersDayCards.fulfilled, (state, action) => {
				state.loading = false;
				state.cards = action.payload;
				state.initialized = true;
			})
			.addCase(fetchFathersDayCards.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch Father's Day cards";
			})
			.addCase(addFathersDayCard.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addFathersDayCard.fulfilled, (state, action) => {
				state.loading = false;
				state.cards.push(action.payload);
			})
			.addCase(addFathersDayCard.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add Father's Day card";
			})
			.addCase(updateFathersDayCard.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateFathersDayCard.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.cards.findIndex(
					(card) => card.id === action.payload.id
				);
				if (index !== -1) {
					state.cards[index] = action.payload;
				}
			})
			.addCase(updateFathersDayCard.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update Father's Day card";
			})
			.addCase(deleteFathersDayCard.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteFathersDayCard.fulfilled, (state, action) => {
				state.loading = false;
				state.cards = state.cards.filter((card) => card.id !== action.payload);
			})
			.addCase(deleteFathersDayCard.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to delete Father's Day card";
			});
	},
});

export const { setSelectedCard, clearError } = fathersDayCardsSlice.actions;
export default fathersDayCardsSlice.reducer; 