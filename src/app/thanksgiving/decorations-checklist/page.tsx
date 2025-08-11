"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchThanksgivingTasks,
	addThanksgivingTask,
	updateThanksgivingTask,
	deleteThanksgivingTask,
	toggleThanksgivingTaskCompletion,
	ThanksgivingTask,
} from "@/store/slices/thanksgiving/thanksgivingTasksSlice";
import SortModal from "@/components/modals/SortModal";
import DeleteModal from "@/components/modals/DeleteModal";
import FormModal from "@/components/modals/FormModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import ToDoCard from "@/components/cards/to-do/ToDoCard";
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";
import { FormConfig } from "@/config/formConfigs";

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

// Custom form configuration for thanksgiving decorations checklist
const thanksgivingDecorationsFormConfig: FormConfig = {
	title: "Add Decoration",
	fields: [
		{
			id: "title",
			type: "text",
			placeholder: "Decoration*",
			required: true,
		},
		{
			id: "description",
			type: "textarea",
			placeholder: "Description",
			rows: 2,
		},
		{
			id: "priority",
			type: "select",
			placeholder: "Priority",
			options: [
				{ value: "low", label: "Low Priority" },
				{ value: "medium", label: "Medium Priority" },
				{ value: "high", label: "High Priority" },
			],
		},
	],
	submitText: "Add Decoration",
	cancelText: "Cancel",
	cardClassName: "card card-tasks",
	submitButtonColor: "#d97706", // Amber for thanksgiving
};

const editThanksgivingDecorationsFormConfig: FormConfig = {
	...thanksgivingDecorationsFormConfig,
	title: "Edit Decoration",
	submitText: "Update Decoration",
};

const defaultDecorationTasks = [
	{
		title: "Set Up Fall Centerpieces",
		description: "Create beautiful autumn-themed centerpieces",
		category: "Decorations Checklist",
		priority: "high" as const,
		isCompleted: false,
	},
	{
		title: "Hang Thanksgiving Wreaths",
		description: "Decorate doors with seasonal wreaths",
		category: "Decorations Checklist",
		priority: "medium" as const,
		isCompleted: false,
	},
	{
		title: "Arrange Table Settings",
		description: "Set up elegant table decorations",
		category: "Decorations Checklist",
		priority: "medium" as const,
		isCompleted: false,
	},
	{
		title: "Display Fall Flowers",
		description: "Add seasonal flowers and foliage",
		category: "Decorations Checklist",
		priority: "low" as const,
		isCompleted: false,
	},
];

export default function ThanksgivingDecorationsPage() {
	const dispatch = useAppDispatch();
	const { tasks, loading, error, initialized } = useAppSelector(
		(state: any) => state.thanksgivingTasks
	);

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [showDefaultTasks, setShowDefaultTasks] = useState(false);
	const [editingTask, setEditingTask] = useState<ThanksgivingTask | null>(null);

	useEffect(() => {
		if (!initialized) {
			dispatch(fetchThanksgivingTasks());
		}
	}, [dispatch, initialized]);

	useEffect(() => {
		const decorationTasks = tasks.filter(
			(task: ThanksgivingTask) => task.category === "Decorations Checklist"
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
			addThanksgivingTask({
				title: values.title,
				description: values.description || "",
				priority: values.priority || "medium",
				category: "Decorations Checklist",
				isCompleted: false,
			})
		);
		setShowForm(false);
	}

	function handleEditTask(values: Record<string, any>) {
		if (editingTask) {
			dispatch(
				updateThanksgivingTask({
					...editingTask,
					title: values.title,
					description: values.description || "",
					priority: values.priority || "medium",
				})
			);
			setEditingTask(null);
		}
	}

	function addDefaultDecorationTasks() {
		defaultDecorationTasks.forEach((task) => {
			dispatch(addThanksgivingTask({ ...task, isCompleted: false }));
		});
		setShowDefaultTasks(false);
	}

	function handleToggleTask(taskId: string) {
		dispatch(toggleThanksgivingTaskCompletion(taskId));
	}

	function handleDeleteTask(taskId: string) {
		dispatch(deleteThanksgivingTask(taskId));
	}

	function handleEdit(task: ThanksgivingTask) {
		setEditingTask(task);
	}

	function handleSortChange(sortOption: string) {
		setSortBy(sortOption as SortOption);
	}

	function sortTasks(tasksToSort: ThanksgivingTask[]): ThanksgivingTask[] {
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
		(task: ThanksgivingTask) => task.category === "Decorations Checklist"
	);
	const sortedTasks = sortTasks(decorationTasks);
	const incompleteTasks = sortedTasks.filter((task) => !task.isCompleted);
	const completedTasks = sortedTasks.filter((task) => task.isCompleted);

	const renderTaskCard = (task: ThanksgivingTask) => (
		<ToDoCard
			key={task.id}
			task={task}
			onToggleComplete={handleToggleTask}
			onDelete={handleDeleteTask}
			onEdit={handleEdit}
			theme={{
				accentColor: "#d97706",
				hoverColor: "hover:bg-amber-50 dark:hover:bg-amber-900/20",
			}}
			borderColor="#d97706"
			gamifiedBackgroundColor="bg-gradient-to-br from-amber-400 to-amber-600"
		/>
	);

	return (
		<div className="min-h-screen thanksgiving-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="🦃 Decorations"
				backHref="/thanksgiving"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort Tasks"
				description="Keep track of your Thanksgiving decorations!"
				holidayColor="amber-600"
				error={error}
			/>

			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				{/* Default Tasks Modal */}
				{showDefaultTasks && (
					<div className="card rounded-lg p-6 mb-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700">
						<h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
							🦃 Welcome to Decorations Planning!
						</h3>
						<p className="text-gray-600 dark:text-gray-400 mb-4">
							Let's get you started with some essential decoration tasks.
						</p>
						<button
							onClick={addDefaultDecorationTasks}
							className="bg-amber-500 hover:bg-amber-600 text-black font-medium px-4 py-2 rounded-lg transition-colors"
						>
							Add Default Tasks
						</button>
					</div>
				)}

				{/* Add Task Button */}
				<AddButton
					title="Task"
					onClick={() => setShowForm(true)}
					color="amber"
				/>

				{/* Task Sections */}
				<TaskSection
					title="Incomplete"
					items={incompleteTasks}
					isCompleted={false}
					emptyMessage="All Decorations completed! 🎉"
					completedMessage=""
					renderItem={renderTaskCard}
				/>

				<TaskSection
					title="Completed"
					items={completedTasks}
					isCompleted={true}
					emptyMessage="No completed Decorations yet."
					completedMessage="No completed Decorations yet."
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
				title={thanksgivingDecorationsFormConfig.title}
				fields={thanksgivingDecorationsFormConfig.fields}
				onSubmit={handleAddTask}
				onClose={() => setShowForm(false)}
				loading={loading}
				submitText={thanksgivingDecorationsFormConfig.submitText}
				submitButtonColor={thanksgivingDecorationsFormConfig.submitButtonColor}
			/>

			{/* Form Modal for Editing Tasks */}
			<FormModal
				isOpen={!!editingTask}
				title={editThanksgivingDecorationsFormConfig.title}
				fields={editThanksgivingDecorationsFormConfig.fields}
				initialValues={editingTask || {}}
				onSubmit={handleEditTask}
				onClose={() => setEditingTask(null)}
				loading={loading}
				submitText={editThanksgivingDecorationsFormConfig.submitText}
				submitButtonColor={
					editThanksgivingDecorationsFormConfig.submitButtonColor
				}
			/>
		</div>
	);
}
