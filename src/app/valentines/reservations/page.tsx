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
} from "@/store/slices/valentinesTasksSlice";

export default function ValentinesReservationsPage() {
	const dispatch = useAppDispatch();
	const [isAddingTask, setIsAddingTask] = useState(false);
	const [newTask, setNewTask] = useState({
		title: "",
		description: "",
		priority: "medium" as "low" | "medium" | "high",
		category: "Reservations" as
			| "Date Ideas"
			| "Reservations"
			| "Decorations"
			| "General",
		dueDate: "",
		notes: "",
	});

	const allTasks = useAppSelector((state) => state.valentinesTasks.tasks);
	const loading = useAppSelector((state) => state.valentinesTasks.loading);

	// Filter tasks for Reservations category
	const tasks = allTasks.filter((task) => task.category === "Reservations");

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
			category: "Reservations",
			dueDate: "",
			notes: "",
		});
		setIsAddingTask(false);
	};

	const handleToggleCompletion = async (taskId: string) => {
		await dispatch(toggleValentinesTaskCompletion(taskId));
	};

	const handleDeleteTask = async (taskId: string) => {
		if (confirm("Are you sure you want to delete this reservation?")) {
			await dispatch(deleteValentinesTask(taskId));
		}
	};

	const completedTasks = tasks.filter((task) => task.isCompleted);
	const incompleteTasks = tasks.filter((task) => !task.isCompleted);

	return (
		<div className="min-h-screen valentines-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/valentines"
						className="absolute left-0 text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-300 text-xl"
					>
						←
					</Link>
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
							Reservations Tracker
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Track restaurant and activity reservations
						</p>
					</div>
				</div>
			</header>

			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				{/* Summary Stats */}
				<div className="card card-valentines rounded-2xl p-4">
					<div className="grid grid-cols-2 gap-4 text-center">
						<div>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								Total Reservations
							</p>
							<p className="text-2xl font-bold text-gray-800 dark:text-white">
								{tasks.length}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								Confirmed
							</p>
							<p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
								{completedTasks.length}
							</p>
						</div>
					</div>
				</div>

				<button
					onClick={() => setIsAddingTask(true)}
					className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition-colors font-medium"
					style={{ backgroundColor: "#ec4899", color: "white" }}
				>
					Add New Reservation
				</button>

				{/* Add Task Form Modal */}
				{isAddingTask && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
						<div className="card card-valentines rounded-lg p-6 max-w-md mx-4 w-full max-h-[90vh] overflow-y-auto">
							<div className="flex justify-between items-center mb-4">
								<h3
									className="text-lg font-semibold text-gray-900 dark:text-white"
									style={{ color: "#111827" }}
								>
									Add New Reservation
								</h3>
								<button
									onClick={() => setIsAddingTask(false)}
									className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
									style={{ color: "#4b5563" }}
								>
									×
								</button>
							</div>
							<form onSubmit={handleAddTask} className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Reservation Name *
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
								<div className="flex gap-3 pt-2">
									<button
										type="button"
										onClick={() => setIsAddingTask(false)}
										className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
										style={{ color: "#374151", borderColor: "#d1d5db" }}
									>
										Cancel
									</button>
									<button
										type="submit"
										className="flex-1 bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition-colors font-medium"
										style={{ backgroundColor: "#ec4899", color: "white" }}
									>
										Add Reservation
									</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{/* Task List */}
				<div className="space-y-4">
					{loading ? (
						<div className="text-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
							<p className="text-gray-600 dark:text-gray-400 mt-2">
								Loading reservations...
							</p>
						</div>
					) : tasks.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-gray-600 dark:text-gray-400">
								No reservations added yet.
							</p>
							<button
								onClick={() => setIsAddingTask(true)}
								className="mt-2 text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
							>
								Add your first reservation
							</button>
						</div>
					) : (
						tasks.map((task) => (
							<div
								key={task.id}
								className={`card card-valentines rounded-2xl p-4 transition-all ${
									task.isCompleted ? "opacity-75" : ""
								}`}
							>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-2">
											<h3
												className={`font-bold text-gray-800 dark:text-white ${
													task.isCompleted ? "line-through" : ""
												}`}
											>
												{task.title}
											</h3>
											{task.isCompleted && (
												<span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-2 py-1 rounded-full">
													Confirmed
												</span>
											)}
										</div>
										{task.description && (
											<p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
												{task.description}
											</p>
										)}
										{task.dueDate && (
											<p className="text-sm text-gray-500 dark:text-gray-500">
												Due: {new Date(task.dueDate).toLocaleDateString()}
											</p>
										)}
									</div>
									<div className="flex gap-2 ml-4">
										<button
											onClick={() => handleToggleCompletion(task.id)}
											className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
												task.isCompleted
													? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
													: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300"
											}`}
										>
											{task.isCompleted ? "Confirmed" : "Mark Confirmed"}
										</button>
										<button
											onClick={() => handleDeleteTask(task.id)}
											className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded text-sm font-medium transition-colors"
										>
											Delete
										</button>
									</div>
								</div>
							</div>
						))
					)}
				</div>
			</main>

			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
