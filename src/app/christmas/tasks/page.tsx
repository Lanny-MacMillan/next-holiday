"use client";

import { useState, useEffect } from "react";
import {
	selectHolidayPreferences,
	selectHomeInitialized,
	selectHomeData,
} from "@/store/selectors/home";
import {
	shouldSkipHolidayQueryWithColdEntry,
	getHolidayDataFromRedux,
} from "@/utils/holidayData";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { RootState } from "@/store";
import { updateTaskInHomeData } from "@/store/slices/homeSlice";
import { useAuth0 } from "@auth0/auth0-react";
import {
	useGetTasksQuery,
	useCreateTaskMutation,
	useUpdateTaskMutation,
	useDeleteTaskMutation,
	useToggleTaskCompletionMutation,
} from "@/store/api";
import SortModal from "@/components/modals/SortModal";
import ToDoCard from "@/components/cards/to-do/ToDoCard";
import EditTaskModal from "@/components/modals/EditTaskModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import FormModal from "@/components/modals/FormModal";
import { getFormConfig } from "@/config/formConfigs";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

interface Task {
	id: string;
	title: string;
	description?: string;
	priority: "low" | "medium" | "high";
	isCompleted: boolean;
	completedDate?: string;
	dueDate?: string;
	category?: string;
	assignedTo?: string;
	shareId?: string;
	createdAt: string;
	updatedAt: string;
}

