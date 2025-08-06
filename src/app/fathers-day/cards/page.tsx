"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchFathersDayCards,
	addFathersDayCard,
	updateFathersDayCard,
	deleteFathersDayCard,
	FathersDayCard,
} from "@/store/slices/fathers-day/fathersDayCardsSlice";
import { Card } from "@/store/slices/cardsSlice";
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

export default function FathersDayCardsPage() {
	const dispatch = useAppDispatch();
	const { cards, loading, error, initialized } = useAppSelector(
		(state: any) => state.fathersDayCards
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
	const [editingCard, setEditingCard] = useState<FathersDayCard | null>(null);
	const [sortBy, setSortBy] = useState<string>("none");
	const [showSortModal, setShowSortModal] = useState(false);

	useEffect(() => {
		if (!initialized) {
			dispatch(fetchFathersDayCards());
		}
		dispatch(fetchContacts());
	}, [dispatch, initialized]);

	function handleAddCard(formValues: Record<string, any>) {
		if (!formValues.recipient?.trim() || !formValues.message?.trim()) return;

		if (editingCard) {
			const updatedCard: FathersDayCard = {
				...editingCard,
				recipient: formValues.recipient,
				message: formValues.message,
			};
			dispatch(updateFathersDayCard(updatedCard));
			setEditingCard(null);
		} else {
			const newCard: Omit<FathersDayCard, "id" | "createdAt" | "updatedAt"> = {
				recipient: formValues.recipient,
				message: formValues.message,
				isCompleted: false,
				priority: "medium",
			};
			dispatch(addFathersDayCard(newCard));
		}

		setShowForm(false);
	}

	function handleToggleCard(cardId: string) {
		const card = cards.find((c: FathersDayCard) => c.id === cardId);
		if (card) {
			const updatedCard: FathersDayCard = {
				...card,
				isCompleted: !card.isCompleted,
				completedDate: !card.isCompleted ? new Date().toISOString() : undefined,
			};
			dispatch(updateFathersDayCard(updatedCard));
		}
	}

	function handleEditCard(card: Card) {
		// Convert Card to FathersDayCard for editing
		const fathersDayCard: FathersDayCard = {
			...card,
			priority: "medium", // Default priority for existing cards
		};
		setEditingCard(fathersDayCard);
		setShowForm(true);
	}

	function handleDeleteCard(cardId: string) {
		setDeleteConfirm({ show: true, cardId });
	}

	function confirmDelete() {
		if (deleteConfirm.cardId) {
			dispatch(deleteFathersDayCard(deleteConfirm.cardId));
			setDeleteConfirm({ show: false, cardId: null });
		}
	}

	function sortCards(cardsToSort: FathersDayCard[]): FathersDayCard[] {
		switch (sortBy) {
			case "recipient":
				return [...cardsToSort].sort((a, b) =>
					a.recipient.localeCompare(b.recipient)
				);
			case "message":
				return [...cardsToSort].sort((a, b) =>
					(a.message || "").localeCompare(b.message || "")
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
			<div className="min-h-screen fathers-day-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading cards...</p>
				</div>
			</div>
		);
	}

	const sortedCards = sortCards(cards);
	const incompleteCards = sortedCards.filter((card: FathersDayCard) => !card.isCompleted);
	const completedCards = sortedCards.filter((card: FathersDayCard) => card.isCompleted);

	return (
		<div className="min-h-screen fathers-day-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Father's Day Cards"
				backHref="/fathers-day"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort cards"
				error={error}
			/>
			<main className="w-full max-w-md flex flex-col gap-6">
				<AddButton title="Card" onClick={() => setShowForm(true)} color="blue" />
				
				<TaskSection
					title="Not Sent"
					items={incompleteCards}
					isCompleted={false}
					emptyMessage="All cards sent! 🎉"
					completedMessage="All cards sent! 🎉"
					renderItem={(card: FathersDayCard) => (
						<HolidayCard
							key={card.id}
							card={card}
							onToggle={handleToggleCard}
							onEdit={handleEditCard}
							onDelete={handleDeleteCard}
							loading={loading}
							theme={{
								accentColor: "#3b82f6",
							}}
							borderColor="rgb(var(--color-blue-500))"
						/>
					)}
				/>

				<TaskSection
					title="Sent"
					items={completedCards}
					isCompleted={true}
					emptyMessage="No cards sent yet."
					completedMessage="No cards sent yet."
					renderItem={(card: FathersDayCard) => (
						<HolidayCard
							key={card.id}
							card={card}
							onToggle={handleToggleCard}
							onEdit={handleEditCard}
							onDelete={handleDeleteCard}
							loading={loading}
							theme={{
								accentColor: "#3b82f6",
							}}
							borderColor="rgb(var(--color-blue-500))"
						/>
					)}
				/>
			</main>

			<FormModal
				isOpen={showForm}
				title={editingCard ? "Edit Card" : "Add New Card"}
				fields={getFormConfig("cards", editingCard ? "edit" : "add").fields}
				initialValues={
					editingCard
						? {
								recipient: editingCard.recipient,
								message: editingCard.message,
						  }
						: {}
				}
				onSubmit={handleAddCard}
				onClose={() => {
					setShowForm(false);
					setEditingCard(null);
				}}
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
				submitButtonColor="#3b82f6"
				showAddressBook={true}
				contacts={contacts}
				onAddressBookSelect={() => {}}
			/>

			<DeleteModal
				isOpen={deleteConfirm.show}
				{...getDeleteConfig("cards")}
				onConfirm={confirmDelete}
				onCancel={() => setDeleteConfirm({ show: false, cardId: null })}
				loading={loading}
			/>

			<SortModal
				isOpen={showSortModal}
				onClose={() => setShowSortModal(false)}
				sortBy={sortBy}
				onSortChange={setSortBy}
				sortOptions={[
					{ value: "none", label: "None" },
					{ value: "recipient", label: "Recipient" },
					{ value: "message", label: "Message" },
					{ value: "date-created", label: "Date Created" },
				]}
				title="Sort Cards"
			/>
		</div>
	);
} 