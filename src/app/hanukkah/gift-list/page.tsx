"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchHanukkahGifts,
	addHanukkahGift,
	updateHanukkahGift,
	deleteHanukkahGift,
	toggleHanukkahGiftCompletion,
	HanukkahGift,
} from "@/store/slices/hanukkahGiftListSlice";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import { HanukkahBudgetDisplay } from "@/components/HanukkahBudgetDisplay";
import SortModal from "@/components/SortModal";

type SortOption = "recipient" | "store" | "price-high" | "price-low" | "none";

export default function HanukkahGiftListPage() {
	const dispatch = useAppDispatch();
	const { gifts, loading, error, initialized } = useAppSelector(
		(state: any) => state.hanukkahGiftList
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
	const [showSortModal, setShowSortModal] = useState(false);
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		giftId: string | null;
	}>({
		show: false,
		giftId: null,
	});
	const [showForm, setShowForm] = useState(false);

	useEffect(() => {
		// Fetch gifts and contacts when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchHanukkahGifts());
		}
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch, initialized]);

	function handleAddGift(e: React.FormEvent) {
		e.preventDefault();
		if (!form.name.trim() || !form.recipient.trim()) return;

		const newGift: Omit<HanukkahGift, "id" | "createdAt" | "updatedAt"> = {
			name: form.name,
			description: form.description || undefined,
			price: parseFloat(form.price) || 0,
			recipient: form.recipient,
			isCompleted: false,
			store: form.store || undefined,
			productLink: form.productLink || undefined,
			notes: form.notes || undefined,
		};

		dispatch(addHanukkahGift(newGift));
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
		dispatch(toggleHanukkahGiftCompletion(giftId));
	}

	function handleDeleteGift(giftId: string) {
		setDeleteConfirm({ show: true, giftId });
	}

	function confirmDelete() {
		if (deleteConfirm.giftId) {
			dispatch(deleteHanukkahGift(deleteConfirm.giftId));
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

	function sortGifts(giftsToSort: HanukkahGift[]): HanukkahGift[] {
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
			<div className="min-h-screen hanukkah-gifts-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading gifts...</p>
				</div>
			</div>
		);
	}

	const sortedGifts = sortGifts(gifts);
	const incompleteGifts = sortedGifts.filter(
		(gift: HanukkahGift) => !gift.isCompleted
	);
	const completedGifts = sortedGifts.filter(
		(gift: HanukkahGift) => gift.isCompleted
	);

	return (
		<div className="min-h-screen hanukkah-gifts-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/hanukkah"
						className="absolute left-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xl"
					>
						←
					</Link>
					<h1 className="text-2xl font-bold text-gray-800 dark:text-white">
						Hanukkah Gift List
					</h1>
					<button
						onClick={() => setShowSortModal(true)}
						className="absolute right-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xl"
						title="Sort gifts"
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
				{/* Budget Display */}
				<HanukkahBudgetDisplay />

				<button
					onClick={openForm}
					className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
					style={{ backgroundColor: "#3b82f6", color: "white" }}
				>
					Add New Gift
				</button>
				<div className="flex items-center justify-center">
					{sortBy !== "none" && (
						<div className="text-center text-sm text-gray-600 dark:text-gray-400">
							{sortBy === "recipient" && "Sorted by Recipient"}
							{sortBy === "store" && "Sorted by Store"}
							{sortBy === "price-high" && "Sorted by Price (High to Low)"}
							{sortBy === "price-low" && "Sorted by Price (Low to High)"}
						</div>
					)}
				</div>

				<div>
					<h2 className="font-semibold text-gray-900 dark:text-white mb-2">
						Incomplete ({incompleteGifts.length})
					</h2>
					<div className="card card-gifts rounded shadow">
						{incompleteGifts.length === 0 ? (
							<div className="px-4 py-3 text-gray-400 dark:text-gray-500 text-center">
								All gifts completed! 🕯️
							</div>
						) : (
							<ul className="divide-y divide-gray-200 dark:divide-gray-700">
								{incompleteGifts.map((gift: HanukkahGift) => (
									<li
										key={gift.id}
										className="flex items-center px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
										onClick={() => handleToggleGift(gift.id)}
									>
										<input
											type="checkbox"
											checked={gift.isCompleted}
											readOnly
											className="mr-3 accent-blue-500"
										/>
										<div className="flex-1">
											<div className="text-gray-900 dark:text-white">
												{gift.name}
											</div>
											<div className="text-sm text-gray-600 dark:text-gray-300">
												For: {gift.recipient}
											</div>
											{gift.description && (
												<div className="text-xs text-gray-500 dark:text-gray-400">
													{gift.description}
												</div>
											)}
											<div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
												{gift.price > 0 && (
													<span>${gift.price.toFixed(2)}</span>
												)}
												{gift.store && <span>Store: {gift.store}</span>}
											</div>
											{gift.notes && (
												<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
													className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs"
												>
													🔗 Link
												</a>
											)}
											<button
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteGift(gift.id);
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
					<h2 className="font-semibold text-gray-400 dark:text-gray-500 mb-2">
						Completed ({completedGifts.length})
					</h2>
					<div className="card card-gifts rounded shadow">
						{completedGifts.length === 0 ? (
							<div className="px-4 py-3 text-gray-300 dark:text-gray-600 text-center">
								No completed gifts yet.
							</div>
						) : (
							<ul className="divide-y divide-gray-200 dark:divide-gray-700">
								{completedGifts.map((gift: HanukkahGift) => (
									<li
										key={gift.id}
										className="flex items-center px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 opacity-60"
										onClick={() => handleToggleGift(gift.id)}
									>
										<input
											type="checkbox"
											checked={gift.isCompleted}
											readOnly
											className="mr-3 accent-blue-500"
										/>
										<div className="flex-1">
											<div className="line-through text-gray-400 dark:text-gray-500">
												{gift.name}
											</div>
											<div className="text-sm text-gray-400 dark:text-gray-500 line-through">
												For: {gift.recipient}
											</div>
											{gift.description && (
												<div className="text-xs text-gray-400 dark:text-gray-500 line-through">
													{gift.description}
												</div>
											)}
											{gift.completedDate && (
												<div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
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
													className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs"
												>
													🔗 Link
												</a>
											)}
											<button
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteGift(gift.id);
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
					<div className="card card-gifts rounded-lg p-6 max-w-md mx-4 w-full max-h-[90vh] overflow-y-auto">
						<div className="flex justify-between items-center mb-4">
							<h3
								className="text-lg font-semibold text-gray-900 dark:text-white"
								style={{ color: "#111827" }}
							>
								Add New Gift
							</h3>
							<button
								onClick={closeForm}
								className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
								style={{ color: "#4b5563" }}
							>
								×
							</button>
						</div>
						<form onSubmit={handleAddGift} className="space-y-4">
							<input
								className="border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
								placeholder="Gift Name*"
								value={form.name}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, name: e.target.value }))
								}
								required
								style={{ color: "#111827", backgroundColor: "white" }}
							/>
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
											{contact.name}
										</button>
									))}
								</div>
							)}
							<input
								className="border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
								placeholder="Description"
								value={form.description}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, description: e.target.value }))
								}
								style={{ color: "#111827", backgroundColor: "white" }}
							/>
							<div className="flex gap-2">
								<input
									className="flex-1 border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
									placeholder="Price"
									type="number"
									step="0.01"
									value={form.price}
									onChange={(e) =>
										setForm((prev) => ({ ...prev, price: e.target.value }))
									}
									style={{ color: "#111827", backgroundColor: "white" }}
								/>
								<input
									className="flex-1 border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
									placeholder="Store"
									value={form.store}
									onChange={(e) =>
										setForm((prev) => ({ ...prev, store: e.target.value }))
									}
									style={{ color: "#111827", backgroundColor: "white" }}
								/>
							</div>
							<input
								className="border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
								placeholder="Product Link (optional)"
								type="url"
								value={form.productLink}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, productLink: e.target.value }))
								}
								style={{ color: "#111827", backgroundColor: "white" }}
							/>
							<textarea
								className="border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
								placeholder="Notes"
								value={form.notes}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, notes: e.target.value }))
								}
								rows={2}
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
									className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
									disabled={loading}
									style={{ backgroundColor: "#3b82f6", color: "white" }}
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
					<div className="card card-gifts rounded-lg p-6 max-w-sm mx-4">
						<h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
							Confirm Delete
						</h3>
						<p className="text-gray-600 dark:text-gray-300 mb-6">
							Are you sure you want to delete this gift? This action cannot be
							undone.
						</p>
						<div className="flex gap-3">
							<button
								onClick={cancelDelete}
								className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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

			{/* Sort Modal */}
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
					{ value: "store", label: "Store" },
					{ value: "price-high", label: "Price: High to Low" },
					{ value: "price-low", label: "Price: Low to High" },
				]}
				title="Sort Gifts"
			/>
		</div>
	);
}
