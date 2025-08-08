import { useAppSelector } from "@/store/hooks";

interface BudgetInfo {
	budgetLimit: number;
	totalSpent: number;
	remaining: number;
	percentageUsed: number;
	colorClass: string;
	statusText: string;
	progressBarColor: string;
}

interface BudgetDisplayProps {
	holiday?: string;
}

export function useBudgetInfo(holiday?: string): BudgetInfo {
	const { settings } = useAppSelector((state: any) => state.theme);

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
	let totalSpent = gifts.reduce((sum: number, gift: any) => {
		return sum + (gift.price || 0);
	}, 0);

	// For Thanksgiving, also include shopping list costs
	if (holiday === "Thanksgiving") {
		const shoppingTasks = useAppSelector(
			(state: any) => state.thanksgivingTasks.tasks
		);
		const shoppingCosts = shoppingTasks.reduce((sum: number, task: any) => {
			if (!task.description) return sum;
			const costMatch = task.description.match(/Cost: \$(\d+\.?\d*)/);
			return sum + (costMatch ? parseFloat(costMatch[1]) : 0);
		}, 0);
		totalSpent += shoppingCosts;
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
		remaining,
		percentageUsed,
		colorClass,
		statusText,
		progressBarColor,
	};
}

export function BudgetDisplay({ holiday }: BudgetDisplayProps) {
	const budgetInfo = useBudgetInfo(holiday);

	if (budgetInfo.budgetLimit === 0) {
		return null; // Don't show if no budget is set
	}

	const displayTitle = holiday ? `${holiday} Budget` : "Gift Budget";

	return (
		<div className={`card rounded-lg p-4 mb-4 ${budgetInfo.colorClass}`}>
			<div className="flex justify-between items-center mb-2">
				<h3 className="font-semibold">{displayTitle}</h3>
				<span className="text-sm font-medium">{budgetInfo.statusText}</span>
			</div>
			<div className="flex justify-between items-center text-sm">
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
