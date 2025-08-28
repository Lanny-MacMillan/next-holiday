"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useEventMutations } from "@/hooks/useEventMutations";
import SortModal from "@/components/modals/SortModal";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import AddButton from "@/components/common/AddButton";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import { EventItems } from "@/components/cards/event";
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";

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

	// Use the event mutations hook
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
		createEventState,
		updateEventState,
		editEventState,
		deleteEventState,
	} = useEventMutations();

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [showDefaultTasks, setShowDefaultTasks] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);
	const [taskToDelete, setTaskToDelete] = useState<any>(null);

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

	async function handleEditTask(values: Record<string, any>) {
		if (!values.title?.trim()) return;
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

			await editEvent({
				holidayId,
				taskId: editingTask.id,
				payload,
				auth0User,
			}).unwrap();
			setShowEditModal(false);
			setEditingTask(null);
		} catch (error) {
			console.error("Error editing event:", error);
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

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
	}

	function openEditModal(task: any) {
		setEditingTask(task);
		setShowEditModal(true);
	}

	function closeEditModal() {
		setShowEditModal(false);
		setEditingTask(null);
	}

	async function handleToggleTask(taskId: string) {
		if (!holidayId || !auth0User) return;

		try {
			const task = events.find((t: any) => t.id === taskId);
			if (task) {
				await updateEvent({
					holidayId,
					taskId,
					isCompleted: !task.isCompleted,
					auth0User,
				}).unwrap();
			}
		} catch (error) {
			console.error("Error updating event:", error);
		}
	}

	function handleDeleteTask(taskId: string, taskTitle: string) {
		const task = events.find((t: any) => t.id === taskId);
		setTaskToDelete(task);
		setShowDeleteModal(true);
	}

	async function confirmDelete() {
		if (taskToDelete) {
			try {
				await deleteEvent({
					holidayId: holidayId || "",
					taskId: taskToDelete.id,
					auth0User,
				}).unwrap();
				setShowDeleteModal(false);
				setTaskToDelete(null);
			} catch (error) {
				console.error("Error deleting event:", error);
			}
		}
	}

	function cancelDelete() {
		setShowDeleteModal(false);
		setTaskToDelete(null);
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
					(a, b) =>
						(priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
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

	// Sort events
	const sortedEvents = sortTasks(events);
	const incompleteTasks = sortedEvents.filter((task: any) => !task.isCompleted);
	const completedTasks = sortedEvents.filter((task: any) => task.isCompleted);

	// Get form configuration
	const formConfig = getFormConfig("tasks", "add");
	const editFormConfig = getFormConfig("tasks", "edit");
	const deleteConfig = getDeleteConfig("tasks");

	return (
		<div className="min-h-screen kwanzaa-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Kwanzaa Events"
				backHref="/kwanzaa"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort Events"
				error={error ? "API Error" : undefined}
				holidayColor="red-600"
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Default Tasks Prompt */}
				{showDefaultTasks && (
					<div className="card card-tasks rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
						<h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
							🎉 Set Up Kwanzaa Events
						</h3>
						<p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
							Would you like to add some common Kwanzaa event planning tasks?
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

				<AddButton title="Event Task" onClick={openForm} color="red" />
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

				<div>
					<h2 className="font-semibold text-gray-800 dark:text-white mb-2">
						Incomplete ({incompleteTasks.length})
					</h2>
					<div className="card card-tasks rounded shadow">
						{incompleteTasks.length === 0 ? (
							<div className="px-4 py-3 text-gray-400 dark:text-gray-500 text-center">
								All events planned! 🎉
							</div>
						) : (
							<ul className="divide-y divide-gray-200 dark:divide-gray-700">
								{incompleteTasks.map((task: any) => (
									<EventItems
										key={task.id}
										task={task}
										onToggleTask={handleToggleTask}
										onDeleteTask={handleDeleteTask}
										onEditTask={openEditModal}
										loading={loading}
										themeColor="red"
										holidayColor="bg-red-600"
									/>
								))}
							</ul>
						)}
					</div>
				</div>

				<div>
					<h2 className="font-semibold text-gray-400 dark:text-gray-500 mb-2">
						Completed ({completedTasks.length})
					</h2>
					<div className="card card-tasks rounded shadow">
						{completedTasks.length === 0 ? (
							<div className="px-4 py-3 text-gray-300 dark:text-gray-600 text-center">
								No completed tasks yet.
							</div>
						) : (
							<ul className="divide-y divide-gray-200 dark:divide-gray-700">
								{completedTasks.map((task: any) => (
									<EventItems
										key={task.id}
										task={task}
										onToggleTask={handleToggleTask}
										onDeleteTask={handleDeleteTask}
										onEditTask={openEditModal}
										loading={loading}
										themeColor="red"
										holidayColor="bg-red-600"
									/>
								))}
							</ul>
						)}
					</div>
				</div>
			</main>

			{/* Add Form Modal */}
			<FormModal
				isOpen={showForm}
				title={formConfig.title}
				fields={formConfig.fields}
				initialValues={{}}
				onSubmit={handleAddTask}
				onClose={closeForm}
				loading={createEventState.isLoading}
				submitText={formConfig.submitText}
				cancelText={formConfig.cancelText}
				cardClassName={formConfig.cardClassName}
				submitButtonColor={formConfig.submitButtonColor}
			/>

			{/* Edit Form Modal */}
			<FormModal
				isOpen={showEditModal}
				title={editFormConfig.title}
				fields={editFormConfig.fields}
				initialValues={{
					title: editingTask?.title || "",
					description: editingTask?.description || "",
					priority: editingTask?.priority || "medium",
					assignedTo: editingTask?.assignedTo || "",
					dueDate: editingTask?.dueDate || "",
				}}
				onSubmit={handleEditTask}
				onClose={closeEditModal}
				loading={editEventState.isLoading}
				submitText={editFormConfig.submitText}
				cancelText={editFormConfig.cancelText}
				cardClassName={editFormConfig.cardClassName}
				submitButtonColor={editFormConfig.submitButtonColor}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				title={deleteConfig.title}
				message={deleteConfig.message}
				itemName={taskToDelete?.title}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={deleteEventState.isLoading}
				cardClassName={deleteConfig.cardClassName}
				confirmText={deleteConfig.confirmText}
				cancelText={deleteConfig.cancelText}
				confirmButtonColor={deleteConfig.confirmButtonColor}
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
