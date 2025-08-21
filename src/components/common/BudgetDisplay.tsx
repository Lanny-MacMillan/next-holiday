import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import { useHolidayBudget } from "@/hooks/useHolidayBudget";
import { useGetGiftsQuery } from "@/store/api";
import { getCardStyling } from "@/utils/cardShadows";
import { getHolidayAccentColor } from "@/utils/holidayUtils";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";
import { usePathname } from "next/navigation";

interface BudgetInfo {
	budgetLimit: number;
	totalSpent: number;
	totalPlanned: number;
	remaining: number;
	percentageUsed: number;
	colorClass: string;
	statusText: string;
	progressBarColor: string;
}

interface BudgetDisplayProps {
	holiday?: string;
	holidayColor?: string;
	holidayId?: string; // New prop for DB-backed budgets
}

export function useBudgetInfo(
	holiday?: string,
	holidayId?: string
): BudgetInfo {
	// Fallback to old logic for backward compatibility
	const { settings } = useAppSelector((state: any) => state.theme);

	// Get auth0User and holiday preferences for RTK Query
	const { user: auth0User } = useAuth0();
	const holidayPreferences = useAppSelector(
		(state: any) => state.home.data?.holidayPreferences || []
	);

	// Determine holiday ID for RTK Query
	let queryHolidayId = holidayId;
	if (!queryHolidayId && holiday) {
		const routeHolidayId = getHolidayIdFromRoute(
			`/${holiday.toLowerCase()}`,
			holidayPreferences
		);
		queryHolidayId = routeHolidayId || undefined;
	}

	// Use the new centralized budget hook if holidayId is provided
	const { budget, loading, error } = queryHolidayId 
		? useHolidayBudget({ holidayId: queryHolidayId })
		: { budget: null, loading: false, error: null };

	// Use RTK Query to fetch gifts data
	const { data: gifts = [] } = useGetGiftsQuery(
		{ holidayId: queryHolidayId || "", auth0User },
		{ skip: !queryHolidayId || !auth0User }
	);

	// Use DB-backed budget if available, otherwise fallback to localStorage
	let budgetLimit = 0;
	let totalSpent = 0;
	let totalPlanned = 0;

	// Always calculate spent amount from completed gifts, regardless of DB budget
	totalSpent = gifts.reduce((sum: number, gift: any) => {
		const price = typeof gift.price === "number" ? gift.price : 0;
		// Only count completed gifts as purchased/spent
		return gift.isCompleted ? sum + price : sum;
	}, 0);

	// Always calculate planned amount from all gifts with prices
	totalPlanned = gifts.reduce((sum: number, gift: any) => {
		const price = typeof gift.price === "number" ? gift.price : 0;
		return sum + price;
	}, 0);

	if (budget && holidayId) {
		// Use DB-backed budget data for budget limit only
		budgetLimit = budget.targetAmount || 0;
	} else {
		// Fallback to old localStorage logic
		if (holiday) {
			const holidayChoice = settings.holidayChoices?.find(
				(choice: { holiday: string; budget: number }) =>
					choice.holiday === holiday
			);
			budgetLimit = holidayChoice?.budget || 0;
		} else {
			budgetLimit = settings.giftBudgetLimit || 0;
		}

		// For Thanksgiving, use the dedicated budget slice
		if (holiday === "Thanksgiving") {
			const budgetItems = useAppSelector(
				(state: any) => state.thanksgivingBudget.budgetItems
			);
			const budgetCosts = budgetItems.reduce((sum: number, item: any) => {
				const amount = typeof item.amount === "number" ? item.amount : 0;
				return sum + amount;
			}, 0);
			totalSpent = budgetCosts; // Replace gift costs with budget costs for Thanksgiving
			totalPlanned = budgetCosts; // For Thanksgiving, planned = spent
		}
	}

	const remaining = budgetLimit - totalSpent;
	const percentageUsed = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;

	let colorClass = "";
	let statusText = "";
	let progressBarColor = "";

	if (percentageUsed <= 50) {
		colorClass =
			"text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30";
		statusText = "Plenty of budget left";
		progressBarColor = "bg-green-500";
	} else if (percentageUsed <= 75) {
		colorClass =
			"text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/30";
		statusText = "Budget getting tight";
		progressBarColor = "bg-yellow-500";
	} else if (percentageUsed <= 100) {
		colorClass = "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
		statusText = "Almost out of budget";
		progressBarColor = "bg-red-500";
	} else {
		colorClass = "text-red-800 dark:text-red-300 bg-red-200 dark:bg-red-900/50";
		statusText = "Over budget!";
		progressBarColor = "bg-red-700";
	}

	return {
		budgetLimit,
		totalSpent,
		totalPlanned,
		remaining,
		percentageUsed,
		colorClass,
		statusText,
		progressBarColor,
	};
}

