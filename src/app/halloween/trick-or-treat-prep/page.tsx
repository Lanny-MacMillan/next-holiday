"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchHalloweenTasks,
	addHalloweenTask,
	updateHalloweenTask,
	deleteHalloweenTask,
	toggleHalloweenTaskCompletion,
	HalloweenTask,
} from "@/store/slices/halloween/halloweenTasksSlice";
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

const defaultTrickOrTreatTasks = [
	{
		title: "Buy Halloween Candy",
		description: "Stock up on candy for trick-or-treaters",
		category: "Trick-or-Treat Prep",
		priority: "high" as const,
	},
	{
		title: "Prepare Trick-or-Treat Route",
		description: "Plan route for trick-or-treating",
		category: "Trick-or-Treat Prep",
		priority: "medium" as const,
	},
	{
		title: "Buy Glow Sticks",
		description: "For safety during trick-or-treating",
		category: "Trick-or-Treat Prep",
		priority: "medium" as const,
	},
	{
		title: "Check Flashlights",
		description: "Ensure flashlights work for evening trick-or-treating",
		category: "Trick-or-Treat Prep",
		priority: "low" as const,
	},
];

export default function HalloweenTrickOrTreatPrepPage() {
	const dispatch = useAppDispatch();
	const { tasks, loading, error, initialized } = useAppSelector(
		(state: any) => state.halloweenTasks
	);

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [editingTask, setEditingTask] = useState<HalloweenTask | null>(null);
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		taskId: string | null;
	}>({
		show: false,
		taskId: null,
	});
	const [showDefaultTasks, setShowDefaultTasks] = useState(false);

	useEffect(() => {
		if (!initialized) {
			dispatch(fetchHalloweenTasks());
		}
	}, [dispatch, initialized]);

	useEffect(() => {
		const trickOrTreatTasks = tasks.filter(
			(task: HalloweenTask) => task.category === "Trick-or-Treat Prep"
		);
		if (trickOrTreatTasks.length === 0) {
			setShowDefaultTasks(true);
		}
	}, [tasks]);

	function handleAddTask(formValues: Record<string, any>) {
		if (!formValues.title?.trim()) return;

		const newTask: Omit<HalloweenTask, "id" | "createdAt" | "updatedAt"> = {
			title: formValues.title,
			description: formValues.description || undefined,
			priority: formValues.priority as "low" | "medium" | "high",
			assignedTo: formValues.assignedTo || undefined,
			category: "Trick-or-Treat Prep",
			dueDate: formValues.dueDate || undefined,
			isCompleted: false,
		};

		dispatch(addHalloweenTask(newTask));
		setShowForm(false);
	}

	function addDefaultTrickOrTreatTasks() {
		defaultTrickOrTreatTasks.forEach((task) => {
			dispatch(addHalloweenTask({ ...task, isCompleted: false }));
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
		dispatch(toggleHalloweenTaskCompletion(taskId));
	}

	function handleDeleteTask(taskId: string) {
		setDeleteConfirm({ show: true, taskId });
	}

	function handleEditTask(task: HalloweenTask) {
		setEditingTask(task);
	}

	function handleSaveEdit(
		updatedTask: Omit<HalloweenTask, "id" | "createdAt" | "updatedAt">
	) {
		if (editingTask) {
			dispatch(updateHalloweenTask({ ...editingTask, ...updatedTask }));
			setEditingTask(null);
		}
	}

	function handleCloseEdit() {
		setEditingTask(null);
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

	if (loading && !initialized) {
		return (
			<div className="min-h-screen halloween-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading tasks...</p>
				</div>
			</div>
		);
	}

	const trickOrTreatTasks = tasks.filter(
		(task: HalloweenTask) => task.category === "Trick-or-Treat Prep"
	);
	const sortedTasks = sortTasks(trickOrTreatTasks);
	const incompleteTasks = sortedTasks.filter(
		(task: HalloweenTask) => !task.isCompleted
	);
	const completedTasks = sortedTasks.filter(
		(task: HalloweenTask) => task.isCompleted
	);

	return (
		<div className="min-h-screen halloween-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="🕯️ Trick-or-Treat Prep"
				backHref="/halloween"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort tasks"
				error={error}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Default Tasks Modal */}
				{showDefaultTasks && (
					<div className="card rounded-lg p-6 mb-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700">
						<h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
							🎃 Welcome to Halloween Planning!
						</h3>
						<p className="text-gray-600 dark:text-gray-400 mb-4">
							Let's get you started with some essential trick-or-treat prep
							tasks.
						</p>
						<button
							onClick={addDefaultTrickOrTreatTasks}
							className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
						>
							Add Default Tasks
						</button>
					</div>
				)}

				<AddButton title="Task" onClick={openForm} color="orange" />

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
					emptyMessage="No trick-or-treat prep tasks yet. Add your first task!"
					completedMessage="No trick-or-treat prep tasks yet. Add your first task!"
					renderItem={(task: HalloweenTask) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleTask}
							onDelete={handleDeleteTask}
							onEdit={handleEditTask}
							theme={{
								accentColor: "#f97316", // Orange for Halloween
							}}
							borderColor="rgb(var(--color-orange-500))" // Orange border for Halloween
						/>
					)}
				/>

				<TaskSection
					title="Completed"
					items={completedTasks}
					isCompleted={true}
					emptyMessage="No completed trick-or-treat prep tasks yet."
					completedMessage="No completed trick-or-treat prep tasks yet."
					renderItem={(task: HalloweenTask) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleTask}
							onDelete={handleDeleteTask}
							onEdit={handleEditTask}
							className="opacity-60"
							theme={{
								accentColor: "#f97316", // Orange for Halloween
							}}
							borderColor="rgb(var(--color-orange-500))" // Orange border for Halloween
						/>
					)}
				/>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showForm}
				title="Add New Task"
				fields={getFormConfig("tasks", "add").fields}
				onSubmit={handleAddTask}
				onClose={closeForm}
				loading={loading}
				submitText={loading ? "Adding..." : "Add Task"}
				cancelText="Cancel"
				cardClassName="card card-tasks"
				submitButtonColor="#f97316"
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
