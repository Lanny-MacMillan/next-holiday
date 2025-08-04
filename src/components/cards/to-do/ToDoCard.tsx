import React, { useState } from "react";
import { Task } from "@/store/slices/tasksSlice";

export interface ToDoCardProps {
	task: Task;
	onToggleComplete: (taskId: string) => void;
	onDelete: (taskId: string) => void;
	onEdit: (task: Task) => void;
	className?: string;
}

export default function ToDoCard({
	task,
	onToggleComplete,
	onDelete,
	onEdit,
	className = "",
}: ToDoCardProps) {
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const handleToggle = () => {
		onToggleComplete(task.id);
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		setShowDeleteConfirm(true);
	};

	const confirmDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		onDelete(task.id);
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

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString();
	};

	return (
		<div
			className={`relative card card-tasks p-4 cursor-pointer hover:shadow-md transition-shadow ${className}`}
			onClick={handleToggle}
		>
			{/* Delete Confirmation Modal */}
			{showDeleteConfirm && (
				<div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
					<div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-xs mx-4">
						<h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
							Delete Task?
						</h3>
						<p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
							Are you sure you want to delete "{task.title}"?
						</p>
						<div className="flex gap-2">
							<button
								onClick={(e) => {
									e.stopPropagation();
									setShowDeleteConfirm(false);
								}}
								className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={confirmDelete}
								className="flex-1 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Main Card Content */}
			<div className="flex items-start space-x-3">
				{/* Checkbox */}
				<input
					type="checkbox"
					checked={task.isCompleted}
					readOnly
					className="mt-1 mr-3 accent-orange-500"
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
						<div
							className={`text-sm mt-1 ${
								task.isCompleted
									? "line-through text-gray-400 dark:text-gray-500"
									: "text-gray-500 dark:text-gray-400"
							}`}
						>
							{task.description}
						</div>
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

				{/* Action Buttons */}
				<div className="flex flex-col gap-1">
					<button
						onClick={handleEdit}
						className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
						title="Edit task"
					>
						Edit
					</button>
					<button
						onClick={handleDelete}
						className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
						title="Delete task"
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	);
}
