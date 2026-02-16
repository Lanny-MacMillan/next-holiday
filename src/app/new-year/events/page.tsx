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

export default function NewYearEventsPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);
	const { user: auth0User } = useAuth0();
	
	// No need for useFormModalMutation hook - using direct API calls like working Easter

	// Get Redux data
	const holidayPreferences = useAppSelector(selectHolidayPreferences);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const homeData = useAppSelector(selectHomeData);

	// Get current Redux state for data access
	const currentState = useAppSelector((state: any) => state);

	// Holiday ID resolution
	const resolvedHolidayId = homeInitialized
		? getHolidayIdFromRoute("/new-year", holidayPreferences)
		: getHolidayIdFromRoute("/new-year", holidayPreferences);

	// Check if the holiday is shared to conditionally show assign to field
	const isHolidayShared = useAppSelector((state: any) =>
		selectIsHolidayShared(state, "new-year")
	);

	// Redux data access - events are stored as tasks with category "Events"
	const holidayData = getHolidayDataFromRedux(resolvedHolidayId, currentState);
	const events = holidayData?.tasks?.filter((task: any) => task.category === "Events") || [];
	const isLoading = !homeInitialized;
	const error = null;

	// Safety check for contacts
	const safeContacts = contacts || [];

	// Debug logging to understand the state
	console.log('New Year Events Debug:', {
		resolvedHolidayId,
		holidayData: holidayData ? { ...holidayData, tasks: holidayData.tasks?.length || 0 } : null,
		allTasks: holidayData?.tasks?.length || 0,
		eventTasks: events.length,
		events: events.map(e => ({ id: e.id, title: e.title, category: e.category, isCompleted: e.isCompleted }))
	});

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

		// DEBUG: Log form values
		console.log('🐛 ADD TASK DEBUG - Form values received:', values);
		console.log('🐛 ADD TASK DEBUG - dueDate from form:', values.dueDate, typeof values.dueDate);

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

		// DEBUG: Log constructed task
		console.log('🐛 ADD TASK DEBUG - Constructed newTask:', newTask);
		console.log('🐛 ADD TASK DEBUG - newTask.dueDate:', newTask.dueDate, typeof newTask.dueDate);

		try {
			// Optimistically update Redux state first
			console.log('Adding task optimistically:', newTask);
			console.log('Holiday ID for addition:', resolvedHolidayId);
			dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: newTask }));
			console.log('Task added to Redux, making API call...');

			// Construct API payload
			const apiPayload = {
				title: values.title,
				description: values.description || undefined,
				priority: values.priority as "low" | "medium" | "high",
				assignedTo: values.assignedTo || undefined,
				category: "Events",
				due_date: values.dueDate || undefined, // API expects due_date (snake_case)
				isCompleted: false,
				holidayId: resolvedHolidayId,
			};

			// DEBUG: Log API payload
			console.log('🐛 ADD TASK DEBUG - API payload before JSON.stringify:', apiPayload);
			console.log('🐛 ADD TASK DEBUG - API payload.due_date:', apiPayload.due_date, typeof apiPayload.due_date);
			console.log('🐛 ADD TASK DEBUG - JSON.stringify payload:', JSON.stringify(apiPayload));

			// Call API
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

			if (!response.ok) {
				// Remove optimistic update on error
				dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId: newTask.id }));
				console.error("Failed to create task:", response.status, response.statusText);
			} else {
				// Success: replace temp task with real task from API
				const result = await response.json();
				console.log('🐛 ADD TASK DEBUG - API success response:', result);
				console.log('🐛 ADD TASK DEBUG - API response.data.dueDate:', result?.data?.dueDate);
				
				// Remove temp task and add real task
				dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId: newTask.id }));
				dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: result.data }));
			}
			
			setShowForm(false);
		} catch (error) {
			// Remove the optimistic update if there was an error
			dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId: newTask.id }));
			console.error("Failed to create task:", error);
		} finally {
			setIsAdding(false);
		}
	}

	const handleEditTask = (task: any) => {
		setEditingTask(task);
		setShowEditModal(true);
	};

	async function handleEditTaskSubmit(values: Record<string, any>) {
		if (!editingTask || !resolvedHolidayId || !auth0User) return;

		// DEBUG: Log edit values
		console.log('🐛 EDIT TASK DEBUG - Form values received:', values);
		console.log('🐛 EDIT TASK DEBUG - dueDate from form:', values.dueDate, typeof values.dueDate);
		console.log('🐛 EDIT TASK DEBUG - Original task:', editingTask);

		setIsUpdating(true);
		try {
			const updatedTask = {
				title: values.title,
				description: values.description || undefined,
				priority: values.priority as "low" | "medium" | "high",
				assignedTo: values.assignedTo || undefined,
				category: "Events",
				due_date: values.dueDate || undefined, // For API call
			};

			// Separate object for Redux state (needs camelCase)
			const reduxUpdate = {
				title: values.title,
				description: values.description || undefined,
				priority: values.priority as "low" | "medium" | "high",
				assignedTo: values.assignedTo || undefined,
				category: "Events",
				dueDate: values.dueDate || undefined, // Redux expects camelCase
			};

			// DEBUG: Log constructed update
			console.log('🐛 EDIT TASK DEBUG - Constructed updatedTask (API):', updatedTask);
			console.log('🐛 EDIT TASK DEBUG - updatedTask.due_date:', updatedTask.due_date, typeof updatedTask.due_date);
			console.log('🐛 EDIT TASK DEBUG - Redux update (camelCase):', reduxUpdate);
			console.log('🐛 EDIT TASK DEBUG - JSON.stringify payload:', JSON.stringify(updatedTask));

			// Optimistically update the Redux home data
			dispatch(
				updateTaskInHomeData({
					holidayId: resolvedHolidayId,
					taskId: editingTask.id,
					updates: reduxUpdate, // Use camelCase version for Redux
				})
			);

			// Call API directly instead of using custom hook
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
				body: JSON.stringify(updatedTask),
			});
			
			if (!response.ok) {
				// DEBUG: Log API error
				const errorText = await response.text();
				console.log('🐛 EDIT TASK DEBUG - API error response:', errorText);
				
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
			} else {
				// DEBUG: Log successful update
				const result = await response.json();
				console.log('🐛 EDIT TASK DEBUG - API success response:', result);
				console.log('🐛 EDIT TASK DEBUG - API response.data.dueDate:', result?.data?.dueDate);
			}
			
			setEditingTask(null);
			setShowEditModal(false);
		} catch (error) {
			console.log('🐛 EDIT TASK DEBUG - Exception occurred:', error);
			console.error("Failed to update task:", error);
		} finally {
			setIsUpdating(false);
		}
	}

	async function handleDeleteTask(taskId: string) {
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
				console.log('Task deleted successfully');
			}
		} catch (error) {
			// If API failed, revert the optimistic update
			dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: taskToDelete }));
			console.error("Failed to delete task:", error);
		} finally {
			setIsDeleting(false);
		}
	}

	async function handleToggleTask(taskId: string) {
		if (!resolvedHolidayId || !auth0User) return;

		const task = events.find((t: any) => t.id === taskId);
		if (!task) return;

		setIsToggling(true);
		try {
			const updatedTask = { ...task, isCompleted: !task.isCompleted };
			
			// Optimistically update Redux state
			dispatch(updateTaskInHomeData({
				holidayId: resolvedHolidayId,
				taskId,
				updates: { isCompleted: !task.isCompleted }
			}));

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
				body: JSON.stringify({ isCompleted: !task.isCompleted }),
			});

			if (!response.ok) {
				// Revert optimistic update on API failure
				dispatch(updateTaskInHomeData({
					holidayId: resolvedHolidayId,
					taskId,
					updates: { isCompleted: task.isCompleted }
				}));
				console.error("Failed to toggle task:", response.status, response.statusText);
			}
		} catch (error) {
			// Revert optimistic update on error
			dispatch(updateTaskInHomeData({
				holidayId: resolvedHolidayId,
				taskId,
				updates: { isCompleted: task.isCompleted }
			}));
			console.error("Failed to toggle task:", error);
		} finally {
			setIsToggling(false);
		}
	}

	// Filter and sort events - with safety checks
	const completedEvents = events?.filter((task: any) => task.isCompleted) || [];
	const upcomingEvents = events?.filter((task: any) => !task.isCompleted) || [];

	// Sort function
	const sortTasks = (tasks: any[], sortOption: SortOption) => {
		if (sortOption === "none") return tasks;
		
		return [...tasks].sort((a, b) => {
			switch (sortOption) {
				case "priority":
					const priorityOrder = { high: 3, medium: 2, low: 1 };
					return priorityOrder[b.priority as keyof typeof priorityOrder] - 
						priorityOrder[a.priority as keyof typeof priorityOrder];
				case "dateDue":
					if (!a.dueDate && !b.dueDate) return 0;
					if (!a.dueDate) return 1;
					if (!b.dueDate) return -1;
					return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
				case "assignedTo":
					if (!a.assignedTo && !b.assignedTo) return 0;
					if (!a.assignedTo) return 1;
					if (!b.assignedTo) return -1;
					return a.assignedTo.localeCompare(b.assignedTo);
				case "category":
					return a.category.localeCompare(b.category);
				default:
					return 0;
			}
		});
	};

	const sortedUpcomingEvents = sortTasks(upcomingEvents, sortBy);
	const sortedCompletedEvents = sortTasks(completedEvents, sortBy);

	return (
		<div className="min-h-screen new-year-cards-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="New Year Events"
				description="Plan your New Year celebrations!"
				backHref="/new-year"
				holidayColor="#d97706" // New Year amber-600 to match main page
				onSortClick={() => setShowSortModal(true)}
			/>

			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				{/* Add New Event Button */}
				<AddButton
					onClick={() => setShowForm(true)}
					text="Add New Event"
					accentColor="#fbbf24" // New Year gold
					disabled={isAdding}
					isLoading={isAdding}
				/>

				{/* Event Status Summary */}
				{!isLoading && (
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
						<h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
							Event Status
						</h2>
						<div className="grid grid-cols-3 gap-4 text-center">
							<div>
								<div className="text-2xl font-bold text-yellow-600">{events?.length || 0}</div>
								<div className="text-gray-600 dark:text-gray-400">Total Events</div>
							</div>
							<div>
								<div className="text-2xl font-bold text-green-600">{completedEvents?.length || 0}</div>
								<div className="text-gray-600 dark:text-gray-400">Completed</div>
							</div>
							<div>
								<div className="text-2xl font-bold text-yellow-600">{upcomingEvents?.length || 0}</div>
								<div className="text-gray-600 dark:text-gray-400">Remaining</div>
							</div>
						</div>
					</div>
				)}

				<TaskSection
					title="Upcoming Events"
					items={sortedUpcomingEvents}
					isCompleted={false}
					emptyMessage="No upcoming events yet. Add your first New Year event!"
					completedMessage=""
					renderItem={(task: any) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleTask}
							onDelete={handleDeleteTask}
							onEdit={handleEditTask}
							theme={{
								accentColor: "#fbbf24", // New Year gold
								hoverColor: "#f59e0b",
							}}
							borderColor="border-l-yellow-400" // New Year accent
							disableInternalModal={true}
						/>
					)}
				/>

				<TaskSection
					title="Completed Events"
					items={sortedCompletedEvents}
					isCompleted={true}
					emptyMessage="No completed events yet."
					completedMessage=""
					renderItem={(task: any) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleTask}
							onDelete={handleDeleteTask}
							onEdit={handleEditTask}
							theme={{
								accentColor: "#fbbf24", // New Year gold
								hoverColor: "#f59e0b",
							}}
							borderColor="border-l-yellow-400" // New Year accent
							disableInternalModal={true}
						/>
					)}
				/>
			</main>

			{/* Form Modal for Adding */}
			{showForm && (
				<FormModal
					isOpen={showForm}
					onClose={() => setShowForm(false)}
					onSubmit={handleAddTask}
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
						...(isHolidayShared ? [{ id: "assignedTo", type: "text", placeholder: "Assigned To" }] : []),
						{ id: "dueDate", type: "date", placeholder: "Due Date" },
					]}
					initialValues={{
						title: "",
						description: "",
						priority: "medium",
						...(isHolidayShared ? { assignedTo: "" } : {}),
						dueDate: "",
					}}
					loading={isAdding}
					submitText="Add Task"
					cardClassName="card-tasks"
				/>
			)}

			{/* Edit Modal */}
			{showEditModal && editingTask && (
				<FormModal
					isOpen={showEditModal}
					onClose={() => {
						setShowEditModal(false);
						setEditingTask(null);
					}}
					onSubmit={handleEditTaskSubmit}
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
						...(isHolidayShared ? [{ id: "assignedTo", type: "text", placeholder: "Assigned To" }] : []),
						{ id: "dueDate", type: "date", placeholder: "Due Date" },
					]}
					initialValues={{
						title: editingTask.title || "",
						description: editingTask.description || "",
						priority: editingTask.priority || "medium",
						...(isHolidayShared ? { assignedTo: editingTask.assignedTo || "" } : {}),
						dueDate: editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : "",
					}}
					loading={isUpdating}
					submitText="Update Task"
					cardClassName="card-tasks"
				/>
			)}

			{/* Sort Modal */}
			{showSortModal && (
				<SortModal
					isOpen={showSortModal}
					onClose={() => setShowSortModal(false)}
					currentSort={sortBy}
					onSortChange={(newSort) => {
						setSortBy(newSort as SortOption);
						setShowSortModal(false);
					}}
					accentColor="#fbbf24" // New Year gold
				/>
			)}
		</div>
	);
}