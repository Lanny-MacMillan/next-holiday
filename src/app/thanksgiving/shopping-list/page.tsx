"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useFormModalMutation } from "@/hooks/useFormModalMutation";
import {
	useUpdateGiftMutation,
	useEditGiftMutation,
	useDeleteGiftMutation,
} from "@/store/api";
import { transformThanksgivingShoppingPayload } from "@/utils/formTransformers";
import { BudgetDisplay } from "@/components/common/BudgetDisplay";
import SortModal from "@/components/modals/SortModal";
import GiftCardItem from "@/components/cards/gift/GiftCardItem";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import { getFormConfig } from "@/config/formConfigs";
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

import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";

type SortOption = "recipient" | "store" | "price-high" | "price-low" | "none";

export default function ThanksgivingShoppingListPage() {
	const dispatch = useAppDispatch();
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

	async function handleAddGift(values: Record<string, any>) {
		if (!values.giftName?.trim()) return;
		if (!holidayId || !mutation) return;

		try {
			const payload = transformThanksgivingShoppingPayload(values);
			const result = await mutation({ holidayId, payload, auth0User }).unwrap();

			// Update Redux state directly
			updateGiftInRedux(result, "add");

			setShowFormModal(false);
		} catch (error) {
			console.error("Error creating shopping item:", error);
			alert("Error creating shopping item. Please try again.");
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
			console.error("Error toggling shopping item:", error);
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
			console.error("Error deleting shopping item:", error);
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
			const payload = transformThanksgivingShoppingPayload(values);
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
			console.error("Error updating shopping item:", error);
			alert("Error updating shopping item. Please try again.");
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
			<div className="min-h-screen thanksgiving-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading shopping items...
					</p>
				</div>
			</div>
		);
	}

	// Use only Redux data - no fallback to API calls
	const displayGifts =
		holidayData && homeInitialized && holidayData.gifts
			? holidayData.gifts
			: [];

	// Debug: Log gift data
	useEffect(() => {
		console.log("Thanksgiving shopping list - holidayId:", holidayId);
		console.log("Thanksgiving shopping list - holidayData:", holidayData);
		console.log(
			"Thanksgiving shopping list - homeInitialized:",
			homeInitialized
		);
		console.log("Thanksgiving shopping list - displayGifts:", displayGifts);
	}, [holidayId, holidayData, homeInitialized, displayGifts]);

	const sortedGifts = sortGifts(displayGifts || []);
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
			loading={updateLoading}
			theme={{
				accentColor: "#d97706", // Amber for Thanksgiving
			}}
			borderColor="rgb(var(--color-amber-500))" // Amber border for Thanksgiving
			gamifiedBackgroundColor="bg-gradient-to-br from-amber-400 to-amber-600"
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
			loading={updateLoading}
			theme={{
				accentColor: "#d97706", // Amber for Thanksgiving
			}}
			borderColor="rgb(var(--color-amber-500))" // Amber border for Thanksgiving
			gamifiedBackgroundColor="bg-gradient-to-br from-amber-400 to-amber-600"
		/>
	);

	// Form fields configuration
	const formFields = [
		{
			id: "giftName",
			type: "text" as const,
			placeholder: "Shopping Item Name*",
			required: true,
		},
		{
			id: "description",
			type: "text" as const,
			placeholder: "Description (optional)",
		},
		{
			id: "price",
			type: "number" as const,
			placeholder: "Price (optional)",
			step: "0.01",
		},
		{
			id: "store",
			type: "text" as const,
			placeholder: "Store (optional)",
		},
		{
			id: "product_link",
			type: "url" as const,
			placeholder: "Product Link (optional)",
		},
		{
			id: "notes",
			type: "textarea" as const,
			placeholder: "Notes (optional)",
			rows: 2,
		},
	];

	// Initial values for editing
	const getInitialValues = () => {
		if (!selectedGift) return {};

		return {
			giftName: selectedGift.name,
			description: selectedGift.description || "",
			price: selectedGift.price.toString(),
			store: selectedGift.store || "",
			product_link: selectedGift.productLink || "",
			notes: selectedGift.notes || "",
		};
	};

	return (
		<div className="min-h-screen thanksgiving-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="🛒 Shopping List"
				backHref="/thanksgiving"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort shopping items"
				description="Keep track of your Thanksgiving shopping items!"
				holidayColor="amber-500"
				error={undefined}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Budget Display */}
				<BudgetDisplay
					holiday="Thanksgiving"
					holidayColor="bg-gradient-to-br from-amber-400 to-amber-600"
					holidayId={holidayId || undefined}
				/>

				<AddButton title="Shopping Item" onClick={openForm} color="amber" />
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
					emptyMessage="All shopping items completed! 🎉"
					completedMessage=""
					renderItem={renderGiftItem}
				/>

				<TaskSection
					title="Completed"
					items={completedGifts}
					isCompleted={true}
					emptyMessage="No completed shopping items yet."
					completedMessage=""
					renderItem={renderCompletedGiftItem}
				/>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showFormModal}
				title={selectedGift ? "Edit Shopping Item" : "Add New Shopping Item"}
				fields={formFields}
				initialValues={getInitialValues()}
				onSubmit={selectedGift ? handleUpdateGift : handleAddGift}
				onClose={closeForm}
				loading={mutationLoading || editLoading}
				submitText={selectedGift ? "Update Shopping Item" : "Add Shopping Item"}
				cancelText="Cancel"
				cardClassName="card"
				submitButtonColor="#d97706"
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				title="Delete Shopping Item"
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
				title="Sort Shopping Items"
			/>
		</div>
	);
}
