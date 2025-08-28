"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useKwanzaaTasksMutations } from "@/hooks/useKwanzaaTasksMutations";
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

export default function KwanzaaTasksPage() {
	const dispatch = useAppDispatch();

	// Use the Kwanzaa tasks mutations hook
	const {
		holidayId,
		auth0User,
		tasks,
		loading,
		error,
		initialized,
		createTask,
		updateTask,
		editTask,
		deleteTask,
		createTaskState,
		updateTaskState,
		editTaskState,
		deleteTaskState,
		getTasksByCategory,
	} = useKwanzaaTasksMutations();

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);
	const [taskToDelete, setTaskToDelete] = useState<any>(null);

	async function handleAddTask(formValues: Record<string, any>) {
		if (!formValues.title?.trim()) return;
		if (!holidayId || !auth0User) return;

		try {
			const payload = {
				title: formValues.title,
				description: formValues.description || undefined,
				priority: formValues.priority as "low" | "medium" | "high",
				assignedTo: formValues.assignedTo || undefined,
				category: formValues.category || "Tasks",
				dueDate: formValues.dueDate || undefined,
				isCompleted: false,
			};

			await createTask({ holidayId, payload, auth0User }).unwrap();
			setShowForm(false);
		} catch (error) {
			console.error("Error creating task:", error);
		}
	}

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
	}

	async function handleToggleTask(taskId: string) {
		if (!holidayId || !auth0User) return;

		try {
			const task = tasks.find((t: any) => t.id === taskId);
			if (task) {
				await updateTask({
					holidayId,
					taskId,
					isCompleted: !task.isCompleted,
					auth0User,
				}).unwrap();
			}
		} catch (error) {
			console.error("Error updating task:", error);
		}
	}

	function handleDeleteTask(taskId: string) {
		const task = tasks.find((t: any) => t.id === taskId);
		setTaskToDelete(task);
		setShowDeleteModal(true);
	}

	function handleEditTask(task: any) {
		setEditingTask(task);
		setShowEditModal(true);
	}

	async function handleEditTaskSubmit(formValues: Record<string, any>) {
		if (!editingTask || !holidayId || !auth0User) return;

		try {
			await editTask({
				holidayId,
				taskId: editingTask.id,
				payload: formValues,
				auth0User,
			}).unwrap();
			setShowEditModal(false);
			setEditingTask(null);
		} catch (error) {
			console.error("Error editing task:", error);
		}
	}

	function handleCloseEdit() {
		setShowEditModal(false);
		setEditingTask(null);
	}

	async function confirmDelete() {
		if (taskToDelete) {
			try {
				await deleteTask({
					holidayId: holidayId || "",
					taskId: taskToDelete.id,
					auth0User,
				}).unwrap();
				setShowDeleteModal(false);
				setTaskToDelete(null);
			} catch (error) {
				console.error("Error deleting task:", error);
			}
		}
	}

	function cancelDelete() {
		setShowDeleteModal(false);
		setTaskToDelete(null);
	}

	function sortTasks(tasksToSort: any[]): any[] {
		switch (sortBy) {
			case "priority":
				const priorityOrder: { [key: string]: number } = {
					high: 3,
					medium: 2,
					low: 1,
				};
				return [...tasksToSort].sort(
					(a, b) =>
						(priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
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
					<p className="text-gray-600 dark:text-gray-300">Loading tasks...</p>
				</div>
			</div>
		);
	}

	// Filter tasks by category
	const tasksByCategory = getTasksByCategory("Tasks");
	const sortedTasks = sortTasks(tasksByCategory);
	const incompleteTasks = sortedTasks.filter((task: any) => !task.isCompleted);
	const completedTasks = sortedTasks.filter((task: any) => task.isCompleted);

	// Get form configuration
	const formConfig = getFormConfig("tasks", editingTask ? "edit" : "add");
	const deleteConfig = getDeleteConfig("tasks");

	return (
		<div className="min-h-screen kwanzaa-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="To-Do List"
				backHref="/kwanzaa"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort tasks"
				error={error ? "API Error" : undefined}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				<AddButton title="Task" onClick={openForm} color="red" />
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
					emptyMessage="All tasks completed! 🕯️"
					completedMessage=""
					renderItem={(task: any) => (
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
					renderItem={(task: any) => (
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
				title="Add New Task"
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
			<FormModal
				isOpen={showEditModal}
				title="Edit Task"
				fields={formConfig.fields}
				initialValues={{
					title: editingTask?.title || "",
					description: editingTask?.description || "",
					priority: editingTask?.priority || "medium",
					assignedTo: editingTask?.assignedTo || "",
					dueDate: editingTask?.dueDate || "",
				}}
				onSubmit={handleEditTaskSubmit}
				onClose={handleCloseEdit}
				loading={editTaskState.isLoading}
				submitText="Update Task"
				cancelText="Cancel"
				cardClassName="card card-tasks"
				submitButtonColor="#dc2626"
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				title={deleteConfig.title}
				message={deleteConfig.message}
				itemName={taskToDelete?.title}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={deleteTaskState.isLoading}
				cardClassName={deleteConfig.cardClassName}
				confirmText={deleteConfig.confirmText}
				cancelText={deleteConfig.cancelText}
				confirmButtonColor={deleteConfig.confirmButtonColor}
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
