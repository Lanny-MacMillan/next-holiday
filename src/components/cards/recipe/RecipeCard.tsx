import React from "react";

export interface Recipe {
	id: string;
	title: string;
	description?: string;
	ingredients?: string[];
	instructions?: string[];
	cookTime?: string;
	prepTime?: string;
	servings?: number;
	difficulty?: "easy" | "medium" | "hard";
	category?: string;
	isCompleted: boolean;
	completedDate?: string;
	createdAt: string;
	updatedAt: string;
}

export interface RecipeCardProps {
	recipe: Recipe;
	isCompleted?: boolean;
	onToggle: (recipeId: string) => void;
	onEdit: (recipe: Recipe) => void;
	onDelete: (recipeId: string) => void;
	loading?: boolean;
	theme?: {
		accentColor?: string;
		hoverColor?: string;
	};
	borderColor?: string;
}

export default function RecipeCard({
	recipe,
	isCompleted = false,
	onToggle,
	onEdit,
	onDelete,
	loading = false,
	theme = {},
	borderColor,
}: RecipeCardProps) {
	const accentColor = theme.accentColor;
	const hoverColor =
		theme.hoverColor || "hover:bg-orange-50 dark:hover:bg-orange-900/20";

	const baseClasses = `flex items-center px-4 py-3 cursor-pointer ${hoverColor}`;
	const completedClasses = isCompleted ? "opacity-60" : "";

	// Apply border color if provided
	const borderStyle = borderColor
		? { borderLeft: `4px solid ${borderColor}` }
		: {};

	return (
		<li
			key={recipe.id}
			className={`relative ${baseClasses} ${completedClasses}`}
			style={borderStyle}
			onClick={() => onToggle(recipe.id)}
		>
			<input
				type="checkbox"
				checked={recipe.isCompleted}
				readOnly
				className="mr-3"
				style={{ accentColor }}
			/>
			<div className="flex-1">
				<div
					className={`${
						isCompleted
							? "line-through text-gray-400 dark:text-gray-500"
							: "text-gray-900 dark:text-white"
					}`}
				>
					{recipe.title}
				</div>
				{recipe.description && (
					<div
						className={`text-sm ${
							isCompleted
								? "text-gray-400 dark:text-gray-500 line-through"
								: "text-gray-600 dark:text-gray-300"
						}`}
					>
						{recipe.description}
					</div>
				)}
				<div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
					{recipe.cookTime && <span>⏱️ {recipe.cookTime}</span>}
					{recipe.prepTime && <span>🕒 {recipe.prepTime}</span>}
					{recipe.servings && <span>👥 {recipe.servings} servings</span>}
					{recipe.difficulty && (
						<span>
							{recipe.difficulty === "easy" && "🟢 Easy"}
							{recipe.difficulty === "medium" && "🟡 Medium"}
							{recipe.difficulty === "hard" && "🔴 Hard"}
						</span>
					)}
				</div>
				{recipe.category && (
					<div
						className={`text-xs mt-1 ${
							isCompleted
								? "text-gray-400 dark:text-gray-500 line-through"
								: "text-gray-500 dark:text-gray-400"
						}`}
					>
						Category: {recipe.category}
					</div>
				)}
				{recipe.completedDate && isCompleted && (
					<div className="text-xs text-green-600 dark:text-green-400 mt-1">
						Completed: {new Date(recipe.completedDate).toLocaleDateString()}
					</div>
				)}
			</div>
			<div className="flex items-center justify-center">
				<button
					onClick={(e) => {
						e.stopPropagation();
						onEdit(recipe);
					}}
					className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
					disabled={loading}
				>
					Edit
				</button>
			</div>
			<button
				onClick={(e) => {
					e.stopPropagation();
					onDelete(recipe.id);
				}}
				className="absolute top-2 right-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-lg font-bold"
				disabled={loading}
				title="Delete recipe"
			>
				×
			</button>
		</li>
	);
}
