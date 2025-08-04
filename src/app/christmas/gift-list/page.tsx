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
import { BudgetDisplay } from "@/components/common/BudgetDisplay";
import SortModal from "@/components/modals/SortModal";
import GiftCardItem from "@/components/cards/gift/GiftCardItem";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";

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
	const [showSortModal, setShowSortModal] = useState(false);
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		giftId: string | null;
	}>({
		show: false,
		giftId: null,
	});
	const [showForm, setShowForm] = useState(false);
	const [editingGift, setEditingGift] = useState<Gift | null>(null);

	useEffect(() => {
		// Fetch gifts and contacts when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchGifts());
		}
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch, initialized]);

	function handleAddGift(e: React.FormEvent) {
		e.preventDefault();
		if (!form.name.trim() || !form.recipient.trim()) return;

		if (editingGift) {
			// Update existing gift
			const updatedGift: Gift = {
				...editingGift,
				name: form.name,
				description: form.description || undefined,
				price: parseFloat(form.price) || 0,
				recipient: form.recipient,
				store: form.store || undefined,
				productLink: form.productLink || undefined,
				notes: form.notes || undefined,
			};

			dispatch(updateGift(updatedGift));
			setEditingGift(null);
		} else {
			// Add new gift
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
		}

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
		setEditingGift(null);
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

	function handleEditGift(gift: Gift) {
		setEditingGift(gift);
		setForm({
			name: gift.name,
			description: gift.description || "",
			price: gift.price.toString(),
			recipient: gift.recipient,
			store: gift.store || "",
			productLink: gift.productLink || "",
			notes: gift.notes || "",
		});
		setShowForm(true);
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
			<div className="min-h-screen christmas-gifts-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading gifts...</p>
				</div>
			</div>
		);
	}

	const sortedGifts = sortGifts(gifts);
	const incompleteGifts = sortedGifts.filter((gift: Gift) => !gift.isCompleted);
	const completedGifts = sortedGifts.filter((gift: Gift) => gift.isCompleted);

	return (
		<div className="min-h-screen christmas-gifts-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/christmas"
						className="absolute left-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xl"
					>
						←
					</Link>
					<h1 className="text-2xl font-bold text-gray-800 dark:text-white">
						Gift List
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
				<BudgetDisplay holiday="Christmas" />

				<button
					onClick={openForm}
					className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
					style={{ backgroundColor: "#eab308", color: "white" }}
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
								All gifts completed! 🎉
							</div>
						) : (
							<ul className="divide-y divide-gray-200 dark:divide-gray-700">
								{incompleteGifts.map((gift: Gift) => (
									<GiftCardItem
										key={gift.id}
										gift={gift}
										isCompleted={false}
										onToggle={handleToggleGift}
										onEdit={handleEditGift}
										onDelete={handleDeleteGift}
										loading={loading}
										theme={{
											accentColor: "#eab308", // Yellow for Christmas
										}}
									/>
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
								{completedGifts.map((gift: Gift) => (
									<GiftCardItem
										key={gift.id}
										gift={gift}
										isCompleted={true}
										onToggle={handleToggleGift}
										onEdit={handleEditGift}
										onDelete={handleDeleteGift}
										loading={loading}
										theme={{
											accentColor: "#eab308", // Yellow for Christmas
										}}
									/>
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
								{editingGift ? "Edit Gift" : "Add New Gift"}
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
									className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
									disabled={loading}
									style={{ backgroundColor: "#eab308", color: "white" }}
								>
									{loading
										? editingGift
											? "Updating..."
											: "Adding..."
										: editingGift
										? "Update Gift"
										: "Add Gift"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={deleteConfirm.show}
				{...getDeleteConfig("gifts")}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={loading}
			/>

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
