import React, { useState } from "react";
import { Task } from "@/store/slices/tasksSlice";
import DeleteModal from "@/components/modals/DeleteModal";
import { getDeleteConfig } from "@/config/deleteModalConfigs";
import { useAppSelector } from "@/store/hooks";
import { getCardStyling } from "@/utils/cardShadows";
import { getTaskGamifiedBackgroundColor } from "@/utils/gamifiedUtils";

export interface ToDoCardProps {
	task: Task;
	onToggleComplete: (taskId: string) => void;
	onDelete: (taskId: string) => void;
	onEdit: (task: Task) => void;
	className?: string;
	theme?: {
		accentColor?: string;
		hoverColor?: string;
	};
	borderColor?: string; // Border color for the left border
	gamified?: boolean; // New prop to control display mode
}

// Task-themed icons for gamified mode
const TaskIcon = ({
	priority,
	className = "",
}: {
	priority: string;
	className?: string;
}) => {
	const iconMap: { [key: string]: string } = {
		high: "🔥",
		medium: "⚡",
		low: "🌱",
	};

	return (
		<div className={`text-2xl ${className}`}>{iconMap[priority] || "📝"}</div>
	);
};

export default function ToDoCard({
	task,
	onToggleComplete,
	onDelete,
	onEdit,
	className = "",
	theme = {},
	borderColor,
	gamified = false,
}: ToDoCardProps) {
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	// Get display mode from Redux settings (fallback to prop)
	const { settings } = useAppSelector((state: any) => state.theme);
	const isGamifiedMode = gamified || settings.displayMode === "gamified";
	const isDarkMode = settings.theme === "dark";

	const accentColor = theme.accentColor;
	const hoverColor = theme.hoverColor || "hover:shadow-md";

	// Apply border color if provided
	const borderStyle = borderColor
		? { borderLeft: `4px solid ${borderColor}` }
		: {};

	const handleToggle = () => {
		onToggleComplete(task.id);
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		setShowDeleteConfirm(true);
	};

	const confirmDelete = () => {
		onDelete(task.id);
		setShowDeleteConfirm(false);
	};

	const cancelDelete = () => {
		setShowDeleteConfirm(false);
	};

	const handleEdit = (e: React.MouseEvent) => {
		e.stopPropagation();
		onEdit(task);
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "high":
				return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
			case "medium":
				return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
			case "low":
				return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
			default:
				return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
		}
	};

	const gamifiedBackgroundColor = getTaskGamifiedBackgroundColor(task.priority);

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString();
	};

	if (isGamifiedMode) {
		// Gamified mode design
		return (
			<div
				className={`relative card rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden ${gamifiedBackgroundColor} text-white ${className}`}
				style={getCardStyling({
					isDarkMode,
					isGamified: true,
					intensity: "heavy",
				})}
				onClick={handleToggle}
			>
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
							handleDelete(e);
						}}
						className="text-red-700 hover:text-red-900 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors cursor-pointer"
						title="Delete task"
						style={{
							pointerEvents: "auto",
						}}
					>
						<span className="text-3xl font-bold select-none">×</span>
					</button>
				</div>

				{/* Delete Confirmation Modal */}
				<DeleteModal
					isOpen={showDeleteConfirm}
					{...getDeleteConfig("tasks")}
					itemName={task.title}
					onConfirm={confirmDelete}
					onCancel={cancelDelete}
				/>

				<div className="relative z-10">
					{/* Main Card Content */}
					<div className="flex items-start space-x-3">
						{/* Task Icon */}
						<div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
							<TaskIcon priority={task.priority} />
						</div>

						{/* Task Content */}
						<div className="flex-1 min-w-0">
							{/* Task Title */}
							<div
								className={`font-semibold text-white ${
									task.isCompleted ? "line-through opacity-60" : ""
								}`}
							>
								{task.title}
							</div>

							{/* Task Description */}
							{task.description && (
								<>
									{/* Extract and display description without cost */}
									{(() => {
										const costMatch =
											task.description.match(/Cost: \$(\d+\.?\d*)/);
										const descriptionWithoutCost = task.description.replace(
											/\nCost: \$(\d+\.?\d*)/,
											""
										);

										return (
											<>
												{descriptionWithoutCost && (
													<div
														className={`text-sm mt-1 text-white opacity-90 ${
															task.isCompleted ? "line-through opacity-60" : ""
														}`}
													>
														{descriptionWithoutCost}
													</div>
												)}

												{/* Display cost separately below description */}
												{costMatch && (
													<div
														className={`text-sm mt-1 font-medium text-white opacity-90 ${
															task.isCompleted ? "line-through opacity-60" : ""
														}`}
													>
														Cost: ${costMatch[1]}
													</div>
												)}
											</>
										);
									})()}
								</>
							)}

							{/* Task Metadata */}
							<div className="flex flex-wrap gap-2 mt-2">
								{/* Priority Tag */}
								<span className="px-2 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 text-white">
									{task.priority}
								</span>

								{/* Category Tag */}
								{task.category && (
									<span className="px-2 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 text-white">
										{task.category}
									</span>
								)}

								{/* Due Date */}
								{task.dueDate && !task.isCompleted && (
									<span className="text-xs text-white opacity-80">
										Due: {formatDate(task.dueDate)}
									</span>
								)}

								{/* Completion Date */}
								{task.completedDate && task.isCompleted && (
									<span className="text-xs text-white opacity-60">
										Completed: {formatDate(task.completedDate)}
									</span>
								)}
							</div>
						</div>
					</div>

					{/* Edit Button - Centered on Right Side */}
					<button
						onClick={handleEdit}
						className="absolute top-1/2 right-4 transform -translate-y-1/2 text-white border border-yellow-300 hover:bg-yellow-300 hover:text-white text-xs px-2 py-1 rounded transition-colors z-10"
						title="Edit task"
					>
						Edit
					</button>
				</div>
			</div>
		);
	}

	// Professional mode (existing design)
	return (
		<div
			className={`relative card card-tasks p-4 cursor-pointer ${hoverColor} transition-shadow ${className}`}
			style={borderStyle}
			onClick={handleToggle}
		>
			{/* Close Button (Red X) */}
			<button
				onClick={(e) => {
					e.stopPropagation();
					handleDelete(e);
				}}
				className="absolute top-2 right-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-lg font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
				title="Delete task"
			>
				×
			</button>
			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={showDeleteConfirm}
				{...getDeleteConfig("tasks")}
				itemName={task.title}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
			/>

			{/* Main Card Content */}
			<div className="flex items-start space-x-3">
				{/* Checkbox */}
				<input
					type="checkbox"
					checked={task.isCompleted}
					readOnly
					className="mt-1 mr-3"
					style={{ accentColor }}
				/>

				{/* Task Content */}
				<div className="flex-1 min-w-0">
					{/* Task Title */}
					<div
						className={`font-semibold ${
							task.isCompleted
								? "line-through text-gray-400 dark:text-gray-500"
								: "text-gray-900 dark:text-white"
						}`}
					>
						{task.title}
					</div>

					{/* Task Description */}
					{task.description && (
						<>
							{/* Extract and display description without cost */}
							{(() => {
								const costMatch = task.description.match(/Cost: \$(\d+\.?\d*)/);
								const descriptionWithoutCost = task.description.replace(
									/\nCost: \$(\d+\.?\d*)/,
									""
								);

								return (
									<>
										{descriptionWithoutCost && (
											<div
												className={`text-sm mt-1 ${
													task.isCompleted
														? "line-through text-gray-400 dark:text-gray-500"
														: "text-gray-500 dark:text-gray-400"
												}`}
											>
												{descriptionWithoutCost}
											</div>
										)}

										{/* Display cost separately below description */}
										{costMatch && (
											<div
												className={`text-sm mt-1 font-medium ${
													task.isCompleted
														? "line-through text-gray-400 dark:text-gray-500"
														: "text-green-600 dark:text-green-400"
												}`}
											>
												Cost: ${costMatch[1]}
											</div>
										)}
									</>
								);
							})()}
						</>
					)}

					{/* Task Metadata */}
					<div className="flex flex-wrap gap-2 mt-2">
						{/* Priority Tag */}
						<span
							className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
								task.priority
							)}`}
						>
							{task.priority}
						</span>

						{/* Category Tag */}
						{task.category && (
							<span className="px-2 py-1 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
								{task.category}
							</span>
						)}

						{/* Due Date */}
						{task.dueDate && !task.isCompleted && (
							<span className="text-xs text-gray-500 dark:text-gray-400">
								Due: {formatDate(task.dueDate)}
							</span>
						)}

						{/* Completion Date */}
						{task.completedDate && task.isCompleted && (
							<span className="text-xs text-gray-400 dark:text-gray-500">
								Completed: {formatDate(task.completedDate)}
							</span>
						)}
					</div>
				</div>
			</div>

			{/* Edit Button - Centered on Right Side */}
			<button
				onClick={handleEdit}
				className="absolute top-1/2 right-4 transform -translate-y-1/2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
				title="Edit task"
			>
				Edit
			</button>
		</div>
	);
}
