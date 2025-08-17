import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface HalloweenBudgetItem {
	id: string;
	name: string;
	description?: string;
	amount: number;
	category: "Decorations" | "Costumes" | "Candy" | "Party Supplies" | "Other";
	date: string;
	isExpense: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface HalloweenBudget {
	id: string;
	name: string;
	totalBudget: number;
	spentAmount: number;
	remainingAmount: number;
	currency: string;
	startDate: string;
	endDate: string;
	createdAt: string;
	updatedAt: string;
}

interface HalloweenBudgetState {
	budgets: HalloweenBudget[];
	budgetItems: HalloweenBudgetItem[];
	loading: boolean;
	error: string | null;
	selectedBudget: HalloweenBudget | null;
	selectedBudgetItem: HalloweenBudgetItem | null;
	initialized: boolean;
}

const initialState: HalloweenBudgetState = {
	budgets: [],
	budgetItems: [],
	loading: false,
	error: null,
	selectedBudget: null,
	selectedBudgetItem: null,
	initialized: false,
};

// Async thunks
export const fetchHalloweenBudgets = createAsyncThunk(
	"halloweenBudget/fetchHalloweenBudgets",
	async (_, { getState }) => {
		const state = getState() as any;
		const currentBudgets = state.halloweenBudget.budgets;
		const isInitialized = state.halloweenBudget.initialized;

		if (isInitialized) {
			return currentBudgets;
		}

		const response = await new Promise<HalloweenBudget[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						name: "Halloween 2024 Budget",
						totalBudget: 200,
						spentAmount: 0,
						remainingAmount: 200,
						currency: "USD",
						startDate: new Date().toISOString(),
						endDate: new Date("2024-10-31").toISOString(),
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
				]);
			}, 1000);
		});

		return response;
	}
);

export const fetchHalloweenBudgetItems = createAsyncThunk(
	"halloweenBudget/fetchHalloweenBudgetItems",
	async (_, { getState }) => {
		const state = getState() as any;
		const currentItems = state.halloweenBudget.budgetItems;
		const isInitialized = state.halloweenBudget.initialized;

		if (isInitialized) {
			return currentItems;
		}

		const response = await new Promise<HalloweenBudgetItem[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						name: "Halloween Candy",
						description: "Candy for trick-or-treaters",
						amount: 25.0,
						category: "Candy",
						date: new Date().toISOString(),
						isExpense: true,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "2",
						name: "Pumpkin Carving Kit",
						description: "Tools and stencils for pumpkin carving",
						amount: 15.99,
						category: "Decorations",
						date: new Date().toISOString(),
						isExpense: true,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "3",
						name: "Spider Web Decorations",
						description: "Fake spider webs for outdoor decoration",
						amount: 8.99,
						category: "Decorations",
						date: new Date().toISOString(),
						isExpense: true,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
				]);
			}, 1000);
		});

		return response;
	}
);

export const addHalloweenBudget = createAsyncThunk(
	"halloweenBudget/addHalloweenBudget",
	async (budget: Omit<HalloweenBudget, "id" | "createdAt" | "updatedAt">) => {
		const response = await new Promise<HalloweenBudget>((resolve) => {
			setTimeout(() => {
				const newBudget: HalloweenBudget = {
					...budget,
					id: Date.now().toString(),
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};
				resolve(newBudget);
			}, 500);
		});

		return response;
	}
);

export const addHalloweenBudgetItem = createAsyncThunk(
	"halloweenBudget/addHalloweenBudgetItem",
	async (item: Omit<HalloweenBudgetItem, "id" | "createdAt" | "updatedAt">) => {
		const response = await new Promise<HalloweenBudgetItem>((resolve) => {
			setTimeout(() => {
				const newItem: HalloweenBudgetItem = {
					...item,
					id: Date.now().toString(),
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};
				resolve(newItem);
			}, 500);
		});

		return response;
	}
);

export const updateHalloweenBudget = createAsyncThunk(
	"halloweenBudget/updateHalloweenBudget",
	async (budget: HalloweenBudget) => {
		const response = await new Promise<HalloweenBudget>((resolve) => {
			setTimeout(() => {
				const updatedBudget: HalloweenBudget = {
					...budget,
					updatedAt: new Date().toISOString(),
				};
				resolve(updatedBudget);
			}, 500);
		});

		return response;
	}
);

