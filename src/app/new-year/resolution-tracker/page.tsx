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

export default function NewYearResolutionTrackerPage() {
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

	// Redux data access - resolutions are stored as tasks with category "Resolutions"
	const holidayData = getHolidayDataFromRedux(resolvedHolidayId, currentState);
	const resolutions = holidayData?.tasks?.filter((task: any) => task.category === "Resolutions") || [];
	const isLoading = !homeInitialized;
	const error = null;

	// Debug logging to understand the state
	console.log('New Year Resolutions Debug:', {
		resolvedHolidayId,
		holidayData: holidayData ? { ...holidayData, tasks: holidayData.tasks?.length || 0 } : null,
		allTasks: holidayData?.tasks?.length || 0,
		resolutionTasks: resolutions.length,
		resolutions: resolutions.map(r => ({ id: r.id, title: r.title, category: r.category, isCompleted: r.isCompleted }))
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

	// Check if default resolution tasks exist
	useEffect(() => {
		if (resolutions.length === 0 && homeInitialized) {
			// Handle default tasks if needed
		}
	}, [resolutions, homeInitialized]);

	// CRUD Operations
	async function handleAddResolution(values: Record<string, any>) {
		if (!values.title?.trim()) return;
		if (!resolvedHolidayId || !auth0User) return;

		setIsAdding(true);
		
		const newTask = {
			id: `temp-${Date.now()}`, // Temporary ID for optimistic update
			title: values.title,
			description: values.description || undefined,
			priority: values.priority as "low" | "medium" | "high",
			assignedTo: values.assignedTo || undefined,
			category: "Resolutions",
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
				category: "Resolutions",
				due_date: values.dueDate || undefined, // snake_case for API
				isCompleted: false,
			};
			
			console.log('🐛 [NewYearResolutionsAdd] API payload:', apiPayload);
			
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
				console.error("Failed to add task:", response.status, response.statusText);
			}
			
			setShowForm(false);
		} catch (error) {
			// Remove optimistic update on error
			dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId: newTask.id }));
			console.error("Failed to add task:", error);
		} finally {
			setIsAdding(false);
		}
	}

	async function handleEditResolution(task: any) {
		if (!resolvedHolidayId || !auth0User) return;

		setEditingTask(task);
		setShowEditModal(true);
	}

	async function handleEditSubmit(values: Record<string, any>) {
		if (!editingTask || !resolvedHolidayId || !auth0User) return;

		setIsUpdating(true);
		try {
			// CRITICAL: Map camelCase to snake_case for API
			const apiPayload = {
				title: values.title,
				description: values.description || undefined,
				priority: values.priority as "low" | "medium" | "high",
				assigned_to: values.assignedTo || undefined, // snake_case for API
				category: "Resolutions",
				due_date: values.dueDate || undefined, // snake_case for API
			};

			console.log('🐛 [NewYearResolutionsEdit] API payload:', apiPayload);

			const response = await fetch(`/api/holidays/${resolvedHolidayId}/tasks/${editingTask.id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					"x-test-user": JSON.stringify(auth0User),
				},
				body: JSON.stringify(apiPayload),
			});

			if (response.ok) {
				const result = await response.json();
				dispatch(updateTaskInHomeData({ 
					holidayId: resolvedHolidayId, 
					taskId: editingTask.id, 
					updates: result 
				}));
				
				setShowEditModal(false);
				setEditingTask(null);
				await refreshHomeData();
			} else {
				console.error("Failed to update task:", response.status, response.statusText);
			}
		} catch (error) {
			console.error("Failed to update task:", error);
		} finally {
			setIsUpdating(false);
		}
	}

	async function handleDelete(taskId: string, taskTitle: string) {
		if (!resolvedHolidayId || !auth0User) return;

		if (window.confirm(`Are you sure you want to delete "${taskTitle}"?`)) {
			setIsDeleting(true);
			try {
				const response = await fetch(`/api/holidays/${resolvedHolidayId}/tasks/${taskId}`, {
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
						"x-test-user": JSON.stringify(auth0User),
					},
				});

				if (response.ok) {
					dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId }));
					await refreshHomeData();
				} else {
					console.error("Failed to delete task:", response.status, response.statusText);
				}
			} catch (error) {
				console.error("Failed to delete task:", error);
			} finally {
				setIsDeleting(false);
			}
		}
	}

	async function handleToggleCompletion(taskId: string) {
		if (!resolvedHolidayId || !auth0User) return;

		setIsToggling(true);
		try {
			// Find the current task to get its completion status
			const currentTask = resolutions.find((task: any) => task.id === taskId);
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

			// Call API directly
			const response = await fetch(`/api/holidays/${resolvedHolidayId}/tasks/${taskId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					"x-test-user": JSON.stringify(auth0User),
				},
				body: JSON.stringify({ isCompleted: newCompletionStatus }),
			});

			if (response.ok) {
				const result = await response.json();
				dispatch(updateTaskInHomeData({ 
					holidayId: resolvedHolidayId, 
					taskId, 
					updates: result 
				}));
				await refreshHomeData();
			} else {
				// Revert optimistic update on error
				dispatch(updateTaskInHomeData({ 
					holidayId: resolvedHolidayId, 
					taskId, 
					updates: { isCompleted: currentTask.isCompleted } 
				}));
				console.error("Failed to toggle task completion:", response.status, response.statusText);
			}
		} catch (error) {
			console.error("Failed to toggle task completion:", error);
		} finally {
			setIsToggling(false);
		}
	}

	const openAddForm = () => {
		setEditingTask(null);
		setShowForm(true);
	};

	const closeForm = () => {
		setShowForm(false);
		setEditingTask(null);
	};

	// Sorting function
	const getSortedResolutions = () => {
		const sorted = [...resolutions].sort((a: any, b: any) => {
			switch (sortBy) {
				case "priority":
					const priorityOrder: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
					return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
				case "dateDue":
					if (!a.dueDate && !b.dueDate) return 0;
					if (!a.dueDate) return 1;
					if (!b.dueDate) return -1;
					return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
				case "assignedTo":
					return (a.assignedTo || "").localeCompare(b.assignedTo || "");
				case "category":
					return (a.category || "").localeCompare(b.category || "");
				default:
					return a.title.localeCompare(b.title);
			}
		});
		return sorted;
	};

	const sortedResolutions = getSortedResolutions();
	const incompleteResolutions = sortedResolutions.filter((task: any) => !task.isCompleted);
	const completedResolutions = sortedResolutions.filter((task: any) => task.isCompleted);

	// Form fields configuration
	const formFields = [
		{
			id: "title",
			type: "text" as const,
			placeholder: "Resolution Goal*", 
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
			placeholder: "Target Date"
		},
	];

	return (
		<div className="min-h-screen new-year-cards-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Resolution Tracker"
				backHref="/new-year"
				onSortClick={() => setShowSortModal(true)}
				description="Track your New Year resolutions and goals!"
			holidayColor="orange-600"
			sortTitle="Sort Resolutions"
			error={error ? "API Error" : undefined}
		/>

		<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">			<AddButton
				title="Resolution"
				onClick={openAddForm}
				color="orange"
				disabled={isLoading || isAdding}				/>

				{/* Task Sections */}
				<TaskSection
					title="Pending Resolutions"
					items={incompleteResolutions}
					isCompleted={false}
					emptyMessage="No resolutions set yet."
					completedMessage="All resolutions achieved!"
					renderItem={(task: any) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleCompletion}
							onDelete={(taskId: string, taskTitle: string) => handleDelete(taskId, taskTitle)}
							onEdit={handleEditResolution}
							theme={{
								accentColor: "#f97316", // Orange for New Year celebration
							}}
							borderColor="rgb(249 115 22)" // Orange border for New Year
							disableInternalModal={true}
						/>
					)}
				/>

				<TaskSection
					title="Completed Resolutions"
					items={completedResolutions}
					isCompleted={true}
					emptyMessage="No resolutions completed yet."
					completedMessage="Great job achieving your resolutions!"
					renderItem={(task: any) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleCompletion}
							onDelete={(taskId: string, taskTitle: string) => handleDelete(taskId, taskTitle)}
							onEdit={handleEditResolution}
							theme={{
								accentColor: "#f97316", // Orange for New Year
							}}
							borderColor="rgb(249 115 22)" // Orange border
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
				onSortChange={setSortBy}
				sortOptions={[
					{ value: "none", label: "Default" },
					{ value: "priority", label: "Priority" },
					{ value: "dateDue", label: "Due Date" },
					{ value: "assignedTo", label: "Assigned To" },
				]}
				title="Sort Resolutions"
			/>

			{/* Add Form Modal */}
			<FormModal
				isOpen={showForm}
				title="Add New Resolution"
				fields={formFields}
				initialValues={{}}
				onSubmit={handleAddResolution}
				onClose={closeForm}
				loading={isAdding}
				submitText="Add Resolution"
				cancelText="Cancel"
				cardClassName="card-events-new-year"
			/>

			{/* Edit Form Modal */}
			<FormModal
				isOpen={showEditModal}
				title="Edit Resolution"
				fields={formFields}
				initialValues={editingTask ? {
					title: editingTask.title,
					description: editingTask.description || "",
					priority: editingTask.priority,
					assignedTo: editingTask.assignedTo || "",
					dueDate: editingTask.dueDate ? editingTask.dueDate.split('T')[0] : "", // CRITICAL: Format date for input
				} : {}}
				onSubmit={handleEditSubmit}
				onClose={() => { setShowEditModal(false); setEditingTask(null); }}
				loading={isUpdating}
				submitText="Update Resolution"
				cancelText="Cancel"
				cardClassName="card-events-new-year"
			/>

			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
