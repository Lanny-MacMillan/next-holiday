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
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";
import {
	updateTaskInHomeData,
	addTaskToHomeData,
	removeTaskFromHomeData,
	refreshHomeData,
} from "@/store/slices/homeSlice";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import ToDoCard from "@/components/cards/to-do/ToDoCard";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import SortModal from "@/components/modals/SortModal";
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";
import { useDateIdeasMutations } from "@/hooks/useDateIdeasMutations";

export default function AnniversaryDateIdeasPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);

	// Get current Redux state for skip logic
	const currentState = useAppSelector((state: any) => state);

	// Get home data and holiday data from Redux
	const homeData = useAppSelector(selectHomeData);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const holidayPreferences = useAppSelector(selectHolidayPreferences);

	// Get holiday ID for Anniversary
	const holidayId = homeInitialized
		? getHolidayIdFromRoute("/anniversary", holidayPreferences)
		: getHolidayIdFromRoute("/anniversary", holidayPreferences);

	// Get holiday data from Redux if available
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

	// Use the new date ideas mutations hook
	const {
		auth0User,
		createDateIdeas,
		updateDateIdeas,
		editDateIdeas,
		deleteDateIdeas,
		createDateIdeasState,
		updateDateIdeasState,
		editDateIdeasState,
		deleteDateIdeasState,
	} = useDateIdeasMutations();

	// Use only Redux data - no GET API calls on holiday pages
	const dateIdeas =
		holidayData && homeInitialized && holidayData.tasks
			? holidayData.tasks.filter((task: any) => task.category === "Date Ideas")
			: [];

	const [showAddForm, setShowAddForm] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [taskToDelete, setTaskToDelete] = useState<any>(null);
	const [showSortModal, setShowSortModal] = useState(false);
	const [sortBy, setSortBy] = useState<string>("priority");

	// Sort options for date ideas
	const sortOptions = [
		{ value: "priority", label: "Priority" },
		{ value: "title", label: "Title A-Z" },
		{ value: "dueDate", label: "Due Date" },
		{ value: "assignedTo", label: "Assigned To" },
		{ value: "category", label: "Category" },
	];

	// Sort function
	const sortTasks = (tasks: any[], sortOption: string) => {
		const sortedTasks = [...tasks];
		switch (sortOption) {
			case "title":
				return sortedTasks.sort((a, b) => a.title.localeCompare(b.title));
			case "priority":
				const priorityOrder = { high: 3, medium: 2, low: 1 };
				return sortedTasks.sort(
					(a, b) =>
						(priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
						(priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
				);
			case "dueDate":
				return sortedTasks.sort((a, b) => {
					if (!a.dueDate && !b.dueDate) return 0;
					if (!a.dueDate) return 1;
					if (!b.dueDate) return -1;
					return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
				});
			case "assignedTo":
				return sortedTasks.sort((a, b) => {
					if (!a.assignedTo && !b.assignedTo) return 0;
					if (!a.assignedTo) return 1;
					if (!b.assignedTo) return -1;
					return a.assignedTo.localeCompare(b.assignedTo);
				});
			case "category":
				return sortedTasks.sort((a, b) => {
					if (!a.category && !b.category) return 0;
					if (!a.category) return 1;
					if (!b.category) return -1;
					return a.category.localeCompare(b.category);
				});
			default:
				return sortedTasks;
		}
	};

	const sortedDateTasks = sortTasks(dateIdeas, sortBy);

	useEffect(() => {
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch]);

	// Helper function to refresh home data
	const refreshHomePageData = async () => {
		if (!auth0User?.sub) return;

		try {
			const response = await fetch("/api/home", {
				headers: {
					"Content-Type": "application/json",
					"x-test-user": JSON.stringify({
						sub: auth0User.sub,
						email: auth0User.email,
						name: auth0User.name,
						picture: auth0User.picture,
					}),
				},
			});

			if (response.ok) {
				const result = await response.json();
				const data = result.data;
				dispatch(refreshHomeData(data));
			}
		} catch (error) {
			console.error("Failed to refresh home data:", error);
		}
	};

	const handleSubmit = async (values: Record<string, any>) => {
		if (!holidayId || !auth0User) return;

		try {
			if (editingTask) {
				const result = await editDateIdeas({
					holidayId,
					taskId: editingTask.id,
					payload: {
						title: values.title,
						description: values.description || undefined,
						priority: values.priority as "low" | "medium" | "high",
						assignedTo: values.assignedTo || undefined,
						category: "Date Ideas",
						dueDate: values.dueDate || undefined,
					},
					auth0User,
				}).unwrap();

				// Update Redux state directly
				updateTaskInRedux(result, "update");
				setEditingTask(null);

				// Refresh home data to ensure homepage reflects changes
				await refreshHomePageData();
			} else {
				const payload = {
					title: values.title,
					description: values.description || undefined,
					priority: values.priority as "low" | "medium" | "high",
					assignedTo: values.assignedTo || undefined,
					category: "Date Ideas",
					dueDate: values.dueDate || undefined,
					isCompleted: false,
				};
				const result = await createDateIdeas({
					holidayId,
					payload,
					auth0User,
				}).unwrap();

				// Update Redux state directly
				updateTaskInRedux(result, "add");

				// Refresh home data to ensure homepage reflects changes
				await refreshHomePageData();
			}
			setShowAddForm(false);
		} catch (error) {
			console.error("Error saving date idea:", error);
		}
	};

	const handleEdit = (task: any) => {
		setEditingTask(task);
		setShowAddForm(true);
	};

	const handleDelete = (task: any) => {
		setTaskToDelete(task);
		setShowDeleteModal(true);
	};

	const confirmDelete = async () => {
		if (taskToDelete && holidayId && auth0User) {
			try {
				await deleteDateIdeas({
					holidayId,
					taskId: taskToDelete.id,
					auth0User,
				}).unwrap();

				// Update Redux state directly
				updateTaskInRedux({ id: taskToDelete.id }, "delete");

				// Refresh home data to ensure homepage reflects changes
				await refreshHomePageData();

				setTaskToDelete(null);
			} catch (error) {
				console.error("Error deleting date idea:", error);
			}
		}
		setShowDeleteModal(false);
	};

	const handleToggleCompletion = async (taskId: string) => {
		if (!holidayId || !auth0User) return;

		try {
			const task = dateIdeas.find((t: any) => t.id === taskId);
			if (task) {
				const newIsCompleted = !task.isCompleted;

				// Update Redux state directly
				updateTaskInRedux(
					{ id: taskId, isCompleted: newIsCompleted },
					"update"
				);

				await updateDateIdeas({
					holidayId,
					taskId,
					isCompleted: newIsCompleted,
					auth0User,
				}).unwrap();

				// Refresh home data to ensure homepage reflects changes
				await refreshHomePageData();
			}
		} catch (error) {
			console.error("Error updating date idea:", error);
		}
	};

	const handleSortChange = (sortOption: string) => {
		setSortBy(sortOption);
	};

	// Show loading only if home data is not initialized
	if (!homeInitialized) {
		return (
			<div className="min-h-screen anniversary-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading date ideas...
					</p>
				</div>
			</div>
		);
	}

	// Debug: Log date ideas data
	useEffect(() => {
		console.log("Anniversary date ideas - holidayId:", holidayId);
		console.log("Anniversary date ideas - holidayData:", holidayData);
		console.log("Anniversary date ideas - homeInitialized:", homeInitialized);
		console.log("Anniversary date ideas - dateIdeas:", dateIdeas);
	}, [holidayId, holidayData, homeInitialized, dateIdeas]);

	return (
		<div className="min-h-screen anniversary-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Date Ideas"
				backHref="/anniversary"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort Date Ideas"
				description="Plan your anniversary date ideas with style!"
				holidayColor="pink-500"
				error={undefined}
			/>

			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<AddButton
					title="Date Idea"
					onClick={() => setShowAddForm(true)}
					color="pink"
				/>

				<TaskSection
					title="Incomplete"
					items={sortedDateTasks.filter((task) => !task.isCompleted)}
					isCompleted={false}
					emptyMessage="All date ideas completed! 🎉"
					completedMessage=""
					renderItem={(task) => (
						<ToDoCard
							task={task}
							onToggleComplete={handleToggleCompletion}
							onDelete={handleDelete}
							onEdit={handleEdit}
							gamifiedBackgroundColor="bg-gradient-to-br from-pink-300 to-pink-500"
							disableInternalModal={true}
						/>
					)}
				/>

				<TaskSection
					title="Completed"
					items={sortedDateTasks.filter((task) => task.isCompleted)}
					isCompleted={true}
					emptyMessage="No completed date ideas yet."
					completedMessage="No completed date ideas yet."
					renderItem={(task) => (
						<ToDoCard
							task={task}
							onToggleComplete={handleToggleCompletion}
							onDelete={handleDelete}
							onEdit={handleEdit}
							className="opacity-60"
							gamifiedBackgroundColor="bg-gradient-to-br from-pink-300 to-pink-500"
							disableInternalModal={true}
						/>
					)}
				/>
			</main>

			{/* Sort Modal */}
			<SortModal
				isOpen={showSortModal}
				onClose={() => setShowSortModal(false)}
				sortBy={sortBy}
				onSortChange={handleSortChange}
				sortOptions={sortOptions}
				title="Sort Date Ideas"
			/>

			{/* Form Modal */}
			<FormModal
				isOpen={showAddForm}
				title={editingTask ? "Edit Date Idea" : "Add New Date Idea"}
				fields={getFormConfig("tasks", "add").fields}
				initialValues={
					editingTask
						? {
								title: editingTask.title,
								description: editingTask.description || "",
								priority: editingTask.priority,
								dueDate: editingTask.dueDate
									? editingTask.dueDate.split("T")[0]
									: "",
								notes: editingTask.notes || "",
						  }
						: { priority: "medium", category: "Date Ideas" }
				}
				onSubmit={handleSubmit}
				onClose={() => {
					setShowAddForm(false);
					setEditingTask(null);
				}}
				loading={
					editingTask
						? editDateIdeasState.isLoading
						: createDateIdeasState.isLoading
				}
				submitText={editingTask ? "Update Date Idea" : "Add Date Idea"}
				submitButtonColor="#ec4899"
			/>

			{/* Delete Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				{...getDeleteConfig("tasks")}
				onConfirm={confirmDelete}
				onCancel={() => {
					setShowDeleteModal(false);
					setTaskToDelete(null);
				}}
				loading={deleteDateIdeasState.isLoading}
				cardClassName="card"
				confirmText="Delete"
				cancelText="Cancel"
			/>
		</div>
	);
}
