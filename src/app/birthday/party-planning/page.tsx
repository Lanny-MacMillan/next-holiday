"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchBirthdayTasks,
	addBirthdayTask,
	updateBirthdayTask,
	deleteBirthdayTask,
	toggleBirthdayTaskCompletion,
	clearBirthdayTaskError,
} from "@/store/slices/birthday/birthdayTasksSlice";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import ToDoCard from "@/components/cards/to-do/ToDoCard";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import SortModal from "@/components/modals/SortModal";

export default function BirthdayPartyPlanningPage() {
	const dispatch = useAppDispatch();
	const tasks = useAppSelector((state) => state.birthdayTasks.tasks);
	const error = useAppSelector((state) => state.birthdayTasks.error);
	const loading = useAppSelector((state) => state.birthdayTasks.loading);

	// Filter tasks for Party Planning category
	const partyPlanningTasks = tasks.filter(
		(task) => task.category === "Party Planning"
	);

	const [showAddForm, setShowAddForm] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [taskToDelete, setTaskToDelete] = useState<any>(null);
	const [showSortModal, setShowSortModal] = useState(false);
	const [sortBy, setSortBy] = useState<string>("dateCreated");

	// Sort options for party planning
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

	const sortedPartyPlanningTasks = sortTasks(partyPlanningTasks, sortBy);

	useEffect(() => {
		dispatch(fetchBirthdayTasks());
	}, [dispatch]);

	const handleSubmit = async (values: Record<string, any>) => {
		if (editingTask) {
			await dispatch(updateBirthdayTask({ ...editingTask, ...values }));
			setEditingTask(null);
		} else {
			await dispatch(
				addBirthdayTask({
					...values,
					isCompleted: false,
					category: "Party Planning",
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
				? partyPlanningTasks.find((t) => t.id === taskOrId)
				: taskOrId;

		if (task) {
			setTaskToDelete(task);
			setShowDeleteModal(true);
		}
	};

	const confirmDelete = async () => {
		if (taskToDelete) {
			await dispatch(deleteBirthdayTask(taskToDelete.id));
			setTaskToDelete(null);
		}
		setShowDeleteModal(false);
	};

	const handleToggleCompletion = async (taskId: string) => {
		await dispatch(toggleBirthdayTaskCompletion(taskId));
	};

	const handleSortChange = (sortOption: string) => {
		setSortBy(sortOption);
	};

	return (
		<div className="min-h-screen birthday-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Party Planning"
				backHref="/birthday"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort Party Planning"
				description="Plan your birthday party with style!"
				holidayColor="yellow-500"
				error={error}
			/>

			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<AddButton
					title="Task"
					onClick={() => setShowAddForm(true)}
					color="amber"
				/>

				<TaskSection
					title="Incomplete"
					items={sortedPartyPlanningTasks.filter((task) => !task.isCompleted)}
					isCompleted={false}
					emptyMessage="All party planning tasks completed! 🎉"
					completedMessage=""
					renderItem={(task) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleCompletion}
							onDelete={handleDelete}
							onEdit={handleEdit}
							theme={{
								accentColor: "#f59e0b", // Amber for Birthday
							}}
							borderColor="rgb(var(--color-amber-500))" // Amber border for Birthday
							gamifiedBackgroundColor="bg-gradient-to-br from-yellow-300 to-yellow-500"
							disableInternalModal={true}
						/>
					)}
				/>

				<TaskSection
					title="Completed"
					items={sortedPartyPlanningTasks.filter((task) => task.isCompleted)}
					isCompleted={true}
					emptyMessage="No completed party planning tasks yet."
					completedMessage="No completed party planning tasks yet."
					renderItem={(task) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleCompletion}
							onDelete={handleDelete}
							onEdit={handleEdit}
							className="opacity-60"
							theme={{
								accentColor: "#f59e0b", // Amber for Birthday
							}}
							borderColor="rgb(var(--color-amber-500))" // Amber border for Birthday
							gamifiedBackgroundColor="bg-gradient-to-br from-yellow-300 to-yellow-500"
							disableInternalModal={true}
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
				title="Sort Party Planning"
			/>

			{/* Form Modal */}
			<FormModal
				isOpen={showAddForm}
				title={editingTask ? "Edit Task" : "Add New Task"}
				fields={[
					{
						id: "title",
						type: "text" as const,
						placeholder: "Task Title*",
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
						: { priority: "medium", category: "Party Planning" }
				}
				onSubmit={handleSubmit}
				onClose={() => {
					setShowAddForm(false);
					setEditingTask(null);
				}}
				loading={loading}
				submitText={editingTask ? "Update Task" : "Add Task"}
				cardClassName="card"
				submitButtonColor="#f59e0b"
			/>

			{/* Delete Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				title="Delete Task"
				itemName={taskToDelete?.title}
				onConfirm={confirmDelete}
				onCancel={() => {
					setShowDeleteModal(false);
					setTaskToDelete(null);
				}}
				loading={loading}
				cardClassName="card"
				confirmButtonColor="#f59e0b"
			/>
		</div>
	);
}
