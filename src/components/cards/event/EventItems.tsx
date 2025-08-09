import React from "react";

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
}

const EventItems = <T extends BaseEventTask>({
	task,
	onToggleTask,
	onDeleteTask,
	loading = false,
	themeColor = "blue",
}: EventItemsProps<T>) => {
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

	const getHoverStyles = () => {
		return `hover:bg-${themeColor}-50 dark:hover:bg-${themeColor}-900/20`;
	};

	const getAccentStyles = () => {
		return `accent-${themeColor}-500`;
	};

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