export default function TasksPage() {
	const dispatch = useAppDispatch();
	const { user: auth0User } = useAuth0();
	const holidayPreferences = useAppSelector(selectHolidayPreferences);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const homeData = useAppSelector(selectHomeData);

	// Get current Redux state for skip logic
	const currentState = useAppSelector((state: RootState) => state);

	// Get holiday ID for Christmas - try to resolve from home data, fallback to route-based resolution
	const resolvedHolidayId = homeInitialized
		? getHolidayIdFromRoute("/christmas", holidayPreferences)
		: getHolidayIdFromRoute("/christmas", holidayPreferences); // Allow fallback for cold entry

	// Get holiday data from Redux if available
	const holidayData = getHolidayDataFromRedux(resolvedHolidayId, currentState);

	// Use Redux data first, fallback to RTK Query if needed
	const tasks = holidayData?.tasks || [];

	// Fetch tasks using RTK Query as fallback (only when Redux data is not available)
	const {
		data: fallbackTasks = [],
		isLoading,
		error,
	} = useGetTasksQuery(
		{ holidayId: resolvedHolidayId || "", auth0User },
		{
			skip:
				shouldSkipHolidayQueryWithColdEntry(
					resolvedHolidayId,
					auth0User,
					currentState,
					true
				) || !!holidayData?.tasks, // Skip if we have Redux data
		}
	);

	// Use Redux data if available, otherwise use fallback from RTK Query
	const finalTasks = tasks.length > 0 ? tasks : fallbackTasks;

	// Debug logging
	useEffect(() => {
		console.log("=== CHRISTMAS TASKS PAGE DEBUG ===");
		console.log("resolvedHolidayId:", resolvedHolidayId);
		console.log("holidayData:", holidayData);
		console.log("holidayData?.tasks:", holidayData?.tasks);
		console.log("tasks from Redux:", tasks);
		console.log("fallbackTasks from RTK Query:", fallbackTasks);
		console.log("finalTasks:", finalTasks);
		console.log("isLoading:", isLoading);
		console.log("error:", error);
		console.log("=== END DEBUG ===");
	}, [
		resolvedHolidayId,
		holidayData,
		tasks,
		fallbackTasks,
		finalTasks,
		isLoading,
		error,
	]);
	const [createTask, { isLoading: isAdding }] = useCreateTaskMutation();
	const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
	const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
	const [toggleTaskCompletion, { isLoading: isToggling }] =
		useToggleTaskCompletionMutation();

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [editingTask, setEditingTask] = useState<Task | null>(null);

	async function handleAddTask(formValues: Record<string, any>) {
		if (!formValues.title?.trim() || !resolvedHolidayId || !auth0User) return;

		try {
			const newTask = {
				title: formValues.title,
				description: formValues.description || undefined,
				priority: formValues.priority as "low" | "medium" | "high",
				assignedTo: formValues.assignedTo || undefined,
				category: formValues.category || "Tasks",
				dueDate: formValues.dueDate || undefined,
				isCompleted: false,
				holidayId: resolvedHolidayId,
			};

			await createTask({
				holidayId: resolvedHolidayId,
				payload: newTask,
				auth0User,
			}).unwrap();
			setShowForm(false);
		} catch (error) {
			console.error("Failed to add task:", error);
		}
	}

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
	}

	async function handleToggleTask(taskId: string) {
		if (!auth0User || !resolvedHolidayId) return;

		try {
			// Find the current task to get its completion status
			const currentTask = finalTasks.find((task: Task) => task.id === taskId);
			if (!currentTask) {
				console.error("Task not found:", taskId);
				return;
			}

			// Toggle the completion status
			const newCompletionStatus = !currentTask.isCompleted;

			// Optimistically update the Redux home data
			dispatch(
				updateTaskInHomeData({
					holidayId: resolvedHolidayId,
					taskId: taskId,
					updates: { isCompleted: newCompletionStatus },
				})
			);

			await toggleTaskCompletion({
				holidayId: resolvedHolidayId,
				taskId,
				isCompleted: newCompletionStatus,
				auth0User,
			}).unwrap();
		} catch (error) {
			console.error("Failed to toggle task:", error);
			// Revert the optimistic update on error
			const currentTask = finalTasks.find((task: Task) => task.id === taskId);
			if (currentTask && resolvedHolidayId) {
				dispatch(
					updateTaskInHomeData({
						holidayId: resolvedHolidayId,
						taskId: taskId,
						updates: { isCompleted: currentTask.isCompleted },
					})
				);
			}
		}
	}

	async function handleDeleteTask(taskId: string) {
		if (!auth0User || !resolvedHolidayId) return;

		try {
			await deleteTask({
				holidayId: resolvedHolidayId,
				taskId,
				auth0User,
			}).unwrap();
		} catch (error) {
			console.error("Failed to delete task:", error);
		}
	}

	function handleEditTask(task: Task) {
		setEditingTask(task);
	}

	async function handleSaveEdit(
		updatedTask: Omit<Task, "id" | "createdAt" | "updatedAt">
	) {
		if (editingTask && auth0User && resolvedHolidayId) {
			try {
				// Optimistically update the Redux home data
				dispatch(
					updateTaskInHomeData({
						holidayId: resolvedHolidayId,
						taskId: editingTask.id,
						updates: updatedTask,
					})
				);

				await updateTask({
					holidayId: resolvedHolidayId,
					taskId: editingTask.id,
					updates: updatedTask,
					auth0User,
				}).unwrap();
				setEditingTask(null);
			} catch (error) {
				console.error("Failed to update task:", error);
				// Revert the optimistic update on error
				dispatch(
					updateTaskInHomeData({
						holidayId: resolvedHolidayId,
						taskId: editingTask.id,
						updates: {
							title: editingTask.title,
							description: editingTask.description,
							priority: editingTask.priority,
							category: editingTask.category,
							assignedTo: editingTask.assignedTo,
							dueDate: editingTask.dueDate,
						},
					})
				);
			}
		}
	}

	function handleCloseEdit() {
		setEditingTask(null);
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

	if (isLoading && !holidayData?.tasks) {
		return (
			<div className="min-h-screen christmas-tasks-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading tasks...</p>
				</div>
			</div>
		);
	}

	const sortedTasks = sortTasks(finalTasks);
	const incompleteTasks = sortedTasks.filter((task: Task) => !task.isCompleted);
	const completedTasks = sortedTasks.filter((task: Task) => task.isCompleted);

	const loading = isAdding || isUpdating || isDeleting || isToggling;

	return (
		<div className="min-h-screen christmas-tasks-gradient  flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="To-Do List"
				backHref="/christmas"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort tasks"
				description="Add tasks to your holiday to-do list"
				holidayColor="red-500"
				error={error ? "Failed to load tasks" : undefined}
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
							disableInternalModal={true}
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
							disableInternalModal={true}
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
				cardClassName="card"
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
