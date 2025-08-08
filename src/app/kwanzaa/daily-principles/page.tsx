"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchKwanzaaTasks,
	addKwanzaaTask,
	updateKwanzaaTask,
	deleteKwanzaaTask,
	toggleKwanzaaTaskCompletion,
	KwanzaaTask,
} from "@/store/slices/kwanzaa/kwanzaaTasksSlice";
import SortModal from "@/components/modals/SortModal";
import DeleteModal from "@/components/modals/DeleteModal";
import TaskSection from "@/components/common/TaskSection";

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

export default function DailyPrinciplesPage() {
	const dispatch = useAppDispatch();
	const { tasks, loading, error, initialized } = useAppSelector(
		(state: any) => state.kwanzaaTasks
	);

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		taskId: string | null;
		taskTitle?: string;
	}>({
		show: false,
		taskId: null,
		taskTitle: "",
	});
	const [showSortModal, setShowSortModal] = useState(false);

	useEffect(() => {
		// Fetch tasks when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchKwanzaaTasks());
		}
	}, [dispatch, initialized]);

	function handleToggleTask(taskId: string) {
		dispatch(toggleKwanzaaTaskCompletion(taskId));
	}

	function handleDeleteTask(taskId: string, taskTitle?: string) {
		setDeleteConfirm({ show: true, taskId, taskTitle });
	}

	function confirmDelete() {
		if (deleteConfirm.taskId) {
			dispatch(deleteKwanzaaTask(deleteConfirm.taskId));
			setDeleteConfirm({ show: false, taskId: null, taskTitle: "" });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, taskId: null, taskTitle: "" });
	}

	function sortTasks(tasksToSort: KwanzaaTask[]): KwanzaaTask[] {
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
			<div className="min-h-screen kwanzaa-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading daily principles...
					</p>
				</div>
			</div>
		);
	}

	const principleTasks = tasks.filter(
		(task: KwanzaaTask) => task.category === "Daily Principles"
	);
	const sortedTasks = sortTasks(principleTasks);
	const incompleteTasks = sortedTasks.filter(
		(task: KwanzaaTask) => !task.isCompleted
	);
	const completedTasks = sortedTasks.filter(
		(task: KwanzaaTask) => task.isCompleted
	);

	const renderTaskItem = (task: KwanzaaTask) => (
		<li
			key={task.id}
			className="flex items-center px-4 py-3 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20"
			onClick={() => handleToggleTask(task.id)}
		>
			<input
				type="checkbox"
				checked={task.isCompleted}
				readOnly
				className="mr-3 accent-red-500"
			/>
			<div className="flex-1">
				<div
					className={`text-gray-900 dark:text-white ${
						task.isCompleted ? "line-through" : ""
					}`}
				>
					{task.title}
				</div>
				{task.description && (
					<div
						className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
							task.isCompleted ? "line-through" : ""
						}`}
					>
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
					{task.assignedTo && <span>Assigned: {task.assignedTo}</span>}
					{task.category && <span>{task.category}</span>}
					{task.dueDate && (
						<span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
					)}
				</div>
				{task.isCompleted && task.completedDate && (
					<div className="text-xs text-red-600 dark:text-red-400 mt-1">
						Completed: {new Date(task.completedDate).toLocaleDateString()}
					</div>
				)}
			</div>
			<button
				onClick={(e) => {
					e.stopPropagation();
					handleDeleteTask(task.id, task.title);
				}}
				className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
				disabled={loading}
			>
				Delete
			</button>
		</li>
	);

	return (
		<div className="min-h-screen kwanzaa-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/kwanzaa"
						className="absolute left-0 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xl"
					>
						←
					</Link>
					<h1 className="text-2xl font-bold text-gray-800 dark:text-white">
						Daily Principle Tracker
					</h1>
					<button
						onClick={() => setShowSortModal(true)}
						className="absolute right-0 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xl"
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
			<main className="w-full max-w-4xl flex flex-col gap-6">
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

				<TaskSection
					title="Incomplete"
					items={incompleteTasks}
					isCompleted={false}
					emptyMessage="All candles lit! 🕯️✨"
					completedMessage=""
					renderItem={renderTaskItem}
					cardClassName="card-tasks"
					borderColor="rgb(var(--color-red-500))"
				/>

				<TaskSection
					title="Completed"
					items={completedTasks}
					isCompleted={true}
					emptyMessage=""
					completedMessage="No completed tasks yet."
					renderItem={renderTaskItem}
					cardClassName="card-tasks"
					borderColor="rgb(var(--color-red-500))"
				/>
			</main>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={deleteConfirm.show}
				title="Confirm Delete"
				message="Are you sure you want to delete this task? This action cannot be undone."
				itemName={deleteConfirm.taskTitle}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={loading}
				cardClassName="card card-tasks"
				confirmText="Delete"
				cancelText="Cancel"
				confirmButtonColor="#ef4444"
			/>

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
