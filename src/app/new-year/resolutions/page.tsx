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
} from "@/store/slices/new-year/newYearTasksSlice";
import { Task } from "@/store/slices/tasksSlice";
import SortModal from "@/components/modals/SortModal";
import DeleteModal from "@/components/modals/DeleteModal";
import EditTaskModal from "@/components/modals/EditTaskModal";
import FormModal from "@/components/modals/FormModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import ToDoCard from "@/components/cards/to-do/ToDoCard";

type SortOption = "priority" | "dueDate" | "title" | "none";

export default function NewYearResolutionsPage() {
	const dispatch = useAppDispatch();
	const { tasks, loading, error, initialized } = useAppSelector(
		(state: any) => state.newYearTasks
	);

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [editingTask, setEditingTask] = useState<NewYearTask | null>(null);
	const [deleteTask, setDeleteTask] = useState<NewYearTask | null>(null);

	useEffect(() => {
		if (!initialized) {
			dispatch(fetchNewYearTasks());
		}
	}, [dispatch, initialized]);

	// Filter tasks by "Resolutions" category
	const resolutions = tasks.filter(
		(task: NewYearTask) => task.category === "Resolutions"
	);

	function handleAddTask(values: Record<string, any>) {
		const newTask: Omit<NewYearTask, "id" | "createdAt" | "updatedAt"> = {
			title: values.title,
			description: values.description || undefined,
			isCompleted: false,
			priority: values.priority || "medium",
			category: "Resolutions",
			dueDate: values.dueDate || undefined,
			notes: values.notes || undefined,
		};

		dispatch(addNewYearTask(newTask));
		setShowForm(false);
	}

	function handleEditTask(task: NewYearTask) {
		setEditingTask(task);
	}

	function handleSaveEditTask(
		updatedTask: Omit<Task, "id" | "createdAt" | "updatedAt">
	) {
		if (editingTask) {
			// Convert Task to NewYearTask format
			const newYearTaskUpdate: NewYearTask = {
				id: editingTask.id,
				title: updatedTask.title,
				description: updatedTask.description,
				isCompleted: updatedTask.isCompleted,
				priority: updatedTask.priority,
				category: updatedTask.category || "Resolutions",
				dueDate: updatedTask.dueDate,
				notes: editingTask.notes, // Keep existing notes
				completedDate: updatedTask.completedDate,
				createdAt: editingTask.createdAt,
				updatedAt: new Date().toISOString(),
			};
			dispatch(updateNewYearTask(newYearTaskUpdate));
			setEditingTask(null);
		}
	}

	function handleDeleteTask(taskId: string) {
		const task = resolutions.find((t: NewYearTask) => t.id === taskId);
		if (task) {
			setDeleteTask(task);
		}
	}

	function confirmDelete() {
		if (deleteTask) {
			dispatch(deleteNewYearTask(deleteTask.id));
			setDeleteTask(null);
		}
	}

	function handleToggleTask(taskId: string) {
		dispatch(toggleNewYearTaskCompletion(taskId));
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

	if (loading && !initialized) {
		return (
			<div className="min-h-screen new-year-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading resolutions...
					</p>
				</div>
			</div>
		);
	}

	const sortedResolutions = sortTasks(resolutions);
	const incompleteResolutions = sortedResolutions.filter(
		(task: NewYearTask) => !task.isCompleted
	);
	const completedResolutions = sortedResolutions.filter(
		(task: NewYearTask) => task.isCompleted
	);

	const formFields = [
		{
			id: "title",
			type: "text" as const,
			label: "Resolution Title",
			placeholder: "Enter your resolution",
			required: true,
		},
		{
			id: "description",
			type: "textarea" as const,
			label: "Description",
			placeholder: "Describe your resolution",
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
			placeholder: "Additional notes",
			rows: 2,
		},
	];

	const renderToDoCard = (task: NewYearTask) => {
		// Convert NewYearTask to Task format for ToDoCard
		const taskForCard: Task = {
			id: task.id,
			title: task.title,
			description: task.description,
			priority: task.priority,
			isCompleted: task.isCompleted,
			completedDate: task.completedDate,
			dueDate: task.dueDate,
			category: task.category,
			createdAt: task.createdAt,
			updatedAt: task.updatedAt,
		};

		return (
			<ToDoCard
				key={task.id}
				task={taskForCard}
				onToggleComplete={handleToggleTask}
				onDelete={handleDeleteTask}
				onEdit={(taskForEdit: Task) => {
					// Convert back to NewYearTask for editing
					const newYearTask: NewYearTask = {
						id: taskForEdit.id,
						title: taskForEdit.title,
						description: taskForEdit.description,
						priority: taskForEdit.priority,
						isCompleted: taskForEdit.isCompleted,
						completedDate: taskForEdit.completedDate,
						dueDate: taskForEdit.dueDate,
						category: taskForEdit.category || "Resolutions",
						notes: task.notes, // Keep original notes
						createdAt: taskForEdit.createdAt,
						updatedAt: taskForEdit.updatedAt,
					};
					handleEditTask(newYearTask);
				}}
				theme={{ accentColor: "#f59e0b" }}
				borderColor="#f59e0b"
			/>
		);
	};

	return (
		<div className="min-h-screen new-year-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Resolution Tracker"
				backHref="/new-year"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort resolutions"
				error={error}
			/>

			<main className="w-full max-w-4xl flex flex-col gap-6">
				<AddButton
					title="Resolution"
					onClick={() => setShowForm(true)}
					color="orange"
				/>

				<div className="flex items-center justify-center">
					{sortBy !== "none" && (
						<div className="text-center text-sm text-gray-600 dark:text-gray-400">
							{sortBy === "priority" && "Sorted by Priority"}
							{sortBy === "dueDate" && "Sorted by Due Date"}
							{sortBy === "title" && "Sorted by Title"}
						</div>
					)}
				</div>

				<TaskSection
					title="Incomplete"
					items={incompleteResolutions}
					isCompleted={false}
					emptyMessage="All resolutions completed! 🎉"
					completedMessage=""
					renderItem={renderToDoCard}
				/>

				<TaskSection
					title="Completed"
					items={completedResolutions}
					isCompleted={true}
					emptyMessage=""
					completedMessage="No completed resolutions yet"
					renderItem={renderToDoCard}
				/>

				{/* Form Modal */}
				<FormModal
					isOpen={showForm}
					title="Add New Resolution"
					fields={formFields}
					onSubmit={handleAddTask}
					onClose={() => setShowForm(false)}
					loading={loading}
					submitText="Add Resolution"
					submitButtonColor="#f59e0b"
				/>

				{/* Edit Task Modal */}
				<EditTaskModal
					isOpen={!!editingTask}
					task={editingTask}
					onClose={() => setEditingTask(null)}
					onSave={handleSaveEditTask}
					loading={loading}
				/>

				{/* Delete Modal */}
				<DeleteModal
					isOpen={!!deleteTask}
					title="Delete Resolution"
					message="Are you sure you want to delete this resolution? This action cannot be undone."
					itemName={deleteTask?.title}
					onConfirm={confirmDelete}
					onCancel={() => setDeleteTask(null)}
					loading={loading}
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
						{ value: "none", label: "No Sorting" },
						{ value: "priority", label: "Sort by Priority" },
						{ value: "dueDate", label: "Sort by Due Date" },
						{ value: "title", label: "Sort by Title" },
					]}
					title="Sort Resolutions"
				/>
			</main>

			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
