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
import { useMealPlanningMutations } from "@/hooks/useMealPlanningMutations";

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

export default function ThanksgivingMealPlanningPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);

	// Use the new meal planning mutations hook
	const {
		holidayId,
		auth0User,
		mealPlanning,
		loading,
		error,
		initialized,
		createMealPlanning,
		updateMealPlanning,
		editMealPlanning,
		deleteMealPlanning,
		createMealPlanningState,
		updateMealPlanningState,
		editMealPlanningState,
		deleteMealPlanningState,
	} = useMealPlanningMutations();

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

	useEffect(() => {
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch]);

	const handleAddTask = async (formValues: Record<string, any>) => {
		if (!formValues.title?.trim() || !holidayId || !auth0User) return;

		try {
			const payload = {
				title: formValues.title,
				description: formValues.description || undefined,
				priority: formValues.priority as "low" | "medium" | "high",
				assignedTo: formValues.assignedTo || undefined,
				category: "Meal Planning",
				dueDate: formValues.dueDate || undefined,
				isCompleted: false,
			};

			await createMealPlanning({ holidayId, payload, auth0User }).unwrap();
			setShowForm(false);
		} catch (error) {
			console.error("Error creating meal planning task:", error);
		}
	};

	const handleToggleTask = async (taskId: string) => {
		if (!holidayId || !auth0User) return;

		try {
			const task = mealPlanning.find((t: any) => t.id === taskId);
			if (task) {
				await updateMealPlanning({
					holidayId,
					taskId,
					isCompleted: !task.isCompleted,
					auth0User,
				}).unwrap();
			}
		} catch (error) {
			console.error("Error updating meal planning task:", error);
		}
	};

	const handleDeleteTask = (taskId: string) => {
		setDeleteConfirm({ show: true, taskId });
	};

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
	}

	const handleEditTask = (task: any) => {
		setEditingTask(task);
	};

	const handleSaveEdit = async (updatedTask: any) => {
		if (editingTask && holidayId && auth0User) {
			try {
				await editMealPlanning({
					holidayId,
					taskId: editingTask.id,
					payload: {
						title: updatedTask.title,
						description: updatedTask.description || undefined,
						priority: updatedTask.priority as "low" | "medium" | "high",
						assignedTo: updatedTask.assignedTo || undefined,
						category: "Meal Planning",
						dueDate: updatedTask.dueDate || undefined,
					},
					auth0User,
				}).unwrap();
				setEditingTask(null);
			} catch (error) {
				console.error("Error updating meal planning task:", error);
			}
		}
	};

	function handleCloseEdit() {
		setEditingTask(null);
	}

	const confirmDelete = async () => {
		if (deleteConfirm.taskId && holidayId && auth0User) {
			try {
				await deleteMealPlanning({
					holidayId,
					taskId: deleteConfirm.taskId,
					auth0User,
				}).unwrap();
				setDeleteConfirm({ show: false, taskId: null });
			} catch (error) {
				console.error("Error deleting meal planning task:", error);
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
			<div className="min-h-screen thanksgiving-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading meal planning...
					</p>
				</div>
			</div>
		);
	}

	const sortedTasks = sortTasks(mealPlanning);
	const incompleteTasks = sortedTasks.filter((task: any) => !task.isCompleted);
	const completedTasks = sortedTasks.filter((task: any) => task.isCompleted);

	return (
		<div className="min-h-screen thanksgiving-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="🍽️ Meal Planning"
				backHref="/thanksgiving"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort tasks"
				description="Keep track of your Thanksgiving meal planning!"
				holidayColor="amber-600"
				error={error ? "An error occurred" : undefined}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				<AddButton title="Task" onClick={openForm} holidayColor="amber" />
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
					emptyMessage="No meal planning tasks yet. Add your first task!"
					completedMessage="No meal planning tasks yet. Add your first task!"
					renderItem={(task: any) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleTask}
							onDelete={handleDeleteTask}
							onEdit={handleEditTask}
							theme={{
								accentColor: "#d97706", // Amber for Thanksgiving
							}}
							borderColor="rgb(var(--color-amber-500))" // Amber border for Thanksgiving
							disableInternalModal={true}
						/>
					)}
				/>

				<TaskSection
					title="Completed"
					items={completedTasks}
					isCompleted={true}
					emptyMessage="No completed meal planning tasks yet."
					completedMessage="No completed meal planning tasks yet."
					renderItem={(task: any) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleTask}
							onDelete={handleDeleteTask}
							onEdit={handleEditTask}
							className="opacity-60"
							theme={{
								accentColor: "#d97706", // Amber for Thanksgiving
							}}
							borderColor="rgb(var(--color-amber-500))" // Amber border for Thanksgiving
							disableInternalModal={true}
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
				loading={createMealPlanningState.isLoading}
				submitText={
					createMealPlanningState.isLoading ? "Adding..." : "Add Task"
				}
				cancelText="Cancel"
				cardClassName="card"
				submitButtonColor="#d97706"
			/>

			{/* Edit Task Modal */}
			<EditTaskModal
				isOpen={editingTask !== null}
				task={editingTask}
				onClose={handleCloseEdit}
				onSave={handleSaveEdit}
				loading={editMealPlanningState.isLoading}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={deleteConfirm.show}
				{...getDeleteConfig("tasks")}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={deleteMealPlanningState.isLoading}
				cardClassName="card"
				confirmText="Delete"
				cancelText="Cancel"
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
