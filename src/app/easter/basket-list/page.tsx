"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import { useFormModalMutation } from "@/hooks/useFormModalMutation";
import {
	useGetGiftsQuery,
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
import {
	selectHolidayPreferences,
	selectHomeInitialized,
	selectHomeData,
	updateGiftInHomeData,
	addGiftToHomeData,
	removeGiftFromHomeData,
} from "@/store/slices/homeSlice";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";
import { getHolidayDataFromRedux } from "@/utils/holidayData";

import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";

type SortOption = "recipient" | "store" | "price-high" | "price-low" | "none";

export default function EasterBasketListPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);
	const {
		holidayId,
		mutation,
		isLoading: mutationLoading,
		error: mutationError,
		auth0User,
	} = useFormModalMutation();

	// Get Redux selectors
	const holidayPreferences = useAppSelector(selectHolidayPreferences);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const homeData = useAppSelector(selectHomeData);

	// Get current Redux state for skip logic
	const currentState = useAppSelector((state: any) => state);

	// Get holiday ID for Easter - try to resolve from home data, fallback to route-based resolution
	const resolvedHolidayId = homeInitialized
		? getHolidayIdFromRoute("/easter", holidayPreferences)
		: getHolidayIdFromRoute("/easter", holidayPreferences); // Allow fallback for cold entry

	// Get holiday data from Redux if available
	const holidayData = getHolidayDataFromRedux(resolvedHolidayId, currentState);

	// Use Redux data first, fallback to RTK Query if needed
	const gifts = holidayData?.gifts || [];

	// Fetch gifts using RTK Query as fallback (only when Redux data is not available)
	const {
		data: fallbackGifts = [],
		isLoading: loading,
		error,
		isSuccess: initialized,
	} = useGetGiftsQuery(
		{ holidayId: resolvedHolidayId || "", auth0User },
		{
			skip: !resolvedHolidayId || !auth0User || !!holidayData?.gifts, // Skip if we have Redux data
		}
	);

	// Use Redux data if available, otherwise use fallback from RTK Query
	const finalGifts = gifts.length > 0 ? gifts : fallbackGifts;

	// Update gift mutation
	const [updateGift, { isLoading: updateLoading }] = useUpdateGiftMutation();

	// Edit and delete mutations
	const [editGift, { isLoading: editLoading }] = useEditGiftMutation();
	const [deleteGift, { isLoading: deleteLoading }] = useDeleteGiftMutation();

	// Helper function to update Redux state after gift operations
	const updateGiftInRedux = (
		giftData: any,
		operation: "add" | "update" | "delete"
	) => {
		if (!resolvedHolidayId) return;

		switch (operation) {
			case "add":
				dispatch(
					addGiftToHomeData({ holidayId: resolvedHolidayId, gift: giftData })
				);
				break;
			case "update":
				dispatch(
					updateGiftInHomeData({
						holidayId: resolvedHolidayId,
						giftId: giftData.id,
						updates: giftData,
					})
				);
				break;
			case "delete":
				dispatch(
					removeGiftFromHomeData({
						holidayId: resolvedHolidayId,
						giftId: giftData.id,
					})
				);
				break;
		}
	};

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showSortModal, setShowSortModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showFormModal, setShowFormModal] = useState(false);
	const [selectedGift, setSelectedGift] = useState<any>(null);
	const [giftToDelete, setGiftToDelete] = useState<any>(null);

	// Get home data to check if contacts are available (already declared above)

	useEffect(() => {
		// Fetch contacts for address book functionality
		// Only fetch if home data is initialized (which contains contacts)
		if (homeInitialized) {
			dispatch(fetchContacts());
		}
	}, [dispatch, homeInitialized]);

	async function handleAddGift(values: Record<string, any>) {
		if (!values.giftName?.trim() || !values.recipient?.trim()) return;
		if (!resolvedHolidayId || !mutation) return;

		try {
			const payload = transformGiftPayload(values, contacts);
			const newGift = await mutation({
				holidayId: resolvedHolidayId,
				payload,
				auth0User,
			}).unwrap();

			// Update Redux state immediately
			updateGiftInRedux(newGift, "add");

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
		if (!resolvedHolidayId) return;

		try {
			// Find the current gift to get its completion status
			const currentGift = finalGifts.find((gift: any) => gift.id === giftId);
			if (!currentGift) return;

			// Toggle the completion status
			const newIsCompleted = !currentGift.isCompleted;

			// Update the gift in the database
			await updateGift({
				holidayId: resolvedHolidayId,
				giftId,
				isCompleted: newIsCompleted,
				auth0User,
			}).unwrap();

			// Update Redux state immediately
			updateGiftInRedux(
				{ ...currentGift, isCompleted: newIsCompleted },
				"update"
			);
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
		if (!giftToDelete || !resolvedHolidayId) return;

		try {
			await deleteGift({
				holidayId: resolvedHolidayId,
				giftId: giftToDelete.id,
				auth0User,
			}).unwrap();

			// Update Redux state immediately
			updateGiftInRedux(giftToDelete, "delete");

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
		if (!selectedGift || !resolvedHolidayId) return;

		try {
			const payload = transformGiftPayload(values, contacts);
			const updatedGift = await editGift({
				holidayId: resolvedHolidayId,
				giftId: selectedGift.id,
				payload,
				auth0User,
			}).unwrap();

			// Update Redux state immediately
			updateGiftInRedux(updatedGift, "update");

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

	if (loading && !initialized) {
		return (
			<div className="min-h-screen easter-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading basket items...
					</p>
				</div>
			</div>
		);
	}

	const sortedGifts = sortGifts(finalGifts || []);
	const incompleteGifts = sortedGifts.filter((gift: any) => !gift.isCompleted);
	const completedGifts = sortedGifts.filter((gift: any) => gift.isCompleted);

	const renderGiftItem = (gift: any) => (
		<GiftCardItem
			key={gift.id}
			gift={gift}
			isCompleted={false}
			onToggle={handleToggleGift}
			onEdit={handleEditGift}
			onDelete={(giftId: string) => handleDeleteGift(gift)}
			loading={loading || updateLoading}
			theme={{
				accentColor: "#a855f7", // Purple for Easter
			}}
			borderColor="rgb(var(--color-purple-500))" // Purple border for Easter
			gamifiedBackgroundColor="bg-gradient-to-br from-purple-300 to-purple-500"
		/>
	);

	const renderCompletedGiftItem = (gift: any) => (
		<GiftCardItem
			key={gift.id}
			gift={gift}
			isCompleted={true}
			onToggle={handleToggleGift}
			onEdit={handleEditGift}
			onDelete={(giftId: string) => handleDeleteGift(gift)}
			loading={loading || updateLoading}
			theme={{
				accentColor: "#a855f7", // Purple for Easter
			}}
			borderColor="rgb(var(--color-purple-500))" // Purple border for Easter
			gamifiedBackgroundColor="bg-gradient-to-br from-purple-300 to-purple-500"
		/>
	);

	// Form fields configuration
	const formFields = [
		{
			id: "recipient",
			type: "text" as const,
			placeholder: "Recipient (select from address book)*",
			required: true,
		},
		{
			id: "giftName",
			type: "text" as const,
			placeholder: "Basket Item Name*",
			required: true,
		},
		{
			id: "description",
			type: "text" as const,
			placeholder: "Description",
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
			id: "product_link",
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
		if (!selectedGift) return {};

		return {
			recipient: selectedGift.recipient || "",
			giftName: selectedGift.name,
			description: selectedGift.description || "",
			price: selectedGift.price.toString(),
			store: selectedGift.store || "",
			product_link: selectedGift.productLink || "",
			notes: selectedGift.notes || "",
		};
	};

	return (
		<div className="min-h-screen easter-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Easter Basket"
				backHref="/easter"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort basket items"
				description="Keep track of Easter basket items and purchases!"
				holidayColor="purple-500"
				error={error ? "Error loading basket items" : undefined}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Budget Display */}
				<BudgetDisplay
					holiday="Easter"
					holidayColor="bg-gradient-to-br from-purple-300 to-purple-500"
					holidayId={resolvedHolidayId || undefined}
				/>

				<AddButton title="Basket Item" onClick={openForm} color="purple" />
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
					emptyMessage="All basket items completed! 🎉"
					completedMessage=""
					renderItem={renderGiftItem}
				/>

				<TaskSection
					title="Completed"
					items={completedGifts}
					isCompleted={true}
					emptyMessage="No completed basket items yet."
					completedMessage=""
					renderItem={renderCompletedGiftItem}
				/>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showFormModal}
				title={selectedGift ? "Edit Basket Item" : "Add New Basket Item"}
				fields={formFields}
				initialValues={getInitialValues()}
				onSubmit={selectedGift ? handleUpdateGift : handleAddGift}
				onClose={closeForm}
				loading={mutationLoading || editLoading}
				submitText={selectedGift ? "Update Item" : "Add Item"}
				cancelText="Cancel"
				cardClassName="card"
				submitButtonColor="#a855f7"
				showAddressBook={true}
				contacts={contacts}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				title="Delete Basket Item"
				message={`Are you sure you want to delete "${giftToDelete?.name}"? This action cannot be undone.`}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={deleteLoading}
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
				title="Sort Basket Items"
			/>
		</div>
	);
}
