"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchNewYearTasks,
	addNewYearTask,
	updateNewYearTask,
	deleteNewYearTask,
	toggleNewYearTaskCompletion,
	NewYearTask,
} from "@/store/slices/newYearTasksSlice";
import SortModal from "@/components/modals/SortModal";
import DeleteModal from "@/components/modals/DeleteModal";
import EditTaskModal from "@/components/modals/EditTaskModal";
import FormModal from "@/components/modals/FormModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import ToDoCard from "@/components/cards/to-do/ToDoCard";

type SortOption = "priority" | "dueDate" | "title" | "none";

export default function NewYearDecorationsPage() {
	const dispatch = useAppDispatch();
	const { tasks, loading, error, initialized } = useAppSelector(
		(state: any) => state.newYearTasks
	);

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showSortModal, setShowSortModal] = useState(false);
	const [showFormModal, setShowFormModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedTask, setSelectedTask] = useState<NewYearTask | null>(null);
	const [taskToDelete, setTaskToDelete] = useState<NewYearTask | null>(null);

	useEffect(() => {
		if (!initialized) {
			dispatch(fetchNewYearTasks());
		}
	}, [dispatch, initialized]);

	// Filter tasks by "Decorations" category
	const decorations = tasks.filter(
		(task: NewYearTask) => task.category === "Decorations"
	);

	function handleAddTask(values: Record<string, any>) {
		const newTask: Omit<NewYearTask, "id" | "createdAt" | "updatedAt"> = {
			title: values.title,
			description: values.description || undefined,
			isCompleted: false,
			priority: values.priority || "medium",
			category: "Decorations",
			dueDate: values.dueDate || undefined,
			notes: values.notes || undefined,
		};

		dispatch(addNewYearTask(newTask));
		setShowFormModal(false);
	}

	function handleEditTask(values: Record<string, any>) {
		if (!selectedTask) return;

		const updatedTask: NewYearTask = {
			...selectedTask,
			title: values.title,
			description: values.description || undefined,
			isCompleted: values.isCompleted || false,
			priority: values.priority || "medium",
			category: "Decorations",
			dueDate: values.dueDate || undefined,
			notes: values.notes || undefined,
			updatedAt: new Date().toISOString(),
		};

		dispatch(updateNewYearTask(updatedTask));
		setShowEditModal(false);
		setSelectedTask(null);
	}

	function handleToggleTask(taskId: string) {
		dispatch(toggleNewYearTaskCompletion(taskId));
	}

	function handleDeleteTask(task: NewYearTask) {
		setTaskToDelete(task);
		setShowDeleteModal(true);
	}

	function confirmDelete() {
		if (taskToDelete) {
			dispatch(deleteNewYearTask(taskToDelete.id));
			setShowDeleteModal(false);
			setTaskToDelete(null);
		}
	}

	function handleEditTaskClick(task: NewYearTask) {
		setSelectedTask(task);
		setShowEditModal(true);
	}

	function sortTasks(tasksToSort: NewYearTask[]): NewYearTask[] {
		switch (sortBy) {
			case "priority":
				const priorityOrder = { high: 3, medium: 2, low: 1 };
				return [...tasksToSort].sort(
					(a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
				);
			case "dueDate":
				return [...tasksToSort].sort((a, b) => {
					if (!a.dueDate && !b.dueDate) return 0;
					if (!a.dueDate) return 1;
					if (!b.dueDate) return -1;
					return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
				});
			case "title":
				return [...tasksToSort].sort((a, b) => a.title.localeCompare(b.title));
			default:
				return tasksToSort;
		}
	}

	const formFields = [
		{
			id: "title",
			type: "text" as const,
			label: "Decoration Title",
			placeholder: "Enter decoration title",
			required: true,
		},
		{
			id: "description",
			type: "textarea" as const,
			label: "Description",
			placeholder: "Enter description",
			rows: 3,
		},
		{
			id: "priority",
			type: "select" as const,
			label: "Priority",
			options: [
				{ value: "low", label: "Low" },
				{ value: "medium", label: "Medium" },
				{ value: "high", label: "High" },
			],
		},
		{
			id: "dueDate",
			type: "date" as const,
			label: "Due Date",
		},
		{
			id: "notes",
			type: "textarea" as const,
			label: "Notes",
			placeholder: "Enter additional notes",
			rows: 2,
		},
	];

	const editFormFields = [
		{
			id: "title",
			type: "text" as const,
			label: "Decoration Title",
			placeholder: "Enter decoration title",
			required: true,
		},
		{
			id: "description",
			type: "textarea" as const,
			label: "Description",
			placeholder: "Enter description",
			rows: 3,
		},
		{
			id: "priority",
			type: "select" as const,
			label: "Priority",
			options: [
				{ value: "low", label: "Low" },
				{ value: "medium", label: "Medium" },
				{ value: "high", label: "High" },
			],
		},
		{
			id: "dueDate",
			type: "date" as const,
			label: "Due Date",
		},
		{
			id: "notes",
			type: "textarea" as const,
			label: "Notes",
			placeholder: "Enter additional notes",
			rows: 2,
		},
		{
			id: "isCompleted",
			type: "checkbox" as const,
			label: "Mark as completed",
		},
	];

	if (loading && !initialized) {
		return (
			<div className="min-h-screen new-year-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading decorations...
					</p>
				</div>
			</div>
		);
	}

	const sortedDecorations = sortTasks(decorations);
	const incompleteDecorations = sortedDecorations.filter(
		(task: NewYearTask) => !task.isCompleted
	);
	const completedDecorations = sortedDecorations.filter(
		(task: NewYearTask) => task.isCompleted
	);

	const renderTaskItem = (task: NewYearTask) => {
		// Convert NewYearTask to Task type for ToDoCard
		const taskForCard = {
			...task,
			category: task.category || "Decorations",
		};

		return (
			<ToDoCard
				key={task.id}
				task={taskForCard as any}
				onToggleComplete={handleToggleTask}
				onDelete={(taskId: string) => handleDeleteTask(task)}
				onEdit={(taskForEdit: any) => handleEditTaskClick(task)}
				theme={{
					accentColor: "#f59e0b",
					hoverColor: "hover:bg-amber-50 dark:hover:bg-amber-900/20",
				}}
				borderColor="#f59e0b"
			/>
		);
	};

	return (
		<div className="min-h-screen new-year-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Decorations Checklist"
				backHref="/new-year"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort decorations"
				error={error}
			/>

			<main className="w-full max-w-md flex flex-col gap-6">
				<AddButton
					title="Decoration"
					onClick={() => setShowFormModal(true)}
					color="orange"
				/>

				<TaskSection
					title="Incomplete"
					items={incompleteDecorations}
					isCompleted={false}
					emptyMessage="All decorations completed! 🎉"
					completedMessage=""
					renderItem={renderTaskItem}
				/>

				<TaskSection
					title="Completed"
					items={completedDecorations}
					isCompleted={true}
					emptyMessage="No completed decorations yet."
					completedMessage="No completed decorations yet."
					renderItem={renderTaskItem}
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
						{ value: "none", label: "No Sorting" },
						{ value: "priority", label: "Sort by Priority" },
						{ value: "dueDate", label: "Sort by Due Date" },
						{ value: "title", label: "Sort by Title" },
					]}
					title="Sort Decorations"
				/>

				{/* Form Modal for Adding */}
				<FormModal
					isOpen={showFormModal}
					title="Add New Decoration"
					fields={formFields}
					onSubmit={handleAddTask}
					onClose={() => setShowFormModal(false)}
					submitText="Add Decoration"
					submitButtonColor="#f59e0b"
				/>

				{/* Form Modal for Editing */}
				<FormModal
					isOpen={showEditModal}
					title="Edit Decoration"
					fields={editFormFields}
					initialValues={
						selectedTask
							? {
									title: selectedTask.title,
									description: selectedTask.description || "",
									priority: selectedTask.priority,
									dueDate: selectedTask.dueDate || "",
									notes: selectedTask.notes || "",
									isCompleted: selectedTask.isCompleted,
							  }
							: {}
					}
					onSubmit={handleEditTask}
					onClose={() => {
						setShowEditModal(false);
						setSelectedTask(null);
					}}
					submitText="Save Changes"
					submitButtonColor="#f59e0b"
				/>

				{/* Delete Modal */}
				<DeleteModal
					isOpen={showDeleteModal}
					title="Delete Decoration"
					message="Are you sure you want to delete this decoration? This action cannot be undone."
					itemName={taskToDelete?.title}
					onConfirm={confirmDelete}
					onCancel={() => {
						setShowDeleteModal(false);
						setTaskToDelete(null);
					}}
					confirmText="Delete"
					confirmButtonColor="#ef4444"
				/>
			</main>

			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
