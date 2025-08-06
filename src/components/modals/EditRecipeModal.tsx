import React, { useState, useEffect } from "react";
import { Recipe } from "@/components/cards/recipe/RecipeCard";

export interface EditRecipeModalProps {
	isOpen: boolean;
	recipe: Recipe | null;
	onClose: () => void;
	onSave: (recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">) => void;
	loading?: boolean;
}

export default function EditRecipeModal({
	isOpen,
	recipe,
	onClose,
	onSave,
	loading = false,
}: EditRecipeModalProps) {
	const [formValues, setFormValues] = useState<Record<string, any>>({});

	useEffect(() => {
		if (isOpen && recipe) {
			setFormValues({
				title: recipe.title || "",
				description: recipe.description || "",
				cookTime: recipe.cookTime || "",
				prepTime: recipe.prepTime || "",
				servings: recipe.servings?.toString() || "",
				difficulty: recipe.difficulty || "medium",
				category: recipe.category || "Main Dish",
			});
		}
	}, [isOpen, recipe]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (recipe) {
			const updatedRecipe: Omit<Recipe, "id" | "createdAt" | "updatedAt"> = {
				title: formValues.title,
				description: formValues.description || undefined,
				cookTime: formValues.cookTime || undefined,
				prepTime: formValues.prepTime || undefined,
				servings: formValues.servings
					? parseInt(formValues.servings)
					: undefined,
				difficulty:
					(formValues.difficulty as "easy" | "medium" | "hard") || "medium",
				category: formValues.category || "Main Dish",
				isCompleted: recipe.isCompleted,
			};
			onSave(updatedRecipe);
		}
	};

	const handleInputChange = (fieldId: string, value: any) => {
		setFormValues((prev) => ({
			...prev,
			[fieldId]: value,
		}));
	};

	if (!isOpen || !recipe) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="card rounded-lg p-6 max-w-md mx-4 w-full">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
						Edit Recipe
					</h3>
					<button
						onClick={onClose}
						className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
					>
						×
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Recipe Name*
						</label>
						<input
							type="text"
							value={formValues.title || ""}
							onChange={(e) => handleInputChange("title", e.target.value)}
							className="w-full border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
							placeholder="Recipe Name"
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Description
						</label>
						<textarea
							value={formValues.description || ""}
							onChange={(e) => handleInputChange("description", e.target.value)}
							className="w-full border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
							placeholder="Description"
							rows={3}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Category
							</label>
							<select
								value={formValues.category || "Main Dish"}
								onChange={(e) => handleInputChange("category", e.target.value)}
								className="w-full border rounded px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
							>
								<option value="Main Dish">Main Dish</option>
								<option value="Side Dish">Side Dish</option>
								<option value="Appetizer">Appetizer</option>
								<option value="Dessert">Dessert</option>
								<option value="Condiment">Condiment</option>
								<option value="Beverage">Beverage</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Difficulty
							</label>
							<select
								value={formValues.difficulty || "medium"}
								onChange={(e) =>
									handleInputChange("difficulty", e.target.value)
								}
								className="w-full border rounded px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
							>
								<option value="easy">Easy</option>
								<option value="medium">Medium</option>
								<option value="hard">Hard</option>
							</select>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Prep Time
							</label>
							<input
								type="text"
								value={formValues.prepTime || ""}
								onChange={(e) => handleInputChange("prepTime", e.target.value)}
								className="w-full border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
								placeholder="e.g., 30 minutes"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Cook Time
							</label>
							<input
								type="text"
								value={formValues.cookTime || ""}
								onChange={(e) => handleInputChange("cookTime", e.target.value)}
								className="w-full border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
								placeholder="e.g., 2 hours"
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Servings
						</label>
						<input
							type="number"
							value={formValues.servings || ""}
							onChange={(e) => handleInputChange("servings", e.target.value)}
							className="w-full border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
							placeholder="Number of servings"
							min="1"
						/>
					</div>

					<div className="flex gap-3 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="flex-1 text-white px-4 py-2 rounded hover:opacity-90 transition-colors"
							style={{ backgroundColor: "#d97706" }}
							disabled={loading}
						>
							{loading ? "Saving..." : "Save Changes"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
