"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import {
	selectHolidayPreferences,
	selectHomeInitialized,
	selectHomeData,
} from "@/store/selectors/home";
import {
	addDecorationToHomeData,
	removeDecorationFromHomeData,
	updateDecorationInHomeData,
} from "@/store/slices/homeSlice";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";
import { getHolidayDataFromRedux } from "@/utils/holidayData";
import {
	useCreateDecorationMutation,
	useUpdateDecorationMutation,
	useEditDecorationMutation,
	useDeleteDecorationMutation,
} from "@/store/api";
import SortModal from "@/components/modals/SortModal";
import DeleteModal from "@/components/modals/DeleteModal";
import FormModal from "@/components/modals/FormModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import { DecorationsListItem } from "@/components/cards/decorations";
import { useAuth0 } from "@auth0/auth0-react";

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

const defaultDecorationTasks = [
	{
		title: "Set up New Year countdown display",
		description: "Prepare countdown decorations",
		category: "Decorations",
		priority: "high",
	},
	{
		title: "Hang New Year banners",
		description: "Display New Year-themed banners",
		category: "Decorations",
		priority: "medium",
	},
	{
		title: "Arrange New Year centerpiece",
		description: "Create a festive centerpiece",
		category: "Decorations",
		priority: "medium",
	},
	{
		title: "Set up party decorations",
		description: "Prepare party decorations and balloons",
		category: "Decorations",
		priority: "high",
	},
];

export default function NewYearDecorationsPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);
	const { user: auth0User } = useAuth0();

	// Get Redux data
	const holidayPreferences = useAppSelector(selectHolidayPreferences);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const homeData = useAppSelector(selectHomeData);

	// Get holiday ID for New Year
	const holidayId = homeInitialized
		? getHolidayIdFromRoute("/new-year", holidayPreferences)
		: null;

	// Get current Redux state for holiday data
	const currentState = useAppSelector((state: any) => state);
	const holidayData = getHolidayDataFromRedux(holidayId, currentState);

	// Get decorations from Redux data
	const decorations = holidayData?.decorations || [];

	// Debug logging
	useEffect(() => {
		console.log("=== Decorations Debug ===");
		console.log("holidayId:", holidayId);
		console.log("holidayData:", holidayData);
		console.log("holidayData?.decorations:", holidayData?.decorations);
		console.log("decorations:", decorations);
		console.log("=== End Decorations Debug ===");
	}, [holidayId, holidayData, decorations]);

	// Get mutations for CRUD operations
	const [createDecoration, createDecorationState] =
		useCreateDecorationMutation();
	const [updateDecoration, updateDecorationState] =
		useUpdateDecorationMutation();
	const [editDecoration, editDecorationState] = useEditDecorationMutation();
	const [deleteDecoration, deleteDecorationState] =
		useDeleteDecorationMutation();

	// Loading and error states
	const loading =
		createDecorationState.isLoading ||
		updateDecorationState.isLoading ||
		editDecorationState.isLoading ||
		deleteDecorationState.isLoading;
	const error =
		createDecorationState.error ||
		updateDecorationState.error ||
		editDecorationState.error ||
		deleteDecorationState.error;
	const initialized = homeInitialized;

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
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);
	const [showDefaultTasks, setShowDefaultTasks] = useState(false);

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

			const result = await createDecoration({
				holidayId,
				payload,
				auth0User,
			}).unwrap();

			// Add to Redux store immediately
			dispatch(
				addDecorationToHomeData({
					holidayId,
					decoration: result,
				})
			);

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

				// Update Redux store immediately
				dispatch(
					updateDecorationInHomeData({
						holidayId,
						decorationId: taskId,
						updates: {
							isCompleted: !decoration.isCompleted,
							completedDate: !decoration.isCompleted
								? new Date().toISOString()
								: null,
						},
					})
				);
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

			// Update Redux store immediately
			dispatch(
				updateDecorationInHomeData({
					holidayId,
					decorationId: editingTask.id,
					updates: result,
				})
			);

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

				// Remove from Redux store immediately
				dispatch(
					removeDecorationFromHomeData({
						holidayId,
						decorationId: deleteConfirm.taskId,
					})
				);

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

	if (!initialized) {
		return (
			<div className="min-h-screen new-year-tasks-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
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

	const renderTaskItem = (task: any) => (
		<DecorationsListItem
			
			task={task}
			onToggleTask={handleToggleTask}
			onDeleteTask={handleDeleteTask}
			onEditTask={handleEditTask}
			loading={loading}
			holidayColor="new-year-tasks-gradient"
		/>
	);

	return (
		<div className="min-h-screen new-year-tasks-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Decorations"
				backHref="/new-year"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort tasks"
				description="Keep track of New Year decorations!"
				holidayColor="amber-600"
				error={error ? "API Error" : undefined}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Default Tasks Prompt */}
				{showDefaultTasks && (
					<div className="card card-tasks rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
						<h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">
							✨ Set Up New Year Decorations
						</h3>
						<p className="text-purple-700 dark:text-purple-300 text-sm mb-3">
							Would you like to add common New Year decoration tasks?
						</p>
						<div className="flex gap-2">
							<button
								onClick={addDefaultDecorationTasks}
								className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors text-sm"
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
				loading={loading}
				submitText="Update Task"
				cardClassName="card-tasks"
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={deleteConfirm.show}
				onCancel={cancelDelete}
				onConfirm={confirmDelete}
				loading={loading}
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
