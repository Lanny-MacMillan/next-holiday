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
import EditTaskModal from "@/components/EditTaskModal";

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
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/easter"
						className="absolute left-0 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 text-xl"
					>
						←
					</Link>
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
							Easter Decorations
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Stay on top of your Easter decorations
						</p>
					</div>
				</div>
			</header>

			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<button
					onClick={() => {
						// TODO: Add new task functionality
						console.log("Add new decoration item");
					}}
					className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
					style={{ backgroundColor: "#a855f7", color: "white" }}
				>
					Add New Decoration Item
				</button>

				{error && (
					<div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
						{error}
						<button
							onClick={() => dispatch(clearEasterTaskError())}
							className="float-right font-bold"
						>
							×
						</button>
					</div>
				)}

				<div>
					<h2 className="font-semibold text-gray-800 dark:text-white mb-2">
						Incomplete (
						{decorationTasks.filter((task) => !task.isCompleted).length})
					</h2>
					<div className="space-y-3">
						{decorationTasks.filter((task) => !task.isCompleted).length ===
						0 ? (
							<div className="card card-tasks rounded-lg shadow px-4 py-3 text-gray-400 dark:text-gray-500 text-center">
								All decoration items completed! 🎉
							</div>
						) : (
							decorationTasks
								.filter((task) => !task.isCompleted)
								.map((task) => (
									<ToDoCard
										key={task.id}
										task={convertEasterTaskToTask(task)}
										onToggleComplete={handleToggleCompletion}
										onDelete={handleDeleteTask}
										onEdit={handleEditTask}
									/>
								))
						)}
					</div>
				</div>

				<div>
					<h2 className="font-semibold text-gray-400 dark:text-gray-500 mb-2">
						Completed (
						{decorationTasks.filter((task) => task.isCompleted).length})
					</h2>
					<div className="space-y-3">
						{decorationTasks.filter((task) => task.isCompleted).length === 0 ? (
							<div className="card card-tasks rounded-lg shadow px-4 py-3 text-gray-300 dark:text-gray-600 text-center">
								No completed decoration items yet.
							</div>
						) : (
							decorationTasks
								.filter((task) => task.isCompleted)
								.map((task) => (
									<ToDoCard
										key={task.id}
										task={convertEasterTaskToTask(task)}
										onToggleComplete={handleToggleCompletion}
										onDelete={handleDeleteTask}
										onEdit={handleEditTask}
										className="opacity-60"
									/>
								))
						)}
					</div>
				</div>

				{decorationTasks.length > 0 && (
					<div className="card rounded-lg p-4">
						<h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
							Decorations Summary
						</h3>
						<div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
							<div>Total Items: {decorationTasks.length}</div>
							<div>
								Completed: {decorationTasks.filter((t) => t.isCompleted).length}
							</div>
							<div>
								High Priority:{" "}
								{decorationTasks.filter((t) => t.priority === "high").length}
							</div>
							<div>
								Medium Priority:{" "}
								{decorationTasks.filter((t) => t.priority === "medium").length}
							</div>
							<div>
								Low Priority:{" "}
								{decorationTasks.filter((t) => t.priority === "low").length}
							</div>
						</div>
					</div>
				)}
			</main>

			{/* Edit Task Modal */}
			<EditTaskModal
				isOpen={editingTask !== null}
				task={editingTask ? convertEasterTaskToTask(editingTask) : null}
				onClose={handleCloseEdit}
				onSave={handleSaveEdit}
				loading={loading}
			/>
		</div>
	);
}
