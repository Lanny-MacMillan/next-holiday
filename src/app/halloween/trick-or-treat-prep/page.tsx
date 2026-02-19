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

const defaultTrickOrTreatTasks = [
	{
		title: "Buy Halloween Candy",
		description: "Stock up on candy for trick-or-treaters",
		category: "Trick-or-Treat Prep",
		priority: "high" as const,
	},
	{
		title: "Prepare Trick-or-Treat Route",
		description: "Plan route for trick-or-treating",
		category: "Trick-or-Treat Prep",
		priority: "medium" as const,
	},
	{
		title: "Buy Glow Sticks",
		description: "For safety during trick-or-treating",
		category: "Trick-or-Treat Prep",
		priority: "medium" as const,
	},
	{
		title: "Check Flashlights",
		description: "Ensure flashlights work for evening trick-or-treating",
		category: "Trick-or-Treat Prep",
		priority: "low" as const,
	},
];

export default function HalloweenTrickOrTreatPrepPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);
	const { user: auth0User } = useAuth0();
	
	// No need for useTrickOrTreatPrepMutations hook - using direct API calls like Kwanzaa

	// Get Redux data
	const holidayPreferences = useAppSelector(selectHolidayPreferences);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const homeData = useAppSelector(selectHomeData);

	// Get current Redux state for data access
	const currentState = useAppSelector((state: any) => state);

	// Holiday ID resolution
	const resolvedHolidayId = homeInitialized
		? getHolidayIdFromRoute("/halloween", holidayPreferences)
		: getHolidayIdFromRoute("/halloween", holidayPreferences);

	// Check if the holiday is shared to conditionally show assign to field
	const isHolidayShared = useAppSelector((state: any) =>
		selectIsHolidayShared(state, "halloween")
	);

	// Redux data access - trick or treat prep are stored as tasks with category "Trick or Treat Prep" like in Kwanzaa
	const holidayData = getHolidayDataFromRedux(resolvedHolidayId, currentState);
	const trickOrTreatPrep = holidayData?.tasks?.filter((task: any) => task.category === "Trick or Treat Prep") || [];
	const isLoading = !homeInitialized;
	const error = null;

	// Debug logging to understand the state
	console.log('Halloween Trick or Treat Prep Debug:', {
		resolvedHolidayId,
		holidayData: holidayData ? { ...holidayData, tasks: holidayData.tasks?.length || 0 } : null,
		allTasks: holidayData?.tasks?.length || 0,
		trickOrTreatTasks: trickOrTreatPrep.length,
		trickOrTreatPrep: trickOrTreatPrep.map(e => ({ id: e.id, title: e.title, category: e.category, isCompleted: e.isCompleted }))
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
	const [showDefaultTasks, setShowDefaultTasks] = useState(false);
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

	// Check if default trick or treat tasks exist
	useEffect(() => {
		if (trickOrTreatPrep.length === 0 && homeInitialized) {
			setShowDefaultTasks(true);
		}
	}, [trickOrTreatPrep, homeInitialized]);

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
			category: "Trick or Treat Prep",
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
				category: "Trick or Treat Prep",
				due_date: values.dueDate || undefined, // snake_case for API
				isCompleted: false,
			};
			
			console.log('🐛 [HalloweenAdd] API payload:', apiPayload);
			
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

	async function addDefaultTrickOrTreatTasks() {
		if (!resolvedHolidayId || !auth0User) return;

		setIsAdding(true);
		try {
			// Add all default trick or treat tasks without optimistic updates during bulk addition
			for (const task of defaultTrickOrTreatTasks) {

				try {
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
						body: JSON.stringify({
							...task,
							category: "Trick or Treat Prep",
							isCompleted: false,
						}),
					});
					
					if (!response.ok) {
						console.error("Failed to add default task:", response.status, response.statusText);
					}
				} catch (taskError) {
					console.error("Failed to add default task:", taskError);
				}
			}
			
			// Refresh home data once after all tasks are added
			await refreshHomeData();
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
		if (!resolvedHolidayId || !auth0User) return;

		setIsToggling(true);
		try {
			// Find the current task to get its completion status
			const currentTask = trickOrTreatPrep.find((task: any) => task.id === taskId);
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
				const currentTask = trickOrTreatPrep.find((task: any) => task.id === taskId);
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

	async function handleDeleteTask(taskId: string) {
		if (!resolvedHolidayId || !auth0User) return;

		// Find the task to delete for potential rollback
		const taskToDelete = trickOrTreatPrep.find((task: any) => task.id === taskId);
		if (!taskToDelete) return;

		setIsDeleting(true);
		try {
			// Optimistically update Redux state first
			dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId }));

			// Call API directly instead of using custom hook
			const apiUrl = `/api/holidays/${resolvedHolidayId}/tasks/${taskId}`;
			console.log('Delete API URL:', apiUrl); // Debug logging  
			console.log('Trick or treat prep before delete:', trickOrTreatPrep.length);
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
				// Check if this was the last task and re-show default tasks prompt
				const remainingTasks = trickOrTreatPrep.filter(e => e.id !== taskId);
				console.log('Trick or treat prep after delete:', remainingTasks.length);
				if (remainingTasks.length === 0) {
					console.log('No tasks remaining, showing default tasks prompt');
					setShowDefaultTasks(true);
				}
			}
		} catch (error) {
			// If error occurred, revert the optimistic update
			dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: taskToDelete }));
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
		if (!editingTask || !resolvedHolidayId || !auth0User) return;

		setIsUpdating(true);
		try {
			const updatedTask = {
				title: values.title,
				description: values.description || undefined,
				priority: values.priority as "low" | "medium" | "high",
				assignedTo: values.assignedTo || undefined,
				category: "Trick or Treat Prep",
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
				category: "Trick or Treat Prep",
				due_date: values.dueDate || undefined, // snake_case for API
			};
			
			console.log('🐛 [HalloweenEdit] API payload:', apiPayload);
			
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

	function closeEditModal() {
		setEditingTask(null);
		setShowEditModal(false);
	}

	function sortTasks(tasksToSort: any[]): any[] {
		switch (sortBy) {
			case "priority":
				return [...tasksToSort].sort((a, b) => {
					const priorityOrder = { high: 3, medium: 2, low: 1 };
					return priorityOrder[b.priority] - priorityOrder[a.priority];
				});
			case "dateDue":
				return [...tasksToSort].sort((a, b) => {
					if (!a.dueDate && !b.dueDate) return 0;
					if (!a.dueDate) return 1;
					if (!b.dueDate) return -1;
					return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
				});
			case "assignedTo":
				return [...tasksToSort].sort((a, b) => {
					if (!a.assignedTo && !b.assignedTo) return 0;
					if (!a.assignedTo) return 1;
					if (!b.assignedTo) return -1;
					return a.assignedTo.localeCompare(b.assignedTo);
				});
			case "category":
				return [...tasksToSort].sort((a, b) => {
					if (!a.category && !b.category) return 0;
					if (!a.category) return 1;
					if (!b.category) return -1;
					return a.category.localeCompare(b.category);
				});
			default:
				return tasksToSort;
		}
	}

	// Show loading only if home data is not initialized
	if (!homeInitialized) {
		return (
			<div className="min-h-screen halloween-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading tasks...</p>
				</div>
			</div>
		);
	}

	const sortedTasks = sortTasks(trickOrTreatPrep);
	const incompleteTasks = sortedTasks.filter((task: any) => !task.isCompleted);
	const completedTasks = sortedTasks.filter((task: any) => task.isCompleted);

	return (
		<div className="min-h-screen halloween-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Trick-or-Treat Prep"
				backHref="/halloween"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort tasks"
				description="Keep track of trick-or-treat prep tasks!"
				holidayColor="orange-500"
				error={undefined}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Default Tasks Modal */}
				{showDefaultTasks && (
					<div className="card rounded-lg p-6 mb-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700">
						<h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
							🎃 Welcome to Halloween Planning!
						</h3>
						<p className="text-gray-600 dark:text-gray-400 mb-4">
							Let's get you started with some essential trick-or-treat prep
							tasks.
						</p>
						<button
							onClick={addDefaultTrickOrTreatTasks}
							disabled={isAdding}
							className="bg-orange-500 hover:bg-orange-600 border border-orange-700 text-orange-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
						>
							{isAdding && (
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-700"></div>
							)}
							{isAdding ? "Adding Tasks..." : "Add Default Tasks"}
						</button>
					</div>
				)}

				<AddButton title="Task" onClick={openForm} holidayColor="orange" />

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

				{isAdding ? (
					<div className="flex items-center justify-center py-12">
						<div className="text-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
							<p className="text-gray-600 dark:text-gray-300">Adding default tasks...</p>
						</div>
					</div>
				) : (
					<TaskSection
						title="Incomplete"
						items={incompleteTasks}
						isCompleted={false}
						emptyMessage="No trick-or-treat prep tasks yet. Add your first task!"
						completedMessage="No trick-or-treat prep tasks yet. Add your first task!"
						renderItem={(task: any) => (
							<ToDoCard
								key={task.id}
								task={task}
								onToggleComplete={handleToggleTask}
								onDelete={handleDeleteTask}
								onEdit={handleEditTask}
								theme={{
									accentColor: "#f97316", // Orange for Halloween
								}}
								borderColor="rgb(var(--color-orange-500))" // Orange border for Halloween
								disableInternalModal={true}
							/>
						)}
					/>
				)}

				{!isAdding && (
					<TaskSection
						title="Completed"
						items={completedTasks}
						isCompleted={true}
						emptyMessage="No completed trick-or-treat prep tasks yet."
						completedMessage="No completed trick-or-treat prep tasks yet."
						renderItem={(task: any) => (
							<ToDoCard
								key={task.id}
								task={task}
								onToggleComplete={handleToggleTask}
								onDelete={handleDeleteTask}
								onEdit={handleEditTask}
								className="opacity-60"
								theme={{
									accentColor: "#f97316", // Orange for Halloween
								}}
								borderColor="rgb(var(--color-orange-500))" // Orange border for Halloween
								disableInternalModal={true}
							/>
						)}
					/>
				)}
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showForm}
				title="Add New Trick or Treat Task"
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
				onSubmit={handleAddTask}
				onClose={closeForm}
				loading={isAdding}
				submitText="Add Task"
				cardClassName="card-tasks"
			/>

			{/* Edit Modal */}
			<FormModal
				isOpen={showEditModal}
				title="Edit Trick or Treat Task"
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
				initialValues={editingTask ? {
					title: editingTask.title || "",
					description: editingTask.description || "",
					priority: editingTask.priority || "medium",
					...(isHolidayShared ? { assignedTo: editingTask.assignedTo || "" } : {}),
					dueDate: editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : "",
				} : {}}
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
