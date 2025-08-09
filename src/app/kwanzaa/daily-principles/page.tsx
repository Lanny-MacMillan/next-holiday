"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchKwanzaaTasks,
	addKwanzaaTask,
	updateKwanzaaTask,
	deleteKwanzaaTask,
	toggleKwanzaaTaskCompletion,
	KwanzaaTask,
} from "@/store/slices/kwanzaa/kwanzaaTasksSlice";
import SortModal from "@/components/modals/SortModal";
import DeleteModal from "@/components/modals/DeleteModal";
import TaskSection from "@/components/common/TaskSection";
import EventItems from "@/components/cards/event/EventItems";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

export default function DailyPrinciplesPage() {
	const dispatch = useAppDispatch();
	const { tasks, loading, error, initialized } = useAppSelector(
		(state: any) => state.kwanzaaTasks
	);

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		taskId: string | null;
		taskTitle?: string;
	}>({
		show: false,
		taskId: null,
		taskTitle: "",
	});
	const [showSortModal, setShowSortModal] = useState(false);

	useEffect(() => {
		// Fetch tasks when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchKwanzaaTasks());
		}
	}, [dispatch, initialized]);

	function handleToggleTask(taskId: string) {
		dispatch(toggleKwanzaaTaskCompletion(taskId));
	}

	function handleDeleteTask(taskId: string, taskTitle?: string) {
		setDeleteConfirm({ show: true, taskId, taskTitle });
	}

	function confirmDelete() {
		if (deleteConfirm.taskId) {
			dispatch(deleteKwanzaaTask(deleteConfirm.taskId));
			setDeleteConfirm({ show: false, taskId: null, taskTitle: "" });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, taskId: null, taskTitle: "" });
	}

	function sortTasks(tasksToSort: KwanzaaTask[]): KwanzaaTask[] {
		switch (sortBy) {
			case "priority":
				const priorityOrder = { high: 3, medium: 2, low: 1 };
				return [...tasksToSort].sort(
					(a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
				);
			case "dateDue":
				return [...tasksToSort].sort((a, b) => {
					if (!a.dueDate && !b.dueDate) return 0;
					if (!a.dueDate) return 1;
					if (!b.dueDate) return -1;
					return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
				});
			case "assignedTo":
				return [...tasksToSort].sort((a, b) =>
					(a.assignedTo || "").localeCompare(b.assignedTo || "")
				);
			case "category":
				return [...tasksToSort].sort((a, b) =>
					(a.category || "").localeCompare(b.category || "")
				);
			default:
				return tasksToSort;
		}
	}

	if (loading && !initialized) {
		return (
			<div className="min-h-screen kwanzaa-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading daily principles...
					</p>
				</div>
			</div>
		);
	}

	const principleTasks = tasks.filter(
		(task: KwanzaaTask) => task.category === "Daily Principles"
	);
	const sortedTasks = sortTasks(principleTasks);
	const incompleteTasks = sortedTasks.filter(
		(task: KwanzaaTask) => !task.isCompleted
	);
	const completedTasks = sortedTasks.filter(
		(task: KwanzaaTask) => task.isCompleted
	);

	const renderTaskItem = (task: KwanzaaTask) => (
		<EventItems
			key={task.id}
			task={task}
			onToggleTask={handleToggleTask}
			onDeleteTask={handleDeleteTask}
			loading={loading}
			themeColor="red"
			holidayColor="bg-gradient-to-br from-red-400 to-red-600"
		/>
	);

	return (
		<div className="min-h-screen kwanzaa-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Daily Principles"
				backHref="/kwanzaa"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort gifts"
				description="Keep track of Daily Prinicles!"
				holidayColor="red-500"
				error={error}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				<div className="flex items-center justify-center">
					{sortBy !== "none" && (
						<div className="text-center text-sm text-gray-600 dark:text-gray-400">
							{sortBy === "priority" && "Sorted by Priority"}
							{sortBy === "dateDue" && "Sorted by Date Due"}
							{sortBy === "assignedTo" && "Sorted by Assigned To"}
							{sortBy === "category" && "Sorted by Category"}
						</div>
					)}
				</div>

				<TaskSection
					title="Incomplete"
					items={incompleteTasks}
					isCompleted={false}
					emptyMessage="All principles practiced! 🕯️✨"
					completedMessage=""
					renderItem={renderTaskItem}
					cardClassName="card-tasks"
					borderColor="rgb(var(--color-red-500))"
				/>

				<TaskSection
					title="Completed"
					items={completedTasks}
					isCompleted={true}
					emptyMessage="No completed principles yet."
					completedMessage="No completed principles yet."
					renderItem={renderTaskItem}
					cardClassName="card-tasks"
					borderColor="rgb(var(--color-red-500))"
				/>
			</main>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={deleteConfirm.show}
				title="Confirm Delete"
				message="Are you sure you want to delete this task? This action cannot be undone."
				itemName={deleteConfirm.taskTitle}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={loading}
				cardClassName="card card-tasks"
				confirmText="Delete"
				cancelText="Cancel"
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
					{ value: "none", label: "None" },
					{ value: "priority", label: "Priority" },
					{ value: "dateDue", label: "Date Due" },
					{ value: "assignedTo", label: "Assigned To" },
					{ value: "category", label: "Category" },
				]}
				title="Sort Tasks"
			/>
		</div>
	);
}
