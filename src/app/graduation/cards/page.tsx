"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchGraduationCards,
	addGraduationCard,
	updateGraduationCard,
	deleteGraduationCard,
	GraduationCard,
} from "@/store/slices/graduation/graduationCardsSlice";
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

type SortOption = "recipient" | "address" | "message" | "date-created" | "none";

// Helper function to convert GraduationCard to Card
const convertToCard = (graduationCard: GraduationCard): Card => {
	return {
		id: graduationCard.id,
		recipient: graduationCard.recipient,
		address: graduationCard.address,
		message: graduationCard.message,
		isCompleted: graduationCard.isCompleted,
		completedDate: graduationCard.completedDate,
		createdAt: graduationCard.createdAt,
		updatedAt: graduationCard.updatedAt,
	};
};

export default function GraduationCardsPage() {
	const dispatch = useAppDispatch();
	const { cards, loading, error, initialized } = useAppSelector(
		(state: any) => state.graduationCards
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
	const [editingCard, setEditingCard] = useState<GraduationCard | null>(null);
	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [showSortModal, setShowSortModal] = useState(false);

	useEffect(() => {
		if (!initialized) {
			dispatch(fetchGraduationCards());
		}
		dispatch(fetchContacts());
	}, [dispatch, initialized]);

	function handleAddCard(formValues: Record<string, any>) {
		if (!formValues.recipient?.trim() || !formValues.message?.trim()) return;

		if (editingCard) {
			const updatedCard: GraduationCard = {
				...editingCard,
				recipient: formValues.recipient,
				address: formValues.address || "",
				message: formValues.message,
			};
			dispatch(updateGraduationCard(updatedCard));
			setEditingCard(null);
		} else {
			const newCard: Omit<GraduationCard, "id" | "createdAt" | "updatedAt"> = {
				recipient: formValues.recipient,
				address: formValues.address || "",
				message: formValues.message,
				isCompleted: false,
				priority: "medium",
			};
			dispatch(addGraduationCard(newCard));
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
		const card = cards.find((c: GraduationCard) => c.id === cardId);
		if (card) {
			const updatedCard = {
				...card,
				isCompleted: !card.isCompleted,
			};
			dispatch(updateGraduationCard(updatedCard));
		}
	}

	function handleEditCard(card: GraduationCard) {
		setEditingCard(card);
		setShowForm(true);
	}

	function handleDeleteCard(cardId: string) {
		setDeleteConfirm({ show: true, cardId });
	}

	function confirmDelete() {
		if (deleteConfirm.cardId) {
			dispatch(deleteGraduationCard(deleteConfirm.cardId));
			setDeleteConfirm({ show: false, cardId: null });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, cardId: null });
	}

	function sortCards(cardsToSort: GraduationCard[]): GraduationCard[] {
		switch (sortBy) {
			case "recipient":
				return [...cardsToSort].sort((a, b) =>
					a.recipient.localeCompare(b.recipient)
				);
			case "address":
				return [...cardsToSort].sort((a, b) =>
					(a.address || "").localeCompare(b.address || "")
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
			<div className="min-h-screen graduation-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading cards...</p>
				</div>
			</div>
		);
	}

	const sortedCards = sortCards(cards);
	const incompleteCards = sortedCards.filter(
		(card: GraduationCard) => !card.isCompleted
	);
	const completedCards = sortedCards.filter(
		(card: GraduationCard) => card.isCompleted
	);

	return (
		<div className="min-h-screen graduation-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Graduation Cards"
				backHref="/graduation"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort cards"
				description="Plan your graduation cards with style!"
				holidayColor="purple-500"
				error={error}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				<AddButton title="Card" onClick={openForm} color="purple" />
				<div className="flex items-center justify-center">
					{sortBy !== "none" && (
						<div className="text-center text-sm text-gray-600 dark:text-gray-400">
							{sortBy === "recipient" && "Sorted by Recipient"}
							{sortBy === "address" && "Sorted by Address"}
							{sortBy === "message" && "Sorted by Message"}
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
					renderItem={(card: GraduationCard) => (
						<HolidayCard
							key={card.id}
							card={convertToCard(card)}
							onToggle={handleToggleCard}
							onEdit={(card) => {
								handleEditCard(card as any);
								setShowForm(true);
							}}
							onDelete={handleDeleteCard}
							loading={loading}
							theme={{
								accentColor: "#8b5cf6",
							}}
							borderColor="rgb(var(--color-purple-500))"
							gamifiedBackgroundColor="bg-gradient-to-br from-purple-300 to-purple-500"
						/>
					)}
				/>

				<TaskSection
					title="Completed"
					items={completedCards}
					isCompleted={true}
					emptyMessage="No completed cards yet."
					completedMessage="No completed cards yet."
					renderItem={(card: GraduationCard) => (
						<HolidayCard
							key={card.id}
							card={convertToCard(card)}
							onToggle={handleToggleCard}
							onEdit={(card) => {
								handleEditCard(card as any);
								setShowForm(true);
							}}
							onDelete={handleDeleteCard}
							loading={loading}
							theme={{
								accentColor: "#8b5cf6",
							}}
							borderColor="rgb(var(--color-purple-500))"
							gamifiedBackgroundColor="bg-gradient-to-br from-purple-300 to-purple-500"
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
								address: editingCard.address || "",
								message: editingCard.message,
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
				submitButtonColor="#8b5cf6"
				showAddressBook={true}
				contacts={contacts}
			/>

			<DeleteModal
				isOpen={deleteConfirm.show}
				{...getDeleteConfig("cards")}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={loading}
			/>

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
					{ value: "address", label: "Address" },
					{ value: "message", label: "Message" },
					{ value: "date-created", label: "Date Created" },
				]}
				title="Sort Cards"
			/>
		</div>
	);
}
