"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchFourthOfJulyTasks,
	addFourthOfJulyTask,
	updateFourthOfJulyTask,
	deleteFourthOfJulyTask,
	toggleFourthOfJulyTaskCompletion,
} from "@/store/slices/fourth-of-july/fourthOfJulyTasksSlice";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import ToDoCard from "@/components/cards/to-do/ToDoCard";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import { EventItems } from "@/components/cards/event";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import SortModal from "@/components/modals/SortModal";

export default function FourthOfJulyEventsPage() {
	const dispatch = useAppDispatch();
	const tasks = useAppSelector((state) => state.fourthOfJulyTasks.tasks);
	const error = useAppSelector((state) => state.fourthOfJulyTasks.error);
	const loading = useAppSelector((state) => state.fourthOfJulyTasks.loading);

	// Filter tasks for Events category
	const eventTasks = tasks.filter((task) => task.category === "Events");

	const [showAddForm, setShowAddForm] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [taskToDelete, setTaskToDelete] = useState<any>(null);
	const [showSortModal, setShowSortModal] = useState(false);
	const [sortBy, setSortBy] = useState<string>("dateCreated");

	// Sort options for events
	const sortOptions = [
		{ value: "dateCreated", label: "Date Created" },
		{ value: "title", label: "Title A-Z" },
		{ value: "priority", label: "Priority" },
		{ value: "dueDate", label: "Due Date" },
	];

	// Sort function
	const sortTasks = (tasks: any[], sortOption: string) => {
		const sortedTasks = [...tasks];
		switch (sortOption) {
			case "title":
				return sortedTasks.sort((a, b) => a.title.localeCompare(b.title));
			case "priority":
				const priorityOrder = { high: 3, medium: 2, low: 1 };
				return sortedTasks.sort(
					(a, b) =>
						(priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
						(priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
				);
			case "dueDate":
				return sortedTasks.sort((a, b) => {
					if (!a.dueDate && !b.dueDate) return 0;
					if (!a.dueDate) return 1;
					if (!b.dueDate) return -1;
					return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
				});
			case "dateCreated":
			default:
				return sortedTasks.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
		}
	};

	const sortedEventTasks = sortTasks(eventTasks, sortBy);

	useEffect(() => {
		dispatch(fetchFourthOfJulyTasks());
	}, [dispatch]);

	const handleSubmit = async (values: Record<string, any>) => {
		if (editingTask) {
			await dispatch(updateFourthOfJulyTask({ ...editingTask, ...values }));
			setEditingTask(null);
		} else {
			await dispatch(
				addFourthOfJulyTask({
					...values,
					isCompleted: false,
					category: "Events",
					title: values.title || "",
					priority: values.priority || "medium",
				})
			);
		}
		setShowAddForm(false);
	};

	const handleEdit = (task: any) => {
		setEditingTask(task);
		setShowAddForm(true);
	};

	const handleDelete = (task: any) => {
		setTaskToDelete(task);
		setShowDeleteModal(true);
	};

	const confirmDelete = async () => {
		if (taskToDelete) {
			await dispatch(deleteFourthOfJulyTask(taskToDelete.id));
			setTaskToDelete(null);
		}
		setShowDeleteModal(false);
	};

	const handleToggleCompletion = async (taskId: string) => {
		await dispatch(toggleFourthOfJulyTaskCompletion(taskId));
	};

	const handleSortChange = (sortOption: string) => {
		setSortBy(sortOption);
	};

	return (
		<div className="min-h-screen fourth-of-july-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Fourth of July Events"
				backHref="/fourth-of-july"
				error={error}
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort Events"
			/>

			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<AddButton
					title="Event"
					onClick={() => setShowAddForm(true)}
					color="red"
				/>

				<TaskSection
					title="Incomplete"
					items={sortedEventTasks.filter((task) => !task.isCompleted)}
					isCompleted={false}
					emptyMessage="All events completed! 🎉"
					completedMessage=""
					renderItem={(task) => (
						<EventItems
							key={task.id}
							task={task}
							onToggleTask={handleToggleCompletion}
							onDeleteTask={handleDelete}
							loading={loading}
							themeColor="red"
						/>
					)}
				/>

				<TaskSection
					title="Completed"
					items={sortedEventTasks.filter((task) => task.isCompleted)}
					isCompleted={true}
					emptyMessage="No completed events yet."
					completedMessage="No completed events yet."
					renderItem={(task) => (
						<EventItems
							key={task.id}
							task={task}
							onToggleTask={handleToggleCompletion}
							onDeleteTask={handleDelete}
							loading={loading}
							themeColor="red"
						/>
					)}
				/>
			</main>

			{/* Sort Modal */}
			<SortModal
				isOpen={showSortModal}
				onClose={() => setShowSortModal(false)}
				sortBy={sortBy}
				onSortChange={handleSortChange}
				sortOptions={sortOptions}
				title="Sort Events"
			/>

			{/* Form Modal */}
			<FormModal
				isOpen={showAddForm}
				title={editingTask ? "Edit Event" : "Add New Event"}
				fields={[
					{
						id: "title",
						type: "text" as const,
						placeholder: "Event Title*",
						required: true,
					},
					{
						id: "description",
						type: "textarea" as const,
						placeholder: "Description",
						rows: 3,
					},
					{
						id: "priority",
						type: "select" as const,
						placeholder: "Priority",
						options: [
							{ value: "low", label: "Low Priority" },
							{ value: "medium", label: "Medium Priority" },
							{ value: "high", label: "High Priority" },
						],
					},
					{ id: "dueDate", type: "date" as const, placeholder: "Due Date" },
					{
						id: "notes",
						type: "textarea" as const,
						placeholder: "Notes",
						rows: 2,
					},
				]}
				initialValues={
					editingTask
						? {
								title: editingTask.title,
								description: editingTask.description || "",
								priority: editingTask.priority,
								dueDate: editingTask.dueDate
									? editingTask.dueDate.split("T")[0]
									: "",
								notes: editingTask.notes || "",
						  }
						: { priority: "medium", category: "Events" }
				}
				onSubmit={handleSubmit}
				onClose={() => {
					setShowAddForm(false);
					setEditingTask(null);
				}}
				loading={loading}
				submitText={editingTask ? "Update Event" : "Add Event"}
				cardClassName="card-events-fourth-of-july"
				submitButtonColor="#dc2626"
			/>

			{/* Delete Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				title="Delete Event"
				itemName={taskToDelete?.title}
				onConfirm={confirmDelete}
				onCancel={() => {
					setShowDeleteModal(false);
					setTaskToDelete(null);
				}}
				loading={loading}
				cardClassName="card-events-fourth-of-july"
				confirmButtonColor="#dc2626"
			/>
		</div>
	);
}
