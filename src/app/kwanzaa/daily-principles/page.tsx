"use client";

import { useState, useEffect } from "react";
import {
	selectHolidayPreferences,
	selectHomeInitialized,
	selectHomeData,
} from "@/store/selectors/home";
import { getHolidayDataFromRedux } from "@/utils/holidayData";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateTaskInHomeData } from "@/store/slices/homeSlice";
import { useFormModalMutation } from "@/hooks/useFormModalMutation";
import {
	useUpdateKwanzaaPrinciplesMutation,
	useEditKwanzaaPrinciplesMutation,
	useDeleteKwanzaaPrinciplesMutation,
} from "@/store/api";
import SortModal from "@/components/modals/SortModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

// Default Kwanzaa principles for preloading
const defaultKwanzaaPrinciples = [
	{
		dayNumber: 1,
		name: "Umoja (Unity)",
		description: "First day of Kwanzaa - focus on unity",
		priority: "high" as const,
	},
	{
		dayNumber: 2,
		name: "Kujichagulia (Self-Determination)",
		description: "Second day of Kwanzaa - focus on self-determination",
		priority: "high" as const,
	},
	{
		dayNumber: 3,
		name: "Ujima (Collective Work and Responsibility)",
		description: "Third day of Kwanzaa - focus on collective work",
		priority: "high" as const,
	},
	{
		dayNumber: 4,
		name: "Ujamaa (Cooperative Economics)",
		description: "Fourth day of Kwanzaa - focus on cooperative economics",
		priority: "high" as const,
	},
	{
		dayNumber: 5,
		name: "Nia (Purpose)",
		description: "Fifth day of Kwanzaa - focus on purpose",
		priority: "high" as const,
	},
	{
		dayNumber: 6,
		name: "Kuumba (Creativity)",
		description: "Sixth day of Kwanzaa - focus on creativity",
		priority: "high" as const,
	},
	{
		dayNumber: 7,
		name: "Imani (Faith)",
		description: "Seventh day of Kwanzaa - focus on faith",
		priority: "high" as const,
	},
];

