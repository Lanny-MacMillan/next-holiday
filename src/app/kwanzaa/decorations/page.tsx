"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useDecorationMutations } from "@/hooks/useDecorationMutations";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import SortModal from "@/components/modals/SortModal";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import AddButton from "@/components/common/AddButton";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

const defaultDecorationTasks = [
	{
		title: "Kinara Candle Lighting Ceremony",
		description: "Set up the kinara and prepare for daily candle lighting",
		category: "Decorations",
		priority: "high" as const,
	},
	{
		title: "Mkeka Mat Decoration",
		description: "Place and decorate the mkeka (straw mat) as the foundation",
		category: "Decorations",
		priority: "high" as const,
	},
	{
		title: "Karamu Feast Planning & Recipes",
		description: "Plan the traditional Kwanzaa feast and gather recipes",
		category: "Decorations",
		priority: "medium" as const,
	},
	{
		title: "Zawadi Gift Exchange",
		description: "Prepare handmade gifts for the zawadi exchange",
		category: "Decorations",
		priority: "medium" as const,
	},
	{
		title: "Storytelling and Poetry Reading (Kuumba - Creativity Day)",
		description: "Set up space for creative expression and storytelling",
		category: "Decorations",
		priority: "low" as const,
	},
	{
		title: "African Drum and Dance Workshop",
		description:
			"Prepare space and instruments for traditional music and dance",
		category: "Decorations",
		priority: "medium" as const,
	},
	{
		title: "African Art & Craft Making",
		description: "Set up materials and space for traditional African crafts",
		category: "Decorations",
		priority: "low" as const,
	},
	{
		title: "Family Heritage Reflection and Genealogy",
		description: "Create a space for family history and heritage display",
		category: "Decorations",
		priority: "medium" as const,
	},
	{
		title: "Unity Cup (Kikombe cha Umoja) Ceremony",
		description: "Prepare the unity cup and ceremonial space",
		category: "Decorations",
		priority: "high" as const,
	},
	{
		title:
			"Community Service and Volunteer Day (Ujima - Collective Work and Responsibility)",
		description: "Plan community service activities and outreach",
		category: "Decorations",
		priority: "medium" as const,
	},
	{
		title: "Vision Board or Goal-Setting Workshop (Nia - Purpose Day)",
		description: "Set up space for vision boards and goal-setting activities",
		category: "Decorations",
		priority: "low" as const,
	},
];

