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
} from "@/store/slices/kwanzaa/kwanzaaTasksSlice";
import SortModal from "@/components/modals/SortModal";
import ToDoCard from "@/components/cards/to-do/ToDoCard";
import EditTaskModal from "@/components/modals/EditTaskModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

const defaultDecorationTasks = [
	{
		title: "Kinara Candle Lighting Ceremony",
		description: "Set up the kinara and prepare for daily candle lighting",
		category: "Decorations",
		priority: "high" as const,
	},
	{
		title: "Mkeka Mat Decoration",
		description: "Place and decorate the mkeka (straw mat) as the foundation",
		category: "Decorations",
		priority: "high" as const,
	},
	{
		title: "Karamu Feast Planning & Recipes",
		description: "Plan the traditional Kwanzaa feast and gather recipes",
		category: "Decorations",
		priority: "medium" as const,
	},
	{
		title: "Zawadi Gift Exchange",
		description: "Prepare handmade gifts for the zawadi exchange",
		category: "Decorations",
		priority: "medium" as const,
	},
	{
		title: "Storytelling and Poetry Reading (Kuumba - Creativity Day)",
		description: "Set up space for creative expression and storytelling",
		category: "Decorations",
		priority: "low" as const,
	},
	{
		title: "African Drum and Dance Workshop",
		description:
			"Prepare space and instruments for traditional music and dance",
		category: "Decorations",
		priority: "medium" as const,
	},
	{
		title: "African Art & Craft Making",
		description: "Set up materials and space for traditional African crafts",
		category: "Decorations",
		priority: "low" as const,
	},
	{
		title: "Family Heritage Reflection and Genealogy",
		description: "Create a space for family history and heritage display",
		category: "Decorations",
		priority: "medium" as const,
	},
	{
		title: "Unity Cup (Kikombe cha Umoja) Ceremony",
		description: "Prepare the unity cup and ceremonial space",
		category: "Decorations",
		priority: "high" as const,
	},
	{
		title:
			"Community Service and Volunteer Day (Ujima - Collective Work and Responsibility)",
		description: "Plan community service activities and outreach",
		category: "Decorations",
		priority: "medium" as const,
	},
	{
		title: "Vision Board or Goal-Setting Workshop (Nia - Purpose Day)",
		description: "Set up space for vision boards and goal-setting activities",
		category: "Decorations",
		priority: "low" as const,
	},
];

export default function KwanzaaDecorationsPage() {
	const dispatch = useAppDispatch();
	const { tasks, loading, error, initialized } = useAppSelector(
		(state: any) => state.kwanzaaTasks
	);

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [editingTask, setEditingTask] = useState<KwanzaaTask | null>(null);
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		taskId: string | null;
	}>({
		show: false,
		taskId: null,
	});
	const [showDefaultTasks, setShowDefaultTasks] = useState(false);

	useEffect(() => {
		// Fetch tasks when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchKwanzaaTasks());
		}
	}, [dispatch, initialized]);

	// Check if default decoration tasks exist
	useEffect(() => {
		const decorationTasks = tasks.filter(
			(task: KwanzaaTask) => task.category === "Decorations"
		);
		if (decorationTasks.length === 0) {
			setShowDefaultTasks(true);
		}
	}, [tasks]);

	function handleAddTask(formValues: Record<string, any>) {
		if (!formValues.title?.trim()) return;

		const newTask: Omit<KwanzaaTask, "id" | "createdAt" | "updatedAt"> = {
			title: formValues.title,
			description: formValues.description || undefined,
			priority: formValues.priority as "low" | "medium" | "high",
			assignedTo: formValues.assignedTo || undefined,
			category: formValues.category || "Decorations",
			dueDate: formValues.dueDate || undefined,
			isCompleted: false,
		};

		dispatch(addKwanzaaTask(newTask));
		setShowForm(false);
	}

	function addDefaultDecorationTasks() {
		defaultDecorationTasks.forEach((task) => {
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

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
	}

	function handleToggleTask(taskId: string) {
		dispatch(toggleKwanzaaTaskCompletion(taskId));
	}

	function handleDeleteTask(taskId: string) {
		setDeleteConfirm({ show: true, taskId });
	}

	function handleEditTask(task: KwanzaaTask) {
		setEditingTask(task);
	}

	function handleSaveEdit(
		updatedTask: Omit<KwanzaaTask, "id" | "createdAt" | "updatedAt">
	) {
		if (editingTask) {
			dispatch(updateKwanzaaTask({ ...editingTask, ...updatedTask }));
			setEditingTask(null);
		}
	}

	function handleCloseEdit() {
		setEditingTask(null);
	}

	function confirmDelete() {
		if (deleteConfirm.taskId) {
			dispatch(deleteKwanzaaTask(deleteConfirm.taskId));
			setDeleteConfirm({ show: false, taskId: null });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, taskId: null });
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
						Loading decorations...
					</p>
				</div>
			</div>
		);
	}

	const decorationTasks = tasks.filter(
		(task: KwanzaaTask) => task.category === "Decorations"
	);
	const sortedTasks = sortTasks(decorationTasks);
	const incompleteTasks = sortedTasks.filter(
		(task: KwanzaaTask) => !task.isCompleted
	);
	const completedTasks = sortedTasks.filter(
		(task: KwanzaaTask) => task.isCompleted
	);

	return (
		<div className="min-h-screen kwanzaa-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Decorations"
				backHref="/kwanzaa"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort tasks"
				description="Keep track of Decorations!"
				holidayColor="red-500"
				error={error}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Default Tasks Prompt */}
				{showDefaultTasks && (
					<div className="card card-tasks rounded-lg p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
						<h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
							✨ Set Up Kwanzaa Decorations
						</h3>
						<p className="text-red-700 dark:text-red-300 text-sm mb-3">
							Would you like to add common Kwanzaa decoration tasks?
						</p>
						<div className="flex gap-2">
							<button
								onClick={addDefaultDecorationTasks}
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

				<AddButton title="Decoration Task" onClick={openForm} color="red" />
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
					renderItem={(task: KwanzaaTask) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleTask}
							onDelete={handleDeleteTask}
							onEdit={handleEditTask}
							theme={{
								accentColor: "#dc2626", // Red for Kwanzaa
							}}
							borderColor="rgb(var(--color-red-500))" // Red border for Kwanzaa
						/>
					)}
				/>

				<TaskSection
					title="Completed"
					items={completedTasks}
					isCompleted={true}
					emptyMessage="No completed tasks yet."
					completedMessage=""
					renderItem={(task: KwanzaaTask) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleTask}
							onDelete={handleDeleteTask}
							onEdit={handleEditTask}
							className="opacity-60"
							theme={{
								accentColor: "#dc2626", // Red for Kwanzaa
							}}
							borderColor="rgb(var(--color-red-500))" // Red border for Kwanzaa
						/>
					)}
				/>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showForm}
				title="Add New Decoration Task"
				fields={getFormConfig("tasks", "add").fields}
				onSubmit={handleAddTask}
				onClose={closeForm}
				loading={loading}
				submitText={loading ? "Adding..." : "Add Task"}
				cancelText="Cancel"
				cardClassName="card card-tasks"
				submitButtonColor="#dc2626"
			/>

			{/* Edit Task Modal */}
			<EditTaskModal
				isOpen={editingTask !== null}
				task={editingTask}
				onClose={handleCloseEdit}
				onSave={handleSaveEdit}
				loading={loading}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={deleteConfirm.show}
				{...getDeleteConfig("tasks")}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={loading}
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