export default function DailyPrinciplesPage() {
	const dispatch = useAppDispatch();
	const {
		holidayId,
		mutation,
		isLoading: mutationLoading,
		error: mutationError,
		auth0User,
	} = useFormModalMutation();

	// Get current Redux state for skip logic
	const currentState = useAppSelector((state: any) => state);

	// Get home data and holiday data from Redux
	const homeData = useAppSelector(selectHomeData);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const holidayData = getHolidayDataFromRedux(holidayId, currentState);

	// Helper function to update Redux state after task operations
	const updateTaskInRedux = (
		taskData: any,
		operation: "add" | "update" | "delete"
	) => {
		if (!holidayId) return;

		switch (operation) {
			case "add":
				// For now, we'll rely on the API cache invalidation to refresh the data
				// TODO: Add addTaskToHomeData function to homeSlice if needed
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
				// For now, we'll rely on the API cache invalidation to refresh the data
				// TODO: Add removeTaskFromHomeData function to homeSlice if needed
				break;
		}
	};

	// Update task mutation
	const [updateTask, { isLoading: updateLoading }] =
		useUpdateKwanzaaPrinciplesMutation();

	// Edit and delete mutations
	const [editTask, { isLoading: editLoading }] =
		useEditKwanzaaPrinciplesMutation();
	const [deleteTask, { isLoading: deleteLoading }] =
		useDeleteKwanzaaPrinciplesMutation();

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showSortModal, setShowSortModal] = useState(false);
	const [showFormModal, setShowFormModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showDefaultPrinciples, setShowDefaultPrinciples] = useState(false);
	const [selectedTask, setSelectedTask] = useState<any>(null);
	const [taskToDelete, setTaskToDelete] = useState<any>(null);

	// Use only Redux data - no fallback to API calls
	const displayTasks =
		holidayData && homeInitialized && holidayData.tasks
			? holidayData.tasks.filter(
					(task: any) => task.category === "Daily Principles"
			  )
			: [];

	// Check if default principles exist
	useEffect(() => {
		if (displayTasks.length === 0 && homeInitialized) {
			setShowDefaultPrinciples(true);
		}
	}, [displayTasks, homeInitialized]);

	// Debug: Log task data
	useEffect(() => {
		console.log("Daily Principles - holidayId:", holidayId);
		console.log("Daily Principles - holidayData:", holidayData);
		console.log("Daily Principles - homeInitialized:", homeInitialized);
		console.log("Daily Principles - displayTasks:", displayTasks);
	}, [holidayId, holidayData, homeInitialized, displayTasks]);

	const handleToggleTask = async (taskId: string) => {
		if (!holidayId) return;

		try {
			// Find the current task to get its completion status from Redux data
			const currentTask = displayTasks.find((task: any) => task.id === taskId);
			if (!currentTask) return;

			// Toggle the completion status
			const newIsCompleted = !currentTask.isCompleted;

			// Update the task in the database
			await updateTask({
				holidayId: holidayId || "",
				taskId,
				isCompleted: newIsCompleted,
				auth0User,
			}).unwrap();

			// Update Redux state directly
			updateTaskInRedux({ id: taskId, isCompleted: newIsCompleted }, "update");
		} catch (error) {
			console.error("Error toggling task:", error);
		}
	};

	const handleDeleteTask = (task: any) => {
		setTaskToDelete(task);
		setShowDeleteModal(true);
	};

	const confirmDelete = async () => {
		if (!taskToDelete || !holidayId) return;

		try {
			await deleteTask({
				holidayId,
				taskId: taskToDelete.id,
				auth0User,
			}).unwrap();

			// Update Redux state directly
			updateTaskInRedux({ id: taskToDelete.id }, "delete");

			setShowDeleteModal(false);
			setTaskToDelete(null);
		} catch (error) {
			console.error("Error deleting task:", error);
		}
	};

	const cancelDelete = () => {
		setShowDeleteModal(false);
		setTaskToDelete(null);
	};

	const handleAddPrinciple = async (formValues: Record<string, any>) => {
		if (!holidayId || !mutation) return;

		try {
			const payload = {
				...formValues,
				category: "Daily Principles",
			};
			const result = await mutation({ holidayId, payload, auth0User }).unwrap();

			// Update Redux state directly
			updateTaskInRedux(result, "add");

			setShowFormModal(false);
		} catch (error) {
			console.error("Error creating principle:", error);
		}
	};

	const addDefaultPrinciples = async () => {
		if (!holidayId || !mutation) return;

		try {
			for (const principle of defaultKwanzaaPrinciples) {
				const payload = {
					title: principle.name,
					description: principle.description,
					priority: principle.priority,
					category: "Daily Principles",
					isCompleted: false,
				};

				const result = await mutation({
					holidayId,
					payload,
					auth0User,
				}).unwrap();

				// Update Redux state directly
				updateTaskInRedux(result, "add");
			}
			setShowDefaultPrinciples(false);
		} catch (error) {
			console.error("Error adding default principles:", error);
		}
	};

	const handleEditPrinciple = async (formValues: Record<string, any>) => {
		if (!selectedTask || !holidayId) return;

		try {
			// Clean up the form values - convert empty strings to undefined
			const cleanedPayload = {
				title: formValues.title,
				description: formValues.description || undefined,
				priority: formValues.priority,
				assignedTo: formValues.assignedTo || undefined,
				dueDate: formValues.dueDate || undefined,
			};

			const result = await editTask({
				holidayId,
				taskId: selectedTask.id,
				payload: cleanedPayload,
				auth0User,
			}).unwrap();

			// Update Redux state directly
			updateTaskInRedux(result, "update");

			setShowFormModal(false);
			setSelectedTask(null);
		} catch (error) {
			console.error("Error editing principle:", error);
		}
	};

	const openEditModal = (task: any) => {
		setSelectedTask(task);
		setShowFormModal(true);
	};

	const closeForm = () => {
		setShowFormModal(false);
		setSelectedTask(null);
	};

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

	// Show loading only if home data is not initialized
	if (!homeInitialized) {
		return (
			<div className="min-h-screen kwanzaa-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading daily principles...
					</p>
				</div>
			</div>
		);
	}

	const sortedTasks = sortTasks(displayTasks || []);
	const incompleteTasks = sortedTasks.filter((task: any) => !task.isCompleted);
	const completedTasks = sortedTasks.filter((task: any) => task.isCompleted);

	// Get form configuration with custom titles for Kwanzaa principles
	const formConfig = getFormConfig(
		"tasks",
		selectedTask ? "edit" : "add",
		selectedTask ? "Edit Principle" : "Add New Principle",
		"Principle Title*",
		selectedTask ? "Update Principle" : "Add Principle"
	);
	const deleteConfig = getDeleteConfig("tasks");

	const renderTaskItem = (task: any) => (
		<div
			
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
				<div className="text-gray-900 dark:text-white">{task.title}</div>
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
					{task.assignedTo && <span>Assigned: {task.assignedTo}</span>}
					{task.category && <span>{task.category}</span>}
					{task.dueDate && (
						<span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
					)}
				</div>
			</div>
			<div className="flex gap-2">
				<button
					onClick={(e) => {
						e.stopPropagation();
						openEditModal(task);
					}}
					className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
					disabled={updateLoading}
				>
					Edit
				</button>
				<button
					onClick={(e) => {
						e.stopPropagation();
						handleDeleteTask(task);
					}}
					className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
					disabled={updateLoading}
				>
					Delete
				</button>
			</div>
		</div>
	);

	const renderCompletedTaskItem = (task: any) => (
		<div
			
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
						Completed: {new Date(task.completedDate).toLocaleDateString()}
					</div>
				)}
			</div>
			<div className="flex gap-2">
				<button
					onClick={(e) => {
						e.stopPropagation();
						openEditModal(task);
					}}
					className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
					disabled={updateLoading}
				>
					Edit
				</button>
				<button
					onClick={(e) => {
						e.stopPropagation();
						handleDeleteTask(task);
					}}
					className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
					disabled={updateLoading}
				>
					Delete
				</button>
			</div>
		</div>
	);

	return (
		<div className="min-h-screen kwanzaa-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Daily Principle Tracker"
				backHref="/kwanzaa"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort Principles"
				error={mutationError ? "API Error" : undefined}
				holidayColor="red-600"
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Default Principles Prompt */}
				{showDefaultPrinciples && (
					<div className="card card-tasks rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
						<h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
							🕯️ Set Up Kwanzaa Principles
						</h3>
						<p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
							Would you like to add the seven traditional Kwanzaa principles to
							track daily?
						</p>
						<div className="flex gap-2">
							<button
								onClick={addDefaultPrinciples}
								className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
							>
								Add Default Principles
							</button>
							<button
								onClick={() => setShowDefaultPrinciples(false)}
								className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors text-sm"
							>
								Skip
							</button>
						</div>
					</div>
				)}

				<AddButton
					title="Principle"
					onClick={() => setShowFormModal(true)}
					color="red"
				/>
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
					emptyMessage="All candles lit! 🕯️✨"
					completedMessage=""
					renderItem={renderTaskItem}
				/>

				<TaskSection
					title="Completed"
					items={completedTasks}
					isCompleted={true}
					emptyMessage="No completed tasks yet."
					completedMessage=""
					renderItem={renderCompletedTaskItem}
				/>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showFormModal}
				title={selectedTask ? "Edit Principle" : "Add Principle"}
				fields={formConfig.fields}
				initialValues={
					selectedTask
						? {
								title: selectedTask.title || "",
								description: selectedTask.description || "",
								priority: selectedTask.priority || "medium",
								assignedTo: selectedTask.assignedTo || "",
								dueDate: selectedTask.dueDate || "",
						  }
						: {}
				}
				onSubmit={selectedTask ? handleEditPrinciple : handleAddPrinciple}
				onClose={closeForm}
				loading={mutationLoading || editLoading}
				submitText={selectedTask ? "Update Principle" : "Add Principle"}
				cancelText="Cancel"
				cardClassName="card card-tasks"
				submitButtonColor="#dc2626"
			/>

			{/* Delete Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				title="Delete Principle"
				message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={deleteLoading}
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
