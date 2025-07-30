"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchTasks,
	addTask,
	updateTask,
	deleteTask,
	toggleTaskCompletion,
	Task,
} from "@/store/slices/tasksSlice";

export default function TasksPage() {
	const dispatch = useAppDispatch();
	const { tasks, loading, error, initialized } = useAppSelector(
		(state: any) => state.tasks
	);

	const [form, setForm] = useState({
		title: "",
		description: "",
		priority: "medium" as "low" | "medium" | "high",
		category: "other" as
			| "shopping"
			| "decorating"
			| "cooking"
			| "cleaning"
			| "other",
		dueDate: "",
		assignedTo: "",
	});

	useEffect(() => {
		// Fetch tasks when component mounts
		dispatch(fetchTasks());
	}, [dispatch]);

	function handleAddTask(e: React.FormEvent) {
		e.preventDefault();
		if (!form.title.trim()) return;

		const newTask: Omit<Task, "id" | "createdAt" | "updatedAt"> = {
			title: form.title,
			description: form.description || undefined,
			priority: form.priority,
			isCompleted: false,
			dueDate: form.dueDate || undefined,
			category: form.category,
			assignedTo: form.assignedTo || undefined,
		};

		dispatch(addTask(newTask));
		setForm({
			title: "",
			description: "",
			priority: "medium",
			category: "other",
			dueDate: "",
			assignedTo: "",
		});
	}

	function handleToggleTask(taskId: string) {
		dispatch(toggleTaskCompletion(taskId));
	}

	function handleDeleteTask(taskId: string) {
		dispatch(deleteTask(taskId));
	}

	const incompleteTasks = tasks.filter((task: Task) => !task.isCompleted);
	const completedTasks = tasks.filter((task: Task) => task.isCompleted);

	if (loading && !initialized) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading tasks...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6 flex flex-col items-center">
				<h1 className="text-2xl font-bold mb-2 text-gray-900">
					Holiday To-Do List
				</h1>
				<Link
					href="/christmas"
					className="text-blue-500 text-sm hover:underline mb-2"
				>
					← Back
				</Link>
				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
						{error}
					</div>
				)}
			</header>
			<main className="w-full max-w-md flex flex-col gap-6">
				<form
					className="bg-white rounded shadow p-4 mb-4"
					onSubmit={handleAddTask}
				>
					<h2 className="font-semibold mb-2">Add New Task</h2>
					<div className="flex flex-col gap-2">
						<input
							className="border rounded px-3 py-2 text-gray-900 placeholder-gray-700"
							placeholder="Task Title*"
							value={form.title}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, title: e.target.value }))
							}
							required
						/>
						<textarea
							className="border rounded px-3 py-2 text-gray-900 placeholder-gray-700"
							placeholder="Description (optional)"
							value={form.description}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, description: e.target.value }))
							}
							rows={2}
						/>
						<div className="flex gap-2">
							<select
								className="flex-1 border rounded px-3 py-2 text-gray-900"
								value={form.priority}
								onChange={(e) =>
									setForm((prev) => ({
										...prev,
										priority: e.target.value as any,
									}))
								}
							>
								<option value="low">🟢 Low Priority</option>
								<option value="medium">🟡 Medium Priority</option>
								<option value="high">🔴 High Priority</option>
							</select>
							<select
								className="flex-1 border rounded px-3 py-2 text-gray-900"
								value={form.category}
								onChange={(e) =>
									setForm((prev) => ({
										...prev,
										category: e.target.value as any,
									}))
								}
							>
								<option value="shopping">🛒 Shopping</option>
								<option value="decorating">🎄 Decorating</option>
								<option value="cooking">👨‍🍳 Cooking</option>
								<option value="cleaning">🧹 Cleaning</option>
								<option value="other">📝 Other</option>
							</select>
						</div>
						<div className="flex gap-2">
							<input
								className="flex-1 border rounded px-3 py-2 text-gray-900"
								type="date"
								value={form.dueDate}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, dueDate: e.target.value }))
								}
							/>
							<input
								className="flex-1 border rounded px-3 py-2 text-gray-900 placeholder-gray-700"
								placeholder="Assigned to"
								value={form.assignedTo}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, assignedTo: e.target.value }))
								}
							/>
						</div>
						<button
							type="submit"
							className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
							disabled={loading}
						>
							{loading ? "Adding..." : "Add Task"}
						</button>
					</div>
				</form>

				<div>
					<h2 className="font-semibold text-gray-900 mb-2">
						Incomplete ({incompleteTasks.length})
					</h2>
					<div className="bg-white rounded shadow">
						{incompleteTasks.length === 0 ? (
							<div className="px-4 py-3 text-gray-400 text-center">
								All done! 🎉
							</div>
						) : (
							<ul className="divide-y">
								{incompleteTasks.map((task: Task) => (
									<li
										key={task.id}
										className="flex items-center px-4 py-3 cursor-pointer hover:bg-blue-50"
										onClick={() => handleToggleTask(task.id)}
									>
										<input
											type="checkbox"
											checked={task.isCompleted}
											readOnly
											className="mr-3 accent-blue-500"
										/>
										<div className="flex-1">
											<div className="text-gray-900">{task.title}</div>
											{task.description && (
												<div className="text-xs text-gray-500">
													{task.description}
												</div>
											)}
											<div className="flex gap-2 text-xs text-gray-400 mt-1">
												<span
													className={`px-2 py-1 rounded ${
														task.priority === "high"
															? "bg-red-100 text-red-700"
															: task.priority === "medium"
															? "bg-yellow-100 text-yellow-700"
															: "bg-green-100 text-green-700"
													}`}
												>
													{task.priority}
												</span>
												<span className="px-2 py-1 rounded bg-gray-100">
													{task.category}
												</span>
												{task.dueDate && (
													<span className="px-2 py-1 rounded bg-blue-100 text-blue-700">
														Due: {new Date(task.dueDate).toLocaleDateString()}
													</span>
												)}
												{task.assignedTo && (
													<span className="px-2 py-1 rounded bg-purple-100 text-purple-700">
														{task.assignedTo}
													</span>
												)}
											</div>
										</div>
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteTask(task.id);
											}}
											className="text-red-500 hover:text-red-700 text-sm"
											disabled={loading}
										>
											Delete
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>

				<div>
					<h2 className="font-semibold text-gray-400 mb-2">
						Completed ({completedTasks.length})
					</h2>
					<div className="bg-white rounded shadow">
						{completedTasks.length === 0 ? (
							<div className="px-4 py-3 text-gray-300 text-center">
								No completed tasks yet.
							</div>
						) : (
							<ul className="divide-y">
								{completedTasks.map((task: Task) => (
									<li
										key={task.id}
										className="flex items-center px-4 py-3 cursor-pointer hover:bg-blue-50 opacity-60"
										onClick={() => handleToggleTask(task.id)}
									>
										<input
											type="checkbox"
											checked={task.isCompleted}
											readOnly
											className="mr-3 accent-blue-500"
										/>
										<div className="flex-1">
											<div className="line-through text-gray-400">
												{task.title}
											</div>
											{task.description && (
												<div className="text-xs text-gray-400 line-through">
													{task.description}
												</div>
											)}
										</div>
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteTask(task.id);
											}}
											className="text-red-500 hover:text-red-700 text-sm"
											disabled={loading}
										>
											Delete
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
