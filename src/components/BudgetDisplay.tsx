import { useAppSelector } from "@/store/hooks";

interface BudgetInfo {
	budgetLimit: number;
	totalSpent: number;
	remaining: number;
	percentageUsed: number;
	colorClass: string;
	statusText: string;
}

export function useBudgetInfo(): BudgetInfo {
	const { settings } = useAppSelector((state: any) => state.theme);
	const { gifts } = useAppSelector((state: any) => state.giftList);

	const budgetLimit = settings.giftBudgetLimit || 0;
	// Calculate total spent from all gifts (both completed and incomplete)
	const totalSpent = gifts.reduce((sum: number, gift: any) => {
		return sum + (gift.price || 0);
	}, 0);

	const remaining = budgetLimit - totalSpent;
	const percentageUsed = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;

	let colorClass = "";
	let statusText = "";

	if (percentageUsed <= 50) {
		colorClass =
			"text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30";
		statusText = "Plenty of budget left";
	} else if (percentageUsed <= 75) {
		colorClass =
			"text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30";
		statusText = "Budget getting tight";
	} else if (percentageUsed <= 100) {
		colorClass = "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
		statusText = "Almost out of budget";
	} else {
		colorClass = "text-red-800 dark:text-red-300 bg-red-200 dark:bg-red-900/50";
		statusText = "Over budget!";
	}

	return {
		budgetLimit,
		totalSpent,
		remaining,
		percentageUsed,
		colorClass,
		statusText,
	};
}

export function BudgetDisplay() {
	const budgetInfo = useBudgetInfo();

	if (budgetInfo.budgetLimit === 0) {
		return null; // Don't show if no budget is set
	}

	return (
		<div className={`card rounded-lg p-4 mb-4 ${budgetInfo.colorClass}`}>
			<div className="flex justify-between items-center mb-2">
				<h3 className="font-semibold">Gift Budget</h3>
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
						className={`h-2 rounded-full transition-all ${
							budgetInfo.percentageUsed <= 50
								? "bg-green-500"
								: budgetInfo.percentageUsed <= 75
								? "bg-yellow-500"
								: budgetInfo.percentageUsed <= 100
								? "bg-red-500"
								: "bg-red-700"
						}`}
						style={{ width: `${Math.min(budgetInfo.percentageUsed, 100)}%` }}
					/>
				</div>
			</div>
		</div>
	);
}
