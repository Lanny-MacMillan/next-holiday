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
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";

type SortOption = "recipient" | "store" | "price-high" | "price-low" | "none";

export default function KwanzaaGiftListPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);
	const {
		holidayId,
		mutation,
		isLoading: mutationLoading,
		error: mutationError,
		auth0User,
	} = useFormModalMutation();

	// Get holiday ID for Kwanzaa
	const holidayPreferences = useAppSelector(
		(state: any) => state.home.data?.holidayPreferences || []
	);
	const kwanzaaHolidayId = getHolidayIdFromRoute(
		"/kwanzaa",
		holidayPreferences
	);

	// Fetch gifts using RTK Query
	const {
		data: gifts = [],
		isLoading: loading,
		error,
		isSuccess: initialized,
	} = useGetGiftsQuery(
		{ holidayId: kwanzaaHolidayId || "", auth0User },
		{ skip: !kwanzaaHolidayId || !auth0User }
	);

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

	// Get home data to check if contacts are available
	const homeData = useAppSelector((state: any) => state.home.data);
	const homeInitialized = useAppSelector(
		(state: any) => state.home.initialized
	);

	useEffect(() => {
		// Fetch contacts for address book functionality
		// Only fetch if home data is initialized (which contains contacts)
		if (homeInitialized) {
			dispatch(fetchContacts());
		}
	}, [dispatch, homeInitialized]);

	async function handleAddGift(values: Record<string, any>) {
		if (!values.giftName?.trim() || !values.recipient?.trim()) return;
		if (!kwanzaaHolidayId || !mutation) return;

		try {
			const payload = transformGiftPayload(values, contacts);
			await mutation({
				holidayId: kwanzaaHolidayId,
				payload,
				auth0User,
			}).unwrap();
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
		if (!kwanzaaHolidayId) return;

		try {
			// Find the current gift to get its completion status
			const currentGift = gifts.find((gift: any) => gift.id === giftId);
			if (!currentGift) return;

			// Toggle the completion status
			const newIsCompleted = !currentGift.isCompleted;

			// Update the gift in the database
			await updateGift({
				holidayId: kwanzaaHolidayId || "",
				giftId,
				isCompleted: newIsCompleted,
				auth0User,
			}).unwrap();

			// The UI will automatically update due to RTK Query cache invalidation
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
		if (!giftToDelete || !kwanzaaHolidayId) return;

		try {
			await deleteGift({
				holidayId: kwanzaaHolidayId,
				giftId: giftToDelete.id,
				auth0User,
			}).unwrap();
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
		if (!selectedGift || !kwanzaaHolidayId) return;

		try {
			const payload = transformGiftPayload(values, contacts);
			await editGift({
				holidayId: kwanzaaHolidayId,
				giftId: selectedGift.id,
				payload,
				auth0User,
			}).unwrap();
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
			<div className="min-h-screen kwanzaa-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading gifts...</p>
				</div>
			</div>
		);
	}

	const sortedGifts = sortGifts(gifts || []);
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
			loading={loading}
			theme={{
				accentColor: "#dc2626", // Red for Kwanzaa
			}}
			borderColor="rgb(var(--color-red-500))" // Red border for Kwanzaa
			gamifiedBackgroundColor="bg-gradient-to-br from-red-400 to-red-600"
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
			loading={loading}
			theme={{
				accentColor: "#dc2626", // Red for Kwanzaa
			}}
			borderColor="rgb(var(--color-red-500))" // Red border for Kwanzaa
			gamifiedBackgroundColor="bg-gradient-to-br from-red-400 to-red-600"
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
		<div className="min-h-screen kwanzaa-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Gift List"
				backHref="/kwanzaa"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort gifts"
				description="Plan your Kwanzaa gift list with style!"
				holidayColor="red-500"
				error={error ? "Error loading gifts" : undefined}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Budget Display */}
				<BudgetDisplay
					holiday="Kwanzaa"
					holidayColor="bg-gradient-to-br from-red-400 to-red-600"
					holidayId={kwanzaaHolidayId || undefined}
				/>

				<AddButton title="Gift" onClick={openForm} color="red" />
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
				submitButtonColor="#dc2626"
				showAddressBook={true}
				contacts={contacts}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				title="Delete Gift"
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
				title="Sort Gifts"
			/>
		</div>
	);
}
