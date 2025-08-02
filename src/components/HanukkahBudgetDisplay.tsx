"use client";

import { useAppSelector } from "@/store/hooks";
import { HanukkahGift } from "@/store/slices/hanukkahGiftListSlice";

export function HanukkahBudgetDisplay() {
	const { gifts } = useAppSelector((state: any) => state.hanukkahGiftList);
	const { settings } = useAppSelector((state: any) => state.theme);

	// Calculate budget statistics
	const hanukkahChoice = settings.holidayChoices?.find(
		(choice: { holiday: string; budget: number }) =>
			choice.holiday === "Hanukkah"
	);
	const totalBudget = hanukkahChoice?.budget || 500; // Default Hanukkah budget
	const totalSpent = gifts
		.filter((gift: HanukkahGift) => gift.isCompleted)
		.reduce((sum: number, gift: HanukkahGift) => sum + gift.price, 0);
	const remainingBudget = totalBudget - totalSpent;
	const budgetPercentage = (totalSpent / totalBudget) * 100;

	// Determine budget status color
	const getBudgetStatusColor = () => {
		if (budgetPercentage >= 90) return "text-red-500";
		if (budgetPercentage >= 75) return "text-yellow-500";
		return "text-green-500";
	};

	return (
		<div className="card card-gifts rounded-lg p-4 mb-4">
			<h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
				Hanukkah Budget
			</h3>
			<div className="space-y-2">
				<div className="flex justify-between items-center">
					<span className="text-sm text-gray-600 dark:text-gray-400">
						Total Budget:
					</span>
					<span className="font-semibold text-gray-800 dark:text-white">
						${totalBudget.toFixed(2)}
					</span>
				</div>
				<div className="flex justify-between items-center">
					<span className="text-sm text-gray-600 dark:text-gray-400">
						Spent:
					</span>
					<span className="font-semibold text-gray-800 dark:text-white">
						${totalSpent.toFixed(2)}
					</span>
				</div>
				<div className="flex justify-between items-center">
					<span className="text-sm text-gray-600 dark:text-gray-400">
						Remaining:
					</span>
					<span
						className={`font-semibold ${
							remainingBudget < 0
								? "text-red-500"
								: "text-gray-800 dark:text-white"
						}`}
					>
						${remainingBudget.toFixed(2)}
					</span>
				</div>
				<div className="mt-3">
					<div className="flex justify-between items-center mb-1">
						<span className="text-xs text-gray-500 dark:text-gray-400">
							Budget Usage
						</span>
						<span className={`text-xs font-medium ${getBudgetStatusColor()}`}>
							{Math.round(budgetPercentage)}%
						</span>
					</div>
					<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
						<div
							className={`h-2 rounded-full transition-all ${
								budgetPercentage >= 90
									? "bg-red-500"
									: budgetPercentage >= 75
									? "bg-yellow-500"
									: "bg-blue-500"
							}`}
							style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
