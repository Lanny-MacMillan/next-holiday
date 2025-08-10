"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchValentinesTasks,
	addValentinesTask,
	updateValentinesTask,
	deleteValentinesTask,
	toggleValentinesTaskCompletion,
	setSelectedValentinesTask,
} from "@/store/slices/valentines/valentinesTasksSlice";
import SortModal from "@/components/modals/SortModal";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import DateTrackerCard from "@/components/cards/DateTrackerCard";
import DateIdeaCard from "@/components/cards/DateIdeaCard";

export default function ValentinesDateIdeasPage() {
	const dispatch = useAppDispatch();

	const [editingTask, setEditingTask] = useState<any>(null);
	const [showSortModal, setShowSortModal] = useState(false);
	const [showFormModal, setShowFormModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
	const [sortBy, setSortBy] = useState("title");

	const allTasks = useAppSelector((state) => state.valentinesTasks.tasks);
	const loading = useAppSelector((state) => state.valentinesTasks.loading);
	const selectedTask = useAppSelector(
		(state) => state.valentinesTasks.selectedTask
	);

	// Filter tasks for Date Ideas category
	const tasks = allTasks.filter((task) => task.category === "Date Ideas");

	useEffect(() => {
		dispatch(fetchValentinesTasks());
	}, [dispatch]);

	const handleFormSubmit = (values: Record<string, any>) => {
		if (editingTask) {
			// Update existing task
			const updatedTask = {
				...editingTask,
				title: values.title,
				description: values.description || "",
				priority: values.priority as "low" | "medium" | "high",
				dueDate: values.dueDate || "",
				notes: values.notes || "",
			};
			dispatch(updateValentinesTask(updatedTask));
			setEditingTask(null);
		} else {
			// Add new task
			const newTaskData = {
				title: values.title,
				description: values.description || "",
				priority: values.priority as "low" | "medium" | "high",
				category: "Date Ideas" as const,
				dueDate: values.dueDate || "",
				notes: values.notes || "",
				isCompleted: false,
			};
			dispatch(addValentinesTask(newTaskData));
		}
		setShowFormModal(false);
	};

	const handleEditTask = (task: any) => {
		setEditingTask(task);
		setShowFormModal(true);
	};

	const handleDeleteTask = (taskId: string) => {
		setTaskToDelete(taskId);
		setShowDeleteModal(true);
	};

	const confirmDelete = async () => {
		if (taskToDelete) {
			await dispatch(deleteValentinesTask(taskToDelete));
			setTaskToDelete(null);
		}
		setShowDeleteModal(false);
	};

	const cancelDelete = () => {
		setTaskToDelete(null);
		setShowDeleteModal(false);
	};

	const handleToggleCompletion = async (taskId: string) => {
		await dispatch(toggleValentinesTaskCompletion(taskId));
	};

	const openAddForm = () => {
		setEditingTask(null);
		setShowFormModal(true);
	};

	const closeForm = () => {
		setShowFormModal(false);
		setEditingTask(null);
	};

	const sortedTasks = [...tasks].sort((a, b) => {
		switch (sortBy) {
			case "title":
				return a.title.localeCompare(b.title);
			case "priority":
				const priorityOrder = { high: 3, medium: 2, low: 1 };
				return priorityOrder[b.priority] - priorityOrder[a.priority];
			case "dueDate":
				if (!a.dueDate && !b.dueDate) return 0;
				if (!a.dueDate) return 1;
				if (!b.dueDate) return -1;
				return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
			case "completed":
				return a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1;
			default:
				return 0;
		}
	});

	const completedTasks = tasks.filter((task) => task.isCompleted);
	const incompleteTasks = tasks.filter((task) => !task.isCompleted);

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "high":
				return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
			case "medium":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
			case "low":
				return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
		}
	};

	// Get form configuration with custom titles for date ideas
	const formConfig = getFormConfig(
		"tasks",
		editingTask ? "edit" : "add",
		editingTask ? "Edit Date Idea" : "Add New Date Idea",
		"Date Idea Title*",
		editingTask ? "Update Date Idea" : "Add Date Idea"
	);
	const deleteConfig = getDeleteConfig("tasks");

	// Get the task name for delete confirmation
	const taskToDeleteName = taskToDelete
		? tasks.find((task) => task.id === taskToDelete)?.title
		: undefined;

	return (
		<div className="min-h-screen valentines-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Date Ideas"
				backHref="/valentines"
				onSortClick={() => setShowSortModal(true)}
				description="Keep track of your date ideas!"
				holidayColor="pink-500"
				sortTitle="Sort Date Ideas"
			/>

			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				{/* Summary Stats */}
				<DateTrackerCard
					totalIdeas={tasks.length}
					completedIdeas={completedTasks.length}
					highPriorityIdeas={
						tasks.filter((task) => task.priority === "high").length
					}
					dueSoonIdeas={
						tasks.filter((task) => {
							if (!task.dueDate) return false;
							const dueDate = new Date(task.dueDate);
							const now = new Date();
							const diffDays = Math.ceil(
								(dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
							);
							return diffDays <= 7 && diffDays >= 0;
						}).length
					}
					holidayColor="bg-gradient-to-br from-pink-300 to-pink-500"
				/>

				<AddButton
					title="Date Idea"
					onClick={openAddForm}
					color="pink"
					disabled={loading}
				/>

				{/* Task List */}
				<div className="space-y-4">
					{loading ? (
						<div className="text-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
							<p className="text-gray-600 dark:text-gray-400 mt-2">
								Loading date ideas...
							</p>
						</div>
					) : sortedTasks.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-gray-600 dark:text-gray-400">
								No date ideas added yet.
							</p>
							<button
								onClick={openAddForm}
								className="mt-2 text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
							>
								Add your first date idea
							</button>
						</div>
					) : (
						sortedTasks.map((task) => (
							<DateIdeaCard
								key={task.id}
								task={task}
								onToggleCompletion={handleToggleCompletion}
								onEdit={handleEditTask}
								onDelete={handleDeleteTask}
								getPriorityColor={getPriorityColor}
								holidayColor="bg-gradient-to-br from-pink-300 to-pink-500"
							/>
						))
					)}
				</div>
			</main>

			{/* Sort Modal */}
			<SortModal
				isOpen={showSortModal}
				onClose={() => setShowSortModal(false)}
				sortBy={sortBy}
				onSortChange={setSortBy}
				sortOptions={[
					{ value: "title", label: "Title" },
					{ value: "priority", label: "Priority" },
					{ value: "dueDate", label: "Due Date" },
					{ value: "completed", label: "Completion Status" },
				]}
				title="Sort Date Ideas"
			/>

			{/* Form Modal */}
			<FormModal
				isOpen={showFormModal}
				title={formConfig.title}
				fields={formConfig.fields}
				initialValues={
					editingTask
						? {
								title: editingTask.title,
								description: editingTask.description || "",
								priority: editingTask.priority,
								dueDate: editingTask.dueDate || "",
								notes: editingTask.notes || "",
						  }
						: {}
				}
				onSubmit={handleFormSubmit}
				onClose={closeForm}
				loading={loading}
				submitText={formConfig.submitText}
				cancelText={formConfig.cancelText}
				cardClassName={formConfig.cardClassName}
				submitButtonColor={formConfig.submitButtonColor}
			/>

			{/* Delete Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				title="Delete Date Idea?"
				message="Are you sure you want to delete this date idea? This action cannot be undone."
				itemName={taskToDeleteName}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={loading}
				cardClassName="card card-cards"
				confirmText={deleteConfig.confirmText}
				cancelText={deleteConfig.cancelText}
				confirmButtonColor={deleteConfig.confirmButtonColor}
			/>

			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
