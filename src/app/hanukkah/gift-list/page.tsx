"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchHanukkahGifts,
	addHanukkahGift,
	updateHanukkahGift,
	deleteHanukkahGift,
	toggleHanukkahGiftCompletion,
	HanukkahGift,
} from "@/store/slices/hanukkah/hanukkahGiftListSlice";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import { BudgetDisplay } from "@/components/common/BudgetDisplay";
import SortModal from "@/components/modals/SortModal";
import DeleteModal from "@/components/modals/DeleteModal";
import FormModal from "@/components/modals/FormModal";
import GiftCardItem from "@/components/cards/gift/GiftCardItem";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";

type SortOption = "recipient" | "store" | "price-high" | "price-low" | "none";

export default function HanukkahGiftListPage() {
	const dispatch = useAppDispatch();
	const { gifts, loading, error, initialized } = useAppSelector(
		(state: any) => state.hanukkahGiftList
	);
	const { contacts } = useAppSelector((state: any) => state.addressBook);

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showSortModal, setShowSortModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showFormModal, setShowFormModal] = useState(false);
	const [selectedGift, setSelectedGift] = useState<HanukkahGift | null>(null);
	const [giftToDelete, setGiftToDelete] = useState<HanukkahGift | null>(null);

	useEffect(() => {
		// Fetch gifts and contacts when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchHanukkahGifts());
		}
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch, initialized]);

	function handleAddGift(values: Record<string, any>) {
		const newGift: Omit<HanukkahGift, "id" | "createdAt" | "updatedAt"> = {
			name: values.name,
			description: values.description || undefined,
			price: parseFloat(values.price) || 0,
			recipient: values.recipient,
			isCompleted: false,
			store: values.store || undefined,
			productLink: values.productLink || undefined,
			notes: values.notes || undefined,
		};

		dispatch(addHanukkahGift(newGift));
		setShowFormModal(false);
	}

	function handleEditGift(gift: HanukkahGift) {
		setSelectedGift(gift);
		setShowFormModal(true);
	}

	function handleUpdateGift(values: Record<string, any>) {
		if (!selectedGift) return;

		const updatedGift: HanukkahGift = {
			...selectedGift,
			name: values.name,
			description: values.description || undefined,
			price: parseFloat(values.price) || 0,
			recipient: values.recipient,
			store: values.store || undefined,
			productLink: values.productLink || undefined,
			notes: values.notes || undefined,
		};

		dispatch(updateHanukkahGift(updatedGift));
		setShowFormModal(false);
		setSelectedGift(null);
	}

	function handleToggleGift(giftId: string) {
		dispatch(toggleHanukkahGiftCompletion(giftId));
	}

	function handleDeleteGift(gift: HanukkahGift) {
		setGiftToDelete(gift);
		setShowDeleteModal(true);
	}

	function confirmDelete() {
		if (giftToDelete) {
			dispatch(deleteHanukkahGift(giftToDelete.id));
			setShowDeleteModal(false);
			setGiftToDelete(null);
		}
	}

	function cancelDelete() {
		setShowDeleteModal(false);
		setGiftToDelete(null);
	}

	function openForm() {
		setSelectedGift(null);
		setShowFormModal(true);
	}

	function closeForm() {
		setShowFormModal(false);
		setSelectedGift(null);
	}

	function sortGifts(giftsToSort: HanukkahGift[]): HanukkahGift[] {
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
			<div className="min-h-screen hanukkah-gifts-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading gifts...</p>
				</div>
			</div>
		);
	}

	const sortedGifts = sortGifts(gifts);
	const incompleteGifts = sortedGifts.filter(
		(gift: HanukkahGift) => !gift.isCompleted
	);
	const completedGifts = sortedGifts.filter(
		(gift: HanukkahGift) => gift.isCompleted
	);

	const renderGiftItem = (gift: HanukkahGift) => (
		<GiftCardItem
			key={gift.id}
			gift={gift}
			isCompleted={false}
			onToggle={handleToggleGift}
			onEdit={handleEditGift}
			onDelete={(giftId: string) => handleDeleteGift(gift)}
			loading={loading}
			theme={{
				accentColor: "#3b82f6",
				hoverColor: "hover:bg-blue-50 dark:hover:bg-blue-900/20",
			}}
			borderColor="rgb(var(--color-blue-500))" // Blue border for Hanukkah
		/>
	);

	const renderCompletedGiftItem = (gift: HanukkahGift) => (
		<GiftCardItem
			key={gift.id}
			gift={gift}
			isCompleted={true}
			onToggle={handleToggleGift}
			onEdit={handleEditGift}
			onDelete={(giftId: string) => handleDeleteGift(gift)}
			loading={loading}
			theme={{
				accentColor: "#3b82f6",
				hoverColor: "hover:bg-blue-50 dark:hover:bg-blue-900/20",
			}}
			borderColor="rgb(var(--color-blue-500))" // Blue border for Hanukkah
		/>
	);

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
		{
			id: "description",
			type: "textarea" as const,
			placeholder: "Description",
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

	return (
		<div className="min-h-screen hanukkah-gifts-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Hanukkah Gift List"
				backHref="/hanukkah"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort gifts"
				error={error}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Budget Display */}
				<BudgetDisplay holiday="Hanukkah" />

				<AddButton title="Gift" onClick={openForm} color="blue" />
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
					emptyMessage="All gifts completed! 🕯️"
					completedMessage=""
					renderItem={renderGiftItem}
				/>

				<TaskSection
					title="Completed"
					items={completedGifts}
					isCompleted={true}
					emptyMessage="No completed gifts yet."
					completedMessage="No completed gifts yet. Start checking off your gifts to see them here! 🕯️"
					renderItem={renderCompletedGiftItem}
				/>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showFormModal}
				title={selectedGift ? "Edit Gift" : "Add New Gift"}
				fields={formFields}
				initialValues={selectedGift || {}}
				onSubmit={selectedGift ? handleUpdateGift : handleAddGift}
				onClose={closeForm}
				loading={loading}
				submitText={selectedGift ? "Update Gift" : "Add Gift"}
				cancelText="Cancel"
				cardClassName="card"
				submitButtonColor="#3b82f6"
				showAddressBook={true}
				contacts={contacts}
			/>

			{/* Delete Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				title="Confirm Delete"
				message="Are you sure you want to delete this gift? This action cannot be undone."
				itemName={giftToDelete?.name}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={loading}
				cardClassName="card"
				confirmText="Delete"
				cancelText="Cancel"
				confirmButtonColor="#ef4444"
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
