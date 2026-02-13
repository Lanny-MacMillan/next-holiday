import React, { useState, useEffect } from "react";
import { Task } from "@/store/slices/tasksSlice";

export interface EditTaskModalProps {
	isOpen: boolean;
	task: Task | null;
	onClose: () => void;
	onSave: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
	loading?: boolean;
	isHolidayShared?: boolean;
}

export default function EditTaskModal({
	isOpen,
	task,
	onClose,
	onSave,
	loading = false,
	isHolidayShared = false,
}: EditTaskModalProps) {
	const [form, setForm] = useState({
		title: "",
		description: "",
		priority: "medium" as "low" | "medium" | "high",
		assignedTo: "",
		category: "",
		dueDate: "",
		isCompleted: false,
	});

	useEffect(() => {
		if (task) {
			setForm({
				title: task.title,
				description: task.description || "",
				priority: task.priority,
				assignedTo: task.assignedTo || "",
				category: task.category || "",
				dueDate: task.dueDate || "",
				isCompleted: task.isCompleted,
			});
		}
	}, [task]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.title.trim()) return;

		const updatedTask: Omit<Task, "id" | "createdAt" | "updatedAt"> = {
			title: form.title,
			description: form.description || undefined,
			priority: form.priority,
			assignedTo: form.assignedTo || undefined,
			category: form.category || undefined,
			dueDate: form.dueDate || undefined,
			isCompleted: form.isCompleted,
		};

		onSave(updatedTask);
	};

	const handleClose = () => {
		setForm({
			title: "",
			description: "",
			priority: "medium",
			assignedTo: "",
			category: "",
			dueDate: "",
			isCompleted: false,
		});
		onClose();
	};

	if (!isOpen || !task) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
			<div className="card  rounded-lg p-4 sm:p-6 max-w-md mx-auto w-full max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-3 sm:mb-4">
					<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
						Edit Task
					</h3>
					<button
						onClick={handleClose}
						className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-lg sm:text-xl"
					>
						×
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
					{/* Task Title */}
					<input
						className="border rounded px-3 py-2 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
						placeholder="Task Title*"
						value={form.title}
						onChange={(e) =>
							setForm((prev) => ({ ...prev, title: e.target.value }))
						}
						required
					/>

					{/* Description */}
					<textarea
						className="border rounded px-3 py-2 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
						placeholder="Description"
						value={form.description}
						onChange={(e) =>
							setForm((prev) => ({ ...prev, description: e.target.value }))
						}
						rows={2}
					/>

					{/* Priority and Assigned To */}
					<div className="flex gap-2">
						<select
							className="flex-1 border rounded px-3 py-2 text-sm sm:text-base text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
							value={form.priority}
							onChange={(e) =>
								setForm((prev) => ({
									...prev,
									priority: e.target.value as "low" | "medium" | "high",
								}))
							}
						>
							<option value="low">Low Priority</option>
							<option value="medium">Medium Priority</option>
							<option value="high">High Priority</option>
						</select>
						{isHolidayShared && (
							<input
								className="flex-1 border rounded px-3 py-2 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
								placeholder="Assigned To"
								value={form.assignedTo}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, assignedTo: e.target.value }))
								}
							/>
						)}
					</div>
					{/* Category and Due Date */}
					<div className="flex gap-2">
						<input
							className="flex-1 border rounded px-3 py-2 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
							placeholder="Due Date"
							type="date"
							value={form.dueDate}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, dueDate: e.target.value }))
							}
						/>
					</div>

					{/* Completion Status */}
					<div className="flex items-center">
						<input
							type="checkbox"
							id="isCompleted"
							checked={form.isCompleted}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, isCompleted: e.target.checked }))
							}
							className="mr-2 accent-green-500"
						/>
						<label
							htmlFor="isCompleted"
							className="text-xs sm:text-sm text-gray-700 dark:text-gray-300"
						>
							Mark as completed
						</label>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3 pt-2">
						<button
							type="button"
							onClick={handleClose}
							className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="flex-1 bg-green-500 text-white px-3 sm:px-4 py-2 rounded hover:bg-green-600 transition-colors text-sm sm:text-base"
							disabled={loading}
						>
							{loading ? "Saving..." : "Save Changes"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
