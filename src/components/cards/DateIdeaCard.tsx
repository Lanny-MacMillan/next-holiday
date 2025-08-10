interface Task {
	id: string;
	title: string;
	description?: string;
	priority: "low" | "medium" | "high";
	category: string;
	dueDate?: string;
	notes?: string;
	isCompleted: boolean;
}

interface DateIdeaCardProps {
	task: Task;
	editingTask: Task | null;
	onToggleCompletion: (taskId: string) => void;
	onEdit: (task: Task) => void;
	onDelete: (taskId: string) => void;
	onUpdateTask: (e: React.FormEvent) => void;
	onCancelEdit: () => void;
	setEditingTask: (task: Task | null) => void;
	getPriorityColor: (priority: string) => string;
}

export default function DateIdeaCard({
	task,
	editingTask,
	onToggleCompletion,
	onEdit,
	onDelete,
	onUpdateTask,
	onCancelEdit,
	setEditingTask,
	getPriorityColor,
}: DateIdeaCardProps) {
	return (
		<div
			className={`card card-valentines rounded-2xl p-4 transition-all ${
				task.isCompleted ? "opacity-75" : ""
			}`}
		>
			{editingTask?.id === task.id ? (
				<form onSubmit={onUpdateTask} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Date Idea *
						</label>
						<input
							type="text"
							value={editingTask.title}
							onChange={(e) =>
								setEditingTask({
									...editingTask,
									title: e.target.value,
								})
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
							value={editingTask.description || ""}
							onChange={(e) =>
								setEditingTask({
									...editingTask,
									description: e.target.value,
								})
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
								value={editingTask.priority}
								onChange={(e) =>
									setEditingTask({
										...editingTask,
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
								value={editingTask.dueDate || ""}
								onChange={(e) =>
									setEditingTask({
										...editingTask,
										dueDate: e.target.value,
									})
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
							value={editingTask.notes || ""}
							onChange={(e) =>
								setEditingTask({
									...editingTask,
									notes: e.target.value,
								})
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
							Update
						</button>
						<button
							type="button"
							onClick={onCancelEdit}
							className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
						>
							Cancel
						</button>
					</div>
				</form>
			) : (
				<div>
					<div className="flex items-start justify-between mb-2">
						<div className="flex-1">
							<div className="flex items-center gap-2 mb-1">
								<h3
									className={`font-bold text-gray-800 dark:text-white ${
										task.isCompleted ? "line-through" : ""
									}`}
								>
									{task.title}
								</h3>
								<span
									className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(
										task.priority
									)}`}
								>
									{task.priority}
								</span>
								{task.isCompleted && (
									<span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-2 py-1 rounded-full">
										Completed
									</span>
								)}
							</div>
							{task.description && (
								<p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
									{task.description}
								</p>
							)}
							<div className="grid grid-cols-2 gap-4 text-sm">
								{task.dueDate && (
									<div>
										<span className="text-gray-500 dark:text-gray-500">
											Due:
										</span>
										<span className="ml-1 font-medium text-gray-800 dark:text-white">
											{new Date(task.dueDate).toLocaleDateString()}
										</span>
									</div>
								)}
								<div>
									<span className="text-gray-500 dark:text-gray-500">
										Category:
									</span>
									<span className="ml-1 font-medium text-gray-800 dark:text-white">
										{task.category}
									</span>
								</div>
							</div>
							{task.notes && (
								<div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
									<p className="text-sm text-gray-600 dark:text-gray-400">
										<strong>Notes:</strong> {task.notes}
									</p>
								</div>
							)}
						</div>
						<div className="flex flex-col gap-2 ml-4">
							<button
								onClick={() => onToggleCompletion(task.id)}
								className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
									task.isCompleted
										? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
										: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300"
								}`}
							>
								{task.isCompleted ? "Completed" : "Mark Complete"}
							</button>
							<button
								onClick={() => onEdit(task)}
								className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded text-sm font-medium transition-colors"
							>
								Edit
							</button>
							<button
								onClick={() => onDelete(task.id)}
								className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded text-sm font-medium transition-colors"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
