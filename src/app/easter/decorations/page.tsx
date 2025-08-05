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
import ToDoCard from "@/components/cards/to-do/ToDoCard";
import EditTaskModal from "@/components/modals/EditTaskModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";

export default function EasterDecorationsPage() {
	const dispatch = useAppDispatch();
	const tasks = useAppSelector((state) => state.easterTasks.tasks);
	const error = useAppSelector((state) => state.easterTasks.error);
	const loading = useAppSelector((state) => state.easterTasks.loading);

	// Filter tasks for Decorations category
	const decorationTasks = tasks.filter(
		(task) => task.category === "Decorations"
	);

	const [editingTask, setEditingTask] = useState<any>(null);
	const [showAddForm, setShowAddForm] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [taskToDelete, setTaskToDelete] = useState<any>(null);

	// Convert EasterTask to Task format for ToDoCard
	const convertEasterTaskToTask = (easterTask: any) => ({
		...easterTask,
		assignedTo: undefined, // EasterTask doesn't have assignedTo
		category: easterTask.category || "Decorations",
	});

	useEffect(() => {
		dispatch(fetchEasterTasks());
	}, [dispatch]);

	const handleToggleCompletion = async (taskId: string) => {
		await dispatch(toggleEasterTaskCompletion(taskId));
	};

	const handleDeleteTask = async (taskId: string) => {
		await dispatch(deleteEasterTask(taskId));
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

	const handleEditTask = (task: any) => {
		setEditingTask(task);
	};

	const handleSaveEdit = async (updatedTask: any) => {
		if (editingTask) {
			await dispatch(updateEasterTask({ ...editingTask, ...updatedTask }));
			setEditingTask(null);
		}
	};

	const handleCloseEdit = () => {
		setEditingTask(null);
	};

	return (
		<div className="min-h-screen easter-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Easter Decorations"
				backHref="/easter"
				error={error}
			/>

			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<AddButton
					title="Decoration Item"
					onClick={() => setShowAddForm(true)}
					color="purple"
				/>

				<TaskSection
					title="Incomplete"
					items={decorationTasks.filter((task) => !task.isCompleted)}
					isCompleted={false}
					emptyMessage="All decoration items completed! 🎉"
					completedMessage=""
					renderItem={(task) => (
						<ToDoCard
							key={task.id}
							task={convertEasterTaskToTask(task)}
							onToggleComplete={handleToggleCompletion}
							onDelete={handleDelete}
							onEdit={handleEditTask}
						/>
					)}
					cardClassName="card-tasks"
				/>

				<TaskSection
					title="Completed"
					items={decorationTasks.filter((task) => task.isCompleted)}
					isCompleted={true}
					emptyMessage="No completed decoration items yet."
					completedMessage=""
					renderItem={(task) => (
						<ToDoCard
							key={task.id}
							task={convertEasterTaskToTask(task)}
							onToggleComplete={handleToggleCompletion}
							onDelete={handleDelete}
							onEdit={handleEditTask}
							className="opacity-60"
						/>
					)}
					cardClassName="card-tasks"
				/>
			</main>

			{/* Edit Task Modal */}
			<EditTaskModal
				isOpen={editingTask !== null}
				task={editingTask ? convertEasterTaskToTask(editingTask) : null}
				onClose={handleCloseEdit}
				onSave={handleSaveEdit}
				loading={loading}
			/>

			{/* Form Modal for adding new tasks */}
			<FormModal
				isOpen={showAddForm}
				title="Add New Decoration Item"
				fields={[
					{
						id: "title",
						type: "text" as const,
						placeholder: "Item Name*",
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
				initialValues={{ priority: "medium", category: "Decorations" }}
				onSubmit={async (values) => {
					await dispatch(
						addEasterTask({
							...values,
							isCompleted: false,
							category: "Decorations",
							title: values.title || "",
							priority: values.priority || "medium",
						})
					);
					setShowAddForm(false);
				}}
				onClose={() => setShowAddForm(false)}
				loading={loading}
				submitText="Add Item"
				cardClassName="card-tasks"
				submitButtonColor="#a855f7"
			/>

			{/* Delete Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				title="Delete Decoration Item"
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
