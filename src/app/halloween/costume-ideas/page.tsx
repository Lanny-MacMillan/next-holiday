"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchHalloweenTasks,
	addHalloweenTask,
	updateHalloweenTask,
	deleteHalloweenTask,
	toggleHalloweenTaskCompletion,
	HalloweenTask,
} from "@/store/slices/halloweenTasksSlice";
import SortModal from "@/components/SortModal";

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

const defaultCostumeTasks = [
	{
		title: "Plan Family Costumes",
		description: "Coordinate costumes for the whole family",
		category: "Costume Ideas",
		priority: "high" as const,
	},
	{
		title: "Buy Costume for Kids",
		description: "Purchase or make costumes for children",
		category: "Costume Ideas",
		priority: "high" as const,
	},
	{
		title: "DIY Costume Ideas",
		description: "Research homemade costume options",
		category: "Costume Ideas",
		priority: "medium" as const,
	},
	{
		title: "Costume Accessories",
		description: "Get props and accessories for costumes",
		category: "Costume Ideas",
		priority: "medium" as const,
	},
];

export default function HalloweenCostumeIdeasPage() {
	const dispatch = useAppDispatch();
	const { tasks, loading, error, initialized } = useAppSelector(
		(state: any) => state.halloweenTasks
	);

	const [form, setForm] = useState({
		title: "",
		description: "",
		priority: "medium",
		assignedTo: "",
		category: "Costume Ideas",
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
	const [showDefaultTasks, setShowDefaultTasks] = useState(false);

	useEffect(() => {
		if (!initialized) {
			dispatch(fetchHalloweenTasks());
		}
	}, [dispatch, initialized]);

	useEffect(() => {
		const costumeTasks = tasks.filter(
			(task: HalloweenTask) => task.category === "Costume Ideas"
		);
		if (costumeTasks.length === 0) {
			setShowDefaultTasks(true);
		}
	}, [tasks]);

	function handleAddTask(e: React.FormEvent) {
		e.preventDefault();
		if (form.title.trim()) {
			dispatch(addHalloweenTask(form));
			setForm({
				title: "",
				description: "",
				priority: "medium",
				assignedTo: "",
				category: "Costume Ideas",
				dueDate: "",
			});
			setShowForm(false);
		}
	}

	function addDefaultCostumeTasks() {
		defaultCostumeTasks.forEach((task) => {
			dispatch(addHalloweenTask(task));
		});
		setShowDefaultTasks(false);
	}

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
		setForm({
			title: "",
			description: "",
			priority: "medium",
			assignedTo: "",
			category: "Costume Ideas",
			dueDate: "",
		});
	}

	function handleToggleTask(taskId: string) {
		dispatch(toggleHalloweenTaskCompletion(taskId));
	}

	function handleDeleteTask(taskId: string) {
		setDeleteConfirm({ show: true, taskId });
	}

	function confirmDelete() {
		if (deleteConfirm.taskId) {
			dispatch(deleteHalloweenTask(deleteConfirm.taskId));
			setDeleteConfirm({ show: false, taskId: null });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, taskId: null });
	}

	function sortTasks(tasksToSort: HalloweenTask[]): HalloweenTask[] {
		switch (sortBy) {
			case "priority":
				return [...tasksToSort].sort((a, b) => {
					const priorityOrder = { high: 3, medium: 2, low: 1 };
					return priorityOrder[b.priority] - priorityOrder[a.priority];
				});
			case "dateDue":
				return [...tasksToSort].sort((a, b) => {
					if (!a.dueDate && !b.dueDate) return 0;
					if (!a.dueDate) return 1;
					if (!b.dueDate) return -1;
					return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
				});
			case "assignedTo":
				return [...tasksToSort].sort((a, b) => {
					if (!a.assignedTo && !b.assignedTo) return 0;
					if (!a.assignedTo) return 1;
					if (!b.assignedTo) return -1;
					return a.assignedTo.localeCompare(b.assignedTo);
				});
			case "category":
				return [...tasksToSort].sort((a, b) => {
					if (!a.category && !b.category) return 0;
					if (!a.category) return 1;
					if (!b.category) return -1;
					return a.category.localeCompare(b.category);
				});
			default:
				return tasksToSort;
		}
	}

	const costumeTasks = tasks.filter(
		(task: HalloweenTask) => task.category === "Costume Ideas"
	);
	const sortedTasks = sortTasks(costumeTasks);

	return (
		<div className="min-h-screen halloween-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-2xl py-6 flex flex-col items-center relative">
				<Link
					href="/halloween"
					className="absolute left-0 top-10 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
				>
					<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
					</svg>
				</Link>
				<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
					👻 Costume Ideas
				</h1>
				<p className="text-center text-gray-600 dark:text-gray-400">
					Plan and organize your Halloween costume ideas!
				</p>
			</header>

			<main className="w-full max-w-2xl flex flex-col gap-6">
				{/* Default Tasks Modal */}
				{showDefaultTasks && (
					<div className="card rounded-lg p-6 mb-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700">
						<h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
							🎃 Welcome to Costume Planning!
						</h3>
						<p className="text-gray-600 dark:text-gray-400 mb-4">
							Let's get you started with some essential costume planning tasks.
						</p>
						<button
							onClick={addDefaultCostumeTasks}
							className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
						>
							Add Default Tasks
						</button>
					</div>
				)}

				{/* Add Task Button */}
				<div className="flex justify-between items-center">
					<h2 className="text-xl font-semibold text-gray-800 dark:text-white">
						Costume Planning
					</h2>
					<div className="flex gap-2">
						<button
							onClick={() => setShowSortModal(true)}
							className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
						>
							Sort
						</button>
						<button
							onClick={openForm}
							className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
						>
							Add Task
						</button>
					</div>
				</div>

				{/* Task Form */}
				{showForm && (
					<div className="card rounded-lg p-6">
						<h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
							Add New Task
						</h3>
						<form onSubmit={handleAddTask} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									Title *
								</label>
								<input
									type="text"
									value={form.title}
									onChange={(e) => setForm({ ...form, title: e.target.value })}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									Description
								</label>
								<textarea
									value={form.description}
									onChange={(e) => setForm({ ...form, description: e.target.value })}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
									rows={3}
								/>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Priority
									</label>
									<select
										value={form.priority}
										onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
										className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
										onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
										className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
									/>
								</div>
							</div>
							<div className="flex gap-2">
								<button
									type="submit"
									className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
								>
									Add Task
								</button>
								<button
									type="button"
									onClick={closeForm}
									className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors hover:bg-gray-400 dark:hover:bg-gray-500"
								>
									Cancel
								</button>
							</div>
						</form>
					</div>
				)}

				{/* Tasks List */}
				<div className="space-y-3">
					{sortedTasks.map((task) => (
						<div
							key={task.id}
							className={`card rounded-lg p-4 transition-all ${
								task.isCompleted ? "opacity-60" : ""
							}`}
						>
							<div className="flex items-start gap-3">
								<button
									onClick={() => handleToggleTask(task.id)}
									className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-colors ${
										task.isCompleted
											? "bg-orange-500 border-orange-500"
											: "border-gray-300 dark:border-gray-600"
									}`}
								>
									{task.isCompleted && (
										<svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
										</svg>
									)}
								</button>
								<div className="flex-1 min-w-0">
									<div className="flex items-start justify-between">
										<div className="flex-1 min-w-0">
											<h3
												className={`font-medium text-gray-800 dark:text-white ${
													task.isCompleted ? "line-through" : ""
												}`}
											>
												{task.title}
											</h3>
											{task.description && (
												<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
													{task.description}
												</p>
											)}
											<div className="flex items-center gap-2 mt-2">
												<span
													className={`text-xs px-2 py-1 rounded-full ${
														task.priority === "high"
															? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
															: task.priority === "medium"
															? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
															: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
													}`}
												>
													{task.priority}
												</span>
												{task.dueDate && (
													<span className="text-xs text-gray-500 dark:text-gray-400">
														Due: {new Date(task.dueDate).toLocaleDateString()}
													</span>
												)}
											</div>
										</div>
										<button
											onClick={() => handleDeleteTask(task.id)}
											className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors ml-2"
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
								</div>
							</div>
						</div>
					))}
					{sortedTasks.length === 0 && (
						<div className="text-center py-8 text-gray-500 dark:text-gray-400">
							No costume ideas yet. Add your first costume task!
						</div>
					)}
				</div>
			</main>

			{/* Sort Modal */}
			<SortModal
				isOpen={showSortModal}
				onClose={() => setShowSortModal(false)}
				sortBy={sortBy}
				onSortChange={setSortBy}
			/>

			{/* Delete Confirmation Modal */}
			{deleteConfirm.show && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
						<h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
							Delete Task
						</h3>
						<p className="text-gray-600 dark:text-gray-400 mb-6">
							Are you sure you want to delete this task? This action cannot be undone.
						</p>
						<div className="flex gap-2">
							<button
								onClick={confirmDelete}
								className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
							>
								Delete
							</button>
							<button
								onClick={cancelDelete}
								className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors hover:bg-gray-400 dark:hover:bg-gray-500"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
