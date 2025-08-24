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
import { useDateIdeasMutations } from "@/hooks/useDateIdeasMutations";

export default function AnniversaryDateIdeasPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);

	// Use the new date ideas mutations hook
	const {
		holidayId,
		auth0User,
		dateIdeas,
		loading,
		error,
		initialized,
		createDateIdeas,
		updateDateIdeas,
		editDateIdeas,
		deleteDateIdeas,
		createDateIdeasState,
		updateDateIdeasState,
		editDateIdeasState,
		deleteDateIdeasState,
	} = useDateIdeasMutations();

	const [showAddForm, setShowAddForm] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [taskToDelete, setTaskToDelete] = useState<any>(null);
	const [showSortModal, setShowSortModal] = useState(false);
	const [sortBy, setSortBy] = useState<string>("priority");

	// Sort options for date ideas
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

	const sortedDateTasks = sortTasks(dateIdeas, sortBy);

	useEffect(() => {
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch]);

	const handleSubmit = async (values: Record<string, any>) => {
		if (!holidayId || !auth0User) return;

		try {
			if (editingTask) {
				await editDateIdeas({
					holidayId,
					taskId: editingTask.id,
					payload: {
						title: values.title,
						description: values.description || undefined,
						priority: values.priority as "low" | "medium" | "high",
						assignedTo: values.assignedTo || undefined,
						category: "Date Ideas",
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
					category: "Date Ideas",
					dueDate: values.dueDate || undefined,
					isCompleted: false,
				};
				await createDateIdeas({ holidayId, payload, auth0User }).unwrap();
			}
			setShowAddForm(false);
		} catch (error) {
			console.error("Error saving date idea:", error);
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
		if (taskToDelete && holidayId && auth0User) {
			try {
				await deleteDateIdeas({
					holidayId,
					taskId: taskToDelete.id,
					auth0User,
				}).unwrap();
				setTaskToDelete(null);
			} catch (error) {
				console.error("Error deleting date idea:", error);
			}
		}
		setShowDeleteModal(false);
	};

	const handleToggleCompletion = async (taskId: string) => {
		if (!holidayId || !auth0User) return;

		try {
			const task = dateIdeas.find((t: any) => t.id === taskId);
			if (task) {
				await updateDateIdeas({
					holidayId,
					taskId,
					isCompleted: !task.isCompleted,
					auth0User,
				}).unwrap();
			}
		} catch (error) {
			console.error("Error updating date idea:", error);
		}
	};

	const handleSortChange = (sortOption: string) => {
		setSortBy(sortOption);
	};

	return (
		<div className="min-h-screen anniversary-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Date Ideas"
				backHref="/anniversary"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort Date Ideas"
				description="Plan your anniversary date ideas with style!"
				holidayColor="pink-500"
				error={error ? "An error occurred" : undefined}
			/>

			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<AddButton
					title="Date Idea"
					onClick={() => setShowAddForm(true)}
					color="pink"
				/>

				<TaskSection
					title="Incomplete"
					items={sortedDateTasks.filter((task) => !task.isCompleted)}
					isCompleted={false}
					emptyMessage="All date ideas completed! 🎉"
					completedMessage=""
					renderItem={(task) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleCompletion}
							onDelete={handleDelete}
							onEdit={handleEdit}
							gamifiedBackgroundColor="bg-gradient-to-br from-pink-300 to-pink-500"
							disableInternalModal={true}
						/>
					)}
				/>

				<TaskSection
					title="Completed"
					items={sortedDateTasks.filter((task) => task.isCompleted)}
					isCompleted={true}
					emptyMessage="No completed date ideas yet."
					completedMessage="No completed date ideas yet."
					renderItem={(task) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleCompletion}
							onDelete={handleDelete}
							onEdit={handleEdit}
							className="opacity-60"
							gamifiedBackgroundColor="bg-gradient-to-br from-pink-300 to-pink-500"
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
				title="Sort Date Ideas"
			/>

			{/* Form Modal */}
			<FormModal
				isOpen={showAddForm}
				title={editingTask ? "Edit Date Idea" : "Add New Date Idea"}
				fields={getFormConfig("tasks", "add").fields}
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
						: { priority: "medium", category: "Date Ideas" }
				}
				onSubmit={handleSubmit}
				onClose={() => {
					setShowAddForm(false);
					setEditingTask(null);
				}}
				loading={
					editingTask
						? editDateIdeasState.isLoading
						: createDateIdeasState.isLoading
				}
				submitText={editingTask ? "Update Date Idea" : "Add Date Idea"}
				submitButtonColor="#ec4899"
			/>

			{/* Delete Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				{...getDeleteConfig("tasks")}
				onConfirm={confirmDelete}
				onCancel={() => {
					setShowDeleteModal(false);
					setTaskToDelete(null);
				}}
				loading={deleteDateIdeasState.isLoading}
				cardClassName="card"
				confirmText="Delete"
				cancelText="Cancel"
			/>
		</div>
	);
}
