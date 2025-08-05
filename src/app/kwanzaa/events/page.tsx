"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchKwanzaaTasks,
	addKwanzaaTask,
	updateKwanzaaTask,
	deleteKwanzaaTask,
	toggleKwanzaaTaskCompletion,
	KwanzaaTask,
} from "@/store/slices/kwanzaaTasksSlice";
import SortModal from "@/components/modals/SortModal";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import TaskSection from "@/components/common/TaskSection";
import AddButton from "@/components/common/AddButton";
import { getFormConfig } from "@/config/formConfigs";

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

const defaultEventTasks = [
	{
		title: "Kwanzaa Karamu Feast Planning",
		description: "Plan the traditional Kwanzaa feast celebration",
		category: "Events",
		priority: "high" as const,
	},
	{
		title: "Kinara Lighting Ceremony Setup",
		description: "Prepare for daily kinara candle lighting ceremonies",
		category: "Events",
		priority: "high" as const,
	},
	{
		title: "Zawadi Gift Exchange Planning",
		description: "Organize handmade gift exchange activities",
		category: "Events",
		priority: "medium" as const,
	},
	{
		title: "African Drum and Dance Workshop",
		description: "Plan traditional music and dance activities",
		category: "Events",
		priority: "medium" as const,
	},
	{
		title: "Storytelling and Poetry Reading",
		description: "Prepare for Kuumba (Creativity) day activities",
		category: "Events",
		priority: "medium" as const,
	},
	{
		title: "Community Service Planning",
		description: "Organize Ujima (Collective Work) activities",
		category: "Events",
		priority: "high" as const,
	},
	{
		title: "Family Heritage Workshop",
		description: "Plan genealogy and heritage activities",
		category: "Events",
		priority: "medium" as const,
	},
	{
		title: "Unity Cup Ceremony Preparation",
		description: "Set up Kikombe cha Umoja ceremony space",
		category: "Events",
		priority: "high" as const,
	},
	{
		title: "African Art & Craft Workshop",
		description: "Prepare materials for traditional crafts",
		category: "Events",
		priority: "low" as const,
	},
	{
		title: "Vision Board Workshop",
		description: "Plan Nia (Purpose) day goal-setting activities",
		category: "Events",
		priority: "low" as const,
	},
];

export default function KwanzaaEventsPage() {
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
	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [showDefaultTasks, setShowDefaultTasks] = useState(false);

	useEffect(() => {
		// Fetch tasks when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchKwanzaaTasks());
		}
	}, [dispatch, initialized]);

	// Check if default event tasks exist
	useEffect(() => {
		const eventTasks = tasks.filter(
			(task: KwanzaaTask) => task.category === "Events"
		);
		if (eventTasks.length === 0) {
			setShowDefaultTasks(true);
		}
	}, [tasks]);

	function handleAddTask(values: Record<string, any>) {
		const newTask: Omit<KwanzaaTask, "id" | "createdAt" | "updatedAt"> = {
			title: values.title,
			description: values.description || undefined,
			priority: values.priority as "low" | "medium" | "high",
			assignedTo: values.assignedTo || undefined,
			category: values.category || "Events",
			dueDate: values.dueDate || undefined,
			isCompleted: false,
		};

		dispatch(addKwanzaaTask(newTask));
		setShowForm(false);
	}

	function addDefaultEventTasks() {
		defaultEventTasks.forEach((task) => {
			const newTask: Omit<KwanzaaTask, "id" | "createdAt" | "updatedAt"> = {
				title: task.title,
				description: task.description,
				priority: task.priority,
				assignedTo: undefined,
				category: task.category,
				dueDate: undefined,
				isCompleted: false,
			};
			dispatch(addKwanzaaTask(newTask));
		});
		setShowDefaultTasks(false);
	}

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
					<p className="text-gray-600 dark:text-gray-300">Loading events...</p>
				</div>
			</div>
		);
	}

	const eventTasks = tasks.filter(
		(task: KwanzaaTask) => task.category === "Events"
	);
	const sortedTasks = sortTasks(eventTasks);
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
			<HolidayPageHeader
				title="Kwanzaa Events"
				backHref="/kwanzaa"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort tasks"
				error={error}
			/>

			<main className="w-full max-w-md flex flex-col gap-6">
				{/* Default Tasks Prompt */}
				{showDefaultTasks && (
					<div className="card card-tasks rounded-lg p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
						<h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
							🎉 Set Up Kwanzaa Events
						</h3>
						<p className="text-red-700 dark:text-red-300 text-sm mb-3">
							Would you like to add some common Kwanzaa event planning tasks?
						</p>
						<div className="flex gap-2">
							<button
								onClick={addDefaultEventTasks}
								className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors text-sm"
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

				<AddButton
					title="Event Task"
					onClick={() => setShowForm(true)}
					color="red"
					disabled={loading}
				/>

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
					renderItem={renderTaskItem}
					cardClassName="card-events-kwanzaa"
				/>

				<TaskSection
					title="Completed"
					items={completedTasks}
					isCompleted={true}
					emptyMessage=""
					completedMessage="No completed tasks yet."
					renderItem={renderTaskItem}
					cardClassName="card-events-kwanzaa"
				/>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showForm}
				title="Add New Event Task"
				fields={getFormConfig("events", "add").fields}
				onSubmit={handleAddTask}
				onClose={() => setShowForm(false)}
				loading={loading}
				submitText="Add Event Task"
				cancelText="Cancel"
				cardClassName="card card-events-kwanzaa"
				submitButtonColor="#dc2626"
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={deleteConfirm.show}
				title="Confirm Delete"
				message="Are you sure you want to delete this task? This action cannot be undone."
				itemName={deleteConfirm.taskTitle}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={loading}
				cardClassName="card card-events-kwanzaa"
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
