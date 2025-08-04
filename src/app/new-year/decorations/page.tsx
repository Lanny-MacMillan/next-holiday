"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchNewYearTasks,
	addNewYearTask,
	updateNewYearTask,
	deleteNewYearTask,
	toggleNewYearTaskCompletion,
	NewYearTask,
} from "@/store/slices/newYearTasksSlice";
import SortModal from "@/components/modals/SortModal";

type SortOption = "priority" | "dueDate" | "title" | "none";

export default function NewYearEventsPage() {
	const dispatch = useAppDispatch();
	const { tasks, loading, error, initialized } = useAppSelector(
		(state: any) => state.newYearTasks
	);

	const [form, setForm] = useState({
		title: "",
		description: "",
		priority: "medium" as "low" | "medium" | "high",
		dueDate: "",
		notes: "",
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
		if (!initialized) {
			dispatch(fetchNewYearTasks());
		}
	}, [dispatch, initialized]);

	// Filter tasks by "Decorations" category
	const decorations = tasks.filter(
		(task: NewYearTask) => task.category === "Decorations"
	);

	function handleAddTask(e: React.FormEvent) {
		e.preventDefault();
		if (!form.title.trim()) return;

		const newTask: Omit<NewYearTask, "id" | "createdAt" | "updatedAt"> = {
			title: form.title,
			description: form.description || undefined,
			isCompleted: false,
			priority: form.priority,
			category: "Decorations",
			dueDate: form.dueDate || undefined,
			notes: form.notes || undefined,
		};

		dispatch(addNewYearTask(newTask));
		setForm({
			title: "",
			description: "",
			priority: "medium",
			dueDate: "",
			notes: "",
		});
		setShowForm(false);
	}

	function openForm() {
		setShowForm(true);
		setForm({
			title: "",
			description: "",
			priority: "medium",
			dueDate: "",
			notes: "",
		});
	}

	function closeForm() {
		setShowForm(false);
		setForm({
			title: "",
			description: "",
			priority: "medium",
			dueDate: "",
			notes: "",
		});
	}

	function handleToggleTask(taskId: string) {
		dispatch(toggleNewYearTaskCompletion(taskId));
	}

	function handleDeleteTask(taskId: string) {
		setDeleteConfirm({ show: true, taskId });
	}

	function confirmDelete() {
		if (deleteConfirm.taskId) {
			dispatch(deleteNewYearTask(deleteConfirm.taskId));
			setDeleteConfirm({ show: false, taskId: null });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, taskId: null });
	}

	function sortTasks(tasksToSort: NewYearTask[]): NewYearTask[] {
		switch (sortBy) {
			case "priority":
				const priorityOrder = { high: 3, medium: 2, low: 1 };
				return [...tasksToSort].sort(
					(a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
				);
			case "dueDate":
				return [...tasksToSort].sort((a, b) => {
					if (!a.dueDate && !b.dueDate) return 0;
					if (!a.dueDate) return 1;
					if (!b.dueDate) return -1;
					return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
				});
			case "title":
				return [...tasksToSort].sort((a, b) => a.title.localeCompare(b.title));
			default:
				return tasksToSort;
		}
	}

	if (loading && !initialized) {
		return (
			<div className="min-h-screen new-year-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading events...</p>
				</div>
			</div>
		);
	}

	const sortedDecorations = sortTasks(decorations);
	const incompleteDecorations = sortedDecorations.filter(
		(task: NewYearTask) => !task.isCompleted
	);
	const completedDecorations = sortedDecorations.filter(
		(task: NewYearTask) => task.isCompleted
	);

	return (
		<div className="min-h-screen new-year-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/new-year"
						className="absolute left-0 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 text-xl"
					>
						←
					</Link>
					<h1 className="text-2xl font-bold text-gray-800 dark:text-white">
						Decorations Checklist
					</h1>
					<button
						onClick={() => setShowSortModal(true)}
						className="absolute right-0 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 text-xl"
						title="Sort decorations"
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
					className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 transition-colors"
				>
					Add New Decoration
				</button>
				<div className="flex items-center justify-center">
					{sortBy !== "none" && (
						<div className="text-center text-sm text-gray-600 dark:text-gray-400">
							{sortBy === "priority" && "Sorted by Priority"}
							{sortBy === "dueDate" && "Sorted by Due Date"}
							{sortBy === "title" && "Sorted by Title"}
						</div>
					)}
				</div>

				<div>
					<h2 className="font-semibold text-gray-900 dark:text-white mb-2">
						Incomplete ({incompleteDecorations.length})
					</h2>
					<div className="card card-tasks rounded shadow">
						{incompleteDecorations.length === 0 ? (
							<div className="px-4 py-3 text-gray-400 dark:text-gray-500 text-center">
								All decorations completed! 🎉
							</div>
						) : (
							<ul className="divide-y divide-gray-200 dark:divide-gray-700">
								{incompleteDecorations.map((task: NewYearTask) => (
									<li
										key={task.id}
										className="flex items-center px-4 py-3 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20"
										onClick={() => handleToggleTask(task.id)}
									>
										<input
											type="checkbox"
											checked={task.isCompleted}
											readOnly
											className="mr-3 accent-amber-500"
										/>
										<div className="flex-1">
											<div className="text-gray-900 dark:text-white">
												{task.title}
											</div>
											{task.description && (
												<div className="text-sm text-gray-600 dark:text-gray-300">
													{task.description}
												</div>
											)}
											<div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
												<span
													className={`px-2 py-1 rounded ${
														task.priority === "high"
															? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
															: task.priority === "medium"
															? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
															: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
													}`}
												>
													{task.priority}
												</span>
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
											className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2"
											title="Delete event"
										>
											×
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>

				{completedDecorations.length > 0 && (
					<div>
						<h2 className="font-semibold text-gray-900 dark:text-white mb-2">
							Completed ({completedDecorations.length})
						</h2>
						<div className="card card-tasks rounded shadow">
							<ul className="divide-y divide-gray-200 dark:divide-gray-700">
								{completedDecorations.map((task: NewYearTask) => (
									<li
										key={task.id}
										className="flex items-center px-4 py-3 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20"
										onClick={() => handleToggleTask(task.id)}
									>
										<input
											type="checkbox"
											checked={task.isCompleted}
											readOnly
											className="mr-3 accent-amber-500"
										/>
										<div className="flex-1">
											<div className="text-gray-900 dark:text-white line-through">
												{task.title}
											</div>
											{task.description && (
												<div className="text-sm text-gray-600 dark:text-gray-300 line-through">
													{task.description}
												</div>
											)}
											<div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
												<span
													className={`px-2 py-1 rounded ${
														task.priority === "high"
															? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
															: task.priority === "medium"
															? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
															: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
													}`}
												>
													{task.priority}
												</span>
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
											className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2"
											title="Delete event"
										>
											×
										</button>
									</li>
								))}
							</ul>
						</div>
					</div>
				)}

				{/* Form Modal */}
				{showForm && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
						<div className="card card-tasks rounded-lg p-6 max-w-md mx-4 w-full max-h-[90vh] overflow-y-auto">
							<div className="flex justify-between items-center mb-4">
								<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
									Add New Decoration
								</h3>
								<button
									onClick={closeForm}
									className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
								>
									×
								</button>
							</div>
							<form onSubmit={handleAddTask} className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Decoration Title *
									</label>
									<input
										type="text"
										value={form.title}
										onChange={(e) =>
											setForm({ ...form, title: e.target.value })
										}
										className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
										required
										style={{ color: "#111827", backgroundColor: "white" }}
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Description
									</label>
									<textarea
										value={form.description}
										onChange={(e) =>
											setForm({ ...form, description: e.target.value })
										}
										className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
										rows={3}
										style={{ color: "#111827", backgroundColor: "white" }}
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
											Priority
										</label>
										<select
											value={form.priority}
											onChange={(e) =>
												setForm({
													...form,
													priority: e.target.value as "low" | "medium" | "high",
												})
											}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
											style={{ color: "#111827", backgroundColor: "white" }}
										>
											<option value="low">Low</option>
											<option value="medium">Medium</option>
											<option value="high">High</option>
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
											Due Date
										</label>
										<input
											type="date"
											value={form.dueDate}
											onChange={(e) =>
												setForm({ ...form, dueDate: e.target.value })
											}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
											style={{ color: "#111827", backgroundColor: "white" }}
										/>
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Notes
									</label>
									<textarea
										value={form.notes}
										onChange={(e) =>
											setForm({ ...form, notes: e.target.value })
										}
										className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
										rows={2}
										style={{ color: "#111827", backgroundColor: "white" }}
									/>
								</div>
								<div className="flex gap-2">
									<button
										type="submit"
										className="flex-1 bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 transition-colors"
									>
										Add Decoration
									</button>
									<button
										type="button"
										onClick={closeForm}
										className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
									>
										Cancel
									</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{/* Delete Confirmation Modal */}
				{deleteConfirm.show && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
						<div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
								Delete Decoration
							</h3>
							<p className="text-gray-600 dark:text-gray-400 mb-6">
								Are you sure you want to delete this decoration? This action
								cannot be undone.
							</p>
							<div className="flex gap-2">
								<button
									onClick={confirmDelete}
									className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
								>
									Delete
								</button>
								<button
									onClick={cancelDelete}
									className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
								>
									Cancel
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
						{ value: "none", label: "No Sorting" },
						{ value: "priority", label: "Sort by Priority" },
						{ value: "dueDate", label: "Sort by Due Date" },
						{ value: "title", label: "Sort by Title" },
					]}
					title="Sort Decorations"
				/>
			</main>

			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
