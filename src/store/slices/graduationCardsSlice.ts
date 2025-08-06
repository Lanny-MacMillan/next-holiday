import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface GraduationCard {
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

interface GraduationCardsState {
	cards: GraduationCard[];
	loading: boolean;
	error: string | null;
	selectedCard: GraduationCard | null;
	initialized: boolean;
}

const initialState: GraduationCardsState = {
	cards: [],
	loading: false,
	error: null,
	selectedCard: null,
	initialized: false,
};

// Async thunks
export const fetchGraduationCards = createAsyncThunk(
	"graduationCards/fetchGraduationCards",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentCards = state.graduationCards.cards;
		const isInitialized = state.graduationCards.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentCards;
		}

		// Simulate API call
		const response = await new Promise<GraduationCard[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						recipient: "Graduate",
						message:
							"Congratulations on your graduation! Wishing you success in all your future endeavors.",
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

export const addGraduationCard = createAsyncThunk(
	"graduationCards/addGraduationCard",
	async (card: Omit<GraduationCard, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const newCard: GraduationCard = {
			...card,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return newCard;
	}
);

export const updateGraduationCard = createAsyncThunk(
	"graduationCards/updateGraduationCard",
	async (card: GraduationCard) => {
		// Simulate API call
		const updatedCard: GraduationCard = {
			...card,
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return updatedCard;
	}
);

export const deleteGraduationCard = createAsyncThunk(
	"graduationCards/deleteGraduationCard",
	async (cardId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return cardId;
	}
);

const graduationCardsSlice = createSlice({
	name: "graduationCards",
	initialState,
	reducers: {
		setSelectedCard: (state, action: PayloadAction<GraduationCard | null>) => {
			state.selectedCard = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchGraduationCards.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchGraduationCards.fulfilled, (state, action) => {
				state.loading = false;
				state.cards = action.payload;
				state.initialized = true;
			})
			.addCase(fetchGraduationCards.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to fetch graduation cards";
			})
			.addCase(addGraduationCard.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addGraduationCard.fulfilled, (state, action) => {
				state.loading = false;
				state.cards.push(action.payload);
			})
			.addCase(addGraduationCard.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add graduation card";
			})
			.addCase(updateGraduationCard.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateGraduationCard.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.cards.findIndex(
					(card) => card.id === action.payload.id
				);
				if (index !== -1) {
					state.cards[index] = action.payload;
				}
			})
			.addCase(updateGraduationCard.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to update graduation card";
			})
			.addCase(deleteGraduationCard.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteGraduationCard.fulfilled, (state, action) => {
				state.loading = false;
				state.cards = state.cards.filter((card) => card.id !== action.payload);
			})
			.addCase(deleteGraduationCard.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to delete graduation card";
			});
	},
});

export const { setSelectedCard, clearError } = graduationCardsSlice.actions;
export default graduationCardsSlice.reducer;
