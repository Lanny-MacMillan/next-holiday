import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface ThanksgivingBudgetItem {
  id: string;
  name: string;
  description?: string;
  amount: number;
  category:
    | 'Food & Ingredients'
    | 'Decorations'
    | 'Tableware'
    | 'Kitchen Supplies'
    | 'Other';
  date: string;
  isExpense: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ThanksgivingBudget {
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

interface ThanksgivingBudgetState {
  budgets: ThanksgivingBudget[];
  budgetItems: ThanksgivingBudgetItem[];
  loading: boolean;
  error: string | null;
  selectedBudget: ThanksgivingBudget | null;
  selectedBudgetItem: ThanksgivingBudgetItem | null;
  initialized: boolean;
}

const initialState: ThanksgivingBudgetState = {
  budgets: [],
  budgetItems: [],
  loading: false,
  error: null,
  selectedBudget: null,
  selectedBudgetItem: null,
  initialized: false,
};

// Async thunks
export const fetchThanksgivingBudgets = createAsyncThunk(
  'thanksgivingBudget/fetchThanksgivingBudgets',
  async (_, { getState }) => {
    const state = getState() as any;
    const currentBudgets = state.thanksgivingBudget.budgets;
    const isInitialized = state.thanksgivingBudget.initialized;

    if (isInitialized) {
      return currentBudgets;
    }

    const response = await new Promise<ThanksgivingBudget[]>(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'Thanksgiving 2024 Budget',
            totalBudget: 300,
            spentAmount: 0,
            remainingAmount: 300,
            currency: 'USD',
            startDate: new Date().toISOString(),
            endDate: new Date('2024-11-28').toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }, 1000);
    });

    return response;
  },
);

export const fetchThanksgivingBudgetItems = createAsyncThunk(
  'thanksgivingBudget/fetchThanksgivingBudgetItems',
  async (_, { getState }) => {
    const state = getState() as any;
    const currentItems = state.thanksgivingBudget.budgetItems;
    const isInitialized = state.thanksgivingBudget.initialized;

    if (isInitialized) {
      return currentItems;
    }

    const response = await new Promise<ThanksgivingBudgetItem[]>(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'Turkey',
            description: 'Fresh turkey for Thanksgiving dinner',
            amount: 45.99,
            category: 'Food & Ingredients',
            date: new Date().toISOString(),
            isExpense: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Pumpkin Pie Ingredients',
            description: 'Pumpkin, spices, pie crust, and other ingredients',
            amount: 18.5,
            category: 'Food & Ingredients',
            date: new Date().toISOString(),
            isExpense: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '3',
            name: 'Tablecloth and Napkins',
            description: 'Festive table setting items',
            amount: 25.99,
            category: 'Tableware',
            date: new Date().toISOString(),
            isExpense: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '4',
            name: 'Fall Decorations',
            description: 'Pumpkins, leaves, and autumn-themed decorations',
            amount: 35.0,
            category: 'Decorations',
            date: new Date().toISOString(),
            isExpense: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }, 1000);
    });

    return response;
  },
);

export const addThanksgivingBudget = createAsyncThunk(
  'thanksgivingBudget/addThanksgivingBudget',
  async (budget: Omit<ThanksgivingBudget, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await new Promise<ThanksgivingBudget>(resolve => {
      setTimeout(() => {
        const newBudget: ThanksgivingBudget = {
          ...budget,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        resolve(newBudget);
      }, 500);
    });

    return response;
  },
);

export const addThanksgivingBudgetItem = createAsyncThunk(
  'thanksgivingBudget/addThanksgivingBudgetItem',
  async (item: Omit<ThanksgivingBudgetItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await new Promise<ThanksgivingBudgetItem>(resolve => {
      setTimeout(() => {
        const newItem: ThanksgivingBudgetItem = {
          ...item,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        resolve(newItem);
      }, 500);
    });

    return response;
  },
);

export const updateThanksgivingBudget = createAsyncThunk(
  'thanksgivingBudget/updateThanksgivingBudget',
  async (budget: ThanksgivingBudget) => {
    const response = await new Promise<ThanksgivingBudget>(resolve => {
      setTimeout(() => {
        const updatedBudget: ThanksgivingBudget = {
          ...budget,
          updatedAt: new Date().toISOString(),
        };
        resolve(updatedBudget);
      }, 500);
    });

    return response;
  },
);

export const updateThanksgivingBudgetItem = createAsyncThunk(
  'thanksgivingBudget/updateThanksgivingBudgetItem',
  async (item: ThanksgivingBudgetItem) => {
    const response = await new Promise<ThanksgivingBudgetItem>(resolve => {
      setTimeout(() => {
        const updatedItem: ThanksgivingBudgetItem = {
          ...item,
          updatedAt: new Date().toISOString(),
        };
        resolve(updatedItem);
      }, 500);
    });

    return response;
  },
);

export const deleteThanksgivingBudget = createAsyncThunk(
  'thanksgivingBudget/deleteThanksgivingBudget',
  async (id: string) => {
    await new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, 500);
    });

    return id;
  },
);