export const updateHalloweenBudgetItem = createAsyncThunk(
	"halloweenBudget/updateHalloweenBudgetItem",
	async (item: HalloweenBudgetItem) => {
		const response = await new Promise<HalloweenBudgetItem>((resolve) => {
			setTimeout(() => {
				const updatedItem: HalloweenBudgetItem = {
					...item,
					updatedAt: new Date().toISOString(),
				};
				resolve(updatedItem);
			}, 500);
		});

		return response;
	}
);

export const deleteHalloweenBudget = createAsyncThunk(
	"halloweenBudget/deleteHalloweenBudget",
	async (id: string) => {
		await new Promise<void>((resolve) => {
			setTimeout(() => {
				resolve();
			}, 500);
		});

		return id;
	}
);

export const deleteHalloweenBudgetItem = createAsyncThunk(
	"halloweenBudget/deleteHalloweenBudgetItem",
	async (id: string) => {
		await new Promise<void>((resolve) => {
			setTimeout(() => {
				resolve();
			}, 500);
		});

		return id;
	}
);

const halloweenBudgetSlice = createSlice({
	name: "halloweenBudget",
	initialState,
	reducers: {
		setSelectedBudget: (
			state,
			action: PayloadAction<HalloweenBudget | null>
		) => {
			state.selectedBudget = action.payload;
		},
		setSelectedBudgetItem: (
			state,
			action: PayloadAction<HalloweenBudgetItem | null>
		) => {
			state.selectedBudgetItem = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		// Fetch budgets
		builder
			.addCase(fetchHalloweenBudgets.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchHalloweenBudgets.fulfilled, (state, action) => {
				state.loading = false;
				state.budgets = action.payload;
				state.initialized = true;
			})
			.addCase(fetchHalloweenBudgets.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch budgets";
			});

		// Fetch budget items
		builder
			.addCase(fetchHalloweenBudgetItems.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchHalloweenBudgetItems.fulfilled, (state, action) => {
				state.loading = false;
				state.budgetItems = action.payload;
				state.initialized = true;
			})
			.addCase(fetchHalloweenBudgetItems.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch budget items";
			});

		// Add budget
		builder
			.addCase(addHalloweenBudget.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addHalloweenBudget.fulfilled, (state, action) => {
				state.loading = false;
				state.budgets.push(action.payload);
			})
			.addCase(addHalloweenBudget.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add budget";
			});

		// Add budget item
		builder
			.addCase(addHalloweenBudgetItem.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addHalloweenBudgetItem.fulfilled, (state, action) => {
				state.loading = false;
				state.budgetItems.push(action.payload);
			})
			.addCase(addHalloweenBudgetItem.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add budget item";
			});

		// Update budget
		builder
			.addCase(updateHalloweenBudget.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateHalloweenBudget.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.budgets.findIndex(
					(budget) => budget.id === action.payload.id
				);
				if (index !== -1) {
					state.budgets[index] = action.payload;
				}
			})
			.addCase(updateHalloweenBudget.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update budget";
			});

		// Update budget item
		builder
			.addCase(updateHalloweenBudgetItem.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateHalloweenBudgetItem.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.budgetItems.findIndex(
					(item) => item.id === action.payload.id
				);
				if (index !== -1) {
					state.budgetItems[index] = action.payload;
				}
			})
			.addCase(updateHalloweenBudgetItem.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update budget item";
			});

		// Delete budget
		builder
			.addCase(deleteHalloweenBudget.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteHalloweenBudget.fulfilled, (state, action) => {
				state.loading = false;
				state.budgets = state.budgets.filter(
					(budget) => budget.id !== action.payload
				);
			})
			.addCase(deleteHalloweenBudget.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to delete budget";
			});

		// Delete budget item
		builder
			.addCase(deleteHalloweenBudgetItem.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteHalloweenBudgetItem.fulfilled, (state, action) => {
				state.loading = false;
				state.budgetItems = state.budgetItems.filter(
					(item) => item.id !== action.payload
				);
			})
			.addCase(deleteHalloweenBudgetItem.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to delete budget item";
			});
	},
});

export const { setSelectedBudget, setSelectedBudgetItem, clearError } =
	halloweenBudgetSlice.actions;

export default halloweenBudgetSlice.reducer;
