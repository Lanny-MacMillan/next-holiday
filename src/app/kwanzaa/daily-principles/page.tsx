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

// Helper function to get day number from principle ID
const getDayNumber = (taskId: string): number => {
	const match = taskId.match(/principle_(\d+)/);
	return match ? parseInt(match[1]) : 0;
};

// Helper function to get alternating color for each day
const getDayColor = (
	dayNumber: number
): { themeColor: string; holidayColor: string; backgroundColor: string } => {
	switch (dayNumber) {
		case 1:
			return {
				themeColor: "black",
				holidayColor: "bg-gradient-to-br from-gray-800 to-black",
				backgroundColor:
					"linear-gradient(to bottom right, rgb(31, 41, 55), rgb(0, 0, 0))",
			};
		case 2:
			return {
				themeColor: "red",
				holidayColor: "bg-gradient-to-br from-red-400 to-red-600",
				backgroundColor:
					"linear-gradient(to bottom right, rgb(239, 68, 68), rgb(220, 38, 38))",
			};
		case 3:
			return {
				themeColor: "green",
				holidayColor: "bg-gradient-to-br from-green-400 to-green-600",
				backgroundColor:
					"linear-gradient(to bottom right, rgb(34, 197, 94), rgb(21, 128, 61))",
			};
		case 4:
			return {
				themeColor: "black",
				holidayColor: "bg-gradient-to-br from-gray-800 to-black",
				backgroundColor:
					"linear-gradient(to bottom right, rgb(31, 41, 55), rgb(0, 0, 0))",
			};
		case 5:
			return {
				themeColor: "red",
				holidayColor: "bg-gradient-to-br from-red-400 to-red-600",
				backgroundColor:
					"linear-gradient(to bottom right, rgb(239, 68, 68), rgb(220, 38, 38))",
			};
		case 6:
			return {
				themeColor: "green",
				holidayColor: "bg-gradient-to-br from-green-400 to-green-600",
				backgroundColor:
					"linear-gradient(to bottom right, rgb(34, 197, 94), rgb(21, 128, 61))",
			};
		case 7:
			return {
				themeColor: "black",
				holidayColor: "bg-gradient-to-br from-gray-800 to-black",
				backgroundColor:
					"linear-gradient(to bottom right, rgb(31, 41, 55), rgb(0, 0, 0))",
			};
		default:
			return {
				themeColor: "red",
				holidayColor: "bg-gradient-to-br from-red-400 to-red-600",
				backgroundColor:
					"linear-gradient(to bottom right, rgb(239, 68, 68), rgb(220, 38, 38))",
			};
	}
};

// Helper function to add day prefix to title
const addDayPrefix = (task: KwanzaaTask): KwanzaaTask => {
	const dayNumber = getDayNumber(task.id);
	if (dayNumber > 0) {
		return {
			...task,
			title: `Day ${dayNumber} — ${task.title}`,
		};
	}
	return task;
};

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

	// Add day prefixes to principle tasks
	const principleTasksWithPrefixes = principleTasks.map(addDayPrefix);

	const sortedTasks = sortTasks(principleTasksWithPrefixes);
	const incompleteTasks = sortedTasks.filter(
		(task: KwanzaaTask) => !task.isCompleted
	);
	const completedTasks = sortedTasks.filter(
		(task: KwanzaaTask) => task.isCompleted
	);

	const renderTaskItem = (task: KwanzaaTask) => {
		const dayNumber = getDayNumber(task.id);
		const { themeColor, holidayColor, backgroundColor } =
			getDayColor(dayNumber);

		return (
			<EventItems
				key={task.id}
				task={task}
				onToggleTask={handleToggleTask}
				onDeleteTask={handleDeleteTask}
				loading={loading}
				themeColor={themeColor}
				holidayColor={holidayColor}
				backgroundColor={backgroundColor}
				gamified={true}
			/>
		);
	};

	return (
		<div className="min-h-screen kwanzaa-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Seven Principles of Kwanzaa"
				backHref="/kwanzaa"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort gifts"
				description="Track each day's candle and reflection"
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
