"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import { useFormModalMutation } from "@/hooks/useFormModalMutation";
import { useGetCardsQuery } from "@/store/api";
import { transformCardPayload } from "@/utils/formTransformers";
import FormModal from "@/components/modals/FormModal";
import AddButton from "@/components/common/AddButton";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";

export default function ChristmasCardsPage() {
	const dispatch = useAppDispatch();
	const { contacts } = useAppSelector((state: any) => state.addressBook);
	const {
		holidayId,
		mutation,
		isLoading: mutationLoading,
		error: mutationError,
		auth0User,
	} = useFormModalMutation();

	// Fetch cards using RTK Query
	const {
		data: cards = [],
		isLoading: loading,
		error: cardsError,
	} = useGetCardsQuery(
		{ holidayId, auth0User },
		{ skip: !holidayId || !auth0User }
	);

	const [showForm, setShowForm] = useState(false);

	useEffect(() => {
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch]);

	async function handleAddCard(values: Record<string, any>) {
		if (!values.recipient?.trim() || !values.message?.trim()) return;
		if (!holidayId || !mutation) return;

		try {
			const payload = transformCardPayload(values, contacts);
			await mutation({ holidayId, payload, auth0User }).unwrap();
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

	// Form fields configuration for cards
	const formFields = [
		{
			id: "recipient",
			type: "text" as const,
			placeholder: "Recipient*",
			required: true,
		},
		{
			id: "message",
			type: "textarea" as const,
			placeholder: "Message*",
			required: true,
			rows: 4,
		},
		{
			id: "address",
			type: "textarea" as const,
			placeholder: "Address (optional)",
			rows: 3,
		},
	];

	return (
		<div className="min-h-screen christmas-cards-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Cards"
				backHref="/christmas"
				description="Send holiday cards to your loved ones!"
				holidayColor="red-500"
				error={mutationError ? "API Error" : undefined}
			/>

			<main className="w-full max-w-4xl flex flex-col gap-6">
				<AddButton title="Card" onClick={openForm} color="red" />

				{/* Cards List */}
				{loading ? (
					<div className="text-center text-gray-600 dark:text-gray-400 py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
						<p>Loading cards...</p>
					</div>
				) : cardsError ? (
					<div className="text-center text-red-500 py-8">
						<p>Error loading cards: {cardsError.toString()}</p>
					</div>
				) : cards.length === 0 ? (
					<div className="text-center text-gray-600 dark:text-gray-400 py-8">
						<p>No cards yet. Add your first card!</p>
					</div>
				) : (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{cards.map((card: any) => (
							<div
								key={card.id}
								className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
							>
								<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
									{card.recipient}
								</h3>
								<p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
									{card.message}
								</p>
								{card.address && (
									<p className="text-gray-500 dark:text-gray-400 text-xs">
										📍 {card.address}
									</p>
								)}
							</div>
						))}
					</div>
				)}
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showForm}
				title="Add New Card"
				fields={formFields}
				initialValues={{}}
				onSubmit={handleAddCard}
				onClose={closeForm}
				loading={mutationLoading}
				submitText="Add Card"
				cancelText="Cancel"
				cardClassName="card"
				submitButtonColor="#ef4444"
				showAddressBook={true}
				contacts={contacts}
			/>
		</div>
	);
}
