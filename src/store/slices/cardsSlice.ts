import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface Card {
	id: string;
	recipient: string;
	address?: string;
	message: string;
	isCompleted: boolean;
	completedDate?: string;
	createdAt: string;
	updatedAt: string;
}

interface CardsState {
	cards: Card[];
	loading: boolean;
	error: string | null;
	selectedCard: Card | null;
	initialized: boolean;
}

const initialState: CardsState = {
	cards: [],
	loading: false,
	error: null,
	selectedCard: null,
	initialized: false,
};

// Async thunks
export const fetchCards = createAsyncThunk(
	"cards/fetchCards",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentCards = state.cards.cards;
		const isInitialized = state.cards.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentCards;
		}

		// Simulate API call
		const response = await new Promise<Card[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						recipient: "Mom & Dad",
						address: "123 Oak Street, Anytown, CA 90210",
						message:
							"Wishing you a wonderful holiday season filled with joy and love.",
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

export const addCard = createAsyncThunk(
	"cards/addCard",
	async (card: Omit<Card, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const newCard: Card = {
			...card,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return newCard;
	}
);

export const updateCard = createAsyncThunk(
	"cards/updateCard",
	async (card: Card) => {
		// Simulate API call
		const updatedCard: Card = {
			...card,
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return updatedCard;
	}
);

export const deleteCard = createAsyncThunk(
	"cards/deleteCard",
	async (cardId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return cardId;
	}
);

export const toggleCardCompletion = createAsyncThunk(
	"cards/toggleCardCompletion",
	async (cardId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 300));
		return cardId;
	}
);

const cardsSlice = createSlice({
	name: "cards",
	initialState,
	reducers: {
		setSelectedCard: (state, action: PayloadAction<Card | null>) => {
			state.selectedCard = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch cards
			.addCase(fetchCards.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchCards.fulfilled, (state, action) => {
				state.loading = false;
				state.cards = action.payload;
				state.initialized = true; // Set initialized to true on successful fetch
			})
			.addCase(fetchCards.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch cards";
			})
			// Add card
			.addCase(addCard.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addCard.fulfilled, (state, action) => {
				state.loading = false;
				state.cards.push(action.payload);
			})
			.addCase(addCard.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add card";
			})
			// Update card
			.addCase(updateCard.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateCard.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.cards.findIndex(
					(card) => card.id === action.payload.id
				);
				if (index !== -1) {
					state.cards[index] = action.payload;
				}
			})
			.addCase(updateCard.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update card";
			})
			// Delete card
			.addCase(deleteCard.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteCard.fulfilled, (state, action) => {
				state.loading = false;
				state.cards = state.cards.filter((card) => card.id !== action.payload);
			})
			.addCase(deleteCard.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to delete card";
			})
			// Send card
			.addCase(toggleCardCompletion.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(toggleCardCompletion.fulfilled, (state, action) => {
				state.loading = false;
				const card = state.cards.find((c) => c.id === action.payload);
				if (card) {
					card.isCompleted = !card.isCompleted;
					if (card.isCompleted) {
						card.completedDate = new Date().toISOString();
					} else {
						card.completedDate = undefined;
					}
				}
			})
			.addCase(toggleCardCompletion.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to toggle card completion";
			});
	},
});

export const { setSelectedCard, clearError } = cardsSlice.actions;
export default cardsSlice.reducer;