export default function KwanzaaDecorationsPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);

	// Use the decoration mutations hook
	const {
		holidayId,
		auth0User,
		decorations,
		loading,
		error,
		initialized,
		createDecoration,
		updateDecoration,
		editDecoration,
		deleteDecoration,
		updateDecorationState,
		editDecorationState,
		deleteDecorationState,
	} = useDecorationMutations();

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [showDefaultTasks, setShowDefaultTasks] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);
	const [taskToDelete, setTaskToDelete] = useState<any>(null);

	useEffect(() => {
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch]);

	// Check if default decoration tasks exist
	useEffect(() => {
		if (decorations.length === 0 && initialized) {
			setShowDefaultTasks(true);
		}
	}, [decorations, initialized]);

	async function handleAddTask(values: Record<string, any>) {
		if (!values.title?.trim()) return;
		if (!holidayId || !auth0User) return;

		try {
			const payload = {
				title: values.title,
				description: values.description || undefined,
				priority: values.priority as "low" | "medium" | "high",
				assignedTo: values.assignedTo || undefined,
				category: "Decorations",
				dueDate: values.dueDate || undefined,
				isCompleted: false,
			};

			await createDecoration({ holidayId, payload, auth0User }).unwrap();
			setShowForm(false);
		} catch (error) {
			console.error("Error creating decoration:", error);
		}
	}

	async function addDefaultDecorationTasks() {
		if (!holidayId || !auth0User) return;

		try {
			for (const task of defaultDecorationTasks) {
				const payload = {
					title: task.title,
					description: task.description,
					priority: task.priority,
					assignedTo: undefined,
					category: task.category,
					dueDate: undefined,
					isCompleted: false,
				};
				await createDecoration({ holidayId, payload, auth0User }).unwrap();
			}
			setShowDefaultTasks(false);
		} catch (error) {
			console.error("Error adding default decoration tasks:", error);
		}
	}

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
	}

	async function handleToggleTask(taskId: string) {
		if (!holidayId || !auth0User) return;

		try {
			const decoration = decorations.find((d: any) => d.id === taskId);
			if (decoration) {
				await updateDecoration({
					holidayId,
					taskId,
					isCompleted: !decoration.isCompleted,
					auth0User,
				}).unwrap();
			}
		} catch (error) {
			console.error("Error updating decoration:", error);
		}
	}

	function handleDeleteTask(taskId: string) {
		const task = decorations.find((d: any) => d.id === taskId);
		setTaskToDelete(task);
		setShowDeleteModal(true);
	}

	async function confirmDelete() {
		if (taskToDelete) {
			try {
				await deleteDecoration({
					holidayId: holidayId || "",
					taskId: taskToDelete.id,
					auth0User,
				}).unwrap();
				setShowDeleteModal(false);
				setTaskToDelete(null);
			} catch (error) {
				console.error("Error deleting decoration:", error);
			}
		}
	}

	function cancelDelete() {
		setShowDeleteModal(false);
		setTaskToDelete(null);
	}

	const handleEditTask = (task: any) => {
		setEditingTask(task);
		setShowEditModal(true);
	};

	async function handleEditTaskSubmit(values: Record<string, any>) {
		if (!editingTask || !holidayId || !auth0User) return;

		try {
			await editDecoration({
				holidayId,
				taskId: editingTask.id,
				payload: values,
				auth0User,
			}).unwrap();
			setShowEditModal(false);
			setEditingTask(null);
		} catch (error) {
			console.error("Error editing decoration:", error);
		}
	}

	function sortTasks(tasksToSort: any[]): any[] {
		switch (sortBy) {
			case "priority":
				const priorityOrder: { [key: string]: number } = {
					high: 3,
					medium: 2,
					low: 1,
				};
				return [...tasksToSort].sort(
					(a, b) =>
						(priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
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
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading decorations...
					</p>
				</div>
			</div>
		);
	}

	const sortedTasks = sortTasks(decorations);
	const incompleteTasks = sortedTasks.filter((task: any) => !task.isCompleted);
	const completedTasks = sortedTasks.filter((task: any) => task.isCompleted);

	// Get form configuration
	const formConfig = getFormConfig("tasks", editingTask ? "edit" : "add");
	const deleteConfig = getDeleteConfig("tasks");

	return (
		<div className="min-h-screen kwanzaa-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Decorations Checklist"
				backHref="/kwanzaa"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort Decorations"
				error={error ? "API Error" : undefined}
				holidayColor="red-600"
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Default Tasks Prompt */}
				{showDefaultTasks && (
					<div className="card card-tasks rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
						<h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
							✨ Set Up Kwanzaa Decorations
						</h3>
						<p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
							Would you like to add common Kwanzaa decoration tasks?
						</p>
						<div className="flex gap-2">
							<button
								onClick={addDefaultDecorationTasks}
								className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
							>
								Add Default Tasks
							</button>
							<button
								onClick={() => setShowDefaultTasks(false)}
								className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors text-sm"
							>
								Skip
							</button>
						</div>
					</div>
				)}

				<AddButton title="Decoration Task" onClick={openForm} color="red" />
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

				<div>
					<h2 className="font-semibold text-gray-800 dark:text-white mb-2">
						Incomplete ({incompleteTasks.length})
					</h2>
					<div className="card card-tasks rounded shadow">
						{incompleteTasks.length === 0 ? (
							<div className="px-4 py-3 text-gray-400 dark:text-gray-500 text-center">
								All decorations complete! ✨
							</div>
						) : (
							<ul className="divide-y divide-gray-200 dark:divide-gray-700">
								{incompleteTasks.map((task: any) => (
									<li
										key={task.id}
										className="flex items-center px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
										onClick={() => handleToggleTask(task.id)}
									>
										<input
											type="checkbox"
											checked={task.isCompleted}
											readOnly
											className="mr-3 accent-blue-500"
										/>
										<div className="flex-1">
											<div className="text-gray-900 dark:text-white">
												{task.title}
											</div>
											{task.description && (
												<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
													{task.description}
												</div>
											)}
											<div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
												<span
													className={`px-2 py-1 rounded ${
														task.priority === "high"
															? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
															: task.priority === "medium"
															? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
															: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
													}`}
												>
													{task.priority}
												</span>
												{task.assignedTo && (
													<span>Assigned: {task.assignedTo}</span>
												)}
												{task.category && <span>{task.category}</span>}
												{task.dueDate && (
													<span>
														Due: {new Date(task.dueDate).toLocaleDateString()}
													</span>
												)}
											</div>
										</div>
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteTask(task.id);
											}}
											className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
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
					<h2 className="font-semibold text-gray-400 dark:text-gray-500 mb-2">
						Completed ({completedTasks.length})
					</h2>
					<div className="card card-tasks rounded shadow">
						{completedTasks.length === 0 ? (
							<div className="px-4 py-3 text-gray-300 dark:text-gray-600 text-center">
								No completed tasks yet.
							</div>
						) : (
							<ul className="divide-y divide-gray-200 dark:divide-gray-700">
								{completedTasks.map((task: any) => (
									<li
										key={task.id}
										className="flex items-center px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 opacity-60"
										onClick={() => handleToggleTask(task.id)}
									>
										<input
											type="checkbox"
											checked={task.isCompleted}
											readOnly
											className="mr-3 accent-blue-500"
										/>
										<div className="flex-1">
											<div className="line-through text-gray-400 dark:text-gray-500">
												{task.title}
											</div>
											{task.description && (
												<div className="text-xs text-gray-400 dark:text-gray-500 line-through">
													{task.description}
												</div>
											)}
											{task.completedDate && (
												<div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
													Completed:{" "}
													{new Date(task.completedDate).toLocaleDateString()}
												</div>
											)}
										</div>
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteTask(task.id);
											}}
											className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
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

			{/* Form Modal */}

			{/* Form Modal */}
			<FormModal
				isOpen={showForm}
				title={formConfig.title}
				fields={formConfig.fields}
				initialValues={
					editingTask
						? {
								title: editingTask.title || "",
								description: editingTask.description || "",
								priority: editingTask.priority || "medium",
								assignedTo: editingTask.assignedTo || "",
								dueDate: editingTask.dueDate || "",
						  }
						: {}
				}
				onSubmit={editingTask ? handleEditTaskSubmit : handleAddTask}
				onClose={closeForm}
				loading={editDecorationState.isLoading}
				submitText={formConfig.submitText}
				cancelText={formConfig.cancelText}
				cardClassName={formConfig.cardClassName}
				submitButtonColor={formConfig.submitButtonColor}
			/>

			{/* Edit Modal */}
			<FormModal
				isOpen={showEditModal}
				title="Edit Decoration Task"
				fields={[
					{
						id: "title",
						type: "text" as const,
						placeholder: "Task Title*",
						required: true,
					},
					{
						id: "description",
						type: "textarea" as const,
						placeholder: "Description",
						rows: 3,
					},
					{
						id: "priority",
						type: "select" as const,
						placeholder: "Priority",
						options: [
							{ value: "low", label: "Low Priority" },
							{ value: "medium", label: "Medium Priority" },
							{ value: "high", label: "High Priority" },
						],
					},
					{
						id: "assignedTo",
						type: "text" as const,
						placeholder: "Assigned To",
					},
					{ id: "dueDate", type: "date" as const, placeholder: "Due Date" },
				]}
				initialValues={{
					title: editingTask?.title || "",
					description: editingTask?.description || "",
					priority: editingTask?.priority || "medium",
					assignedTo: editingTask?.assignedTo || "",
					dueDate: editingTask?.dueDate || "",
				}}
				onSubmit={handleEditTaskSubmit}
				onClose={() => {
					setShowEditModal(false);
					setEditingTask(null);
				}}
				loading={editDecorationState.isLoading}
				submitText="Update Task"
				cardClassName="card card-tasks"
			/>

			{/* Delete Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				title={deleteConfig.title}
				message={deleteConfig.message}
				itemName={taskToDelete?.title}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={deleteDecorationState.isLoading}
				cardClassName={deleteConfig.cardClassName}
				confirmText={deleteConfig.confirmText}
				cancelText={deleteConfig.cancelText}
				confirmButtonColor={deleteConfig.confirmButtonColor}
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
