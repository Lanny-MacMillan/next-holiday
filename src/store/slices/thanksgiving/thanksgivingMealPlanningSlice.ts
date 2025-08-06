import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Recipe } from "@/components/cards/recipe/RecipeCard";

interface ThanksgivingMealPlanningState {
	recipes: Recipe[];
	loading: boolean;
	error: string | null;
	selectedRecipe: Recipe | null;
	initialized: boolean;
}

const initialState: ThanksgivingMealPlanningState = {
	recipes: [],
	loading: false,
	error: null,
	selectedRecipe: null,
	initialized: false,
};

// Async thunks
export const fetchThanksgivingRecipes = createAsyncThunk(
	"thanksgivingMealPlanning/fetchThanksgivingRecipes",
	async (_, { getState }) => {
		const state = getState() as any;
		const currentRecipes = state.thanksgivingMealPlanning.recipes;
		const isInitialized = state.thanksgivingMealPlanning.initialized;

		if (isInitialized) {
			return currentRecipes;
		}

		const response = await new Promise<Recipe[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						title: "Classic Roasted Turkey",
						description:
							"Traditional Thanksgiving turkey with herbs and butter",
						cookTime: "4 hours",
						prepTime: "30 minutes",
						servings: 12,
						difficulty: "medium",
						category: "Main Dish",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "2",
						title: "Mashed Potatoes",
						description: "Creamy mashed potatoes with butter and cream",
						cookTime: "30 minutes",
						prepTime: "15 minutes",
						servings: 8,
						difficulty: "easy",
						category: "Side Dish",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "3",
						title: "Stuffing",
						description: "Traditional bread stuffing with herbs and vegetables",
						cookTime: "45 minutes",
						prepTime: "20 minutes",
						servings: 10,
						difficulty: "medium",
						category: "Side Dish",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "4",
						title: "Cranberry Sauce",
						description: "Homemade cranberry sauce with orange zest",
						cookTime: "20 minutes",
						prepTime: "10 minutes",
						servings: 8,
						difficulty: "easy",
						category: "Condiment",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "5",
						title: "Pumpkin Pie",
						description: "Classic pumpkin pie with whipped cream",
						cookTime: "1 hour",
						prepTime: "30 minutes",
						servings: 8,
						difficulty: "medium",
						category: "Dessert",
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

export const addThanksgivingRecipe = createAsyncThunk(
	"thanksgivingMealPlanning/addThanksgivingRecipe",
	async (recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">) => {
		const response = await new Promise<Recipe>((resolve) => {
			setTimeout(() => {
				const newRecipe: Recipe = {
					...recipe,
					id: Date.now().toString(),
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};
				resolve(newRecipe);
			}, 500);
		});

		return response;
	}
);

export const updateThanksgivingRecipe = createAsyncThunk(
	"thanksgivingMealPlanning/updateThanksgivingRecipe",
	async (recipe: Recipe) => {
		const response = await new Promise<Recipe>((resolve) => {
			setTimeout(() => {
				const updatedRecipe: Recipe = {
					...recipe,
					updatedAt: new Date().toISOString(),
				};
				resolve(updatedRecipe);
			}, 500);
		});

		return response;
	}
);

export const deleteThanksgivingRecipe = createAsyncThunk(
	"thanksgivingMealPlanning/deleteThanksgivingRecipe",
	async (recipeId: string) => {
		await new Promise<void>((resolve) => {
			setTimeout(() => {
				resolve();
			}, 500);
		});

		return recipeId;
	}
);

export const toggleThanksgivingRecipeCompletion = createAsyncThunk(
	"thanksgivingMealPlanning/toggleThanksgivingRecipeCompletion",
	async (recipeId: string) => {
		await new Promise<void>((resolve) => {
			setTimeout(() => {
				resolve();
			}, 500);
		});

		return recipeId;
	}
);

const thanksgivingMealPlanningSlice = createSlice({
	name: "thanksgivingMealPlanning",
	initialState,
	reducers: {
		setSelectedRecipe: (state, action: PayloadAction<Recipe | null>) => {
			state.selectedRecipe = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchThanksgivingRecipes.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchThanksgivingRecipes.fulfilled, (state, action) => {
				state.loading = false;
				state.recipes = action.payload;
				state.initialized = true;
			})
			.addCase(fetchThanksgivingRecipes.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch recipes";
			})
			.addCase(addThanksgivingRecipe.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addThanksgivingRecipe.fulfilled, (state, action) => {
				state.loading = false;
				state.recipes.push(action.payload);
			})
			.addCase(addThanksgivingRecipe.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add recipe";
			})
			.addCase(updateThanksgivingRecipe.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateThanksgivingRecipe.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.recipes.findIndex(
					(recipe) => recipe.id === action.payload.id
				);
				if (index !== -1) {
					state.recipes[index] = action.payload;
				}
			})
			.addCase(updateThanksgivingRecipe.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update recipe";
			})
			.addCase(deleteThanksgivingRecipe.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteThanksgivingRecipe.fulfilled, (state, action) => {
				state.loading = false;
				state.recipes = state.recipes.filter(
					(recipe) => recipe.id !== action.payload
				);
			})
			.addCase(deleteThanksgivingRecipe.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to delete recipe";
			})
			.addCase(toggleThanksgivingRecipeCompletion.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(
				toggleThanksgivingRecipeCompletion.fulfilled,
				(state, action) => {
					state.loading = false;
					const recipe = state.recipes.find(
						(recipe) => recipe.id === action.payload
					);
					if (recipe) {
						recipe.isCompleted = !recipe.isCompleted;
						recipe.completedDate = recipe.isCompleted
							? new Date().toISOString()
							: undefined;
						recipe.updatedAt = new Date().toISOString();
					}
				}
			)
			.addCase(toggleThanksgivingRecipeCompletion.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to toggle recipe completion";
			});
	},
});

export const { setSelectedRecipe, clearError } =
	thanksgivingMealPlanningSlice.actions;
export default thanksgivingMealPlanningSlice.reducer;
