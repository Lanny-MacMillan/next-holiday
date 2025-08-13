import React from "react";
import { useAppSelector } from "@/store/hooks";
import { getCardStyling } from "@/utils/cardShadows";

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

export interface MealPlanningSummaryCardProps {
	recipes: Recipe[];
	title?: string;
	accentColor?: string;
	className?: string;
	gamified?: boolean;
	holidayColor?: string;
}

export default function MealPlanningSummaryCard({
	recipes,
	title = "Meal Planning Progress",
	accentColor = "amber-600",
	className = "",
	gamified = false,
	holidayColor,
}: MealPlanningSummaryCardProps) {
	// Get display mode from Redux settings (fallback to prop)
	const { settings } = useAppSelector((state: any) => state.theme);
	const isGamifiedMode = gamified || settings.displayMode === "gamified";
	const isDarkMode = settings.theme === "dark";

	const totalRecipes = recipes.length;
	const completedRecipesCount = recipes.filter(
		(recipe: Recipe) => recipe.isCompleted
	).length;

	const completionRate =
		totalRecipes > 0
			? Math.round((completedRecipesCount / totalRecipes) * 100)
			: 0;

	// If gamified is true, render the playful design
	if (isGamifiedMode) {
		const backgroundColor =
			holidayColor ||
			`bg-gradient-to-br from-${accentColor.replace(
				"-600",
				"-400"
			)} to-${accentColor}`;

		return (
			<div
				className={`relative card rounded-2xl p-3 sm:p-4 mb-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden tracking-widest text-white ${backgroundColor} ${className}`}
				style={{
					...getCardStyling({
						isDarkMode,
						isGamified: true,
						intensity: "heavy",
					}),
					border: holidayColor ? `4px solid ${holidayColor}` : undefined,
				}}
			>
				{/* Background texture overlay */}
				<div className="absolute inset-0 opacity-10 pointer-events-none">
					<div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-white opacity-20 pointer-events-none"></div>
					<div className="absolute top-8 right-6 w-4 h-4 rounded-full bg-white opacity-15 pointer-events-none"></div>
					<div className="absolute bottom-6 left-8 w-5 h-5 rounded-full bg-white opacity-10 pointer-events-none"></div>
					<div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-white opacity-20 pointer-events-none"></div>
				</div>

				<div className="relative z-10">
					<h2
						className="text-lg sm:text-xl font-bold mb-4 text-white text-center"
						style={{ fontFamily: "var(--font-family-fredoka)" }}
					>
						{title}
					</h2>
					<div className="grid grid-cols-2 gap-4 mb-4">
						<div className="text-center">
							<div
								className="text-xl sm:text-2xl font-bold text-white"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								{totalRecipes}
							</div>
							<div
								className="text-xs sm:text-sm text-white opacity-90"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								Total Recipes
							</div>
						</div>
						<div className="text-center">
							<div
								className="text-xl sm:text-2xl font-bold text-green-200"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								{completedRecipesCount}
							</div>
							<div
								className="text-xs sm:text-sm text-white opacity-90"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								Completed
							</div>
						</div>
					</div>
					<div className="text-center">
						<div
							className="text-xl sm:text-2xl font-bold text-white"
							style={{ fontFamily: "var(--font-family-fredoka)" }}
						>
							{completionRate}%
						</div>
						<div
							className="text-xs sm:text-sm text-white opacity-90"
							style={{ fontFamily: "var(--font-family-fredoka)" }}
						>
							Completion Rate
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Original clean, professional design
	return (
		<div className={`bg-white rounded-lg shadow-lg p-4 sm:p-6 ${className}`}>
			<h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 text-center">
				{title}
			</h2>
			<div className="grid grid-cols-2 gap-4 mb-4">
				<div className="text-center">
					<div className={`text-xl sm:text-2xl font-bold text-${accentColor}`}>
						{totalRecipes}
					</div>
					<div className="text-xs sm:text-sm text-gray-600">Total Recipes</div>
				</div>
				<div className="text-center">
					<div className="text-xl sm:text-2xl font-bold text-green-600">
						{completedRecipesCount}
					</div>
					<div className="text-xs sm:text-sm text-gray-600">Completed</div>
				</div>
			</div>
			<div className="text-center">
				<div className={`text-xl sm:text-2xl font-bold text-${accentColor}`}>
					{completionRate}%
				</div>
				<div className="text-xs sm:text-sm text-gray-600">Completion Rate</div>
			</div>
		</div>
	);
}
