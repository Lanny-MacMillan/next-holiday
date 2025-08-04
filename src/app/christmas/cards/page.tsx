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
	Card,
} from "@/store/slices/cardsSlice";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import SortModal from "@/components/SortModal";

export default function CardsPage() {
	const dispatch = useAppDispatch();
	const { cards, loading, error, initialized } = useAppSelector(
		(state: any) => state.cards
	);
	const { contacts } = useAppSelector((state: any) => state.addressBook);

	const [form, setForm] = useState({
		recipient: "",
		address: "",
		message: "",
	});
	const [showAddressBook, setShowAddressBook] = useState(false);
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		cardId: string | null;
	}>({
		show: false,
		cardId: null,
	});
	const [showForm, setShowForm] = useState(false);
	const [editingCard, setEditingCard] = useState<Card | null>(null);
	const [sortBy, setSortBy] = useState<string>("none");
	const [showSortModal, setShowSortModal] = useState(false);

	useEffect(() => {
		// Fetch cards and contacts when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchCards());
		}
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch, initialized]);

	function handleAddCard(e: React.FormEvent) {
		e.preventDefault();
		if (!form.recipient.trim() || !form.message.trim()) return;

		if (editingCard) {
			// Update existing card
			const updatedCard: Card = {
				...editingCard,
				recipient: form.recipient,
				address: form.address,
				message: form.message,
			};
			dispatch(updateCard(updatedCard));
			setEditingCard(null);
		} else {
			// Add new card
			const newCard: Omit<Card, "id" | "createdAt" | "updatedAt"> = {
				recipient: form.recipient,
				address: form.address,
				message: form.message,
				isCompleted: false,
			};
			dispatch(addCard(newCard));
		}

		setForm({ recipient: "", address: "", message: "" });
		setShowForm(false);
	}

	function openForm() {
		setShowForm(true);
		setForm({ recipient: "", address: "", message: "" });
	}

	function closeForm() {
		setShowForm(false);
		setEditingCard(null);
		setForm({ recipient: "", address: "", message: "" });
	}

	function handleToggleCard(cardId: string) {
		dispatch(toggleCardCompletion(cardId));
	}

	function handleEditCard(card: Card) {
		setEditingCard(card);
		setForm({
			recipient: card.recipient,
			address: card.address || "",
			message: card.message,
		});
	}

	function handleDeleteCard(cardId: string) {
		setDeleteConfirm({ show: true, cardId });
	}

	function confirmDelete() {
		if (deleteConfirm.cardId) {
			dispatch(deleteCard(deleteConfirm.cardId));
			setDeleteConfirm({ show: false, cardId: null });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, cardId: null });
	}

	function addFromAddressBook(contact: any) {
		// Build full address from contact details
		const addressParts = [
			contact.streetAddress,
			contact.city,
			contact.state,
			contact.zipCode,
		].filter(Boolean);

		const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : "";

		setForm((prev) => ({
			...prev,
			recipient: contact.name,
			address: fullAddress,
		}));
		setShowAddressBook(false);
	}

	function sortCards(cardsToSort: Card[]): Card[] {
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
			<div className="min-h-screen christmas-cards-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading cards...</p>
				</div>
			</div>
		);
	}

	const sortedCards = sortCards(cards);
	const incompleteCards = sortedCards.filter((card: Card) => !card.isCompleted);
	const completedCards = sortedCards.filter((card: Card) => card.isCompleted);

	return (
		<div className="min-h-screen christmas-cards-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/christmas"
						className="absolute left-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xl"
					>
						←
					</Link>
					<h1 className="text-2xl font-bold text-gray-800 dark:text-white">
						Holiday Cards
					</h1>
					<button
						onClick={() => setShowSortModal(true)}
						className="absolute right-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xl"
						title="Sort cards"
					>
						<div className="flex flex-col gap-0.5">
							<div className="w-4 h-0.5 bg-current"></div>
							<div className="w-3 h-0.5 bg-current ml-1"></div>
							<div className="w-2 h-0.5 bg-current ml-2"></div>
						</div>
					</button>
				</div>
				{error && (
					<div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-2 rounded mb-4">
						{error}
					</div>
				)}
			</header>
			<main className="w-full max-w-md flex flex-col gap-6">
				<button
					onClick={openForm}
					className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
					style={{ backgroundColor: "#ef4444", color: "white" }}
				>
					Add New Card
				</button>
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

				{/* Sort Controls */}

				<div>
					<h2 className="font-semibold text-gray-800 dark:text-white mb-2">
						Incomplete ({incompleteCards.length})
					</h2>
					<div className="card card-cards rounded shadow">
						{incompleteCards.length === 0 ? (
							<div className="px-4 py-3 text-gray-400 dark:text-gray-500 text-center">
								All cards completed! 🎉
							</div>
						) : (
							<ul className="divide-y divide-gray-200 dark:divide-gray-700">
								{incompleteCards.map((card: Card) => (
									<li
										key={card.id}
										className="flex items-center px-4 py-3 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20"
										onClick={() => handleToggleCard(card.id)}
									>
										<input
											type="checkbox"
											checked={card.isCompleted}
											readOnly
											className="mr-3 accent-green-500"
										/>
										<div className="flex-1">
											<div className="text-gray-800 dark:text-white">
												To: {card.recipient}
											</div>
											{card.address && (
												<div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
													📍 {card.address}
												</div>
											)}
											{card.message && (
												<div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
													{card.message}
												</div>
											)}
										</div>
										<div className="flex gap-2">
											<button
												onClick={(e) => {
													e.stopPropagation();
													handleEditCard(card);
													setShowForm(true);
												}}
												className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
												disabled={loading}
											>
												Edit
											</button>
											<button
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteCard(card.id);
												}}
												className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
												disabled={loading}
											>
												Delete
											</button>
										</div>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>

				<div>
					<h2 className="font-semibold text-gray-600 dark:text-gray-500 mb-2">
						Completed ({completedCards.length})
					</h2>
					<div className="card card-cards rounded shadow">
						{completedCards.length === 0 ? (
							<div className="px-4 py-3 text-gray-300 dark:text-gray-600 text-center">
								No completed cards yet.
							</div>
						) : (
							<ul className="divide-y divide-gray-200 dark:divide-gray-700">
								{completedCards.map((card: Card) => (
									<li
										key={card.id}
										className="flex items-center px-4 py-3 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 opacity-60"
										onClick={() => handleToggleCard(card.id)}
									>
										<input
											type="checkbox"
											checked={card.isCompleted}
											readOnly
											className="mr-3 accent-green-500"
										/>
										<div className="flex-1">
											<div className="line-through text-gray-400 dark:text-gray-500">
												To: {card.recipient}
											</div>
											{card.address && (
												<div className="text-xs text-gray-400 dark:text-gray-500 line-through">
													📍 {card.address}
												</div>
											)}
											{card.message && (
												<div className="text-xs text-gray-400 dark:text-gray-500 line-through">
													{card.message}
												</div>
											)}
											{card.completedDate && (
												<div className="text-xs text-green-600 dark:text-green-400 mt-1">
													Completed:{" "}
													{new Date(card.completedDate).toLocaleDateString()}
												</div>
											)}
										</div>
										<div className="flex gap-2">
											<button
												onClick={(e) => {
													e.stopPropagation();
													handleEditCard(card);
													setShowForm(true);
												}}
												className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
												disabled={loading}
											>
												Edit
											</button>
											<button
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteCard(card.id);
												}}
												className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
												disabled={loading}
											>
												Delete
											</button>
										</div>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</main>

			{/* Form Modal */}
			{showForm && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="card card-cards rounded-lg p-6 max-w-md mx-4 w-full max-h-[90vh] overflow-y-auto">
						<div className="flex justify-between items-center mb-4">
							<h3
								className="text-lg font-semibold text-gray-900 dark:text-white"
								style={{ color: "#111827" }}
							>
								{editingCard ? "Edit Card" : "Add New Card"}
							</h3>
							<button
								onClick={closeForm}
								className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
								style={{ color: "#4b5563" }}
							>
								×
							</button>
						</div>
						<form onSubmit={handleAddCard} className="space-y-4">
							<div className="flex gap-2">
								<input
									className="flex-1 border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
									placeholder="Recipient*"
									value={form.recipient}
									onChange={(e) =>
										setForm((prev) => ({ ...prev, recipient: e.target.value }))
									}
									required
									style={{ color: "#111827", backgroundColor: "white" }}
								/>
								<button
									type="button"
									onClick={() => setShowAddressBook(!showAddressBook)}
									className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
									style={{ backgroundColor: "#3b82f6", color: "white" }}
								>
									📖
								</button>
							</div>
							<input
								className="border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
								placeholder="Address (optional)"
								value={form.address}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, address: e.target.value }))
								}
								style={{ color: "#111827", backgroundColor: "white" }}
							/>
							{showAddressBook && (
								<div className="bg-gray-50 dark:bg-gray-700 rounded p-2 max-h-32 overflow-y-auto">
									<h4
										className="text-sm font-medium mb-1 text-gray-900 dark:text-white"
										style={{ color: "#111827" }}
									>
										From Address Book:
									</h4>
									{contacts.map((contact: any) => (
										<button
											key={contact.id}
											type="button"
											onClick={() => addFromAddressBook(contact)}
											className="block w-full text-left text-sm p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-gray-900 dark:text-white"
											style={{ color: "#111827" }}
										>
											<div className="font-medium">{contact.name}</div>
											{contact.streetAddress && (
												<div className="text-xs text-gray-500">
													{contact.streetAddress}, {contact.city},{" "}
													{contact.state} {contact.zipCode}
												</div>
											)}
										</button>
									))}
								</div>
							)}
							<textarea
								className="border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
								placeholder="Message*"
								value={form.message}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, message: e.target.value }))
								}
								rows={3}
								required
								style={{ color: "#111827", backgroundColor: "white" }}
							/>
							<div className="flex gap-3 pt-2">
								<button
									type="button"
									onClick={closeForm}
									className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
									style={{ color: "#374151", borderColor: "#d1d5db" }}
								>
									Cancel
								</button>
								<button
									type="submit"
									className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
									disabled={loading}
									style={{ backgroundColor: "#ef4444", color: "white" }}
								>
									{loading
										? editingCard
											? "Updating..."
											: "Adding..."
										: editingCard
										? "Update Card"
										: "Add Card"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			{deleteConfirm.show && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="card card-cards rounded-lg p-6 max-w-sm mx-4">
						<h3
							className="text-lg font-semibold mb-4 text-gray-900 dark:text-white"
							style={{ color: "#111827" }}
						>
							Confirm Delete
						</h3>
						<p
							className="text-gray-600 dark:text-gray-300 mb-6"
							style={{ color: "#4b5563" }}
						>
							Are you sure you want to delete this card? This action cannot be
							undone.
						</p>
						<div className="flex gap-3">
							<button
								onClick={cancelDelete}
								className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
								style={{ color: "#374151", borderColor: "#d1d5db" }}
							>
								Cancel
							</button>
							<button
								onClick={confirmDelete}
								className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
								style={{ backgroundColor: "#ef4444", color: "white" }}
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Sort Modal */}
			<SortModal
				isOpen={showSortModal}
				onClose={() => setShowSortModal(false)}
				sortBy={sortBy}
				onSortChange={setSortBy}
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
