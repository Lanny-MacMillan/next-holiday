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

const defaultMealPlanningTasks = [
	{
		title: "Plan Traditional Turkey Menu",
		description: "Decide on turkey preparation method and seasonings",
		priority: "high" as const,
	},
	{
		title: "Prepare Side Dish List",
		description: "Plan stuffing, mashed potatoes, cranberry sauce, and vegetables",
		priority: "high" as const,
	},
	{
		title: "Dessert Planning",
		description: "Organize pumpkin pie, apple pie, and other Thanksgiving desserts",
		priority: "medium" as const,
	},
	{
		title: "Calculate Serving Portions",
		description: "Determine quantities based on guest count",
		priority: "high" as const,
	},
	{
		title: "Create Cooking Timeline",
		description: "Schedule when to start each dish for coordinated meal",
		priority: "high" as const,
	},
	{
		title: "Prepare Make-Ahead Items",
		description: "Plan dishes that can be prepared in advance",
		priority: "medium" as const,
	},
	{
		title: "Vegetarian/Dietary Options",
		description: "Plan alternative dishes for dietary restrictions",
		priority: "medium" as const,
	},
	{
		title: "Appetizers and Beverages",
		description: "Select pre-dinner snacks and drink options",
		priority: "low" as const,
	},
	{
		title: "Leftover Planning",
		description: "Plan creative ways to use Thanksgiving leftovers",
		priority: "low" as const,
	},
	{
		title: "Final Menu Review",
		description: "Double-check menu completeness and balance",
		priority: "medium" as const,
	},
];

export default function ThanksgivingMealPlanningPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);
	const { user: auth0User } = useAuth0();
	
	// No need for useMealPlanningMutations hook - using direct API calls like Kwanzaa

	// Get Redux data
	const holidayPreferences = useAppSelector(selectHolidayPreferences);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const homeData = useAppSelector(selectHomeData);

	// Get current Redux state for data access
	const currentState = useAppSelector((state: any) => state);

	// Holiday ID resolution
	const resolvedHolidayId = homeInitialized
		? getHolidayIdFromRoute("/thanksgiving", holidayPreferences)
		: getHolidayIdFromRoute("/thanksgiving", holidayPreferences);

	// Check if the holiday is shared to conditionally show assign to field
	const isHolidayShared = useAppSelector((state: any) =>
		selectIsHolidayShared(state, "thanksgiving")
	);

	// Redux data access - meal planning tasks are stored as tasks with category "Meal Planning"
	const holidayData = getHolidayDataFromRedux(resolvedHolidayId, currentState);
	const mealPlanningTasks = holidayData?.tasks?.filter((task: any) => task.category === "Meal Planning") || [];
	const isLoading = !homeInitialized;
	const error = null;


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
	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDefaultTasks, setShowDefaultTasks] = useState(false);
	const [isAdding, setIsAdding] = useState(false);
	const [isToggling, setIsToggling] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	useEffect(() => {
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch]);

	// Check if default meal planning tasks should be shown
	useEffect(() => {
		if (mealPlanningTasks.length === 0 && homeInitialized) {
			setShowDefaultTasks(true);
		}
	}, [mealPlanningTasks, homeInitialized]);

	// CRUD Operations
	async function addDefaultMealPlanningTasks() {
		if (!resolvedHolidayId || !auth0User) return;
		
		setIsAdding(true);
		try {
			// Make all API calls WITHOUT optimistic updates during bulk addition
			for (const task of defaultMealPlanningTasks) {
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
							category: "Meal Planning",
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
			
			// Refresh home data ONCE after all tasks are added
			await refreshHomeData();
			setShowDefaultTasks(false);
		} catch (error) {
			console.error("Failed to add default tasks:", error);
		} finally {
			setIsAdding(false);
		}
	}

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
			category: "Meal Planning",
			dueDate: values.dueDate || undefined,
			isCompleted: false,
			holidayId: resolvedHolidayId,
		};

		try {
			// Optimistically update Redux state first (like Kwanzaa)
			dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: newTask }));

			// Call API - map camelCase to snake_case for API
			const apiPayload = {
				title: values.title,
				description: values.description || undefined,
				priority: values.priority as "low" | "medium" | "high",
				assigned_to: values.assignedTo || undefined, // snake_case for API
				category: "Meal Planning",
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
				// Replace temporary task with real task from API (like Kwanzaa)
				const result = await response.json();
				console.log('API success, replacing temp task with real task:', result);
				dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId: newTask.id }));
				dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: result }));
				
				// Also refresh home data like Kwanzaa does
				await refreshHomeData();
			} else {
				// Remove optimistic update on error
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

	async function handleToggleTask(taskId: string) {
		if (!resolvedHolidayId || !auth0User) return;

		setIsToggling(true);
		try {
			// Find the current task to get its completion status
			const currentTask = mealPlanningTasks.find((task: any) => task.id === taskId);
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
				const currentTask = mealPlanningTasks.find((task: any) => task.id === taskId);
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
				category: "Meal Planning",
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
				category: "Meal Planning",
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

	async function handleDeleteTask(taskId: string) {
		if (!resolvedHolidayId || !auth0User) return;

		// Find the task to delete for potential rollback
		const taskToDelete = mealPlanningTasks.find((task: any) => task.id === taskId);
		if (!taskToDelete) return;

		setIsDeleting(true);
		try {
			// Optimistically update Redux state first
			dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId }));

			// Call API directly instead of using custom hook
			const apiUrl = `/api/holidays/${resolvedHolidayId}/tasks/${taskId}`;

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
				const remainingTasks = mealPlanningTasks.filter(e => e.id !== taskId);
				console.log('Meal planning tasks after delete:', remainingTasks.length);
				if (remainingTasks.length === 0) {
					console.log('No tasks remaining, showing default tasks prompt');
					setShowDefaultTasks(true);
				}
			}
		} catch (error) {
			// If there was an error, revert the optimistic update
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
			<div className="min-h-screen thanksgiving-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading meal planning...
					</p>
				</div>
			</div>
		);
	}

	const sortedTasks = sortTasks(mealPlanningTasks);
	const incompleteTasks = sortedTasks.filter((task: any) => !task.isCompleted);
	const completedTasks = sortedTasks.filter((task: any) => task.isCompleted);

		return (
		<div className="min-h-screen thanksgiving-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="🍽️ Meal Planning"
				backHref="/thanksgiving"
				onSortClick={() => setShowSortModal(true)}
				description="Plan your Thanksgiving menu and dishes!"
				holidayColor="amber-600"
				sortTitle="Sort Tasks"
			/>

			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				{/* Default Tasks Prompt */}
				{showDefaultTasks && (
					<div className="card card-tasks rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
						<h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
							🍽️ Set Up Meal Planning
						</h3>
						<p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
							Would you like to add some common Thanksgiving meal planning tasks?
						</p>
						<div className="flex gap-2">
							<button
								onClick={addDefaultMealPlanningTasks}
								disabled={isAdding}
								className="bg-amber-500 hover:bg-amber-600 border border-amber-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
							>
								{isAdding && (
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
								)}
								{isAdding ? "Adding Tasks..." : "Add Default Tasks"}
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

				<AddButton title="Task" onClick={openForm} color="amber" />

				{/* Task Status Summary */}
				{mealPlanningTasks.length > 0 && (
					<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
						<h3 className="text-lg font-semibold mb-4">Meal Planning Status</h3>
						<div className="grid grid-cols-3 gap-4 text-center">
							<div>
								<div className="text-2xl font-bold text-blue-600">{mealPlanningTasks.length}</div>
								<div className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</div>
							</div>
							<div>
								<div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
								<div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
							</div>
							<div>
								<div className="text-2xl font-bold text-orange-600">{incompleteTasks.length}</div>
								<div className="text-sm text-gray-600 dark:text-gray-400">Remaining</div>
							</div>
						</div>
				</div>
				)}

				{isAdding ? (
					<div className="flex items-center justify-center py-12">
						<div className="text-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-4"></div>
							<p className="text-gray-600 dark:text-gray-300">Adding default tasks...</p>
						</div>
					</div>
				) : (
					<TaskSection
						title="Upcoming Tasks"
						items={incompleteTasks}
						isCompleted={false}
						emptyMessage="No meal planning tasks yet."
						completedMessage="All tasks completed!"
						renderItem={(task: any) => (
							<ToDoCard
								key={task.id}
								task={task}
								onToggleComplete={handleToggleTask}
								onDelete={handleDeleteTask}
								onEdit={handleEditTask}
								theme={{
									accentColor: "#d97706", // Amber for Thanksgiving
								}}
								borderColor="rgb(217 119 6)" // Amber border for Thanksgiving
								disableInternalModal={true}
							/>
						)}
					/>
				)}

				{!isAdding && (
					<TaskSection
						title="Completed Tasks"
						items={completedTasks}
						isCompleted={true}
						emptyMessage=""
						completedMessage=""
						renderItem={(task: any) => (
							<ToDoCard
								key={task.id}
								task={task}
								onToggleComplete={handleToggleTask}
								onDelete={handleDeleteTask}
								onEdit={handleEditTask}
								className="opacity-60"
								theme={{
									accentColor: "#d97706", // Amber for Thanksgiving
								}}
								borderColor="rgb(217 119 6)" // Amber border for Thanksgiving
								disableInternalModal={true}
							/>
						)}
					/>
				)}
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showForm}
				title="Add New Meal Planning Task"
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
				title="Edit Meal Planning Task"
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
					{ value: "dateDue", label: "Due Date" },
					{ value: "assignedTo", label: "Assigned To" },
					{ value: "category", label: "Category" },
				]}
				title="Sort Tasks"
			/>
		</div>
	);
}
