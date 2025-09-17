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
import {
	addGiftToHomeData,
	removeGiftFromHomeData,
	updateGiftInHomeData,
} from "@/store/slices/homeSlice";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";
import { getHolidayDataFromRedux } from "@/utils/holidayData";
import {
	useCreateGiftMutation,
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
import { useAuth0 } from "@auth0/auth0-react";

type SortOption = "recipient" | "store" | "price-high" | "price-low" | "none";

export default function NewYearSuppliesListPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);
	const { user: auth0User } = useAuth0();

	// Get Redux data
	const holidayPreferences = useAppSelector(selectHolidayPreferences);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const homeData = useAppSelector(selectHomeData);

	// Get holiday ID for New Year
	const holidayId = homeInitialized
		? getHolidayIdFromRoute("/new-year", holidayPreferences)
		: null;

	// Get current Redux state for holiday data
	const currentState = useAppSelector((state: any) => state);
	const holidayData = getHolidayDataFromRedux(holidayId, currentState);

	// Get gifts from Redux data
	const gifts = holidayData?.gifts || [];

	// Get mutations for CRUD operations
	const [createGift, createGiftState] = useCreateGiftMutation();
	const [updateGift, updateGiftState] = useUpdateGiftMutation();
	const [editGift, editGiftState] = useEditGiftMutation();
	const [deleteGift, deleteGiftState] = useDeleteGiftMutation();

	// Loading and error states
	const loading =
		createGiftState.isLoading ||
		updateGiftState.isLoading ||
		editGiftState.isLoading ||
		deleteGiftState.isLoading;
	const error =
		createGiftState.error ||
		updateGiftState.error ||
		editGiftState.error ||
		deleteGiftState.error;
	const initialized = homeInitialized;

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
		if (!holidayId || !auth0User) return;

		try {
			const payload = transformGiftPayload(values, contacts);
			const result = await createGift({
				holidayId,
				payload,
				auth0User,
			}).unwrap();

			// Add to Redux store immediately with normalized shape
			const normalizedGift = {
				id:
					(result as any)?.id ||
					(result as any)?._id ||
					(result as any)?.giftId,
				...payload,
				isCompleted: false,
				createdAt: (result as any)?.createdAt || new Date().toISOString(),
				updatedAt: (result as any)?.updatedAt || new Date().toISOString(),
			};

			dispatch(
				addGiftToHomeData({
					holidayId,
					gift: normalizedGift,
				})
			);

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
		if (!holidayId || !auth0User) return;

		try {
			// Find the current gift to get its completion status
			const currentGift = gifts.find((gift: any) => gift.id === giftId);
			if (!currentGift) return;

			// Toggle the completion status
			const newIsCompleted = !currentGift.isCompleted;

			// Update the gift in the database
			await updateGift({
				holidayId,
				giftId,
				isCompleted: newIsCompleted,
				auth0User,
			}).unwrap();

			// Update Redux store immediately
			dispatch(
				updateGiftInHomeData({
					holidayId,
					giftId,
					updates: {
						isCompleted: newIsCompleted,
						completedDate: newIsCompleted ? new Date().toISOString() : null,
					},
				})
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
		if (!giftToDelete || !holidayId || !auth0User) return;

		try {
			await deleteGift({
				holidayId,
				giftId: giftToDelete.id,
				auth0User,
			}).unwrap();

			// Remove from Redux store immediately
			dispatch(
				removeGiftFromHomeData({
					holidayId,
					giftId: giftToDelete.id,
				})
			);

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
		if (!selectedGift || !holidayId || !auth0User) return;

		try {
			const payload = transformGiftPayload(values, contacts);
			const result = await editGift({
				holidayId,
				giftId: selectedGift.id,
				payload,
				auth0User,
			}).unwrap();

			// Update Redux store immediately
			dispatch(
				updateGiftInHomeData({
					holidayId,
					giftId: selectedGift.id,
					updates: result,
				})
			);

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

	if (!initialized) {
		return (
			<div className="min-h-screen new-year-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
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
		<div className="min-h-screen new-year-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Supplies"
				backHref="/new-year"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Supplies"
				description="Keep track of all your Supplies!"
				holidayColor="yellow-500"
				error={error ? "Failed to load supplies" : null}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Budget Display */}
				{homeInitialized && (
					<BudgetDisplay
						holiday="New Year"
						holidayId={holidayId || undefined}
						holidayColor="bg-gradient-to-br from-yellow-400 to-yellow-600"
					/>
				)}

				<AddButton title="Supply Item" onClick={openForm} color="amber" />

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

				<div>
					<h2 className="font-semibold text-gray-900 dark:text-white mb-2">
						Incomplete ({incompleteGifts.length})
					</h2>
					<div className="card card-gifts rounded shadow">
						{incompleteGifts.length === 0 ? (
							<div className="px-4 py-3 text-gray-400 dark:text-gray-500 text-center">
								All supplies completed! 🎉
							</div>
						) : (
							<ul className="divide-y divide-gray-200 dark:divide-gray-700">
								{incompleteGifts.map((gift: any) => (
									<GiftCardItem
										key={
											gift.id || gift._id || `${gift.recipient}-${gift.name}`
										}
										gift={gift}
										isCompleted={gift.isCompleted}
										onToggle={() => handleToggleGift(gift.id)}
										onEdit={() => handleEditGift(gift)}
										onDelete={() => handleDeleteGift(gift)}
										loading={loading}
										theme={{
											accentColor: "#f59e0b",
											hoverColor:
												"hover:bg-amber-50 dark:hover:bg-amber-900/20",
										}}
										borderColor="#f59e0b"
									/>
								))}
							</ul>
						)}
					</div>
				</div>

				{completedGifts.length > 0 && (
					<div>
						<h2 className="font-semibold text-gray-900 dark:text-white mb-2">
							Completed ({completedGifts.length})
						</h2>
						<div className="card card-gifts rounded shadow">
							<ul className="divide-y divide-gray-200 dark:divide-gray-700">
								{completedGifts.map((gift: any) => (
									<GiftCardItem
										key={
											gift.id || gift._id || `${gift.recipient}-${gift.name}`
										}
										gift={gift}
										isCompleted={gift.isCompleted}
										onToggle={() => handleToggleGift(gift.id)}
										onEdit={() => handleEditGift(gift)}
										onDelete={() => handleDeleteGift(gift)}
										loading={loading}
										theme={{
											accentColor: "#f59e0b",
											hoverColor:
												"hover:bg-amber-50 dark:hover:bg-amber-900/20",
										}}
										borderColor="#f59e0b"
									/>
								))}
							</ul>
						</div>
					</div>
				)}

				{/* Form Modal */}
				<FormModal
					isOpen={showFormModal}
					onClose={closeForm}
					onSubmit={selectedGift ? handleUpdateGift : handleAddGift}
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
					loading={loading}
					submitText={selectedGift ? "Update Supply Item" : "Add Supply Item"}
					cardClassName="card card-gifts"
					submitButtonColor="#f59e0b"
					showAddressBook={true}
					contacts={contacts}
					onAddressBookSelect={(contact) => {
						// Handle address book selection
					}}
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
						{ value: "none", label: "No Sorting" },
						{ value: "recipient", label: "Sort by Recipient" },
						{ value: "store", label: "Sort by Store" },
						{ value: "price-high", label: "Sort by Price (High to Low)" },
						{ value: "price-low", label: "Sort by Price (Low to High)" },
					]}
					title="Sort Supplies"
				/>

				{/* Delete Modal */}
				<DeleteModal
					isOpen={showDeleteModal}
					onCancel={cancelDelete}
					onConfirm={confirmDelete}
					title="Delete Supply Item"
					message="Are you sure you want to delete this supply item? This action cannot be undone."
					loading={loading}
				/>
			</main>
			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
