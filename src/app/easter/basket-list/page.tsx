"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchEasterGifts,
	addEasterGift,
	updateEasterGift,
	deleteEasterGift,
	toggleEasterGiftCompletion,
	setSelectedEasterGift,
	clearEasterError,
} from "@/store/slices/easter/easterGiftListSlice";
import { BudgetDisplay } from "@/components/common/BudgetDisplay";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import GiftCardItem from "@/components/cards/gift/GiftCardItem";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import SortModal from "@/components/modals/SortModal";

export default function EasterBasketListPage() {
	const dispatch = useAppDispatch();
	const gifts = useAppSelector((state) => state.easterGiftList.gifts);
	const loading = useAppSelector((state) => state.easterGiftList.loading);
	const error = useAppSelector((state) => state.easterGiftList.error);
	const selectedGift = useAppSelector(
		(state) => state.easterGiftList.selectedGift
	);

	const [showAddForm, setShowAddForm] = useState(false);
	const [editingGift, setEditingGift] = useState<any>(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [giftToDelete, setGiftToDelete] = useState<any>(null);
	const [showSortModal, setShowSortModal] = useState(false);
	const [sortBy, setSortBy] = useState<string>("dateCreated");

	// Sort options for basket items
	const sortOptions = [
		{ value: "dateCreated", label: "Date Created" },
		{ value: "name", label: "Name A-Z" },
		{ value: "recipient", label: "Recipient A-Z" },
		{ value: "price", label: "Price" },
		{ value: "store", label: "Store A-Z" },
	];

	// Sort function
	const sortBasketItems = (items: any[], sortOption: string) => {
		const sortedItems = [...items];
		switch (sortOption) {
			case "name":
				return sortedItems.sort((a, b) => a.name.localeCompare(b.name));
			case "recipient":
				return sortedItems.sort((a, b) =>
					a.recipient.localeCompare(b.recipient)
				);
			case "price":
				return sortedItems.sort((a, b) => (a.price || 0) - (b.price || 0));
			case "store":
				return sortedItems.sort((a, b) =>
					(a.store || "").localeCompare(b.store || "")
				);
			case "dateCreated":
			default:
				return sortedItems.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
		}
	};

	const sortedBasketItems = sortBasketItems(gifts, sortBy);

	useEffect(() => {
		dispatch(fetchEasterGifts());
	}, [dispatch]);

	const handleSubmit = async (values: Record<string, any>) => {
		// Ensure price is a number
		const price =
			typeof values.price === "string"
				? parseFloat(values.price) || 0
				: values.price || 0;

		if (editingGift) {
			await dispatch(
				updateEasterGift({
					...editingGift,
					...values,
					price: price,
				})
			);
			setEditingGift(null);
		} else {
			await dispatch(
				addEasterGift({
					...values,
					isCompleted: false,
					name: values.name || "",
					recipient: values.recipient || "",
					price: price,
				})
			);
		}
		setShowAddForm(false);
	};

	const handleEdit = (gift: any) => {
		setEditingGift(gift);
		setShowAddForm(true);
	};

	const handleDelete = (giftId: string) => {
		const gift = gifts.find((g) => g.id === giftId);
		setGiftToDelete(gift);
		setShowDeleteModal(true);
	};

	const confirmDelete = async () => {
		if (giftToDelete) {
			await dispatch(deleteEasterGift(giftToDelete.id));
			setGiftToDelete(null);
		}
		setShowDeleteModal(false);
	};

	const handleToggleCompletion = async (giftId: string) => {
		await dispatch(toggleEasterGiftCompletion(giftId));
	};

	const handleSortChange = (sortOption: string) => {
		setSortBy(sortOption);
	};

	const totalSpent = sortedBasketItems
		.filter((gift) => gift.isCompleted)
		.reduce(
			(sum, gift) => sum + (typeof gift.price === "number" ? gift.price : 0),
			0
		);

	const totalBudget = sortedBasketItems.reduce(
		(sum, gift) => sum + (typeof gift.price === "number" ? gift.price : 0),
		0
	);

	const incompleteBasketItems = sortedBasketItems.filter((g) => !g.isCompleted);
	const completedBasketItems = sortedBasketItems.filter((g) => g.isCompleted);

	const formFields = [
		{
			id: "name",
			type: "text" as const,
			placeholder: "Item Name*",
			required: true,
		},
		{
			id: "recipient",
			type: "text" as const,
			placeholder: "Recipient*",
			required: true,
		},
		{ id: "description", type: "text" as const, placeholder: "Description" },
		{
			id: "price",
			type: "number" as const,
			placeholder: "Price",
			step: "0.01",
		},
		{ id: "store", type: "text" as const, placeholder: "Store" },
		{ id: "productLink", type: "url" as const, placeholder: "Product Link" },
		{ id: "notes", type: "textarea" as const, placeholder: "Notes", rows: 2 },
	];

	const renderGiftItem = (gift: any) => (
		<GiftCardItem
			key={gift.id}
			gift={gift}
			isCompleted={gift.isCompleted}
			onToggle={handleToggleCompletion}
			onEdit={handleEdit}
			onDelete={handleDelete}
			loading={loading}
			theme={{
				accentColor: "#a855f7",
				hoverColor: "hover:bg-purple-50 dark:hover:bg-purple-900/20",
			}}
			borderColor="rgb(var(--color-purple-500))" // Purple border for Easter
			gamifiedBackgroundColor="bg-gradient-to-br from-purple-300 to-purple-500"
		/>
	);

	return (
		<div className="min-h-screen easter-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Easter Basket"
				backHref="/easter"
				error={error}
				onSortClick={() => setShowSortModal(true)}
				holidayColor="purple-500"
				description="Keep track of Easter basket items and purchases!"
				sortTitle="Sort Basket Items"
			/>

			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				{/* Budget Display */}
				<BudgetDisplay
					holiday="Easter"
					holidayColor="bg-gradient-to-br from-purple-300 to-purple-500"
				/>

				{/* Add Basket Item Button */}
				<AddButton
					title="Basket Item"
					onClick={() => setShowAddForm(true)}
					color="purple"
				/>

				{/* Incomplete Basket Items */}
				<TaskSection
					title="Incomplete"
					items={incompleteBasketItems}
					isCompleted={false}
					emptyMessage="All basket items completed! 🎉"
					completedMessage=""
					renderItem={renderGiftItem}
				/>

				{/* Completed Basket Items */}
				<TaskSection
					title="Completed"
					items={completedBasketItems}
					isCompleted={true}
					emptyMessage="No completed basket items yet."
					completedMessage="No completed basket items yet."
					renderItem={renderGiftItem}
				/>
			</main>

			{/* Sort Modal */}
			<SortModal
				isOpen={showSortModal}
				onClose={() => setShowSortModal(false)}
				sortBy={sortBy}
				onSortChange={handleSortChange}
				sortOptions={sortOptions}
				title="Sort Basket Items"
			/>

			{/* Form Modal */}
			<FormModal
				isOpen={showAddForm}
				title={editingGift ? "Edit Basket Item" : "Add New Basket Item"}
				fields={formFields}
				initialValues={
					editingGift
						? {
								name: editingGift.name,
								description: editingGift.description || "",
								price: editingGift.price,
								recipient: editingGift.recipient,
								store: editingGift.store || "",
								productLink: editingGift.productLink || "",
								notes: editingGift.notes || "",
						  }
						: {}
				}
				onSubmit={handleSubmit}
				onClose={() => {
					setShowAddForm(false);
					setEditingGift(null);
				}}
				loading={loading}
				submitText={editingGift ? "Update Item" : "Add Item"}
				cardClassName="card"
				submitButtonColor="#a855f7"
			/>

			{/* Delete Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				title="Delete Basket Item"
				itemName={giftToDelete?.name}
				onConfirm={confirmDelete}
				onCancel={() => {
					setShowDeleteModal(false);
					setGiftToDelete(null);
				}}
				loading={loading}
				cardClassName="card"
				confirmButtonColor="#a855f7"
			/>
		</div>
	);
}
