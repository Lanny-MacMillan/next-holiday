"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchHanukkahTasks,
	addHanukkahTask,
	updateHanukkahTask,
	deleteHanukkahTask,
	toggleHanukkahTaskCompletion,
	HanukkahTask,
} from "@/store/slices/hanukkah/hanukkahTasksSlice";
import SortModal from "@/components/modals/SortModal";
import DeleteModal from "@/components/modals/DeleteModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import EventItems from "@/components/cards/event/EventItems";

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

export default function CandleLightingPage() {
	const dispatch = useAppDispatch();
	const { tasks, loading, error, initialized } = useAppSelector(
		(state: any) => state.hanukkahTasks
	);

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		taskId: string | null;
	}>({
		show: false,
		taskId: null,
	});
	const [showSortModal, setShowSortModal] = useState(false);

	useEffect(() => {
		// Fetch tasks when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchHanukkahTasks());
		}
	}, [dispatch, initialized]);

	function handleToggleTask(taskId: string) {
		dispatch(toggleHanukkahTaskCompletion(taskId));
	}

	function handleDeleteTask(taskId: string, taskTitle?: string) {
		setDeleteConfirm({ show: true, taskId });
	}

	function confirmDelete() {
		if (deleteConfirm.taskId) {
			dispatch(deleteHanukkahTask(deleteConfirm.taskId));
			setDeleteConfirm({ show: false, taskId: null });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, taskId: null });
	}

	function sortTasks(tasksToSort: HanukkahTask[]): HanukkahTask[] {
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
			<div className="min-h-screen hanukkah-tasks-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading candle lighting tasks...
					</p>
				</div>
			</div>
		);
	}

	const candleTasks = tasks.filter(
		(task: HanukkahTask) => task.category === "Candle Lighting"
	);
	const sortedTasks = sortTasks(candleTasks);
	const incompleteTasks = sortedTasks.filter(
		(task: HanukkahTask) => !task.isCompleted
	);
	const completedTasks = sortedTasks.filter(
		(task: HanukkahTask) => task.isCompleted
	);

	const renderTaskItem = (task: HanukkahTask) => (
		<EventItems
			key={task.id}
			task={task}
			onToggleTask={handleToggleTask}
			onDeleteTask={handleDeleteTask}
			loading={loading}
			themeColor="blue"
			holidayColor="bg-gradient-to-br from-blue-400 to-blue-600"
		/>
	);

	const renderCompletedTaskItem = (task: HanukkahTask) => (
		<EventItems
			key={task.id}
			task={task}
			onToggleTask={handleToggleTask}
			onDeleteTask={handleDeleteTask}
			loading={loading}
			themeColor="blue"
			holidayColor="bg-gradient-to-br from-blue-400 to-blue-600"
		/>
	);

	return (
		<div className="min-h-screen hanukkah-tasks-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Candle Lighting"
				backHref="/hanukkah"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort tasks"
				description="Keep track of candle lighting tasks!"
				holidayColor="blue-500"
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
					emptyMessage="All candles lit! 🕯️✨"
					completedMessage=""
					renderItem={renderTaskItem}
					cardClassName="card-tasks"
				/>

				<TaskSection
					title="Completed"
					items={completedTasks}
					isCompleted={true}
					emptyMessage="No lit candles yet."
					completedMessage="No lit candles yet."
					renderItem={renderCompletedTaskItem}
					cardClassName="card-tasks"
				/>
			</main>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={deleteConfirm.show}
				onCancel={cancelDelete}
				onConfirm={confirmDelete}
				loading={loading}
				cardClassName="card-tasks"
				title="Confirm Delete"
				message="Are you sure you want to delete this task? This action cannot be undone."
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
