"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
	refreshHomeData,
} from "@/store/slices/homeSlice";
import SortModal from "@/components/modals/SortModal";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import DateTrackerCard from "@/components/cards/DateTrackerCard";
import DateIdeaCard from "@/components/cards/DateIdeaCard";
import { useDateIdeasMutations } from "@/hooks/useDateIdeasMutations";

export default function ValentinesDateIdeasPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);

	// Use the new date ideas mutations hook
	const {
		holidayId,
		auth0User,
		dateIdeas,
		loading,
		error,
		initialized,
		createDateIdeas,
		updateDateIdeas,
		editDateIdeas,
		deleteDateIdeas,
		updateDateIdeasState,
		editDateIdeasState,
		deleteDateIdeasState,
	} = useDateIdeasMutations();

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

	const [editingTask, setEditingTask] = useState<any>(null);
	const [showSortModal, setShowSortModal] = useState(false);
	const [showFormModal, setShowFormModal] = useState(false);
	const [sortBy, setSortBy] = useState("title");

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

	const handleFormSubmit = async (values: Record<string, any>) => {
		if (!holidayId || !auth0User) return;

		try {
			if (editingTask) {
				// Update existing task
				const result = await editDateIdeas({
					holidayId,
					taskId: editingTask.id,
					payload: {
						title: values.title,
						description: values.description || undefined,
						priority: values.priority as "low" | "medium" | "high",
						category: "Date Ideas",
						dueDate: values.dueDate || undefined,
						notes: values.notes || undefined,
					},
					auth0User,
				}).unwrap();

				// Update Redux state directly
				updateTaskInRedux(result, "update");
				setEditingTask(null);

				// Refresh home data to ensure homepage reflects changes
				await refreshHomePageData();
			} else {
				// Add new task
				const payload = {
					title: values.title,
					description: values.description || undefined,
					priority: values.priority as "low" | "medium" | "high",
					category: "Date Ideas",
					dueDate: values.dueDate || undefined,
					notes: values.notes || undefined,
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
			setShowFormModal(false);
		} catch (error) {
			console.error("Error saving date idea:", error);
		}
	};

	const handleEditTask = (task: any) => {
		setEditingTask(task);
		setShowFormModal(true);
	};

	const handleDeleteTask = async (taskId: string) => {
		if (!holidayId || !auth0User) return;

		try {
			await deleteDateIdeas({
				holidayId,
				taskId,
				auth0User,
			}).unwrap();

			// Update Redux state directly
			updateTaskInRedux({ id: taskId }, "delete");
		} catch (error) {
			console.error("Error deleting date idea:", error);
		}
	};

	const handleToggleCompletion = async (taskId: string) => {
		if (!holidayId || !auth0User) return;

		try {
			const task = displayDateIdeas.find((t: any) => t.id === taskId);
			if (task) {
				await updateDateIdeas({
					holidayId,
					taskId,
					isCompleted: !task.isCompleted,
					auth0User,
				}).unwrap();

				// Update Redux state directly
				updateTaskInRedux(
					{ id: taskId, isCompleted: !task.isCompleted },
					"update"
				);
			}
		} catch (error) {
			console.error("Error updating date idea:", error);
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

	// Use only Redux data - no fallback to API calls
	const displayDateIdeas =
		holidayData && homeInitialized && holidayData.tasks
			? holidayData.tasks.filter((task: any) => task.category === "Date Ideas")
			: [];

	const sortedTasks = [...displayDateIdeas].sort((a: any, b: any) => {
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

	const completedTasks = displayDateIdeas.filter(
		(task: any) => task.isCompleted
	);
	const incompleteTasks = displayDateIdeas.filter(
		(task: any) => !task.isCompleted
	);

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

	// Get form configuration with custom titles for date ideas
	const formConfig = getFormConfig(
		"tasks",
		editingTask ? "edit" : "add",
		editingTask ? "Edit Date Idea" : "Add New Date Idea",
		"Date Idea Title*",
		editingTask ? "Update Date Idea" : "Add Date Idea"
	);
	const deleteConfig = getDeleteConfig("tasks");

	return (
		<div className="min-h-screen valentines-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Date Ideas"
				backHref="/valentines"
				onSortClick={() => setShowSortModal(true)}
				description="Keep track of your date ideas!"
				holidayColor="pink-500"
				sortTitle="Sort Date Ideas"
				error={undefined}
			/>

			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				{/* Summary Stats */}
				<DateTrackerCard
					totalIdeas={displayDateIdeas.length}
					completedIdeas={completedTasks.length}
					highPriorityIdeas={
						displayDateIdeas.filter((task: any) => task.priority === "high")
							.length
					}
					dueSoonIdeas={
						displayDateIdeas.filter((task: any) => {
							if (!task.dueDate) return false;
							const dueDate = new Date(task.dueDate);
							const now = new Date();
							const diffDays = Math.ceil(
								(dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
							);
							return diffDays <= 7 && diffDays >= 0;
						}).length
					}
					holidayColor="bg-gradient-to-br from-pink-300 to-pink-500"
				/>

				<AddButton
					title="Date Idea"
					onClick={openAddForm}
					color="pink"
					disabled={loading}
				/>

				{/* Task List */}
				<div className="space-y-4">
					{!homeInitialized ? (
						<div className="text-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
							<p className="text-gray-600 dark:text-gray-400 mt-2">
								Loading date ideas...
							</p>
						</div>
					) : sortedTasks.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-gray-600 dark:text-gray-400">
								No date ideas added yet.
							</p>
							<button
								onClick={openAddForm}
								className="mt-2 text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
							>
								Add your first date idea
							</button>
						</div>
					) : (
						sortedTasks.map((task) => (
							<DateIdeaCard
								
								task={task}
								onToggleCompletion={handleToggleCompletion}
								onEdit={handleEditTask}
								onDelete={handleDeleteTask}
								getPriorityColor={getPriorityColor}
								holidayColor="bg-gradient-to-br from-pink-300 to-pink-500"
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
				title="Sort Date Ideas"
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

			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
