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
	addTaskToHomeData,
	removeTaskFromHomeData,
	updateTaskInHomeData,
} from "@/store/slices/homeSlice";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";
import { getHolidayDataFromRedux } from "@/utils/holidayData";
import {
	useCreateResolutionsMutation,
	useUpdateResolutionsMutation,
	useEditResolutionsMutation,
	useDeleteResolutionsMutation,
} from "@/store/api";
import SortModal from "@/components/modals/SortModal";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import DateTrackerCard from "@/components/cards/DateTrackerCard";
import DateIdeaCard from "@/components/cards/DateIdeaCard";
import { useAuth0 } from "@auth0/auth0-react";

export default function NewYearResolutionTrackerPage() {
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

	// Get resolutions from Redux data (tasks with category "Resolutions")
	const resolutions =
		holidayData?.tasks?.filter(
			(task: any) => task.category === "Resolutions"
		) || [];

	// Debug logging
	useEffect(() => {
		console.log("=== Resolution Tracker Debug ===");
		console.log("holidayId:", holidayId);
		console.log("holidayData:", holidayData);
		console.log("holidayData?.tasks:", holidayData?.tasks);
		console.log("resolutions:", resolutions);
		console.log("=== End Resolution Tracker Debug ===");
	}, [holidayId, holidayData, resolutions]);

	// Get mutations for CRUD operations
	const [createResolutions, createResolutionsState] =
		useCreateResolutionsMutation();
	const [updateResolutions, updateResolutionsState] =
		useUpdateResolutionsMutation();
	const [editResolutions, editResolutionsState] = useEditResolutionsMutation();
	const [deleteResolutions, deleteResolutionsState] =
		useDeleteResolutionsMutation();

	// Loading and error states
	const loading =
		createResolutionsState.isLoading ||
		updateResolutionsState.isLoading ||
		editResolutionsState.isLoading ||
		deleteResolutionsState.isLoading;
	const error =
		createResolutionsState.error ||
		updateResolutionsState.error ||
		editResolutionsState.error ||
		deleteResolutionsState.error;
	const initialized = homeInitialized;

	const [editingTask, setEditingTask] = useState<any>(null);
	const [showSortModal, setShowSortModal] = useState(false);
	const [showFormModal, setShowFormModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
	const [sortBy, setSortBy] = useState("title");

	useEffect(() => {
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch]);

	const handleFormSubmit = async (values: Record<string, any>) => {
		if (!holidayId || !auth0User) return;

		try {
			if (editingTask) {
				// Update existing task
				const result = await editResolutions({
					holidayId,
					taskId: editingTask.id,
					payload: {
						title: values.title,
						description: values.description || undefined,
						priority: values.priority as "low" | "medium" | "high",
						category: "Resolutions",
						dueDate: values.dueDate || undefined,
						notes: values.notes || undefined,
					},
					auth0User,
				}).unwrap();

				// Update Redux store immediately
				dispatch(
					updateTaskInHomeData({
						holidayId,
						taskId: editingTask.id,
						updates: {
							title: values.title,
							description: values.description || undefined,
							priority: values.priority as "low" | "medium" | "high",
							category: "Resolutions",
							dueDate: values.dueDate || undefined,
							notes: values.notes || undefined,
						},
					})
				);
				setEditingTask(null);
			} else {
				// Add new task
				const payload = {
					title: values.title,
					description: values.description || undefined,
					priority: values.priority as "low" | "medium" | "high",
					category: "Resolutions",
					dueDate: values.dueDate || undefined,
					notes: values.notes || undefined,
					isCompleted: false,
				};
				const result = await createResolutions({
					holidayId,
					payload,
					auth0User,
				}).unwrap();

				// Add to Redux store immediately
				dispatch(
					addTaskToHomeData({
						holidayId,
						task: result,
					})
				);
			}
			setShowFormModal(false);
		} catch (error) {
			console.error("Error saving resolution:", error);
		}
	};

	const handleEditTask = (task: any) => {
		setEditingTask(task);
		setShowFormModal(true);
	};

	const handleDeleteTask = (taskId: string) => {
		const task = resolutions.find((t: any) => t.id === taskId);
		if (task) {
			setDeleteConfirm(task);
			setShowDeleteModal(true);
		}
	};

	const confirmDelete = async () => {
		if (!holidayId || !auth0User || !deleteConfirm) return;

		try {
			await deleteResolutions({
				holidayId,
				taskId: deleteConfirm.id,
				auth0User,
			}).unwrap();

			// Remove from Redux store immediately
			dispatch(
				removeTaskFromHomeData({
					holidayId,
					taskId: deleteConfirm.id,
				})
			);

			setShowDeleteModal(false);
			setDeleteConfirm(null);
		} catch (error) {
			console.error("Error deleting resolution:", error);
		}
	};

	const cancelDelete = () => {
		setShowDeleteModal(false);
		setDeleteConfirm(null);
	};

	const handleToggleCompletion = async (taskId: string) => {
		if (!holidayId || !auth0User) return;

		try {
			const task = resolutions.find((t: any) => t.id === taskId);
			if (task) {
				await updateResolutions({
					holidayId,
					taskId,
					isCompleted: !task.isCompleted,
					auth0User,
				}).unwrap();

				// Update Redux store immediately
				dispatch(
					updateTaskInHomeData({
						holidayId,
						taskId,
						updates: {
							isCompleted: !task.isCompleted,
							completedDate: !task.isCompleted
								? new Date().toISOString()
								: null,
						},
					})
				);
			}
		} catch (error) {
			console.error("Error updating resolution:", error);
		}
	};

	const openAddForm = () => {
		setEditingTask(null);
		setShowFormModal(true);
	};

	const closeForm = () => {
		setShowFormModal(false);
		setEditingTask(null);
	};

	const sortedTasks = [...resolutions].sort((a: any, b: any) => {
		switch (sortBy) {
			case "title":
				return a.title.localeCompare(b.title);
			case "priority":
				const priorityOrder: { [key: string]: number } = {
					high: 3,
					medium: 2,
					low: 1,
				};
				return priorityOrder[b.priority] - priorityOrder[a.priority];
			case "dueDate":
				if (!a.dueDate && !b.dueDate) return 0;
				if (!a.dueDate) return 1;
				if (!b.dueDate) return -1;
				return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
			case "completed":
				return a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1;
			default:
				return 0;
		}
	});

	const completedTasks = resolutions.filter((task: any) => task.isCompleted);
	const incompleteTasks = resolutions.filter((task: any) => !task.isCompleted);

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "high":
				return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
			case "medium":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
			case "low":
				return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
		}
	};

	// Get form configuration with custom titles for resolutions
	const formConfig = getFormConfig(
		"tasks",
		editingTask ? "edit" : "add",
		editingTask ? "Edit Resolution" : "Add New Resolution",
		"Resolution Title*",
		editingTask ? "Update Resolution" : "Add Resolution"
	);
	const deleteConfig = getDeleteConfig("tasks");

	return (
		<div className="min-h-screen new-year-cards-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Resolution Tracker"
				backHref="/new-year"
				onSortClick={() => setShowSortModal(true)}
				description="Track your New Year resolutions and goals!"
				holidayColor="amber-600"
				sortTitle="Sort Resolutions"
				error={error ? "API Error" : undefined}
			/>

			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				{/* Summary Stats */}
				<DateTrackerCard
					totalIdeas={resolutions.length}
					completedIdeas={completedTasks.length}
					highPriorityIdeas={
						resolutions.filter((task: any) => task.priority === "high").length
					}
					dueSoonIdeas={
						resolutions.filter((task: any) => {
							if (!task.dueDate) return false;
							const dueDate = new Date(task.dueDate);
							const now = new Date();
							const diffDays = Math.ceil(
								(dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
							);
							return diffDays <= 7 && diffDays >= 0;
						}).length
					}
					holidayColor="bg-gradient-to-br from-amber-300 to-amber-500"
				/>

				<AddButton
					title="Resolution"
					onClick={openAddForm}
					color="amber"
					disabled={loading}
				/>

				{/* Task List */}
				<div className="space-y-4">
					{loading ? (
						<div className="text-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
							<p className="text-gray-600 dark:text-gray-400 mt-2">
								Loading resolutions...
							</p>
						</div>
					) : sortedTasks.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-gray-600 dark:text-gray-400">
								No resolutions added yet.
							</p>
							<button
								onClick={openAddForm}
								className="mt-2 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
							>
								Add your first resolution
							</button>
						</div>
					) : (
						sortedTasks.map((task) => (
							<DateIdeaCard
								key={
									task.id ||
									task._id ||
									`${task.title}-${task.dueDate || "no-date"}`
								}
								task={task}
								onToggleCompletion={handleToggleCompletion}
								onEdit={handleEditTask}
								onDelete={handleDeleteTask}
								getPriorityColor={getPriorityColor}
								holidayColor="bg-gradient-to-br from-amber-300 to-amber-500"
							/>
						))
					)}
				</div>
			</main>

			{/* Sort Modal */}
			<SortModal
				isOpen={showSortModal}
				onClose={() => setShowSortModal(false)}
				sortBy={sortBy}
				onSortChange={setSortBy}
				sortOptions={[
					{ value: "title", label: "Title" },
					{ value: "priority", label: "Priority" },
					{ value: "dueDate", label: "Due Date" },
					{ value: "completed", label: "Completion Status" },
				]}
				title="Sort Resolutions"
			/>

			{/* Form Modal */}
			<FormModal
				isOpen={showFormModal}
				title={formConfig.title}
				fields={formConfig.fields}
				initialValues={
					editingTask
						? {
								title: editingTask.title,
								description: editingTask.description || "",
								priority: editingTask.priority,
								dueDate: editingTask.dueDate || "",
								notes: editingTask.notes || "",
						  }
						: {}
				}
				onSubmit={handleFormSubmit}
				onClose={closeForm}
				loading={loading}
				submitText={formConfig.submitText}
				cancelText={formConfig.cancelText}
				cardClassName={formConfig.cardClassName}
				submitButtonColor={formConfig.submitButtonColor}
			/>

			{/* Delete Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				title={deleteConfig.title}
				message={deleteConfig.message}
				itemName={deleteConfirm?.title || ""}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={deleteResolutionsState.isLoading}
				confirmText={deleteConfig.confirmText}
				cancelText={deleteConfig.cancelText}
				cardClassName={deleteConfig.cardClassName}
				confirmButtonColor={deleteConfig.confirmButtonColor}
			/>

			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
