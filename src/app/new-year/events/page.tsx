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
import SortModal from "@/components/modals/SortModal";
import DeleteModal from "@/components/modals/DeleteModal";
import FormModal from "@/components/modals/FormModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";

type SortOption = "priority" | "dueDate" | "title" | "none";

export default function NewYearEventsPage() {
	const dispatch = useAppDispatch();
	const { tasks, loading, error, initialized } = useAppSelector(
		(state: any) => state.newYearTasks
	);

	const [form, setForm] = useState({
		title: "",
		description: "",
		priority: "medium" as "low" | "medium" | "high",
		dueDate: "",
		notes: "",
	});
	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		taskId: string | null;
	}>({
		show: false,
		taskId: null,
	});
	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);

	useEffect(() => {
		if (!initialized) {
			dispatch(fetchNewYearTasks());
		}
	}, [dispatch, initialized]);

	// Filter tasks by "Events" category
	const events = tasks.filter(
		(task: NewYearTask) => task.category === "Events"
	);

	function handleAddTask(values: Record<string, any>) {
		const newTask: Omit<NewYearTask, "id" | "createdAt" | "updatedAt"> = {
			title: values.title,
			description: values.description || undefined,
			isCompleted: false,
			priority: values.priority,
			category: "Events",
			dueDate: values.dueDate || undefined,
			notes: values.notes || undefined,
		};

		dispatch(addNewYearTask(newTask));
		setShowForm(false);
	}

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
	}

	function handleToggleTask(taskId: string) {
		dispatch(toggleNewYearTaskCompletion(taskId));
	}

	function handleDeleteTask(taskId: string) {
		setDeleteConfirm({ show: true, taskId });
	}

	function confirmDelete() {
		if (deleteConfirm.taskId) {
			dispatch(deleteNewYearTask(deleteConfirm.taskId));
			setDeleteConfirm({ show: false, taskId: null });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, taskId: null });
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
					<p className="text-gray-600 dark:text-gray-300">Loading events...</p>
				</div>
			</div>
		);
	}

	const sortedEvents = sortTasks(events);
	const incompleteEvents = sortedEvents.filter(
		(task: NewYearTask) => !task.isCompleted
	);
	const completedEvents = sortedEvents.filter(
		(task: NewYearTask) => task.isCompleted
	);

	const formFields = [
		{
			id: "title",
			type: "text" as const,
			label: "Event Title",
			placeholder: "Enter event title",
			required: true,
		},
		{
			id: "description",
			type: "textarea" as const,
			label: "Description",
			placeholder: "Enter event description",
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
			label: "Event Date",
		},
		{
			id: "notes",
			type: "textarea" as const,
			label: "Notes",
			placeholder: "Additional notes",
			rows: 2,
		},
	];

	const renderEventItem = (task: NewYearTask) => (
		<li
			key={task.id}
			className="flex items-center px-4 py-3 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20"
			onClick={() => handleToggleTask(task.id)}
		>
			<input
				type="checkbox"
				checked={task.isCompleted}
				readOnly
				className="mr-3 accent-amber-500"
			/>
			<div className="flex-1">
				<div
					className={`text-gray-900 dark:text-white ${
						task.isCompleted ? "line-through" : ""
					}`}
				>
					{task.title}
				</div>
				{task.description && (
					<div
						className={`text-sm text-gray-600 dark:text-gray-300 ${
							task.isCompleted ? "line-through" : ""
						}`}
					>
						{task.description}
					</div>
				)}
				<div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
					<span
						className={`px-2 py-1 rounded ${
							task.priority === "high"
								? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
								: task.priority === "medium"
								? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
								: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
						}`}
					>
						{task.priority}
					</span>
					{task.dueDate && (
						<span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
					)}
				</div>
			</div>
			<button
				onClick={(e) => {
					e.stopPropagation();
					handleDeleteTask(task.id);
				}}
				className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2"
				title="Delete event"
			>
				×
			</button>
		</li>
	);

	return (
		<div className="min-h-screen new-year-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Events"
				backHref="/new-year"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort events"
				error={error}
			/>

			<main className="w-full max-w-4xl flex flex-col gap-6">
				<AddButton title="Event" onClick={openForm} color="orange" />

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
					items={incompleteEvents}
					isCompleted={false}
					emptyMessage="All events completed! 🎉"
					completedMessage=""
					renderItem={renderEventItem}
					cardClassName="card-events-new-year"
				/>

				<TaskSection
					title="Completed"
					items={completedEvents}
					isCompleted={true}
					emptyMessage="No completed events yet."
					completedMessage="No completed events yet."
					renderItem={renderEventItem}
					cardClassName="card-events-new-year"
				/>

				{/* Form Modal */}
				<FormModal
					isOpen={showForm}
					title="Add New Event"
					fields={formFields}
					onSubmit={handleAddTask}
					onClose={closeForm}
					submitText="Add Event"
					cancelText="Cancel"
					cardClassName="card card-events-new-year"
					submitButtonColor="#f97316"
				/>

				{/* Delete Confirmation Modal */}
				<DeleteModal
					isOpen={deleteConfirm.show}
					title="Delete Event"
					message="Are you sure you want to delete this event? This action cannot be undone."
					onConfirm={confirmDelete}
					onCancel={cancelDelete}
					confirmText="Delete"
					cancelText="Cancel"
					cardClassName="card card-events-new-year"
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
					title="Sort Events"
				/>
			</main>

			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
