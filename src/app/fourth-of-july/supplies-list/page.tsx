"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import {
	selectHolidayPreferences,
	selectHomeInitialized,
	selectHomeData,
} from "@/store/selectors/home";
import { getHolidayDataFromRedux } from "@/utils/holidayData";
import {
	updateGiftInHomeData,
	addGiftToHomeData,
	removeGiftFromHomeData,
} from "@/store/slices/homeSlice";
import { useFormModalMutation } from "@/hooks/useFormModalMutation";
import {
	useUpdateGiftMutation,
	useEditGiftMutation,
	useDeleteGiftMutation,
} from "@/store/api";
import { transformGiftPayload } from "@/utils/formTransformers";
import { BudgetDisplay } from "@/components/common/BudgetDisplay";
import SortModal from "@/components/modals/SortModal";
import GiftCardItem from "@/components/cards/gift/GiftCardItem";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import { getFormConfig } from "@/config/formConfigs";

import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";

type SortOption = "recipient" | "store" | "price-high" | "price-low" | "none";

export default function FourthOfJulySuppliesListPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);
	const {
		holidayId,
		mutation,
		isLoading: mutationLoading,
		error: mutationError,
		auth0User,
	} = useFormModalMutation();

	// Get current Redux state for skip logic
	const currentState = useAppSelector((state: any) => state);

	// Get home data and holiday data from Redux
	const homeData = useAppSelector(selectHomeData);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const holidayData = getHolidayDataFromRedux(holidayId, currentState);

	// Helper function to update Redux state after gift operations
	const updateGiftInRedux = (
		giftData: any,
		operation: "add" | "update" | "delete"
	) => {
		if (!holidayId) return;

		switch (operation) {
			case "add":
				dispatch(addGiftToHomeData({ holidayId, gift: giftData }));
				break;
			case "update":
				dispatch(
					updateGiftInHomeData({
						holidayId,
						giftId: giftData.id,
						updates: giftData,
					})
				);
				break;
			case "delete":
				dispatch(
					removeGiftFromHomeData({
						holidayId,
						giftId: giftData.id,
					})
				);
				break;
		}
	};

	// Use only Redux data - no GET API calls on holiday pages
	const gifts = holidayData?.gifts || [];
	const loading = !homeInitialized;
	const error = null;
	const initialized = homeInitialized;

	// Update gift mutation
	const [updateGift, { isLoading: updateLoading }] = useUpdateGiftMutation();

	// Edit and delete mutations
	const [editGift, { isLoading: editLoading }] = useEditGiftMutation();
	const [deleteGift, { isLoading: deleteLoading }] = useDeleteGiftMutation();

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showSortModal, setShowSortModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showFormModal, setShowFormModal] = useState(false);
	const [selectedGift, setSelectedGift] = useState<any>(null);
	const [giftToDelete, setGiftToDelete] = useState<any>(null);

	useEffect(() => {
		// Fetch contacts for address book functionality
		// Only fetch if home data is initialized (which contains contacts)
		if (homeInitialized) {
			dispatch(fetchContacts());
		}
	}, [dispatch, homeInitialized]);

	async function handleAddGift(values: Record<string, any>) {
		if (!values.giftName?.trim() || !values.recipient?.trim()) return;
		if (!holidayId || !mutation) return;

		try {
			const payload = transformGiftPayload(values, contacts);
			const result = await mutation({ holidayId, payload, auth0User }).unwrap();

			// Update Redux state directly
			updateGiftInRedux(result, "add");

			setShowFormModal(false);
		} catch (error) {
			console.error("Error creating gift:", error);
			// Show user-friendly error message
			if (error instanceof Error && error.message.includes("address book")) {
				alert("Please select a recipient from the address book");
			} else {
				alert("Error creating gift. Please try again.");
			}
		}
	}

	function openForm() {
		setShowFormModal(true);
		setSelectedGift(null);
	}

	function closeForm() {
		setShowFormModal(false);
		setSelectedGift(null);
	}

	async function handleToggleGift(giftId: string) {
		if (!holidayId) return;

		try {
			// Find the current gift to get its completion status from Redux data
			const currentGift = gifts.find((gift: any) => gift.id === giftId);
			if (!currentGift) return;

			// Toggle the completion status
			const newIsCompleted = !currentGift.isCompleted;

			// Update the gift in the database
			await updateGift({
				holidayId: holidayId || "",
				giftId,
				isCompleted: newIsCompleted,
				auth0User,
			}).unwrap();

			// Update Redux state directly
			updateGiftInRedux({ id: giftId, isCompleted: newIsCompleted }, "update");
		} catch (error) {
			console.error("Error toggling gift:", error);
			// Handle error (could show a toast notification)
		}
	}

	async function handleDeleteGift(gift: any) {
		setGiftToDelete(gift);
		setShowDeleteModal(true);
	}

	async function confirmDelete() {
		if (!giftToDelete || !holidayId) return;

		try {
			await deleteGift({
				holidayId,
				giftId: giftToDelete.id,
				auth0User,
			}).unwrap();

			// Update Redux state directly
			updateGiftInRedux({ id: giftToDelete.id }, "delete");

			setShowDeleteModal(false);
			setGiftToDelete(null);
		} catch (error) {
			console.error("Error deleting gift:", error);
		}
	}

	function cancelDelete() {
		setShowDeleteModal(false);
		setGiftToDelete(null);
	}

	async function handleEditGift(gift: any) {
		setSelectedGift(gift);
		setShowFormModal(true);
	}

	async function handleUpdateGift(values: Record<string, any>) {
		if (!selectedGift || !holidayId) return;

		try {
			const payload = transformGiftPayload(values, contacts);
			const result = await editGift({
				holidayId,
				giftId: selectedGift.id,
				payload,
				auth0User,
			}).unwrap();

			// Update Redux state directly
			updateGiftInRedux(result, "update");

			setShowFormModal(false);
			setSelectedGift(null);
		} catch (error) {
			console.error("Error updating gift:", error);
			// Show user-friendly error message
			if (error instanceof Error && error.message.includes("address book")) {
				alert("Please select a recipient from the address book");
			} else {
				alert("Error updating gift. Please try again.");
			}
		}
	}

	function sortGifts(giftsToSort: any[]): any[] {
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

	// Show loading only if home data is not initialized
	if (!homeInitialized) {
		return (
			<div className="min-h-screen fourth-of-july-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading supplies...
					</p>
				</div>
			</div>
		);
	}

	const sortedGifts = sortGifts(gifts);
	const incompleteGifts = sortedGifts.filter((gift: any) => !gift.isCompleted);
	const completedGifts = sortedGifts.filter((gift: any) => gift.isCompleted);

	return (
		<div className="min-h-screen fourth-of-july-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Supplies"
				backHref="/fourth-of-july"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort supplies"
				description="Keep track of all your Fourth of July supplies!"
				holidayColor="red-500"
				error={error ? "Error loading supplies" : undefined}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Budget Display */}
				<BudgetDisplay
					holiday="Fourth of July"
					holidayColor="bg-gradient-to-br from-red-400 to-red-600"
					holidayId={holidayId || undefined}
				/>

				<AddButton title="Supply Item" onClick={openForm} color="red" />

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
					emptyMessage="All supplies completed! 🎉"
					completedMessage=""
					renderItem={(gift: any) => (
						<GiftCardItem
							
							gift={gift}
							isCompleted={false}
							onToggle={handleToggleGift}
							onEdit={handleEditGift}
							onDelete={(giftId: string) => handleDeleteGift(gift)}
							loading={loading || updateLoading}
							theme={{
								accentColor: "#dc2626",
							}}
							borderColor="rgb(var(--color-red-500))"
							gamifiedBackgroundColor="bg-gradient-to-br from-red-400 to-red-600"
						/>
					)}
				/>

				<TaskSection
					title="Completed"
					items={completedGifts}
					isCompleted={true}
					emptyMessage="No completed supplies yet."
					completedMessage=""
					renderItem={(gift: any) => (
						<GiftCardItem
							
							gift={gift}
							isCompleted={true}
							onToggle={handleToggleGift}
							onEdit={handleEditGift}
							onDelete={(giftId: string) => handleDeleteGift(gift)}
							loading={loading || updateLoading}
							theme={{
								accentColor: "#dc2626",
							}}
							borderColor="rgb(var(--color-red-500))"
							gamifiedBackgroundColor="bg-gradient-to-br from-red-400 to-red-600"
						/>
					)}
				/>

				{/* Form Modal */}
				<FormModal
					isOpen={showFormModal}
					title={selectedGift ? "Edit Supply Item" : "Add New Supply Item"}
					fields={
						getFormConfig("supplies", selectedGift ? "edit" : "add").fields
					}
					initialValues={
						selectedGift
							? {
									giftName: selectedGift.name,
									description: selectedGift.description,
									price: selectedGift.price,
									recipient: selectedGift.recipient,
									store: selectedGift.store,
									product_link: selectedGift.product_link,
									notes: selectedGift.notes,
							  }
							: undefined
					}
					onSubmit={selectedGift ? handleUpdateGift : handleAddGift}
					onClose={closeForm}
					loading={mutationLoading || editLoading}
					submitText={selectedGift ? "Update Supply Item" : "Add Supply Item"}
					cancelText="Cancel"
					cardClassName="card"
					submitButtonColor="#dc2626"
					showAddressBook={true}
					contacts={contacts}
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
					title="Sort Supplies"
				/>

				{/* Delete Modal */}
				<DeleteModal
					isOpen={showDeleteModal}
					title="Delete Supply Item"
					message={`Are you sure you want to delete "${giftToDelete?.name}"? This action cannot be undone.`}
					onConfirm={confirmDelete}
					onCancel={cancelDelete}
					loading={deleteLoading}
				/>
			</main>
		</div>
	);
}
