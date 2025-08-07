import React from "react";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";

export interface GiftListCardProps {
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
	href?: string; // Add href prop for navigation
}

export function useGiftListCardData(holiday?: string) {
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
	} else if (holiday === "Easter") {
		gifts = useAppSelector((state: any) => state.easterGiftList.gifts);
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

export default function GiftListCard({
	holiday,
	holidayName,
	budget,
	giftList,
	theme = {},
	className = "",
	href,
}: GiftListCardProps) {
	const {
		primaryColor = "#22c55e", // Default green
		accentColor = "#eab308", // Default yellow
		backgroundColor = "white",
	} = theme;

	// Use holiday-specific data if holiday prop is provided, otherwise use passed props
	const holidayData = holiday ? useGiftListCardData(holiday) : null;

	const finalBudget = holidayData?.budget || budget;
	const finalGiftList = holidayData?.giftList || giftList;
	const finalBudgetStatus = holidayData?.budgetStatus;

	// Use holiday prop for display name, fallback to holidayName, then default
	const displayHolidayName = holiday || holidayName || "Holiday";

	if (!finalBudget || !finalGiftList) {
		return null; // Don't render if no data is available
	}

	// Calculate remaining and percentages based on available data
	const remaining =
		holidayData?.budget?.remaining ?? finalBudget.total - finalBudget.spent;
	const budgetPercentage =
		holidayData?.budget?.percentage ??
		(finalBudget.total > 0 ? (finalBudget.spent / finalBudget.total) * 100 : 0);
	const giftListPercentage =
		holidayData?.giftList?.percentage ??
		(finalGiftList.totalItems > 0
			? (finalGiftList.completedItems / finalGiftList.totalItems) * 100
			: 0);

	// Generate href if not provided
	const finalHref =
		href || `/${holiday?.toLowerCase()}/gift-list` || "/gift-list";

	const cardContent = (
		<div
			className={`max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden transition hover:scale-[1.02] active:scale-100 ${className}`}
			style={{
				backgroundColor,
				borderLeft: `4px solid ${primaryColor}`, // Green line on left edge
			}}
		>
			{/* Main card content */}
			<div className="p-3">
				{/* Budget Section */}
				<div className="mb-4">
					<div className="flex justify-between items-start mb-4">
						<h3 className="font-bold text-gray-900 text-lg">
							{holiday === "Thanksgiving"
								? `${displayHolidayName} Shopping Budget`
								: `${displayHolidayName} Budget`}
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

					{/* Budget Progress bar */}
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

				{/* Gift List Section */}
				<div className="mt-6">
					<div className="flex items-center justify-between mb-2">
						<h4 className="font-bold text-gray-900 text-lg">
							{holiday === "Thanksgiving" ? "Shopping List" : "Gift List"}
						</h4>
						<span
							className="text-xs font-medium px-2.5 py-0.5 rounded-full"
							style={{
								backgroundColor: `${primaryColor}20`,
								color: primaryColor,
							}}
						>
							{finalGiftList.totalItems}
						</span>
					</div>
					<p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
						{holiday === "Thanksgiving"
							? "Track your Thanksgiving shopping budget"
							: `Track your ${displayHolidayName} gift ideas`}
					</p>

					{/* Gift List Progress bar */}
					<div className="w-full bg-gray-200 rounded-full h-2 mb-2">
						<div
							className="h-2 rounded-full transition-all duration-300"
							style={{
								width: `${Math.min(giftListPercentage, 100)}%`,
								backgroundColor: primaryColor,
							}}
						></div>
					</div>

					{/* Progress text */}
					<div className="flex justify-between items-center mt-1">
						<span className="text-xs text-gray-500 dark:text-gray-500">
							{Math.round(giftListPercentage)}% complete
						</span>
						<span className="text-xs text-gray-500 dark:text-gray-500">
							{finalGiftList.completedItems}/{finalGiftList.totalItems} items
						</span>
					</div>
				</div>
			</div>
		</div>
	);

	// Wrap in Link if href is provided
	return href ? (
		<Link href={finalHref} className="block">
			{cardContent}
		</Link>
	) : (
		cardContent
	);
}
