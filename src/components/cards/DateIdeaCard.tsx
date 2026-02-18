import { useAppSelector } from "@/store/hooks";
import { getCardStyling } from "@/utils/cardShadows";

interface Task {
	id: string;
	title: string;
	description?: string;
	priority: "low" | "medium" | "high";
	category: string;
	dueDate?: string;
	notes?: string;
	isCompleted: boolean;
}

interface DateIdeaCardProps {
	task: Task;
	onToggleCompletion: (taskId: string) => void;
	onEdit: (task: Task) => void;
	onDelete: (taskId: string) => void;
	getPriorityColor: (priority: string) => string;
	gamified?: boolean;
	holidayColor?: string;
}

// Date-themed icons for gamified mode
const DateIdeaIcon = ({
	priority,
	className = "",
}: {
	priority: string;
	className?: string;
}) => {
	const getIcon = (priority: string) => {
		if (priority === "high") return "💕";
		if (priority === "medium") return "💝";
		return "💖";
	};

	return (
		<div className={`text-xl sm:text-2xl ${className}`}>
			{getIcon(priority)}
		</div>
	);
};

export default function DateIdeaCard({
	task,
	onToggleCompletion,
	onEdit,
	onDelete,
	getPriorityColor,
	gamified,
	holidayColor,
}: DateIdeaCardProps) {
	// Get display mode from Redux settings and user preferences (fallback to prop)
	const { settings } = useAppSelector((state: any) => state.theme);
	const { preferences } = useAppSelector((state: any) => state.userPreferences);
	const isGamifiedMode =
		gamified ||
		preferences?.displayMode === "gamified" ||
		settings.displayMode === "gamified";
	const isDarkMode = preferences?.theme === "dark" || settings.theme === "dark";

	if (isGamifiedMode) {
		// Gamified mode design
		return (
			<div
				className={`relative card rounded-2xl p-3 sm:p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden tracking-widest text-white ${
					holidayColor || "bg-gradient-to-br from-pink-400 to-pink-600"
				} ${task.isCompleted ? "opacity-75" : ""}`}
				style={getCardStyling({
					isDarkMode,
					isGamified: true,
					intensity: "heavy",
				})}
			>
				{/* Background texture overlay */}
				<div className="absolute inset-0 opacity-10 pointer-events-none">
					<div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-white opacity-20 pointer-events-none"></div>
					<div className="absolute top-8 right-6 w-4 h-4 rounded-full bg-white opacity-15 pointer-events-none"></div>
					<div className="absolute bottom-6 left-8 w-5 h-5 rounded-full bg-white opacity-10 pointer-events-none"></div>
					<div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-white opacity-20 pointer-events-none"></div>
				</div>

				<div className="relative z-10">
					<div>
						<div className="flex items-start justify-between mb-2">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1">
									<h3
										className={`font-bold text-white text-sm sm:text-base ${
											task.isCompleted ? "line-through" : ""
										}`}
										style={{ fontFamily: "var(--font-family-fredoka)" }}
									>
										{task.title}
									</h3>
									<span
										className={`text-xs px-2 py-1 rounded-full ${
											task.priority === "high"
												? "bg-red-500 text-white"
												: task.priority === "medium"
												? "bg-yellow-500 text-white"
												: "bg-green-500 text-white"
										}`}
										style={{ fontFamily: "var(--font-family-fredoka)" }}
									>
										{task.priority}
									</span>
									{task.isCompleted && (
										<span
											className="bg-white bg-opacity-20 text-white text-xs px-2 py-1 rounded-full"
											style={{ fontFamily: "var(--font-family-fredoka)" }}
										>
											Completed
										</span>
									)}
								</div>
								{task.description && (
									<p
										className="text-white opacity-90 text-xs sm:text-sm mb-2"
										style={{ fontFamily: "var(--font-family-fredoka)" }}
									>
										{task.description}
									</p>
								)}
								<div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
									{task.dueDate && (
										<div>
											<span
												className="text-white opacity-80"
												style={{ fontFamily: "var(--font-family-fredoka)" }}
											>
												Due:
											</span>
											<span
												className="ml-1 font-medium text-white"
												style={{ fontFamily: "var(--font-family-fredoka)" }}
											>
												{task.dueDate?.split('T')[0] ? new Date(task.dueDate.split('T')[0] + 'T12:00:00').toLocaleDateString() : 'No date set'}
											</span>
										</div>
									)}
									<div>
										<span
											className="text-white opacity-80"
											style={{ fontFamily: "var(--font-family-fredoka)" }}
										>
											Category:
										</span>
										<span
											className="ml-1 font-medium text-white"
											style={{ fontFamily: "var(--font-family-fredoka)" }}
										>
											{task.category}
										</span>
									</div>
								</div>
								{task.notes && (
									<div className="mt-2 p-2 bg-white bg-opacity-30 rounded">
										<p
											className="text-xs sm:text-sm text-black opacity-90"
											style={{ fontFamily: "var(--font-family-fredoka)" }}
										>
											<strong>Notes:</strong> {task.notes}
										</p>
									</div>
								)}
							</div>
							<div className="flex flex-col gap-2 ml-4">
								<button
									onClick={() => onToggleCompletion(task.id)}
									className={`px-2 py-1 sm:px-3 sm:py-1 rounded text-xs sm:text-sm font-medium transition-colors border  border-opacity-30 ${
										task.isCompleted
											? "border border-green-500 text-green-500 hover:bg-green-300"
											: "border border-green-500 text-green-500 hover:bg-green-200"
									}`}
									style={{ fontFamily: "var(--font-family-fredoka)" }}
								>
									{task.isCompleted ? "Completed" : "Mark Complete"}
								</button>
								<button
									onClick={() => onEdit(task)}
									className="px-2 py-1 sm:px-3 sm:py-1 text-white border border-yellow-300 hover:bg-yellow-300 hover:text-white rounded text-xs sm:text-sm font-medium transition-colors"
									style={{ fontFamily: "var(--font-family-fredoka)" }}
								>
									Edit
								</button>
								<button
									onClick={() => onDelete(task.id)}
									className="px-2 py-1 sm:px-3 sm:py-1 bg-red-700 hover:bg-red-800 text-white rounded text-xs sm:text-sm font-medium transition-colors border border-red-600"
									style={{ fontFamily: "var(--font-family-fredoka)" }}
								>
									Delete
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Professional mode (existing design)
	return (
		<div
			className={`card card-valentines rounded-2xl p-3 sm:p-4 transition-all ${
				task.isCompleted ? "opacity-75" : ""
			}`}
		>
			<div>
				<div className="flex items-start justify-between mb-2">
					<div className="flex-1">
						<div className="flex items-center gap-2 mb-1">
							<h3
								className={`font-bold text-gray-800 dark:text-white text-sm sm:text-base ${
									task.isCompleted ? "line-through" : ""
								}`}
							>
								{task.title}
							</h3>
							<span
								className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(
									task.priority
								)}`}
							>
								{task.priority}
							</span>
							{task.isCompleted && (
								<span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-2 py-1 rounded-full">
									Completed
								</span>
							)}
						</div>
						{task.description && (
							<p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-2">
								{task.description}
							</p>
						)}
						<div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
							{task.dueDate && (
								<div>
									<span className="text-gray-500 dark:text-gray-500">Due:</span>
									<span className="ml-1 font-medium text-gray-800 dark:text-white">
										{task.dueDate?.split('T')[0] ? new Date(task.dueDate.split('T')[0] + 'T12:00:00').toLocaleDateString() : 'No date set'}
									</span>
								</div>
							)}
							<div>
								<span className="text-gray-500 dark:text-gray-500">
									Category:
								</span>
								<span className="ml-1 font-medium text-gray-800 dark:text-white">
									{task.category}
								</span>
							</div>
						</div>
						{task.notes && (
							<div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
								<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
									<strong>Notes:</strong> {task.notes}
								</p>
							</div>
						)}
					</div>
					<div className="flex flex-col gap-2 ml-4">
						<button
							onClick={() => onToggleCompletion(task.id)}
							className={`px-2 py-1 sm:px-3 sm:py-1 rounded text-xs sm:text-sm font-medium transition-colors ${
								task.isCompleted
									? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
									: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300"
							}`}
						>
							{task.isCompleted ? "Completed" : "Mark Complete"}
						</button>
						<button
							onClick={() => onEdit(task)}
							className="px-2 py-1 sm:px-3 sm:py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs sm:text-sm font-medium transition-colors"
						>
							Edit
						</button>
						<button
							onClick={() => onDelete(task.id)}
							className="px-2 py-1 sm:px-3 sm:py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded text-xs sm:text-sm font-medium transition-colors"
						>
							Delete
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
