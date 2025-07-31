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

	useEffect(() => {
		// Fetch tasks when component mounts
		dispatch(fetchTasks());
	}, [dispatch]);

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
			<header className="w-full max-w-md py-6 flex flex-col items-center">
				<h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">
					To-Do List
				</h1>
				<Link
					href="/christmas"
					className="text-blue-600 text-sm hover:underline mb-2 dark:text-blue-400"
				>
					← Back
				</Link>
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
				>
					Add New Task
				</button>

				{/* Sort Controls */}
				<div className="card card-tasks rounded shadow p-4">
					<h3 className="font-semibold mb-2 text-gray-800 dark:text-white">
						Sort By
					</h3>
					<div className="flex flex-wrap gap-2">
						<button
							onClick={() => setSortBy("none")}
							className={`px-3 py-1 rounded text-sm ${
								sortBy === "none"
									? "bg-green-500 text-white"
									: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
							}`}
						>
							None
						</button>
						<button
							onClick={() => setSortBy("priority")}
							className={`px-3 py-1 rounded text-sm ${
								sortBy === "priority"
									? "bg-green-500 text-white"
									: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
							}`}
						>
							Priority
						</button>
						<button
							onClick={() => setSortBy("dateDue")}
							className={`px-3 py-1 rounded text-sm ${
								sortBy === "dateDue"
									? "bg-green-500 text-white"
									: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
							}`}
						>
							Date Due
						</button>
						<button
							onClick={() => setSortBy("assignedTo")}
							className={`px-3 py-1 rounded text-sm ${
								sortBy === "assignedTo"
									? "bg-green-500 text-white"
									: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
							}`}
						>
							Assigned To
						</button>
						<button
							onClick={() => setSortBy("category")}
							className={`px-3 py-1 rounded text-sm ${
								sortBy === "category"
									? "bg-green-500 text-white"
									: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
							}`}
						>
							Category
						</button>
					</div>
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
		</div>
	);
}
