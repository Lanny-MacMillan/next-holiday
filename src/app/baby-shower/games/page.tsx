"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchBabyShowerTasks,
	addBabyShowerTask,
	updateBabyShowerTask,
	deleteBabyShowerTask,
	toggleBabyShowerTaskCompletion,
} from "@/store/slices/baby-shower/babyShowerTasksSlice";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import ToDoCard from "@/components/cards/to-do/ToDoCard";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import SortModal from "@/components/modals/SortModal";

export default function BabyShowerGamesPage() {
	const dispatch = useAppDispatch();
	const tasks = useAppSelector((state) => state.babyShowerTasks.tasks);
	const error = useAppSelector((state) => state.babyShowerTasks.error);
	const loading = useAppSelector((state) => state.babyShowerTasks.loading);

	// Filter tasks for Games category
	const gameTasks = tasks.filter((task) => task.category === "Games");

	const [showAddForm, setShowAddForm] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [taskToDelete, setTaskToDelete] = useState<any>(null);
	const [showSortModal, setShowSortModal] = useState(false);
	const [sortBy, setSortBy] = useState<string>("dateCreated");

	// Sort options for games
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

	const sortedGameTasks = sortTasks(gameTasks, sortBy);

	useEffect(() => {
		dispatch(fetchBabyShowerTasks());
	}, [dispatch]);

	const handleSubmit = async (values: Record<string, any>) => {
		if (editingTask) {
			await dispatch(updateBabyShowerTask({ ...editingTask, ...values }));
			setEditingTask(null);
		} else {
			await dispatch(
				addBabyShowerTask({
					...values,
					isCompleted: false,
					category: "Games",
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

	const handleDelete = (taskOrId: any) => {
		// Handle both task object and task ID
		const task =
			typeof taskOrId === "string"
				? tasks.find((t) => t.id === taskOrId)
				: taskOrId;

		if (task) {
			setTaskToDelete(task);
			setShowDeleteModal(true);
		}
	};

	const confirmDelete = async () => {
		if (taskToDelete) {
			await dispatch(deleteBabyShowerTask(taskToDelete.id));
			setTaskToDelete(null);
		}
		setShowDeleteModal(false);
	};

	const handleToggleCompletion = async (taskId: string) => {
		await dispatch(toggleBabyShowerTaskCompletion(taskId));
	};

	const handleSortChange = (sortOption: string) => {
		setSortBy(sortOption);
	};

	return (
		<div className="min-h-screen baby-shower-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Baby Shower Games"
				backHref="/baby-shower"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort Games"
				description="Plan your baby shower games with style!"
				holidayColor="cyan-500"
				error={error}
			/>

			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<AddButton
					title="Game"
					onClick={() => setShowAddForm(true)}
					color="cyan"
				/>

				<TaskSection
					title="Incomplete"
					items={sortedGameTasks.filter((task) => !task.isCompleted)}
					isCompleted={false}
					emptyMessage="All games completed! 🎉"
					completedMessage=""
					renderItem={(task) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleCompletion}
							onDelete={handleDelete}
							onEdit={handleEdit}
							gamifiedBackgroundColor="bg-gradient-to-br from-cyan-300 to-cyan-500"
							disableInternalModal={true}
						/>
					)}
				/>

				<TaskSection
					title="Completed"
					items={sortedGameTasks.filter((task) => task.isCompleted)}
					isCompleted={true}
					emptyMessage="No completed games yet."
					completedMessage="No completed games yet."
					renderItem={(task) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleCompletion}
							onDelete={handleDelete}
							onEdit={handleEdit}
							className="opacity-60"
							gamifiedBackgroundColor="bg-gradient-to-br from-cyan-300 to-cyan-500"
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
				title="Sort Games"
			/>

			{/* Form Modal */}
			<FormModal
				isOpen={showAddForm}
				title={editingTask ? "Edit Game" : "Add New Game"}
				fields={[
					{
						id: "title",
						type: "text" as const,
						placeholder: "Game Title*",
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
						: { priority: "medium", category: "Games" }
				}
				onSubmit={handleSubmit}
				onClose={() => {
					setShowAddForm(false);
					setEditingTask(null);
				}}
				loading={loading}
				submitText={editingTask ? "Update Game" : "Add Game"}
				cardClassName="card"
				submitButtonColor="#06b6d4"
			/>

			{/* Delete Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				title="Delete Game"
				itemName={taskToDelete?.title}
				onConfirm={confirmDelete}
				onCancel={() => {
					setShowDeleteModal(false);
					setTaskToDelete(null);
				}}
				loading={loading}
				cardClassName="card"
				confirmButtonColor="#06b6d4"
			/>
		</div>
	);
}
