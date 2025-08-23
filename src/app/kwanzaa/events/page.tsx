"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import SortModal from "@/components/modals/SortModal";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import TaskSection from "@/components/common/TaskSection";
import { EventItems } from "@/components/cards/event";
import AddButton from "@/components/common/AddButton";
import { useEventMutations } from "@/hooks/useEventMutations";

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

const defaultEventTasks = [
	{
		title: "Kwanzaa Karamu Feast Planning",
		description: "Plan the traditional Kwanzaa feast celebration",
		category: "Events",
		priority: "high" as const,
	},
	{
		title: "Kinara Lighting Ceremony Setup",
		description: "Prepare for daily kinara candle lighting ceremonies",
		category: "Events",
		priority: "high" as const,
	},
	{
		title: "Zawadi Gift Exchange Planning",
		description: "Organize handmade gift exchange activities",
		category: "Events",
		priority: "medium" as const,
	},
	{
		title: "African Drum and Dance Workshop",
		description: "Plan traditional music and dance activities",
		category: "Events",
		priority: "medium" as const,
	},
	{
		title: "Storytelling and Poetry Reading",
		description: "Prepare for Kuumba (Creativity) day activities",
		category: "Events",
		priority: "medium" as const,
	},
	{
		title: "Community Service Planning",
		description: "Organize Ujima (Collective Work) activities",
		category: "Events",
		priority: "high" as const,
	},
	{
		title: "Family Heritage Workshop",
		description: "Plan genealogy and heritage activities",
		category: "Events",
		priority: "medium" as const,
	},
	{
		title: "Unity Cup Ceremony Preparation",
		description: "Set up Kikombe cha Umoja ceremony space",
		category: "Events",
		priority: "high" as const,
	},
	{
		title: "African Art & Craft Workshop",
		description: "Prepare materials for traditional crafts",
		category: "Events",
		priority: "low" as const,
	},
	{
		title: "Vision Board Workshop",
		description: "Plan Nia (Purpose) day goal-setting activities",
		category: "Events",
		priority: "low" as const,
	},
];

export default function KwanzaaEventsPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);

	// Use the new event mutations hook
	const {
		holidayId,
		auth0User,
		events,
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

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		taskId: string | null;
	}>({
		show: false,
		taskId: null,
	});
	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [showDefaultTasks, setShowDefaultTasks] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);

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

	async function handleAddTask(values: Record<string, any>) {
		if (!values.title?.trim()) return;
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

			await createEvent({ holidayId, payload, auth0User }).unwrap();
			setShowForm(false);
		} catch (error) {
			console.error("Error creating event:", error);
		}
	}

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

	async function handleToggleTask(taskId: string) {
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
			}
		} catch (error) {
			console.error("Error updating event:", error);
		}
	}

	function handleDeleteTask(taskId: string) {
		setDeleteConfirm({ show: true, taskId });
	}

	async function confirmDelete() {
		if (deleteConfirm.taskId && holidayId && auth0User) {
			try {
				await deleteEvent({
					holidayId,
					taskId: deleteConfirm.taskId,
					auth0User,
				}).unwrap();
				setDeleteConfirm({ show: false, taskId: null });
			} catch (error) {
				console.error("Error deleting event:", error);
			}
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, taskId: null });
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

	if (loading && !initialized) {
		return (
			<div className="min-h-screen kwanzaa-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading events...</p>
				</div>
			</div>
		);
	}

	const sortedTasks = sortTasks(events);
	const incompleteTasks = sortedTasks.filter((task: any) => !task.isCompleted);
	const completedTasks = sortedTasks.filter((task: any) => task.isCompleted);

	const handleEditTask = (task: any) => {
		setEditingTask(task);
		setShowEditModal(true);
	};

	async function handleEditTaskSubmit(values: Record<string, any>) {
		if (!editingTask || !holidayId || !auth0User) return;

		try {
			await editEvent({
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

	const renderEventItem = (task: any) => (
		<EventItems
			key={task.id}
			task={task}
			onToggleTask={handleToggleTask}
			onDeleteTask={handleDeleteTask}
			onEditTask={handleEditTask}
			loading={loading || updateEventState.isLoading}
			themeColor="red"
			holidayColor="bg-gradient-to-br from-red-400 to-red-600"
		/>
	);

	return (
		<div className="min-h-screen kwanzaa-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Kwanzaa Events"
				backHref="/kwanzaa"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort tasks"
				error={error ? "API Error" : undefined}
			/>

			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Default Tasks Prompt */}
				{showDefaultTasks && (
					<div className="card card-tasks rounded-lg p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
						<h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
							🎉 Set Up Kwanzaa Events
						</h3>
						<p className="text-red-700 dark:text-red-300 text-sm mb-3">
							Would you like to add some common Kwanzaa event planning tasks?
						</p>
						<div className="flex gap-2">
							<button
								onClick={addDefaultEventTasks}
								className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors text-sm"
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

				<AddButton
					title="Event Task"
					onClick={() => setShowForm(true)}
					color="red"
					disabled={loading}
				/>

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
					renderItem={renderEventItem}
					cardClassName="card-events-kwanzaa"
				/>

				<TaskSection
					title="Completed"
					items={completedTasks}
					isCompleted={true}
					emptyMessage=""
					completedMessage="No completed tasks yet."
					renderItem={renderEventItem}
					cardClassName="card-events-kwanzaa"
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
				onClose={() => setShowForm(false)}
				loading={loading}
				submitText="Add Task"
				cardClassName="card-events-kwanzaa"
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
				loading={editEventState.isLoading}
				submitText="Update Task"
				cardClassName="card-events-kwanzaa"
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={deleteConfirm.show}
				onCancel={cancelDelete}
				onConfirm={confirmDelete}
				loading={deleteEventState.isLoading}
				cardClassName="card-events-kwanzaa"
				title="Confirm Delete"
				message="Are you sure you want to delete this task? This action cannot be undone."
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
