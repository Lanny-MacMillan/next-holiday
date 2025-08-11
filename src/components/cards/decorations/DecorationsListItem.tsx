import React from "react";
import { useAppSelector } from "@/store/hooks";
import { getCardStyling } from "@/utils/cardShadows";

interface Task {
	id: string;
	title: string;
	description?: string;
	priority: "low" | "medium" | "high";
	assignedTo?: string;
	category?: string;
	dueDate?: string;
	isCompleted: boolean;
	completedDate?: string;
	createdAt: string;
	updatedAt: string;
}

interface DecorationsListItemProps {
	task: Task;
	onToggleTask: (taskId: string) => void;
	onDeleteTask: (taskId: string) => void;
	onEditTask?: (task: Task) => void; // New prop for edit functionality
	loading?: boolean;
	gamified?: boolean; // New prop to control display mode
	holidayColor?: string; // New prop for holiday background color (can be gradient class or hex color)
}

const DecorationsListItem: React.FC<DecorationsListItemProps> = ({
	task,
	onToggleTask,
	onDeleteTask,
	onEditTask,
	loading = false,
	gamified = false,
	holidayColor,
}) => {
	// Get display mode from Redux settings (fallback to prop)
	const { settings } = useAppSelector((state: any) => state.theme);
	const isGamifiedMode = gamified || settings.displayMode === "gamified";
	const isDarkMode = settings.theme === "dark";

	// Handle holiday color - check if it's a gradient class or hex color
	const isGradientClass =
		holidayColor && holidayColor.startsWith("bg-gradient");
	const backgroundColor = holidayColor || "#3b82f6"; // blue-500 fallback

	const handleToggleTask = () => {
		onToggleTask(task.id);
	};

	const handleDeleteTask = (e: React.MouseEvent) => {
		e.stopPropagation();
		onDeleteTask(task.id);
	};

	const getPriorityStyles = (priority: string) => {
		switch (priority) {
			case "high":
				return "bg-white text-red-600 border border-red-200";
			case "medium":
				return "bg-white text-orange-600 border border-orange-200";
			case "low":
			default:
				return "bg-white text-green-600 border border-green-200";
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "high":
				return "#ef4444"; // red-500
			case "medium":
				return "#f59e0b"; // amber-500
			case "low":
			default:
				return "#10b981"; // emerald-500
		}
	};

	// Decoration-themed icons for gamified mode
	const DecorationIcon = ({ priority }: { priority: string }) => {
		const getIcon = (priority: string) => {
			switch (priority) {
				case "high":
					return "⭐"; // Star for high priority
				case "medium":
					return "🎄"; // Christmas tree for medium
				case "low":
				default:
					return "🎀"; // Bow for low priority
			}
		};

		return <div className="text-2xl">{getIcon(priority)}</div>;
	};

	if (task.isCompleted) {
		if (isGamifiedMode) {
			// Gamified completed task design
			return (
				<li
					key={task.id}
					className={`relative card rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden opacity-60 text-white tracking-wide border-2 border-white border-opacity-30 ${
						isGradientClass ? holidayColor : ""
					}`}
					style={{
						backgroundColor: isGradientClass
							? undefined
							: holidayColor || "#6b7280", // gray-500 fallback
						...getCardStyling({
							isDarkMode,
							isGamified: true,
							intensity: "heavy",
						}),
					}}
					onClick={handleToggleTask}
				>
					{/* Background texture overlay */}
					<div className="absolute inset-0 opacity-10 pointer-events-none">
						<div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-white opacity-20 pointer-events-none"></div>
						<div className="absolute top-8 right-6 w-4 h-4 rounded-full bg-white opacity-15 pointer-events-none"></div>
						<div className="absolute bottom-6 left-8 w-5 h-5 rounded-full bg-white opacity-10 pointer-events-none"></div>
						<div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-white opacity-20 pointer-events-none"></div>
					</div>

					{/* Priority indicator */}
					<div
						className="absolute left-0 top-0 bottom-0 w-2"
						style={{ backgroundColor: getPriorityColor(task.priority) }}
					></div>

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
								onDeleteTask(task.id);
							}}
							className="text-red-700 hover:text-red-900 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors cursor-pointer"
							title="Delete task"
							disabled={loading}
							style={{
								pointerEvents: "auto",
							}}
						>
							<span className="text-3xl font-bold select-none">×</span>
						</button>
					</div>

					<div className="relative z-10">
						<div className="flex items-start space-x-3">
							{/* Decoration Icon */}
							<div className="w-12 h-12 bg-white bg-opacity-10 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
								<DecorationIcon priority={task.priority} />
							</div>

							{/* Task Content */}
							<div
								className="flex-1 min-w-0"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								<div className="font-semibold text-white line-through opacity-60">
									{task.title}
								</div>
								{task.description && (
									<div className="text-sm text-white opacity-60 line-through mt-1">
										{task.description}
									</div>
								)}
								{task.completedDate && (
									<div className="text-xs text-white opacity-90 mt-1">
										Completed:{" "}
										{new Date(task.completedDate).toLocaleDateString()}
									</div>
								)}
								<div className="flex gap-2 text-xs text-white opacity-75 mt-2">
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

						{/* Edit Button - Larger styling to match GiftListItem */}
						{onEditTask && (
							<div className="flex flex-col gap-1 mt-3">
								<button
									onClick={(e) => {
										e.stopPropagation();
										onEditTask(task);
									}}
									className="text-white border border-yellow-300 hover:bg-yellow-300 hover:text-white text-sm px-2 py-1 rounded transition-colors"
									disabled={loading}
								>
									Edit
								</button>
							</div>
						)}
					</div>
				</li>
			);
		}

		// Original completed task design
		return (
			<li
				key={task.id}
				className="flex items-center px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 opacity-60"
				onClick={handleToggleTask}
			>
				<input
					type="checkbox"
					checked={task.isCompleted}
					readOnly
					className="mr-3 accent-blue-500"
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
						<div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
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

	if (isGamifiedMode) {
		// Gamified uncompleted task design
		return (
			<li
				key={task.id}
				className={`relative card rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden text-white tracking-wide border-2 border-white border-opacity-30 ${
					isGradientClass ? holidayColor : ""
				}`}
				style={{
					backgroundColor: isGradientClass
						? undefined
						: holidayColor || "#3b82f6", // blue-500 fallback
					...getCardStyling({
						isDarkMode,
						isGamified: true,
						intensity: "heavy",
					}),
				}}
				onClick={handleToggleTask}
			>
				{/* Background texture overlay */}
				<div className="absolute inset-0 opacity-10 pointer-events-none">
					<div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-white opacity-20 pointer-events-none"></div>
					<div className="absolute top-8 right-6 w-4 h-4 rounded-full bg-white opacity-15 pointer-events-none"></div>
					<div className="absolute bottom-6 left-8 w-5 h-5 rounded-full bg-white opacity-10 pointer-events-none"></div>
					<div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-white opacity-20 pointer-events-none"></div>
				</div>

				{/* Priority indicator - 10px wide strip on left side */}
				<div
					className="absolute left-0 top-0 bottom-0"
					style={{
						backgroundColor: getPriorityColor(task.priority),
						width: "10px",
					}}
				></div>

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
							onDeleteTask(task.id);
						}}
						className="text-red-700 hover:text-red-900 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors cursor-pointer"
						title="Delete task"
						disabled={loading}
						style={{
							pointerEvents: "auto",
						}}
					>
						<span className="text-3xl font-bold select-none">×</span>
					</button>
				</div>

				<div className="relative z-10">
					<div className="flex items-start space-x-3">
						{/* Decoration Icon */}
						<div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
							<DecorationIcon priority={task.priority} />
						</div>

						{/* Task Content */}
						<div
							className="flex-1 min-w-0"
							style={{ fontFamily: "var(--font-family-fredoka)" }}
						>
							<div className="font-semibold text-white">{task.title}</div>
							{task.description && (
								<div className="text-sm text-white opacity-90 mt-1">
									{task.description}
								</div>
							)}
							<div className="flex gap-2 text-xs text-white opacity-75 mt-2">
								<span
									className="px-2 py-1 rounded-full bg-white text-sm font-medium"
									style={{
										color: getPriorityColor(task.priority),
										backgroundColor: "white",
									}}
								>
									{task.priority} priority
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

					{/* Edit Button - Larger styling to match GiftListItem */}
					{onEditTask && (
						<div className="flex flex-col gap-1 mt-3">
							<button
								onClick={(e) => {
									e.stopPropagation();
									onEditTask(task);
								}}
								className="text-white border border-yellow-300 hover:bg-yellow-300 hover:text-white text-sm px-2 py-1 rounded transition-colors"
								disabled={loading}
							>
								Edit
							</button>
						</div>
					)}
				</div>
			</li>
		);
	}

	// Original uncompleted task design
	return (
		<li
			key={task.id}
			className="flex items-center px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
			onClick={handleToggleTask}
		>
			<input
				type="checkbox"
				checked={task.isCompleted}
				readOnly
				className="mr-3 accent-blue-500"
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

export default DecorationsListItem;
