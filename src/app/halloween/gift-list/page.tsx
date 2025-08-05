"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
	fetchGifts,
	addGift,
	updateGift,
	deleteGift,
	toggleGiftCompletion,
	setSelectedGift,
	clearError,
	Gift,
} from "@/store/slices/giftListSlice";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import GiftCardItem from "@/components/cards/gift/GiftCardItem";
import SortModal from "@/components/modals/SortModal";
import DeleteModal from "@/components/modals/DeleteModal";
import FormModal from "@/components/modals/FormModal";
import { getHolidayAccentColor } from "@/utils/holidayUtils";
import { usePathname } from "next/navigation";

export default function HalloweenGiftListPage() {
	const dispatch = useDispatch<AppDispatch>();
	const pathname = usePathname();
	const { gifts, loading, error, selectedGift } = useSelector(
		(state: RootState) => state.giftList
	);

	// Modal states
	const [isSortModalOpen, setIsSortModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isFormModalOpen, setIsFormModalOpen] = useState(false);
	const [giftToDelete, setGiftToDelete] = useState<Gift | null>(null);

	// Sort state
	const [sortBy, setSortBy] = useState("name");

	// Form fields for adding/editing gifts
	const formFields = [
		{ id: "name", label: "Gift Name", type: "text" as const, required: true },
		{
			id: "recipient",
			label: "Recipient",
			type: "text" as const,
			required: true,
		},
		{ id: "description", label: "Description", type: "textarea" as const },
		{ id: "price", label: "Price", type: "number" as const, step: "0.01" },
		{ id: "store", label: "Store", type: "text" as const },
		{ id: "productLink", label: "Product Link", type: "url" as const },
		{ id: "notes", label: "Notes", type: "textarea" as const },
	];

	const sortOptions = [
		{ value: "name", label: "Name" },
		{ value: "recipient", label: "Recipient" },
		{ value: "price", label: "Price" },
		{ value: "createdAt", label: "Date Added" },
	];

	useEffect(() => {
		dispatch(fetchGifts());
	}, [dispatch]);

	useEffect(() => {
		if (error) {
			const timer = setTimeout(() => {
				dispatch(clearError());
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [error, dispatch]);

	const handleSortChange = (newSortBy: string) => {
		setSortBy(newSortBy);
	};

	const handleAddGift = () => {
		dispatch(setSelectedGift(null));
		setIsFormModalOpen(true);
	};

	const handleEditGift = (gift: Gift) => {
		dispatch(setSelectedGift(gift));
		setIsFormModalOpen(true);
	};

	const handleDeleteGift = (giftId: string) => {
		const gift = gifts.find((g) => g.id === giftId);
		if (gift) {
			setGiftToDelete(gift);
			setIsDeleteModalOpen(true);
		}
	};

	const handleConfirmDelete = () => {
		if (giftToDelete) {
			dispatch(deleteGift(giftToDelete.id));
			setGiftToDelete(null);
			setIsDeleteModalOpen(false);
		}
	};

	const handleFormSubmit = (values: Record<string, any>) => {
		const giftData = {
			name: values.name,
			recipient: values.recipient,
			description: values.description || "",
			price: parseFloat(values.price) || 0,
			store: values.store || "",
			productLink: values.productLink || "",
			notes: values.notes || "",
			isCompleted: false,
		};

		if (selectedGift) {
			dispatch(updateGift({ ...selectedGift, ...giftData }));
		} else {
			dispatch(addGift(giftData));
		}
		setIsFormModalOpen(false);
	};

	const handleToggleGift = (giftId: string) => {
		dispatch(toggleGiftCompletion(giftId));
	};

	const sortGifts = (giftsToSort: Gift[]) => {
		return [...giftsToSort].sort((a, b) => {
			switch (sortBy) {
				case "name":
					return a.name.localeCompare(b.name);
				case "recipient":
					return a.recipient.localeCompare(b.recipient);
				case "price":
					return a.price - b.price;
				case "createdAt":
					return (
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
					);
				default:
					return 0;
			}
		});
	};

	const sortedGifts = sortGifts(gifts);
	const activeGifts = sortedGifts.filter((gift) => !gift.isCompleted);
	const completedGifts = sortedGifts.filter((gift) => gift.isCompleted);

	const accentColor = getHolidayAccentColor(pathname);

	const renderGiftItem = (gift: Gift) => (
		<GiftCardItem
			key={gift.id}
			gift={gift}
			isCompleted={gift.isCompleted}
			onToggle={handleToggleGift}
			onEdit={handleEditGift}
			onDelete={handleDeleteGift}
			loading={loading}
			theme={{ accentColor }}
			borderColor={accentColor}
		/>
	);

	return (
		<div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
			<div className="container mx-auto px-4 py-8 max-w-md">
				<HolidayPageHeader
					title="Halloween Gift List"
					backHref="/halloween"
					onSortClick={() => setIsSortModalOpen(true)}
					sortTitle="Sort Gifts"
					error={error}
				/>

				<main className="w-full max-w-md flex flex-col gap-6">
					<AddButton
						title="Gift"
						onClick={handleAddGift}
						color="holiday"
						disabled={loading}
					/>

					<TaskSection
						title="Active Gifts"
						items={activeGifts}
						isCompleted={false}
						emptyMessage="No gifts added yet."
						completedMessage=""
						renderItem={renderGiftItem}
						borderColor={accentColor}
					/>

					{completedGifts.length > 0 && (
						<TaskSection
							title="Completed Gifts"
							items={completedGifts}
							isCompleted={true}
							emptyMessage=""
							completedMessage="No completed gifts yet"
							renderItem={renderGiftItem}
							borderColor={accentColor}
						/>
					)}
				</main>

				{/* Sort Modal */}
				<SortModal
					isOpen={isSortModalOpen}
					onClose={() => setIsSortModalOpen(false)}
					sortBy={sortBy}
					onSortChange={handleSortChange}
					sortOptions={sortOptions}
					title="Sort Gifts"
				/>

				{/* Delete Modal */}
				<DeleteModal
					isOpen={isDeleteModalOpen}
					onConfirm={handleConfirmDelete}
					onCancel={() => {
						setIsDeleteModalOpen(false);
						setGiftToDelete(null);
					}}
					title="Delete Gift"
					itemName={giftToDelete?.name}
					loading={loading}
					confirmButtonColor={accentColor}
				/>

				{/* Form Modal */}
				<FormModal
					isOpen={isFormModalOpen}
					onClose={() => setIsFormModalOpen(false)}
					title={selectedGift ? "Edit Gift" : "Add New Gift"}
					fields={formFields}
					initialValues={
						selectedGift
							? {
									name: selectedGift.name,
									recipient: selectedGift.recipient,
									description: selectedGift.description,
									price: selectedGift.price,
									store: selectedGift.store,
									productLink: selectedGift.productLink,
									notes: selectedGift.notes,
							  }
							: {}
					}
					onSubmit={handleFormSubmit}
					loading={loading}
					submitText={selectedGift ? "Update Gift" : "Add Gift"}
					submitButtonColor={accentColor}
				/>
			</div>
		</div>
	);
}
