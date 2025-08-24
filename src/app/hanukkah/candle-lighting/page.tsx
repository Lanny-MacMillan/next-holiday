"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import SortModal from "@/components/modals/SortModal";
import DeleteModal from "@/components/modals/DeleteModal";
import FormModal from "@/components/modals/FormModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import { useCandleLightingMutations } from "@/hooks/useCandleLightingMutations";

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

export default function CandleLightingPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);

	// Use the new candle lighting mutations hook
	const {
		holidayId,
		auth0User,
		candleLighting,
		loading,
		error,
		initialized,
		createCandleLighting,
		updateCandleLighting,
		editCandleLighting,
		deleteCandleLighting,
		updateCandleLightingState,
		editCandleLightingState,
		deleteCandleLightingState,
	} = useCandleLightingMutations();

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		taskId: string | null;
	}>({
		show: false,
		taskId: null,
	});
	const [showSortModal, setShowSortModal] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);

	useEffect(() => {
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch]);

	async function handleAddTask(values: Record<string, any>) {
		if (!values.title?.trim()) return;
		if (!holidayId || !auth0User) return;

		try {
			const payload = {
				title: values.title,
				description: values.description || undefined,
				priority: values.priority as "low" | "medium" | "high",
				assignedTo: values.assignedTo || undefined,
				category: "Candle Lighting",
				dueDate: values.dueDate || undefined,
				isCompleted: false,
			};

			await createCandleLighting({ holidayId, payload, auth0User }).unwrap();
			setShowForm(false);
		} catch (error) {
			console.error("Error creating candle lighting task:", error);
		}
	}

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
	}

	async function handleToggleTask(taskId: string) {
		if (!holidayId || !auth0User) return;

		try {
			const task = candleLighting.find((t: any) => t.id === taskId);
			if (task) {
				await updateCandleLighting({
					holidayId,
					taskId,
					isCompleted: !task.isCompleted,
					auth0User,
				}).unwrap();
			}
		} catch (error) {
			console.error("Error updating candle lighting task:", error);
		}
	}

	function handleDeleteTask(taskId: string) {
		setDeleteConfirm({ show: true, taskId });
	}

	async function confirmDelete() {
		if (deleteConfirm.taskId && holidayId && auth0User) {
			try {
				await deleteCandleLighting({
					holidayId,
					taskId: deleteConfirm.taskId,
					auth0User,
				}).unwrap();
				setDeleteConfirm({ show: false, taskId: null });
			} catch (error) {
				console.error("Error deleting candle lighting task:", error);
			}
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, taskId: null });
	}

	const handleEditTask = (task: any) => {
		setEditingTask(task);
		setShowEditModal(true);
	};

	async function handleEditTaskSubmit(values: Record<string, any>) {
		if (!editingTask || !holidayId || !auth0User) return;

		try {
			await editCandleLighting({
				holidayId,
				taskId: editingTask.id,
				payload: {
					title: values.title,
					description: values.description || undefined,
					priority: values.priority as "low" | "medium" | "high",
					assignedTo: values.assignedTo || undefined,
					category: "Candle Lighting",
					dueDate: values.dueDate || undefined,
				},
				auth0User,
			}).unwrap();
			setShowEditModal(false);
			setEditingTask(null);
		} catch (error) {
			console.error("Error editing candle lighting task:", error);
		}
	}

	function closeEditModal() {
		setShowEditModal(false);
		setEditingTask(null);
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
			<div className="min-h-screen hanukkah-tasks-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading candle lighting tasks...
					</p>
				</div>
			</div>
		);
	}

	const sortedTasks = sortTasks(candleLighting);
	const incompleteTasks = sortedTasks.filter((task: any) => !task.isCompleted);
	const completedTasks = sortedTasks.filter((task: any) => task.isCompleted);

	return (
		<div className="min-h-screen hanukkah-tasks-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Candle Lighting Tracker"
				backHref="/hanukkah"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort tasks"
				description="Keep track of your Hanukkah candle lighting!"
				holidayColor="blue-500"
				error={error ? "API Error" : undefined}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				<AddButton
					title="Candle Lighting Task"
					onClick={openForm}
					color="blue"
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
					emptyMessage="All candles lit! 🕯️✨"
					completedMessage=""
					renderItem={(task: any) => (
						<li
							key={task.id}
							className="flex items-center px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
							onClick={() => handleToggleTask(task.id)}
						>
							<input
								type="checkbox"
								checked={task.isCompleted}
								readOnly
								className="mr-3 accent-blue-500"
							/>
							<div className="flex-1">
								<div className="text-gray-900 dark:text-white">
									{task.title}
								</div>
								{task.description && (
									<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
										{task.description}
									</div>
								)}
								<div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
									<span
										className={`px-2 py-1 rounded ${
											task.priority === "high"
												? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
												: task.priority === "medium"
												? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
												: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
										}`}
									>
										{task.priority}
									</span>
									{task.assignedTo && <span>Assigned: {task.assignedTo}</span>}
									{task.category && <span>{task.category}</span>}
									{task.dueDate && (
										<span>
											Due: {new Date(task.dueDate).toLocaleDateString()}
										</span>
									)}
								</div>
							</div>
							<div className="flex gap-2">
								<button
									onClick={(e) => {
										e.stopPropagation();
										handleEditTask(task);
									}}
									className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
									disabled={loading}
								>
									Edit
								</button>
								<button
									onClick={(e) => {
										e.stopPropagation();
										handleDeleteTask(task.id);
									}}
									className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
									disabled={loading}
								>
									Delete
								</button>
							</div>
						</li>
					)}
					cardClassName="card-tasks"
				/>

				<TaskSection
					title="Completed"
					items={completedTasks}
					isCompleted={true}
					emptyMessage="No completed tasks yet."
					completedMessage="No completed tasks yet."
					renderItem={(task: any) => (
						<li
							key={task.id}
							className="flex items-center px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 opacity-60"
							onClick={() => handleToggleTask(task.id)}
						>
							<input
								type="checkbox"
								checked={task.isCompleted}
								readOnly
								className="mr-3 accent-blue-500"
							/>
							<div className="flex-1">
								<div className="line-through text-gray-400 dark:text-gray-500">
									{task.title}
								</div>
								{task.description && (
									<div className="text-xs text-gray-400 dark:text-gray-500 line-through">
										{task.description}
									</div>
								)}
								{task.completedDate && (
									<div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
										Completed:{" "}
										{new Date(task.completedDate).toLocaleDateString()}
									</div>
								)}
							</div>
							<div className="flex gap-2">
								<button
									onClick={(e) => {
										e.stopPropagation();
										handleEditTask(task);
									}}
									className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
									disabled={loading}
								>
									Edit
								</button>
								<button
									onClick={(e) => {
										e.stopPropagation();
										handleDeleteTask(task.id);
									}}
									className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
									disabled={loading}
								>
									Delete
								</button>
							</div>
						</li>
					)}
					cardClassName="card-tasks"
				/>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showForm}
				title="Add New Candle Lighting Task"
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
				onClose={closeForm}
				loading={loading}
				submitText="Add Task"
				cardClassName="card-tasks"
			/>

			{/* Edit Modal */}
			<FormModal
				isOpen={showEditModal}
				title="Edit Candle Lighting Task"
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
				loading={editCandleLightingState.isLoading}
				submitText="Update Task"
				cardClassName="card-tasks"
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={deleteConfirm.show}
				onCancel={cancelDelete}
				onConfirm={confirmDelete}
				loading={deleteCandleLightingState.isLoading}
				cardClassName="card-tasks"
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
