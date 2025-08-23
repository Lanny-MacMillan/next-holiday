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
	onEditTask?: (task: T) => void; // New prop for edit functionality
	loading?: boolean;
	themeColor?: string; // For hover effects and accents (e.g., "blue", "red", "green")
	gamified?: boolean; // New prop to control display mode
	holidayColor?: string; // New prop for background color
	backgroundColor?: string; // New prop for inline background style
}

const EventItems = <T extends BaseEventTask>({
	task,
	onToggleTask,
	onDeleteTask,
	onEditTask,
	loading = false,
	themeColor = "blue",
	gamified = false,
	holidayColor,
	backgroundColor,
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

	const handleEditTask = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onEditTask) {
			onEditTask(task);
		}
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

	const getGamifiedPriorityStyles = (priority: string) => {
		switch (priority) {
			case "high":
				return "bg-red-200 bg-opacity-30 text-white";
			case "medium":
				return "bg-yellow-200 bg-opacity-30 text-white";
			case "low":
				return "bg-green-200 bg-opacity-30 text-white";
			default:
				return "bg-white bg-opacity-20 text-white";
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

	// Gamified mode design
	if (isGamifiedMode) {
		const bgColor = backgroundColor || holidayColor || `bg-${themeColor}-500`;

		// Render completed task item (gamified)
		if (task.isCompleted) {
			return (
				<li
					className={`relative card rounded-2xl p-3 sm:p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden tracking-wide text-white opacity-60 border-2 border-white`}
					style={{
						...getCardStyling({
							isDarkMode,
							isGamified: true,
							intensity: "heavy",
						}),
						background: backgroundColor || bgColor,
					}}
					onClick={handleToggleTask}
				>
					{/* Priority indicator - 10px wide strip on left side */}
					<div
						className="absolute left-0 top-0 bottom-0"
						style={{
							backgroundColor: getPriorityColor(task.priority),
							width: "10px",
						}}
					></div>

					{/* Background texture overlay */}
					<div className="absolute inset-0 opacity-10 pointer-events-none">
						<div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-white opacity-20 pointer-events-none"></div>
						<div className="absolute top-8 right-6 w-4 h-4 rounded-full bg-white opacity-15 pointer-events-none"></div>
						<div className="absolute bottom-6 left-8 w-5 h-5 rounded-full bg-white opacity-10 pointer-events-none"></div>
						<div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-white opacity-20 pointer-events-none"></div>
					</div>

					{/* Action Buttons - Top Right Corner */}
					<div
						className="absolute top-2 right-2 z-50 flex gap-1"
						onClick={(e) => {
							e.stopPropagation();
						}}
					>
						{/* Edit Button */}
						{onEditTask && (
							<button
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									handleEditTask(e);
								}}
								className="text-blue-700 hover:text-blue-900 text-sm font-bold w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-blue-100 transition-colors cursor-pointer"
								title="Edit task"
								style={{
									pointerEvents: "auto",
								}}
								disabled={loading}
							>
								<span className="text-lg sm:text-xl font-bold select-none">
									✏️
								</span>
							</button>
						)}
						{/* Delete Button */}
						<button
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								handleDeleteTask(e);
							}}
							className="text-red-700 hover:text-red-900 text-xl sm:text-2xl font-bold w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors cursor-pointer"
							title="Delete task"
							style={{
								pointerEvents: "auto",
							}}
							disabled={loading}
						>
							<span className="text-2xl sm:text-3xl font-bold select-none">
								×
							</span>
						</button>
					</div>

					<div className="relative z-10">
						<div className="flex items-start space-x-3">
							{/* Task Icon */}
							<div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
								<div className="text-xl sm:text-2xl">✅</div>
							</div>

							{/* Task Content */}
							<div
								className="flex-1 min-w-0"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								<div className="line-through text-white opacity-60 text-sm sm:text-base">
									{task.title}
								</div>
								{task.description && (
									<div className="text-xs sm:text-sm text-white opacity-60 line-through mt-1">
										{task.description}
									</div>
								)}
								{task.completedDate && (
									<div className="text-xs text-green-200 mt-1">
										Completed:{" "}
										{new Date(task.completedDate).toLocaleDateString()}
									</div>
								)}
							</div>
						</div>
					</div>
				</li>
			);
		}

		// Render incomplete task item (gamified)
		return (
			<li
				className={`relative card rounded-2xl p-3 sm:p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden tracking-wide text-white border-2 border-white`}
				style={{
					...getCardStyling({
						isDarkMode,
						isGamified: true,
						intensity: "heavy",
					}),
					background: backgroundColor || bgColor,
				}}
				onClick={handleToggleTask}
			>
				{/* Priority indicator - 10px wide strip on left side */}
				<div
					className="absolute left-0 top-0 bottom-0"
					style={{
						backgroundColor: getPriorityColor(task.priority),
						width: "10px",
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
					className="absolute top-2 right-2 z-50 flex gap-1"
					onClick={(e) => {
						e.stopPropagation();
					}}
				>
					{/* Edit Button */}
					{onEditTask && (
						<button
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								handleEditTask(e);
							}}
							className="text-blue-700 hover:text-blue-900 text-sm font-bold w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-blue-100 transition-colors cursor-pointer"
							title="Edit task"
							style={{
								pointerEvents: "auto",
							}}
							disabled={loading}
						>
							<span className="text-lg sm:text-xl font-bold select-none">
								✏️
							</span>
						</button>
					)}
					{/* Delete Button */}
					<button
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							handleDeleteTask(e);
						}}
						className="text-red-700 hover:text-red-900 text-xl sm:text-2xl font-bold w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors cursor-pointer"
						title="Delete task"
						style={{
							pointerEvents: "auto",
						}}
						disabled={loading}
					>
						<span className="text-2xl sm:text-3xl font-bold select-none">
							×
						</span>
					</button>
				</div>

				<div className="relative z-10">
					<div className="flex items-start space-x-3">
						{/* Task Icon */}
						<div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
							<div className="text-xl sm:text-2xl">📋</div>
						</div>

						{/* Task Content */}
						<div
							className="flex-1 min-w-0"
							style={{ fontFamily: "var(--font-family-fredoka)" }}
						>
							<div className="font-semibold text-white text-sm sm:text-base">
								{task.title}
							</div>
							{task.description && (
								<div className="text-xs sm:text-sm text-white opacity-90 mt-1">
									{task.description}
								</div>
							)}
							<div className="flex gap-2 sm:gap-4 text-xs text-white opacity-80 mt-1">
								<span
									className={`px-2 py-1 rounded text-xs sm:text-sm ${getGamifiedPriorityStyles(
										task.priority
									)}`}
								>
									{task.priority}
								</span>
								{task.assignedTo && <span>Assigned: {task.assignedTo}</span>}
								{task.category && <span>{task.category}</span>}
								{task.dueDate && (
									<span>
										Due: {new Date(task.dueDate).toLocaleDateString()}
									</span>
								)}
							</div>
						</div>
					</div>
				</div>
			</li>
		);
	}

	// Professional mode (existing design)
	// Render completed task item
	if (task.isCompleted) {
		return (
			<li
				className={`flex items-center px-3 py-3 sm:px-4 sm:py-3 cursor-pointer ${getHoverStyles()} opacity-60`}
				onClick={handleToggleTask}
			>
				<input
					type="checkbox"
					checked={task.isCompleted}
					readOnly
					className={`mr-3 ${getAccentStyles()}`}
				/>
				<div className="flex-1">
					<div className="line-through text-gray-400 dark:text-gray-500 text-sm sm:text-base">
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
				<div className="flex gap-2">
					{onEditTask && (
						<button
							onClick={(e) => {
								e.stopPropagation();
								handleEditTask(e);
							}}
							className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs sm:text-sm"
							disabled={loading}
						>
							Edit
						</button>
					)}
					<button
						onClick={handleDeleteTask}
						className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs sm:text-sm"
						disabled={loading}
					>
						Delete
					</button>
				</div>
			</li>
		);
	}

	// Render incomplete task item
	return (
		<li
			className={`flex items-center px-3 py-3 sm:px-4 sm:py-3 cursor-pointer ${getHoverStyles()}`}
			onClick={handleToggleTask}
		>
			<input
				type="checkbox"
				checked={task.isCompleted}
				readOnly
				className={`mr-3 ${getAccentStyles()}`}
			/>
			<div className="flex-1">
				<div className="text-gray-900 dark:text-white text-sm sm:text-base">
					{task.title}
				</div>
				{task.description && (
					<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
						{task.description}
					</div>
				)}
				<div className="flex gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
					<span
						className={`px-2 py-1 rounded text-xs sm:text-sm ${getPriorityStyles(
							task.priority
						)}`}
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
			<div className="flex gap-2">
				{onEditTask && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							handleEditTask(e);
						}}
						className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs sm:text-sm"
						disabled={loading}
					>
						Edit
					</button>
				)}
				<button
					onClick={handleDeleteTask}
					className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs sm:text-sm"
					disabled={loading}
				>
					Delete
				</button>
			</div>
		</li>
	);
};

export default EventItems;
