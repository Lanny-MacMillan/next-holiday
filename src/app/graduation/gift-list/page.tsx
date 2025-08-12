"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchGraduationGifts,
	addGraduationGift,
	updateGraduationGift,
	deleteGraduationGift,
	GraduationGift,
} from "@/store/slices/graduation/graduationGiftListSlice";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import { BudgetDisplay } from "@/components/common/BudgetDisplay";
import SortModal from "@/components/modals/SortModal";
import GiftCardItem from "@/components/cards/gift/GiftCardItem";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";

type SortOption = "recipient" | "store" | "price-high" | "price-low" | "none";

export default function GraduationGiftListPage() {
	const dispatch = useAppDispatch();
	const { gifts, loading, error, initialized } = useAppSelector(
		(state: any) => state.graduationGiftList
	);
	const { contacts } = useAppSelector((state: any) => state.addressBook);

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showSortModal, setShowSortModal] = useState(false);
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		giftId: string | null;
	}>({
		show: false,
		giftId: null,
	});
	const [showForm, setShowForm] = useState(false);
	const [editingGift, setEditingGift] = useState<GraduationGift | null>(null);

	useEffect(() => {
		if (!initialized) {
			dispatch(fetchGraduationGifts());
		}
		dispatch(fetchContacts());
	}, [dispatch, initialized]);

	function handleAddGift(values: Record<string, any>) {
		if (!values.description?.trim() || !values.recipient?.trim()) return;

		if (editingGift) {
			const updatedGift: GraduationGift = {
				...editingGift,
				name: values.description,
				description: values.description || undefined,
				price: parseFloat(values.price) || 0,
				recipient: values.recipient,
				store: values.store || undefined,
				productLink: values.productLink || undefined,
				notes: values.notes || undefined,
			};
			dispatch(updateGraduationGift(updatedGift));
			setEditingGift(null);
		} else {
			const newGift: Omit<GraduationGift, "id" | "createdAt" | "updatedAt"> = {
				name: values.description,
				description: values.description || undefined,
				price: parseFloat(values.price) || 0,
				recipient: values.recipient,
				isCompleted: false,
				store: values.store || undefined,
				productLink: values.productLink || undefined,
				notes: values.notes || undefined,
			};
			dispatch(addGraduationGift(newGift));
		}
		setShowForm(false);
	}

	function openForm() {
		setShowForm(true);
		setEditingGift(null);
	}

	function closeForm() {
		setShowForm(false);
		setEditingGift(null);
	}

	function handleToggleGift(giftId: string) {
		// Find the gift and toggle its completion status
		const gift = gifts.find((g: GraduationGift) => g.id === giftId);
		if (gift) {
			const updatedGift = {
				...gift,
				isCompleted: !gift.isCompleted,
				completedDate: !gift.isCompleted ? new Date().toISOString() : undefined,
			};
			dispatch(updateGraduationGift(updatedGift));
		}
	}

	function handleDeleteGift(giftId: string) {
		setDeleteConfirm({ show: true, giftId });
	}

	function handleEditGift(gift: GraduationGift) {
		setEditingGift(gift);
		setShowForm(true);
	}

	function confirmDelete() {
		if (deleteConfirm.giftId) {
			dispatch(deleteGraduationGift(deleteConfirm.giftId));
			setDeleteConfirm({ show: false, giftId: null });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, giftId: null });
	}

	function sortGifts(giftsToSort: GraduationGift[]): GraduationGift[] {
		switch (sortBy) {
			case "recipient":
				return [...giftsToSort].sort((a, b) =>
					a.recipient.localeCompare(b.recipient)
				);
			case "store":
				return [...giftsToSort].sort((a, b) =>
					(a.store || "").localeCompare(b.store || "")
				);
			case "price-high":
				return [...giftsToSort].sort((a, b) => b.price - a.price);
			case "price-low":
				return [...giftsToSort].sort((a, b) => a.price - b.price);
			default:
				return giftsToSort;
		}
	}

	if (loading && !initialized) {
		return (
			<div className="min-h-screen graduation-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading gifts...</p>
				</div>
			</div>
		);
	}

	const sortedGifts = sortGifts(gifts);
	const incompleteGifts = sortedGifts.filter(
		(gift: GraduationGift) => !gift.isCompleted
	);
	const completedGifts = sortedGifts.filter(
		(gift: GraduationGift) => gift.isCompleted
	);

	const renderGiftItem = (gift: GraduationGift) => (
		<GiftCardItem
			key={gift.id}
			gift={gift}
			isCompleted={false}
			onToggle={handleToggleGift}
			onEdit={handleEditGift}
			onDelete={handleDeleteGift}
			loading={loading}
			theme={{
				accentColor: "#8b5cf6",
			}}
			borderColor="rgb(var(--color-purple-500))"
			gamifiedBackgroundColor="bg-gradient-to-br from-purple-300 to-purple-500"
		/>
	);

	const renderCompletedGiftItem = (gift: GraduationGift) => (
		<GiftCardItem
			key={gift.id}
			gift={gift}
			isCompleted={true}
			onToggle={handleToggleGift}
			onEdit={handleEditGift}
			onDelete={handleDeleteGift}
			loading={loading}
			theme={{
				accentColor: "#8b5cf6",
			}}
			borderColor="rgb(var(--color-purple-500))"
			gamifiedBackgroundColor="bg-gradient-to-br from-purple-300 to-purple-500"
		/>
	);

	const formFields = [
		{
			id: "recipient",
			type: "text" as const,
			placeholder: "Recipient*",
			required: true,
		},
		{
			id: "description",
			type: "text" as const,
			placeholder: "Gift",
		},
		{
			id: "price",
			type: "number" as const,
			placeholder: "Price",
			step: "0.01",
		},
		{
			id: "store",
			type: "text" as const,
			placeholder: "Store",
		},
		{
			id: "productLink",
			type: "url" as const,
			placeholder: "Product Link (optional)",
		},
		{
			id: "notes",
			type: "textarea" as const,
			placeholder: "Notes",
			rows: 2,
		},
	];

	const getInitialValues = () => {
		if (!editingGift) return {};
		return {
			description: editingGift.name,
			price: editingGift.price.toString(),
			recipient: editingGift.recipient,
			store: editingGift.store || "",
			productLink: editingGift.productLink || "",
			notes: editingGift.notes || "",
		};
	};

	return (
		<div className="min-h-screen graduation-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Gift List"
				backHref="/graduation"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort gifts"
				description="Plan your graduation gift list with style!"
				holidayColor="purple-500"
				error={error}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				<BudgetDisplay
					holiday="Graduation"
					holidayColor="bg-gradient-to-br from-purple-300 to-purple-500"
				/>
				<AddButton title="Gift" onClick={openForm} color="purple" />
				<div className="flex items-center justify-center">
					{sortBy !== "none" && (
						<div className="text-center text-sm text-gray-600 dark:text-gray-400">
							{sortBy === "recipient" && "Sorted by Recipient"}
							{sortBy === "store" && "Sorted by Store"}
							{sortBy === "price-high" && "Sorted by Price (High to Low)"}
							{sortBy === "price-low" && "Sorted by Price (Low to High)"}
						</div>
					)}
				</div>

				<TaskSection
					title="Incomplete"
					items={incompleteGifts}
					isCompleted={false}
					emptyMessage="All gifts completed! 🎉"
					completedMessage="All gifts completed! 🎉"
					renderItem={renderGiftItem}
				/>

				<TaskSection
					title="Completed"
					items={completedGifts}
					isCompleted={true}
					emptyMessage="No completed gifts yet."
					completedMessage="No completed gifts yet."
					renderItem={renderCompletedGiftItem}
				/>
			</main>

			<FormModal
				isOpen={showForm}
				title={editingGift ? "Edit Gift" : "Add New Gift"}
				fields={formFields}
				initialValues={getInitialValues()}
				onSubmit={handleAddGift}
				onClose={closeForm}
				loading={loading}
				submitText={editingGift ? "Update Gift" : "Add Gift"}
				cancelText="Cancel"
				cardClassName="card"
				submitButtonColor="#8b5cf6"
				showAddressBook={true}
				contacts={contacts}
			/>

			<DeleteModal
				isOpen={deleteConfirm.show}
				{...getDeleteConfig("gifts")}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={loading}
			/>

			<SortModal
				isOpen={showSortModal}
				onClose={() => setShowSortModal(false)}
				sortBy={sortBy}
				onSortChange={(sortOption: string) =>
					setSortBy(sortOption as SortOption)
				}
				sortOptions={[
					{ value: "none", label: "None" },
					{ value: "recipient", label: "Recipient" },
					{ value: "store", label: "Store" },
					{ value: "price-high", label: "Price: High to Low" },
					{ value: "price-low", label: "Price: Low to High" },
				]}
				title="Sort Gifts"
			/>
		</div>
	);
}
