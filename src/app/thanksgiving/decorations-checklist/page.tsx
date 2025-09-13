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

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

const defaultDecorationTasks = [
	{
		title: "Set up Thanksgiving table",
		description: "Decorate the dining table for Thanksgiving",
		category: "Decorations",
		priority: "high",
	},
	{
		title: "Arrange fall centerpiece",
		description: "Create a fall-themed centerpiece",
		category: "Decorations",
		priority: "medium",
	},
	{
		title: "Hang Thanksgiving banners",
		description: "Display Thanksgiving-themed decorations",
		category: "Decorations",
		priority: "medium",
	},
	{
		title: "Set up outdoor decorations",
		description: "Prepare outdoor fall decorations",
		category: "Decorations",
		priority: "low",
	},
];

export default function ThanksgivingDecorationsPage() {
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

	// Get current Redux state for skip logic
	const currentState = useAppSelector((state: any) => state);

	// Get home data and holiday data from Redux
	const homeData = useAppSelector(selectHomeData);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const holidayData = getHolidayDataFromRedux(holidayId, currentState);

	// Helper function to update Redux state after decoration operations
	const updateDecorationInRedux = (
		decorationData: any,
		operation: "add" | "update" | "delete"
	) => {
		if (!holidayId) return;

		switch (operation) {
			case "add":
				dispatch(addTaskToHomeData({ holidayId, task: decorationData }));
				break;
			case "update":
				dispatch(
					updateTaskInHomeData({
						holidayId,
						taskId: decorationData.id,
						updates: decorationData,
					})
				);
				break;
			case "delete":
				dispatch(
					removeTaskFromHomeData({
						holidayId,
						taskId: decorationData.id,
					})
				);
				break;
		}
	};

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		taskId: string | null;
	}>({
		show: false,
		taskId: null,
	});
	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [showDefaultTasks, setShowDefaultTasks] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);

	useEffect(() => {
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch]);

	// Check if default decoration tasks exist
	useEffect(() => {
		// Use only Redux data - filter tasks by category for decorations
		const displayDecorations =
			holidayData && homeInitialized && holidayData.decorations
				? holidayData.decorations
				: [];

		if (displayDecorations.length === 0 && homeInitialized) {
			setShowDefaultTasks(true);
		}
	}, [holidayData, homeInitialized]);

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

			const result = await createDecoration({
				holidayId,
				payload,
				auth0User,
			}).unwrap();

			// Update Redux state directly
			updateDecorationInRedux(result, "add");

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
				const result = await createDecoration({
					holidayId,
					payload,
					auth0User,
				}).unwrap();

				// Update Redux state directly
				updateDecorationInRedux(result, "add");
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
			// Find the current decoration to get its completion status from Redux data
			const currentDecoration = displayDecorations.find(
				(d: any) => d.id === taskId
			);
			if (!currentDecoration) return;

			// Toggle the completion status
			const newIsCompleted = !currentDecoration.isCompleted;

			await updateDecoration({
				holidayId,
				taskId,
				isCompleted: newIsCompleted,
				auth0User,
			}).unwrap();

			// Update Redux state directly
			updateDecorationInRedux(
				{ id: taskId, isCompleted: newIsCompleted },
				"update"
			);
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
			const result = await editDecoration({
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

			// Update Redux state directly
			updateDecorationInRedux(result, "update");

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

				// Update Redux state directly
				updateDecorationInRedux({ id: deleteConfirm.taskId }, "delete");

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

	// Show loading only if home data is not initialized
	if (!homeInitialized) {
		return (
			<div className="min-h-screen thanksgiving-tasks-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading decorations...
					</p>
				</div>
			</div>
		);
	}

	// Use only Redux data - filter tasks by category for decorations
	const displayDecorations =
		holidayData && homeInitialized && holidayData.decorations
			? holidayData.decorations
			: [];

	// Debug: Log decoration data
	useEffect(() => {
		console.log("Thanksgiving decorations - holidayId:", holidayId);
		console.log("Thanksgiving decorations - holidayData:", holidayData);
		console.log("Thanksgiving decorations - homeInitialized:", homeInitialized);
		console.log(
			"Thanksgiving decorations - displayDecorations:",
			displayDecorations
		);
	}, [holidayId, holidayData, homeInitialized, displayDecorations]);

	const sortedTasks = sortTasks(displayDecorations);
	const incompleteTasks = sortedTasks.filter((task: any) => !task.isCompleted);
	const completedTasks = sortedTasks.filter((task: any) => task.isCompleted);

	const renderTaskItem = (task: any) => (
		<DecorationsListItem
			key={task.id}
			task={task}
			onToggleTask={handleToggleTask}
			onDeleteTask={handleDeleteTask}
			onEditTask={handleEditTask}
			loading={loading || updateDecorationState.isLoading}
			holidayColor="thanksgiving-tasks-gradient"
		/>
	);

	return (
		<div className="min-h-screen thanksgiving-tasks-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Decorations"
				backHref="/thanksgiving"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort tasks"
				description="Keep track of Thanksgiving decorations!"
				holidayColor="amber-500"
				error={undefined}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Default Tasks Prompt */}
				{showDefaultTasks && (
					<div className="card card-tasks rounded-lg p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700">
						<h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
							✨ Set Up Thanksgiving Decorations
						</h3>
						<p className="text-amber-700 dark:text-amber-300 text-sm mb-3">
							Would you like to add common Thanksgiving decoration tasks?
						</p>
						<div className="flex gap-2">
							<button
								onClick={addDefaultDecorationTasks}
								className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 transition-colors text-sm"
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

				<AddButton title="Decoration Task" onClick={openForm} color="amber" />
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
					renderItem={renderTaskItem}
					cardClassName="card-tasks"
				/>

				<TaskSection
					title="Completed"
					items={completedTasks}
					isCompleted={true}
					emptyMessage="No completed tasks yet."
					completedMessage="No completed tasks yet."
					renderItem={renderTaskItem}
					cardClassName="card-tasks"
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
