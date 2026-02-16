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

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

export default function MothersDayEventsPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);
	const { user: auth0User } = useAuth0();
	
	// No need for useFormModalMutation hook - using direct API calls like Kwanzaa

	// Get Redux data
	const holidayPreferences = useAppSelector(selectHolidayPreferences);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const homeData = useAppSelector(selectHomeData);

	// Get current Redux state for data access
	const currentState = useAppSelector((state: any) => state);

	// Holiday ID resolution
	const resolvedHolidayId = homeInitialized
		? getHolidayIdFromRoute("/mothers-day", holidayPreferences)
		: getHolidayIdFromRoute("/mothers-day", holidayPreferences);

	// Check if the holiday is shared to conditionally show assign to field
	const isHolidayShared = useAppSelector((state: any) =>
		selectIsHolidayShared(state, "mothers-day")
	);

	// Redux data access - events are stored as tasks with category "Events" like in Kwanzaa
	const holidayData = getHolidayDataFromRedux(resolvedHolidayId, currentState);
	const events = holidayData?.tasks?.filter((task: any) => task.category === "Events") || [];
	const isLoading = !homeInitialized;
	const error = null;

	// Debug logging to understand the state
	console.log('Mother\'s Day Events Debug:', {
		resolvedHolidayId,
		holidayData: holidayData ? { ...holidayData, tasks: holidayData.tasks?.length || 0 } : null,
		allTasks: holidayData?.tasks?.length || 0,
		eventTasks: events.length,
		events: events.map(e => ({ id: e.id, title: e.title, category: e.category, isCompleted: e.isCompleted }))
	});

	// Refresh home data function (like gift-list)
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
	const [showForm, setShowForm] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);
	const [showEditModal, setShowEditModal] = useState(false);
	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showSortModal, setShowSortModal] = useState(false);
	const [isAdding, setIsAdding] = useState(false);
	const [isToggling, setIsToggling] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

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
			category: "Events",
			dueDate: values.dueDate || undefined,
			isCompleted: false,
			holidayId: resolvedHolidayId,
		};

		try {
			// Optimistically update Redux state first (like Kwanzaa)
			console.log('Adding task optimistically:', newTask);
			console.log('Holiday ID for addition:', resolvedHolidayId);
			dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: newTask }));
			console.log('Task added to Redux, making API call...');

			// Call API - map camelCase to snake_case for API
			const apiPayload = {
				title: values.title,
				description: values.description || undefined,
				priority: values.priority as "low" | "medium" | "high",
				assigned_to: values.assignedTo || undefined, // snake_case for API
				category: "Events",
				due_date: values.dueDate || undefined, // snake_case for API
				isCompleted: false,
			};
			
			console.log('🐛 [MothersDayAdd] API payload:', apiPayload);
			
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
				// Replace temporary task with real task from API (like Kwanzaa)
				const result = await response.json();
				console.log('API success, replacing temp task with real task:', result);
				dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId: newTask.id }));
				dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: result }));
				
				// Also refresh home data like gift-list does
				await refreshHomeData();
			} else {
				// Remove optimistic update on error
				console.log('API error, removing optimistic update');
				dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId: newTask.id }));
				console.error("Failed to add task:", response.status, response.statusText);
			}
			
			setShowForm(false);
		} catch (error) {
			// Remove optimistic update on error (like Kwanzaa)
			dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId: newTask.id }));
			console.error("Failed to add task:", error);
		} finally {
			setIsAdding(false);
		}
	}

	async function handleToggleCompletion(taskId: string) {
		if (!resolvedHolidayId || !auth0User) return;

		setIsToggling(true);
		try {
			// Find the current task to get its completion status
			const currentTask = events.find((task: any) => task.id === taskId);
			if (!currentTask) {
				console.error("Task not found:", taskId);
				return;
			}

			// Toggle the completion status
			const newCompletionStatus = !currentTask.isCompleted;

			// Optimistically update the Redux home data
			dispatch(
				updateTaskInHomeData({
					holidayId: resolvedHolidayId,
					taskId: taskId,
					updates: { isCompleted: newCompletionStatus },
				})
			);

			// Call API directly instead of using custom hook
			const apiUrl = `/api/holidays/${resolvedHolidayId}/tasks/${taskId}`;
			console.log('Toggle API URL:', apiUrl); // Debug logging
			const response = await fetch(apiUrl, {
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
				const currentTask = events.find((task: any) => task.id === taskId);
				if (currentTask) {
					dispatch(
						updateTaskInHomeData({
							holidayId: resolvedHolidayId,
							taskId: taskId,
							updates: { isCompleted: currentTask.isCompleted },
						})
					);
				}
				console.error("Failed to toggle task:", response.status, response.statusText);
			}
		} catch (error) {
			console.error("Failed to toggle task:", error);
		} finally {
			setIsToggling(false);
		}
	}

	const handleEditEvent = (task: any) => {
		setEditingTask(task);
		setShowEditModal(true);
	};

	async function handleEditSubmit(values: Record<string, any>) {
		if (!editingTask || !resolvedHolidayId || !auth0User) return;

		setIsUpdating(true);
		try {
			const updatedTask = {
				title: values.title,
				description: values.description || undefined,
				priority: values.priority as "low" | "medium" | "high",
				assignedTo: values.assignedTo || undefined,
				dueDate: values.dueDate || undefined,
			};

			// Optimistically update the Redux home data
			dispatch(
				updateTaskInHomeData({
					holidayId: resolvedHolidayId,
					taskId: editingTask.id,
					updates: updatedTask,
				})
			);

			// Call API directly instead of using custom hook - map camelCase to snake_case
			const apiPayload = {
				title: values.title,
				description: values.description || undefined,
				priority: values.priority as "low" | "medium" | "high",
				assigned_to: values.assignedTo || undefined, // snake_case for API
				due_date: values.dueDate || undefined, // snake_case for API
			};
			
			console.log('🐛 [MothersDayEdit] API payload:', apiPayload);
			
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
							dueDate: editingTask.dueDate,
						},
					})
				);
				console.error("Failed to update task:", response.status, response.statusText);
			}

			setShowEditModal(false);
			setEditingTask(null);
		} catch (error) {
			console.error("Failed to update task:", error);
		} finally {
			setIsUpdating(false);
		}
	}

	async function handleDelete(taskId: string, taskTitle: string) {
		if (!resolvedHolidayId || !auth0User) return;

		setIsDeleting(true);
		try {
			// Optimistically remove the task from Redux
			dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId }));

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
				// Revert the optimistic removal on error
				const taskToRestore = events.find((task: any) => task.id === taskId);
				if (taskToRestore) {
					dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: taskToRestore }));
				}
				console.error("Failed to delete task:", response.status, response.statusText);
			}
		} catch (error) {
			console.error("Failed to delete task:", error);
		} finally {
			setIsDeleting(false);
		}
	}

	// Sorting functionality
	const sortOptions = [
		{ value: "none", label: "Default Order" },
		{ value: "priority", label: "Priority" },
		{ value: "dateDue", label: "Due Date" },
		{ value: "assignedTo", label: "Assigned To" },
	];

	const sortTasks = (tasks: any[]) => {
		if (sortBy === "none") return tasks;

		return [...tasks].sort((a, b) => {
			switch (sortBy) {
				case "priority":
					const priorityOrder = { high: 3, medium: 2, low: 1 };
					return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
						   (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
				case "dateDue":
					if (!a.dueDate && !b.dueDate) return 0;
					if (!a.dueDate) return 1;
					if (!b.dueDate) return -1;
					return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
				case "assignedTo":
					return (a.assignedTo || "").localeCompare(b.assignedTo || "");
				default:
					return 0;
			}
		});
	};

	// Separate incomplete and complete events
	const sortedEvents = sortTasks(events);
	const incompleteEvents = sortedEvents.filter((event) => !event.isCompleted);
	const completeEvents = sortedEvents.filter((event) => event.isCompleted);

	// Form configuration
	const formFields = [
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
			placeholder: "Assigned To"
		}] : []),
		{
			id: "dueDate",
			type: "date" as const,
			placeholder: "Due Date"
		},
	];

	return (
		<div className="min-h-screen mothers-day-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Mother's Day Events"
				backHref="/mothers-day"
				onSortClick={() => setShowSortModal(true)}
				description="Keep track of your Mother's Day events!"
				holidayColor="pink-500"
				sortTitle="Sort Events"
			/>

			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<AddButton
					title="Event"
					onClick={() => setShowForm(true)}
					color="pink"
				/>

				<TaskSection
					title="Upcoming Events"
					items={incompleteEvents}
					isCompleted={false}
					emptyMessage="No events planned yet."
					completedMessage="All events completed!"
					renderItem={(task: any) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleCompletion}
							onDelete={(taskId: string, taskTitle: string) => handleDelete(taskId, taskTitle)}
							onEdit={handleEditEvent}
							theme={{
								accentColor: "#ec4899", // Pink for Mother's Day
							}}
							borderColor="rgb(236 72 153)"
							disableInternalModal={true}
						/>
					)}
				/>

				<TaskSection
					title="Completed Events"
					items={completeEvents}
					isCompleted={true}
					emptyMessage="No completed events yet."
					completedMessage="No completed events yet."
					renderItem={(task: any) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleCompletion}
							onDelete={(taskId: string, taskTitle: string) => handleDelete(taskId, taskTitle)}
							onEdit={handleEditEvent}
							theme={{
								accentColor: "#ec4899", // Pink for Mother's Day
							}}
							borderColor="rgb(236 72 153)"
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
				onSortChange={(sortOption: string) => setSortBy(sortOption as SortOption)}
				sortOptions={sortOptions}
				title="Sort Events"
			/>

			{/* Add Form Modal */}
			<FormModal
				isOpen={showForm}
				title="Add New Event"
				fields={formFields}
				initialValues={{ priority: "medium" }}
				onSubmit={handleAddTask}
				onClose={() => setShowForm(false)}
				loading={isAdding}
				submitText="Add Event"
				cardClassName="card-events-mothers-day"
			/>

			{/* Edit Form Modal */}
			<FormModal
				isOpen={showEditModal}
				title="Edit Event"
				fields={formFields}
				initialValues={editingTask ? {
					title: editingTask.title || "",
					description: editingTask.description || "",
					priority: editingTask.priority || "medium",
					...(isHolidayShared ? { assignedTo: editingTask.assignedTo || "" } : {}),
					dueDate: editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : "",
				} : {}}
				onSubmit={handleEditSubmit}
				onClose={() => {
					setShowEditModal(false);
					setEditingTask(null);
				}}
				loading={isUpdating}
				submitText="Update Event"
				cardClassName="card-events-mothers-day"
			/>
		</div>
	);
}
