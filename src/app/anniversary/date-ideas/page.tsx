"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import {
	updateTaskInHomeData,
	addTaskToHomeData,
	removeTaskFromHomeData,
	setHomeData,
} from "@/store/slices/homeSlice";
import {
	selectHolidayPreferences,
	selectHomeInitialized,
	selectHomeData,
} from "@/store/selectors/home";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";
import { getHolidayDataFromRedux } from "@/utils/holidayData";
import { selectIsHolidayShared } from "@/store/slices/sharesSlice";
import SortModal from "@/components/modals/SortModal";
import FormModal from "@/components/modals/FormModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import ToDoCard from "@/components/cards/to-do/ToDoCard";

export default function AnniversaryDateIdeasPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);
	const { user: auth0User } = useAuth0();

	// Get Redux data
	const holidayPreferences = useAppSelector(selectHolidayPreferences);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const homeData = useAppSelector(selectHomeData);

	// Get current Redux state for data access
	const currentState = useAppSelector((state: any) => state);

	// Holiday ID resolution
	const resolvedHolidayId = homeInitialized
		? getHolidayIdFromRoute("/anniversary", holidayPreferences)
		: getHolidayIdFromRoute("/anniversary", holidayPreferences);

	// Check if the holiday is shared to conditionally show assign to field
	const isHolidayShared = useAppSelector((state: any) =>
		selectIsHolidayShared(state, "anniversary")
	);

	// Redux data access - date ideas are stored as tasks with category "Date Ideas"
	const holidayData = getHolidayDataFromRedux(resolvedHolidayId, currentState);
	const dateIdeas = holidayData?.tasks?.filter((task: any) => task.category === "Date Ideas") || [];
	const isLoading = !homeInitialized;

	// Refresh home data function
	const refreshHomeData = async () => {
		if (!auth0User?.sub || !resolvedHolidayId) return;

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
				dispatch(setHomeData(result.data));
			}
		} catch (error) {
			console.error("Error refreshing home data:", error);
		}
	};

	// State management
	const [showAddForm, setShowAddForm] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);
	const [showSortModal, setShowSortModal] = useState(false);
	const [sortBy, setSortBy] = useState<string>("priority");
	const [isAdding, setIsAdding] = useState(false);
	const [isToggling, setIsToggling] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch]);

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

	// CRUD Operations
	async function handleAddTask(values: Record<string, any>) {
		if (!values.title?.trim()) return;
		if (!resolvedHolidayId || !auth0User) return;

		setIsAdding(true);
		
		const newTask = {
			id: `temp-${Date.now()}`, // Temporary ID for optimistic update
			title: values.title,
			description: values.description || undefined,
			priority: values.priority as "low" | "medium" | "high",
			assignedTo: values.assignedTo || undefined,
			category: "Date Ideas",
			dueDate: values.dueDate || undefined,
			isCompleted: false,
			holidayId: resolvedHolidayId,
		};

		try {
			// Optimistically update Redux state first
			dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: newTask }));

			// Call API - map camelCase to snake_case for API
			const apiPayload = {
				title: values.title,
				description: values.description || undefined,
				priority: values.priority as "low" | "medium" | "high",
				assigned_to: values.assignedTo || undefined, // snake_case for API
				category: "Date Ideas",
				due_date: values.dueDate || undefined, // snake_case for API
				isCompleted: false,
			};
			
			const response = await fetch(`/api/holidays/${resolvedHolidayId}/tasks`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-test-user": JSON.stringify({
						sub: auth0User.sub,
						email: auth0User.email,
						name: auth0User.name,
						picture: auth0User.picture,
					}),
				},
				body: JSON.stringify(apiPayload),
			});

			if (response.ok) {
				// Replace temporary task with real task from API
				const result = await response.json();
				dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId: newTask.id }));
				dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: result }));
				
				// Refresh home data
				await refreshHomeData();
			} else {
				// Remove optimistic update on error
				dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId: newTask.id }));
				console.error("Failed to add date idea:", response.status, response.statusText);
			}
			
			setShowAddForm(false);
		} catch (error) {
			// Remove optimistic update on error
			dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId: newTask.id }));
			console.error("Failed to add date idea:", error);
		} finally {
			setIsAdding(false);
		}
	}

	async function handleEditTaskSubmit(values: Record<string, any>) {
		if (!editingTask || !resolvedHolidayId || !auth0User) return;

		setIsUpdating(true);
		try {
			const updatedTask = {
				title: values.title,
				description: values.description || undefined,
				priority: values.priority as "low" | "medium" | "high",
				assignedTo: values.assignedTo || undefined,
				category: "Date Ideas",
				dueDate: values.dueDate || undefined,
			};

			// Optimistically update the Redux state
			dispatch(
				updateTaskInHomeData({
					holidayId: resolvedHolidayId,
					taskId: editingTask.id,
					updates: updatedTask,
				})
			);

			// Call API - map camelCase to snake_case
			const apiPayload = {
				title: values.title,
				description: values.description || undefined,
				priority: values.priority as "low" | "medium" | "high",
				assigned_to: values.assignedTo || undefined, // snake_case for API
				category: "Date Ideas",
				due_date: values.dueDate || undefined, // snake_case for API
			};
			
			const response = await fetch(`/api/holidays/${resolvedHolidayId}/tasks/${editingTask.id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					"x-test-user": JSON.stringify({
						sub: auth0User.sub,
						email: auth0User.email,
						name: auth0User.name,
						picture: auth0User.picture,
					}),
				},
				body: JSON.stringify(apiPayload),
			});
			
			if (!response.ok) {
				// Revert the optimistic update on error
				dispatch(
					updateTaskInHomeData({
						holidayId: resolvedHolidayId,
						taskId: editingTask.id,
						updates: {
							title: editingTask.title,
							description: editingTask.description,
							priority: editingTask.priority,
							assignedTo: editingTask.assignedTo,
							category: editingTask.category,
							dueDate: editingTask.dueDate,
						},
					})
				);
				console.error("Failed to update date idea:", response.status, response.statusText);
			}
			
			setEditingTask(null);
			setShowAddForm(false);
		} catch (error) {
			console.error("Failed to update date idea:", error);
		} finally {
			setIsUpdating(false);
		}
	}

	const handleEdit = (task: any) => {
		setEditingTask(task);
		setShowAddForm(true);
	};

	async function handleDeleteTask(taskId: string) {
		if (!resolvedHolidayId || !auth0User) return;

		// Find the task to delete for potential rollback
		const taskToDelete = dateIdeas.find((task: any) => task.id === taskId);
		if (!taskToDelete) return;

		setIsDeleting(true);
		try {
			// Optimistically update Redux state first
			dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId }));

			// Call API directly
			const response = await fetch(`/api/holidays/${resolvedHolidayId}/tasks/${taskId}`, {
				method: "DELETE",
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

			if (!response.ok) {
				// If API failed, revert the optimistic update
				dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: taskToDelete }));
				console.error("Failed to delete date idea:", response.status, response.statusText);
			}
		} catch (error) {
			// If API failed, revert the optimistic update
			dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: taskToDelete }));
			console.error("Failed to delete date idea:", error);
		} finally {
			setIsDeleting(false);
		}
	}

	async function handleToggleTask(taskId: string) {
		if (!resolvedHolidayId || !auth0User) return;

		setIsToggling(true);
		try {
			// Find the current task to get its completion status
			const currentTask = dateIdeas.find((task: any) => task.id === taskId);
			if (!currentTask) {
				console.error("Task not found:", taskId);
				return;
			}

			// Toggle the completion status
			const newCompletionStatus = !currentTask.isCompleted;

			// Optimistically update the Redux state
			dispatch(
				updateTaskInHomeData({
					holidayId: resolvedHolidayId,
					taskId: taskId,
					updates: { isCompleted: newCompletionStatus },
				})
			);

			// Call API directly
			const response = await fetch(`/api/holidays/${resolvedHolidayId}/tasks/${taskId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					"x-test-user": JSON.stringify({
						sub: auth0User.sub,
						email: auth0User.email,
						name: auth0User.name,
						picture: auth0User.picture,
					}),
				},
				body: JSON.stringify({
					isCompleted: newCompletionStatus,
				}),
			});

			if (!response.ok) {
				// Revert the optimistic update on error
				dispatch(
					updateTaskInHomeData({
						holidayId: resolvedHolidayId,
						taskId: taskId,
						updates: { isCompleted: currentTask.isCompleted },
					})
				);
				console.error("Failed to toggle date idea:", response.status, response.statusText);
			}
		} catch (error) {
			console.error("Failed to toggle date idea:", error);
		} finally {
			setIsToggling(false);
		}
	}

	const handleSortChange = (sortOption: string) => {
		setSortBy(sortOption);
	};

	const loading = isAdding || isUpdating || isDeleting || isToggling;

	// Show loading only if home data is not initialized
	if (isLoading) {
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

	// Form configuration - matching Kwanzaa events pattern
	const formFields = [
		{
			id: "title",
			type: "text" as const,
			placeholder: "Date Idea Title*",
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
		...(isHolidayShared ? [{
			id: "assignedTo",
			type: "text" as const,
			placeholder: "Assigned To",
		}] : []),
		{
			id: "dueDate",
			type: "date" as const,
			placeholder: "Due Date",
		},
	];

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
							key={task.id}
							task={task}
							onToggleComplete={handleToggleTask}
							onDelete={handleDeleteTask}
							onEdit={handleEdit}
							theme={{
								accentColor: "#ec4899", // Pink for Anniversary
								hoverColor: "hover:bg-pink-50 dark:hover:bg-pink-900/10",
							}}
							borderColor="rgb(var(--color-pink-500))" // Pink border for Anniversary
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
							key={task.id}
							task={task}
							onToggleComplete={handleToggleTask}
							onDelete={handleDeleteTask}
							onEdit={handleEdit}
							className="opacity-60"
							theme={{
								accentColor: "#ec4899", // Pink for Anniversary
								hoverColor: "hover:bg-pink-50 dark:hover:bg-pink-900/10",
							}}
							borderColor="rgb(var(--color-pink-500))" // Pink border for Anniversary
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
				fields={formFields}
				initialValues={editingTask ? {
					title: editingTask.title || "",
					description: editingTask.description || "",
					priority: editingTask.priority || "medium",
					...(isHolidayShared ? { assignedTo: editingTask.assignedTo || "" } : {}),
					dueDate: editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : "",
				} : { priority: "medium" }}
				onSubmit={editingTask ? handleEditTaskSubmit : handleAddTask}
				onClose={() => {
					setShowAddForm(false);
					setEditingTask(null);
				}}
				loading={loading}
				submitText={editingTask ? "Update Date Idea" : "Add Date Idea"}
				submitButtonColor="#ec4899"
			/>
		</div>
	);
}
