"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchGifts,
	addGift,
	updateGift,
	deleteGift,
	toggleGiftCompletion,
	Gift,
} from "@/store/slices/giftListSlice";
import { fetchContacts } from "@/store/slices/addressBookSlice";

type SortOption = "recipient" | "store" | "price-high" | "price-low" | "none";

export default function GiftListPage() {
	const dispatch = useAppDispatch();
	const { gifts, loading, error, initialized } = useAppSelector(
		(state: any) => state.giftList
	);
	const { contacts } = useAppSelector((state: any) => state.addressBook);

	const [form, setForm] = useState({
		name: "",
		description: "",
		price: "",
		recipient: "",
		store: "",
		productLink: "",
		notes: "",
	});
	const [showAddressBook, setShowAddressBook] = useState(false);
	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		giftId: string | null;
	}>({
		show: false,
		giftId: null,
	});
	const [showForm, setShowForm] = useState(false);

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
			isCompleted: false,
			store: form.store || undefined,
			productLink: form.productLink || undefined,
			notes: form.notes || undefined,
		};

		dispatch(addGift(newGift));
		setForm({
			name: "",
			description: "",
			price: "",
			recipient: "",
			store: "",
			productLink: "",
			notes: "",
		});
		setShowForm(false);
	}

	function openForm() {
		setShowForm(true);
		setForm({
			name: "",
			description: "",
			price: "",
			recipient: "",
			store: "",
			productLink: "",
			notes: "",
		});
	}

	function closeForm() {
		setShowForm(false);
		setForm({
			name: "",
			description: "",
			price: "",
			recipient: "",
			store: "",
			productLink: "",
			notes: "",
		});
	}

	function handleToggleGift(giftId: string) {
		dispatch(toggleGiftCompletion(giftId));
	}

	function handleDeleteGift(giftId: string) {
		setDeleteConfirm({ show: true, giftId });
	}

	function confirmDelete() {
		if (deleteConfirm.giftId) {
			dispatch(deleteGift(deleteConfirm.giftId));
			setDeleteConfirm({ show: false, giftId: null });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, giftId: null });
	}

	function addFromAddressBook(contact: any) {
		setForm((prev) => ({
			...prev,
			recipient: contact.name,
		}));
		setShowAddressBook(false);
	}

	function sortGifts(giftsToSort: Gift[]): Gift[] {
		switch (sortBy) {
			case "recipient":
				return [...giftsToSort].sort((a, b) =>
					a.recipient.localeCompare(b.recipient)
				);
			case "store":
				return [...giftsToSort].sort((a, b) =>
					(a.store || "").localeCompare(b.store || "")
				);
			case "price-high":
				return [...giftsToSort].sort((a, b) => b.price - a.price);
			case "price-low":
				return [...giftsToSort].sort((a, b) => a.price - b.price);
			default:
				return giftsToSort;
		}
	}

	if (loading && !initialized) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading gifts...</p>
				</div>
			</div>
		);
	}

	const sortedGifts = sortGifts(gifts);
	const incompleteGifts = sortedGifts.filter((gift: Gift) => !gift.isCompleted);
	const completedGifts = sortedGifts.filter((gift: Gift) => gift.isCompleted);

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
				<button
					onClick={openForm}
					className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
				>
					Add New Gift
				</button>

				{/* Sort Controls */}
				<div className="bg-white rounded shadow p-4">
					<h3 className="font-semibold mb-2">Sort By</h3>
					<div className="flex flex-wrap gap-2">
						<button
							onClick={() => setSortBy("none")}
							className={`px-3 py-1 rounded text-sm ${
								sortBy === "none"
									? "bg-yellow-500 text-white"
									: "bg-gray-200 text-gray-700 hover:bg-gray-300"
							}`}
						>
							None
						</button>
						<button
							onClick={() => setSortBy("recipient")}
							className={`px-3 py-1 rounded text-sm ${
								sortBy === "recipient"
									? "bg-yellow-500 text-white"
									: "bg-gray-200 text-gray-700 hover:bg-gray-300"
							}`}
						>
							Recipient
						</button>
						<button
							onClick={() => setSortBy("store")}
							className={`px-3 py-1 rounded text-sm ${
								sortBy === "store"
									? "bg-yellow-500 text-white"
									: "bg-gray-200 text-gray-700 hover:bg-gray-300"
							}`}
						>
							Store
						</button>
						<button
							onClick={() => setSortBy("price-high")}
							className={`px-3 py-1 rounded text-sm ${
								sortBy === "price-high"
									? "bg-yellow-500 text-white"
									: "bg-gray-200 text-gray-700 hover:bg-gray-300"
							}`}
						>
							Price: High to Low
						</button>
						<button
							onClick={() => setSortBy("price-low")}
							className={`px-3 py-1 rounded text-sm ${
								sortBy === "price-low"
									? "bg-yellow-500 text-white"
									: "bg-gray-200 text-gray-700 hover:bg-gray-300"
							}`}
						>
							Price: Low to High
						</button>
					</div>
				</div>

				<div>
					<h2 className="font-semibold text-gray-900 mb-2">
						Incomplete ({incompleteGifts.length})
					</h2>
					<div className="bg-white rounded shadow">
						{incompleteGifts.length === 0 ? (
							<div className="px-4 py-3 text-gray-400 text-center">
								All gifts completed! 🎉
							</div>
						) : (
							<ul className="divide-y">
								{incompleteGifts.map((gift: Gift) => (
									<li
										key={gift.id}
										className="flex items-center px-4 py-3 cursor-pointer hover:bg-yellow-50"
										onClick={() => handleToggleGift(gift.id)}
									>
										<input
											type="checkbox"
											checked={gift.isCompleted}
											readOnly
											className="mr-3 accent-yellow-500"
										/>
										<div className="flex-1">
											<div className="text-gray-900">{gift.name}</div>
											<div className="text-sm text-gray-600">
												For: {gift.recipient}
											</div>
											{gift.description && (
												<div className="text-xs text-gray-500">
													{gift.description}
												</div>
											)}
											<div className="flex gap-4 text-xs text-gray-500 mt-1">
												{gift.price > 0 && (
													<span>${gift.price.toFixed(2)}</span>
												)}
												{gift.store && <span>Store: {gift.store}</span>}
											</div>
											{gift.notes && (
												<div className="text-xs text-gray-500 mt-1">
													{gift.notes}
												</div>
											)}
										</div>
										<div className="flex flex-col gap-1">
											{gift.productLink && (
												<a
													href={gift.productLink}
													target="_blank"
													rel="noopener noreferrer"
													onClick={(e) => e.stopPropagation()}
													className="text-blue-500 hover:text-blue-700 text-xs"
												>
													🔗 Link
												</a>
											)}
											<button
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteGift(gift.id);
												}}
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
				</div>

				<div>
					<h2 className="font-semibold text-gray-400 mb-2">
						Completed ({completedGifts.length})
					</h2>
					<div className="bg-white rounded shadow">
						{completedGifts.length === 0 ? (
							<div className="px-4 py-3 text-gray-300 text-center">
								No completed gifts yet.
							</div>
						) : (
							<ul className="divide-y">
								{completedGifts.map((gift: Gift) => (
									<li
										key={gift.id}
										className="flex items-center px-4 py-3 cursor-pointer hover:bg-yellow-50 opacity-60"
										onClick={() => handleToggleGift(gift.id)}
									>
										<input
											type="checkbox"
											checked={gift.isCompleted}
											readOnly
											className="mr-3 accent-yellow-500"
										/>
										<div className="flex-1">
											<div className="line-through text-gray-400">
												{gift.name}
											</div>
											<div className="text-sm text-gray-400 line-through">
												For: {gift.recipient}
											</div>
											{gift.description && (
												<div className="text-xs text-gray-400 line-through">
													{gift.description}
												</div>
											)}
											{gift.completedDate && (
												<div className="text-xs text-green-600 mt-1">
													Completed:{" "}
													{new Date(gift.completedDate).toLocaleDateString()}
												</div>
											)}
										</div>
										<div className="flex flex-col gap-1">
											{gift.productLink && (
												<a
													href={gift.productLink}
													target="_blank"
													rel="noopener noreferrer"
													onClick={(e) => e.stopPropagation()}
													className="text-blue-500 hover:text-blue-700 text-xs"
												>
													🔗 Link
												</a>
											)}
											<button
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteGift(gift.id);
												}}
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
				</div>
			</main>

			{/* Form Modal */}
			{showForm && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-md mx-4 w-full max-h-[90vh] overflow-y-auto">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-semibold">Add New Gift</h3>
							<button
								onClick={closeForm}
								className="text-gray-400 hover:text-gray-600 text-xl"
							>
								×
							</button>
						</div>
						<form onSubmit={handleAddGift} className="space-y-4">
							<input
								className="border rounded px-3 py-2 text-gray-900 placeholder-gray-700 w-full"
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
									<h4 className="text-sm font-medium mb-1">
										From Address Book:
									</h4>
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
								className="border rounded px-3 py-2 text-gray-900 placeholder-gray-700 w-full"
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
							<input
								className="border rounded px-3 py-2 text-gray-900 placeholder-gray-700 w-full"
								placeholder="Product Link (optional)"
								type="url"
								value={form.productLink}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, productLink: e.target.value }))
								}
							/>
							<textarea
								className="border rounded px-3 py-2 text-gray-900 placeholder-gray-700 w-full"
								placeholder="Notes"
								value={form.notes}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, notes: e.target.value }))
								}
								rows={2}
							/>
							<div className="flex gap-3 pt-2">
								<button
									type="button"
									onClick={closeForm}
									className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
									disabled={loading}
								>
									{loading ? "Adding..." : "Add Gift"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			{deleteConfirm.show && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-sm mx-4">
						<h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
						<p className="text-gray-600 mb-6">
							Are you sure you want to delete this gift? This action cannot be
							undone.
						</p>
						<div className="flex gap-3">
							<button
								onClick={cancelDelete}
								className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={confirmDelete}
								className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
