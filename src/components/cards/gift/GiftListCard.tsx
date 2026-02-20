import React from "react";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import { useGetGiftsQuery } from "@/store/api";
import { getCardStyling } from "@/utils/cardShadows";
import { getGamifiedBackgroundColor } from "@/utils/gamifiedUtils";
import { getHolidayGiftListConfig } from "@/utils/holidayGiftListConfig";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";

export interface GiftListCardProps {
	holiday?: string;
	holidayName?: string; // For backward compatibility
	holidayId?: string; // Add holidayId prop for direct holiday ID
	budget?: {
		spent: number;
		total: number;
		currency?: string;
		planned?: number;
		remaining?: number;
		percentage?: number;
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

// Helper function to convert holiday name to route format
function getHolidayRoute(holiday: string): string {
	const holidayToRouteMap: Record<string, string> = {
		"Baby Shower": "baby-shower",
		"Mothers Day": "mothers-day",
		"Fathers Day": "fathers-day",
		"New Year": "new-year",
		"Fourth of July": "fourth-of-july",
	};

	return holidayToRouteMap[holiday] || holiday.toLowerCase();
}

export function useGiftListCardData(
	holiday?: string,
	providedHolidayId?: string
) {
	// Get holiday configuration
	const config = getHolidayGiftListConfig(holiday);

	// Determine data source based on holiday
	const isThanksgiving = holiday === "Thanksgiving";

	// Get holiday ID and auth0User for RTK Query
	const { user: auth0User } = useAuth0();
	const giftHolidayPreferences = useAppSelector(
		(state: any) => state.home.data?.holidayPreferences || []
	);

	// Use provided holidayId if available, otherwise resolve from route
	const holidayId =
		providedHolidayId ||
		(holiday
			? getHolidayIdFromRoute(
					`/${getHolidayRoute(holiday)}`,
					giftHolidayPreferences
			  )
			: null);

	// Use RTK Query to fetch gifts data
	const { data: gifts = [] } = useGetGiftsQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);

	// Map holiday name -> holidayId via home data, then pull budget entity from Redux (DB-backed)
	const budgetHolidayPreferences = useAppSelector(
		(state: any) => state.home.data?.holidayPreferences || []
	);
	const budgetEntity = useAppSelector((state: any) => {
		if (!holiday) return null;
		const pref = budgetHolidayPreferences.find(
			(p: { holiday: string; holidayId: string }) => p.holiday === holiday
		);
		if (!pref?.holidayId) return null;
		return state.budgets?.entities?.[pref.holidayId] || null;
	});

	// Get budget limit, preferring DB/Redux budgets; fallback to theme settings
	const { settings } = useAppSelector((state: any) => state.theme);
	let budgetLimit = 0;
	let overrideSpent: number | undefined = undefined;

	if (budgetEntity) {
		budgetLimit =
			typeof budgetEntity.targetAmount === "number"
				? budgetEntity.targetAmount
				: 0;
		if (typeof budgetEntity.spentAmount === "number") {
			overrideSpent = budgetEntity.spentAmount;
		}
	} else {
		if (holiday) {
			const holidayChoice = settings.holidayChoices?.find(
				(choice: { holiday: string; budget: number }) =>
					choice.holiday === holiday
			);
			budgetLimit = holidayChoice?.budget || 0;
		} else {
			budgetLimit = settings.giftBudgetLimit || 0;
		}
	}

	// Calculate totals
	let totalSpent = 0;
	let totalItems = 0;
	let completedItems = 0;
	let totalPlanned = 0;

	// Calculate totals using RTK Query data
	totalSpent = gifts.reduce((sum: number, gift: any) => {
		const price = gift.price || 0;
		// Only count completed gifts as purchased/spent
		return gift.isCompleted ? sum + price : sum;
	}, 0);

	// Calculate total planned (all gifts with prices)
	totalPlanned = gifts.reduce(
		(sum: number, gift: any) => sum + (gift.price || 0),
		0
	);
	totalItems = gifts.length;
	completedItems = gifts.filter((gift: any) => gift.isCompleted).length;

	// Always use calculated spent amount from completed gifts, not DB override
	// The DB spentAmount might be outdated or not maintained properly

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
			planned: totalPlanned,
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
	holidayId,
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

	// Get display mode from Redux settings and user preferences
	const { settings } = useAppSelector((state: any) => state.theme);
	const { preferences } = useAppSelector((state: any) => state.userPreferences);
	const isGamifiedMode =
		preferences?.displayMode === "gamified" ||
		settings.displayMode === "gamified";
	const isDarkMode = preferences?.theme === "dark" || settings.theme === "dark";

	// Use holiday-specific data if holiday prop is provided, otherwise use passed props
	// Prioritize props over hook data to avoid API calls
	// Only call the hook if we don't have the required props
	const holidayData =
		holiday && (!budget || !giftList)
			? useGiftListCardData(holiday, holidayId)
			: null;

	const finalBudget = budget || holidayData?.budget;
	const finalGiftList = giftList || holidayData?.giftList;

	// Calculate budget status if not provided by holidayData
	const finalBudgetStatus =
		holidayData?.budgetStatus ||
		(finalBudget
			? (() => {
					const budgetPercentage =
						finalBudget.total > 0
							? (finalBudget.spent / finalBudget.total) * 100
							: 0;
					if (budgetPercentage >= 80) return "Budget nearly exhausted";
					if (budgetPercentage >= 60) return "Moderate budget remaining";
					return "Plenty of budget left";
			  })()
			: "No budget set");

	// Debug: Log what data the GiftListCard is receiving
	console.log("=== GiftListCard DEBUG ===");
	console.log("holiday:", holiday);
	console.log("giftList prop:", giftList);
	console.log("holidayData:", holidayData);
	console.log("finalGiftList:", finalGiftList);
	console.log("=== END GiftListCard DEBUG ===");

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
	// Calculate percentage from props first, then fallback to holidayData
	const giftListPercentage =
		finalGiftList.totalItems > 0
			? (finalGiftList.completedItems / finalGiftList.totalItems) * 100
			: 0;

	// Debug: Log percentage calculation
	console.log("=== GIFT LIST PERCENTAGE DEBUG ===");
	console.log("finalGiftList.totalItems:", finalGiftList.totalItems);
	console.log("finalGiftList.completedItems:", finalGiftList.completedItems);
	console.log("giftListPercentage:", giftListPercentage);
	console.log("=== END PERCENTAGE DEBUG ===");
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
		gamifiedBackgroundColor ||
		getGamifiedBackgroundColor(holiday) ||
		"bg-gradient-to-br from-gray-400 to-gray-600";

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
				<div className="p-3 sm:p-4 relative z-10">
					{/* Budget Section */}
					<div className="mb-4 sm:mb-6">
						<div className="flex justify-between items-start mb-3 sm:mb-4">
							<h3 className="font-bold text-white text-base sm:text-lg">
								{holiday === "Thanksgiving"
									? `${displayHolidayName} Shopping Budget`
									: `${displayHolidayName} Budget`}
							</h3>
							<div className="text-xs sm:text-sm text-white opacity-90 text-right">
								{finalBudgetStatus}
							</div>
						</div>

						<div className="mb-3 sm:mb-4">
							<div className="flex justify-between items-center mb-2">
								<div className="text-xs sm:text-sm text-white opacity-90">
									Spent:{" "}
									<span className="font-bold">
										${finalBudget.spent.toFixed(2)}
									</span>
								</div>
								<div className="text-xs sm:text-sm text-white opacity-90">
									Remaining:{" "}
									<span className="font-bold">${remaining.toFixed(2)}</span>
								</div>
							</div>
							<div className="flex justify-between items-center mb-2">
								<div className="text-xs sm:text-sm text-white opacity-90">
									Planned: ${(finalBudget as any).planned?.toFixed(2) || "0.00"}
								</div>
								<div className="text-xs sm:text-sm text-white opacity-90">
									Budget: ${finalBudget.total.toFixed(2)}
								</div>
							</div>
							<div className="flex justify-between items-center mb-2">
								<div className="text-xs sm:text-sm text-white opacity-90">
									{budgetPercentage.toFixed(1)}% of budget used
								</div>
								<div className="text-xs sm:text-sm text-white opacity-90 text-right">
									{(finalBudget as any).planned
										? `${(
												((finalBudget as any).planned / finalBudget.total) *
												100
										  ).toFixed(1)}% planned`
										: ""}
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
					<div className="mt-4 sm:mt-6">
						<div className="flex items-center justify-between mb-2">
							<h4 className="font-bold text-white text-base sm:text-lg">
								{holiday === "Thanksgiving"
									? "Shopping List"
									: holiday === "Easter"
									? "Basket List"
									: "Gift List"}
							</h4>
							<span className="text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full bg-white bg-opacity-20 text-white">
								{finalGiftList.totalItems}
							</span>
						</div>
						<p className="text-white opacity-90 text-xs sm:text-sm mb-3">
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
			className={`max-w-4xl mx-auto card rounded-lg overflow-hidden transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${className}`}
			style={{
				borderLeftWidth: '4px',
				borderLeftStyle: 'solid',
				borderLeftColor: primaryColor,
				filter: getCardStyling({
					isDarkMode,
					isGamified: false,
					intensity: "medium",
				}).filter,
			}}
		>
			{/* Main card content */}
			<div className="p-3 sm:p-4">
				{/* Budget Section */}
				<div className="mb-4 sm:mb-6">
					<div className="flex justify-between items-start mb-3 sm:mb-4">
						<h3 className="font-bold text-gray-900 text-base sm:text-lg">
							{holiday === "Thanksgiving"
								? `${displayHolidayName} Shopping Budget`
								: `${displayHolidayName} Budget`}
						</h3>
						<div className="text-xs sm:text-sm text-gray-600 text-right">
							{finalBudgetStatus}
						</div>
					</div>

					<div className="mb-3 sm:mb-4">
						<div className="flex justify-between items-center mb-2">
							<div className="text-xs sm:text-sm text-gray-600">
								Spent:{" "}
								<span className="font-bold">
									${finalBudget.spent.toFixed(2)}
								</span>
							</div>
							<div className="text-xs sm:text-sm text-gray-600">
								Remaining:{" "}
								<span className="font-bold">${remaining.toFixed(2)}</span>
							</div>
						</div>
						<div className="flex justify-between items-center mb-2">
							<div className="text-xs sm:text-sm text-gray-600">
								Budget: ${finalBudget.total.toFixed(2)}
							</div>
							<div className="text-xs sm:text-sm text-gray-600 text-right">
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
				<div className="mt-4 sm:mt-6">
					<div className="flex items-center justify-between mb-2">
						<h4 className="font-bold text-gray-900 text-base sm:text-lg">
							{getHolidayGiftListConfig(holiday).displayText}
						</h4>
						<span
							className="text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full"
							style={{
								backgroundColor: `${primaryColor}20`,
								color: primaryColor,
							}}
						>
							{finalGiftList.totalItems}
						</span>
					</div>
					<p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-3">
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
