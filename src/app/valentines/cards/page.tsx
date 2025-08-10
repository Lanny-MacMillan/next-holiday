"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchCards,
	addCard,
	updateCard,
	deleteCard,
	toggleCardCompletion,
	setSelectedCard,
} from "@/store/slices/cardsSlice";
import SortModal from "@/components/modals/SortModal";
import DeleteModal from "@/components/modals/DeleteModal";
import FormModal from "@/components/modals/FormModal";
import MailCardStatus from "@/components/cards/MailCardStatus";
import MailCard from "@/components/cards/MailCard";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import TaskSection from "@/components/common/TaskSection";

export default function ValentinesCardsPage() {
	const dispatch = useAppDispatch();
	const [editingCard, setEditingCard] = useState<any>(null);
	const [showSortModal, setShowSortModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showFormModal, setShowFormModal] = useState(false);
	const [cardToDelete, setCardToDelete] = useState<any>(null);
	const [sortBy, setSortBy] = useState("recipient");

	const cards = useAppSelector((state) => state.cards.cards);
	const loading = useAppSelector((state) => state.cards.loading);
	const selectedCard = useAppSelector((state) => state.cards.selectedCard);

	useEffect(() => {
		dispatch(fetchCards());
	}, [dispatch]);

	const handleUpdateCard = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingCard.recipient.trim()) return;

		await dispatch(updateCard(editingCard));
		setEditingCard(null);
	};

	const handleDeleteCard = async (cardId: string) => {
		const card = cards.find((c) => c.id === cardId);
		setCardToDelete(card);
		setShowDeleteModal(true);
	};

	const confirmDelete = async () => {
		if (cardToDelete) {
			await dispatch(deleteCard(cardToDelete.id));
			setShowDeleteModal(false);
			setCardToDelete(null);
		}
	};

	const handleToggleCompletion = async (cardId: string) => {
		await dispatch(toggleCardCompletion(cardId));
	};

	const sortedCards = [...cards].sort((a, b) => {
		switch (sortBy) {
			case "recipient":
				return a.recipient.localeCompare(b.recipient);
			case "completed":
				return a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1;
			case "message":
				return (a.message || "").localeCompare(b.message || "");
			default:
				return 0;
		}
	});

	const completedCards = cards.filter((card) => card.isCompleted);
	const incompleteCards = cards.filter((card) => !card.isCompleted);

	// Form fields configuration
	const formFields = [
		{
			id: "recipient",
			type: "text" as const,
			label: "Recipient",
			placeholder: "Recipient's name",
			required: true,
		},
		{
			id: "message",
			type: "textarea" as const,
			label: "Message",
			placeholder: "Write your romantic message here...",
			rows: 3,
		},
		{
			id: "address",
			type: "textarea" as const,
			label: "Address",
			placeholder: "Recipient's address...",
			rows: 2,
		},
		{
			id: "notes",
			type: "textarea" as const,
			label: "Notes",
			placeholder: "Any additional notes...",
			rows: 2,
		},
	];

	const handleFormSubmit = async (values: Record<string, any>) => {
		await dispatch(
			addCard({
				recipient: values.recipient || "",
				message: values.message || "",
				address: values.address || "",
				isCompleted: false,
			})
		);
		setShowFormModal(false);
	};

	return (
		<div className="min-h-screen valentines-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Valentine's Cards"
				backHref="/valentines"
				onSortClick={() => setShowSortModal(true)}
				description="Keep track of your cards!"
				holidayColor="pink-500"
				sortTitle="Sort Cards"
			/>

			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				{/* Summary Stats */}
				<MailCardStatus
					totalCards={cards.length}
					completedCards={completedCards.length}
					incompleteCards={incompleteCards.length}
				/>

				<AddButton
					title="Card"
					onClick={() => setShowFormModal(true)}
					color="pink"
					disabled={loading}
				/>

				{/* Card List */}
				{loading ? (
					<div className="text-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
						<p className="text-gray-600 dark:text-gray-400 mt-2">
							Loading cards...
						</p>
					</div>
				) : sortedCards.length === 0 ? (
					<div className="text-center py-8">
						<p className="text-gray-600 dark:text-gray-400">
							No cards added yet.
						</p>
						<button
							onClick={() => setShowFormModal(true)}
							className="mt-2 text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
						>
							Add your first card
						</button>
					</div>
				) : (
					<div className="space-y-6">
						<TaskSection
							title="Cards to Send"
							items={incompleteCards}
							isCompleted={false}
							emptyMessage="No cards to send yet."
							completedMessage="All cards sent!"
							renderItem={(card) => (
								<MailCard
									key={card.id}
									card={card}
									editingCard={editingCard}
									setEditingCard={setEditingCard}
									onUpdateCard={handleUpdateCard}
									onToggleCompletion={handleToggleCompletion}
									onDeleteCard={handleDeleteCard}
								/>
							)}
						/>

						<TaskSection
							title="Sent Cards"
							items={completedCards}
							isCompleted={true}
							emptyMessage="No cards sent yet."
							completedMessage="No sent cards to display."
							renderItem={(card) => (
								<MailCard
									key={card.id}
									card={card}
									editingCard={editingCard}
									setEditingCard={setEditingCard}
									onUpdateCard={handleUpdateCard}
									onToggleCompletion={handleToggleCompletion}
									onDeleteCard={handleDeleteCard}
								/>
							)}
						/>
					</div>
				)}
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showFormModal}
				title="Add New Card"
				fields={formFields}
				onSubmit={handleFormSubmit}
				onClose={() => setShowFormModal(false)}
				submitText="Add Card"
				cancelText="Cancel"
				cardClassName="card card-valentines"
				submitButtonColor="#ec4899"
			/>

			{/* Delete Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				title="Delete Card"
				itemName={cardToDelete?.recipient}
				onConfirm={confirmDelete}
				onCancel={() => {
					setShowDeleteModal(false);
					setCardToDelete(null);
				}}
				cardClassName="card card-valentines"
				confirmButtonColor="#ef4444"
			/>

			{/* Sort Modal */}
			<SortModal
				isOpen={showSortModal}
				onClose={() => setShowSortModal(false)}
				sortBy={sortBy}
				onSortChange={setSortBy}
				sortOptions={[
					{ value: "recipient", label: "Recipient" },
					{ value: "completed", label: "Completion Status" },
					{ value: "message", label: "Message" },
				]}
				title="Sort Cards"
			/>

			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
