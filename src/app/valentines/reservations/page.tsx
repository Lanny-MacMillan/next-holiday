"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts } from "@/store/slices/addressBookSlice";
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
import {
	ReservationCard,
	ReservationsTracker,
} from "@/components/cards/reservation";
import DeleteModal from "@/components/modals/DeleteModal";
import FormModal from "@/components/modals/FormModal";
import SortModal from "@/components/modals/SortModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import { useReservationsMutations } from "@/hooks/useReservationsMutations";

export default function ValentinesReservationsPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);

	// Use the new reservations mutations hook
	const {
		holidayId,
		auth0User,
		reservations,
		loading,
		error,
		initialized,
		createReservations,
		updateReservations,
		editReservations,
		deleteReservations,
		updateReservationsState,
		editReservationsState,
		deleteReservationsState,
	} = useReservationsMutations();

	// Get current Redux state for skip logic
	const currentState = useAppSelector((state: any) => state);

	// Get home data and holiday data from Redux
	const homeData = useAppSelector(selectHomeData);
	const homeInitialized = useAppSelector(selectHomeInitialized);
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

	const [showAddForm, setShowAddForm] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [taskToDelete, setTaskToDelete] = useState<any>(null);
	const [showSortModal, setShowSortModal] = useState(false);
	const [sortBy, setSortBy] = useState<string>("dateCreated");
	const [showEditModal, setShowEditModal] = useState(false);

	// Sort options for reservations
	const sortOptions = [
		{ value: "dateCreated", label: "Date Created" },
		{ value: "title", label: "Title A-Z" },
		{ value: "priority", label: "Priority" },
		{ value: "dueDate", label: "Due Date" },
	];

	// Sort function
	const sortTasks = (tasks: any[], sortOption: string) => {
		switch (sortOption) {
			case "title":
				return [...tasks].sort((a, b) => a.title.localeCompare(b.title));
			case "priority":
				const priorityOrder = { high: 3, medium: 2, low: 1 };
				return [...tasks].sort(
					(a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
				);
			case "dueDate":
				return [...tasks].sort((a, b) => {
					if (!a.dueDate && !b.dueDate) return 0;
					if (!a.dueDate) return 1;
					if (!b.dueDate) return -1;
					return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
				});
			case "dateCreated":
			default:
				return [...tasks].sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
		}
	};

	// Use only Redux data - no fallback to API calls
	const displayReservations =
		holidayData && homeInitialized && holidayData.tasks
			? holidayData.tasks.filter(
					(task: any) => task.category === "Reservations"
			  )
			: [];

	const sortedReservations = sortTasks(displayReservations, sortBy);

	useEffect(() => {
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch]);

	async function handleFormSubmit(values: Record<string, any>) {
		if (!values.title?.trim()) return;
		if (!holidayId || !auth0User) return;

		try {
			if (editingTask) {
				const result = await editReservations({
					holidayId,
					taskId: editingTask.id,
					payload: {
						title: values.title,
						description: values.description || undefined,
						priority: values.priority as "low" | "medium" | "high",
						assignedTo: values.assignedTo || undefined,
						category: "Reservations",
						dueDate: values.dueDate || undefined,
					},
					auth0User,
				}).unwrap();

				// Update Redux state directly
				updateTaskInRedux(result, "update");
				setEditingTask(null);
			} else {
				const payload = {
					title: values.title,
					description: values.description || undefined,
					priority: values.priority as "low" | "medium" | "high",
					assignedTo: values.assignedTo || undefined,
					category: "Reservations",
					dueDate: values.dueDate || undefined,
					isCompleted: false,
				};
				const result = await createReservations({
					holidayId,
					payload,
					auth0User,
				}).unwrap();

				// Update Redux state directly
				updateTaskInRedux(result, "add");
			}
			setShowAddForm(false);
		} catch (error) {
			console.error("Error handling reservation:", error);
		}
	}

	const handleEdit = (task: any) => {
		setEditingTask(task);
		setShowAddForm(true);
	};

	const handleDelete = (task: any) => {
		setTaskToDelete(task);
		setShowDeleteModal(true);
	};

	const confirmDelete = async () => {
		if (taskToDelete && holidayId && auth0User) {
			try {
				await deleteReservations({
					holidayId,
					taskId: taskToDelete.id,
					auth0User,
				}).unwrap();

				// Update Redux state directly
				updateTaskInRedux({ id: taskToDelete.id }, "delete");
				setTaskToDelete(null);
			} catch (error) {
				console.error("Error deleting reservation:", error);
			}
		}
		setShowDeleteModal(false);
	};

	const handleToggleCompletion = async (taskId: string) => {
		if (!holidayId || !auth0User) return;

		try {
			const reservation = displayReservations.find((r: any) => r.id === taskId);
			if (reservation) {
				await updateReservations({
					holidayId,
					taskId,
					isCompleted: !reservation.isCompleted,
					auth0User,
				}).unwrap();

				// Update Redux state directly
				updateTaskInRedux(
					{ id: taskId, isCompleted: !reservation.isCompleted },
					"update"
				);
			}
		} catch (error) {
			console.error("Error updating reservation:", error);
		}
	};

	const handleEditTask = (task: any) => {
		setEditingTask(task);
		setShowEditModal(true);
	};

	async function handleEditTaskSubmit(values: Record<string, any>) {
		if (!editingTask || !holidayId || !auth0User) return;

		try {
			const result = await editReservations({
				holidayId,
				taskId: editingTask.id,
				payload: {
					title: values.title,
					description: values.description || undefined,
					priority: values.priority as "low" | "medium" | "high",
					assignedTo: values.assignedTo || undefined,
					category: "Reservations",
					dueDate: values.dueDate || undefined,
				},
				auth0User,
			}).unwrap();

			// Update Redux state directly
			updateTaskInRedux(result, "update");
			setShowEditModal(false);
			setEditingTask(null);
		} catch (error) {
			console.error("Error editing reservation:", error);
		}
	}

	function closeEditModal() {
		setShowEditModal(false);
		setEditingTask(null);
	}

	const handleSortChange = (sortOption: string) => {
		setSortBy(sortOption);
	};

	// Form fields for the FormModal
	const formFields = [
		{
			id: "title",
			type: "text" as const,
			label: "Reservation Name",
			placeholder: "Enter reservation name",
			required: true,
		},
		{
			id: "description",
			type: "textarea" as const,
			label: "Description",
			placeholder: "Enter description",
			rows: 2,
		},
		{
			id: "priority",
			type: "select" as const,
			label: "Priority",
			options: [
				{ value: "low", label: "Low" },
				{ value: "medium", label: "Medium" },
				{ value: "high", label: "High" },
			],
		},
		{
			id: "dueDate",
			type: "date" as const,
			label: "Due Date",
		},
		{
			id: "notes",
			type: "textarea" as const,
			label: "Notes",
			placeholder: "Additional notes",
			rows: 2,
		},
	];

	return (
		<div className="min-h-screen valentines-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Reservations"
				backHref="/valentines"
				error={undefined}
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort Reservations"
				description="Keep track of your reservations!"
				holidayColor="pink-500"
			/>

			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Summary Stats */}
				<ReservationsTracker
					tasks={displayReservations}
					title="Reservations Tracker"
				/>

				<AddButton
					title="Reservation"
					onClick={() => setShowAddForm(true)}
					color="pink"
					disabled={loading}
				/>

				{/* Add/Edit Task Form Modal */}
				<FormModal
					isOpen={showAddForm}
					title={editingTask ? "Edit Reservation" : "Add New Reservation"}
					fields={formFields}
					onSubmit={handleFormSubmit}
					onClose={() => {
						setShowAddForm(false);
						setEditingTask(null);
					}}
					submitText={editingTask ? "Update Reservation" : "Add Reservation"}
					submitButtonColor="#ec4899"
					cardClassName="card card-valentines"
					initialValues={editingTask || {}}
				/>

				{/* Edit Task Form Modal */}
				<FormModal
					isOpen={showEditModal}
					title="Edit Reservation"
					fields={formFields}
					onSubmit={handleEditTaskSubmit}
					onClose={closeEditModal}
					submitText="Update Reservation"
					submitButtonColor="#ec4899"
					cardClassName="card card-valentines"
					initialValues={editingTask || {}}
				/>

				{/* Task List */}
				{!homeInitialized ? (
					<div className="text-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
						<p className="text-gray-600 dark:text-gray-400 mt-2">
							Loading reservations...
						</p>
					</div>
				) : displayReservations.length === 0 ? (
					<div className="text-center py-8">
						<p className="text-gray-600 dark:text-gray-400">
							No reservations added yet.
						</p>
						<button
							onClick={() => setShowAddForm(true)}
							className="mt-2 text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
						>
							Add your first reservation
						</button>
					</div>
				) : (
					<div className="space-y-6">
						<TaskSection
							title="Pending Reservations"
							items={sortedReservations.filter((task) => !task.isCompleted)}
							isCompleted={false}
							emptyMessage="No pending reservations"
							completedMessage=""
							renderItem={(task) => (
								<li key={task.id} className="p-4">
									<ReservationCard
										id={task.id}
										title={task.title}
										description={task.description}
										dueDate={task.dueDate}
										priority={task.priority}
										isCompleted={task.isCompleted}
										notes={task.notes}
										onToggleCompletion={handleToggleCompletion}
										onDelete={handleDelete}
										onEdit={handleEditTask}
									/>
								</li>
							)}
						/>

						<TaskSection
							title="Confirmed Reservations"
							items={sortedReservations.filter((task) => task.isCompleted)}
							isCompleted={true}
							emptyMessage="No confirmed reservations"
							completedMessage="No reservations confirmed!"
							renderItem={(task) => (
								<li key={task.id} className="p-4">
									<ReservationCard
										id={task.id}
										title={task.title}
										description={task.description}
										dueDate={task.dueDate}
										priority={task.priority}
										isCompleted={task.isCompleted}
										notes={task.notes}
										onToggleCompletion={handleToggleCompletion}
										onDelete={handleDelete}
										onEdit={handleEditTask}
									/>
								</li>
							)}
						/>
					</div>
				)}
			</main>

			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>

			{/* Delete Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				title="Delete Reservation"
				message="This action cannot be undone."
				onConfirm={confirmDelete}
				onCancel={() => {
					setShowDeleteModal(false);
					setTaskToDelete(null);
				}}
				confirmText="Delete"
				cancelText="Cancel"
				confirmButtonColor="#ef4444"
				cardClassName="card card-valentines"
			/>

			{/* Sort Modal */}
			<SortModal
				isOpen={showSortModal}
				onClose={() => setShowSortModal(false)}
				sortBy={sortBy}
				onSortChange={handleSortChange}
				sortOptions={sortOptions}
				title="Sort Reservations"
			/>
		</div>
	);
}
