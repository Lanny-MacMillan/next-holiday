import React from "react";
import { useAppSelector } from "@/store/hooks";

export interface GiftCardProps {
	holiday?: string;
	holidayName?: string; // For backward compatibility
	budget?: {
		spent: number;
		total: number;
		currency?: string;
	};
	giftList?: {
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

export function useGiftCardData(holiday?: string) {
	// Determine which gift list to use based on holiday
	let gifts: any[] = [];
	if (holiday === "Hanukkah") {
		gifts = useAppSelector((state: any) => state.hanukkahGiftList.gifts);
	} else if (holiday === "Valentine's Day") {
		gifts = useAppSelector((state: any) => state.valentinesGiftList.gifts);
	} else if (holiday === "Halloween") {
		gifts = useAppSelector((state: any) => state.halloweenGiftList.gifts);
	} else if (holiday === "Thanksgiving") {
		gifts = useAppSelector((state: any) => state.thanksgivingGiftList.gifts);
	} else {
		gifts = useAppSelector((state: any) => state.giftList.gifts);
	}

	// Get budget limit based on holiday
	const { settings } = useAppSelector((state: any) => state.theme);
	let budgetLimit = 0;
	if (holiday) {
		const holidayChoice = settings.holidayChoices?.find(
			(choice: { holiday: string; budget: number }) =>
				choice.holiday === holiday
		);
		budgetLimit = holidayChoice?.budget || 0;
	} else {
		budgetLimit = settings.giftBudgetLimit || 0;
	}

	// Calculate total spent from all gifts (both completed and incomplete)
	const totalSpent = gifts.reduce((sum: number, gift: any) => {
		return sum + (gift.price || 0);
	}, 0);

	const remaining = budgetLimit - totalSpent;
	const budgetPercentage =
		budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;
	const giftListPercentage =
		gifts.length > 0
			? (gifts.filter((gift: any) => gift.isCompleted).length / gifts.length) *
			  100
			: 0;

	const getBudgetStatus = () => {
		if (budgetPercentage >= 80) return "Budget nearly exhausted";
		if (budgetPercentage >= 60) return "Moderate budget remaining";
		return "Plenty of budget left";
	};

	return {
		budget: {
			spent: totalSpent,
			total: budgetLimit,
			remaining,
			percentage: budgetPercentage,
		},
		giftList: {
			totalItems: gifts.length,
			completedItems: gifts.filter((gift: any) => gift.isCompleted).length,
			percentage: giftListPercentage,
		},
		budgetStatus: getBudgetStatus(),
	};
}

export default function GiftCard({
	holiday,
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

	// Use holiday-specific data if holiday prop is provided, otherwise use passed props
	const holidayData = holiday ? useGiftCardData(holiday) : null;

	const finalBudget = holidayData?.budget || budget;
	const finalGiftList = holidayData?.giftList || giftList;
	const finalBudgetStatus = holidayData?.budgetStatus;

	// Use holiday prop for display name, fallback to holidayName, then default
	const displayHolidayName = holiday || holidayName || "Holiday";

	if (!finalBudget || !finalGiftList) {
		return null; // Don't render if no data is available
	}

	const remaining = finalBudget.remaining;
	const budgetPercentage = finalBudget.percentage;
	const giftListPercentage = finalGiftList.percentage;

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
							{displayHolidayName} Budget
						</h3>
						<div className="text-sm text-gray-600">{finalBudgetStatus}</div>
					</div>

					<div className="mb-4">
						<div className="flex justify-between items-center mb-2">
							<div className="text-sm text-gray-600">
								Spent:{" "}
								<span className="font-bold">
									${finalBudget.spent.toFixed(2)}
								</span>
							</div>
							<div className="text-sm text-gray-600">
								Remaining:{" "}
								<span className="font-bold">${remaining.toFixed(2)}</span>
							</div>
						</div>
						<div className="flex justify-between items-center mb-2">
							<div className="text-sm text-gray-600">
								Budget: ${finalBudget.total.toFixed(2)}
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

				{/* Gift List Progress Section */}
				<div className="mt-4">
					{/* <div className="flex justify-between items-center mb-2">
						<h4 className="font-semibold text-gray-900 text-sm">
							Gift Progress
						</h4>
						<div className="text-sm text-gray-600">
							{finalGiftList.completedItems}/{finalGiftList.totalItems}{" "}
							completed
						</div>
					</div> */}

					{/* Gift List Progress bar */}
					<div className="w-full bg-gray-200 rounded-full h-2 mb-2">
						<div
							className="h-2 rounded-full transition-all duration-300"
							style={{
								width: `${Math.min(giftListPercentage, 100)}%`,
								backgroundColor: accentColor,
							}}
						></div>
					</div>
					{/* <div className="text-xs text-gray-600 text-center">
						{Math.round(giftListPercentage)}% complete
					</div> */}
				</div>
			</div>
		</div>
	);
}
