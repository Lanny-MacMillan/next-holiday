"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchGifts,
	addGift,
	updateGift,
	deleteGift,
	markGiftAsPurchased,
	Gift,
} from "@/store/slices/giftListSlice";
import { fetchContacts } from "@/store/slices/addressBookSlice";

export default function GiftListPage() {
	const dispatch = useAppDispatch();
	const { gifts, loading, error } = useAppSelector(
		(state: any) => state.giftList
	);
	const { contacts } = useAppSelector((state: any) => state.addressBook);

	const [form, setForm] = useState({
		name: "",
		description: "",
		price: "",
		recipient: "",
		store: "",
		notes: "",
	});
	const [showAddressBook, setShowAddressBook] = useState(false);

	useEffect(() => {
		// Fetch gifts and contacts when component mounts
		dispatch(fetchGifts());
		dispatch(fetchContacts());
	}, [dispatch]);

	function handleAddGift(e: React.FormEvent) {
		e.preventDefault();
		if (!form.name.trim() || !form.recipient.trim()) return;

		const newGift: Omit<Gift, "id" | "createdAt" | "updatedAt"> = {
			name: form.name,
			description: form.description || undefined,
			price: parseFloat(form.price) || 0,
			recipient: form.recipient,
			isPurchased: false,
			store: form.store || undefined,
			notes: form.notes || undefined,
		};

		dispatch(addGift(newGift));
		setForm({
			name: "",
			description: "",
			price: "",
			recipient: "",
			store: "",
			notes: "",
		});
	}

	function handleMarkAsPurchased(giftId: string) {
		dispatch(markGiftAsPurchased(giftId));
	}

	function handleDeleteGift(giftId: string) {
		dispatch(deleteGift(giftId));
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
			<div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading gifts...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6 flex flex-col items-center">
				<h1 className="text-2xl font-bold mb-2 text-gray-900">Gift List</h1>
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
					onSubmit={handleAddGift}
				>
					<h2 className="font-semibold mb-2">Add New Gift</h2>
					<div className="flex flex-col gap-2">
						<input
							className="border rounded px-3 py-2 text-gray-900 placeholder-gray-700"
							placeholder="Gift Name*"
							value={form.name}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, name: e.target.value }))
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
						<input
							className="border rounded px-3 py-2 text-gray-900 placeholder-gray-700"
							placeholder="Description"
							value={form.description}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, description: e.target.value }))
							}
						/>
						<div className="flex gap-2">
							<input
								className="flex-1 border rounded px-3 py-2 text-gray-900 placeholder-gray-700"
								placeholder="Price"
								type="number"
								step="0.01"
								value={form.price}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, price: e.target.value }))
								}
							/>
							<input
								className="flex-1 border rounded px-3 py-2 text-gray-900 placeholder-gray-700"
								placeholder="Store"
								value={form.store}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, store: e.target.value }))
								}
							/>
						</div>
						<textarea
							className="border rounded px-3 py-2 text-gray-900 placeholder-gray-700"
							placeholder="Notes"
							value={form.notes}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, notes: e.target.value }))
							}
							rows={2}
						/>
						<button
							type="submit"
							className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
							disabled={loading}
						>
							{loading ? "Adding..." : "Add Gift"}
						</button>
					</div>
				</form>

				<div className="bg-white rounded shadow">
					<h3 className="font-semibold p-4 border-b">Gifts ({gifts.length})</h3>
					{gifts.length === 0 ? (
						<div className="p-4 text-center text-gray-500">
							No gifts yet. Add your first gift above!
						</div>
					) : (
						<ul className="divide-y">
							{gifts.map((gift: Gift) => (
								<li key={gift.id} className="flex items-center px-4 py-3 gap-3">
									<div className="flex-1">
										<div className="font-semibold text-gray-900">
											{gift.name}
										</div>
										<div className="text-sm text-gray-600">
											For: {gift.recipient}
										</div>
										{gift.description && (
											<div className="text-xs text-gray-500">
												{gift.description}
											</div>
										)}
										<div className="flex gap-4 text-xs text-gray-500 mt-1">
											{gift.price > 0 && <span>${gift.price.toFixed(2)}</span>}
											{gift.store && <span>Store: {gift.store}</span>}
										</div>
										{gift.notes && (
											<div className="text-xs text-gray-500 mt-1">
												{gift.notes}
											</div>
										)}
										{gift.isPurchased && gift.purchasedDate && (
											<div className="text-xs text-green-600 mt-1">
												Purchased:{" "}
												{new Date(gift.purchasedDate).toLocaleDateString()}
											</div>
										)}
									</div>
									<div className="flex gap-2">
										{!gift.isPurchased && (
											<button
												onClick={() => handleMarkAsPurchased(gift.id)}
												className="text-green-500 hover:text-green-700 text-sm"
												disabled={loading}
											>
												Buy
											</button>
										)}
										<button
											onClick={() => handleDeleteGift(gift.id)}
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
