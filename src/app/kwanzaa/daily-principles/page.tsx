"use client";

import { useState, useEffect } from "react";
import { useKwanzaaPrinciplesMutations } from "@/hooks/useKwanzaaPrinciplesMutations";
import SortModal from "@/components/modals/SortModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import AddButton from "@/components/common/AddButton";
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";

type SortOption = "priority" | "dateDue" | "assignedTo" | "category" | "none";

// Default Kwanzaa principles for preloading
const defaultKwanzaaPrinciples = [
	{
		dayNumber: 1,
		name: "Umoja (Unity)",
		description: "First day of Kwanzaa - focus on unity",
		priority: "high" as const,
	},
	{
		dayNumber: 2,
		name: "Kujichagulia (Self-Determination)",
		description: "Second day of Kwanzaa - focus on self-determination",
		priority: "high" as const,
	},
	{
		dayNumber: 3,
		name: "Ujima (Collective Work and Responsibility)",
		description: "Third day of Kwanzaa - focus on collective work",
		priority: "high" as const,
	},
	{
		dayNumber: 4,
		name: "Ujamaa (Cooperative Economics)",
		description: "Fourth day of Kwanzaa - focus on cooperative economics",
		priority: "high" as const,
	},
	{
		dayNumber: 5,
		name: "Nia (Purpose)",
		description: "Fifth day of Kwanzaa - focus on purpose",
		priority: "high" as const,
	},
	{
		dayNumber: 6,
		name: "Kuumba (Creativity)",
		description: "Sixth day of Kwanzaa - focus on creativity",
		priority: "high" as const,
	},
	{
		dayNumber: 7,
		name: "Imani (Faith)",
		description: "Seventh day of Kwanzaa - focus on faith",
		priority: "high" as const,
	},
];

