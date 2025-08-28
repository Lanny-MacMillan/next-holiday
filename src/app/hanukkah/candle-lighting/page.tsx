"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import SortModal from "@/components/modals/SortModal";
import DeleteModal from "@/components/modals/DeleteModal";
import FormModal from "@/components/modals/FormModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import ToDoCard from "@/components/cards/to-do/ToDoCard";
import { useCandleLightingMutations } from "@/hooks/useCandleLightingMutations";

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

const defaultCandleTasks = [
	{
		title: "Light 1st Candle",
		description: "First night of Hanukkah - Light the shamash and first candle",
		category: "Candle Lighting",
		priority: "high" as const,
	},
	{
		title: "Light 2nd Candle",
		description: "Second night of Hanukkah - Light the shamash and two candles",
		category: "Candle Lighting",
		priority: "high" as const,
	},
	{
		title: "Light 3rd Candle",
		description:
			"Third night of Hanukkah - Light the shamash and three candles",
		category: "Candle Lighting",
		priority: "high" as const,
	},
	{
		title: "Light 4th Candle",
		description:
			"Fourth night of Hanukkah - Light the shamash and four candles",
		category: "Candle Lighting",
		priority: "high" as const,
	},
	{
		title: "Light 5th Candle",
		description: "Fifth night of Hanukkah - Light the shamash and five candles",
		category: "Candle Lighting",
		priority: "high" as const,
	},
	{
		title: "Light 6th Candle",
		description: "Sixth night of Hanukkah - Light the shamash and six candles",
		category: "Candle Lighting",
		priority: "high" as const,
	},
	{
		title: "Light 7th Candle",
		description:
			"Seventh night of Hanukkah - Light the shamash and seven candles",
		category: "Candle Lighting",
		priority: "high" as const,
	},
	{
		title: "Light 8th Candle",
		description:
			"Eighth night of Hanukkah - Light the shamash and eight candles",
		category: "Candle Lighting",
		priority: "high" as const,
	},
];

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
		createCandleLightingState,
		updateCandleLightingState,
		editCandleLightingState,
		deleteCandleLightingState,
	} = useCandleLightingMutations();

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showSortModal, setShowSortModal] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingTask, setEditingTask] = useState<any>(null);
	const [showDefaultTasks, setShowDefaultTasks] = useState(false);

	useEffect(() => {
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch]);

	// Check if default candle tasks exist
	useEffect(() => {
		if (candleLighting.length === 0 && initialized) {
			setShowDefaultTasks(true);
		}
	}, [candleLighting, initialized]);

	async function handleAddTask(values: Record<string, any>) {
		if (!values.title?.trim()) return;
		if (!holidayId || !auth0User) return;

		const payload = {
			title: values.title,
			description: values.description || undefined,
			priority: values.priority as "low" | "medium" | "high",
			assignedTo: values.assignedTo || undefined,
			category: "Candle Lighting",
			dueDate: values.dueDate || undefined,
			isCompleted: false,
		};

		await createCandleLighting({ holidayId, payload, auth0User });
		setShowForm(false);
	}

	async function addDefaultCandleTasks() {
		for (const task of defaultCandleTasks) {
			const payload = {
				title: task.title,
				description: task.description,
				priority: task.priority,
				assignedTo: undefined,
				category: task.category,
				dueDate: undefined,
				isCompleted: false,
			};
			await createCandleLighting({ holidayId, payload, auth0User });
		}
		setShowDefaultTasks(false);
	}

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
	}

	async function handleToggleTask(taskId: string) {
		if (!holidayId || !auth0User) return;

		const task = candleLighting.find((t: any) => t.id === taskId);
		if (task) {
			await updateCandleLighting({
				holidayId,
				taskId,
				isCompleted: !task.isCompleted,
				auth0User,
			});
		}
	}

	async function handleDeleteTask(taskId: string) {
		if (!holidayId || !auth0User) return;

		await deleteCandleLighting({
			holidayId,
			taskId,
			auth0User,
		});
	}

	const handleEditTask = (task: any) => {
		setEditingTask(task);
		setShowEditModal(true);
	};

	async function handleEditTaskSubmit(values: Record<string, any>) {
		if (!editingTask || !holidayId || !auth0User) return;

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
		});
		setShowEditModal(false);
		setEditingTask(null);
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
				{/* Default Tasks Prompt */}
				{showDefaultTasks && (
					<div className="card card-tasks rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
						<h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
							🕯️ Set Up Hanukkah Candle Lighting
						</h3>
						<p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
							Would you like to add the 8 nights of Hanukkah candle lighting
							tasks?
						</p>
						<div className="flex gap-2">
							<button
								onClick={addDefaultCandleTasks}
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
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleTask}
							onDelete={handleDeleteTask}
							onEdit={handleEditTask}
							theme={{
								accentColor: "#3b82f6", // Blue for Hanukkah
							}}
							borderColor="rgb(var(--color-blue-500))" // Blue border for Hanukkah
							disableInternalModal={true}
						/>
					)}
				/>

				<TaskSection
					title="Completed"
					items={completedTasks}
					isCompleted={true}
					emptyMessage="No completed tasks yet."
					completedMessage="No completed tasks yet."
					renderItem={(task: any) => (
						<ToDoCard
							key={task.id}
							task={task}
							onToggleComplete={handleToggleTask}
							onDelete={handleDeleteTask}
							onEdit={handleEditTask}
							className="opacity-60"
							theme={{
								accentColor: "#3b82f6", // Blue for Hanukkah
							}}
							borderColor="rgb(var(--color-blue-500))" // Blue border for Hanukkah
							disableInternalModal={true}
						/>
					)}
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
