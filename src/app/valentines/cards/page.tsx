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

export default function ValentinesCardsPage() {
	const dispatch = useAppDispatch();
	const [isAddingCard, setIsAddingCard] = useState(false);
	const [newCard, setNewCard] = useState({
		recipient: "",
		message: "",
		address: "",
		isCompleted: false,
		notes: "",
	});
	const [editingCard, setEditingCard] = useState<any>(null);
	const [showSortModal, setShowSortModal] = useState(false);
	const [sortBy, setSortBy] = useState("recipient");

	const cards = useAppSelector((state) => state.cards.cards);
	const loading = useAppSelector((state) => state.cards.loading);
	const selectedCard = useAppSelector((state) => state.cards.selectedCard);

	useEffect(() => {
		dispatch(fetchCards());
	}, [dispatch]);

	const handleAddCard = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newCard.recipient.trim()) return;

		await dispatch(
			addCard({
				...newCard,
				isCompleted: false,
			})
		);

		setNewCard({
			recipient: "",
			message: "",
			address: "",
			isCompleted: false,
			notes: "",
		});
		setIsAddingCard(false);
	};

	const handleUpdateCard = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingCard.recipient.trim()) return;

		await dispatch(updateCard(editingCard));
		setEditingCard(null);
	};

	const handleDeleteCard = async (cardId: string) => {
		if (confirm("Are you sure you want to delete this card?")) {
			await dispatch(deleteCard(cardId));
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

	return (
		<div className="min-h-screen valentines-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/valentines"
						className="absolute left-0 text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-300 text-xl"
					>
						←
					</Link>
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
							Valentine's Cards
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Track your romantic cards and messages
						</p>
					</div>
				</div>
			</header>

			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				{/* Summary Stats */}
				<div className="card card-valentines rounded-2xl p-4">
					<div className="grid grid-cols-2 gap-4 text-center">
						<div>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								Total Cards
							</p>
							<p className="text-2xl font-bold text-gray-800 dark:text-white">
								{cards.length}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-600 dark:text-gray-400">Sent</p>
							<p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
								{completedCards.length}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								To Send
							</p>
							<p className="text-lg font-bold text-gray-800 dark:text-white">
								{incompleteCards.length}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								Progress
							</p>
							<p className="text-lg font-bold text-pink-600 dark:text-pink-400">
								{cards.length > 0
									? Math.round((completedCards.length / cards.length) * 100)
									: 0}
								%
							</p>
						</div>
					</div>
				</div>

				<button
					onClick={() => setIsAddingCard(true)}
					className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition-colors font-medium"
					style={{ backgroundColor: "#ec4899", color: "white" }}
				>
					Add New Card
				</button>

				{/* Form Modal */}
				{isAddingCard && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
						<div className="card card-valentines rounded-lg p-6 max-w-md mx-4 w-full max-h-[90vh] overflow-y-auto">
							<div className="flex justify-between items-center mb-4">
								<h3
									className="text-lg font-semibold text-gray-900 dark:text-white"
									style={{ color: "#111827" }}
								>
									Add New Card
								</h3>
								<button
									onClick={() => setIsAddingCard(false)}
									className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
									style={{ color: "#4b5563" }}
								>
									×
								</button>
							</div>
							<form onSubmit={handleAddCard} className="space-y-4">
								<input
									className="border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
									placeholder="Recipient*"
									value={newCard.recipient}
									onChange={(e) =>
										setNewCard({ ...newCard, recipient: e.target.value })
									}
									required
									style={{ color: "#111827", backgroundColor: "white" }}
								/>
								<textarea
									className="border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
									placeholder="Message"
									value={newCard.message}
									onChange={(e) =>
										setNewCard({ ...newCard, message: e.target.value })
									}
									rows={3}
									style={{ color: "#111827", backgroundColor: "white" }}
								/>
								<textarea
									className="border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
									placeholder="Address"
									value={newCard.address}
									onChange={(e) =>
										setNewCard({ ...newCard, address: e.target.value })
									}
									rows={2}
									style={{ color: "#111827", backgroundColor: "white" }}
								/>
								<textarea
									className="border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
									placeholder="Notes"
									value={newCard.notes}
									onChange={(e) =>
										setNewCard({ ...newCard, notes: e.target.value })
									}
									rows={2}
									style={{ color: "#111827", backgroundColor: "white" }}
								/>
								<div className="flex gap-3 pt-2">
									<button
										type="button"
										onClick={() => setIsAddingCard(false)}
										className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
										style={{ color: "#374151", borderColor: "#d1d5db" }}
									>
										Cancel
									</button>
									<button
										type="submit"
										className="flex-1 bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition-colors font-medium"
										style={{ backgroundColor: "#ec4899", color: "white" }}
									>
										Add Card
									</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{/* Card List */}
				<div className="space-y-4">
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
								onClick={() => setIsAddingCard(true)}
								className="mt-2 text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
							>
								Add your first card
							</button>
						</div>
					) : (
						sortedCards.map((card) => (
							<div
								key={card.id}
								className={`card card-valentines rounded-2xl p-4 transition-all ${
									card.isCompleted ? "opacity-75" : ""
								}`}
							>
								{editingCard?.id === card.id ? (
									<form onSubmit={handleUpdateCard} className="space-y-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
												Recipient *
											</label>
											<input
												type="text"
												value={editingCard.recipient}
												onChange={(e) =>
													setEditingCard({
														...editingCard,
														recipient: e.target.value,
													})
												}
												className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
												required
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
												Message
											</label>
											<textarea
												value={editingCard.message || ""}
												onChange={(e) =>
													setEditingCard({
														...editingCard,
														message: e.target.value,
													})
												}
												className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
												rows={3}
												placeholder="Write your romantic message here..."
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
												Address
											</label>
											<textarea
												value={editingCard.address || ""}
												onChange={(e) =>
													setEditingCard({
														...editingCard,
														address: e.target.value,
													})
												}
												className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
												rows={2}
												placeholder="Recipient's address..."
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
												Notes
											</label>
											<textarea
												value={editingCard.notes || ""}
												onChange={(e) =>
													setEditingCard({
														...editingCard,
														notes: e.target.value,
													})
												}
												className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
												rows={2}
												placeholder="Any additional notes..."
											/>
										</div>
										<div className="flex gap-2">
											<button
												type="submit"
												className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
											>
												Update
											</button>
											<button
												type="button"
												onClick={() => setEditingCard(null)}
												className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
											>
												Cancel
											</button>
										</div>
									</form>
								) : (
									<div>
										<div className="flex items-start justify-between mb-2">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1">
													<h3
														className={`font-bold text-gray-800 dark:text-white ${
															card.isCompleted ? "line-through" : ""
														}`}
													>
														{card.recipient}
													</h3>
													{card.isCompleted && (
														<span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-2 py-1 rounded-full">
															Sent
														</span>
													)}
												</div>
												{card.message && (
													<div className="mt-2 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
														<p className="text-sm text-gray-700 dark:text-gray-300 italic">
															"{card.message}"
														</p>
													</div>
												)}
											</div>
											<div className="flex flex-col gap-2 ml-4">
												<button
													onClick={() => handleToggleCompletion(card.id)}
													className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
														card.isCompleted
															? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
															: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300"
													}`}
												>
													{card.isCompleted ? "Sent" : "Mark Sent"}
												</button>
												<button
													onClick={() => setEditingCard(card)}
													className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded text-sm font-medium transition-colors"
												>
													Edit
												</button>
												<button
													onClick={() => handleDeleteCard(card.id)}
													className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded text-sm font-medium transition-colors"
												>
													Delete
												</button>
											</div>
										</div>
									</div>
								)}
							</div>
						))
					)}
				</div>
			</main>

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
