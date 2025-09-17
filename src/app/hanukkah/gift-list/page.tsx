"use client";

import { useState, useEffect } from "react";
import {
	selectHolidayPreferences,
	selectHomeInitialized,
	selectHomeData,
} from "@/store/selectors/home";
import { shouldSkipHolidayQueryWithColdEntry } from "@/utils/holidayData";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";
import { getHolidayDataFromRedux } from "@/utils/holidayData";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import {
	addGiftToHomeData,
	updateGiftInHomeData,
	removeGiftFromHomeData,
} from "@/store/slices/homeSlice";
import { BudgetDisplay } from "@/components/common/BudgetDisplay";
import SortModal from "@/components/modals/SortModal";
import DeleteModal from "@/components/modals/DeleteModal";
import FormModal from "@/components/modals/FormModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import GiftCardItem from "@/components/cards/gift/GiftCardItem";
import { useFormModalMutation } from "@/hooks/useFormModalMutation";
import {
	useGetGiftsQuery,
	useUpdateGiftMutation,
	useEditGiftMutation,
	useDeleteGiftMutation,
} from "@/store/api";
import { transformGiftPayload } from "@/utils/formTransformers";

type SortOption = "recipient" | "store" | "price-high" | "price-low" | "none";

export default function HanukkahGiftListPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);
	// Address book integration and optimistic updates added

	// Get current Redux state for skip logic
	const currentState = useAppSelector((state: any) => state);

	// Get home data and holiday data from Redux
	const homeData = useAppSelector(selectHomeData);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const holidayPreferences = useAppSelector(selectHolidayPreferences);

	const {
		holidayId,
		mutation,
		isLoading: mutationLoading,
		error: mutationError,
		auth0User,
	} = useFormModalMutation();

	// Get holiday data from Redux
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
				dispatch(removeGiftFromHomeData({ holidayId, giftId: giftData.id }));
				break;
		}
	};

	// Use Redux data instead of RTK Query
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
	const [showForm, setShowForm] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedGift, setSelectedGift] = useState<any>(null);
	const [giftToDelete, setGiftToDelete] = useState<any>(null);

	useEffect(() => {
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch]);

	async function handleAddGift(values: Record<string, any>) {
		if (!values.giftName?.trim() || !values.recipient?.trim()) return;
		if (!holidayId || !mutation) return;

		try {
			const payload = transformGiftPayload(values, contacts);
			const result = await mutation({ holidayId, payload, auth0User }).unwrap();

			// Update Redux state directly for optimistic updates
			updateGiftInRedux(result, "add");

			setShowForm(false);
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
		setShowForm(true);
		setSelectedGift(null);
	}

	function closeForm() {
		setShowForm(false);
		setSelectedGift(null);
	}

	async function handleToggleGift(giftId: string) {
		if (!holidayId) return;

		try {
			// Find the current gift to get its completion status
			const currentGift = gifts.find((gift: any) => gift.id === giftId);
			if (!currentGift) return;

			// Toggle the completion status
			const newIsCompleted = !currentGift.isCompleted;

			// Optimistically update Redux state first
			updateGiftInRedux({ id: giftId, isCompleted: newIsCompleted }, "update");

			// Update the gift in the database
			await updateGift({
				holidayId: holidayId || "",
				giftId,
				isCompleted: newIsCompleted,
				auth0User,
			}).unwrap();
		} catch (error) {
			console.error("Error toggling gift:", error);
			// Revert optimistic update on error
			const currentGift = gifts.find((gift: any) => gift.id === giftId);
			if (currentGift) {
				updateGiftInRedux(
					{ id: giftId, isCompleted: currentGift.isCompleted },
					"update"
				);
			}
		}
	}

	async function handleDeleteGift(gift: any) {
		setGiftToDelete(gift);
		setShowDeleteModal(true);
	}

	async function confirmDelete() {
		if (!giftToDelete || !holidayId) return;

		try {
			// Optimistically update Redux state first
			updateGiftInRedux({ id: giftToDelete.id }, "delete");

			await deleteGift({
				holidayId,
				giftId: giftToDelete.id,
				auth0User,
			}).unwrap();

			setShowDeleteModal(false);
			setGiftToDelete(null);
		} catch (error) {
			console.error("Error deleting gift:", error);
			// Revert optimistic update on error - re-add the gift
			updateGiftInRedux(giftToDelete, "add");
		}
	}

	function cancelDelete() {
		setShowDeleteModal(false);
		setGiftToDelete(null);
	}

	async function handleEditGift(gift: any) {
		setSelectedGift(gift);
		setShowForm(true);
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

			// Update Redux state directly for optimistic updates
			updateGiftInRedux(result, "update");

			setShowForm(false);
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
	const incompleteGifts = sortedGifts.filter((gift: any) => !gift.isCompleted);
	const completedGifts = sortedGifts.filter((gift: any) => gift.isCompleted);

	return (
		<div className="min-h-screen hanukkah-gifts-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Hanukkah Gift List"
				backHref="/hanukkah"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort gifts"
				description="Track your Hanukkah gift ideas!"
				holidayColor="blue-500"
				error={error ? "API Error" : undefined}
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
					renderItem={(gift: any) => (
						<GiftCardItem
							
							gift={gift}
							isCompleted={false}
							onToggle={handleToggleGift}
							onEdit={handleEditGift}
							onDelete={handleDeleteGift}
							loading={loading || updateLoading}
							theme={{
								accentColor: "#3b82f6", // Blue for Hanukkah
							}}
							borderColor="rgb(var(--color-blue-500))" // Blue border for Hanukkah
							gamifiedBackgroundColor="bg-gradient-to-br from-blue-400 to-blue-600"
						/>
					)}
				/>

				<TaskSection
					title="Completed"
					items={completedGifts}
					isCompleted={true}
					emptyMessage="No completed gifts yet."
					completedMessage="No completed gifts yet."
					renderItem={(gift: any) => (
						<GiftCardItem
							
							gift={gift}
							isCompleted={true}
							onToggle={handleToggleGift}
							onEdit={handleEditGift}
							onDelete={handleDeleteGift}
							loading={loading || updateLoading}
							theme={{
								accentColor: "#3b82f6", // Blue for Hanukkah
							}}
							borderColor="rgb(var(--color-blue-500))" // Blue border for Hanukkah
							gamifiedBackgroundColor="bg-gradient-to-br from-blue-400 to-blue-600"
						/>
					)}
				/>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showForm}
				title={selectedGift ? "Edit Gift" : "Add New Gift"}
				fields={[
					{
						id: "recipient",
						type: "text",
						placeholder: "Recipient (select from address book)*",
						required: true,
					},
					{
						id: "giftName",
						type: "text",
						placeholder: "Gift Name*",
						required: true,
					},
					{
						id: "description",
						type: "text",
						placeholder: "Description",
					},
					{
						id: "price",
						type: "number",
						placeholder: "Price",
						step: "0.01",
					},
					{
						id: "store",
						type: "text",
						placeholder: "Store",
					},
					{
						id: "product_link",
						type: "url",
						placeholder: "Product Link (optional)",
					},
					{
						id: "notes",
						type: "textarea",
						placeholder: "Notes",
						rows: 2,
					},
				]}
				initialValues={
					selectedGift
						? {
								recipient: selectedGift.recipient || "",
								giftName: selectedGift.name || "",
								description: selectedGift.description || "",
								price: selectedGift.price || "",
								store: selectedGift.store || "",
								product_link: selectedGift.product_link || "",
								notes: selectedGift.notes || "",
						  }
						: {
								recipient: "",
								giftName: "",
								description: "",
								price: "",
								store: "",
								product_link: "",
								notes: "",
						  }
				}
				onSubmit={selectedGift ? handleUpdateGift : handleAddGift}
				onClose={closeForm}
				loading={mutationLoading || editLoading}
				submitText={selectedGift ? "Update Gift" : "Add Gift"}
				cardClassName="card-gifts"
				showAddressBook={true}
				contacts={contacts}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				onCancel={cancelDelete}
				onConfirm={confirmDelete}
				title="Confirm Delete"
				message="Are you sure you want to delete this gift? This action cannot be undone."
				confirmText="Delete"
				cancelText="Cancel"
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
