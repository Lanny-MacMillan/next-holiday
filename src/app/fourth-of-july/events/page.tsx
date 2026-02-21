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

export default function FourthOfJulyEventsPage() {
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
		? getHolidayIdFromRoute("/fourth-of-july", holidayPreferences)
		: getHolidayIdFromRoute("/fourth-of-july", holidayPreferences);

	// Check if the holiday is shared to conditionally show assign to field
	const isHolidayShared = useAppSelector((state: any) =>
		selectIsHolidayShared(state, "fourth-of-july")
	);

	// Redux data access - events are stored as tasks with category "Events" like in Kwanzaa
	const holidayData = getHolidayDataFromRedux(resolvedHolidayId, currentState);
	const events = holidayData?.tasks?.filter((task: any) => task.category === "Events") || [];
	const isLoading = !homeInitialized;
	const error = null;

	// Debug logging to understand the state
	console.log('Fourth of July Events Debug:', {
		resolvedHolidayId,
		holidayData: holidayData ? { ...holidayData, tasks: holidayData.tasks?.length || 0 } : null,
		allTasks: holidayData?.tasks?.length || 0,
		eventTasks: events.length,
		events: events.map(e => ({ id: e.id, title: e.title, category: e.category, isCompleted: e.isCompleted }))
	});

	// Refresh home data function (like Kwanzaa)
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

	// Show message if holiday doesn't exist
	if (!resolvedHolidayId) {
		return (
			<div className="min-h-screen fourth-of-july-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
				<HolidayPageHeader
					title="Fourth of July Events"
					backHref="/fourth-of-july"
					description="Keep track of your Fourth of July events!"
					holidayColor="bg-gradient-to-br from-red-400 to-red-600"
				/>
				<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
					<div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
						<h3 className="text-lg font-semibold text-red-800 mb-2">
							Fourth of July Holiday Not Set Up
						</h3>
						<p className="text-red-700 mb-4">
							To use Fourth of July features, you need to add Fourth of July to
							your holiday preferences first.
						</p>
						<p className="text-red-600 text-sm">
							Please go to your home page and add Fourth of July to your holiday
							list.
						</p>
					</div>
				</main>
			</div>
		);
	}

	// CRUD Operations
	async function handleAddEvent(values: Record<string, any>) {
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
			console.log('Adding event optimistically:', newTask);
			console.log('Holiday ID for addition:', resolvedHolidayId);
			dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: newTask }));
			console.log('Event added to Redux, making API call...');

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
			
			console.log('🐛 [FourthOfJulyAdd] API payload:', apiPayload);
			
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
				
				// Also refresh home data like Kwanzaa does
				await refreshHomeData();
			} else {
				// Remove optimistic update on error
				console.log('API error, removing optimistic update');
				dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId: newTask.id }));
				console.error("Failed to add event:", response.status, response.statusText);
			}
			
			setShowForm(false);
		} catch (error) {
			// Remove optimistic update on error (like Kwanzaa)
			dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId: newTask.id }));
			console.error("Failed to add event:", error);
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
				category: "Events",
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
				category: "Events",
				due_date: values.dueDate || undefined, // snake_case for API
			};
			
			console.log('🐛 [FourthOfJulyEdit] API payload:', apiPayload);
			
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
				console.error("Failed to update task:", response.status, response.statusText);
			}
			
			setEditingTask(null);
			setShowEditModal(false);
		} catch (error) {
			console.error("Failed to update task:", error);
		} finally {
			setIsUpdating(false);
		}
	}

	async function handleDelete(taskId: string) {
		if (!resolvedHolidayId || !auth0User) return;

		// Find the task to delete for potential rollback
		const taskToDelete = events.find((task: any) => task.id === taskId);
		if (!taskToDelete) return;

		setIsDeleting(true);
		try {
			// Optimistically update Redux state first
			dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId }));

			// Call API directly instead of using custom hook
			const apiUrl = `/api/holidays/${resolvedHolidayId}/tasks/${taskId}`;
			console.log('Delete API URL:', apiUrl); // Debug logging  
			console.log('Events before delete:', events.length);
			const response = await fetch(apiUrl, {
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
				console.error("Failed to delete task:", response.status, response.statusText);
			} else {
				console.log('Event deleted successfully');
			}
		} catch (error) {
			// If API failed, revert the optimistic update
			dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: taskToDelete }));
			console.error("Failed to delete task:", error);
		} finally {
			setIsDeleting(false);
		}
	}

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
	}

	function closeEditModal() {
		setShowEditModal(false);
		setEditingTask(null);
	}

	// Task sorting function from Kwanzaa
	function sortTasks(tasksToSort: any[]): any[] {
		switch (sortBy) {
			case "priority":
				const priorityOrder: { [key: string]: number } = {
					high: 3,
					medium: 2,
					low: 1,
				};
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

	const loading = isAdding || isUpdating || isDeleting || isToggling;

	if (isLoading) {
		return (
			<div className="min-h-screen fourth-of-july-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading events...</p>
				</div>
			</div>
		);
	}

	const sortedTasks = sortTasks(events);
	const incompleteEvents = sortedTasks.filter((task: any) => !task.isCompleted);
	const completedEvents = sortedTasks.filter((task: any) => task.isCompleted);

	return (
		<div className="min-h-screen fourth-of-july-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Fourth of July Events"
				backHref="/fourth-of-july"
				onSortClick={() => setShowSortModal(true)}
				description="Plan your Fourth of July celebrations!"
				holidayColor="red-600"
				sortTitle="Sort Events"
			/>

			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<AddButton title="Event" onClick={openForm} color="red" />

				{/* Event Status Summary */}
				{events.length > 0 && (
					<div className="card p-6">
						<h3 className="text-lg font-semibold mb-4">Event Status</h3>
						<div className="grid grid-cols-3 gap-4 text-center">
							<div>
								<div className="text-2xl font-bold text-blue-600">{events.length}</div>
								<div className="text-sm text-gray-600 dark:text-gray-400">Total Events</div>
							</div>
							<div>
								<div className="text-2xl font-bold text-green-600">{completedEvents.length}</div>
								<div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
							</div>
							<div>
								<div className="text-2xl font-bold text-orange-600">{incompleteEvents.length}</div>
								<div className="text-sm text-gray-600 dark:text-gray-400">Remaining</div>
							</div>
						</div>
					</div>
				)}

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
							onDelete={handleDelete}
							onEdit={handleEditEvent}
							theme={{
								accentColor: "#dc2626", // Red for Fourth of July
							}}
							borderColor="rgb(220 38 38)" // Red border for Fourth of July
							disableInternalModal={true}
						/>
					)}
				/>

				<TaskSection
					title="Completed Events"
					items={completedEvents}
					isCompleted={true}
					emptyMessage=""
					completedMessage=""
					renderItem={(task: any) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleCompletion}
							onDelete={handleDelete}
							onEdit={handleEditEvent}
							className="opacity-60"
							theme={{
								accentColor: "#dc2626", // Red for Fourth of July
							}}
							borderColor="rgb(220 38 38)" // Red border for Fourth of July
							disableInternalModal={true}
						/>
					)}
				/>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showForm}
				title="Add New Event Task"
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
					...(isHolidayShared ? [{ id: "assignedTo", type: "text", placeholder: "Assigned To" } as const] : []),
					{ id: "dueDate", type: "date", placeholder: "Due Date" },
				]}
				initialValues={{
					title: "",
					description: "",
					priority: "medium",
					...(isHolidayShared ? { assignedTo: "" } : {}),
					dueDate: "",
				}}
				onSubmit={handleAddEvent}
				onClose={closeForm}
				loading={isAdding}
				submitText="Add Event"
				cardClassName="card-events-fourth-of-july"
				submitButtonColor="#dc2626"
			/>

			{/* Edit Modal */}
			<FormModal
				isOpen={showEditModal}
				title="Edit Event Task"
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
					...(isHolidayShared ? [{ id: "assignedTo", type: "text", placeholder: "Assigned To" } as const] : []),
					{ id: "dueDate", type: "date", placeholder: "Due Date" },
				]}
				initialValues={editingTask ? {
					title: editingTask.title || "",
					description: editingTask.description || "",
					priority: editingTask.priority || "medium",
					...(isHolidayShared ? { assignedTo: editingTask.assignedTo || "" } : {}),
					dueDate: editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : "",
				} : {}}
				onSubmit={handleEditSubmit}
				onClose={closeEditModal}
				loading={isUpdating}
				submitText="Update Event"
				cardClassName="card-events-fourth-of-july"
				submitButtonColor="#dc2626"
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
					{ value: "dateDue", label: "Due Date" },
					{ value: "assignedTo", label: "Assigned To" },
					{ value: "category", label: "Category" },
				]}
				title="Sort Events"
			/>
		</div>
	);
}
