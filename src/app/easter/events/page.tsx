"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import ToDoCard from "@/components/cards/to-do/ToDoCard";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import { EventItems } from "@/components/cards/event";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import SortModal from "@/components/modals/SortModal";
import { useEventMutations } from "@/hooks/useEventMutations";
import {
	selectHolidayPreferences,
	selectHomeInitialized,
	selectHomeData,
	updateEventInHomeData,
	addEventToHomeData,
	removeEventFromHomeData,
} from "@/store/slices/homeSlice";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";
import { getHolidayDataFromRedux } from "@/utils/holidayData";

export default function EasterEventsPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);

	// Get Redux selectors
	const holidayPreferences = useAppSelector(selectHolidayPreferences);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const homeData = useAppSelector(selectHomeData);

	// Get current Redux state for skip logic
	const currentState = useAppSelector((state: any) => state);

	// Get holiday ID for Easter - try to resolve from home data, fallback to route-based resolution
	const resolvedHolidayId = homeInitialized
		? getHolidayIdFromRoute("/easter", holidayPreferences)
		: getHolidayIdFromRoute("/easter", holidayPreferences); // Allow fallback for cold entry

	// Get holiday data from Redux if available
	const holidayData = getHolidayDataFromRedux(resolvedHolidayId, currentState);

	// Use Redux data first, fallback to RTK Query if needed
	const events = holidayData?.events || [];

	// Use the new event mutations hook
	const {
		holidayId,
		auth0User,
		events: fallbackEvents,
		loading,
		error,
		initialized,
		createEvent,
		updateEvent,
		editEvent,
		deleteEvent,
		updateEventState,
		editEventState,
		deleteEventState,
	} = useEventMutations();

	// Use Redux data if available, otherwise use fallback from RTK Query
	const finalEvents = events.length > 0 ? events : fallbackEvents;

	// Helper function to update Redux state after event operations
	const updateEventInRedux = (
		eventData: any,
		operation: "add" | "update" | "delete"
	) => {
		if (!resolvedHolidayId) return;

		switch (operation) {
			case "add":
				dispatch(
					addEventToHomeData({ holidayId: resolvedHolidayId, event: eventData })
				);
				break;
			case "update":
				dispatch(
					updateEventInHomeData({
						holidayId: resolvedHolidayId,
						eventId: eventData.id,
						updates: eventData,
					})
				);
				break;
			case "delete":
				dispatch(
					removeEventFromHomeData({
						holidayId: resolvedHolidayId,
						eventId: eventData.id,
					})
				);
				break;
		}
	};

	const [showAddForm, setShowAddForm] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [taskToDelete, setTaskToDelete] = useState<any>(null);
	const [showSortModal, setShowSortModal] = useState(false);
	const [sortBy, setSortBy] = useState<string>("dateCreated");
	const [showEditModal, setShowEditModal] = useState(false);

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
			case "dateCreated":
			default:
				return sortedTasks.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
		}
	};

	const sortedEventTasks = sortTasks(finalEvents, sortBy);

	useEffect(() => {
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch]);

	const handleSubmit = async (values: Record<string, any>) => {
		if (!resolvedHolidayId || !auth0User) return;

		try {
			if (editingTask) {
				const updatedEvent = await editEvent({
					holidayId: resolvedHolidayId,
					taskId: editingTask.id,
					payload: {
						title: values.title,
						description: values.description || undefined,
						priority: values.priority as "low" | "medium" | "high",
						assignedTo: values.assignedTo || undefined,
						category: "Events",
						dueDate: values.dueDate || undefined,
					},
					auth0User,
				}).unwrap();

				// Update Redux state immediately
				updateEventInRedux(updatedEvent, "update");

				setEditingTask(null);
			} else {
				const payload = {
					title: values.title,
					description: values.description || undefined,
					priority: values.priority as "low" | "medium" | "high",
					assignedTo: values.assignedTo || undefined,
					category: "Events",
					dueDate: values.dueDate || undefined,
					isCompleted: false,
				};
				const newEvent = await createEvent({
					holidayId: resolvedHolidayId,
					payload,
					auth0User,
				}).unwrap();

				// Update Redux state immediately
				updateEventInRedux(newEvent, "add");
			}
			setShowAddForm(false);
		} catch (error) {
			console.error("Error handling event:", error);
		}
	};

	const handleEdit = (task: any) => {
		setEditingTask(task);
		setShowAddForm(true);
	};

	const handleDelete = (task: any) => {
		setTaskToDelete(task);
		setShowDeleteModal(true);
	};

	const confirmDelete = async () => {
		if (taskToDelete && resolvedHolidayId && auth0User) {
			try {
				await deleteEvent({
					holidayId: resolvedHolidayId,
					taskId: taskToDelete.id,
					auth0User,
				}).unwrap();

				// Update Redux state immediately
				updateEventInRedux(taskToDelete, "delete");

				setTaskToDelete(null);
			} catch (error) {
				console.error("Error deleting event:", error);
			}
		}
		setShowDeleteModal(false);
	};

	const handleToggleCompletion = async (taskId: string) => {
		if (!resolvedHolidayId || !auth0User) return;

		try {
			const event = finalEvents.find((e: any) => e.id === taskId);
			if (event) {
				await updateEvent({
					holidayId: resolvedHolidayId,
					taskId,
					isCompleted: !event.isCompleted,
					auth0User,
				}).unwrap();

				// Update Redux state immediately
				updateEventInRedux(
					{ ...event, isCompleted: !event.isCompleted },
					"update"
				);
			}
		} catch (error) {
			console.error("Error updating event:", error);
		}
	};

	const handleEditTask = (task: any) => {
		setEditingTask(task);
		setShowEditModal(true);
	};

	async function handleEditTaskSubmit(values: Record<string, any>) {
		if (!editingTask || !resolvedHolidayId || !auth0User) return;

		try {
			const updatedEvent = await editEvent({
				holidayId: resolvedHolidayId,
				taskId: editingTask.id,
				payload: {
					title: values.title,
					description: values.description || undefined,
					priority: values.priority as "low" | "medium" | "high",
					assignedTo: values.assignedTo || undefined,
					category: "Events",
					dueDate: values.dueDate || undefined,
				},
				auth0User,
			}).unwrap();

			// Update Redux state immediately
			updateEventInRedux(updatedEvent, "update");

			setShowEditModal(false);
			setEditingTask(null);
		} catch (error) {
			console.error("Error editing event:", error);
		}
	}

	function closeEditModal() {
		setShowEditModal(false);
		setEditingTask(null);
	}

	const handleSortChange = (sortOption: string) => {
		setSortBy(sortOption);
	};

	return (
		<div className="min-h-screen easter-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Easter Events"
				backHref="/easter"
				error={error ? "API Error" : undefined}
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort Events"
			/>

			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<AddButton
					title="Event"
					onClick={() => setShowAddForm(true)}
					color="purple"
				/>

				<TaskSection
					title="Incomplete"
					items={sortedEventTasks.filter((task) => !task.isCompleted)}
					isCompleted={false}
					emptyMessage="All events completed! 🎉"
					completedMessage=""
					renderItem={(task) => (
						<EventItems
							key={task.id}
							task={task}
							onToggleTask={handleToggleCompletion}
							onDeleteTask={handleDelete}
							onEditTask={handleEditTask}
							loading={loading}
							themeColor="green"
							holidayColor="bg-gradient-to-br from-purple-300 to-purple-500"
						/>
					)}
				/>

				<TaskSection
					title="Completed"
					items={sortedEventTasks.filter((task) => task.isCompleted)}
					isCompleted={true}
					emptyMessage="No completed events yet."
					completedMessage="No completed events yet."
					renderItem={(task) => (
						<EventItems
							key={task.id}
							task={task}
							onToggleTask={handleToggleCompletion}
							onDeleteTask={handleDelete}
							onEditTask={handleEditTask}
							loading={loading || updateEventState.isLoading}
							themeColor="green"
							holidayColor="bg-gradient-to-br from-purple-300 to-purple-500"
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
				title="Sort Events"
			/>

			{/* Form Modal */}
			<FormModal
				isOpen={showAddForm}
				title="Add New Event"
				fields={[
					{
						id: "title",
						type: "text" as const,
						placeholder: "Event Title*",
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
				onClose={() => {
					setShowAddForm(false);
				}}
				loading={loading}
				submitText="Add Event"
				cardClassName="card-events-easter"
			/>

			{/* Edit Modal */}
			<FormModal
				isOpen={showEditModal}
				title="Edit Event"
				fields={[
					{
						id: "title",
						type: "text" as const,
						placeholder: "Event Title*",
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
				initialValues={{
					title: editingTask?.title || "",
					description: editingTask?.description || "",
					priority: editingTask?.priority || "medium",
					assignedTo: editingTask?.assignedTo || "",
					dueDate: editingTask?.dueDate || "",
				}}
				onSubmit={handleEditTaskSubmit}
				onClose={closeEditModal}
				loading={editEventState.isLoading}
				submitText="Update Event"
				cardClassName="card-events-easter"
			/>

			{/* Delete Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				onConfirm={confirmDelete}
				onCancel={() => {
					setShowDeleteModal(false);
					setTaskToDelete(null);
				}}
				loading={deleteEventState.isLoading}
				cardClassName="card-events-easter"
				title="Delete Event"
				message="Are you sure you want to delete this event? This action cannot be undone."
			/>
		</div>
	);
}
