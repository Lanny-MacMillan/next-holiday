"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchValentinesGifts,
	addValentinesGift,
	updateValentinesGift,
	deleteValentinesGift,
	toggleValentinesGiftCompletion,
	ValentinesGift,
} from "@/store/slices/valentines/valentinesGiftListSlice";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import { BudgetDisplay } from "@/components/common/BudgetDisplay";
import SortModal from "@/components/modals/SortModal";
import DeleteModal from "@/components/modals/DeleteModal";
import EditTaskModal from "@/components/modals/EditTaskModal";
import FormModal from "@/components/modals/FormModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import GiftCardItem from "@/components/cards/gift/GiftCardItem";

type SortOption = "recipient" | "store" | "price-high" | "price-low" | "none";

export default function ValentinesGiftListPage() {
	const dispatch = useAppDispatch();
	const { gifts, loading, error, initialized } = useAppSelector(
		(state: any) => state.valentinesGiftList
	);
	const { contacts } = useAppSelector((state: any) => state.addressBook);

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showSortModal, setShowSortModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showFormModal, setShowFormModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [selectedGift, setSelectedGift] = useState<ValentinesGift | null>(null);
	const [giftToDelete, setGiftToDelete] = useState<string | null>(null);

	useEffect(() => {
		// Fetch gifts and contacts when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchValentinesGifts());
		}
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch, initialized]);

	const handleAddGift = (formData: Record<string, any>) => {
		const newGift: Omit<ValentinesGift, "id" | "createdAt" | "updatedAt"> = {
			name: formData.name,
			description: formData.description || undefined,
			price: parseFloat(formData.price) || 0,
			recipient: formData.recipient,
			isCompleted: false,
			store: formData.store || undefined,
			productLink: formData.productLink || undefined,
			notes: formData.notes || undefined,
		};

		dispatch(addValentinesGift(newGift));
		setShowFormModal(false);
	};

	const handleEditGift = (formData: Record<string, any>) => {
		if (!selectedGift) return;

		const updatedGift: Omit<ValentinesGift, "id" | "createdAt" | "updatedAt"> =
			{
				name: formData.name,
				description: formData.description || undefined,
				price: parseFloat(formData.price) || 0,
				recipient: formData.recipient,
				isCompleted: formData.isCompleted || false,
				store: formData.store || undefined,
				productLink: formData.productLink || undefined,
				notes: formData.notes || undefined,
			};

		dispatch(
			updateValentinesGift({
				id: selectedGift.id,
				...updatedGift,
				createdAt: selectedGift.createdAt,
				updatedAt: new Date().toISOString(),
			})
		);
		setShowEditModal(false);
		setSelectedGift(null);
	};

	const handleToggleGift = (giftId: string) => {
		dispatch(toggleValentinesGiftCompletion(giftId));
	};

	const handleDeleteGift = (giftId: string) => {
		setGiftToDelete(giftId);
		setShowDeleteModal(true);
	};

	const confirmDelete = () => {
		if (giftToDelete) {
			dispatch(deleteValentinesGift(giftToDelete));
		}
		setShowDeleteModal(false);
		setGiftToDelete(null);
	};

	const handleEditGiftClick = (gift: ValentinesGift) => {
		setSelectedGift(gift);
		setShowEditModal(true);
	};

	const sortGifts = (giftsToSort: ValentinesGift[]): ValentinesGift[] => {
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
	};

	if (loading && !initialized) {
		return (
			<div className="min-h-screen valentines-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading gifts...</p>
				</div>
			</div>
		);
	}

	const sortedGifts = sortGifts(gifts);
	const incompleteGifts = sortedGifts.filter((gift) => !gift.isCompleted);
	const completedGifts = sortedGifts.filter((gift) => gift.isCompleted);

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
		{ id: "store", type: "text" as const, placeholder: "Store" },
		{
			id: "productLink",
			type: "url" as const,
			placeholder: "Product Link (optional)",
		},
		{ id: "notes", type: "textarea" as const, placeholder: "Notes", rows: 2 },
	];

	const renderGiftItem = (gift: ValentinesGift) => (
		<GiftCardItem
			key={gift.id}
			gift={gift}
			isCompleted={gift.isCompleted}
			onToggle={handleToggleGift}
			onEdit={handleEditGiftClick}
			onDelete={handleDeleteGift}
			loading={loading}
			theme={{
				accentColor: "#ec4899",
				hoverColor: "hover:bg-pink-50 dark:hover:bg-pink-900/20",
			}}
			borderColor="#ec4899"
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
				error={error}
			/>

			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Budget Display */}
				<BudgetDisplay
					holiday="Valentine's Day"
					holidayColor="bg-gradient-to-br from-pink-300 to-pink-500"
				/>

				<AddButton
					title="Gift"
					onClick={() => setShowFormModal(true)}
					color="pink"
					disabled={loading}
				/>

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

			{/* Form Modal for adding new gifts */}
			<FormModal
				isOpen={showFormModal}
				title="Add New Gift"
				fields={formFields}
				onSubmit={handleAddGift}
				onClose={() => setShowFormModal(false)}
				loading={loading}
				submitText="Add Gift"
				cardClassName="card card-valentines"
				submitButtonColor="#ec4899"
				showAddressBook={true}
				contacts={contacts}
			/>

			{/* Edit Modal for editing gifts */}
			{selectedGift && (
				<FormModal
					isOpen={showEditModal}
					title="Edit Gift"
					fields={formFields}
					initialValues={{
						name: selectedGift.name,
						recipient: selectedGift.recipient,
						description: selectedGift.description || "",
						price: selectedGift.price.toString(),
						store: selectedGift.store || "",
						productLink: selectedGift.productLink || "",
						notes: selectedGift.notes || "",
						isCompleted: selectedGift.isCompleted,
					}}
					onSubmit={handleEditGift}
					onClose={() => {
						setShowEditModal(false);
						setSelectedGift(null);
					}}
					loading={loading}
					submitText="Save Changes"
					cardClassName="card card-valentines"
					submitButtonColor="#ec4899"
					showAddressBook={true}
					contacts={contacts}
				/>
			)}

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
				loading={loading}
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
