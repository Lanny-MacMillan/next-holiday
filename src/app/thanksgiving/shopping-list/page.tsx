"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchThanksgivingTasks,
	addThanksgivingTask,
	updateThanksgivingTask,
	deleteThanksgivingTask,
	toggleThanksgivingTaskCompletion,
} from "@/store/slices/thanksgiving/thanksgivingTasksSlice";
import { BudgetDisplay } from "@/components/common/BudgetDisplay";
import SortModal from "@/components/modals/SortModal";
import ToDoCard from "@/components/cards/to-do/ToDoCard";
import EditTaskModal from "@/components/modals/EditTaskModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";
import { Task } from "@/store/slices/tasksSlice";

type SortOption =
	| "priority"
	| "dateDue"
	| "assignedTo"
	| "category"
	| "cost"
	| "none";

export default function ThanksgivingShoppingListPage() {
	const dispatch = useAppDispatch();
	const { tasks, loading, error, initialized } = useAppSelector(
		(state: any) => state.thanksgivingTasks
	);

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [editingTask, setEditingTask] = useState<Task | null>(null);
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		taskId: string | null;
	}>({
		show: false,
		taskId: null,
	});

	useEffect(() => {
		// Fetch tasks when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchThanksgivingTasks());
		}
	}, [dispatch, initialized]);

	// Filter tasks to show only shopping items (food and supplies)
	const shoppingItems = tasks.filter(
		(task: Task) =>
			task.category === "Food" ||
			task.category === "Beverages" ||
			task.category === "Supplies" ||
			task.category === "Ingredients" ||
			task.category === "Shopping List"
	);

	const totalSpent = shoppingItems.reduce((sum: number, item: Task) => {
		if (!item.description) return sum;
		const costMatch = item.description.match(/Cost: \$(\d+\.?\d*)/);
		return sum + (costMatch ? parseFloat(costMatch[1]) : 0);
	}, 0);

	const completedItems = shoppingItems.filter(
		(item: Task) => item.isCompleted
	).length;
	const totalItems = shoppingItems.length;

	function handleAddTask(formValues: Record<string, any>) {
		console.log("Form values received:", formValues);

		if (!formValues.title?.trim()) {
			console.log("No title provided");
			return;
		}

		// Combine description and cost into a single description field
		let description = formValues.description || "";
		if (formValues.cost) {
			const costText = `Cost: $${parseFloat(formValues.cost).toFixed(2)}`;
			description = description ? `${description}\n${costText}` : costText;
		}

		const newTask: Omit<Task, "id" | "createdAt" | "updatedAt"> = {
			title: formValues.title,
			description: description || undefined,
			priority: (formValues.priority as "low" | "medium" | "high") || "medium",
			assignedTo: formValues.assignedTo || undefined,
			category: formValues.category || "Shopping List",
			dueDate: formValues.dueDate || undefined,
			isCompleted: false,
		};

		console.log("Dispatching new task:", newTask);
		dispatch(addThanksgivingTask(newTask));
		setShowForm(false);
	}

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
	}

	function handleToggleTask(taskId: string) {
		dispatch(toggleThanksgivingTaskCompletion(taskId));
	}

	function handleDeleteTask(taskId: string) {
		setDeleteConfirm({ show: true, taskId });
	}

	function handleEditTask(task: Task) {
		setEditingTask(task);
	}

	function handleSaveEdit(
		updatedTask: Omit<Task, "id" | "createdAt" | "updatedAt">
	) {
		if (editingTask) {
			dispatch(updateThanksgivingTask({ ...editingTask, ...updatedTask }));
			setEditingTask(null);
		}
	}

	function handleCloseEdit() {
		setEditingTask(null);
	}

	function confirmDelete() {
		if (deleteConfirm.taskId) {
			dispatch(deleteThanksgivingTask(deleteConfirm.taskId));
			setDeleteConfirm({ show: false, taskId: null });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, taskId: null });
	}

	function sortTasks(tasksToSort: Task[]): Task[] {
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
			case "cost":
				return [...tasksToSort].sort((a, b) => {
					const getCost = (task: Task) => {
						if (!task.description) return 0;
						const costMatch = task.description.match(/Cost: \$(\d+\.?\d*)/);
						return costMatch ? parseFloat(costMatch[1]) : 0;
					};
					return getCost(b) - getCost(a); // High to low
				});
			default:
				return tasksToSort;
		}
	}

	if (loading && !initialized) {
		return (
			<div className="min-h-screen thanksgiving-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading shopping list...
					</p>
				</div>
			</div>
		);
	}

	const sortedTasks = sortTasks(shoppingItems);
	const incompleteTasks = sortedTasks.filter((task: Task) => !task.isCompleted);
	const completedTasks = sortedTasks.filter((task: Task) => task.isCompleted);

	return (
		<div className="min-h-screen thanksgiving-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="🛒 Shopping List"
				backHref="/thanksgiving"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort shopping items"
				error={error}
			/>
			<main className="w-full max-w-md flex flex-col gap-6">
				{/* Budget Display */}
				<BudgetDisplay holiday="Thanksgiving" />

				<AddButton title="Shopping Item" onClick={openForm} color="orange" />
				<div className="flex items-center justify-center">
					{sortBy !== "none" && (
						<div className="text-center text-sm text-gray-600 dark:text-gray-400">
							{sortBy === "priority" && "Sorted by Priority"}
							{sortBy === "dateDue" && "Sorted by Date Due"}
							{sortBy === "assignedTo" && "Sorted by Assigned To"}
							{sortBy === "category" && "Sorted by Category"}
							{sortBy === "cost" && "Sorted by Cost (High to Low)"}
						</div>
					)}
				</div>

				{/* Shopping List Summary */}
				<div className="bg-white rounded-lg shadow-lg p-6">
					<h2 className="text-xl font-bold mb-4 text-gray-800">
						Shopping Progress
					</h2>
					<div className="grid grid-cols-2 gap-4 mb-4">
						<div className="text-center">
							<div className="text-2xl font-bold text-amber-600">
								{totalItems}
							</div>
							<div className="text-sm text-gray-600">Total Items</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-green-600">
								{completedItems}
							</div>
							<div className="text-sm text-gray-600">Completed</div>
						</div>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold text-amber-600">
							${totalSpent.toFixed(2)}
						</div>
						<div className="text-sm text-gray-600">Total Spent</div>
					</div>
				</div>

				<TaskSection
					title="Incomplete"
					items={incompleteTasks}
					isCompleted={false}
					emptyMessage="All shopping items completed! 🎉"
					completedMessage="All shopping items completed! 🎉"
					renderItem={(task: Task) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleTask}
							onDelete={handleDeleteTask}
							onEdit={handleEditTask}
							theme={{
								accentColor: "#d97706", // Amber for Thanksgiving
							}}
							borderColor="rgb(var(--color-amber-500))" // Amber border for Thanksgiving
						/>
					)}
				/>

				<TaskSection
					title="Completed"
					items={completedTasks}
					isCompleted={true}
					emptyMessage="No completed shopping items yet."
					completedMessage="No completed shopping items yet."
					renderItem={(task: Task) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleTask}
							onDelete={handleDeleteTask}
							onEdit={handleEditTask}
							className="opacity-60"
							theme={{
								accentColor: "#d97706", // Amber for Thanksgiving
							}}
							borderColor="rgb(var(--color-amber-500))" // Amber border for Thanksgiving
						/>
					)}
				/>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showForm}
				title="Add New List Item"
				fields={[
					{
						id: "title",
						type: "text",
						placeholder: "List Item*",
						required: true,
					},
					{
						id: "description",
						type: "textarea",
						placeholder: "Description",
						rows: 2,
					},
					{
						id: "priority",
						type: "select",
						placeholder: "Priority",
						options: [
							{ value: "low", label: "Low Priority" },
							{ value: "medium", label: "Medium Priority" },
							{ value: "high", label: "High Priority" },
						],
					},
					{
						id: "cost",
						type: "number",
						placeholder: "Cost",
						step: "0.01",
					},
				]}
				initialValues={{ priority: "medium", category: "Shopping List" }}
				onSubmit={handleAddTask}
				onClose={closeForm}
				loading={loading}
				submitText={loading ? "Adding..." : "Add Item"}
				cancelText="Cancel"
				cardClassName="card card-tasks"
				submitButtonColor="#d97706"
			/>

			{/* Edit Task Modal */}
			<EditTaskModal
				isOpen={editingTask !== null}
				task={editingTask}
				onClose={handleCloseEdit}
				onSave={handleSaveEdit}
				loading={loading}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={deleteConfirm.show}
				{...getDeleteConfig("tasks")}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={loading}
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
					{ value: "cost", label: "Cost (High to Low)" },
				]}
				title="Sort Shopping Items"
			/>
		</div>
	);
}
