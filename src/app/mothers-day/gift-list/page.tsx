"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchMothersDayGifts,
	addMothersDayGift,
	updateMothersDayGift,
	deleteMothersDayGift,
	toggleMothersDayGiftCompletion,
	MothersDayGift,
} from "@/store/slices/mothers-day/mothersDayGiftListSlice";
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

export default function MothersDayGiftListPage() {
	const dispatch = useAppDispatch();
	const { gifts, loading, error, initialized } = useAppSelector(
		(state: any) => state.mothersDayGiftList
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
	const [editingGift, setEditingGift] = useState<MothersDayGift | null>(null);

	useEffect(() => {
		// Fetch gifts and contacts when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchMothersDayGifts());
		}
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch, initialized]);

	function handleAddGift(values: Record<string, any>) {
		if (!values.description?.trim() || !values.recipient?.trim()) return;

		if (editingGift) {
			// Update existing gift
			const updatedGift: MothersDayGift = {
				...editingGift,
				name: values.description,
				description: values.description || undefined,
				price: parseFloat(values.price) || 0,
				recipient: values.recipient,
				store: values.store || undefined,
				productLink: values.productLink || undefined,
				notes: values.notes || undefined,
			};

			dispatch(updateMothersDayGift(updatedGift));
			setEditingGift(null);
		} else {
			// Add new gift
			const newGift: Omit<MothersDayGift, "id" | "createdAt" | "updatedAt"> = {
				name: values.description,
				description: values.description || undefined,
				price: parseFloat(values.price) || 0,
				recipient: values.recipient,
				isCompleted: false,
				store: values.store || undefined,
				productLink: values.productLink || undefined,
				notes: values.notes || undefined,
			};

			dispatch(addMothersDayGift(newGift));
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
		dispatch(toggleMothersDayGiftCompletion(giftId));
	}

	function handleDeleteGift(giftId: string) {
		setDeleteConfirm({ show: true, giftId });
	}

	function handleEditGift(gift: MothersDayGift) {
		setEditingGift(gift);
		setShowForm(true);
	}

	function confirmDelete() {
		if (deleteConfirm.giftId) {
			dispatch(deleteMothersDayGift(deleteConfirm.giftId));
			setDeleteConfirm({ show: false, giftId: null });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, giftId: null });
	}

	function sortGifts(giftsToSort: MothersDayGift[]): MothersDayGift[] {
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
			<div className="min-h-screen mothers-day-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading gifts...</p>
				</div>
			</div>
		);
	}

	const sortedGifts = sortGifts(gifts);
	const incompleteGifts = sortedGifts.filter(
		(gift: MothersDayGift) => !gift.isCompleted
	);
	const completedGifts = sortedGifts.filter(
		(gift: MothersDayGift) => gift.isCompleted
	);

	const renderGiftItem = (gift: MothersDayGift) => (
		<GiftCardItem
			key={gift.id}
			gift={gift}
			isCompleted={false}
			onToggle={handleToggleGift}
			onEdit={handleEditGift}
			onDelete={handleDeleteGift}
			loading={loading}
			theme={{
				accentColor: "#ec4899", // Pink for Mother's Day
			}}
			borderColor="rgb(var(--color-pink-500))" // Pink border for Mother's Day
			gamifiedBackgroundColor="bg-gradient-to-br from-pink-300 to-pink-500"
		/>
	);

	const renderCompletedGiftItem = (gift: MothersDayGift) => (
		<GiftCardItem
			key={gift.id}
			gift={gift}
			isCompleted={true}
			onToggle={handleToggleGift}
			onEdit={handleEditGift}
			onDelete={handleDeleteGift}
			loading={loading}
			theme={{
				accentColor: "#ec4899", // Pink for Mother's Day
			}}
			borderColor="rgb(var(--color-pink-500))" // Pink border for Mother's Day
			gamifiedBackgroundColor="bg-gradient-to-br from-pink-300 to-pink-500"
		/>
	);

	// Form fields configuration
	const formFields = [
		{
			id: "recipient",
			type: "text" as const,
			placeholder: "Recipient*",
			required: true,
		},
		{
			id: "description",
			type: "textarea" as const,
			placeholder: "Gift",
			rows: 2,
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

	// Initial values for editing
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
		<div className="min-h-screen mothers-day-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Gift List"
				backHref="/mothers-day"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort gifts"
				description="Keep track of gift ideas and purchases!"
				holidayColor="pink"
				error={error}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Budget Display */}
				<BudgetDisplay
					holiday="Mother's Day"
					holidayColor="bg-gradient-to-br from-pink-300 to-pink-500"
				/>

				<AddButton title="Gift" onClick={openForm} color="pink" />
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
					completedMessage=""
					renderItem={renderGiftItem}
				/>

				<TaskSection
					title="Completed"
					items={completedGifts}
					isCompleted={true}
					emptyMessage="No completed gifts yet."
					completedMessage=""
					renderItem={renderCompletedGiftItem}
				/>
			</main>

			{/* Form Modal */}
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
				submitButtonColor="#ec4899"
				showAddressBook={true}
				contacts={contacts}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={deleteConfirm.show}
				{...getDeleteConfig("gifts")}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={loading}
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
