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
} from "@/store/slices/hanukkah/hanukkahTasksSlice";
import SortModal from "@/components/modals/SortModal";
import DeleteModal from "@/components/modals/DeleteModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import { EventItems } from "@/components/cards/event";

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

const defaultEventTasks = [
	{
		title: "Hanukkah Party Planning",
		description: "Plan the main Hanukkah celebration",
		category: "Events",
		priority: "high" as const,
	},
	{
		title: "Dreidel Game Setup",
		description: "Prepare dreidel games for guests",
		category: "Events",
		priority: "medium" as const,
	},
	{
		title: "Latke Making",
		description: "Prepare traditional potato latkes",
		category: "Events",
		priority: "high" as const,
	},
	{
		title: "Sufganiyot Preparation",
		description: "Make or order jelly donuts",
		category: "Events",
		priority: "medium" as const,
	},
	{
		title: "Guest List Finalization",
		description: "Confirm all invited guests",
		category: "Events",
		priority: "high" as const,
	},
	{
		title: "Music Playlist",
		description: "Create Hanukkah music playlist",
		category: "Events",
		priority: "low" as const,
	},
];

export default function HanukkahEventsPage() {
	const dispatch = useAppDispatch();
	const { tasks, loading, error, initialized } = useAppSelector(
		(state: any) => state.hanukkahTasks
	);

	const [form, setForm] = useState({
		title: "",
		description: "",
		priority: "medium",
		assignedTo: "",
		category: "Events",
		dueDate: "",
	});
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
	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [showDefaultTasks, setShowDefaultTasks] = useState(false);

	useEffect(() => {
		// Fetch tasks when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchHanukkahTasks());
		}
	}, [dispatch, initialized]);

	// Check if default event tasks exist
	useEffect(() => {
		const eventTasks = tasks.filter(
			(task: HanukkahTask) => task.category === "Events"
		);
		if (eventTasks.length === 0) {
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
			category: "Events",
			dueDate: "",
		});
		setShowForm(false);
	}

	function addDefaultEventTasks() {
		defaultEventTasks.forEach((task) => {
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
			category: "Events",
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
			category: "Events",
			dueDate: "",
		});
	}

	function handleToggleTask(taskId: string) {
		dispatch(toggleHanukkahTaskCompletion(taskId));
	}

	function handleDeleteTask(taskId: string, taskTitle?: string) {
		setDeleteConfirm({ show: true, taskId, taskTitle });
	}

	function confirmDelete() {
		if (deleteConfirm.taskId) {
			dispatch(deleteHanukkahTask(deleteConfirm.taskId));
			setDeleteConfirm({ show: false, taskId: null, taskTitle: "" });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, taskId: null, taskTitle: "" });
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
					<p className="text-gray-600 dark:text-gray-300">Loading events...</p>
				</div>
			</div>
		);
	}

	const eventTasks = tasks.filter(
		(task: HanukkahTask) => task.category === "Events"
	);
	const sortedTasks = sortTasks(eventTasks);
	const incompleteTasks = sortedTasks.filter(
		(task: HanukkahTask) => !task.isCompleted
	);
	const completedTasks = sortedTasks.filter(
		(task: HanukkahTask) => task.isCompleted
	);

	const renderEventItem = (task: HanukkahTask) => (
		<EventItems
			key={task.id}
			task={task}
			onToggleTask={handleToggleTask}
			onDeleteTask={handleDeleteTask}
			loading={loading}
			themeColor="blue"
		/>
	);

	return (
		<div className="min-h-screen hanukkah-tasks-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Hanukkah Events"
				backHref="/hanukkah"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort tasks"
				description="Keep track of Hanukkah events or plans!"
				holidayColor="blue-500"
				error={error}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Default Tasks Prompt */}
				{showDefaultTasks && (
					<div className="card card-tasks rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
						<h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
							🎉 Set Up Hanukkah Events
						</h3>
						<p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
							Would you like to add some common Hanukkah event planning tasks?
						</p>
						<div className="flex gap-2">
							<button
								onClick={addDefaultEventTasks}
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

				<AddButton title="Event Task" onClick={openForm} color="blue" />
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
					emptyMessage="All events planned! 🎉"
					completedMessage=""
					renderItem={renderEventItem}
					cardClassName="card-events-hanukkah"
				/>

				<TaskSection
					title="Completed"
					items={completedTasks}
					isCompleted={true}
					emptyMessage=""
					completedMessage="No completed events yet. Complete some tasks to see them here! 🎉"
					renderItem={renderEventItem}
					cardClassName="card-events-hanukkah"
				/>
			</main>

			{/* Form Modal */}
			{showForm && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="card card-events-hanukkah rounded-lg p-6 max-w-md mx-4 w-full max-h-[90vh] overflow-y-auto">
						<div className="flex justify-between items-center mb-4">
							<h3
								className="text-lg font-semibold text-gray-900 dark:text-white"
								style={{ color: "#111827" }}
							>
								Add New Event Task
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

			{/* Delete Modal */}
			<DeleteModal
				isOpen={deleteConfirm.show}
				title="Confirm Delete"
				message="Are you sure you want to delete this task? This action cannot be undone."
				itemName={deleteConfirm.taskTitle}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={loading}
				cardClassName="card-tasks"
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
