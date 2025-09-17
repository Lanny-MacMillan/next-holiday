"use client";

import { useState, useEffect } from "react";
import {
	selectHolidayPreferences,
	selectHomeInitialized,
	selectHomeData,
} from "@/store/selectors/home";
import { getHolidayDataFromRedux } from "@/utils/holidayData";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import {
	updateCardInHomeData,
	addCardToHomeData,
	removeCardFromHomeData,
} from "@/store/slices/homeSlice";
import { useFormModalMutation } from "@/hooks/useFormModalMutation";
import { transformCardPayload } from "@/utils/formTransformers";
import FormModal from "@/components/modals/FormModal";
import AddButton from "@/components/common/AddButton";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import MailCardStatus from "@/components/cards/MailCardStatus";
import MailCard from "@/components/cards/MailCard";
import TaskSection from "@/components/common/TaskSection";
import SortModal from "@/components/modals/SortModal";
import DeleteModal from "@/components/modals/DeleteModal";

export default function FathersDayCardsPage() {
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

	// Helper function to update Redux state after card operations
	const updateCardInRedux = (
		cardData: any,
		operation: "add" | "update" | "delete"
	) => {
		if (!holidayId) return;

		switch (operation) {
			case "add":
				dispatch(addCardToHomeData({ holidayId, card: cardData }));
				break;
			case "update":
				dispatch(
					updateCardInHomeData({
						holidayId,
						cardId: cardData.id,
						updates: cardData,
					})
				);
				break;
			case "delete":
				dispatch(
					removeCardFromHomeData({
						holidayId,
						cardId: cardData.id,
					})
				);
				break;
		}
	};

	// Use only Redux data - no GET API calls on holiday pages
	const cards =
		holidayData && homeInitialized && holidayData.cards
			? holidayData.cards
			: [];

	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [cardToDelete, setCardToDelete] = useState<any>(null);
	const [cardToEdit, setCardToEdit] = useState<any>(null);
	const [showEditModal, setShowEditModal] = useState(false);
	const [sortBy, setSortBy] = useState("recipient");

	useEffect(() => {
		// Fetch contacts for address book functionality
		// Only fetch if home data is initialized (which contains contacts)
		if (homeInitialized) {
			dispatch(fetchContacts());
		}
	}, [dispatch, homeInitialized]);

	async function handleAddCard(values: Record<string, any>) {
		if (!values.recipient?.trim() || !values.message?.trim()) return;
		if (!holidayId || !mutation) return;

		try {
			const payload = transformCardPayload(values, contacts);
			const result = await mutation({ holidayId, payload, auth0User }).unwrap();

			// Update Redux state directly
			updateCardInRedux(result, "add");

			setShowForm(false);
		} catch (error) {
			console.error("Error creating card:", error);
			// Handle error (could show a toast notification)
		}
	}

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
	}

	const handleDeleteCard = async (cardId: string) => {
		const card = cards.find((c) => c.id === cardId);
		setCardToDelete(card);
		setShowDeleteModal(true);
	};

	const handleEditCard = async (card: any) => {
		// Transform the card to match the expected interface
		const transformedCard = {
			id: card.id,
			recipient: card.recipient,
			message: card.message,
			address: card.address,
			notes: card.notes,
			isCompleted: card.isCompleted,
		};
		setCardToEdit(transformedCard);
		setShowEditModal(true);
	};

	const confirmDelete = async () => {
		if (cardToDelete && mutation && holidayId) {
			try {
				const payload = {
					id: cardToDelete.id,
					action: "delete",
					recipient: cardToDelete.recipient,
					message: cardToDelete.message || "",
					address: cardToDelete.address || "",
				};
				await mutation({ holidayId, payload, auth0User }).unwrap();

				// Update Redux state directly
				updateCardInRedux({ id: cardToDelete.id }, "delete");

				setShowDeleteModal(false);
				setCardToDelete(null);
			} catch (error) {
				console.error("Error deleting card:", error);
			}
		}
	};

	const handleEditSubmit = async (values: Record<string, any>) => {
		if (cardToEdit && mutation && holidayId) {
			try {
				const payload = {
					...transformCardPayload(values, contacts),
					id: cardToEdit.id,
					action: "update",
				};
				const result = await mutation({
					holidayId,
					payload,
					auth0User,
				}).unwrap();

				// Update Redux state directly
				updateCardInRedux(result, "update");

				setShowEditModal(false);
				setCardToEdit(null);
			} catch (error) {
				console.error("Error updating card:", error);
			}
		}
	};

	const handleToggleCompletion = async (cardId: string) => {
		if (mutation && holidayId) {
			try {
				const card = cards.find((c) => c.id === cardId);
				if (card) {
					const payload = {
						id: cardId,
						action: "update",
						isCompleted: !card.isCompleted,
						recipient: card.recipient,
						message: card.message,
						address: card.address,
					};
					await mutation({ holidayId, payload, auth0User }).unwrap();

					// Update Redux state directly
					updateCardInRedux(
						{ id: cardId, isCompleted: !card.isCompleted },
						"update"
					);
				}
			} catch (error) {
				console.error("Error toggling card completion:", error);
			}
		}
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

	// Form fields configuration for cards
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
			placeholder: "Write your Father's Day message here...",
			rows: 3,
			required: true,
		},
		{
			id: "address",
			type: "textarea" as const,
			label: "Address",
			placeholder: "Recipient's address...",
			rows: 2,
		},
	];

	return (
		<div className="min-h-screen fathers-day-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Father's Day Cards"
				backHref="/fathers-day"
				onSortClick={() => setShowSortModal(true)}
				description="Keep track of your cards!"
				holidayColor="blue-500"
				error={undefined}
				sortTitle="Sort Cards"
			/>

			<main className="w-full max-w-4xl flex flex-col gap-6">
				{/* Summary Stats */}
				<MailCardStatus
					totalCards={cards.length}
					completedCards={completedCards.length}
					incompleteCards={incompleteCards.length}
					holidayColor="bg-gradient-to-br from-blue-300 to-blue-500"
				/>

				<AddButton title="Card" onClick={openForm} color="blue" />

				{/* Card List */}
				{!homeInitialized ? (
					<div className="text-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
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
							onClick={() => setShowForm(true)}
							className="mt-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
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
									
									card={card}
									onToggleCompletion={handleToggleCompletion}
									onEditCard={handleEditCard}
									onDeleteCard={handleDeleteCard}
									holidayColor="bg-gradient-to-br from-blue-300 to-blue-500"
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
									
									card={card}
									onToggleCompletion={handleToggleCompletion}
									onEditCard={handleEditCard}
									onDeleteCard={handleDeleteCard}
									holidayColor="bg-gradient-to-br from-blue-300 to-blue-500"
								/>
							)}
						/>
					</div>
				)}
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showForm}
				title="Add New Card"
				fields={formFields}
				onSubmit={handleAddCard}
				onClose={closeForm}
				submitText="Add Card"
				cancelText="Cancel"
				cardClassName="card card-valentines"
				submitButtonColor="#3b82f6"
				showAddressBook={true}
				contacts={contacts}
			/>

			{/* Edit Modal */}
			<FormModal
				isOpen={showEditModal}
				title="Edit Card"
				fields={formFields}
				initialValues={cardToEdit}
				onSubmit={handleEditSubmit}
				onClose={() => {
					setShowEditModal(false);
					setCardToEdit(null);
				}}
				submitText="Update Card"
				cancelText="Cancel"
				cardClassName="card card-valentines"
				submitButtonColor="#3b82f6"
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
				confirmButtonColor="#3b82f6"
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