export function BudgetDisplay({
	holiday,
	holidayColor,
	holidayId,
}: BudgetDisplayProps) {
	const budgetInfo = useBudgetInfo(holiday, holidayId);
	const pathname = usePathname();
	const { settings } = useAppSelector((state: any) => state.theme);
	const isGamified = settings.displayMode === "gamified";

	if (budgetInfo.budgetLimit === 0) {
		return null; // Don't show if no budget is set
	}

	const displayTitle = holiday ? `${holiday} Budget` : "Gift Budget";

	// If gamified is true, render the playful design
	if (isGamified) {
		const backgroundColor = holidayColor || getHolidayAccentColor(pathname);

		return (
			<div
				className={`relative card rounded-2xl p-3 sm:p-4 mb-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden tracking-widest text-white ${holidayColor}`}
				style={{
					...getCardStyling({
						isDarkMode: false,
						isGamified: true,
						intensity: "heavy",
					}),
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
					<div className="flex justify-between items-center mb-3">
						<h3
							className="font-semibold text-white text-sm sm:text-base"
							style={{ fontFamily: "var(--font-family-fredoka)" }}
						>
							{displayTitle}
						</h3>
						<span
							className="text-xs sm:text-sm font-medium text-white opacity-90"
							style={{ fontFamily: "var(--font-family-fredoka)" }}
						>
							{budgetInfo.statusText}
						</span>
					</div>

					<div className="flex justify-between items-center text-xs sm:text-sm mb-3">
						<div>
							<span
								className="font-medium text-white opacity-90"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								Spent:{" "}
							</span>
							<span
								className="font-bold text-white"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								${budgetInfo.totalSpent.toFixed(2)}
							</span>
						</div>
						<div>
							<span
								className="font-medium text-white opacity-90"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								Remaining:{" "}
							</span>
							<span
								className={`font-bold ${
									budgetInfo.remaining < 0 ? "text-red-200" : "text-white"
								}`}
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								${budgetInfo.remaining.toFixed(2)}
							</span>
						</div>
					</div>

					<div className="mt-3">
						<div className="flex justify-between text-xs mb-2">
							<span
								className="text-white opacity-90"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								Budget: ${budgetInfo.budgetLimit.toFixed(2)}
							</span>
							<span
								className="text-white opacity-90"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								{budgetInfo.percentageUsed.toFixed(1)}% used
							</span>
						</div>
						<div className="w-full bg-white bg-opacity-20 rounded-full h-2 sm:h-3 border border-white border-opacity-30">
							<div
								className={`h-2 sm:h-3 rounded-full transition-all ${budgetInfo.progressBarColor}`}
								style={{
									width: `${Math.min(budgetInfo.percentageUsed, 100)}%`,
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Original clean, professional design
	return (
		<div className={`card rounded-lg p-3 sm:p-4 mb-4 ${budgetInfo.colorClass}`}>
			<div className="flex justify-between items-center mb-2">
				<h3 className="font-semibold text-sm sm:text-base">{displayTitle}</h3>
				<span className="text-xs sm:text-sm font-medium">
					{budgetInfo.statusText}
				</span>
			</div>
			<div className="flex justify-between items-center text-xs sm:text-sm">
				<div>
					<span className="font-medium">Spent: </span>
					<span className="font-bold">${budgetInfo.totalSpent.toFixed(2)}</span>
				</div>
				<div>
					<span className="font-medium">Remaining: </span>
					<span
						className={`font-bold ${
							budgetInfo.remaining < 0 ? "text-red-700 dark:text-red-300" : ""
						}`}
					>
						${budgetInfo.remaining.toFixed(2)}
					</span>
				</div>
			</div>
			<div className="mt-2">
				<div className="flex justify-between text-xs mb-1">
					<span>Budget: ${budgetInfo.budgetLimit.toFixed(2)}</span>
					<span>{budgetInfo.percentageUsed.toFixed(1)}% used</span>
				</div>
				<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 border border-gray-300 dark:border-gray-600">
					<div
						className={`h-2 rounded-full transition-all ${budgetInfo.progressBarColor}`}
						style={{ width: `${Math.min(budgetInfo.percentageUsed, 100)}%` }}
					/>
				</div>
			</div>
		</div>
	);
}
