"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchBirthdayCards,
	addBirthdayCard,
	updateBirthdayCard,
	deleteBirthdayCard,
	toggleBirthdayCardCompletion,
	BirthdayCard,
} from "@/store/slices/birthday/birthdayCardsSlice";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import SortModal from "@/components/modals/SortModal";
import HolidayCard from "@/components/cards/card/HolidayCard";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";

export default function BirthdayCardsPage() {
	const dispatch = useAppDispatch();
	const { cards, loading, error, initialized } = useAppSelector(
		(state: any) => state.birthdayCards
	);
	const { contacts } = useAppSelector((state: any) => state.addressBook);

	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		cardId: string | null;
	}>({
		show: false,
		cardId: null,
	});
	const [showForm, setShowForm] = useState(false);
	const [editingCard, setEditingCard] = useState<BirthdayCard | null>(null);
	const [sortBy, setSortBy] = useState<string>("none");
	const [showSortModal, setShowSortModal] = useState(false);

	useEffect(() => {
		// Fetch cards and contacts when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchBirthdayCards());
		}
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch, initialized]);

	function handleAddCard(formValues: Record<string, any>) {
		if (!formValues.recipient?.trim() || !formValues.message?.trim()) return;

		if (editingCard) {
			// Update existing card
			const updatedCard: BirthdayCard = {
				...editingCard,
				recipient: formValues.recipient,
				message: formValues.message,
				notes: formValues.notes || undefined,
			};
			dispatch(updateBirthdayCard(updatedCard));
			setEditingCard(null);
		} else {
			// Add new card
			const newCard: Omit<BirthdayCard, "id" | "createdAt" | "updatedAt"> = {
				recipient: formValues.recipient,
				message: formValues.message,
				notes: formValues.notes || undefined,
				isCompleted: false,
				priority: formValues.priority || "medium",
			};
			dispatch(addBirthdayCard(newCard));
		}

		setShowForm(false);
	}

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
		setEditingCard(null);
	}

	function handleToggleCard(cardId: string) {
		dispatch(toggleBirthdayCardCompletion(cardId));
	}

	function handleEditCard(card: BirthdayCard) {
		setEditingCard(card);
		setShowForm(true);
	}

	function handleDeleteCard(cardId: string) {
		setDeleteConfirm({ show: true, cardId });
	}

	function confirmDelete() {
		if (deleteConfirm.cardId) {
			dispatch(deleteBirthdayCard(deleteConfirm.cardId));
			setDeleteConfirm({ show: false, cardId: null });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, cardId: null });
	}

	function sortCards(cardsToSort: BirthdayCard[]): BirthdayCard[] {
		switch (sortBy) {
			case "recipient":
				return [...cardsToSort].sort((a, b) =>
					a.recipient.localeCompare(b.recipient)
				);
			case "message":
				return [...cardsToSort].sort((a, b) =>
					(a.message || "").localeCompare(b.message || "")
				);
			case "priority":
				const priorityOrder = { high: 3, medium: 2, low: 1 };
				return [...cardsToSort].sort(
					(a, b) =>
						(priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
						(priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
				);
			case "date-created":
				return [...cardsToSort].sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
			default:
				return cardsToSort;
		}
	}

	if (loading && !initialized) {
		return (
			<div className="min-h-screen birthday-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading cards...</p>
				</div>
			</div>
		);
	}

	const sortedCards = sortCards(cards);
	const incompleteCards = sortedCards.filter((card: BirthdayCard) => !card.isCompleted);
	const completedCards = sortedCards.filter((card: BirthdayCard) => card.isCompleted);

	return (
		<div className="min-h-screen birthday-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Birthday Cards"
				backHref="/birthday"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort cards"
				error={error}
			/>
			<main className="w-full max-w-md flex flex-col gap-6">
				<AddButton title="Card" onClick={openForm} color="amber" />
				<div className="flex items-center justify-center">
					{sortBy !== "none" && (
						<div className="text-center text-sm text-gray-600 dark:text-gray-400">
							{sortBy === "recipient" && "Sorted by Recipient"}
							{sortBy === "message" && "Sorted by Message"}
							{sortBy === "priority" && "Sorted by Priority"}
							{sortBy === "date-created" && "Sorted by Date Created"}
						</div>
					)}
				</div>

				<TaskSection
					title="Incomplete"
					items={incompleteCards}
					isCompleted={false}
					emptyMessage="All cards completed! 🎉"
					completedMessage="All cards completed! 🎉"
					renderItem={(card: BirthdayCard) => (
						<HolidayCard
							key={card.id}
							card={card as any}
							onToggle={handleToggleCard}
							onEdit={(card) => {
								handleEditCard(card as BirthdayCard);
								setShowForm(true);
							}}
							onDelete={handleDeleteCard}
							loading={loading}
							theme={{
								accentColor: "#f59e0b", // Amber for Birthday
							}}
							borderColor="rgb(var(--color-amber-500))" // Amber border for Birthday
						/>
					)}
				/>

				<TaskSection
					title="Completed"
					items={completedCards}
					isCompleted={true}
					emptyMessage="No completed cards yet."
					completedMessage="No completed cards yet."
					renderItem={(card: BirthdayCard) => (
						<HolidayCard
							key={card.id}
							card={card as any}
							onToggle={handleToggleCard}
							onEdit={(card) => {
								handleEditCard(card as BirthdayCard);
								setShowForm(true);
							}}
							onDelete={handleDeleteCard}
							loading={loading}
							theme={{
								accentColor: "#f59e0b", // Amber for Birthday
							}}
							borderColor="rgb(var(--color-amber-500))" // Amber border for Birthday
						/>
					)}
				/>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showForm}
				title={editingCard ? "Edit Card" : "Add New Card"}
				fields={getFormConfig("cards", editingCard ? "edit" : "add").fields}
				initialValues={
					editingCard
						? {
								recipient: editingCard.recipient,
								message: editingCard.message,
								notes: editingCard.notes || "",
								priority: editingCard.priority,
						  }
						: {}
				}
				onSubmit={handleAddCard}
				onClose={closeForm}
				loading={loading}
				submitText={
					loading
						? editingCard
							? "Updating..."
							: "Adding..."
						: editingCard
						? "Update Card"
						: "Add Card"
				}
				cancelText="Cancel"
				cardClassName="card"
				submitButtonColor="#f59e0b"
				showAddressBook={true}
				contacts={contacts}
				onAddressBookSelect={(contact) => {
					// The FormModal will handle the form values internally
				}}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={deleteConfirm.show}
				{...getDeleteConfig("cards")}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={loading}
			/>

			{/* Sort Modal */}
			<SortModal
				isOpen={showSortModal}
				onClose={() => setShowSortModal(false)}
				sortBy={sortBy}
				onSortChange={setSortBy}
				sortOptions={[
					{ value: "none", label: "None" },
					{ value: "recipient", label: "Recipient" },
					{ value: "message", label: "Message" },
					{ value: "priority", label: "Priority" },
					{ value: "date-created", label: "Date Created" },
				]}
				title="Sort Cards"
			/>
		</div>
	);
} 