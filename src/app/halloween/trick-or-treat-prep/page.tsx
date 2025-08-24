"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import SortModal from "@/components/modals/SortModal";
import ToDoCard from "@/components/cards/to-do/ToDoCard";
import EditTaskModal from "@/components/modals/EditTaskModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";
import { useTrickOrTreatPrepMutations } from "@/hooks/useTrickOrTreatPrepMutations";

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

const defaultTrickOrTreatTasks = [
	{
		title: "Buy Halloween Candy",
		description: "Stock up on candy for trick-or-treaters",
		category: "Trick-or-Treat Prep",
		priority: "high" as const,
	},
	{
		title: "Prepare Trick-or-Treat Route",
		description: "Plan route for trick-or-treating",
		category: "Trick-or-Treat Prep",
		priority: "medium" as const,
	},
	{
		title: "Buy Glow Sticks",
		description: "For safety during trick-or-treating",
		category: "Trick-or-Treat Prep",
		priority: "medium" as const,
	},
	{
		title: "Check Flashlights",
		description: "Ensure flashlights work for evening trick-or-treating",
		category: "Trick-or-Treat Prep",
		priority: "low" as const,
	},
];

export default function HalloweenTrickOrTreatPrepPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);

	// Use the new trick or treat prep mutations hook
	const {
		holidayId,
		auth0User,
		trickOrTreatPrep,
		loading,
		error,
		initialized,
		createTrickOrTreatPrep,
		updateTrickOrTreatPrep,
		editTrickOrTreatPrep,
		deleteTrickOrTreatPrep,
		createTrickOrTreatPrepState,
		updateTrickOrTreatPrepState,
		editTrickOrTreatPrepState,
		deleteTrickOrTreatPrepState,
	} = useTrickOrTreatPrepMutations();

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		taskId: string | null;
	}>({
		show: false,
		taskId: null,
	});
	const [showDefaultTasks, setShowDefaultTasks] = useState(false);

	useEffect(() => {
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch]);

	useEffect(() => {
		if (trickOrTreatPrep.length === 0 && initialized) {
			setShowDefaultTasks(true);
		}
	}, [trickOrTreatPrep, initialized]);

	const handleAddTask = async (formValues: Record<string, any>) => {
		if (!formValues.title?.trim() || !holidayId || !auth0User) return;

		try {
			const payload = {
				title: formValues.title,
				description: formValues.description || undefined,
				priority: formValues.priority as "low" | "medium" | "high",
				assignedTo: formValues.assignedTo || undefined,
				category: "Trick or Treat Prep",
				dueDate: formValues.dueDate || undefined,
				isCompleted: false,
			};

			await createTrickOrTreatPrep({ holidayId, payload, auth0User }).unwrap();
			setShowForm(false);
		} catch (error) {
			console.error("Error creating trick or treat prep task:", error);
		}
	};

	const addDefaultTrickOrTreatTasks = async () => {
		if (!holidayId || !auth0User) return;

		try {
			for (const task of defaultTrickOrTreatTasks) {
				const payload = {
					...task,
					category: "Trick or Treat Prep",
					isCompleted: false,
				};
				await createTrickOrTreatPrep({
					holidayId,
					payload,
					auth0User,
				}).unwrap();
			}
			setShowDefaultTasks(false);
		} catch (error) {
			console.error("Error adding default trick or treat prep tasks:", error);
		}
	};

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
	}

	const handleToggleTask = async (taskId: string) => {
		if (!holidayId || !auth0User) return;

		try {
			const task = trickOrTreatPrep.find((t: any) => t.id === taskId);
			if (task) {
				await updateTrickOrTreatPrep({
					holidayId,
					taskId,
					isCompleted: !task.isCompleted,
					auth0User,
				}).unwrap();
			}
		} catch (error) {
			console.error("Error updating trick or treat prep task:", error);
		}
	};

	function handleDeleteTask(taskId: string) {
		setDeleteConfirm({ show: true, taskId });
	}

	const handleEditTask = (task: any) => {
		setEditingTask(task);
	};

	const handleSaveEdit = async (updatedTask: any) => {
		if (editingTask && holidayId && auth0User) {
			try {
				await editTrickOrTreatPrep({
					holidayId,
					taskId: editingTask.id,
					payload: {
						title: updatedTask.title,
						description: updatedTask.description || undefined,
						priority: updatedTask.priority as "low" | "medium" | "high",
						assignedTo: updatedTask.assignedTo || undefined,
						category: "Trick or Treat Prep",
						dueDate: updatedTask.dueDate || undefined,
					},
					auth0User,
				}).unwrap();
				setEditingTask(null);
			} catch (error) {
				console.error("Error updating trick or treat prep task:", error);
			}
		}
	};

	function handleCloseEdit() {
		setEditingTask(null);
	}

	const confirmDelete = async () => {
		if (deleteConfirm.taskId && holidayId && auth0User) {
			try {
				await deleteTrickOrTreatPrep({
					holidayId,
					taskId: deleteConfirm.taskId,
					auth0User,
				}).unwrap();
				setDeleteConfirm({ show: false, taskId: null });
			} catch (error) {
				console.error("Error deleting trick or treat prep task:", error);
			}
		}
	};

	function cancelDelete() {
		setDeleteConfirm({ show: false, taskId: null });
	}

	function sortTasks(tasksToSort: any[]): any[] {
		switch (sortBy) {
			case "priority":
				return [...tasksToSort].sort((a, b) => {
					const priorityOrder = { high: 3, medium: 2, low: 1 };
					return priorityOrder[b.priority] - priorityOrder[a.priority];
				});
			case "dateDue":
				return [...tasksToSort].sort((a, b) => {
					if (!a.dueDate && !b.dueDate) return 0;
					if (!a.dueDate) return 1;
					if (!b.dueDate) return -1;
					return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
				});
			case "assignedTo":
				return [...tasksToSort].sort((a, b) => {
					if (!a.assignedTo && !b.assignedTo) return 0;
					if (!a.assignedTo) return 1;
					if (!b.assignedTo) return -1;
					return a.assignedTo.localeCompare(b.assignedTo);
				});
			case "category":
				return [...tasksToSort].sort((a, b) => {
					if (!a.category && !b.category) return 0;
					if (!a.category) return 1;
					if (!b.category) return -1;
					return a.category.localeCompare(b.category);
				});
			default:
				return tasksToSort;
		}
	}

	if (loading && !initialized) {
		return (
			<div className="min-h-screen halloween-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading tasks...</p>
				</div>
			</div>
		);
	}

	const sortedTasks = sortTasks(trickOrTreatPrep);
	const incompleteTasks = sortedTasks.filter((task: any) => !task.isCompleted);
	const completedTasks = sortedTasks.filter((task: any) => task.isCompleted);

	return (
		<div className="min-h-screen halloween-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Trick-or-Treat Prep"
				backHref="/halloween"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort tasks"
				description="Keep track of trick-or-treat prep tasks!"
				holidayColor="orange-500"
				error={error ? "An error occurred" : undefined}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Default Tasks Modal */}
				{showDefaultTasks && (
					<div className="card rounded-lg p-6 mb-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700">
						<h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
							🎃 Welcome to Halloween Planning!
						</h3>
						<p className="text-gray-600 dark:text-gray-400 mb-4">
							Let's get you started with some essential trick-or-treat prep
							tasks.
						</p>
						<button
							onClick={addDefaultTrickOrTreatTasks}
							className="bg-orange-500 hover:bg-orange-600 border border-orange-700 text-orange-700 px-4 py-2 rounded-lg transition-colors"
						>
							Add Default Tasks
						</button>
					</div>
				)}

				<AddButton title="Task" onClick={openForm} holidayColor="orange" />

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
					emptyMessage="No trick-or-treat prep tasks yet. Add your first task!"
					completedMessage="No trick-or-treat prep tasks yet. Add your first task!"
					renderItem={(task: any) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleTask}
							onDelete={handleDeleteTask}
							onEdit={handleEditTask}
							theme={{
								accentColor: "#f97316", // Orange for Halloween
							}}
							borderColor="rgb(var(--color-orange-500))" // Orange border for Halloween
						/>
					)}
				/>

				<TaskSection
					title="Completed"
					items={completedTasks}
					isCompleted={true}
					emptyMessage="No completed trick-or-treat prep tasks yet."
					completedMessage="No completed trick-or-treat prep tasks yet."
					renderItem={(task: any) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleTask}
							onDelete={handleDeleteTask}
							onEdit={handleEditTask}
							className="opacity-60"
							theme={{
								accentColor: "#f97316", // Orange for Halloween
							}}
							borderColor="rgb(var(--color-orange-500))" // Orange border for Halloween
						/>
					)}
				/>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showForm}
				title="Add New Task"
				fields={getFormConfig("tasks", "add").fields}
				onSubmit={handleAddTask}
				onClose={closeForm}
				loading={createTrickOrTreatPrepState.isLoading}
				submitText={
					createTrickOrTreatPrepState.isLoading ? "Adding..." : "Add Task"
				}
				cancelText="Cancel"
				cardClassName="card card-tasks"
				submitButtonColor="#f97316"
			/>

			{/* Edit Task Modal */}
			<EditTaskModal
				isOpen={editingTask !== null}
				task={editingTask}
				onClose={handleCloseEdit}
				onSave={handleSaveEdit}
				loading={editTrickOrTreatPrepState.isLoading}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={deleteConfirm.show}
				{...getDeleteConfig("tasks")}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={deleteTrickOrTreatPrepState.isLoading}
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
