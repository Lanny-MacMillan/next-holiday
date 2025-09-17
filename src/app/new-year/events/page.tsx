"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import {
	selectHolidayPreferences,
	selectHomeInitialized,
	selectHomeData,
} from "@/store/selectors/home";
import {
	addEventToHomeData,
	removeEventFromHomeData,
	updateEventInHomeData,
} from "@/store/slices/homeSlice";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";
import { getHolidayDataFromRedux } from "@/utils/holidayData";
import {
	useCreateEventMutation,
	useUpdateEventMutation,
	useEditEventMutation,
	useDeleteEventMutation,
} from "@/store/api";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import ToDoCard from "@/components/cards/to-do/ToDoCard";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import { EventItems } from "@/components/cards/event";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import SortModal from "@/components/modals/SortModal";
import { useAuth0 } from "@auth0/auth0-react";

const defaultEventTasks = [
	{
		title: "New Year's Eve Party Planning",
		description: "Plan the main New Year's Eve celebration",
		category: "Events",
		priority: "high" as const,
	},
	{
		title: "Countdown to Midnight Setup",
		description: "Prepare countdown display and midnight celebration",
		category: "Events",
		priority: "high" as const,
	},
	{
		title: "Champagne Toast Preparation",
		description: "Get champagne and prepare toast glasses",
		category: "Events",
		priority: "medium" as const,
	},
	{
		title: "New Year's Day Brunch Planning",
		description: "Plan New Year's Day brunch or breakfast",
		category: "Events",
		priority: "medium" as const,
	},
	{
		title: "Fireworks Display Planning",
		description: "Organize fireworks or sparklers for celebration",
		category: "Events",
		priority: "low" as const,
	},
	{
		title: "New Year's Resolution Party",
		description: "Plan a gathering to share and discuss resolutions",
		category: "Events",
		priority: "medium" as const,
	},
];

