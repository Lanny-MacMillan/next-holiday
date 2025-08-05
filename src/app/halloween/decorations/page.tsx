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
} from "@/store/slices/halloweenTasksSlice";
import SortModal from "@/components/modals/SortModal";
import DeleteModal from "@/components/modals/DeleteModal";
import FormModal from "@/components/modals/FormModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import ToDoCard from "@/components/cards/to-do/ToDoCard";
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

const defaultDecorationTasks = [
	{
		title: "Decorate Front Yard",
		description: "Set up spooky decorations outside",
		category: "Decorations Checklist",
		priority: "high" as const,
		isCompleted: false,
	},
	{
		title: "Carve Pumpkins",
		description: "Create jack-o-lanterns for decoration",
		category: "Decorations Checklist",
		priority: "medium" as const,
		isCompleted: false,
	},
	{
		title: "Set Up Indoor Decorations",
		description: "Decorate inside the house",
		category: "Decorations Checklist",
		priority: "medium" as const,
		isCompleted: false,
	},
	{
		title: "Hang Spider Webs",
		description: "Add fake spider webs for spooky effect",
		category: "Decorations Checklist",
		priority: "low" as const,
		isCompleted: false,
	},
];

export default function HalloweenDecorationsPage() {
	const dispatch = useAppDispatch();
	const { tasks, loading, error, initialized } = useAppSelector(
		(state: any) => state.halloweenTasks
	);

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [showDefaultTasks, setShowDefaultTasks] = useState(false);
	const [editingTask, setEditingTask] = useState<HalloweenTask | null>(null);

	useEffect(() => {
		if (!initialized) {
			dispatch(fetchHalloweenTasks());
		}
	}, [dispatch, initialized]);

	useEffect(() => {
		const decorationTasks = tasks.filter(
			(task: HalloweenTask) => task.category === "Decorations Checklist"
		);
		console.log("Decoration tasks found:", decorationTasks.length);
		if (decorationTasks.length === 0) {
			setShowDefaultTasks(true);
		} else {
			setShowDefaultTasks(false);
		}
	}, [tasks]);

	function handleAddTask(values: Record<string, any>) {
		dispatch(
			addHalloweenTask({
				title: values.title,
				description: values.description || "",
				priority: values.priority || "medium",
				assignedTo: values.assignedTo || "",
				category: "Decorations Checklist",
				dueDate: values.dueDate || "",
				isCompleted: false,
			})
		);
		setShowForm(false);
	}

	function handleEditTask(values: Record<string, any>) {
		if (editingTask) {
			dispatch(
				updateHalloweenTask({
					...editingTask,
					...values,
				})
			);
			setEditingTask(null);
		}
	}

	function addDefaultDecorationTasks() {
		defaultDecorationTasks.forEach((task) => {
			dispatch(addHalloweenTask({ ...task, isCompleted: false }));
		});
		setShowDefaultTasks(false);
	}

	function handleToggleTask(taskId: string) {
		dispatch(toggleHalloweenTaskCompletion(taskId));
	}

	function handleDeleteTask(taskId: string) {
		dispatch(deleteHalloweenTask(taskId));
	}

	function handleEdit(task: HalloweenTask) {
		setEditingTask(task);
	}

	function handleSortChange(sortOption: string) {
		setSortBy(sortOption as SortOption);
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

	const decorationTasks = tasks.filter(
		(task: HalloweenTask) => task.category === "Decorations Checklist"
	);
	const sortedTasks = sortTasks(decorationTasks);
	const incompleteTasks = sortedTasks.filter((task) => !task.isCompleted);
	const completedTasks = sortedTasks.filter((task) => task.isCompleted);

	const renderTaskCard = (task: HalloweenTask) => (
		<ToDoCard
			key={task.id}
			task={task}
			onToggleComplete={handleToggleTask}
			onDelete={handleDeleteTask}
			onEdit={handleEdit}
			theme={{
				accentColor: "#f97316",
				hoverColor: "hover:bg-orange-50 dark:hover:bg-orange-900/20",
			}}
			borderColor="#f97316"
		/>
	);

	return (
		<div className="min-h-screen halloween-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="🎃 Decorations Checklist"
				backHref="/halloween"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort Tasks"
				error={error}
			/>

			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				{/* Default Tasks Modal */}
				{showDefaultTasks && (
					<div className="card rounded-lg p-6 mb-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700">
						<h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
							🎃 Welcome to Decorations Planning!
						</h3>
						<p className="text-gray-600 dark:text-gray-400 mb-4">
							Let's get you started with some essential decoration tasks.
						</p>
						<button
							onClick={addDefaultDecorationTasks}
							className="bg-orange-500 hover:bg-orange-600 text-black font-medium px-4 py-2 rounded-lg transition-colors"
						>
							Add Default Tasks
						</button>
					</div>
				)}

				{/* Add Task Button */}
				<AddButton
					title="Task"
					onClick={() => setShowForm(true)}
					color="orange"
				/>

				{/* Task Sections */}
				<TaskSection
					title="Incomplete"
					items={incompleteTasks}
					isCompleted={false}
					emptyMessage="All tasks completed! 🎉"
					completedMessage=""
					renderItem={renderTaskCard}
				/>

				<TaskSection
					title="Completed"
					items={completedTasks}
					isCompleted={true}
					emptyMessage="No completed tasks yet."
					completedMessage=""
					renderItem={renderTaskCard}
				/>
			</main>

			{/* Sort Modal */}
			<SortModal
				isOpen={showSortModal}
				onClose={() => setShowSortModal(false)}
				sortBy={sortBy}
				onSortChange={handleSortChange}
				sortOptions={[
					{ value: "none", label: "None" },
					{ value: "priority", label: "Priority" },
					{ value: "dateDue", label: "Due Date" },
					{ value: "assignedTo", label: "Assigned To" },
					{ value: "category", label: "Category" },
				]}
				title="Sort Tasks"
			/>

			{/* Form Modal for Adding Tasks */}
			<FormModal
				isOpen={showForm}
				title="Add New Task"
				fields={getFormConfig("tasks").fields}
				onSubmit={handleAddTask}
				onClose={() => setShowForm(false)}
				loading={loading}
				submitText="Add Task"
				submitButtonColor="#f97316"
			/>

			{/* Form Modal for Editing Tasks */}
			<FormModal
				isOpen={!!editingTask}
				title="Edit Task"
				fields={getFormConfig("tasks").fields}
				initialValues={editingTask || {}}
				onSubmit={handleEditTask}
				onClose={() => setEditingTask(null)}
				loading={loading}
				submitText="Update Task"
				submitButtonColor="#f97316"
			/>
		</div>
	);
}
