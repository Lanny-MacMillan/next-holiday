"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import {
	selectHolidayPreferences,
	selectHomeInitialized,
	selectHomeData,
} from "@/store/selectors/home";
import { getHolidayDataFromRedux } from "@/utils/holidayData";
import {
	updateTaskInHomeData,
	addTaskToHomeData,
	removeTaskFromHomeData,
} from "@/store/slices/homeSlice";
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
import { useCostumeIdeasMutations } from "@/hooks/useCostumeIdeasMutations";

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

// Custom form configuration for costume ideas
const costumeFormConfig = {
	title: "Add New Costume Task",
	fields: [
		{
			id: "title",
			type: "text" as const,
			placeholder: "Costume Task Title*",
			required: true,
		},
		{
			id: "description",
			type: "textarea" as const,
			placeholder: "Description",
			rows: 2,
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
			placeholder: "Recipient",
		},
		{
			id: "dueDate",
			type: "date" as const,
			placeholder: "Due Date",
		},
	] as any[],
	submitText: "Add Costume Task",
	cancelText: "Cancel",
	cardClassName: "card card-tasks",
	submitButtonColor: "#f97316", // Orange for Halloween
};

const defaultCostumeTasks = [
	{
		title: "Plan Family Costumes",
		description: "Coordinate costumes for the whole family",
		category: "Costume Ideas",
		priority: "high" as const,
	},
	{
		title: "Buy Costume for Kids",
		description: "Purchase or make costumes for children",
		category: "Costume Ideas",
		priority: "high" as const,
	},
	{
		title: "DIY Costume Ideas",
		description: "Research homemade costume options",
		category: "Costume Ideas",
		priority: "medium" as const,
	},
	{
		title: "Costume Accessories",
		description: "Get props and accessories for costumes",
		category: "Costume Ideas",
		priority: "medium" as const,
	},
];

export default function HalloweenCostumeIdeasPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);

	// Get home data and holiday data from Redux
	const homeData = useAppSelector(selectHomeData);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const currentState = useAppSelector((state: any) => state);

	// Use the new costume ideas mutations hook
	const {
		holidayId,
		auth0User,
		loading,
		error,
		initialized,
		createCostumeIdeas,
		updateCostumeIdeas,
		editCostumeIdeas,
		deleteCostumeIdeas,
		createCostumeIdeasState,
		updateCostumeIdeasState,
		editCostumeIdeasState,
		deleteCostumeIdeasState,
	} = useCostumeIdeasMutations();

	// Get holiday data from Redux
	const holidayData = getHolidayDataFromRedux(holidayId, currentState);

	// Helper function to update Redux state after task operations
	const updateTaskInRedux = (
		taskData: any,
		operation: "add" | "update" | "delete"
	) => {
		if (!holidayId) return;

		switch (operation) {
			case "add":
				dispatch(addTaskToHomeData({ holidayId, task: taskData }));
				break;
			case "update":
				dispatch(
					updateTaskInHomeData({
						holidayId,
						taskId: taskData.id,
						updates: taskData,
					})
				);
				break;
			case "delete":
				dispatch(
					removeTaskFromHomeData({
						holidayId,
						taskId: taskData.id,
					})
				);
				break;
		}
	};

	// Get costume ideas from Redux data (filtered by category)
	const costumeIdeas =
		holidayData?.tasks?.filter(
			(task: any) => task.category === "Costume Ideas"
		) || [];

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		taskId: string | null;
	}>({
		show: false,
		taskId: null,
	});
	const [showDefaultTasks, setShowDefaultTasks] = useState(false);

	useEffect(() => {
		// Fetch contacts for address book functionality
		// Only fetch if home data is initialized (which contains contacts)
		if (homeInitialized) {
			dispatch(fetchContacts());
		}
	}, [dispatch, homeInitialized]);

	useEffect(() => {
		if (costumeIdeas.length === 0 && homeInitialized) {
			setShowDefaultTasks(true);
		}
	}, [costumeIdeas, homeInitialized]);

	const handleAddTask = async (formValues: Record<string, any>) => {
		if (!formValues.title?.trim() || !holidayId || !auth0User) return;

		try {
			const payload = {
				title: formValues.title,
				description: formValues.description || undefined,
				priority: formValues.priority as "low" | "medium" | "high",
				assignedTo: formValues.assignedTo || undefined,
				category: "Costume Ideas",
				dueDate: formValues.dueDate || undefined,
				isCompleted: false,
			};

			const result = await createCostumeIdeas({
				holidayId,
				payload,
				auth0User,
			}).unwrap();

			// Update Redux state directly
			updateTaskInRedux(result, "add");

			setShowForm(false);
		} catch (error) {
			console.error("Error creating costume task:", error);
		}
	};

	const addDefaultCostumeTasks = async () => {
		if (!holidayId || !auth0User) return;

		try {
			for (const task of defaultCostumeTasks) {
				const payload = {
					...task,
					isCompleted: false,
				};
				const result = await createCostumeIdeas({
					holidayId,
					payload,
					auth0User,
				}).unwrap();

				// Update Redux state directly
				updateTaskInRedux(result, "add");
			}
			setShowDefaultTasks(false);
		} catch (error) {
			console.error("Error adding default costume tasks:", error);
		}
	};

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
	}

	const handleToggleTask = async (taskId: string) => {
		if (!holidayId || !auth0User) return;

		try {
			const task = costumeIdeas.find((t: any) => t.id === taskId);
			if (task) {
				const newIsCompleted = !task.isCompleted;
				await updateCostumeIdeas({
					holidayId,
					taskId,
					isCompleted: newIsCompleted,
					auth0User,
				}).unwrap();

				// Update Redux state directly
				updateTaskInRedux(
					{ id: taskId, isCompleted: newIsCompleted },
					"update"
				);
			}
		} catch (error) {
			console.error("Error updating costume task:", error);
		}
	};

	const handleDeleteTask = (taskId: string) => {
		setDeleteConfirm({ show: true, taskId });
	};

	const handleEditTask = (task: any) => {
		setEditingTask(task);
	};

	const handleSaveEdit = async (updatedTask: any) => {
		if (editingTask && holidayId && auth0User) {
			try {
				const result = await editCostumeIdeas({
					holidayId,
					taskId: editingTask.id,
					payload: {
						title: updatedTask.title,
						description: updatedTask.description || undefined,
						priority: updatedTask.priority as "low" | "medium" | "high",
						assignedTo: updatedTask.assignedTo || undefined,
						category: "Costume Ideas",
						dueDate: updatedTask.dueDate || undefined,
					},
					auth0User,
				}).unwrap();

				// Update Redux state directly
				updateTaskInRedux(result, "update");

				setEditingTask(null);
			} catch (error) {
				console.error("Error updating costume task:", error);
			}
		}
	};

	function handleCloseEdit() {
		setEditingTask(null);
	}

	const confirmDelete = async () => {
		if (deleteConfirm.taskId && holidayId && auth0User) {
			try {
				await deleteCostumeIdeas({
					holidayId,
					taskId: deleteConfirm.taskId,
					auth0User,
				}).unwrap();

				// Update Redux state directly
				updateTaskInRedux({ id: deleteConfirm.taskId }, "delete");

				setDeleteConfirm({ show: false, taskId: null });
			} catch (error) {
				console.error("Error deleting costume task:", error);
			}
		}
	};

	function cancelDelete() {
		setDeleteConfirm({ show: false, taskId: null });
	}

	function sortTasks(tasksToSort: any[]): any[] {
		switch (sortBy) {
			case "priority":
				return [...tasksToSort].sort((a, b) => {
					const priorityOrder = { high: 3, medium: 2, low: 1 };
					return priorityOrder[b.priority] - priorityOrder[a.priority];
				});
			case "dateDue":
				return [...tasksToSort].sort((a, b) => {
					if (!a.dueDate && !b.dueDate) return 0;
					if (!a.dueDate) return 1;
					if (!b.dueDate) return -1;
					return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
				});
			case "assignedTo":
				return [...tasksToSort].sort((a, b) => {
					if (!a.assignedTo && !b.assignedTo) return 0;
					if (!a.assignedTo) return 1;
					if (!b.assignedTo) return -1;
					return a.assignedTo.localeCompare(b.assignedTo);
				});
			case "category":
				return [...tasksToSort].sort((a, b) => {
					if (!a.category && !b.category) return 0;
					if (!a.category) return 1;
					if (!b.category) return -1;
					return a.category.localeCompare(b.category);
				});
			default:
				return tasksToSort;
		}
	}

	// Show loading only if home data is not initialized
	if (!homeInitialized) {
		return (
			<div className="min-h-screen halloween-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading tasks...</p>
				</div>
			</div>
		);
	}

	const sortedTasks = sortTasks(costumeIdeas);
	const incompleteTasks = sortedTasks.filter((task: any) => !task.isCompleted);
	const completedTasks = sortedTasks.filter((task: any) => task.isCompleted);

	return (
		<div className="min-h-screen halloween-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="👻 Costume Ideas"
				backHref="/halloween"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort tasks"
				description="Keep track of costume ideas!"
				holidayColor="orange-500"
				error={undefined}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Default Tasks Modal */}
				{showDefaultTasks && (
					<div className="card rounded-lg p-6 mb-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700">
						<h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
							🎃 Welcome to Costume Planning!
						</h3>
						<p className="text-gray-600 dark:text-gray-400 mb-4">
							Let's get you started with some essential costume planning tasks.
						</p>
						<button
							onClick={addDefaultCostumeTasks}
							className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
						>
							Add Default Tasks
						</button>
					</div>
				)}

				<AddButton title="Task" onClick={openForm} holidayColor="orange" />

				<div className="flex items-center justify-center">
					{sortBy !== "none" && (
						<div className="text-center text-sm text-gray-600 dark:text-gray-400">
							{sortBy === "priority" && "Sorted by Priority"}
							{sortBy === "dateDue" && "Sorted by Date Due"}
							{sortBy === "assignedTo" && "Sorted by Recipient"}
							{sortBy === "category" && "Sorted by Category"}
						</div>
					)}
				</div>

				<TaskSection
					title="Incomplete"
					items={incompleteTasks}
					isCompleted={false}
					emptyMessage="No costume ideas yet. Add your first costume task!"
					completedMessage="No costume ideas yet. Add your first costume task!"
					renderItem={(task: any) => (
						<ToDoCard
							
							task={task}
							onToggleComplete={handleToggleTask}
							onDelete={handleDeleteTask}
							onEdit={handleEditTask}
							theme={{
								accentColor: "#f97316", // Orange for Halloween
							}}
							borderColor="rgb(var(--color-orange-500))" // Orange border for Halloween
							disableInternalModal={true}
						/>
					)}
				/>

				<TaskSection
					title="Completed"
					items={completedTasks}
					isCompleted={true}
					emptyMessage="No completed costume tasks yet."
					completedMessage="No completed costume tasks yet."
					renderItem={(task: any) => (
						<ToDoCard
							
							task={task}
							onToggleComplete={handleToggleTask}
							onDelete={handleDeleteTask}
							onEdit={handleEditTask}
							className="opacity-60"
							theme={{
								accentColor: "#f97316", // Orange for Halloween
							}}
							borderColor="rgb(var(--color-orange-500))" // Orange border for Halloween
							disableInternalModal={true}
						/>
					)}
				/>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showForm}
				title={costumeFormConfig.title}
				fields={costumeFormConfig.fields}
				onSubmit={handleAddTask}
				onClose={closeForm}
				loading={createCostumeIdeasState.isLoading}
				submitText={
					createCostumeIdeasState.isLoading
						? "Adding..."
						: costumeFormConfig.submitText
				}
				cancelText={costumeFormConfig.cancelText}
				cardClassName="card"
				submitButtonColor={costumeFormConfig.submitButtonColor}
			/>

			{/* Edit Task Modal */}
			<EditTaskModal
				isOpen={editingTask !== null}
				task={editingTask}
				onClose={handleCloseEdit}
				onSave={handleSaveEdit}
				loading={editCostumeIdeasState.isLoading}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={deleteConfirm.show}
				{...getDeleteConfig("tasks")}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={deleteCostumeIdeasState.isLoading}
				cardClassName="card"
				confirmText="Delete"
				cancelText="Cancel"
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
					{ value: "assignedTo", label: "Recipient" },
					{ value: "category", label: "Category" },
				]}
				title="Sort Tasks"
			/>
		</div>
	);
}
