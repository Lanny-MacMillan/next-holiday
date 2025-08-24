"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import ToDoCard from "@/components/cards/to-do/ToDoCard";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import SortModal from "@/components/modals/SortModal";
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";
import { usePartyPlanningMutations } from "@/hooks/usePartyPlanningMutations";

export default function BirthdayPartyPlanningPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);

	// Use the new party planning mutations hook
	const {
		holidayId,
		auth0User,
		partyPlanning,
		loading,
		error,
		initialized,
		createPartyPlanning,
		updatePartyPlanning,
		editPartyPlanning,
		deletePartyPlanning,
		createPartyPlanningState,
		updatePartyPlanningState,
		editPartyPlanningState,
		deletePartyPlanningState,
	} = usePartyPlanningMutations();

	const [showAddForm, setShowAddForm] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [taskToDelete, setTaskToDelete] = useState<any>(null);
	const [showSortModal, setShowSortModal] = useState(false);
	const [sortBy, setSortBy] = useState<string>("priority");

	// Sort options for party planning
	const sortOptions = [
		{ value: "priority", label: "Priority" },
		{ value: "title", label: "Title A-Z" },
		{ value: "dueDate", label: "Due Date" },
		{ value: "assignedTo", label: "Assigned To" },
		{ value: "category", label: "Category" },
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
			case "assignedTo":
				return sortedTasks.sort((a, b) => {
					if (!a.assignedTo && !b.assignedTo) return 0;
					if (!a.assignedTo) return 1;
					if (!b.assignedTo) return -1;
					return a.assignedTo.localeCompare(b.assignedTo);
				});
			case "category":
				return sortedTasks.sort((a, b) => {
					if (!a.category && !b.category) return 0;
					if (!a.category) return 1;
					if (!b.category) return -1;
					return a.category.localeCompare(b.category);
				});
			default:
				return sortedTasks;
		}
	};

	const sortedPartyPlanningTasks = sortTasks(partyPlanning, sortBy);

	useEffect(() => {
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch]);

	const handleSubmit = async (values: Record<string, any>) => {
		if (!holidayId || !auth0User) return;

		try {
			if (editingTask) {
				await editPartyPlanning({
					holidayId,
					taskId: editingTask.id,
					payload: {
						title: values.title,
						description: values.description || undefined,
						priority: values.priority as "low" | "medium" | "high",
						assignedTo: values.assignedTo || undefined,
						category: "Party Planning",
						dueDate: values.dueDate || undefined,
					},
					auth0User,
				}).unwrap();
				setEditingTask(null);
			} else {
				const payload = {
					title: values.title,
					description: values.description || undefined,
					priority: values.priority as "low" | "medium" | "high",
					assignedTo: values.assignedTo || undefined,
					category: "Party Planning",
					dueDate: values.dueDate || undefined,
					isCompleted: false,
				};
				await createPartyPlanning({ holidayId, payload, auth0User }).unwrap();
			}
			setShowAddForm(false);
		} catch (error) {
			console.error("Error saving party planning task:", error);
		}
	};

	const handleEdit = (task: any) => {
		setEditingTask(task);
		setShowAddForm(true);
	};

	const handleDelete = (taskOrId: any) => {
		// Handle both task object and task ID
		const task =
			typeof taskOrId === "string"
				? partyPlanning.find((t) => t.id === taskOrId)
				: taskOrId;

		if (task) {
			setTaskToDelete(task);
			setShowDeleteModal(true);
		}
	};

	const confirmDelete = async () => {
		if (taskToDelete && holidayId && auth0User) {
			try {
				await deletePartyPlanning({
					holidayId,
					taskId: taskToDelete.id,
					auth0User,
				}).unwrap();
				setTaskToDelete(null);
			} catch (error) {
				console.error("Error deleting party planning task:", error);
			}
		}
		setShowDeleteModal(false);
	};

	const handleToggleCompletion = async (taskId: string) => {
		if (!holidayId || !auth0User) return;

		try {
			const task = partyPlanning.find((t: any) => t.id === taskId);
			if (task) {
				await updatePartyPlanning({
					holidayId,
					taskId,
					isCompleted: !task.isCompleted,
					auth0User,
				}).unwrap();
			}
		} catch (error) {
			console.error("Error updating party planning task:", error);
		}
	};

	const handleSortChange = (sortOption: string) => {
		setSortBy(sortOption);
	};

	return (
		<div className="min-h-screen birthday-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Party Planning"
				backHref="/birthday"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort Party Planning"
				description="Plan your birthday party with style!"
				holidayColor="yellow-500"
				error={error ? "An error occurred" : undefined}
			/>

			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<AddButton
					title="Task"
					onClick={() => setShowAddForm(true)}
					color="amber"
				/>

				<TaskSection
					title="Incomplete"
					items={sortedPartyPlanningTasks.filter((task) => !task.isCompleted)}
					isCompleted={false}
					emptyMessage="All party planning tasks completed! 🎉"
					completedMessage=""
					renderItem={(task) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleCompletion}
							onDelete={handleDelete}
							onEdit={handleEdit}
							theme={{
								accentColor: "#f59e0b", // Amber for Birthday
							}}
							borderColor="rgb(var(--color-amber-500))" // Amber border for Birthday
							gamifiedBackgroundColor="bg-gradient-to-br from-yellow-300 to-yellow-500"
							disableInternalModal={true}
						/>
					)}
				/>

				<TaskSection
					title="Completed"
					items={sortedPartyPlanningTasks.filter((task) => task.isCompleted)}
					isCompleted={true}
					emptyMessage="No completed party planning tasks yet."
					completedMessage="No completed party planning tasks yet."
					renderItem={(task) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleCompletion}
							onDelete={handleDelete}
							onEdit={handleEdit}
							className="opacity-60"
							theme={{
								accentColor: "#f59e0b", // Amber for Birthday
							}}
							borderColor="rgb(var(--color-amber-500))" // Amber border for Birthday
							gamifiedBackgroundColor="bg-gradient-to-br from-yellow-300 to-yellow-500"
							disableInternalModal={true}
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
				title="Sort Party Planning"
			/>

			{/* Form Modal */}
			<FormModal
				isOpen={showAddForm}
				title={editingTask ? "Edit Task" : "Add New Task"}
				fields={[
					{
						id: "title",
						type: "text" as const,
						placeholder: "Task Title*",
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
						: { priority: "medium", category: "Party Planning" }
				}
				onSubmit={handleSubmit}
				onClose={() => {
					setShowAddForm(false);
					setEditingTask(null);
				}}
				loading={
					editingTask
						? editPartyPlanningState.isLoading
						: createPartyPlanningState.isLoading
				}
				submitText={editingTask ? "Update Task" : "Add Task"}
				cardClassName="card"
				submitButtonColor="#f59e0b"
			/>

			{/* Delete Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				title="Delete Task"
				itemName={taskToDelete?.title}
				onConfirm={confirmDelete}
				onCancel={() => {
					setShowDeleteModal(false);
					setTaskToDelete(null);
				}}
				loading={deletePartyPlanningState.isLoading}
				cardClassName="card"
				confirmButtonColor="#f59e0b"
			/>
		</div>
	);
}
