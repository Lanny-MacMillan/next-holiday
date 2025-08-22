"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchHanukkahTasks,
	addHanukkahTask,
	updateHanukkahTask,
	deleteHanukkahTask,
	toggleHanukkahTaskCompletion,
	HanukkahTask,
} from "@/store/slices/hanukkahTasksSlice";
import SortModal from "@/components/modals/SortModal";

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

export default function CandleLightingPage() {
	const dispatch = useAppDispatch();
	const { tasks, loading, error, initialized } = useAppSelector(
		(state: any) => state.hanukkahTasks
	);

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		taskId: string | null;
	}>({
		show: false,
		taskId: null,
	});
	const [showSortModal, setShowSortModal] = useState(false);

	useEffect(() => {
		// Fetch tasks when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchHanukkahTasks());
		}
	}, [dispatch, initialized]);

	function handleToggleTask(taskId: string) {
		dispatch(toggleHanukkahTaskCompletion(taskId));
	}

	function handleDeleteTask(taskId: string) {
		setDeleteConfirm({ show: true, taskId });
	}

	function confirmDelete() {
		if (deleteConfirm.taskId) {
			dispatch(deleteHanukkahTask(deleteConfirm.taskId));
			setDeleteConfirm({ show: false, taskId: null });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, taskId: null });
	}

	function sortTasks(tasksToSort: HanukkahTask[]): HanukkahTask[] {
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
			<div className="min-h-screen hanukkah-tasks-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading candle lighting tasks...
					</p>
				</div>
			</div>
		);
	}

	const candleTasks = tasks.filter(
		(task: HanukkahTask) => task.category === "Candle Lighting"
	);
	const sortedTasks = sortTasks(candleTasks);
	const incompleteTasks = sortedTasks.filter(
		(task: HanukkahTask) => !task.isCompleted
	);
	const completedTasks = sortedTasks.filter(
		(task: HanukkahTask) => task.isCompleted
	);

	return (
		<div className="min-h-screen hanukkah-tasks-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/hanukkah"
						className="absolute left-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xl"
					>
						←
					</Link>
					<h1 className="text-2xl font-bold text-gray-800 dark:text-white">
						Candle Lighting Tracker
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
								All candles lit! 🕯️✨
							</div>
						) : (
							<ul className="divide-y divide-gray-200 dark:divide-gray-700">
								{incompleteTasks.map((task: HanukkahTask) => (
									<li
										key={task.id}
										className="flex items-center px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
										onClick={() => handleToggleTask(task.id)}
									>
										<input
											type="checkbox"
											checked={task.isCompleted}
											readOnly
											className="mr-3 accent-blue-500"
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
								{completedTasks.map((task: HanukkahTask) => (
									<li
										key={task.id}
										className="flex items-center px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 opacity-60"
										onClick={() => handleToggleTask(task.id)}
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
