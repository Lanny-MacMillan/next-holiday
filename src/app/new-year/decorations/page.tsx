"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import {
	updateTaskInHomeData,
	setHomeData,
	addTaskToHomeData,
	removeTaskFromHomeData,
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

const defaultDecorationTasks = [
	{
		title: "Set up New Year countdown display",
		description: "Prepare countdown decorations for midnight celebration",
		priority: "high" as const,
	},
	{
		title: "Hang New Year banners and streamers",
		description: "Display festive New Year banners and colorful streamers",
		priority: "medium" as const,
	},
	{
		title: "Arrange New Year centerpieces",
		description: "Create elegant centerpieces with champagne glasses and confetti",
		priority: "medium" as const,
	},
	{
		title: "Set up party decorations and balloons",
		description: "Prepare gold, silver, and black balloons and party decorations",
		priority: "high" as const,
	},
	{
		title: "Prepare confetti and sparklers",
		description: "Set up confetti cannons and safe sparklers for celebration",
		priority: "medium" as const,
	},
	{
		title: "Create photo booth backdrop",
		description: "Set up New Year themed photo booth with props",
		priority: "low" as const,
	},
];

export default function NewYearDecorationsPage() {
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
		? getHolidayIdFromRoute("/new-year", holidayPreferences)
		: getHolidayIdFromRoute("/new-year", holidayPreferences);

	// Check if the holiday is shared to conditionally show assign to field
	const isHolidayShared = useAppSelector((state: any) =>
		selectIsHolidayShared(state, "new-year")
	);

	// Redux data access - decorations are stored as tasks with category "Decorations"
	const holidayData = getHolidayDataFromRedux(resolvedHolidayId, currentState);
	const decorations = holidayData?.tasks?.filter((task: any) => task.category === "Decorations") || [];
	const isLoading = !homeInitialized;

	// Debug logging to understand the state
	console.log('New Year Decorations Debug:', {
		resolvedHolidayId,
		holidayData: holidayData ? { ...holidayData, tasks: holidayData.tasks?.length || 0 } : null,
		allTasks: holidayData?.tasks?.length || 0,
		decorationTasks: decorations.length,
		decorations: decorations.map(d => ({ id: d.id, title: d.title, category: d.category, isCompleted: d.isCompleted }))
	});

	// Refresh home data function
	const refreshHomeData = async () => {
		if (!auth0User?.sub || !resolvedHolidayId) return;

		try {
			const response = await fetch("/api/home", {
				headers: {
					"Content-Type": "application/json",
					"x-test-user": JSON.stringify(auth0User),
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
		dispatch(fetchContacts());
	}, [dispatch]);

	// Check if default decoration tasks exist
	useEffect(() => {
		if (decorations.length === 0 && homeInitialized) {
			setShowDefaultTasks(true);
		}
	}, [decorations, homeInitialized]);

	// CRUD Operations - Add Decoration with optimistic updates + refreshHomeData + API field mapping
	async function handleAddDecoration(values: Record<string, any>) {
		if (!values.title?.trim()) return;
		if (!resolvedHolidayId || !auth0User) return;

		setIsAdding(true);
		
		const newTask = {
			id: `temp-${Date.now()}`,
			title: values.title,
			description: values.description || undefined,
			priority: values.priority as "low" | "medium" | "high",
			assignedTo: values.assignedTo || undefined,
			category: "Decorations",
			dueDate: values.dueDate || undefined,
			isCompleted: false,
			holidayId: resolvedHolidayId,
		};

		try {
			// Optimistically update Redux state first
			dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: newTask }));

			// CRITICAL: Map camelCase to snake_case for API
			const apiPayload = {
				title: values.title,
				description: values.description || undefined,
				priority: values.priority as "low" | "medium" | "high",
				assigned_to: values.assignedTo || undefined, // snake_case for API
				category: "Decorations",
				due_date: values.dueDate || undefined, // snake_case for API
				isCompleted: false,
			};

			console.log('🐛 [NewYearDecorationsAdd] API payload:', apiPayload);

			const response = await fetch(`/api/holidays/${resolvedHolidayId}/tasks`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-test-user": JSON.stringify(auth0User),
				},
				body: JSON.stringify(apiPayload), // Use mapped payload
			});

			if (response.ok) {
				const result = await response.json();
				dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId: newTask.id }));
				dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: result }));
				
				// CRITICAL: Refresh home data for proper UI updates
				await refreshHomeData();
			} else {
				// Remove optimistic update on error
				dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId: newTask.id }));
				console.error("Failed to add decoration:", response.status, response.statusText);
			}

			setShowForm(false);
		} catch (error) {
			// Remove optimistic update on error
			dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId: newTask.id }));
			console.error("Failed to add decoration:", error);
		} finally {
			setIsAdding(false);
		}
	}

	async function addDefaultDecorationTasks() {
		if (!resolvedHolidayId || !auth0User) return;

		setIsAdding(true);
		try {
			for (const task of defaultDecorationTasks) {
				const newTask = {
					id: `temp-${Date.now()}-${task.title}`,
					...task,
					category: "Decorations",
					isCompleted: false,
					holidayId: resolvedHolidayId,
				};

				// Optimistically update Redux state first
				dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: newTask }));

				try {
					const response = await fetch(`/api/holidays/${resolvedHolidayId}/tasks`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"x-test-user": JSON.stringify(auth0User),
						},
						body: JSON.stringify({
							...task,
							category: "Decorations",
							isCompleted: false,
						}),
					});

					if (response.ok) {
						const result = await response.json();
						dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId: newTask.id }));
						dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: result }));
					} else {
						dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId: newTask.id }));
						console.error("Failed to add default decoration task:", response.status, response.statusText);
					}
				} catch (taskError) {
					dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId: newTask.id }));
					console.error("Failed to add default decoration task:", taskError);
				}
			}
			
			setShowDefaultTasks(false);
		} catch (error) {
			console.error("Failed to add default decoration tasks:", error);
		} finally {
			setIsAdding(false);
		}
	}

	async function handleToggleCompletion(taskId: string) {
		if (!resolvedHolidayId || !auth0User) return;

		setIsToggling(true);
		try {
			const currentTask = decorations.find((task: any) => task.id === taskId);
			if (!currentTask) {
				console.error("Task not found:", taskId);
				return;
			}

			const newCompletionStatus = !currentTask.isCompleted;

			// Optimistically update the Redux home data
			dispatch(
				updateTaskInHomeData({
					holidayId: resolvedHolidayId,
					taskId: taskId,
					updates: { isCompleted: newCompletionStatus },
				})
			);

			const response = await fetch(`/api/holidays/${resolvedHolidayId}/tasks/${taskId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					"x-test-user": JSON.stringify(auth0User),
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
				console.error("Failed to toggle decoration:", response.status, response.statusText);
			}
		} catch (error) {
			console.error("Failed to toggle decoration:", error);
		} finally {
			setIsToggling(false);
		}
	}

	const handleEditDecoration = (task: any) => {
		setEditingTask(task);
		setShowEditModal(true);
	};

	async function handleEditDecorationSubmit(values: Record<string, any>) {
		if (!editingTask || !resolvedHolidayId || !auth0User) return;

		setIsUpdating(true);
		try {
			const updatedTask = {
				title: values.title,
				description: values.description || undefined,
				priority: values.priority as "low" | "medium" | "high",
				assignedTo: values.assignedTo || undefined,
				category: "Decorations",
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

			// CRITICAL: Map camelCase to snake_case for API
			const apiPayload = {
				title: values.title,
				description: values.description || undefined,
				priority: values.priority as "low" | "medium" | "high",
				assigned_to: values.assignedTo || undefined, // snake_case for API
				category: "Decorations",
				due_date: values.dueDate || undefined, // snake_case for API
			};

			console.log('🐛 [NewYearDecorationsEdit] API payload:', apiPayload);

			const response = await fetch(`/api/holidays/${resolvedHolidayId}/tasks/${editingTask.id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					"x-test-user": JSON.stringify(auth0User),
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
				console.error("Failed to update decoration:", response.status, response.statusText);
			}

			setEditingTask(null);
			setShowEditModal(false);
		} catch (error) {
			console.error("Failed to update decoration:", error);
		} finally {
			setIsUpdating(false);
		}
	}

	async function handleDelete(taskId: string, taskTitle: string) {
		if (!resolvedHolidayId || !auth0User) return;

		const taskToDelete = decorations.find((task: any) => task.id === taskId);
		if (!taskToDelete) return;

		setIsDeleting(true);
		try {
			// Optimistically update Redux state first
			dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId }));

			const response = await fetch(`/api/holidays/${resolvedHolidayId}/tasks/${taskId}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					"x-test-user": JSON.stringify(auth0User),
				},
			});

			if (!response.ok) {
				// If API failed, revert the optimistic update
				dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: taskToDelete }));
				console.error("Failed to delete decoration:", response.status, response.statusText);
			} else {
				// Check if this was the last task and re-show default tasks prompt
				const remainingDecorations = decorations.filter(d => d.id !== taskId);
				if (remainingDecorations.length === 0) {
					setShowDefaultTasks(true);
				}
			}
		} catch (error) {
			// If API failed, revert the optimistic update
			dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: taskToDelete }));
			console.error("Failed to delete decoration:", error);
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
			<div className="min-h-screen new-year-tasks-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading decorations...
					</p>
				</div>
			</div>
		);
	}

	const sortedTasks = sortTasks(decorations);
	const incompleteDecorations = sortedTasks.filter((task: any) => !task.isCompleted);
	const completedDecorations = sortedTasks.filter((task: any) => task.isCompleted);

	// FormModal fields configuration
	const formFields = [
		{
			id: "title",
			type: "text" as const,
			placeholder: "Decoration Task*",
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
		<div className="min-h-screen new-year-tasks-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="New Year's Decorations"
				backHref="/new-year"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort Decorations"
				description="Prepare your New Year's celebration decorations!"
				holidayColor="amber-600"
			/>

			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				{/* Default Tasks Prompt */}
				{showDefaultTasks && (
					<div className="card card-tasks rounded-lg p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700">
						<h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
							🎊 Set Up New Year's Decorations
						</h3>
						<p className="text-amber-700 dark:text-amber-300 text-sm mb-3">
							Would you like to add some common New Year's decoration tasks?
						</p>
						<div className="flex gap-2">
							<button
								onClick={addDefaultDecorationTasks}
								className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 transition-colors text-sm"
							>
								Add Default Decorations
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

				<AddButton title="Decoration Task" onClick={openForm} color="amber" />

				{/* Decoration Status Summary */}
				{decorations.length > 0 && (
					<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
						<h3 className="text-lg font-semibold mb-4">Decoration Status</h3>
						<div className="grid grid-cols-3 gap-4 text-center">
							<div>
								<div className="text-2xl font-bold text-amber-600">{decorations.length}</div>
								<div className="text-sm text-gray-600 dark:text-gray-400">Total Decorations</div>
							</div>
							<div>
								<div className="text-2xl font-bold text-green-600">{completedDecorations.length}</div>
								<div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
							</div>
							<div>
								<div className="text-2xl font-bold text-orange-600">{incompleteDecorations.length}</div>
								<div className="text-sm text-gray-600 dark:text-gray-400">Remaining</div>
							</div>
						</div>
					</div>
				)}

				<TaskSection
					title="Pending Decorations"
					items={incompleteDecorations}
					isCompleted={false}
					emptyMessage="No decorations planned yet."
					completedMessage="All decorations completed!"
					renderItem={(task: any) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleCompletion}
							onDelete={(taskId: string, taskTitle: string) => handleDelete(taskId, taskTitle)}
							onEdit={handleEditDecoration}
							theme={{
								accentColor: "#f59e0b", // Amber for New Year
							}}
							borderColor="rgb(245 158 11)" // Amber border for New Year
							disableInternalModal={true}
						/>
					)}
				/>

				<TaskSection
					title="Completed Decorations"
					items={completedDecorations}
					isCompleted={true}
					emptyMessage=""
					completedMessage=""
					renderItem={(task: any) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleCompletion}
							onDelete={(taskId: string, taskTitle: string) => handleDelete(taskId, taskTitle)}
							onEdit={handleEditDecoration}
							className="opacity-60"
							theme={{
								accentColor: "#f59e0b", // Amber for New Year
							}}
							borderColor="rgb(245 158 11)" // Amber border for New Year
							disableInternalModal={true}
						/>
					)}
				/>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showForm}
				title="Add New Decoration Task"
				fields={formFields}
				initialValues={{
					title: "",
					description: "",
					priority: "medium",
					...(isHolidayShared ? { assignedTo: "" } : {}),
					dueDate: "",
				}}
				onSubmit={handleAddDecoration}
				onClose={closeForm}
				loading={isAdding}
				submitText="Add Decoration"
				cardClassName="card-tasks"
			/>

			{/* Edit Modal */}
			<FormModal
				isOpen={showEditModal}
				title="Edit Decoration Task"
				fields={formFields}
				initialValues={editingTask ? {
					title: editingTask.title || "",
					description: editingTask.description || "",
					priority: editingTask.priority || "medium",
					...(isHolidayShared ? { assignedTo: editingTask.assignedTo || "" } : {}),
					dueDate: editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : "",
				} : {}}
				onSubmit={handleEditDecorationSubmit}
				onClose={closeEditModal}
				loading={isUpdating}
				submitText="Update Decoration"
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
				title="Sort Decorations"
			/>
		</div>
	);
}