export default function DailyPrinciplesPage() {
	const {
		holidayId,
		auth0User,
		kwanzaaPrinciples,
		loading,
		error,
		initialized,
		createKwanzaaPrinciples,
		updateKwanzaaPrinciples,
		editKwanzaaPrinciples,
		deleteKwanzaaPrinciples,
		createKwanzaaPrinciplesState,
		updateKwanzaaPrinciplesState,
		editKwanzaaPrinciplesState,
		deleteKwanzaaPrinciplesState,
	} = useKwanzaaPrinciplesMutations();

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showSortModal, setShowSortModal] = useState(false);
	const [showFormModal, setShowFormModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showDefaultPrinciples, setShowDefaultPrinciples] = useState(false);
	const [editingPrinciple, setEditingPrinciple] = useState<any>(null);
	const [principleToDelete, setPrincipleToDelete] = useState<any>(null);

	// Check if default principles exist
	useEffect(() => {
		if (kwanzaaPrinciples.length === 0 && initialized) {
			setShowDefaultPrinciples(true);
		}
	}, [kwanzaaPrinciples, initialized]);

	const handleToggleTask = async (taskId: string) => {
		const task = kwanzaaPrinciples.find((t: any) => t.id === taskId);
		if (task) {
			try {
				await updateKwanzaaPrinciples({
					holidayId: holidayId || "",
					taskId,
					isCompleted: !task.isCompleted,
					auth0User,
				}).unwrap();
			} catch (error) {
				console.error("Failed to update principle:", error);
			}
		}
	};

	const handleDeleteTask = (taskId: string) => {
		const task = kwanzaaPrinciples.find((t: any) => t.id === taskId);
		setPrincipleToDelete(task);
		setShowDeleteModal(true);
	};

	const confirmDelete = async () => {
		if (principleToDelete) {
			try {
				await deleteKwanzaaPrinciples({
					holidayId: holidayId || "",
					taskId: principleToDelete.id,
					auth0User,
				}).unwrap();
				setShowDeleteModal(false);
				setPrincipleToDelete(null);
			} catch (error) {
				console.error("Failed to delete principle:", error);
			}
		}
	};

	const cancelDelete = () => {
		setShowDeleteModal(false);
		setPrincipleToDelete(null);
	};

	const handleAddPrinciple = async (formValues: Record<string, any>) => {
		try {
			await createKwanzaaPrinciples({
				holidayId: holidayId || "",
				payload: formValues,
				auth0User,
			}).unwrap();
			setShowFormModal(false);
		} catch (error) {
			console.error("Failed to create principle:", error);
		}
	};

	const addDefaultPrinciples = async () => {
		if (!holidayId || !auth0User) return;

		try {
			for (const principle of defaultKwanzaaPrinciples) {
				const payload = {
					title: principle.name,
					description: principle.description,
					priority: principle.priority,
					category: "Daily Principles",
					isCompleted: false,
				};

				await createKwanzaaPrinciples({
					holidayId,
					payload,
					auth0User,
				}).unwrap();
			}
			setShowDefaultPrinciples(false);
		} catch (error) {
			console.error("Error adding default principles:", error);
		}
	};

	const handleEditPrinciple = async (formValues: Record<string, any>) => {
		if (editingPrinciple) {
			try {
				// Clean up the form values - convert empty strings to undefined
				const cleanedPayload = {
					title: formValues.title,
					description: formValues.description || undefined,
					priority: formValues.priority,
					assignedTo: formValues.assignedTo || undefined,
					dueDate: formValues.dueDate || undefined,
				};

				await editKwanzaaPrinciples({
					holidayId: holidayId || "",
					taskId: editingPrinciple.id,
					payload: cleanedPayload,
					auth0User,
				}).unwrap();
				setShowFormModal(false);
				setEditingPrinciple(null);
			} catch (error) {
				console.error("Failed to edit principle:", error);
			}
		}
	};

	const openEditModal = (principle: any) => {
		setEditingPrinciple(principle);
		setShowFormModal(true);
	};

	const closeForm = () => {
		setShowFormModal(false);
		setEditingPrinciple(null);
	};

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
					<p className="text-gray-600 dark:text-gray-300">
						Loading daily principles...
					</p>
				</div>
			</div>
		);
	}

	const sortedTasks = sortTasks(kwanzaaPrinciples);
	const incompleteTasks = sortedTasks.filter((task: any) => !task.isCompleted);
	const completedTasks = sortedTasks.filter((task: any) => task.isCompleted);

	// Get form configuration with custom titles for Kwanzaa principles
	const formConfig = getFormConfig(
		"tasks",
		editingPrinciple ? "edit" : "add",
		editingPrinciple ? "Edit Principle" : "Add New Principle",
		"Principle Title*",
		editingPrinciple ? "Update Principle" : "Add Principle"
	);
	const deleteConfig = getDeleteConfig("tasks");

	return (
		<div className="min-h-screen kwanzaa-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Daily Principle Tracker"
				backHref="/kwanzaa"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort Principles"
				error={error ? "API Error" : undefined}
				holidayColor="red-600"
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Default Principles Prompt */}
				{showDefaultPrinciples && (
					<div className="card card-tasks rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
						<h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
							🕯️ Set Up Kwanzaa Principles
						</h3>
						<p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
							Would you like to add the seven traditional Kwanzaa principles to
							track daily?
						</p>
						<div className="flex gap-2">
							<button
								onClick={addDefaultPrinciples}
								className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
							>
								Add Default Principles
							</button>
							<button
								onClick={() => setShowDefaultPrinciples(false)}
								className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors text-sm"
							>
								Skip
							</button>
						</div>
					</div>
				)}

				<AddButton
					title="Principle"
					onClick={() => setShowFormModal(true)}
					color="red"
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

				<div>
					<h2 className="font-semibold text-gray-800 dark:text-white mb-2">
						Incomplete ({incompleteTasks.length})
					</h2>
					<div className="card card-tasks rounded shadow">
						{incompleteTasks.length === 0 ? (
							<div className="px-4 py-3 text-gray-400 dark:text-gray-500 text-center">
								All candles lit! 🕯️✨
							</div>
						) : (
							<ul className="divide-y divide-gray-200 dark:divide-gray-700">
								{incompleteTasks.map((task: any) => (
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
												{task.assignedTo && (
													<span>Assigned: {task.assignedTo}</span>
												)}
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
													openEditModal(task);
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
													openEditModal(task);
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
								))}
							</ul>
						)}
					</div>
				</div>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showFormModal}
				title={editingPrinciple ? "Edit Principle" : "Add Principle"}
				fields={formConfig.fields}
				initialValues={
					editingPrinciple
						? {
								title: editingPrinciple.title || "",
								description: editingPrinciple.description || "",
								priority: editingPrinciple.priority || "medium",
								assignedTo: editingPrinciple.assignedTo || "",
								dueDate: editingPrinciple.dueDate || "",
						  }
						: {}
				}
				onSubmit={editingPrinciple ? handleEditPrinciple : handleAddPrinciple}
				onClose={closeForm}
				loading={
					editingPrinciple
						? editKwanzaaPrinciplesState.isLoading
						: createKwanzaaPrinciplesState.isLoading
				}
				submitText={editingPrinciple ? "Update Principle" : "Add Principle"}
				cancelText="Cancel"
				cardClassName="card card-tasks"
				submitButtonColor="#dc2626"
			/>

			{/* Delete Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				title={deleteConfig.title}
				message={deleteConfig.message}
				itemName={principleToDelete?.title}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={deleteKwanzaaPrinciplesState.isLoading}
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
