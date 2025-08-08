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

export default function TasksPage() {
	const dispatch = useAppDispatch();
	const { tasks, loading, error, initialized } = useAppSelector(
		(state: any) => state.tasks
	);

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [editingTask, setEditingTask] = useState<Task | null>(null);
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		taskId: string | null;
	}>({
		show: false,
		taskId: null,
	});

	useEffect(() => {
		// Fetch tasks when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchTasks());
		}
	}, [dispatch, initialized]);

	function handleAddTask(formValues: Record<string, any>) {
		if (!formValues.title?.trim()) return;

		const newTask: Omit<Task, "id" | "createdAt" | "updatedAt"> = {
			title: formValues.title,
			description: formValues.description || undefined,
			priority: formValues.priority as "low" | "medium" | "high",
			assignedTo: formValues.assignedTo || undefined,
			category: formValues.category || undefined,
			dueDate: formValues.dueDate || undefined,
			isCompleted: false,
		};

		dispatch(addTask(newTask));
		setShowForm(false);
	}

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
	}

	function handleToggleTask(taskId: string) {
		dispatch(toggleTaskCompletion(taskId));
	}

	function handleDeleteTask(taskId: string) {
		setDeleteConfirm({ show: true, taskId });
	}

	function handleEditTask(task: Task) {
		setEditingTask(task);
	}

	function handleSaveEdit(
		updatedTask: Omit<Task, "id" | "createdAt" | "updatedAt">
	) {
		if (editingTask) {
			dispatch(updateTask({ ...editingTask, ...updatedTask }));
			setEditingTask(null);
		}
	}

	function handleCloseEdit() {
		setEditingTask(null);
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
			<HolidayPageHeader
				title="To-Do List"
				backHref="/christmas"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort tasks"
				error={error}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				<AddButton title="Task" onClick={openForm} color="green" />
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
					emptyMessage="All tasks completed! 🎉"
					completedMessage="All tasks completed! 🎉"
					renderItem={(task: Task) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleTask}
							onDelete={handleDeleteTask}
							onEdit={handleEditTask}
							theme={{
								accentColor: "#22c55e", // Green for Christmas
							}}
							borderColor="rgb(var(--color-green-500))" // Green border for Christmas
							gamifiedBackgroundColor="bg-gradient-to-br from-red-400 to-red-600"
						/>
					)}
					// cardClassName="card-tasks"
				/>

				<TaskSection
					title="Completed"
					items={completedTasks}
					isCompleted={true}
					emptyMessage="No completed tasks yet."
					completedMessage="No completed tasks yet."
					renderItem={(task: Task) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleTask}
							onDelete={handleDeleteTask}
							onEdit={handleEditTask}
							className="opacity-60"
							theme={{
								accentColor: "#22c55e", // Green for Christmas
							}}
							borderColor="rgb(var(--color-green-500))" // Green border for Christmas
							gamifiedBackgroundColor="bg-gradient-to-br from-red-400 to-red-600"
						/>
					)}
					// cardClassName="card-tasks"
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
				submitButtonColor="#22c55e"
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
