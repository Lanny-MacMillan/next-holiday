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

export default function EasterDecorationsPage() {
	const dispatch = useAppDispatch();
	const tasks = useAppSelector((state) => state.easterTasks.tasks);
	const error = useAppSelector((state) => state.easterTasks.error);

	// Filter tasks for Decorations category
	const decorationTasks = tasks.filter(
		(task) => task.category === "Decorations"
	);

	const [showAddForm, setShowAddForm] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		priority: "medium" as "low" | "medium" | "high",
		dueDate: "",
		notes: "",
	});

	useEffect(() => {
		dispatch(fetchEasterTasks());
	}, [dispatch]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (editingTask) {
			await dispatch(updateEasterTask({ ...editingTask, ...formData }));
			setEditingTask(null);
		} else {
			await dispatch(
				addEasterTask({
					...formData,
					isCompleted: false,
					category: "Decorations",
				})
			);
		}
		setFormData({
			title: "",
			description: "",
			priority: "medium",
			dueDate: "",
			notes: "",
		});
		setShowAddForm(false);
	};

	const handleEdit = (task: any) => {
		setEditingTask(task);
		setFormData({
			title: task.title,
			description: task.description || "",
			priority: task.priority,
			dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
			notes: task.notes || "",
		});
		setShowAddForm(true);
	};

	const handleDelete = async (taskId: string) => {
		if (confirm("Are you sure you want to delete this decoration item?")) {
			await dispatch(deleteEasterTask(taskId));
		}
	};

	const handleToggleCompletion = async (taskId: string) => {
		await dispatch(toggleEasterTaskCompletion(taskId));
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
					onClick={() => setShowAddForm(true)}
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
					<div className="card rounded-lg shadow">
						{decorationTasks.filter((task) => !task.isCompleted).length ===
						0 ? (
							<div className="px-4 py-3 text-gray-400 dark:text-gray-500 text-center">
								All decoration items completed! 🎉
							</div>
						) : (
							<div className="space-y-4 p-4">
								{decorationTasks
									.filter((task) => !task.isCompleted)
									.map((task) => (
										<div key={task.id} className="card rounded-lg p-4">
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<div className="flex items-center gap-2">
														<input
															type="checkbox"
															checked={task.isCompleted}
															onChange={() => handleToggleCompletion(task.id)}
															className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
														/>
														<h3 className="text-lg font-semibold text-gray-800 dark:text-white">
															{task.title}
														</h3>
													</div>
													{task.description && (
														<p className="text-gray-600 dark:text-gray-400 mt-1">
															{task.description}
														</p>
													)}
													<div className="mt-2 flex flex-wrap gap-2 text-sm">
														<span
															className={`px-2 py-1 rounded-full text-xs font-medium ${
																task.priority === "high"
																	? "text-red-600 dark:text-red-400"
																	: task.priority === "medium"
																	? "text-yellow-600 dark:text-yellow-400"
																	: "text-green-600 dark:text-green-400"
															} bg-opacity-10`}
														>
															{task.priority.charAt(0).toUpperCase() +
																task.priority.slice(1)}{" "}
															Priority
														</span>
														{task.dueDate && (
															<span className="text-gray-500 dark:text-gray-400">
																Due:{" "}
																{new Date(task.dueDate).toLocaleDateString()}
															</span>
														)}
													</div>
													{task.notes && (
														<div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
															<span className="font-medium">Notes:</span>{" "}
															{task.notes}
														</div>
													)}
												</div>
												<div className="flex gap-2 ml-4">
													<button
														onClick={() => handleEdit(task)}
														className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
													>
														Edit
													</button>
													<button
														onClick={() => handleDelete(task.id)}
														className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
													>
														Delete
													</button>
												</div>
											</div>
										</div>
									))}
							</div>
						)}
					</div>
				</div>

				<div>
					<h2 className="font-semibold text-gray-400 dark:text-gray-500 mb-2">
						Completed (
						{decorationTasks.filter((task) => task.isCompleted).length})
					</h2>
					<div className="card rounded-lg shadow">
						{decorationTasks.filter((task) => task.isCompleted).length === 0 ? (
							<div className="px-4 py-3 text-gray-300 dark:text-gray-600 text-center">
								No completed decoration items yet.
							</div>
						) : (
							<div className="space-y-4 p-4">
								{decorationTasks
									.filter((task) => task.isCompleted)
									.map((task) => (
										<div
											key={task.id}
											className="card rounded-lg p-4 opacity-60"
										>
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<div className="flex items-center gap-2">
														<input
															type="checkbox"
															checked={task.isCompleted}
															onChange={() => handleToggleCompletion(task.id)}
															className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
														/>
														<h3 className="text-lg font-semibold line-through text-gray-500 dark:text-gray-400">
															{task.title}
														</h3>
													</div>
													{task.description && (
														<p className="text-gray-500 dark:text-gray-400 mt-1 line-through">
															{task.description}
														</p>
													)}
													<div className="mt-2 flex flex-wrap gap-2 text-sm">
														<span
															className={`px-2 py-1 rounded-full text-xs font-medium ${
																task.priority === "high"
																	? "text-red-600 dark:text-red-400"
																	: task.priority === "medium"
																	? "text-yellow-600 dark:text-yellow-400"
																	: "text-green-600 dark:text-green-400"
															} bg-opacity-10`}
														>
															{task.priority.charAt(0).toUpperCase() +
																task.priority.slice(1)}{" "}
															Priority
														</span>
														{task.dueDate && (
															<span className="text-gray-500 dark:text-gray-400">
																Due:{" "}
																{new Date(task.dueDate).toLocaleDateString()}
															</span>
														)}
													</div>
													{task.notes && (
														<div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
															<span className="font-medium">Notes:</span>{" "}
															{task.notes}
														</div>
													)}
													{task.completedDate && (
														<div className="text-sm text-green-600 dark:text-green-400 mt-1">
															Completed:{" "}
															{new Date(
																task.completedDate
															).toLocaleDateString()}
														</div>
													)}
												</div>
												<div className="flex gap-2 ml-4">
													<button
														onClick={() => handleEdit(task)}
														className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
													>
														Edit
													</button>
													<button
														onClick={() => handleDelete(task.id)}
														className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
													>
														Delete
													</button>
												</div>
											</div>
										</div>
									))}
							</div>
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

			{/* Form Modal */}
			{showAddForm && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="card card-gifts rounded-lg p-6 max-w-md mx-4 w-full max-h-[90vh] overflow-y-auto">
						<div className="flex justify-between items-center mb-4">
							<h3
								className="text-lg font-semibold text-gray-900 dark:text-white"
								style={{ color: "#111827" }}
							>
								{editingTask
									? "Edit Decoration Item"
									: "Add New Decoration Item"}
							</h3>
							<button
								onClick={() => {
									setShowAddForm(false);
									setEditingTask(null);
									setFormData({
										title: "",
										description: "",
										priority: "medium",
										dueDate: "",
										notes: "",
									});
								}}
								className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
								style={{ color: "#4b5563" }}
							>
								×
							</button>
						</div>
						<form onSubmit={handleSubmit} className="space-y-4">
							<input
								className="border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
								placeholder="Item Title*"
								value={formData.title}
								onChange={(e) =>
									setFormData({ ...formData, title: e.target.value })
								}
								required
								style={{ color: "#111827", backgroundColor: "white" }}
							/>
							<textarea
								className="border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
								placeholder="Description"
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
								rows={3}
								style={{ color: "#111827", backgroundColor: "white" }}
							/>
							<div className="flex gap-2">
								<select
									value={formData.priority}
									onChange={(e) =>
										setFormData({
											...formData,
											priority: e.target.value as "low" | "medium" | "high",
										})
									}
									className="flex-1 border rounded px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
									style={{ color: "#111827", backgroundColor: "white" }}
								>
									<option value="low">Low Priority</option>
									<option value="medium">Medium Priority</option>
									<option value="high">High Priority</option>
								</select>
								<input
									type="date"
									value={formData.dueDate}
									onChange={(e) =>
										setFormData({ ...formData, dueDate: e.target.value })
									}
									className="flex-1 border rounded px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
									style={{ color: "#111827", backgroundColor: "white" }}
								/>
							</div>
							<textarea
								className="border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
								placeholder="Notes"
								value={formData.notes}
								onChange={(e) =>
									setFormData({ ...formData, notes: e.target.value })
								}
								rows={2}
								style={{ color: "#111827", backgroundColor: "white" }}
							/>
							<div className="flex gap-2">
								<button
									type="submit"
									className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-md transition-colors"
									style={{ backgroundColor: "#a855f7", color: "white" }}
								>
									{editingTask ? "Update Item" : "Add Item"}
								</button>
								<button
									type="button"
									onClick={() => {
										setShowAddForm(false);
										setEditingTask(null);
										setFormData({
											title: "",
											description: "",
											priority: "medium",
											dueDate: "",
											notes: "",
										});
									}}
									className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors"
								>
									Cancel
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
