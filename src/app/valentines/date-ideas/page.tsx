"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchValentinesTasks,
	addValentinesTask,
	updateValentinesTask,
	deleteValentinesTask,
	toggleValentinesTaskCompletion,
	setSelectedValentinesTask,
} from "@/store/slices/valentines/valentinesTasksSlice";
import SortModal from "@/components/modals/SortModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import DateTrackerCard from "@/components/cards/DateTrackerCard";
import DateIdeaCard from "@/components/cards/DateIdeaCard";

export default function ValentinesDateIdeasPage() {
	const dispatch = useAppDispatch();
	const [isAddingTask, setIsAddingTask] = useState(false);
	const [newTask, setNewTask] = useState({
		title: "",
		description: "",
		priority: "medium" as "low" | "medium" | "high",
		category: "Date Ideas" as
			| "Date Ideas"
			| "Reservations"
			| "Decorations"
			| "General",
		dueDate: "",
		notes: "",
	});
	const [editingTask, setEditingTask] = useState<any>(null);
	const [showSortModal, setShowSortModal] = useState(false);
	const [sortBy, setSortBy] = useState("title");

	const allTasks = useAppSelector((state) => state.valentinesTasks.tasks);
	const loading = useAppSelector((state) => state.valentinesTasks.loading);
	const selectedTask = useAppSelector(
		(state) => state.valentinesTasks.selectedTask
	);

	// Filter tasks for Date Ideas category
	const tasks = allTasks.filter((task) => task.category === "Date Ideas");

	useEffect(() => {
		dispatch(fetchValentinesTasks());
	}, [dispatch]);

	const handleAddTask = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newTask.title.trim()) return;

		await dispatch(
			addValentinesTask({
				...newTask,
				isCompleted: false,
			})
		);

		setNewTask({
			title: "",
			description: "",
			priority: "medium",
			category: "Date Ideas",
			dueDate: "",
			notes: "",
		});
		setIsAddingTask(false);
	};

	const handleUpdateTask = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingTask.title.trim()) return;

		await dispatch(updateValentinesTask(editingTask));
		setEditingTask(null);
	};

	const handleDeleteTask = async (taskId: string) => {
		if (confirm("Are you sure you want to delete this date idea?")) {
			await dispatch(deleteValentinesTask(taskId));
		}
	};

	const handleToggleCompletion = async (taskId: string) => {
		await dispatch(toggleValentinesTaskCompletion(taskId));
	};

	const sortedTasks = [...tasks].sort((a, b) => {
		switch (sortBy) {
			case "title":
				return a.title.localeCompare(b.title);
			case "priority":
				const priorityOrder = { high: 3, medium: 2, low: 1 };
				return priorityOrder[b.priority] - priorityOrder[a.priority];
			case "dueDate":
				if (!a.dueDate && !b.dueDate) return 0;
				if (!a.dueDate) return 1;
				if (!b.dueDate) return -1;
				return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
			case "completed":
				return a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1;
			default:
				return 0;
		}
	});

	const completedTasks = tasks.filter((task) => task.isCompleted);
	const incompleteTasks = tasks.filter((task) => !task.isCompleted);

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "high":
				return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
			case "medium":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
			case "low":
				return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
		}
	};

	return (
		<div className="min-h-screen valentines-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Date Ideas"
				backHref="/valentines"
				onSortClick={() => setShowSortModal(true)}
				description="Keep track of your date ideas!"
				holidayColor="pink-500"
				sortTitle="Sort Date Ideas"
			/>

			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				{/* Summary Stats */}
				<DateTrackerCard
					totalIdeas={tasks.length}
					completedIdeas={completedTasks.length}
					highPriorityIdeas={
						tasks.filter((task) => task.priority === "high").length
					}
					dueSoonIdeas={
						tasks.filter((task) => {
							if (!task.dueDate) return false;
							const dueDate = new Date(task.dueDate);
							const now = new Date();
							const diffDays = Math.ceil(
								(dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
							);
							return diffDays <= 7 && diffDays >= 0;
						}).length
					}
				/>

				<AddButton
					title="Date Idea"
					onClick={() => setIsAddingTask(true)}
					color="pink"
					disabled={loading}
				/>

				{/* Add Task Form */}
				{isAddingTask && (
					<div className="card card-valentines rounded-2xl p-4">
						<h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
							Add New Date Idea
						</h3>
						<form onSubmit={handleAddTask} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									Date Idea *
								</label>
								<input
									type="text"
									value={newTask.title}
									onChange={(e) =>
										setNewTask({ ...newTask, title: e.target.value })
									}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									Description
								</label>
								<textarea
									value={newTask.description}
									onChange={(e) =>
										setNewTask({ ...newTask, description: e.target.value })
									}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
									rows={2}
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Priority
									</label>
									<select
										value={newTask.priority}
										onChange={(e) =>
											setNewTask({
												...newTask,
												priority: e.target.value as "low" | "medium" | "high",
											})
										}
										className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
									>
										<option value="low">Low</option>
										<option value="medium">Medium</option>
										<option value="high">High</option>
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Due Date
									</label>
									<input
										type="date"
										value={newTask.dueDate}
										onChange={(e) =>
											setNewTask({ ...newTask, dueDate: e.target.value })
										}
										className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
									/>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									Notes
								</label>
								<textarea
									value={newTask.notes}
									onChange={(e) =>
										setNewTask({ ...newTask, notes: e.target.value })
									}
									className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
									rows={2}
								/>
							</div>
							<div className="flex gap-2">
								<button
									type="submit"
									className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
								>
									Add Date Idea
								</button>
								<button
									type="button"
									onClick={() => setIsAddingTask(false)}
									className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
								>
									Cancel
								</button>
							</div>
						</form>
					</div>
				)}

				{/* Task List */}
				<div className="space-y-4">
					{loading ? (
						<div className="text-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
							<p className="text-gray-600 dark:text-gray-400 mt-2">
								Loading date ideas...
							</p>
						</div>
					) : sortedTasks.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-gray-600 dark:text-gray-400">
								No date ideas added yet.
							</p>
							<button
								onClick={() => setIsAddingTask(true)}
								className="mt-2 text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
							>
								Add your first date idea
							</button>
						</div>
					) : (
						sortedTasks.map((task) => (
							<DateIdeaCard
								key={task.id}
								task={task}
								editingTask={editingTask}
								onToggleCompletion={handleToggleCompletion}
								onEdit={setEditingTask}
								onDelete={handleDeleteTask}
								onUpdateTask={handleUpdateTask}
								onCancelEdit={() => setEditingTask(null)}
								setEditingTask={setEditingTask}
								getPriorityColor={getPriorityColor}
							/>
						))
					)}
				</div>
			</main>

			{/* Sort Modal */}
			<SortModal
				isOpen={showSortModal}
				onClose={() => setShowSortModal(false)}
				sortBy={sortBy}
				onSortChange={setSortBy}
				sortOptions={[
					{ value: "title", label: "Title" },
					{ value: "priority", label: "Priority" },
					{ value: "dueDate", label: "Due Date" },
					{ value: "completed", label: "Completion Status" },
				]}
				title="Sort Date Ideas"
			/>

			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
