"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchValentinesTasks,
	addValentinesTask,
	updateValentinesTask,
	deleteValentinesTask,
	toggleValentinesTaskCompletion,
} from "@/store/slices/valentines/valentinesTasksSlice";
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

export default function ValentinesReservationsPage() {
	const dispatch = useAppDispatch();
	const [isAddingTask, setIsAddingTask] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [sortBy, setSortBy] = useState("title");
	const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

	const allTasks = useAppSelector((state) => state.valentinesTasks.tasks);
	const loading = useAppSelector((state) => state.valentinesTasks.loading);

	// Filter tasks for Reservations category
	const tasks = allTasks.filter((task) => task.category === "Reservations");

	useEffect(() => {
		dispatch(fetchValentinesTasks());
	}, [dispatch]);

	const handleToggleCompletion = async (taskId: string) => {
		await dispatch(toggleValentinesTaskCompletion(taskId));
	};

	const handleDeleteTask = async (taskId: string) => {
		setTaskToDelete(taskId);
		setIsDeleteModalOpen(true);
	};

	const confirmDelete = async () => {
		if (taskToDelete) {
			await dispatch(deleteValentinesTask(taskToDelete));
			setIsDeleteModalOpen(false);
			setTaskToDelete(null);
		}
	};

	// Sort tasks based on current sortBy value
	const sortedTasks = [...tasks].sort((a, b) => {
		switch (sortBy) {
			case "title":
				return a.title.localeCompare(b.title);
			case "priority":
				const priorityOrder = { high: 3, medium: 2, low: 1 };
				return priorityOrder[b.priority] - priorityOrder[a.priority];
			case "dueDate":
				if (!a.dueDate && !b.dueDate) return 0;
				if (!a.dueDate) return 1;
				if (!b.dueDate) return -1;
				return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
			case "completed":
				return a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1;
			default:
				return 0;
		}
	});

	const completedTasks = sortedTasks.filter((task) => task.isCompleted);
	const incompleteTasks = sortedTasks.filter((task) => !task.isCompleted);

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

	const handleFormSubmit = async (values: Record<string, any>) => {
		await dispatch(
			addValentinesTask({
				title: values.title || "",
				description: values.description || "",
				priority: values.priority || "medium",
				category: "Reservations" as const,
				dueDate: values.dueDate || "",
				notes: values.notes || "",
				isCompleted: false,
			})
		);
		setIsAddingTask(false);
	};

	return (
		<div className="min-h-screen valentines-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Reservations"
				backHref="/valentines"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort Cards"
				description="Keep track of your reservations!"
				holidayColor="pink-500"
			/>

			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Summary Stats */}
				<ReservationsTracker tasks={tasks} title="Reservations Tracker" />

				<AddButton
					title="Reservation"
					onClick={() => setIsAddingTask(true)}
					color="pink"
					disabled={loading}
				/>

				{/* Add Task Form Modal */}
				<FormModal
					isOpen={isAddingTask}
					title="Add New Reservation"
					fields={formFields}
					onSubmit={handleFormSubmit}
					onClose={() => setIsAddingTask(false)}
					submitText="Add Reservation"
					submitButtonColor="#ec4899"
					cardClassName="card card-valentines"
				/>

				{/* Task List */}
				{loading ? (
					<div className="text-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
						<p className="text-gray-600 dark:text-gray-400 mt-2">
							Loading reservations...
						</p>
					</div>
				) : tasks.length === 0 ? (
					<div className="text-center py-8">
						<p className="text-gray-600 dark:text-gray-400">
							No reservations added yet.
						</p>
						<button
							onClick={() => setIsAddingTask(true)}
							className="mt-2 text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
						>
							Add your first reservation
						</button>
					</div>
				) : (
					<div className="space-y-6">
						<TaskSection
							title="Pending Reservations"
							items={incompleteTasks}
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
										onDelete={handleDeleteTask}
									/>
								</li>
							)}
						/>

						<TaskSection
							title="Confirmed Reservations"
							items={completedTasks}
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
										onDelete={handleDeleteTask}
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
				isOpen={isDeleteModalOpen}
				title="Delete Reservation"
				message="Are you sure you want to delete this reservation? This action cannot be undone."
				onConfirm={confirmDelete}
				onCancel={() => {
					setIsDeleteModalOpen(false);
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
				onSortChange={setSortBy}
				sortOptions={[
					{ value: "title", label: "Title" },
					{ value: "priority", label: "Priority" },
					{ value: "dueDate", label: "Due Date" },
					{ value: "completed", label: "Completion Status" },
				]}
				title="Sort Reservations"
			/>
		</div>
	);
}
