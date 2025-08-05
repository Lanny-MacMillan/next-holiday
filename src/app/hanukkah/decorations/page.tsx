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
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

const defaultDecorationTasks = [
	{
		title: "Set up Menorah",
		description: "Place the menorah in a prominent location",
		category: "Decorations",
		priority: "high" as const,
	},
	{
		title: "Hang Hanukkah banners",
		description: "Display Hanukkah-themed banners and signs",
		category: "Decorations",
		priority: "medium" as const,
	},
	{
		title: "String blue and white lights",
		description: "Decorate with traditional Hanukkah colors",
		category: "Decorations",
		priority: "medium" as const,
	},
	{
		title: "Display dreidels",
		description: "Place decorative dreidels around the home",
		category: "Decorations",
		priority: "low" as const,
	},
	{
		title: "Set up Hanukkah table",
		description: "Prepare the dining table with Hanukkah decorations",
		category: "Decorations",
		priority: "high" as const,
	},
	{
		title: "Hang Star of David decorations",
		description: "Display Star of David ornaments and symbols",
		category: "Decorations",
		priority: "medium" as const,
	},
	{
		title: "Arrange Hanukkah candles",
		description: "Organize and display Hanukkah candles",
		category: "Decorations",
		priority: "high" as const,
	},
	{
		title: "Set up Hanukkah centerpiece",
		description: "Create a festive centerpiece for the table",
		category: "Decorations",
		priority: "low" as const,
	},
];

export default function HanukkahDecorationsPage() {
	const dispatch = useAppDispatch();
	const { tasks, loading, error, initialized } = useAppSelector(
		(state: any) => state.hanukkahTasks
	);

	const [form, setForm] = useState({
		title: "",
		description: "",
		priority: "medium",
		assignedTo: "",
		category: "Decorations",
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
		// Fetch tasks when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchHanukkahTasks());
		}
	}, [dispatch, initialized]);

	// Check if default decoration tasks exist
	useEffect(() => {
		const decorationTasks = tasks.filter(
			(task: HanukkahTask) => task.category === "Decorations"
		);
		if (decorationTasks.length === 0) {
			setShowDefaultTasks(true);
		}
	}, [tasks]);

	function handleAddTask(e: React.FormEvent) {
		e.preventDefault();
		if (!form.title.trim()) return;

		const newTask: Omit<HanukkahTask, "id" | "createdAt" | "updatedAt"> = {
			title: form.title,
			description: form.description || undefined,
			priority: form.priority as "low" | "medium" | "high",
			assignedTo: form.assignedTo || undefined,
			category: form.category || undefined,
			dueDate: form.dueDate || undefined,
			isCompleted: false,
		};

		dispatch(addHanukkahTask(newTask));
		setForm({
			title: "",
			description: "",
			priority: "medium",
			assignedTo: "",
			category: "Decorations",
			dueDate: "",
		});
		setShowForm(false);
	}

	function addDefaultDecorationTasks() {
		defaultDecorationTasks.forEach((task) => {
			const newTask: Omit<HanukkahTask, "id" | "createdAt" | "updatedAt"> = {
				title: task.title,
				description: task.description,
				priority: task.priority,
				assignedTo: undefined,
				category: task.category,
				dueDate: undefined,
				isCompleted: false,
			};
			dispatch(addHanukkahTask(newTask));
		});
		setShowDefaultTasks(false);
	}

	function openForm() {
		setShowForm(true);
		setForm({
			title: "",
			description: "",
			priority: "medium",
			assignedTo: "",
			category: "Decorations",
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
			category: "Decorations",
			dueDate: "",
		});
	}

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
						Loading decorations...
					</p>
				</div>
			</div>
		);
	}

	const decorationTasks = tasks.filter(
		(task: HanukkahTask) => task.category === "Decorations"
	);
	const sortedTasks = sortTasks(decorationTasks);
	const incompleteTasks = sortedTasks.filter(
		(task: HanukkahTask) => !task.isCompleted
	);
	const completedTasks = sortedTasks.filter(
		(task: HanukkahTask) => task.isCompleted
	);

	const renderTaskItem = (task: HanukkahTask) => (
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
				<div className="text-gray-900 dark:text-white">{task.title}</div>
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
					{task.assignedTo && <span>Assigned: {task.assignedTo}</span>}
					{task.category && <span>{task.category}</span>}
					{task.dueDate && (
						<span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
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
	);

	const renderCompletedTaskItem = (task: HanukkahTask) => (
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
						Completed: {new Date(task.completedDate).toLocaleDateString()}
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
	);

	return (
		<div className="min-h-screen hanukkah-tasks-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Decorations Checklist"
				backHref="/hanukkah"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort tasks"
				error={error}
			/>
			<main className="w-full max-w-md flex flex-col gap-6">
				{/* Default Tasks Prompt */}
				{showDefaultTasks && (
					<div className="card card-tasks rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
						<h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
							✨ Set Up Hanukkah Decorations
						</h3>
						<p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
							Would you like to add common Hanukkah decoration tasks?
						</p>
						<div className="flex gap-2">
							<button
								onClick={addDefaultDecorationTasks}
								className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
							>
								Add Default Tasks
							</button>
							<button
								onClick={() => setShowDefaultTasks(false)}
								className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors text-sm"
							>
								Skip
							</button>
						</div>
					</div>
				)}

				<AddButton title="Decoration Task" onClick={openForm} color="blue" />
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
					emptyMessage="All decorations complete! ✨"
					completedMessage=""
					renderItem={renderTaskItem}
					cardClassName="card-tasks"
				/>

				<TaskSection
					title="Completed"
					items={completedTasks}
					isCompleted={true}
					emptyMessage="No completed tasks yet."
					completedMessage=""
					renderItem={renderCompletedTaskItem}
					cardClassName="card-tasks"
				/>
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
								Add New Decoration Task
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
									className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
									disabled={loading}
									style={{ backgroundColor: "#3b82f6", color: "white" }}
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
