"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchCards,
	addCard,
	updateCard,
	deleteCard,
	sendCard,
	Card,
} from "@/store/slices/cardsSlice";
import { fetchContacts } from "@/store/slices/addressBookSlice";

export default function CardsPage() {
	const dispatch = useAppDispatch();
	const { cards, loading, error } = useAppSelector((state: any) => state.cards);
	const { contacts } = useAppSelector((state: any) => state.addressBook);

	const [form, setForm] = useState({
		title: "",
		recipient: "",
		message: "",
		design: "christmas-tree",
	});
	const [showAddressBook, setShowAddressBook] = useState(false);

	useEffect(() => {
		// Fetch cards and contacts when component mounts
		dispatch(fetchCards());
		dispatch(fetchContacts());
	}, [dispatch]);

	function handleAddCard(e: React.FormEvent) {
		e.preventDefault();
		if (!form.title.trim() || !form.recipient.trim()) return;

		const newCard: Omit<Card, "id" | "createdAt" | "updatedAt"> = {
			title: form.title,
			recipient: form.recipient,
			message: form.message || "Wishing you a wonderful holiday season!",
			design: form.design,
			isSent: false,
		};

		dispatch(addCard(newCard));
		setForm({
			title: "",
			recipient: "",
			message: "",
			design: "christmas-tree",
		});
	}

	function handleSendCard(cardId: string) {
		dispatch(sendCard(cardId));
	}

	function handleDeleteCard(cardId: string) {
		dispatch(deleteCard(cardId));
	}

	function addFromAddressBook(contact: any) {
		setForm((prev) => ({
			...prev,
			recipient: contact.name,
		}));
		setShowAddressBook(false);
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading cards...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6 flex flex-col items-center">
				<h1 className="text-2xl font-bold mb-2 text-gray-900">Holiday Cards</h1>
				<Link
					href="/christmas"
					className="text-blue-500 text-sm hover:underline mb-2"
				>
					← Back
				</Link>
				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
						{error}
					</div>
				)}
			</header>
			<main className="w-full max-w-md flex flex-col gap-6">
				<form
					className="bg-white rounded shadow p-4 mb-4"
					onSubmit={handleAddCard}
				>
					<h2 className="font-semibold mb-2">Create New Card</h2>
					<div className="flex flex-col gap-2">
						<input
							className="border rounded px-3 py-2 text-gray-900 placeholder-gray-700"
							placeholder="Card Title*"
							value={form.title}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, title: e.target.value }))
							}
							required
						/>
						<div className="flex gap-2">
							<input
								className="flex-1 border rounded px-3 py-2 text-gray-900 placeholder-gray-700"
								placeholder="Recipient*"
								value={form.recipient}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, recipient: e.target.value }))
								}
								required
							/>
							<button
								type="button"
								onClick={() => setShowAddressBook(!showAddressBook)}
								className="bg-blue-500 text-white px-3 py-2 rounded text-sm"
							>
								📖
							</button>
						</div>
						{showAddressBook && (
							<div className="bg-gray-50 rounded p-2 max-h-32 overflow-y-auto">
								<h4 className="text-sm font-medium mb-1">From Address Book:</h4>
								{contacts.map((contact: any) => (
									<button
										key={contact.id}
										type="button"
										onClick={() => addFromAddressBook(contact)}
										className="block w-full text-left text-sm p-1 hover:bg-blue-100 rounded"
									>
										{contact.name}
									</button>
								))}
							</div>
						)}
						<select
							className="border rounded px-3 py-2 text-gray-900"
							value={form.design}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, design: e.target.value }))
							}
						>
							<option value="christmas-tree">🎄 Christmas Tree</option>
							<option value="snowman">⛄ Snowman</option>
							<option value="santa">🎅 Santa</option>
							<option value="holly">🎄 Holly</option>
						</select>
						<textarea
							className="border rounded px-3 py-2 text-gray-900 placeholder-gray-700"
							placeholder="Message (optional)"
							value={form.message}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, message: e.target.value }))
							}
							rows={3}
						/>
						<button
							type="submit"
							className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
							disabled={loading}
						>
							{loading ? "Creating..." : "Create Card"}
						</button>
					</div>
				</form>

				<div className="bg-white rounded shadow">
					<h3 className="font-semibold p-4 border-b">Cards ({cards.length})</h3>
					{cards.length === 0 ? (
						<div className="p-4 text-center text-gray-500">
							No cards yet. Create your first card above!
						</div>
					) : (
						<ul className="divide-y">
							{cards.map((card: Card) => (
								<li key={card.id} className="flex items-center px-4 py-3 gap-3">
									<div className="flex-1">
										<div className="font-semibold text-gray-900">
											{card.title}
										</div>
										<div className="text-sm text-gray-600">
											To: {card.recipient}
										</div>
										<div className="text-xs text-gray-500">
											Design: {card.design}
										</div>
										{card.message && (
											<div className="text-xs text-gray-500 mt-1">
												{card.message}
											</div>
										)}
										{card.isSent && card.sentDate && (
											<div className="text-xs text-green-600 mt-1">
												Sent: {new Date(card.sentDate).toLocaleDateString()}
											</div>
										)}
									</div>
									<div className="flex gap-2">
										{!card.isSent && (
											<button
												onClick={() => handleSendCard(card.id)}
												className="text-green-500 hover:text-green-700 text-sm"
												disabled={loading}
											>
												Send
											</button>
										)}
										<button
											onClick={() => handleDeleteCard(card.id)}
											className="text-red-500 hover:text-red-700 text-sm"
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
			</main>
		</div>
	);
}
