"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	selectHolidayPreferences,
	selectHomeInitialized,
	selectHomeData,
} from "@/store/selectors/home";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";
import { getHolidayDataFromRedux } from "@/utils/holidayData";
import {
	updateTaskInHomeData,
	addTaskToHomeData,
	removeTaskFromHomeData,
} from "@/store/slices/homeSlice";
import { useBabyShowerGamesMutations } from "@/hooks/useBabyShowerGamesMutations";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import ToDoCard from "@/components/cards/to-do/ToDoCard";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import SortModal from "@/components/modals/SortModal";

export default function BabyShowerGamesPage() {
	const dispatch = useAppDispatch();

	// Get current Redux state for skip logic
	const currentState = useAppSelector((state: any) => state);

	const {
		holidayId,
		auth0User,
		babyShowerGames,
		loading,
		error,
		initialized,
		createBabyShowerGames,
		updateBabyShowerGames,
		editBabyShowerGames,
		deleteBabyShowerGames,
	} = useBabyShowerGamesMutations();

	// Get home data and holiday data from Redux
	const homeData = useAppSelector(selectHomeData);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const holidayData = getHolidayDataFromRedux(holidayId, currentState);

	// Helper function to update Redux state after task operations
	const updateTaskInRedux = (
		taskData: any,
		operation: "add" | "update" | "delete"
	) => {
		if (!holidayId) return;

		switch (operation) {
			case "add":
				dispatch(addTaskToHomeData({ holidayId, task: taskData }));
				break;
			case "update":
				dispatch(
					updateTaskInHomeData({
						holidayId,
						taskId: taskData.id,
						updates: taskData,
					})
				);
				break;
			case "delete":
				dispatch(removeTaskFromHomeData({ holidayId, taskId: taskData.id }));
				break;
		}
	};

	// Use Redux data for tasks instead of the hook's data
	const allTasks = holidayData?.tasks || [];
	const gameTasks = allTasks.filter((task) => task.category === "Games");

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

	const handleSubmit = async (values: Record<string, any>) => {
		try {
			if (editingTask) {
				const result = await editBabyShowerGames({
					holidayId: holidayId || "",
					taskId: editingTask.id,
					payload: values,
					auth0User,
				}).unwrap();

				// Update Redux state directly for optimistic updates
				updateTaskInRedux(result, "update");

				setEditingTask(null);
			} else {
				const result = await createBabyShowerGames({
					holidayId: holidayId || "",
					payload: {
						...values,
						isCompleted: false,
						category: "Games",
						title: values.title || "",
						priority: values.priority || "medium",
					},
					auth0User,
				}).unwrap();

				// Update Redux state directly for optimistic updates
				updateTaskInRedux(result, "add");
			}
			setShowAddForm(false);
		} catch (error) {
			console.error("Error saving game:", error);
		}
	};

	const handleEdit = (task: any) => {
		setEditingTask(task);
		setShowAddForm(true);
	};

	const handleDelete = (taskOrId: any) => {
		// Handle both task object and task ID
		const task =
			typeof taskOrId === "string"
				? gameTasks.find((t) => t.id === taskOrId)
				: taskOrId;

		if (task) {
			setTaskToDelete(task);
			setShowDeleteModal(true);
		}
	};

	const confirmDelete = async () => {
		if (taskToDelete) {
			try {
				// Optimistically update Redux state first
				updateTaskInRedux(taskToDelete, "delete");

				await deleteBabyShowerGames({
					holidayId: holidayId || "",
					taskId: taskToDelete.id,
					auth0User,
				}).unwrap();
				setTaskToDelete(null);
			} catch (error) {
				console.error("Error deleting game:", error);
			}
		}
		setShowDeleteModal(false);
	};

	const handleToggleCompletion = async (taskId: string) => {
		try {
			const task = gameTasks.find((t) => t.id === taskId);
			if (task) {
				const newIsCompleted = !task.isCompleted;

				// Optimistically update Redux state first
				updateTaskInRedux(
					{ id: taskId, isCompleted: newIsCompleted },
					"update"
				);

				await updateBabyShowerGames({
					holidayId: holidayId || "",
					taskId: taskId,
					isCompleted: newIsCompleted,
					auth0User,
				}).unwrap();
			}
		} catch (error) {
			console.error("Error updating game completion:", error);
		}
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
				error={error ? "An error occurred while loading games" : undefined}
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
