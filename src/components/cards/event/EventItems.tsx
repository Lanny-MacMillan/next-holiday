import React from "react";
import { useAppSelector } from "@/store/hooks";
import { getCardStyling } from "@/utils/cardShadows";

// Generic task interface that can be extended by specific holiday task types
export interface BaseEventTask {
	id: string;
	title: string;
	description?: string;
	priority: "high" | "medium" | "low";
	assignedTo?: string;
	category?: string;
	dueDate?: string;
	isCompleted: boolean;
	completedDate?: string;
}

export interface EventItemsProps<T extends BaseEventTask> {
	task: T;
	onToggleTask: (taskId: string) => void;
	onDeleteTask: (taskId: string, taskTitle: string) => void;
	loading?: boolean;
	themeColor?: string; // For hover effects and accents (e.g., "blue", "red", "green")
	gamified?: boolean; // Optional override for gamified mode
	holidayColor?: string; // Background color for gamified mode
}

const EventItems = <T extends BaseEventTask>({
	task,
	onToggleTask,
	onDeleteTask,
	loading = false,
	themeColor = "blue",
	gamified = false,
	holidayColor = "bg-gradient-to-br from-blue-400 to-blue-600",
}: EventItemsProps<T>) => {
	// Get display mode from Redux settings (fallback to prop)
	const { settings } = useAppSelector((state: any) => state.theme);
	const isGamifiedMode = gamified || settings.displayMode === "gamified";
	const isDarkMode = settings.theme === "dark";

	const handleToggleTask = () => {
		onToggleTask(task.id);
	};

	const handleDeleteTask = (e: React.MouseEvent) => {
		e.stopPropagation();
		onDeleteTask(task.id, task.title);
	};

	const getPriorityStyles = (priority: string) => {
		switch (priority) {
			case "high":
				return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
			case "medium":
				return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
			case "low":
				return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
			default:
				return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300";
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "high":
				return "#ef4444"; // red-500
			case "medium":
				return "#f97316"; // orange-500
			case "low":
				return "#10b981"; // green-500
			default:
				return "#6b7280"; // gray-500
		}
	};

	const getHoverStyles = () => {
		return `hover:bg-${themeColor}-50 dark:hover:bg-${themeColor}-900/20`;
	};

	const getAccentStyles = () => {
		return `accent-${themeColor}-500`;
	};

	// Gamified mode rendering
	if (isGamifiedMode) {
		return (
			<li
				key={task.id}
				className={`relative card rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden ${holidayColor} text-white tracking-wide border-2 border-white ${
					task.isCompleted ? "opacity-60" : ""
				}`}
				style={getCardStyling({
					isDarkMode,
					isGamified: true,
					intensity: "heavy",
				})}
				onClick={handleToggleTask}
			>
				{/* Priority Indicator - Left Side */}
				<div
					className="absolute left-0 top-0 bottom-0 w-2"
					style={{
						backgroundColor: getPriorityColor(task.priority),
						zIndex: 10,
					}}
				></div>

				{/* Background texture overlay */}
				<div className="absolute inset-0 opacity-10 pointer-events-none">
					<div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-white opacity-20 pointer-events-none"></div>
					<div className="absolute top-8 right-6 w-4 h-4 rounded-full bg-white opacity-15 pointer-events-none"></div>
					<div className="absolute bottom-6 left-8 w-5 h-5 rounded-full bg-white opacity-10 pointer-events-none"></div>
					<div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-white opacity-20 pointer-events-none"></div>
				</div>

				{/* Delete Button - Top Right Corner */}
				<div
					className="absolute top-2 right-2 z-50"
					onClick={(e) => {
						e.stopPropagation();
					}}
				>
					<button
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							handleDeleteTask(e);
						}}
						className="text-red-700 hover:text-red-900 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors cursor-pointer"
						title="Delete event"
						style={{
							pointerEvents: "auto",
						}}
					>
						<span className="text-3xl font-bold select-none">×</span>
					</button>
				</div>

				<div className="relative z-10 pl-3">
					<div className="flex items-start space-x-3">
						{/* Checkbox */}
						<div className="flex-shrink-0 mt-1">
							<input
								type="checkbox"
								checked={task.isCompleted}
								readOnly
								className="w-5 h-5 text-white accent-white"
								style={{ pointerEvents: "none" }}
							/>
						</div>

						{/* Event Content */}
						<div
							className="flex-1 min-w-0"
							style={{ fontFamily: "var(--font-family-fredoka)" }}
						>
							<div
								className={`font-semibold text-white ${
									task.isCompleted ? "line-through opacity-60" : ""
								}`}
							>
								{task.title}
							</div>
							{task.description && (
								<div
									className={`text-sm text-white opacity-90 mt-1 ${
										task.isCompleted ? "line-through opacity-60" : ""
									}`}
								>
									{task.description}
								</div>
							)}
							<div className="flex gap-2 text-xs text-white opacity-90 mt-2 flex-wrap">
								{task.assignedTo && (
									<span className="bg-white bg-opacity-20 px-2 py-1 rounded-full">
										👤 {task.assignedTo}
									</span>
								)}
								{task.category && (
									<span className="bg-white bg-opacity-20 px-2 py-1 rounded-full">
										📂 {task.category}
									</span>
								)}
								{task.dueDate && (
									<span className="bg-white bg-opacity-20 px-2 py-1 rounded-full">
										📅 {new Date(task.dueDate).toLocaleDateString()}
									</span>
								)}
								{task.completedDate && (
									<span className="bg-green-600 bg-opacity-80 px-2 py-1 rounded-full">
										✅ {new Date(task.completedDate).toLocaleDateString()}
									</span>
								)}
							</div>
						</div>
					</div>
				</div>
			</li>
		);
	}

	// Professional mode rendering
	// Render completed task item
	if (task.isCompleted) {
		return (
			<li
				className={`flex items-center px-4 py-3 cursor-pointer ${getHoverStyles()} opacity-60`}
				onClick={handleToggleTask}
			>
				<input
					type="checkbox"
					checked={task.isCompleted}
					readOnly
					className={`mr-3 ${getAccentStyles()}`}
				/>
				<div className="flex-1">
					<div className="line-through text-gray-400 dark:text-gray-500">
						{task.title}
					</div>
					{task.description && (
						<div className="text-xs text-gray-400 dark:text-gray-500 line-through">
							{task.description}
						</div>
					)}
					{task.completedDate && (
						<div
							className={`text-xs text-${themeColor}-600 dark:text-${themeColor}-400 mt-1`}
						>
							Completed: {new Date(task.completedDate).toLocaleDateString()}
						</div>
					)}
				</div>
				<button
					onClick={handleDeleteTask}
					className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
					disabled={loading}
				>
					Delete
				</button>
			</li>
		);
	}

	// Render incomplete task item
	return (
		<li
			className={`flex items-center px-4 py-3 cursor-pointer ${getHoverStyles()}`}
			onClick={handleToggleTask}
		>
			<input
				type="checkbox"
				checked={task.isCompleted}
				readOnly
				className={`mr-3 ${getAccentStyles()}`}
			/>
			<div className="flex-1">
				<div className="text-gray-900 dark:text-white">{task.title}</div>
				{task.description && (
					<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
						{task.description}
					</div>
				)}
				<div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
					<span
						className={`px-2 py-1 rounded ${getPriorityStyles(task.priority)}`}
					>
						{task.priority}
					</span>
					{task.assignedTo && <span>Assigned: {task.assignedTo}</span>}
					{task.category && <span>{task.category}</span>}
					{task.dueDate && (
						<span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
					)}
				</div>
			</div>
			<button
				onClick={handleDeleteTask}
				className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
				disabled={loading}
			>
				Delete
			</button>
		</li>
	);
};

export default EventItems;