export default function NewYearEventsPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);
	const { user: auth0User } = useAuth0();

	// Get Redux data
	const holidayPreferences = useAppSelector(selectHolidayPreferences);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const homeData = useAppSelector(selectHomeData);

	// Get holiday ID for New Year
	const holidayId = homeInitialized
		? getHolidayIdFromRoute("/new-year", holidayPreferences)
		: null;

	// Get current Redux state for holiday data
	const currentState = useAppSelector((state: any) => state);
	const holidayData = getHolidayDataFromRedux(holidayId, currentState);

	// Get events from Redux data
	const events = holidayData?.events || [];

	// Debug logging
	useEffect(() => {
		console.log("=== Events Debug ===");
		console.log("holidayId:", holidayId);
		console.log("holidayData:", holidayData);
		console.log("holidayData?.events:", holidayData?.events);
		console.log("events:", events);
		console.log("=== End Events Debug ===");
	}, [holidayId, holidayData, events]);

	// Get mutations for CRUD operations
	const [createEvent, createEventState] = useCreateEventMutation();
	const [updateEvent, updateEventState] = useUpdateEventMutation();
	const [editEvent, editEventState] = useEditEventMutation();
	const [deleteEvent, deleteEventState] = useDeleteEventMutation();

	// Loading and error states
	const loading =
		createEventState.isLoading ||
		updateEventState.isLoading ||
		editEventState.isLoading ||
		deleteEventState.isLoading;
	const error =
		createEventState.error ||
		updateEventState.error ||
		editEventState.error ||
		deleteEventState.error;
	const initialized = homeInitialized;

	const [showAddForm, setShowAddForm] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [taskToDelete, setTaskToDelete] = useState<any>(null);
	const [showSortModal, setShowSortModal] = useState(false);
	const [sortBy, setSortBy] = useState<string>("dateCreated");
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDefaultTasks, setShowDefaultTasks] = useState(false);

	// Sort options for events
	const sortOptions = [
		{ value: "dateCreated", label: "Date Created" },
		{ value: "title", label: "Title A-Z" },
		{ value: "priority", label: "Priority" },
		{ value: "dueDate", label: "Due Date" },
	];

	// Sort function
	const sortTasks = (tasks: any[], sortOption: string) => {
		const sortedTasks = [...tasks];
		switch (sortOption) {
			case "title":
				return sortedTasks.sort((a, b) => a.title.localeCompare(b.title));
			case "priority":
				const priorityOrder: { [key: string]: number } = {
					high: 3,
					medium: 2,
					low: 1,
				};
				return sortedTasks.sort(
					(a, b) =>
						(priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
				);
			case "dueDate":
				return sortedTasks.sort((a, b) => {
					if (!a.dueDate && !b.dueDate) return 0;
					if (!a.dueDate) return 1;
					if (!b.dueDate) return -1;
					return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
				});
			case "dateCreated":
			default:
				return sortedTasks.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
		}
	};

	const sortedEventTasks = sortTasks(events, sortBy);

	useEffect(() => {
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch]);

	// Check if default event tasks exist
	useEffect(() => {
		if (events.length === 0 && initialized) {
			setShowDefaultTasks(true);
		}
	}, [events, initialized]);

	async function addDefaultEventTasks() {
		if (!holidayId || !auth0User) return;

		try {
			for (const task of defaultEventTasks) {
				const payload = {
					title: task.title,
					description: task.description,
					priority: task.priority,
					assignedTo: undefined,
					category: task.category,
					dueDate: undefined,
					isCompleted: false,
				};
				await createEvent({ holidayId, payload, auth0User }).unwrap();
			}
			setShowDefaultTasks(false);
		} catch (error) {
			console.error("Error adding default event tasks:", error);
		}
	}

	const handleSubmit = async (values: Record<string, any>) => {
		if (!holidayId || !auth0User) return;

		try {
			const payload = {
				title: values.title,
				description: values.description || undefined,
				priority: values.priority as "low" | "medium" | "high",
				assignedTo: values.assignedTo || undefined,
				category: "Events",
				dueDate: values.dueDate || undefined,
				isCompleted: false,
			};
			const result = await createEvent({
				holidayId,
				payload,
				auth0User,
			}).unwrap();

			// Add to Redux store immediately with a normalized shape
			const normalizedEvent = {
				id:
					(result as any)?.id ||
					(result as any)?._id ||
					(result as any)?.eventId,
				...payload,
				isCompleted: false,
				createdAt: (result as any)?.createdAt || new Date().toISOString(),
				updatedAt: (result as any)?.updatedAt || new Date().toISOString(),
			};

			dispatch(
				addEventToHomeData({
					holidayId,
					event: normalizedEvent,
				})
			);

			setShowAddForm(false);
		} catch (error) {
			console.error("Error handling event:", error);
		}
	};

	const handleEditTask = (task: any) => {
		setEditingTask(task);
		setShowEditModal(true);
	};

	async function handleEditTaskSubmit(values: Record<string, any>) {
		if (!holidayId || !auth0User || !editingTask) return;

		try {
			const payload = {
				title: values.title,
				description: values.description || undefined,
				priority: values.priority as "low" | "medium" | "high",
				assignedTo: values.assignedTo || undefined,
				category: "Events",
				dueDate: values.dueDate || undefined,
			};
			const result = await editEvent({
				holidayId,
				taskId: editingTask.id,
				payload,
				auth0User,
			}).unwrap();

			// Update Redux store immediately
			dispatch(
				updateEventInHomeData({
					holidayId,
					eventId: editingTask.id,
					updates: result,
				})
			);

			setEditingTask(null);
			setShowEditModal(false);
		} catch (error) {
			console.error("Error updating event:", error);
		}
	}

	const handleDelete = (taskId: string, taskTitle: string) => {
		const task = events.find((e: any) => e.id === taskId);
		if (task) {
			setTaskToDelete(task);
			setShowDeleteModal(true);
		}
	};

	const confirmDelete = async () => {
		if (taskToDelete && holidayId && auth0User) {
			try {
				await deleteEvent({
					holidayId,
					taskId: taskToDelete.id,
					auth0User,
				}).unwrap();

				// Remove from Redux store immediately
				dispatch(
					removeEventFromHomeData({
						holidayId,
						eventId: taskToDelete.id,
					})
				);

				setTaskToDelete(null);
			} catch (error) {
				console.error("Error deleting event:", error);
			}
		}
		setShowDeleteModal(false);
	};

	const handleToggleCompletion = async (taskId: string) => {
		if (!holidayId || !auth0User) return;

		try {
			const event = events.find((e: any) => e.id === taskId);
			if (event) {
				await updateEvent({
					holidayId,
					taskId,
					isCompleted: !event.isCompleted,
					auth0User,
				}).unwrap();

				// Update Redux store immediately
				dispatch(
					updateEventInHomeData({
						holidayId,
						eventId: taskId,
						updates: {
							isCompleted: !event.isCompleted,
							completedDate: !event.isCompleted
								? new Date().toISOString()
								: null,
						},
					})
				);
			}
		} catch (error) {
			console.error("Error updating event:", error);
		}
	};

	const handleSortChange = (sortOption: string) => {
		setSortBy(sortOption);
		setShowSortModal(false);
	};

	// Loading state
	if (!initialized) {
		return (
			<div className="min-h-screen new-year-cards-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
				<HolidayPageHeader
					title="Events"
					description="Plan your New Year events and celebrations"
					backHref="/new-year"
				/>
				<div className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
					<div className="text-center py-8">
						<div className="text-6xl mb-4">⏳</div>
						<h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
							Loading Events...
						</h3>
						<p className="text-gray-600 dark:text-gray-400">
							Please wait while we load your New Year events.
						</p>
					</div>
				</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="min-h-screen new-year-cards-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
				<HolidayPageHeader
					title="Events"
					description="Plan your New Year events and celebrations"
					backHref="/new-year"
				/>
				<div className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
					<div className="text-center py-8">
						<div className="text-6xl mb-4">❌</div>
						<h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
							Error Loading Events
						</h3>
						<p className="text-gray-600 dark:text-gray-400">
							{typeof error === "string"
								? error
								: "An error occurred while loading events"}
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen new-year-cards-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Events"
				description="Plan your New Year events and celebrations"
				backHref="/new-year"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort tasks"
				holidayColor="amber-600"
				error={error ? "API Error" : undefined}
			/>

			<main className="w-full max-w-4xl flex flex-col gap-6 mt-4">
				{/* Add Button */}

				<AddButton
					title="Event Task"
					onClick={() => setShowAddForm(true)}
					color="amber"
					disabled={loading}
				/>

				{/* Events Section */}
				<TaskSection
					title="Incomplete"
					items={sortedEventTasks.filter((task) => !task.isCompleted)}
					isCompleted={false}
					emptyMessage={
						showDefaultTasks
							? "No events yet. Click 'Add Sample Events' to get started!"
							: "All events completed! 🎉"
					}
					completedMessage=""
					renderItem={(task) => (
						<EventItems
							task={task}
							onToggleTask={handleToggleCompletion}
							onDeleteTask={handleDelete}
							onEditTask={handleEditTask}
							loading={loading}
							themeColor="amber"
							holidayColor="bg-gradient-to-br from-amber-400 to-yellow-500"
						/>
					)}
				/>

				{/* Default Tasks Button */}
				{showDefaultTasks && sortedEventTasks.length === 0 && (
					<div className="text-center py-8">
						<div className="text-6xl mb-4">🎊</div>
						<h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
							No Events Yet
						</h3>
						<p className="text-gray-600 dark:text-gray-400 mb-4">
							Start planning your New Year celebrations by adding your first
							event task!
						</p>
						<button
							onClick={addDefaultEventTasks}
							className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
							disabled={loading || createEventState.isLoading}
						>
							{loading || createEventState.isLoading
								? "Adding..."
								: "Add Sample Events"}
						</button>
					</div>
				)}

				<TaskSection
					title="Completed"
					items={sortedEventTasks.filter((task) => task.isCompleted)}
					isCompleted={true}
					emptyMessage="No completed events yet."
					completedMessage="No completed events yet."
					renderItem={(task) => (
						<EventItems
							task={task}
							onToggleTask={handleToggleCompletion}
							onDeleteTask={handleDelete}
							onEditTask={handleEditTask}
							loading={loading}
							themeColor="amber"
							holidayColor="bg-gradient-to-br from-amber-400 to-yellow-500"
						/>
					)}
				/>
			</main>

			{/* Add Form Modal */}
			{console.log("showAddForm state:", showAddForm)}
			<FormModal
				isOpen={showAddForm}
				title="Add New Event Task"
				fields={[
					{
						id: "title",
						type: "text" as const,
						placeholder: "Event Task Title*",
						required: true,
					},
					{
						id: "description",
						type: "textarea" as const,
						placeholder: "Description",
						rows: 3,
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
					{
						id: "assignedTo",
						type: "text" as const,
						placeholder: "Assigned To",
					},
					{ id: "dueDate", type: "date" as const, placeholder: "Due Date" },
				]}
				initialValues={{ priority: "medium" }}
				onSubmit={handleSubmit}
				onClose={() => setShowAddForm(false)}
				loading={loading || createEventState.isLoading}
				submitText={createEventState.isLoading ? "Adding..." : "Add Event Task"}
			/>

			{/* Edit Form Modal */}
			<FormModal
				isOpen={showEditModal}
				title="Edit Event Task"
				fields={[
					{
						id: "title",
						type: "text" as const,
						placeholder: "Event Task Title*",
						required: true,
					},
					{
						id: "description",
						type: "textarea" as const,
						placeholder: "Description",
						rows: 3,
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
					{
						id: "assignedTo",
						type: "text" as const,
						placeholder: "Assigned To",
					},
					{ id: "dueDate", type: "date" as const, placeholder: "Due Date" },
				]}
				initialValues={editingTask}
				onSubmit={handleEditTaskSubmit}
				onClose={() => {
					setShowEditModal(false);
					setEditingTask(null);
				}}
				loading={editEventState.isLoading}
				submitText={
					editEventState.isLoading ? "Updating..." : "Update Event Task"
				}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				title="Delete Event Task"
				itemName={taskToDelete?.title}
				onConfirm={confirmDelete}
				onCancel={() => setShowDeleteModal(false)}
				loading={deleteEventState.isLoading}
			/>

			{/* Sort Modal */}
			<SortModal
				isOpen={showSortModal}
				onClose={() => setShowSortModal(false)}
				sortBy={sortBy}
				onSortChange={handleSortChange}
				sortOptions={sortOptions}
				title="Sort Events"
			/>
		</div>
	);
}
