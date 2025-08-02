"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchTasks,
	addTask,
	updateTask,
	deleteTask,
	toggleTaskCompletion,
	Task,
} from "@/store/slices/tasksSlice";
import SortModal from "@/components/SortModal";

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

export default function TasksPage() {
	const dispatch = useAppDispatch();
	const { tasks, loading, error, initialized } = useAppSelector(
		(state: any) => state.tasks
	);

	const [form, setForm] = useState({
		title: "",
		description: "",
		priority: "medium",
		assignedTo: "",
		category: "",
		dueDate: "",
	});
	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		taskId: string | null;
	}>({
		show: false,
		taskId: null,
	});
	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);

	useEffect(() => {
		// Fetch tasks when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchTasks());
		}
	}, [dispatch, initialized]);

	function handleAddTask(e: React.FormEvent) {
		e.preventDefault();
		if (!form.title.trim()) return;

		const newTask: Omit<Task, "id" | "createdAt" | "updatedAt"> = {
			title: form.title,
			description: form.description || undefined,
			priority: form.priority as "low" | "medium" | "high",
			assignedTo: form.assignedTo || undefined,
			category: form.category || undefined,
			dueDate: form.dueDate || undefined,
			isCompleted: false,
		};

		dispatch(addTask(newTask));
		setForm({
			title: "",
			description: "",
			priority: "medium",
			assignedTo: "",
			category: "",
			dueDate: "",
		});
		setShowForm(false);
	}

	function openForm() {
		setShowForm(true);
		setForm({
			title: "",
			description: "",
			priority: "medium",
			assignedTo: "",
			category: "",
			dueDate: "",
		});
	}

	function closeForm() {
		setShowForm(false);
		setForm({
			title: "",
			description: "",
			priority: "medium",
			assignedTo: "",
			category: "",
			dueDate: "",
		});
	}

	function handleToggleTask(taskId: string) {
		dispatch(toggleTaskCompletion(taskId));
	}

	function handleDeleteTask(taskId: string) {
		setDeleteConfirm({ show: true, taskId });
	}

	function confirmDelete() {
		if (deleteConfirm.taskId) {
			dispatch(deleteTask(deleteConfirm.taskId));
			setDeleteConfirm({ show: false, taskId: null });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, taskId: null });
	}

	function sortTasks(tasksToSort: Task[]): Task[] {
		switch (sortBy) {
			case "priority":
				const priorityOrder = { high: 3, medium: 2, low: 1 };
				return [...tasksToSort].sort(
					(a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
				);
			case "dateDue":
				return [...tasksToSort].sort((a, b) => {
					if (!a.dueDate && !b.dueDate) return 0;
					if (!a.dueDate) return 1;
					if (!b.dueDate) return -1;
					return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
				});
			case "assignedTo":
				return [...tasksToSort].sort((a, b) =>
					(a.assignedTo || "").localeCompare(b.assignedTo || "")
				);
			case "category":
				return [...tasksToSort].sort((a, b) =>
					(a.category || "").localeCompare(b.category || "")
				);
			default:
				return tasksToSort;
		}
	}

	if (loading && !initialized) {
		return (
			<div className="min-h-screen christmas-tasks-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading tasks...</p>
				</div>
			</div>
		);
	}

	const sortedTasks = sortTasks(tasks);
	const incompleteTasks = sortedTasks.filter((task: Task) => !task.isCompleted);
	const completedTasks = sortedTasks.filter((task: Task) => task.isCompleted);

	return (
		<div className="min-h-screen christmas-tasks-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/christmas"
						className="absolute left-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xl"
					>
						←
					</Link>
					<h1 className="text-2xl font-bold text-gray-800 dark:text-white">
						To-Do List
					</h1>
					<button
						onClick={() => setShowSortModal(true)}
						className="absolute right-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xl"
						title="Sort tasks"
					>
						<div className="flex flex-col gap-0.5">
							<div className="w-4 h-0.5 bg-current"></div>
							<div className="w-3 h-0.5 bg-current ml-1"></div>
							<div className="w-2 h-0.5 bg-current ml-2"></div>
						</div>
					</button>
				</div>
				{error && (
					<div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-2 rounded mb-4">
						{error}
					</div>
				)}
			</header>
			<main className="w-full max-w-md flex flex-col gap-6">
				<button
					onClick={openForm}
					className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
					style={{ backgroundColor: "#22c55e", color: "white" }}
				>
					Add New Task
				</button>
				<div className="flex items-center justify-center">
					{sortBy !== "none" && (
						<div className="text-center text-sm text-gray-600 dark:text-gray-400">
							{sortBy === "priority" && "Sorted by Priority"}
							{sortBy === "dateDue" && "Sorted by Date Due"}
							{sortBy === "assignedTo" && "Sorted by Assigned To"}
							{sortBy === "category" && "Sorted by Category"}
						</div>
					)}
				</div>

				<div>
					<h2 className="font-semibold text-gray-800 dark:text-white mb-2">
						Incomplete ({incompleteTasks.length})
					</h2>
					<div className="card card-tasks rounded shadow">
						{incompleteTasks.length === 0 ? (
							<div className="px-4 py-3 text-gray-400 dark:text-gray-500 text-center">
								All tasks completed! 🎉
							</div>
						) : (
							<ul className="divide-y divide-gray-200 dark:divide-gray-700">
								{incompleteTasks.map((task: Task) => (
									<li
										key={task.id}
										className="flex items-center px-4 py-3 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20"
										onClick={() => handleToggleTask(task.id)}
									>
										<input
											type="checkbox"
											checked={task.isCompleted}
											readOnly
											className="mr-3 accent-green-500"
										/>
										<div className="flex-1">
											<div className="text-gray-900 dark:text-white">
												{task.title}
											</div>
											{task.description && (
												<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
													{task.description}
												</div>
											)}
											<div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
												<span
													className={`px-2 py-1 rounded ${
														task.priority === "high"
															? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
															: task.priority === "medium"
															? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
															: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
													}`}
												>
													{task.priority}
												</span>
												{task.assignedTo && (
													<span>Assigned: {task.assignedTo}</span>
												)}
												{task.category && <span>{task.category}</span>}
												{task.dueDate && (
													<span>
														Due: {new Date(task.dueDate).toLocaleDateString()}
													</span>
												)}
											</div>
										</div>
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteTask(task.id);
											}}
											className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
											disabled={loading}
										>
											Delete
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>

				<div>
					<h2 className="font-semibold text-gray-400 dark:text-gray-500 mb-2">
						Completed ({completedTasks.length})
					</h2>
					<div className="card card-tasks rounded shadow">
						{completedTasks.length === 0 ? (
							<div className="px-4 py-3 text-gray-300 dark:text-gray-600 text-center">
								No completed tasks yet.
							</div>
						) : (
							<ul className="divide-y divide-gray-200 dark:divide-gray-700">
								{completedTasks.map((task: Task) => (
									<li
										key={task.id}
										className="flex items-center px-4 py-3 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 opacity-60"
										onClick={() => handleToggleTask(task.id)}
									>
										<input
											type="checkbox"
											checked={task.isCompleted}
											readOnly
											className="mr-3 accent-green-500"
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
												<div className="text-xs text-green-600 dark:text-green-400 mt-1">
													Completed:{" "}
													{new Date(task.completedDate).toLocaleDateString()}
												</div>
											)}
										</div>
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteTask(task.id);
											}}
											className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
											disabled={loading}
										>
											Delete
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</main>

			{/* Form Modal */}
			{showForm && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="card card-tasks rounded-lg p-6 max-w-md mx-4 w-full max-h-[90vh] overflow-y-auto">
						<div className="flex justify-between items-center mb-4">
							<h3
								className="text-lg font-semibold text-gray-900 dark:text-white"
								style={{ color: "#111827" }}
							>
								Add New Task
							</h3>
							<button
								onClick={closeForm}
								className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
								style={{ color: "#4b5563" }}
							>
								×
							</button>
						</div>
						<form onSubmit={handleAddTask} className="space-y-4">
							<input
								className="border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
								placeholder="Task Title*"
								value={form.title}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, title: e.target.value }))
								}
								required
								style={{ color: "#111827", backgroundColor: "white" }}
							/>
							<textarea
								className="border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
								placeholder="Description"
								value={form.description}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, description: e.target.value }))
								}
								rows={2}
								style={{ color: "#111827", backgroundColor: "white" }}
							/>
							<div className="flex gap-2">
								<select
									className="flex-1 border rounded px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
									value={form.priority}
									onChange={(e) =>
										setForm((prev) => ({ ...prev, priority: e.target.value }))
									}
									style={{ color: "#111827", backgroundColor: "white" }}
								>
									<option value="low">Low Priority</option>
									<option value="medium">Medium Priority</option>
									<option value="high">High Priority</option>
								</select>
								<input
									className="flex-1 border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
									placeholder="Assigned To"
									value={form.assignedTo}
									onChange={(e) =>
										setForm((prev) => ({ ...prev, assignedTo: e.target.value }))
									}
									style={{ color: "#111827", backgroundColor: "white" }}
								/>
							</div>
							<div className="flex gap-2">
								<input
									className="flex-1 border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
									placeholder="Category"
									value={form.category}
									onChange={(e) =>
										setForm((prev) => ({ ...prev, category: e.target.value }))
									}
									style={{ color: "#111827", backgroundColor: "white" }}
								/>
								<input
									className="flex-1 border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
									placeholder="Due Date"
									type="date"
									value={form.dueDate}
									onChange={(e) =>
										setForm((prev) => ({ ...prev, dueDate: e.target.value }))
									}
									style={{ color: "#111827", backgroundColor: "white" }}
								/>
							</div>
							<div className="flex gap-3 pt-2">
								<button
									type="button"
									onClick={closeForm}
									className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
									style={{ color: "#374151", borderColor: "#d1d5db" }}
								>
									Cancel
								</button>
								<button
									type="submit"
									className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
									disabled={loading}
									style={{ backgroundColor: "#22c55e", color: "white" }}
								>
									{loading ? "Adding..." : "Add Task"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			{deleteConfirm.show && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="card card-tasks rounded-lg p-6 max-w-sm mx-4">
						<h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
							Confirm Delete
						</h3>
						<p className="text-gray-600 dark:text-gray-300 mb-6">
							Are you sure you want to delete this task? This action cannot be
							undone.
						</p>
						<div className="flex gap-3">
							<button
								onClick={cancelDelete}
								className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={confirmDelete}
								className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Sort Modal */}
			<SortModal
				isOpen={showSortModal}
				onClose={() => setShowSortModal(false)}
				sortBy={sortBy}
				onSortChange={(sortOption: string) =>
					setSortBy(sortOption as SortOption)
				}
				sortOptions={[
					{ value: "none", label: "None" },
					{ value: "priority", label: "Priority" },
					{ value: "dateDue", label: "Date Due" },
					{ value: "assignedTo", label: "Assigned To" },
					{ value: "category", label: "Category" },
				]}
				title="Sort Tasks"
			/>
		</div>
	);
}
