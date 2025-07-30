import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface Card {
	id: string;
	title: string;
	recipient: string;
	message: string;
	design: string;
	isSent: boolean;
	sentDate?: string;
	createdAt: string;
	updatedAt: string;
}

interface CardsState {
	cards: Card[];
	loading: boolean;
	error: string | null;
	selectedCard: Card | null;
}

const initialState: CardsState = {
	cards: [],
	loading: false,
	error: null,
	selectedCard: null,
};

// Async thunks
export const fetchCards = createAsyncThunk("cards/fetchCards", async () => {
	// Simulate API call
	const response = await new Promise<Card[]>((resolve) => {
		setTimeout(() => {
			resolve([]); // Start with empty list
		}, 500);
	});
	return response;
});

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

export const sendCard = createAsyncThunk(
	"cards/sendCard",
	async (cardId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1000));
		return { cardId, sentDate: new Date().toISOString() };
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
			.addCase(sendCard.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(sendCard.fulfilled, (state, action) => {
				state.loading = false;
				const card = state.cards.find((c) => c.id === action.payload.cardId);
				if (card) {
					card.isSent = true;
					card.sentDate = action.payload.sentDate;
				}
			})
			.addCase(sendCard.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to send card";
			});
	},
});

export const { setSelectedCard, clearError } = cardsSlice.actions;
export default cardsSlice.reducer;
