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
} from "@/store/slices/easterGiftListSlice";
import { BudgetDisplay } from "@/components/common/BudgetDisplay";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import GiftCardItem from "@/components/cards/gift/GiftCardItem";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";

export default function EasterGiftListPage() {
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

	useEffect(() => {
		dispatch(fetchEasterGifts());
	}, [dispatch]);

	const handleSubmit = async (values: Record<string, any>) => {
		if (editingGift) {
			await dispatch(
				updateEasterGift({
					...editingGift,
					...values,
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
					price: values.price || 0,
				})
			);
		}
		setShowAddForm(false);
	};

	const handleEdit = (gift: any) => {
		setEditingGift(gift);
		setShowAddForm(true);
	};

	const handleDelete = (gift: any) => {
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

	const totalSpent = gifts
		.filter((gift) => gift.isCompleted)
		.reduce((sum, gift) => sum + gift.price, 0);

	const totalBudget = gifts.reduce((sum, gift) => sum + gift.price, 0);

	const incompleteGifts = gifts.filter((g) => !g.isCompleted);
	const completedGifts = gifts.filter((g) => g.isCompleted);

	const formFields = [
		{
			id: "name",
			type: "text" as const,
			placeholder: "Gift Name*",
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
		/>
	);

	return (
		<div className="min-h-screen easter-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Easter Gift List"
				backHref="/easter"
				error={error}
			/>

			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				{/* Budget Display */}
				<BudgetDisplay holiday="Easter" />

				{/* Add Gift Button */}
				<AddButton
					title="Gift"
					onClick={() => setShowAddForm(true)}
					color="purple"
				/>

				{/* Incomplete Gifts */}
				<TaskSection
					title="Incomplete"
					items={incompleteGifts}
					isCompleted={false}
					emptyMessage="All gifts completed! 🎉"
					completedMessage=""
					renderItem={renderGiftItem}
				/>

				{/* Completed Gifts */}
				<TaskSection
					title="Completed"
					items={completedGifts}
					isCompleted={true}
					emptyMessage="No completed gifts yet."
					completedMessage=""
					renderItem={renderGiftItem}
				/>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showAddForm}
				title={editingGift ? "Edit Gift" : "Add New Gift"}
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
				submitText={editingGift ? "Update Gift" : "Add Gift"}
				cardClassName="card"
				submitButtonColor="#a855f7"
			/>

			{/* Delete Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				title="Delete Gift"
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
