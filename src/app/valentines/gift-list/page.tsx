"use client";

import { useState, useEffect } from "react";
import {
	selectHolidayPreferences,
	selectHomeInitialized,
	selectHomeData,
} from "@/store/selectors/home";
import { getHolidayDataFromRedux } from "@/utils/holidayData";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts } from "@/store/slices/addressBookSlice";
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
import DeleteModal from "@/components/modals/DeleteModal";
import FormModal from "@/components/modals/FormModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import GiftCardItem from "@/components/cards/gift/GiftCardItem";

type SortOption = "recipient" | "store" | "price-high" | "price-low" | "none";

export default function ValentinesGiftListPage() {
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
			const result = await mutation({
				holidayId,
				payload,
				auth0User,
			}).unwrap();

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

	async function handleToggleGift(giftId: string) {
		if (!holidayId) return;

		try {
			// Find the current gift to get its completion status from Redux data
			const currentGift = displayGifts.find((gift: any) => gift.id === giftId);
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

	function openForm() {
		setShowFormModal(true);
		setSelectedGift(null);
	}

	function closeForm() {
		setShowFormModal(false);
		setSelectedGift(null);
	}

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

	function sortGifts(giftsToSort: any[]): any[] {
		switch (sortBy) {
			case "recipient":
				return [...giftsToSort].sort((a, b) =>
					a.recipient.localeCompare(b.recipient)
				);
			case "store":
				return [...giftsToSort].sort((a, b) => {
					const storeA = a.store || "";
					const storeB = b.store || "";
					return storeA.localeCompare(storeB);
				});
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
			<div className="min-h-screen valentines-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading gifts...</p>
				</div>
			</div>
		);
	}

	// Use only Redux data - no fallback to API calls
	const displayGifts =
		holidayData && homeInitialized && holidayData.gifts
			? holidayData.gifts
			: [];

	const sortedGifts = sortGifts(displayGifts || []);
	const incompleteGifts = sortedGifts.filter((gift) => !gift.isCompleted);
	const completedGifts = sortedGifts.filter((gift) => gift.isCompleted);

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
			placeholder: "Gift Name*",
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

	const renderGiftItem = (gift: any) => (
		<GiftCardItem
			
			gift={gift}
			isCompleted={false}
			onToggle={handleToggleGift}
			onEdit={handleEditGift}
			onDelete={(giftId: string) => handleDeleteGift(gift)}
			loading={updateLoading}
			theme={{
				accentColor: "#ec4899", // Pink for Valentine's Day
			}}
			borderColor="rgb(var(--color-pink-500))" // Pink border for Valentine's Day
			gamifiedBackgroundColor="bg-gradient-to-br from-pink-300 to-pink-500"
		/>
	);

	const renderCompletedGiftItem = (gift: any) => (
		<GiftCardItem
			
			gift={gift}
			isCompleted={true}
			onToggle={handleToggleGift}
			onEdit={handleEditGift}
			onDelete={(giftId: string) => handleDeleteGift(gift)}
			loading={updateLoading}
			theme={{
				accentColor: "#ec4899", // Pink for Valentine's Day
			}}
			borderColor="rgb(var(--color-pink-500))" // Pink border for Valentine's Day
			gamifiedBackgroundColor="bg-gradient-to-br from-pink-300 to-pink-500"
		/>
	);

	return (
		<div className="min-h-screen valentines-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Gift List"
				backHref="/valentines"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort gifts"
				description="Keep track of gift ideas and purchases!"
				holidayColor="pink-500"
				error={undefined}
			/>

			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Budget Display */}
				{holidayId && (
					<BudgetDisplay
						holiday="Valentine's Day"
						holidayColor="bg-gradient-to-br from-pink-300 to-pink-500"
						holidayId={holidayId}
					/>
				)}
				{!holidayId && (
					<div className="text-center text-gray-500 p-4">
						Loading budget information...
					</div>
				)}

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
					emptyMessage="All gifts completed! 💝"
					completedMessage=""
					renderItem={renderGiftItem}
					cardClassName="card-valentines"
					borderColor="#ec4899"
				/>

				<TaskSection
					title="Completed"
					items={completedGifts}
					isCompleted={true}
					emptyMessage=""
					completedMessage="No completed gifts yet."
					renderItem={renderGiftItem}
					cardClassName="card-valentines"
					borderColor="#ec4899"
				/>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showFormModal}
				title={selectedGift ? "Edit Gift" : "Add New Gift"}
				fields={formFields}
				initialValues={getInitialValues()}
				onSubmit={selectedGift ? handleUpdateGift : handleAddGift}
				onClose={closeForm}
				loading={mutationLoading || editLoading}
				submitText={selectedGift ? "Update Gift" : "Add Gift"}
				cancelText="Cancel"
				cardClassName="card"
				submitButtonColor="#ec4899"
				showAddressBook={true}
				contacts={contacts}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				title="Confirm Delete"
				message="Are you sure you want to delete this gift? This action cannot be undone."
				onConfirm={confirmDelete}
				onCancel={() => {
					setShowDeleteModal(false);
					setGiftToDelete(null);
				}}
				loading={deleteLoading}
				cardClassName="card card-valentines"
				confirmButtonColor="#ec4899"
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
