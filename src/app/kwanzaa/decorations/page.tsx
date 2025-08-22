"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import SortModal from "@/components/modals/SortModal";
import DeleteModal from "@/components/modals/DeleteModal";
import FormModal from "@/components/modals/FormModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import { DecorationsListItem } from "@/components/cards/decorations";
import { useDecorationMutations } from "@/hooks/useDecorationMutations";

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

	// Use the new decoration mutations hook
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
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		taskId: string | null;
	}>({
		show: false,
		taskId: null,
	});
	const [showDefaultTasks, setShowDefaultTasks] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);

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
		setDeleteConfirm({ show: true, taskId });
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
				payload: {
					title: values.title,
					description: values.description || undefined,
					priority: values.priority as "low" | "medium" | "high",
					assignedTo: values.assignedTo || undefined,
					category: "Decorations",
					dueDate: values.dueDate || undefined,
				},
				auth0User,
			}).unwrap();
			setShowEditModal(false);
			setEditingTask(null);
		} catch (error) {
			console.error("Error editing decoration:", error);
		}
	}

	function closeEditModal() {
		setShowEditModal(false);
		setEditingTask(null);
	}

	async function confirmDelete() {
		if (deleteConfirm.taskId && holidayId && auth0User) {
			try {
				await deleteDecoration({
					holidayId,
					taskId: deleteConfirm.taskId,
					auth0User,
				}).unwrap();
				setDeleteConfirm({ show: false, taskId: null });
			} catch (error) {
				console.error("Error deleting decoration:", error);
			}
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, taskId: null });
	}

	function sortTasks(tasksToSort: any[]): any[] {
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
						Loading decorations...
					</p>
				</div>
			</div>
		);
	}

	const sortedTasks = sortTasks(decorations);
	const incompleteTasks = sortedTasks.filter((task: any) => !task.isCompleted);
	const completedTasks = sortedTasks.filter((task: any) => task.isCompleted);

	return (
		<div className="min-h-screen kwanzaa-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Decorations"
				backHref="/kwanzaa"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort tasks"
				description="Keep track of Decorations!"
				holidayColor="red-500"
				error={error ? "API Error" : undefined}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Default Tasks Prompt */}
				{showDefaultTasks && (
					<div className="card card-tasks rounded-lg p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
						<h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
							✨ Set Up Kwanzaa Decorations
						</h3>
						<p className="text-red-700 dark:text-red-300 text-sm mb-3">
							Would you like to add common Kwanzaa decoration tasks?
						</p>
						<div className="flex gap-2">
							<button
								onClick={addDefaultDecorationTasks}
								className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors text-sm"
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

				<TaskSection
					title="Incomplete"
					items={incompleteTasks}
					isCompleted={false}
					emptyMessage="All decorations complete! ✨"
					completedMessage=""
					renderItem={(task: any) => (
						<DecorationsListItem
							key={task.id}
							task={task}
							onToggleTask={handleToggleTask}
							onDeleteTask={handleDeleteTask}
							onEditTask={handleEditTask}
							loading={loading || updateDecorationState.isLoading}
							holidayColor="bg-gradient-to-br from-red-400 to-red-600"
						/>
					)}
				/>

				<TaskSection
					title="Completed"
					items={completedTasks}
					isCompleted={true}
					emptyMessage="No completed tasks yet."
					completedMessage=""
					renderItem={(task: any) => (
						<DecorationsListItem
							key={task.id}
							task={task}
							onToggleTask={handleToggleTask}
							onDeleteTask={handleDeleteTask}
							onEditTask={handleEditTask}
							loading={loading || updateDecorationState.isLoading}
							holidayColor="bg-gradient-to-br from-red-400 to-red-600"
						/>
					)}
				/>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showForm}
				title="Add New Decoration Task"
				fields={[
					{
						id: "title",
						type: "text",
						placeholder: "Task Title*",
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
					{ id: "assignedTo", type: "text", placeholder: "Assigned To" },
					{ id: "dueDate", type: "date", placeholder: "Due Date" },
				]}
				initialValues={{
					title: "",
					description: "",
					priority: "medium",
					assignedTo: "",
					dueDate: "",
				}}
				onSubmit={handleAddTask}
				onClose={closeForm}
				loading={loading}
				submitText="Add Task"
				cardClassName="card-tasks"
			/>

			{/* Edit Modal */}
			<FormModal
				isOpen={showEditModal}
				title="Edit Decoration Task"
				fields={[
					{
						id: "title",
						type: "text",
						placeholder: "Task Title*",
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
					{ id: "assignedTo", type: "text", placeholder: "Assigned To" },
					{ id: "dueDate", type: "date", placeholder: "Due Date" },
				]}
				initialValues={{
					title: editingTask?.title || "",
					description: editingTask?.description || "",
					priority: editingTask?.priority || "medium",
					assignedTo: editingTask?.assignedTo || "",
					dueDate: editingTask?.dueDate || "",
				}}
				onSubmit={handleEditTaskSubmit}
				onClose={closeEditModal}
				loading={editDecorationState.isLoading}
				submitText="Update Task"
				cardClassName="card-tasks"
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={deleteConfirm.show}
				onCancel={cancelDelete}
				onConfirm={confirmDelete}
				loading={deleteDecorationState.isLoading}
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
