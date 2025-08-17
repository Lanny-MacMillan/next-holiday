"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchThanksgivingRecipes,
	addThanksgivingRecipe,
	updateThanksgivingRecipe,
	deleteThanksgivingRecipe,
	toggleThanksgivingRecipeCompletion,
} from "@/store/slices/thanksgiving/thanksgivingMealPlanningSlice";

import SortModal from "@/components/modals/SortModal";
import {
	RecipeCard,
	MealPlanningSummaryCard,
	Recipe,
} from "@/components/cards/recipe";
import EditRecipeModal from "@/components/modals/EditRecipeModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";

type SortOption =
	| "difficulty"
	| "cookTime"
	| "prepTime"
	| "servings"
	| "category"
	| "none";

export default function ThanksgivingMealPlanningPage() {
	const dispatch = useAppDispatch();
	const { recipes, loading, error, initialized } = useAppSelector(
		(state: any) => state.thanksgivingMealPlanning
	);
	const { settings } = useAppSelector((state: any) => state.theme);

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		recipeId: string | null;
	}>({
		show: false,
		recipeId: null,
	});

	useEffect(() => {
		// Fetch recipes when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchThanksgivingRecipes());
		}
	}, [dispatch, initialized]);

	function handleAddRecipe(formValues: Record<string, any>) {
		console.log("Form values received:", formValues);

		if (!formValues.title?.trim()) {
			console.log("No title provided");
			return;
		}

		const newRecipe: Omit<Recipe, "id" | "createdAt" | "updatedAt"> = {
			title: formValues.title,
			description: formValues.description || undefined,
			cookTime: formValues.cookTime || undefined,
			prepTime: formValues.prepTime || undefined,
			servings: formValues.servings ? parseInt(formValues.servings) : undefined,
			difficulty:
				(formValues.difficulty as "easy" | "medium" | "hard") || "medium",
			category: formValues.category || "Main Dish",
			isCompleted: false,
		};

		console.log("Dispatching new recipe:", newRecipe);
		dispatch(addThanksgivingRecipe(newRecipe));
		setShowForm(false);
	}

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
	}

	function handleToggleRecipe(recipeId: string) {
		dispatch(toggleThanksgivingRecipeCompletion(recipeId));
	}

	function handleDeleteRecipe(recipeId: string) {
		setDeleteConfirm({ show: true, recipeId });
	}

	function handleEditRecipe(recipe: Recipe) {
		setEditingRecipe(recipe);
	}

	function handleSaveEdit(
		updatedRecipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">
	) {
		if (editingRecipe) {
			dispatch(
				updateThanksgivingRecipe({ ...editingRecipe, ...updatedRecipe })
			);
			setEditingRecipe(null);
		}
	}

	function handleCloseEdit() {
		setEditingRecipe(null);
	}

	function confirmDelete() {
		if (deleteConfirm.recipeId) {
			dispatch(deleteThanksgivingRecipe(deleteConfirm.recipeId));
			setDeleteConfirm({ show: false, recipeId: null });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, recipeId: null });
	}

	function sortRecipes(recipesToSort: Recipe[]): Recipe[] {
		switch (sortBy) {
			case "difficulty":
				const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
				return [...recipesToSort].sort(
					(a, b) =>
						difficultyOrder[a.difficulty || "medium"] -
						difficultyOrder[b.difficulty || "medium"]
				);
			case "cookTime":
				return [...recipesToSort].sort((a, b) => {
					if (!a.cookTime && !b.cookTime) return 0;
					if (!a.cookTime) return 1;
					if (!b.cookTime) return -1;
					// Extract numeric values from time strings
					const getTimeValue = (timeStr: string) => {
						const match = timeStr.match(/(\d+)/);
						return match ? parseInt(match[1]) : 0;
					};
					return getTimeValue(a.cookTime) - getTimeValue(b.cookTime);
				});
			case "prepTime":
				return [...recipesToSort].sort((a, b) => {
					if (!a.prepTime && !b.prepTime) return 0;
					if (!a.prepTime) return 1;
					if (!b.prepTime) return -1;
					const getTimeValue = (timeStr: string) => {
						const match = timeStr.match(/(\d+)/);
						return match ? parseInt(match[1]) : 0;
					};
					return getTimeValue(a.prepTime) - getTimeValue(b.prepTime);
				});
			case "servings":
				return [...recipesToSort].sort((a, b) => {
					if (!a.servings && !b.servings) return 0;
					if (!a.servings) return 1;
					if (!b.servings) return -1;
					return (a.servings || 0) - (b.servings || 0);
				});
			case "category":
				return [...recipesToSort].sort((a, b) =>
					(a.category || "").localeCompare(b.category || "")
				);
			default:
				return recipesToSort;
		}
	}

	if (loading && !initialized) {
		return (
			<div className="min-h-screen thanksgiving-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading meal planning...
					</p>
				</div>
			</div>
		);
	}

	const sortedRecipes = sortRecipes(recipes);
	const incompleteRecipes = sortedRecipes.filter(
		(recipe: Recipe) => !recipe.isCompleted
	);
	const completedRecipesList = sortedRecipes.filter(
		(recipe: Recipe) => recipe.isCompleted
	);

	return (
		<div className="min-h-screen thanksgiving-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="🍽️ Meal Planning"
				backHref="/thanksgiving"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort recipes"
				description="Keep track of your Thanksgiving meal planning!"
				holidayColor="amber-600"
				error={error}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Meal Planning Summary */}
				<MealPlanningSummaryCard
					recipes={recipes}
					title="Meal Planning Progress"
					accentColor="amber-600"
					holidayColor="bg-gradient-to-br from-amber-400 to-amber-600"
				/>

				<AddButton title="Recipe" onClick={openForm} color="amber" />
				<div className="flex items-center justify-center">
					{sortBy !== "none" && (
						<div className="text-center text-sm text-gray-600 dark:text-gray-400">
							{sortBy === "difficulty" && "Sorted by Difficulty"}
							{sortBy === "cookTime" && "Sorted by Cook Time"}
							{sortBy === "prepTime" && "Sorted by Prep Time"}
							{sortBy === "servings" && "Sorted by Servings"}
							{sortBy === "category" && "Sorted by Category"}
						</div>
					)}
				</div>

				<TaskSection
					title="To Prepare"
					items={incompleteRecipes}
					isCompleted={false}
					emptyMessage="All recipes completed! 🎉"
					completedMessage="All recipes completed! 🎉"
					renderItem={(recipe: Recipe) => (
						<RecipeCard
							key={recipe.id}
							recipe={recipe}
							onToggle={handleToggleRecipe}
							onDelete={handleDeleteRecipe}
							onEdit={handleEditRecipe}
							theme={{
								accentColor: "#d97706", // Amber for Thanksgiving
							}}
							borderColor="rgb(var(--color-amber-500))" // Amber border for Thanksgiving
							gamified={settings.displayMode === "gamified"}
							holidayColor="bg-gradient-to-br from-amber-400 to-amber-600"
						/>
					)}
				/>

				<TaskSection
					title="Completed"
					items={completedRecipesList}
					isCompleted={true}
					emptyMessage="No completed recipes yet."
					completedMessage="No completed recipes yet."
					renderItem={(recipe: Recipe) => (
						<RecipeCard
							key={recipe.id}
							recipe={recipe}
							onToggle={handleToggleRecipe}
							onDelete={handleDeleteRecipe}
							onEdit={handleEditRecipe}
							theme={{
								accentColor: "#d97706", // Amber for Thanksgiving
							}}
							borderColor="rgb(var(--color-amber-500))" // Amber border for Thanksgiving
							gamified={settings.displayMode === "gamified"}
							holidayColor="bg-gradient-to-br from-amber-400 to-amber-600"
						/>
					)}
				/>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showForm}
				title="Add New Recipe"
				fields={[
					{
						id: "title",
						type: "text",
						placeholder: "Recipe Name*",
						required: true,
					},
					{
						id: "description",
						type: "textarea",
						placeholder: "Description",
						rows: 2,
					},
					{
						id: "category",
						type: "select",
						placeholder: "Category",
						options: [
							{ value: "Main Dish", label: "Main Dish" },
							{ value: "Side Dish", label: "Side Dish" },
							{ value: "Appetizer", label: "Appetizer" },
							{ value: "Dessert", label: "Dessert" },
							{ value: "Condiment", label: "Condiment" },
							{ value: "Beverage", label: "Beverage" },
						],
					},
					{
						id: "difficulty",
						type: "select",
						placeholder: "Difficulty",
						options: [
							{ value: "easy", label: "Easy" },
							{ value: "medium", label: "Medium" },
							{ value: "hard", label: "Hard" },
						],
					},
					{
						id: "prepTime",
						type: "text",
						placeholder: "Prep Time (e.g., 30 minutes)",
					},
					{
						id: "cookTime",
						type: "text",
						placeholder: "Cook Time (e.g., 2 hours)",
					},
					{
						id: "servings",
						type: "number",
						placeholder: "Number of Servings",
						min: "1",
					},
				]}
				initialValues={{
					difficulty: "medium",
					category: "Main Dish",
				}}
				onSubmit={handleAddRecipe}
				onClose={closeForm}
				loading={loading}
				submitText={loading ? "Adding..." : "Add Recipe"}
				cancelText="Cancel"
				submitButtonColor="#d97706"
			/>

			{/* Edit Recipe Modal */}
			<EditRecipeModal
				isOpen={editingRecipe !== null}
				recipe={editingRecipe}
				onClose={handleCloseEdit}
				onSave={handleSaveEdit}
				loading={loading}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={deleteConfirm.show}
				{...getDeleteConfig("recipes")}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={loading}
			/>

			{/* Sort Modal */}
			<SortModal
				isOpen={showSortModal}
				onClose={() => setShowSortModal(false)}
				sortBy={sortBy}
				onSortChange={(sortOption: string) =>
					setSortBy(sortOption as SortOption)
				}
				sortOptions={[
					{ value: "none", label: "None" },
					{ value: "difficulty", label: "Difficulty" },
					{ value: "cookTime", label: "Cook Time" },
					{ value: "prepTime", label: "Prep Time" },
					{ value: "servings", label: "Servings" },
					{ value: "category", label: "Category" },
				]}
				title="Sort Recipes"
			/>
		</div>
	);
}
