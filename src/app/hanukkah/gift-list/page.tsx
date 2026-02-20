"use client";

import { useState, useEffect } from "react";
import {
	selectHolidayPreferences,
	selectHomeInitialized,
	selectHomeData,
} from "@/store/selectors/home";
import { getHolidayDataFromRedux } from "@/utils/holidayData";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import {
	updateGiftInHomeData,
	addGiftToHomeData,
	removeGiftFromHomeData,
	setHomeData,
} from "@/store/slices/homeSlice";
import { useFormModalMutation } from "@/hooks/useFormModalMutation";
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

export default function HanukkahGiftListPage() {
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

		console.log(`updateGiftInRedux - ${operation}:`, giftData);
		console.log("Available contacts:", contacts);

		// For add and update operations, ensure the recipient field is populated
		let processedGiftData = giftData;
		if ((operation === "add" || operation === "update") && giftData.contactId && contacts) {
			const contact = contacts.find((c: any) => c.id === giftData.contactId);
			console.log("Found contact for gift:", contact);
			processedGiftData = {
				...giftData,
				recipient: contact?.name || giftData.recipient || "Unknown"
			};
		}

		console.log(`Processed gift data for ${operation}:`, processedGiftData);

		switch (operation) {
			case "add":
				dispatch(addGiftToHomeData({ holidayId, gift: processedGiftData }));
				break;
			case "update":
				dispatch(
					updateGiftInHomeData({
						holidayId,
						giftId: processedGiftData.id,
						updates: processedGiftData,
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

	// Refresh home data function
	const refreshHomeData = async () => {
		if (!auth0User?.sub || !holidayId) return;

		try {
			const response = await fetch("/api/home", {
				headers: {
					"Content-Type": "application/json",
					"x-test-user": JSON.stringify({
						sub: auth0User.sub,
						email: auth0User.email,
						name: auth0User.name,
						picture: auth0User.picture,
					}),
				},
			});
			if (response.ok) {
				const result = await response.json();
				dispatch(setHomeData(result.data));
			}
		} catch (error) {
			console.error("Error refreshing home data:", error);
		}
	};

	// Use Redux data instead of RTK Query
	const gifts = holidayData?.gifts || [];
	const loading = !homeInitialized;
	const error = null;
	const initialized = homeInitialized;

	// Local loading states for mutations
	const [sortBy, setSortBy] = useState("recipient");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [showSortModal, setShowSortModal] = useState(false);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedGift, setSelectedGift] = useState<any>(null);
	const [updateLoading, setUpdateLoading] = useState<string | null>(null);
	const [editLoading, setEditLoading] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

	useEffect(() => {
		// Fetch contacts for address book functionality
		// Only fetch if home data is initialized (which contains contacts)
		if (homeInitialized) {
			dispatch(fetchContacts());
		}
	}, [dispatch, homeInitialized]);

	// Debug contacts loading
	useEffect(() => {
		console.log("Contacts in Hanukkah gift list:", contacts);
		console.log("Contacts length:", contacts?.length);
		console.log("Home data:", homeData);
		console.log("Home initialized:", homeInitialized);
		console.log("Holiday data:", holidayData);
		console.log("Gifts:", gifts);
	}, [contacts, homeData, homeInitialized, holidayData, gifts]);

	async function handleAddGift(values: Record<string, any>) {
		if (!values.giftName?.trim() || !values.recipient?.trim()) return;
		if (!holidayId || !mutation) return;

		try {
			const payload = transformGiftPayload(values, contacts);
			console.log("Add gift payload:", payload);
			const result = await mutation({ holidayId, payload, auth0User }).unwrap();
			console.log("Add gift result:", result);

			// Update Redux state directly
			updateGiftInRedux(result, "add");
			
			// Refresh home data to ensure UI is in sync
			await refreshHomeData();

			setShowAddModal(false);
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

	function openAddModal() {
		setSelectedGift(null);
		setShowAddModal(true);
	}

	function closeAddModal() {
		setShowAddModal(false);
		setSelectedGift(null);
	}

	function closeEditModal() {
		setShowEditModal(false);
		setSelectedGift(null);
	}

	async function handleToggleGift(giftId: string) {
		if (!holidayId || !auth0User) return;

		setUpdateLoading(giftId);
		try {
			// Find the current gift to get its completion status
			const currentGift = gifts.find((gift: any) => gift.id === giftId);
			if (!currentGift) return;

			// Toggle the completion status
			const newIsCompleted = !currentGift.isCompleted;

			// Update the gift in the database with direct API call
			await fetch(`/api/holidays/${holidayId}/gifts/${giftId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					"x-test-user": JSON.stringify({
						sub: auth0User.sub,
						email: auth0User.email,
						name: auth0User.name,
						picture: auth0User.picture,
					}),
				},
				body: JSON.stringify({
					isCompleted: newIsCompleted,
				}),
			});

			// Update Redux state directly
			updateGiftInRedux({ id: giftId, isCompleted: newIsCompleted }, "update");
		} catch (error) {
			console.error("Error toggling gift:", error);
		} finally {
			setUpdateLoading(null);
		}
	}

	async function handleDeleteGift(gift: any) {
		setSelectedGift(gift);
		setShowDeleteModal(true);
	}

	async function confirmDelete() {
		if (!selectedGift || !holidayId || !auth0User) return;

		setDeleteLoading(selectedGift.id);
		try {
			// Direct API call
			await fetch(`/api/holidays/${holidayId}/gifts/${selectedGift.id}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					"x-test-user": JSON.stringify({
						sub: auth0User.sub,
						email: auth0User.email,
						name: auth0User.name,
						picture: auth0User.picture,
					}),
				},
			});

			updateGiftInRedux({ id: selectedGift.id }, "delete");

			setShowDeleteModal(false);
			setSelectedGift(null);
		} catch (error) {
			console.error("Error deleting gift:", error);
		} finally {
			setDeleteLoading(null);
		}
	}

	function cancelDelete() {
		setShowDeleteModal(false);
		setSelectedGift(null);
	}

	async function handleEditGift(gift: any) {
		setSelectedGift(gift);
		setShowEditModal(true);
	}

	async function handleUpdateGift(values: Record<string, any>) {
		if (!selectedGift || !holidayId || !auth0User) return;

		setEditLoading(true);
		try {
			const payload = transformGiftPayload(values, contacts);
			
			// Direct API call
			const response = await fetch(`/api/holidays/${holidayId}/gifts/${selectedGift.id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					"x-test-user": JSON.stringify({
						sub: auth0User.sub,
						email: auth0User.email,
						name: auth0User.name,
						picture: auth0User.picture,
					}),
				},
				body: JSON.stringify(payload),
			});

			if (response.ok) {
				const result = await response.json();
				updateGiftInRedux(result, "update");
			}

			setShowEditModal(false);
			setSelectedGift(null);
		} catch (error) {
			console.error("Error updating gift:", error);
		} finally {
			setEditLoading(false);
		}
	}

	function sortGifts(giftsToSort: any[]): any[] {
		switch (sortBy) {
			case "recipient":
				return [...giftsToSort].sort((a, b) =>
					(a.recipient || "").localeCompare(b.recipient || "")
				);
			case "store":
				return [...giftsToSort].sort((a, b) =>
					(a.store || "").localeCompare(b.store || "")
				);
			case "price-high":
				return [...giftsToSort].sort((a, b) => (b.price || 0) - (a.price || 0));
			case "price-low":
				return [...giftsToSort].sort((a, b) => (a.price || 0) - (b.price || 0));
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

				<AddButton title="Gift" onClick={openAddModal} color="blue" />
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
							key={gift.id}
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
							key={gift.id}
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
				isOpen={showAddModal}
				onClose={closeAddModal}
				title="Add New Gift"
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
				initialValues={{}}
				onSubmit={handleAddGift}
				loading={mutationLoading}
				submitText="Add Gift"
				cancelText="Cancel"
				cardClassName="card"
				submitButtonColor="#2563eb"
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
