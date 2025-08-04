import React from "react";

export interface GiftCardProps {
	holidayName: string;
	budget: {
		spent: number;
		total: number;
		currency?: string;
	};
	giftList: {
		totalItems: number;
		completedItems: number;
	};
	theme?: {
		primaryColor?: string;
		accentColor?: string;
		backgroundColor?: string;
	};
	className?: string;
}

export default function GiftCard({
	holidayName,
	budget,
	giftList,
	theme = {},
	className = "",
}: GiftCardProps) {
	const {
		primaryColor = "#22c55e", // Default green
		accentColor = "#eab308", // Default yellow
		backgroundColor = "white",
	} = theme;

	const remaining = budget.total - budget.spent;
	const budgetPercentage = (budget.spent / budget.total) * 100;
	const giftListPercentage =
		giftList.totalItems > 0
			? (giftList.completedItems / giftList.totalItems) * 100
			: 0;

	const getBudgetStatus = () => {
		if (budgetPercentage >= 80) return "Budget nearly exhausted";
		if (budgetPercentage >= 60) return "Moderate budget remaining";
		return "Plenty of budget left";
	};

	return (
		<div
			className={`max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden ${className}`}
			style={{
				backgroundColor,
				borderLeft: `4px solid ${primaryColor}`, // Green line on left edge
			}}
		>
			{/* Main card content */}
			<div className="p-3">
				{/* Budget Section - Updated to match Hanukkah design */}
				<div className="mb-2">
					<div className="flex justify-between items-start mb-4">
						<h3 className="font-bold text-gray-900 text-lg">
							{holidayName} Budget
						</h3>
						<div className="text-sm text-gray-600">{getBudgetStatus()}</div>
					</div>

					<div className="mb-4">
						<div className="flex justify-between items-center mb-2">
							<div className="text-sm text-gray-600">
								Spent:{" "}
								<span className="font-bold">${budget.spent.toFixed(2)}</span>
							</div>
							<div className="text-sm text-gray-600">
								Remaining:{" "}
								<span className="font-bold">${remaining.toFixed(2)}</span>
							</div>
						</div>
						<div className="flex justify-between items-center mb-2">
							<div className="text-sm text-gray-600">
								Budget: ${budget.total.toFixed(2)}
							</div>
							<div className="text-sm text-gray-600 text-right">
								{budgetPercentage.toFixed(1)}% used
							</div>
						</div>
					</div>

					{/* Progress bar */}
					<div className="w-full bg-gray-200 rounded-full h-2 mb-2">
						<div
							className="h-2 rounded-full transition-all duration-300"
							style={{
								width: `${Math.min(budgetPercentage, 100)}%`,
								backgroundColor: primaryColor,
							}}
						></div>
					</div>
				</div>
			</div>
		</div>
	);
}
