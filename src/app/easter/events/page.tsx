"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchEasterTasks,
	addEasterTask,
	updateEasterTask,
	deleteEasterTask,
	toggleEasterTaskCompletion,
	clearEasterTaskError,
} from "@/store/slices/easterTasksSlice";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import ToDoCard from "@/components/cards/to-do/ToDoCard";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";

export default function EasterEventsPage() {
	const dispatch = useAppDispatch();
	const tasks = useAppSelector((state) => state.easterTasks.tasks);
	const error = useAppSelector((state) => state.easterTasks.error);
	const loading = useAppSelector((state) => state.easterTasks.loading);

	// Filter tasks for Events category
	const eventTasks = tasks.filter((task) => task.category === "Events");

	const [showAddForm, setShowAddForm] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [taskToDelete, setTaskToDelete] = useState<any>(null);

	useEffect(() => {
		dispatch(fetchEasterTasks());
	}, [dispatch]);

	const handleSubmit = async (values: Record<string, any>) => {
		if (editingTask) {
			await dispatch(updateEasterTask({ ...editingTask, ...values }));
			setEditingTask(null);
		} else {
			await dispatch(
				addEasterTask({
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
			await dispatch(deleteEasterTask(taskToDelete.id));
			setTaskToDelete(null);
		}
		setShowDeleteModal(false);
	};

	const handleToggleCompletion = async (taskId: string) => {
		await dispatch(toggleEasterTaskCompletion(taskId));
	};

	return (
		<div className="min-h-screen easter-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Easter Events"
				backHref="/easter"
				error={error}
			/>

			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<AddButton
					title="Event"
					onClick={() => setShowAddForm(true)}
					color="purple"
				/>

				<TaskSection
					title="Incomplete"
					items={eventTasks.filter((task) => !task.isCompleted)}
					isCompleted={false}
					emptyMessage="All events completed! 🎉"
					completedMessage=""
					renderItem={(task) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleCompletion}
							onDelete={handleDelete}
							onEdit={handleEdit}
						/>
					)}
					cardClassName="card-tasks"
				/>

				<TaskSection
					title="Completed"
					items={eventTasks.filter((task) => task.isCompleted)}
					isCompleted={true}
					emptyMessage="No completed events yet."
					completedMessage=""
					renderItem={(task) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleCompletion}
							onDelete={handleDelete}
							onEdit={handleEdit}
							className="opacity-60"
						/>
					)}
					cardClassName="card-tasks"
				/>
			</main>

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
				cardClassName="card-tasks"
				submitButtonColor="#a855f7"
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
				cardClassName="card-tasks"
				confirmButtonColor="#a855f7"
			/>
		</div>
	);
}