export const deleteThanksgivingBudgetItem = createAsyncThunk(
  'thanksgivingBudget/deleteThanksgivingBudgetItem',
  async (id: string) => {
    await new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, 500);
    });

    return id;
  },
);

const thanksgivingBudgetSlice = createSlice({
  name: 'thanksgivingBudget',
  initialState,
  reducers: {
    setSelectedBudget: (state, action: PayloadAction<ThanksgivingBudget | null>) => {
      state.selectedBudget = action.payload;
    },
    setSelectedBudgetItem: (
      state,
      action: PayloadAction<ThanksgivingBudgetItem | null>,
    ) => {
      state.selectedBudgetItem = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    // Fetch budgets
    builder
      .addCase(fetchThanksgivingBudgets.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchThanksgivingBudgets.fulfilled, (state, action) => {
        state.loading = false;
        state.budgets = action.payload;
        state.initialized = true;
      })
      .addCase(fetchThanksgivingBudgets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch budgets';
      });

    // Fetch budget items
    builder
      .addCase(fetchThanksgivingBudgetItems.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchThanksgivingBudgetItems.fulfilled, (state, action) => {
        state.loading = false;
        state.budgetItems = action.payload;
        state.initialized = true;
      })
      .addCase(fetchThanksgivingBudgetItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch budget items';
      });

    // Add budget
    builder
      .addCase(addThanksgivingBudget.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addThanksgivingBudget.fulfilled, (state, action) => {
        state.loading = false;
        state.budgets.push(action.payload);
      })
      .addCase(addThanksgivingBudget.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add budget';
      });

    // Add budget item
    builder
      .addCase(addThanksgivingBudgetItem.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addThanksgivingBudgetItem.fulfilled, (state, action) => {
        state.loading = false;
        state.budgetItems.push(action.payload);
      })
      .addCase(addThanksgivingBudgetItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add budget item';
      });

    // Update budget
    builder
      .addCase(updateThanksgivingBudget.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateThanksgivingBudget.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.budgets.findIndex(
          budget => budget.id === action.payload.id,
        );
        if (index !== -1) {
          state.budgets[index] = action.payload;
        }
      })
      .addCase(updateThanksgivingBudget.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update budget';
      });

    // Update budget item
    builder
      .addCase(updateThanksgivingBudgetItem.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateThanksgivingBudgetItem.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.budgetItems.findIndex(
          item => item.id === action.payload.id,
        );
        if (index !== -1) {
          state.budgetItems[index] = action.payload;
        }
      })
      .addCase(updateThanksgivingBudgetItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update budget item';
      });

    // Delete budget
    builder
      .addCase(deleteThanksgivingBudget.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteThanksgivingBudget.fulfilled, (state, action) => {
        state.loading = false;
        state.budgets = state.budgets.filter(budget => budget.id !== action.payload);
      })
      .addCase(deleteThanksgivingBudget.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete budget';
      });

    // Delete budget item
    builder
      .addCase(deleteThanksgivingBudgetItem.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteThanksgivingBudgetItem.fulfilled, (state, action) => {
        state.loading = false;
        state.budgetItems = state.budgetItems.filter(
          item => item.id !== action.payload,
        );
      })
      .addCase(deleteThanksgivingBudgetItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete budget item';
      });
  },
});

export const { setSelectedBudget, setSelectedBudgetItem, clearError } =
  thanksgivingBudgetSlice.actions;

export default thanksgivingBudgetSlice.reducer;
