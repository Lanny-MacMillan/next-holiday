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
import ToDoCard from "@/components/cards/to-do/ToDoCard";
import EditTaskModal from "@/components/modals/EditTaskModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import SortModal from "@/components/modals/SortModal";

export default function FourthOfJulyDecorationsPage() {
	const dispatch = useAppDispatch();
	const tasks = useAppSelector((state) => state.fourthOfJulyTasks.tasks);
	const error = useAppSelector((state) => state.fourthOfJulyTasks.error);
	const loading = useAppSelector((state) => state.fourthOfJulyTasks.loading);

	// Filter tasks for Decorations category
	const decorationTasks = tasks.filter(
		(task) => task.category === "Decorations"
	);

	const [editingTask, setEditingTask] = useState<any>(null);
	const [showAddForm, setShowAddForm] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [taskToDelete, setTaskToDelete] = useState<any>(null);
	const [showSortModal, setShowSortModal] = useState(false);
	const [sortBy, setSortBy] = useState<string>("dateCreated");

	// Sort options for decorations
	const sortOptions = [
		{ value: "dateCreated", label: "Date Created" },
		{ value: "title", label: "Title A-Z" },
		{ value: "priority", label: "Priority" },
		{ value: "dueDate", label: "Due Date" },
	];

	// Sort function
	const sortDecorationTasks = (tasks: any[], sortOption: string) => {
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

	const sortedDecorationTasks = sortDecorationTasks(decorationTasks, sortBy);

	// Convert FourthOfJulyTask to Task format for ToDoCard
	const convertFourthOfJulyTaskToTask = (fourthOfJulyTask: any) => ({
		...fourthOfJulyTask,
		assignedTo: undefined, // FourthOfJulyTask doesn't have assignedTo
		category: fourthOfJulyTask.category || "Decorations",
	});

	useEffect(() => {
		dispatch(fetchFourthOfJulyTasks());
	}, [dispatch]);

	const handleToggleCompletion = async (taskId: string) => {
		await dispatch(toggleFourthOfJulyTaskCompletion(taskId));
	};

	const handleDeleteTask = async (taskId: string) => {
		await dispatch(deleteFourthOfJulyTask(taskId));
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

	const handleEditTask = (task: any) => {
		setEditingTask(task);
	};

	const handleSaveEdit = async (updatedTask: any) => {
		if (editingTask) {
			await dispatch(
				updateFourthOfJulyTask({ ...editingTask, ...updatedTask })
			);
			setEditingTask(null);
		}
	};

	const handleCloseEdit = () => {
		setEditingTask(null);
	};

	const handleSortChange = (sortOption: string) => {
		setSortBy(sortOption);
	};

	return (
		<div className="min-h-screen fourth-of-july-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Fourth of July Decorations"
				backHref="/fourth-of-july"
				error={error}
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort Decorations"
			/>

			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<AddButton
					title="Decoration Item"
					onClick={() => setShowAddForm(true)}
					color="red"
				/>

				<TaskSection
					title="Incomplete"
					items={sortedDecorationTasks.filter((task) => !task.isCompleted)}
					isCompleted={false}
					emptyMessage="All decoration items completed! 🎉"
					completedMessage=""
					renderItem={(task) => (
						<ToDoCard
							key={task.id}
							task={convertFourthOfJulyTaskToTask(task)}
							onToggleComplete={handleToggleCompletion}
							onDelete={handleDelete}
							onEdit={handleEditTask}
						/>
					)}
				/>

				<TaskSection
					title="Completed"
					items={sortedDecorationTasks.filter((task) => task.isCompleted)}
					isCompleted={true}
					emptyMessage="No completed decoration items yet."
					completedMessage="No completed decoration items yet."
					renderItem={(task) => (
						<ToDoCard
							key={task.id}
							task={convertFourthOfJulyTaskToTask(task)}
							onToggleComplete={handleToggleCompletion}
							onDelete={handleDelete}
							onEdit={handleEditTask}
							className="opacity-60"
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
				title="Sort Decorations"
			/>

			{/* Edit Task Modal */}
			<EditTaskModal
				isOpen={editingTask !== null}
				task={editingTask ? convertFourthOfJulyTaskToTask(editingTask) : null}
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
						addFourthOfJulyTask({
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
				submitButtonColor="#dc2626"
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
				confirmButtonColor="#dc2626"
			/>
		</div>
	);
}
