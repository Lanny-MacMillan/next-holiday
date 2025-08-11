import React from "react";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { getCardStyling } from "@/utils/cardShadows";
import { getHolidayGiftListConfig } from "@/utils/holidayGiftListConfig";

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
	gamified?: boolean;
	gamifiedBackgroundColor?: string; // New prop for background color
}

export function useGiftListCardData(holiday?: string) {
	// Get holiday configuration
	const config = getHolidayGiftListConfig(holiday);

	// Determine data source based on holiday
	const isThanksgiving = holiday === "Thanksgiving";

	// Gifts for most holidays
	const gifts = useAppSelector(
		(state: any) => (state[config.sliceName]?.gifts as any[]) || []
	);

	// Thanksgiving budget items
	const thanksgivingBudgetItems = useAppSelector(
		(state: any) => state.thanksgivingBudget?.budgetItems || []
	);

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

	// Calculate totals
	let totalSpent = 0;
	let totalItems = 0;
	let completedItems = 0;

	if (isThanksgiving) {
		// Use dedicated Thanksgiving budget slice
		totalSpent = thanksgivingBudgetItems.reduce(
			(sum: number, item: any) =>
				sum + (typeof item.amount === "number" ? item.amount : 0),
			0
		);
		totalItems = thanksgivingBudgetItems.length;
		completedItems = 0; // No completion state for budget items
	} else {
		// Default gift-based calculation
		totalSpent = gifts.reduce(
			(sum: number, gift: any) => sum + (gift.price || 0),
			0
		);
		totalItems = gifts.length;
		completedItems = gifts.filter((gift: any) => gift.isCompleted).length;
	}

	const remaining = budgetLimit - totalSpent;
	const budgetPercentage =
		budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;
	const giftListPercentage =
		totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

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
			totalItems,
			completedItems,
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
	gamified = false,
	gamifiedBackgroundColor,
}: GiftListCardProps) {
	const {
		primaryColor = "#22c55e", // Default green
		accentColor = "#eab308", // Default yellow
		backgroundColor: themeBackgroundColor = "white",
	} = theme;

	// Get display mode from Redux settings
	const { settings } = useAppSelector((state: any) => state.theme);
	const isGamifiedMode = settings.displayMode === "gamified";
	const isDarkMode = settings.theme === "dark";

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
	console.log("holiday", holiday);

	// Generate href if not provided
	const finalHref =
		href ||
		(holiday?.toLowerCase() === "easter"
			? "/easter/basket-list"
			: `/${holiday?.toLowerCase()}/gift-list`) ||
		"/gift-list";

	// Get gamified background gradient based on holiday
	const backgroundColor =
		gamifiedBackgroundColor || "bg-gradient-to-br from-gray-400 to-gray-600";

	if (isGamifiedMode) {
		// Gamified mode design
		const cardContent = (
			<div
				className={`max-w-4xl mx-auto rounded-lg overflow-hidden transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${backgroundColor} text-white ${className}`}
				style={getCardStyling({
					isDarkMode,
					isGamified: true,
					intensity: "heavy",
				})}
			>
				{/* Background texture overlay */}
				<div className="absolute inset-0 opacity-10 pointer-events-none">
					<div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white opacity-20"></div>
					<div className="absolute top-12 right-8 w-6 h-6 rounded-full bg-white opacity-15"></div>
					<div className="absolute bottom-8 left-12 w-10 h-10 rounded-full bg-white opacity-10"></div>
					<div className="absolute bottom-4 right-4 w-4 h-4 rounded-full bg-white opacity-20"></div>
				</div>

				{/* Main card content */}
				<div className="p-3 relative z-10">
					{/* Budget Section */}
					<div className="mb-4">
						<div className="flex justify-between items-start mb-4">
							<h3 className="font-bold text-white text-lg">
								{holiday === "Thanksgiving"
									? `${displayHolidayName} Shopping Budget`
									: `${displayHolidayName} Budget`}
							</h3>
							<div className="text-sm text-white opacity-90">
								{finalBudgetStatus}
							</div>
						</div>

						<div className="mb-4">
							<div className="flex justify-between items-center mb-2">
								<div className="text-sm text-white opacity-90">
									Spent:{" "}
									<span className="font-bold">
										${finalBudget.spent.toFixed(2)}
									</span>
								</div>
								<div className="text-sm text-white opacity-90">
									Remaining:{" "}
									<span className="font-bold">${remaining.toFixed(2)}</span>
								</div>
							</div>
							<div className="flex justify-between items-center mb-2">
								<div className="text-sm text-white opacity-90">
									Budget: ${finalBudget.total.toFixed(2)}
								</div>
								<div className="text-sm text-white opacity-90 text-right">
									{budgetPercentage.toFixed(1)}% used
								</div>
							</div>
						</div>

						{/* Budget Progress bar */}
						<div className="w-full bg-white bg-opacity-20 rounded-full h-2 mb-2">
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
							<h4 className="font-bold text-white text-lg">
								{holiday === "Thanksgiving"
									? "Shopping List"
									: holiday === "Easter"
									? "Basket List"
									: "Gift List"}
							</h4>
							<span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white bg-opacity-20 text-white">
								{finalGiftList.totalItems}
							</span>
						</div>
						<p className="text-white opacity-90 text-sm mb-3">
							{holiday === "Thanksgiving"
								? "Track your Thanksgiving shopping budget"
								: holiday === "Easter"
								? "Track your Easter basket items"
								: `Track your ${displayHolidayName} gift ideas`}
						</p>

						{/* Gift List Progress bar */}
						<div className="w-full bg-white bg-opacity-20 rounded-full h-2 mb-2">
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
							<span className="text-xs text-white opacity-80">
								{Math.round(giftListPercentage)}% complete
							</span>
							<span className="text-xs text-white opacity-80">
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
	// Professional mode (existing design)
	const cardContent = (
		<div
			className={`max-w-4xl mx-auto bg-white rounded-lg overflow-hidden transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${className}`}
			style={{
				backgroundColor,
				borderLeft: `4px solid ${primaryColor}`, // Green line on left edge
				...getCardStyling({
					isDarkMode,
					isGamified: false,
					intensity: "medium",
				}),
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
							{getHolidayGiftListConfig(holiday).displayText}
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
