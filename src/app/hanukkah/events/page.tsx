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
import SortModal from "@/components/modals/SortModal";
import DeleteModal from "@/components/modals/DeleteModal";
import FormModal from "@/components/modals/FormModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import ToDoCard from "@/components/cards/to-do/ToDoCard";


type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

const defaultEventTasks = [
	{
		title: "Hanukkah Party Planning",
		description: "Plan the main Hanukkah celebration",
		category: "Events",
		priority: "high" as const,
	},
	{
		title: "Dreidel Game Setup",
		description: "Prepare dreidel games for guests",
		category: "Events",
		priority: "medium" as const,
	},
	{
		title: "Latke Making",
		description: "Prepare traditional potato latkes",
		category: "Events",
		priority: "high" as const,
	},
	{
		title: "Sufganiyot Preparation",
		description: "Make or order jelly donuts",
		category: "Events",
		priority: "medium" as const,
	},
	{
		title: "Guest List Finalization",
		description: "Confirm all invited guests",
		category: "Events",
		priority: "high" as const,
	},
	{
		title: "Music Playlist",
		description: "Create Hanukkah music playlist",
		category: "Events",
		priority: "low" as const,
	},
];

export default function HanukkahEventsPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);
	const { user: auth0User } = useAuth0();
	const holidayPreferences = useAppSelector(selectHolidayPreferences);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const homeData = useAppSelector(selectHomeData);

	// Get current Redux state for data access
	const currentState = useAppSelector((state: any) => state);

	// Get holiday ID for Hanukkah
	const holidayId = homeInitialized
		? getHolidayIdFromRoute("/hanukkah", holidayPreferences)
		: getHolidayIdFromRoute("/hanukkah", holidayPreferences);

	// Get holiday data from Redux if available
	const holidayData = getHolidayDataFromRedux(holidayId, currentState);

	// Filter tasks by category for events
	const eventTasks = holidayData?.tasks?.filter(
		(task: any) => task.category === "Events"
	) || [];

	// Use Redux data directly - no individual API calls needed
	const events = eventTasks || [];
	const isLoading = !homeInitialized;
	const error = null; // Error handling through home data loading

	// Local loading states for mutations
	const [isAdding, setIsAdding] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isToggling, setIsToggling] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);
	const [showDefaultTasks, setShowDefaultTasks] = useState(false);
	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showSortModal, setShowSortModal] = useState(false);

	useEffect(() => {
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch]);

	// Check if default event tasks exist
	useEffect(() => {
		if (events.length === 0 && homeInitialized) {
			setShowDefaultTasks(true);
		}
	}, [events, homeInitialized]);

	async function handleAddTask(values: Record<string, any>) {
		if (!values.title?.trim()) return;
		if (!holidayId || !auth0User) return;

		setIsAdding(true);
		try {
			const newTask = {
				id: `temp-${Date.now()}`, // Temporary ID for optimistic update
				title: values.title,
				description: values.description || undefined,
				priority: values.priority as "low" | "medium" | "high",
				assignedTo: values.assignedTo || undefined,
				category: "Events",
				dueDate: values.dueDate || undefined,
				isCompleted: false,
				holidayId: holidayId,
			};

			// Optimistically update Redux state first
			dispatch(addTaskToHomeData({ holidayId, task: newTask }));

			// Call API
			const response = await fetch(`/api/holidays/${holidayId}/tasks`, {
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
				body: JSON.stringify({
					title: values.title,
					description: values.description || undefined,
					priority: values.priority as "low" | "medium" | "high",
					assignedTo: values.assignedTo || undefined,
					category: "Events",
					dueDate: values.dueDate || undefined,
					isCompleted: false,
					holidayId: holidayId,
				}),
			});

			if (response.ok) {
				// Replace temporary task with real task from API
				const result = await response.json();
				dispatch(removeTaskFromHomeData({ holidayId, taskId: newTask.id }));
				dispatch(addTaskToHomeData({ holidayId, task: result }));
			} else {
				// Remove optimistic update on error
				dispatch(removeTaskFromHomeData({ holidayId, taskId: newTask.id }));
				console.error("Failed to add task:", response.status, response.statusText);
			}
			
			setShowForm(false);
		} catch (error) {
			console.error("Failed to add task:", error);
		} finally {
			setIsAdding(false);
		}
	}

	async function addDefaultEventTasks() {
		if (!holidayId || !auth0User) return;

		setIsAdding(true);
		try {
			// Add all default event tasks with optimistic updates
			for (const task of defaultEventTasks) {
				const newTask = {
					id: `temp-${Date.now()}-${task.title}`, // Temporary ID
					...task,
					isCompleted: false,
					holidayId: holidayId,
				};

				// Optimistically update Redux state first
				dispatch(addTaskToHomeData({ holidayId, task: newTask }));

				try {
					const response = await fetch(`/api/holidays/${holidayId}/tasks`, {
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
						body: JSON.stringify({
							...task,
							isCompleted: false,
							holidayId: holidayId,
						}),
					});
					
					if (response.ok) {
						// Replace temporary task with real task from API
						const result = await response.json();
						dispatch(removeTaskFromHomeData({ holidayId, taskId: newTask.id }));
						dispatch(addTaskToHomeData({ holidayId, task: result }));
					} else {
						// Remove optimistic update on error
						dispatch(removeTaskFromHomeData({ holidayId, taskId: newTask.id }));
						console.error("Failed to add default task:", response.status, response.statusText);
					}
				} catch (taskError) {
					// Remove optimistic update on error
					dispatch(removeTaskFromHomeData({ holidayId, taskId: newTask.id }));
					console.error("Failed to add default task:", taskError);
				}
			}
			
			setShowDefaultTasks(false);
		} catch (error) {
			console.error("Failed to add default tasks:", error);
		} finally {
			setIsAdding(false);
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

		setIsToggling(true);
		console.log('Starting toggle for task:', taskId); // Debug
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
					holidayId: holidayId,
					taskId: taskId,
					updates: { isCompleted: newCompletionStatus },
				})
			);

			// Call API directly instead of using custom hook
			const apiUrl = `/api/holidays/${holidayId}/tasks/${taskId}`;
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
							holidayId: holidayId,
							taskId: taskId,
							updates: { isCompleted: currentTask.isCompleted },
						})
					);
				}
				console.error("Failed to toggle task:", response.status, response.statusText);
			}
		} catch (error) {
			console.error("Failed to toggle task:", error);
			// Revert the optimistic update on error
			const currentTask = events.find((task: any) => task.id === taskId);
			if (currentTask) {
				dispatch(
					updateTaskInHomeData({
						holidayId: holidayId,
						taskId: taskId,
						updates: { isCompleted: currentTask.isCompleted },
					})
				);
			}
		} finally {
			setIsToggling(false);
		}
	}

	async function handleDeleteTask(taskId: string) {
		if (!holidayId || !auth0User) return;

		// Find the task to delete for potential rollback
		const taskToDelete = events.find((task: any) => task.id === taskId);
		if (!taskToDelete) return;

		setIsDeleting(true);
		try {
			// Optimistically update Redux state first
			dispatch(removeTaskFromHomeData({ holidayId, taskId }));

			// Call API directly instead of using custom hook
		const apiUrl = `/api/holidays/${holidayId}/tasks/${taskId}`;
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
				dispatch(addTaskToHomeData({ holidayId, task: taskToDelete }));
				console.error("Failed to delete task:", response.status, response.statusText);
			} else {
				console.log('Task deleted successfully');
				// Check if this was the last task and re-show default tasks prompt
				const remainingTasks = events.filter(e => e.id !== taskId);
				console.log('Events after delete:', remainingTasks.length);
				if (remainingTasks.length === 0) {
					console.log('No tasks remaining, showing default tasks prompt');
					setShowDefaultTasks(true);
				}
			}
		} catch (error) {
			// If API failed, revert the optimistic update
			dispatch(addTaskToHomeData({ holidayId, task: taskToDelete }));
			console.error("Failed to delete task:", error);
		} finally {
			setIsDeleting(false);
		}
	}

	const handleEditTask = (task: any) => {
		setEditingTask(task);
		setShowEditModal(true);
	};

	async function handleEditTaskSubmit(values: Record<string, any>) {
		if (!editingTask || !holidayId || !auth0User) return;

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
					holidayId: holidayId,
					taskId: editingTask.id,
					updates: updatedTask,
				})
			);

			// Call API directly instead of using custom hook
			const response = await fetch(`/api/holidays/${holidayId}/tasks/${editingTask.id}`, {
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
				// Revert the optimistic update on error
				dispatch(
					updateTaskInHomeData({
						holidayId: holidayId,
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
			
			setShowEditModal(false);
			setEditingTask(null);
		} catch (error) {
			console.error("Failed to update task:", error);
			// Revert the optimistic update on error
			dispatch(
				updateEventInHomeData({
					holidayId: holidayId,
					eventId: editingTask.id,
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
		} finally {
			setIsUpdating(false);
		}
	}

	function closeEditModal() {
		setShowEditModal(false);
		setEditingTask(null);
	}

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
			<div className="min-h-screen hanukkah-tasks-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading events...</p>
				</div>
			</div>
		);
	}

	const sortedTasks = sortTasks(events);
	const incompleteTasks = sortedTasks.filter((task: any) => !task.isCompleted);
	const completedTasks = sortedTasks.filter((task: any) => task.isCompleted);

	return (
		<div className="min-h-screen hanukkah-tasks-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Hanukkah Events"
				backHref="/hanukkah"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort tasks"
				description="Plan your Hanukkah events and celebrations!"
				holidayColor="blue-500"
				error={error ? "API Error" : undefined}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Default Tasks Prompt */}
				{showDefaultTasks && (
					<div className="card card-tasks rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
						<h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
							🎉 Set Up Hanukkah Events
						</h3>
						<p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
							Would you like to add some common Hanukkah event planning tasks?
						</p>
						<div className="flex gap-2">
							<button
								onClick={addDefaultEventTasks}
								className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
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

				<AddButton title="Event Task" onClick={openForm} color="blue" />
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
					emptyMessage="All events planned! 🎉"
					completedMessage=""
					renderItem={(task: any) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleTask}
							onDelete={handleDeleteTask}
							onEdit={handleEditTask}
							theme={{
								accentColor: "#3b82f6", // Blue for Hanukkah
							}}
							borderColor="rgb(var(--color-blue-500))" // Blue border for Hanukkah
							disableInternalModal={true}
						/>
					)}
				/>

				<TaskSection
					title="Completed"
					items={completedTasks}
					isCompleted={true}
					emptyMessage="No completed tasks yet."
					completedMessage="No completed tasks yet."
					renderItem={(task: any) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleTask}
							onDelete={handleDeleteTask}
							onEdit={handleEditTask}
							className="opacity-60"
							theme={{
								accentColor: "#3b82f6", // Blue for Hanukkah
							}}
							borderColor="rgb(var(--color-blue-500))" // Blue border for Hanukkah
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
				loading={isUpdating}
				submitText="Update Task"
				cardClassName="card-tasks"
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
