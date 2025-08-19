"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchBirthdayGifts,
	addBirthdayGift,
	updateBirthdayGift,
	deleteBirthdayGift,
	toggleBirthdayGiftCompletion,
	BirthdayGift,
} from "@/store/slices/birthday/birthdayGiftListSlice";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import SortModal from "@/components/modals/SortModal";
import GiftCardItem from "@/components/cards/gift/GiftCardItem";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";
import { BudgetDisplay } from "@/components/common/BudgetDisplay";

export default function BirthdayGiftListPage() {
	const dispatch = useAppDispatch();
	const { gifts, loading, error, initialized } = useAppSelector(
		(state: any) => state.birthdayGiftList
	);
	const { contacts } = useAppSelector((state: any) => state.addressBook);
	const holidayPreferences = useAppSelector(
		(state: any) => state.home.data?.holidayPreferences || []
	);

	// Get Birthday holiday ID from preferences
	const birthdayPreference = holidayPreferences.find(
		(pref) => pref.holiday === "Birthday"
	);
	const birthdayHolidayId = birthdayPreference?.holidayId;

	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		giftId: string | null;
	}>({
		show: false,
		giftId: null,
	});
	const [showForm, setShowForm] = useState(false);
	const [editingGift, setEditingGift] = useState<BirthdayGift | null>(null);
	const [sortBy, setSortBy] = useState<string>("none");
	const [showSortModal, setShowSortModal] = useState(false);

	useEffect(() => {
		// Fetch gifts and contacts when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchBirthdayGifts());
		}
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch, initialized]);

	function handleAddGift(formValues: Record<string, any>) {
		if (!formValues.description || (typeof formValues.description === "string" && !formValues.description.trim()) || !formValues.recipient || (typeof formValues.recipient === "string" && !formValues.recipient.trim()))
			return;

		if (editingGift) {
			// Update existing gift
			const updatedGift: BirthdayGift = {
				...editingGift,
				name: formValues.description,
				description: formValues.description || undefined,
				price: parseFloat(formValues.price) || 0,
				recipient: formValues.recipient,
				store: formValues.store || undefined,
				productLink: formValues.productLink || undefined,
				notes: formValues.notes || undefined,
			};
			dispatch(updateBirthdayGift(updatedGift));
			setEditingGift(null);
		} else {
			// Add new gift
			const newGift: Omit<BirthdayGift, "id" | "createdAt" | "updatedAt"> = {
				name: formValues.description,
				description: formValues.description || undefined,
				price: parseFloat(formValues.price) || 0,
				recipient: formValues.recipient,
				store: formValues.store || undefined,
				productLink: formValues.productLink || undefined,
				notes: formValues.notes || undefined,
				isCompleted: false,
			};
			dispatch(addBirthdayGift(newGift));
		}

		setShowForm(false);
	}

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
		setEditingGift(null);
	}

	function handleToggleGift(giftId: string) {
		dispatch(toggleBirthdayGiftCompletion(giftId));
	}

	function handleEditGift(gift: BirthdayGift) {
		setEditingGift(gift);
		setShowForm(true);
	}

	function handleDeleteGift(giftId: string) {
		setDeleteConfirm({ show: true, giftId });
	}

	function confirmDelete() {
		if (deleteConfirm.giftId) {
			dispatch(deleteBirthdayGift(deleteConfirm.giftId));
			setDeleteConfirm({ show: false, giftId: null });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, giftId: null });
	}

	function sortGifts(giftsToSort: BirthdayGift[]): BirthdayGift[] {
		switch (sortBy) {
			case "name":
				return [...giftsToSort].sort((a, b) => a.name.localeCompare(b.name));
			case "recipient":
				return [...giftsToSort].sort((a, b) =>
					a.recipient.localeCompare(b.recipient)
				);
			case "price":
				return [...giftsToSort].sort((a, b) => b.price - a.price);
			case "date-created":
				return [...giftsToSort].sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
			default:
				return giftsToSort;
		}
	}

	if (loading && !initialized) {
		return (
			<div className="min-h-screen birthday-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading gifts...</p>
				</div>
			</div>
		);
	}

	const sortedGifts = sortGifts(gifts);
	const incompleteGifts = sortedGifts.filter(
		(gift: BirthdayGift) => !gift.isCompleted
	);
	const completedGifts = sortedGifts.filter(
		(gift: BirthdayGift) => gift.isCompleted
	);

	return (
		<div className="min-h-screen birthday-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Gift List"
				backHref="/birthday"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort gifts"
				description="Keep track of gift ideas and purchases!"
				holidayColor="yellow-500"
				error={error}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				<BudgetDisplay
					holiday="Birthday"
					holidayColor="bg-gradient-to-br from-yellow-300 to-yellow-500"
					holidayId={birthdayHolidayId}
				/>
				<AddButton title="Gift" onClick={openForm} color="amber" />
				<div className="flex items-center justify-center">
					{sortBy !== "none" && (
						<div className="text-center text-sm text-gray-600 dark:text-gray-400">
							{sortBy === "name" && "Sorted by Name"}
							{sortBy === "recipient" && "Sorted by Recipient"}
							{sortBy === "price" && "Sorted by Price"}
							{sortBy === "date-created" && "Sorted by Date Created"}
						</div>
					)}
				</div>

				<TaskSection
					title="Incomplete"
					items={incompleteGifts}
					isCompleted={false}
					emptyMessage="All gifts completed! 🎉"
					completedMessage="All gifts completed! 🎉"
					renderItem={(gift: BirthdayGift) => (
						<GiftCardItem
							key={gift.id}
							gift={gift}
							onToggle={handleToggleGift}
							onEdit={(gift) => {
								handleEditGift(gift);
								setShowForm(true);
							}}
							onDelete={handleDeleteGift}
							loading={loading}
							theme={{
								accentColor: "#f59e0b", // Amber for Birthday
							}}
							borderColor="rgb(var(--color-amber-500))" // Amber border for Birthday
							gamifiedBackgroundColor="bg-gradient-to-br from-yellow-300 to-yellow-500"
						/>
					)}
				/>

				<TaskSection
					title="Completed"
					items={completedGifts}
					isCompleted={true}
					emptyMessage="No completed gifts yet."
					completedMessage="No completed gifts yet."
					renderItem={(gift: BirthdayGift) => (
						<GiftCardItem
							key={gift.id}
							gift={gift}
							onToggle={handleToggleGift}
							onEdit={(gift) => {
								handleEditGift(gift);
								setShowForm(true);
							}}
							onDelete={handleDeleteGift}
							loading={loading}
							theme={{
								accentColor: "#f59e0b", // Amber for Birthday
							}}
							borderColor="rgb(var(--color-amber-500))" // Amber border for Birthday
							gamifiedBackgroundColor="bg-gradient-to-br from-yellow-300 to-yellow-500"
						/>
					)}
				/>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showForm}
				title={editingGift ? "Edit Gift" : "Add New Gift"}
				fields={getFormConfig("gifts", editingGift ? "edit" : "add").fields}
				initialValues={
					editingGift
						? {
								description: editingGift.name,
								price: editingGift.price.toString(),
								recipient: editingGift.recipient,
								store: editingGift.store || "",
								productLink: editingGift.productLink || "",
								notes: editingGift.notes || "",
						  }
						: {}
				}
				onSubmit={handleAddGift}
				onClose={closeForm}
				loading={loading}
				submitText={
					loading
						? editingGift
							? "Updating..."
							: "Adding..."
						: editingGift
						? "Update Gift"
						: "Add Gift"
				}
				cancelText="Cancel"
				cardClassName="card"
				submitButtonColor="#f59e0b"
				showAddressBook={true}
				contacts={contacts}
				onAddressBookSelect={(contact) => {
					// The FormModal will handle the form values internally
				}}
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
				onSortChange={setSortBy}
				sortOptions={[
					{ value: "none", label: "None" },
					{ value: "name", label: "Name" },
					{ value: "recipient", label: "Recipient" },
					{ value: "price", label: "Price" },
					{ value: "date-created", label: "Date Created" },
				]}
				title="Sort Gifts"
			/>
		</div>
	);
}
