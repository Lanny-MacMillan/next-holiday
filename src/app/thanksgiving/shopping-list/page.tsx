"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchThanksgivingBudgetItems,
	addThanksgivingBudgetItem,
	updateThanksgivingBudgetItem,
	deleteThanksgivingBudgetItem,
} from "@/store/slices/thanksgiving/thanksgivingBudgetSlice";
import { BudgetDisplay } from "@/components/common/BudgetDisplay";
import SortModal from "@/components/modals/SortModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";
import { ThanksgivingBudgetItem } from "@/store/slices/thanksgiving/thanksgivingBudgetSlice";
import { ShoppingListItems } from "@/components/cards/shopping";

type SortOption = "amount" | "date" | "category" | "name" | "none";

export default function ThanksgivingShoppingListPage() {
	const dispatch = useAppDispatch();
	const { budgetItems, loading, error, initialized } = useAppSelector(
		(state: any) => state.thanksgivingBudget
	);

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [editingItem, setEditingItem] = useState<ThanksgivingBudgetItem | null>(
		null
	);
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		itemId: string | null;
	}>({
		show: false,
		itemId: null,
	});

	useEffect(() => {
		// Fetch budget items when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchThanksgivingBudgetItems());
		}
	}, [dispatch, initialized]);

	const totalSpent = budgetItems.reduce(
		(sum: number, item: ThanksgivingBudgetItem) => {
			return sum + item.amount;
		},
		0
	);

	const totalItems = budgetItems.length;

	function handleAddItem(formValues: Record<string, any>) {
		console.log("Form values received:", formValues);

		if (!formValues.name?.trim()) {
			console.log("No name provided");
			return;
		}

		const newItem: Omit<
			ThanksgivingBudgetItem,
			"id" | "createdAt" | "updatedAt"
		> = {
			name: formValues.name,
			description: formValues.description || undefined,
			amount: parseFloat(formValues.amount) || 0,
			category:
				(formValues.category as
					| "Food & Ingredients"
					| "Decorations"
					| "Tableware"
					| "Kitchen Supplies"
					| "Other") || "Food & Ingredients",
			date: formValues.date || new Date().toISOString(),
			isExpense: true,
		};

		console.log("Dispatching new budget item:", newItem);
		dispatch(addThanksgivingBudgetItem(newItem));
		setShowForm(false);
	}

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
	}

	function handleDeleteItem(itemId: string) {
		setDeleteConfirm({ show: true, itemId });
	}

	function handleEditItem(item: ThanksgivingBudgetItem) {
		setEditingItem(item);
	}

	function handleSaveEdit(formValues: Record<string, any>) {
		if (editingItem) {
			const updatedItem: Omit<
				ThanksgivingBudgetItem,
				"id" | "createdAt" | "updatedAt"
			> = {
				name: formValues.name,
				description: formValues.description || undefined,
				amount: parseFloat(formValues.amount) || 0,
				category:
					(formValues.category as
						| "Food & Ingredients"
						| "Decorations"
						| "Tableware"
						| "Kitchen Supplies"
						| "Other") || "Food & Ingredients",
				date: formValues.date || new Date().toISOString(),
				isExpense: true,
			};
			dispatch(
				updateThanksgivingBudgetItem({ ...editingItem, ...updatedItem })
			);
			setEditingItem(null);
		}
	}

	function handleCloseEdit() {
		setEditingItem(null);
	}

	function confirmDelete() {
		if (deleteConfirm.itemId) {
			dispatch(deleteThanksgivingBudgetItem(deleteConfirm.itemId));
			setDeleteConfirm({ show: false, itemId: null });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, itemId: null });
	}

	function sortItems(
		itemsToSort: ThanksgivingBudgetItem[]
	): ThanksgivingBudgetItem[] {
		switch (sortBy) {
			case "amount":
				return [...itemsToSort].sort((a, b) => b.amount - a.amount); // High to low
			case "date":
				return [...itemsToSort].sort((a, b) => {
					return new Date(a.date).getTime() - new Date(b.date).getTime();
				});
			case "category":
				return [...itemsToSort].sort((a, b) =>
					a.category.localeCompare(b.category)
				);
			case "name":
				return [...itemsToSort].sort((a, b) => a.name.localeCompare(b.name));
			default:
				return itemsToSort;
		}
	}

	if (loading && !initialized) {
		return (
			<div className="min-h-screen thanksgiving-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading shopping list...
					</p>
				</div>
			</div>
		);
	}

	const sortedItems = sortItems(budgetItems);

	return (
		<div className="min-h-screen thanksgiving-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="🛒 Shopping List"
				backHref="/thanksgiving"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort shopping items"
				error={error}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Budget Display */}
				<BudgetDisplay
					holiday="Thanksgiving"
					holidayColor="bg-gradient-to-br from-amber-400 to-amber-600"
				/>

				<AddButton title="Shopping Item" onClick={openForm} color="amber" />
				<div className="flex items-center justify-center">
					{sortBy !== "none" && (
						<div className="text-center text-sm text-gray-600 dark:text-gray-400">
							{sortBy === "amount" && "Sorted by Amount (High to Low)"}
							{sortBy === "date" && "Sorted by Date"}
							{sortBy === "category" && "Sorted by Category"}
							{sortBy === "name" && "Sorted by Name"}
						</div>
					)}
				</div>

				{/* Shopping Items List */}
				<ShoppingListItems
					items={sortedItems}
					title="Shopping Items"
					emptyMessage="No shopping items yet. Add your first item!"
					onEditItem={handleEditItem}
					onDeleteItem={handleDeleteItem}
					accentColor="amber"
					accentColorLight="amber-100"
					accentColorDark="amber-800"
					holidayColor="bg-gradient-to-br from-amber-400 to-amber-600"
				/>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showForm}
				title="Add New Shopping Item"
				fields={[
					{
						id: "name",
						type: "text",
						placeholder: "Item Name*",
						required: true,
					},
					{
						id: "description",
						type: "textarea",
						placeholder: "Description",
						rows: 2,
					},
					{
						id: "amount",
						type: "number",
						placeholder: "Amount*",
						step: "0.01",
						required: true,
					},
					{
						id: "category",
						type: "select",
						placeholder: "Category",
						options: [
							{ value: "Food & Ingredients", label: "Food & Ingredients" },
							{ value: "Decorations", label: "Decorations" },
							{ value: "Tableware", label: "Tableware" },
							{ value: "Kitchen Supplies", label: "Kitchen Supplies" },
							{ value: "Other", label: "Other" },
						],
					},
					{
						id: "date",
						type: "date",
						placeholder: "Date",
					},
				]}
				initialValues={{ category: "Food & Ingredients" }}
				onSubmit={handleAddItem}
				onClose={closeForm}
				loading={loading}
				submitText={loading ? "Adding..." : "Add Item"}
				cancelText="Cancel"
				submitButtonColor="#d97706"
			/>

			{/* Edit Item Modal */}
			<FormModal
				isOpen={editingItem !== null}
				title="Edit Shopping Item"
				fields={[
					{
						id: "name",
						type: "text",
						placeholder: "Item Name*",
						required: true,
					},
					{
						id: "description",
						type: "textarea",
						placeholder: "Description",
						rows: 2,
					},
					{
						id: "amount",
						type: "number",
						placeholder: "Amount*",
						step: "0.01",
						required: true,
					},
					{
						id: "category",
						type: "select",
						placeholder: "Category",
						options: [
							{ value: "Food & Ingredients", label: "Food & Ingredients" },
							{ value: "Decorations", label: "Decorations" },
							{ value: "Tableware", label: "Tableware" },
							{ value: "Kitchen Supplies", label: "Kitchen Supplies" },
							{ value: "Other", label: "Other" },
						],
					},
					{
						id: "date",
						type: "date",
						placeholder: "Date",
					},
				]}
				initialValues={
					editingItem
						? {
								name: editingItem.name,
								description: editingItem.description || "",
								amount: editingItem.amount,
								category: editingItem.category,
								date: editingItem.date.split("T")[0],
						  }
						: {}
				}
				onSubmit={handleSaveEdit}
				onClose={handleCloseEdit}
				loading={loading}
				submitText={loading ? "Saving..." : "Save Changes"}
				cancelText="Cancel"
				submitButtonColor="#d97706"
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={deleteConfirm.show}
				{...getDeleteConfig("tasks")}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={loading}
				cardClassName="card"
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
					{ value: "amount", label: "Amount (High to Low)" },
					{ value: "date", label: "Date" },
					{ value: "category", label: "Category" },
					{ value: "name", label: "Name" },
				]}
				title="Sort Shopping Items"
			/>
		</div>
	);
}
