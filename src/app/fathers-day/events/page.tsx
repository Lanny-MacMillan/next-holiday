"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import {
	selectHolidayPreferences,
	selectHomeInitialized,
	selectHomeData,
} from "@/store/selectors/home";
import { getHolidayDataFromRedux } from "@/utils/holidayData";
import {
	updateEventInHomeData,
	addEventToHomeData,
	removeEventFromHomeData,
} from "@/store/slices/homeSlice";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import ToDoCard from "@/components/cards/to-do/ToDoCard";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import { EventItems } from "@/components/cards/event";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import SortModal from "@/components/modals/SortModal";
import { useEventMutations } from "@/hooks/useEventMutations";

export default function FathersDayEventsPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);

	// Use the new event mutations hook
	const {
		holidayId,
		auth0User,
		createEvent,
		updateEvent,
		editEvent,
		deleteEvent,
		updateEventState,
		editEventState,
		deleteEventState,
	} = useEventMutations();

	// Get current Redux state for skip logic
	const currentState = useAppSelector((state: any) => state);

	// Get home data and holiday data from Redux
	const homeData = useAppSelector(selectHomeData);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const holidayData = getHolidayDataFromRedux(holidayId, currentState);

	// Helper function to update Redux state after event operations
	const updateEventInRedux = (
		eventData: any,
		operation: "add" | "update" | "delete"
	) => {
		if (!holidayId) return;

		switch (operation) {
			case "add":
				dispatch(addEventToHomeData({ holidayId, event: eventData }));
				break;
			case "update":
				dispatch(
					updateEventInHomeData({
						holidayId,
						eventId: eventData.id,
						updates: eventData,
					})
				);
				break;
			case "delete":
				dispatch(
					removeEventFromHomeData({
						holidayId,
						eventId: eventData.id,
					})
				);
				break;
		}
	};

	// Use only Redux data - no GET API calls on holiday pages
	const events =
		holidayData && homeInitialized && holidayData.events
			? holidayData.events
			: [];

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

	const sortedEventTasks = sortTasks(events, sortBy);

	useEffect(() => {
		// Fetch contacts for address book functionality
		// Only fetch if home data is initialized (which contains contacts)
		if (homeInitialized) {
			dispatch(fetchContacts());
		}
	}, [dispatch, homeInitialized]);

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

			// Update Redux state directly
			updateEventInRedux(result, "add");

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
		if (!editingTask || !holidayId || !auth0User) return;

		try {
			const result = await editEvent({
				holidayId,
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

			// Update Redux state directly
			updateEventInRedux(result, "update");

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

	const handleDelete = (taskId: string) => {
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

				// Update Redux state directly
				updateEventInRedux({ id: taskToDelete.id }, "delete");

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

				// Update Redux state directly
				updateEventInRedux(
					{ id: taskId, isCompleted: !event.isCompleted },
					"update"
				);
			}
		} catch (error) {
			console.error("Error updating event:", error);
		}
	};

	const handleSortChange = (sortOption: string) => {
		setSortBy(sortOption);
	};

	return (
		<div className="min-h-screen fathers-day-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Father's Day Events"
				backHref="/fathers-day"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort Events"
				description="Keep track of your Father's Day events!"
				holidayColor="blue-500"
				error={undefined}
			/>

			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<AddButton
					title="Event"
					onClick={() => setShowAddForm(true)}
					color="blue"
				/>

				<TaskSection
					title="Incomplete"
					items={sortedEventTasks.filter((task) => !task.isCompleted)}
					isCompleted={false}
					emptyMessage="All events completed! 🎉"
					completedMessage=""
					renderItem={(task) => (
						<EventItems
							
							task={task}
							onToggleTask={handleToggleCompletion}
							onDeleteTask={handleDelete}
							onEditTask={handleEditTask}
							loading={updateEventState.isLoading}
							themeColor="blue"
							holidayColor="bg-gradient-to-br from-blue-300 to-blue-500"
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
							
							task={task}
							onToggleTask={handleToggleCompletion}
							onDeleteTask={handleDelete}
							onEditTask={handleEditTask}
							loading={updateEventState.isLoading}
							themeColor="blue"
							holidayColor="bg-gradient-to-br from-blue-300 to-blue-500"
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
				loading={false}
				submitText="Add Event"
				cardClassName="card-events-fathers-day"
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
				cardClassName="card-events-fathers-day"
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
				cardClassName="card-events-fathers-day"
				title="Delete Event"
				message="Are you sure you want to delete this event? This action cannot be undone."
			/>
		</div>
	);
}
