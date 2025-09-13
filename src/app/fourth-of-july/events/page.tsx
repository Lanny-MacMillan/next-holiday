"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	selectHolidayPreferences,
	selectHomeInitialized,
	selectHomeData,
} from "@/store/selectors/home";
import { getHolidayDataFromRedux } from "@/utils/holidayData";
import {
	updateTaskInHomeData,
	addTaskToHomeData,
	removeTaskFromHomeData,
} from "@/store/slices/homeSlice";
import { useFourthOfJulyTasksMutations } from "@/hooks/useFourthOfJulyTasksMutations";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import ToDoCard from "@/components/cards/to-do/ToDoCard";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import { EventItems } from "@/components/cards/event";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import SortModal from "@/components/modals/SortModal";

export default function FourthOfJulyEventsPage() {
	const dispatch = useAppDispatch();

	// Get current Redux state for skip logic
	const currentState = useAppSelector((state: any) => state);

	// Get home data and holiday data from Redux
	const homeData = useAppSelector(selectHomeData);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const holidayPreferences = useAppSelector(selectHolidayPreferences);

	const {
		holidayId,
		auth0User,
		createTask,
		updateTask,
		deleteTask,
		toggleTaskCompletion,
		createTaskState,
		updateTaskState,
		deleteTaskState,
		toggleTaskCompletionState,
	} = useFourthOfJulyTasksMutations();

	// Get holiday data from Redux
	const holidayData = getHolidayDataFromRedux(holidayId, currentState);

	// Helper function to update Redux state after task operations
	const updateTaskInRedux = (
		taskData: any,
		operation: "add" | "update" | "delete"
	) => {
		if (!holidayId) return;

		switch (operation) {
			case "add":
				dispatch(addTaskToHomeData({ holidayId, task: taskData }));
				break;
			case "update":
				dispatch(
					updateTaskInHomeData({
						holidayId,
						taskId: taskData.id,
						updates: taskData,
					})
				);
				break;
			case "delete":
				dispatch(
					removeTaskFromHomeData({
						holidayId,
						taskId: taskData.id,
					})
				);
				break;
		}
	};

	// Use only Redux data - no GET API calls on holiday pages
	// Events are stored in tasks with category "Events" for consistency with main page
	const allTasks = holidayData?.tasks || [];
	const tasks = allTasks.filter((task: any) => task.category === "Events");
	const loading = !homeInitialized;
	const error = null;
	const initialized = homeInitialized;

	// Filter tasks for Events category
	const getTasksByCategory = (category: string) => {
		return allTasks.filter((task: any) => task.category === category);
	};

	// Show message if holiday doesn't exist
	if (!holidayId) {
		return (
			<div className="min-h-screen fourth-of-july-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
				<HolidayPageHeader
					title="Fourth of July Events"
					backHref="/fourth-of-july"
					description="Keep track of your Fourth of July events!"
					holidayColor="bg-gradient-to-br from-red-400 to-red-600"
				/>
				<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
					<div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
						<h3 className="text-lg font-semibold text-red-800 mb-2">
							Fourth of July Holiday Not Set Up
						</h3>
						<p className="text-red-700 mb-4">
							To use Fourth of July features, you need to add Fourth of July to
							your holiday preferences first.
						</p>
						<p className="text-red-600 text-sm">
							Please go to your home page and add Fourth of July to your holiday
							list.
						</p>
					</div>
				</main>
			</div>
		);
	}

	// Filter tasks for Events category
	const eventTasks = getTasksByCategory("Events");

	const [showAddForm, setShowAddForm] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [taskToDelete, setTaskToDelete] = useState<any>(null);
	const [showSortModal, setShowSortModal] = useState(false);
	const [sortBy, setSortBy] = useState<string>("dateCreated");

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

	const sortedEventTasks = sortTasks(eventTasks, sortBy);

	const handleSubmit = async (values: Record<string, any>) => {
		if (editingTask) {
			const result = await updateTask({
				holidayId,
				taskId: editingTask.id,
				updates: {
					title: values.title || "",
					description: values.description || "",
					priority: values.priority || "medium",
					dueDate: values.dueDate || "",
					notes: values.notes || "",
				},
				auth0User,
			});

			// Update Redux state directly
			updateTaskInRedux({ id: editingTask.id, ...values }, "update");
			setEditingTask(null);
		} else {
			const result = await createTask({
				holidayId,
				payload: {
					...values,
					isCompleted: false,
					category: "Events",
					title: values.title || "",
					priority: values.priority || "medium",
				},
				auth0User,
			});

			// Update Redux state directly
			updateTaskInRedux(result, "add");
		}
		setShowAddForm(false);
	};

	const handleEdit = (task: any) => {
		setEditingTask(task);
		setShowAddForm(true);
	};

	const handleDelete = (taskId: string, taskTitle?: string) => {
		const task = tasks.find((t) => t.id === taskId);
		if (task) {
			setTaskToDelete(task);
			setShowDeleteModal(true);
		}
	};

	const confirmDelete = async () => {
		if (taskToDelete) {
			await deleteTask({
				holidayId,
				taskId: taskToDelete.id,
				auth0User,
			});

			// Update Redux state directly
			updateTaskInRedux({ id: taskToDelete.id }, "delete");
			setTaskToDelete(null);
		}
		setShowDeleteModal(false);
	};

	const handleToggleCompletion = async (taskId: string) => {
		const task = tasks.find((t) => t.id === taskId);
		if (task) {
			await toggleTaskCompletion({
				holidayId,
				taskId: task.id,
				isCompleted: !task.isCompleted,
				auth0User,
			});

			// Update Redux state directly
			updateTaskInRedux(
				{ id: taskId, isCompleted: !task.isCompleted },
				"update"
			);
		}
	};

	const handleSortChange = (sortOption: string) => {
		setSortBy(sortOption);
	};

	// Show loading only if home data is not initialized
	if (!homeInitialized) {
		return (
			<div className="min-h-screen fourth-of-july-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading events...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen fourth-of-july-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Fourth of July Events"
				backHref="/fourth-of-july"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort Events"
				description="Keep track of your Fourth of July events!"
				holidayColor="bg-gradient-to-br from-red-400 to-red-600"
				error={error ? "Failed to load events" : undefined}
			/>

			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<AddButton
					title="Event"
					onClick={() => setShowAddForm(true)}
					color="red"
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
							onEditTask={handleEdit}
							loading={loading || toggleTaskCompletionState.isLoading}
							themeColor="red"
							holidayColor="bg-gradient-to-br from-red-400 to-red-600"
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
							onEditTask={handleEdit}
							loading={loading || toggleTaskCompletionState.isLoading}
							themeColor="red"
							holidayColor="bg-gradient-to-br from-red-400 to-red-600"
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
				title={editingTask ? "Edit Event" : "Add New Event"}
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
					{ id: "dueDate", type: "date" as const, placeholder: "Due Date" },
					{
						id: "notes",
						type: "textarea" as const,
						placeholder: "Notes",
						rows: 2,
					},
				]}
				initialValues={
					editingTask
						? {
								title: editingTask.title,
								description: editingTask.description || "",
								priority: editingTask.priority,
								dueDate: editingTask.dueDate
									? editingTask.dueDate.split("T")[0]
									: "",
								notes: editingTask.notes || "",
						  }
						: { priority: "medium", category: "Events" }
				}
				onSubmit={handleSubmit}
				onClose={() => {
					setShowAddForm(false);
					setEditingTask(null);
				}}
				loading={
					editingTask ? updateTaskState.isLoading : createTaskState.isLoading
				}
				submitText={editingTask ? "Update Event" : "Add Event"}
				cardClassName="card-events-fourth-of-july"
				submitButtonColor="#dc2626"
			/>

			{/* Delete Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				title="Delete Event"
				itemName={taskToDelete?.title}
				onConfirm={confirmDelete}
				onCancel={() => {
					setShowDeleteModal(false);
					setTaskToDelete(null);
				}}
				loading={deleteTaskState.isLoading}
				cardClassName="card-events-fourth-of-july"
				confirmButtonColor="#dc2626"
			/>
		</div>
	);
}
