"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchNewYearGifts,
	addNewYearGift,
	updateNewYearGift,
	deleteNewYearGift,
	toggleNewYearGiftCompletion,
	NewYearGift,
} from "@/store/slices/newYearGiftListSlice";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import { BudgetDisplay } from "@/components/common/BudgetDisplay";
import SortModal from "@/components/modals/SortModal";

type SortOption = "recipient" | "store" | "price-high" | "price-low" | "none";

export default function NewYearSuppliesListPage() {
	const dispatch = useAppDispatch();
	const { gifts, loading, error, initialized } = useAppSelector(
		(state: any) => state.newYearGiftList
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
			dispatch(fetchNewYearGifts());
		}
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch, initialized]);

	function handleAddGift(e: React.FormEvent) {
		e.preventDefault();
		if (!form.name.trim() || !form.recipient.trim()) return;

		const newGift: Omit<NewYearGift, "id" | "createdAt" | "updatedAt"> = {
			name: form.name,
			description: form.description || undefined,
			price: parseFloat(form.price) || 0,
			recipient: form.recipient,
			isCompleted: false,
			store: form.store || undefined,
			productLink: form.productLink || undefined,
			notes: form.notes || undefined,
		};

		dispatch(addNewYearGift(newGift));
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
		dispatch(toggleNewYearGiftCompletion(giftId));
	}

	function handleDeleteGift(giftId: string) {
		setDeleteConfirm({ show: true, giftId });
	}

	function confirmDelete() {
		if (deleteConfirm.giftId) {
			dispatch(deleteNewYearGift(deleteConfirm.giftId));
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

	function sortGifts(giftsToSort: NewYearGift[]): NewYearGift[] {
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
			<div className="min-h-screen new-year-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading supplies...
					</p>
				</div>
			</div>
		);
	}

	const sortedGifts = sortGifts(gifts);
	const incompleteGifts = sortedGifts.filter(
		(gift: NewYearGift) => !gift.isCompleted
	);
	const completedGifts = sortedGifts.filter(
		(gift: NewYearGift) => gift.isCompleted
	);

	return (
		<div className="min-h-screen new-year-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/new-year"
						className="absolute left-0 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 text-xl"
					>
						←
					</Link>
					<h1 className="text-2xl font-bold text-gray-800 dark:text-white">
						Supplies List
					</h1>
					<button
						onClick={() => setShowSortModal(true)}
						className="absolute right-0 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 text-xl"
						title="Sort supplies"
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
				<BudgetDisplay holiday="New Year" />

				<button
					onClick={openForm}
					className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 transition-colors"
				>
					Add New Supply Item
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
								All supplies completed! 🎉
							</div>
						) : (
							<ul className="divide-y divide-gray-200 dark:divide-gray-700">
								{incompleteGifts.map((gift: NewYearGift) => (
									<li
										key={gift.id}
										className="flex items-center px-4 py-3 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20"
										onClick={() => handleToggleGift(gift.id)}
									>
										<input
											type="checkbox"
											checked={gift.isCompleted}
											readOnly
											className="mr-3 accent-amber-500"
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
										</div>
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteGift(gift.id);
											}}
											className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2"
											title="Delete supply item"
										>
											×
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>

				{completedGifts.length > 0 && (
					<div>
						<h2 className="font-semibold text-gray-900 dark:text-white mb-2">
							Completed ({completedGifts.length})
						</h2>
						<div className="card card-gifts rounded shadow">
							<ul className="divide-y divide-gray-200 dark:divide-gray-700">
								{completedGifts.map((gift: NewYearGift) => (
									<li
										key={gift.id}
										className="flex items-center px-4 py-3 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20"
										onClick={() => handleToggleGift(gift.id)}
									>
										<input
											type="checkbox"
											checked={gift.isCompleted}
											readOnly
											className="mr-3 accent-amber-500"
										/>
										<div className="flex-1">
											<div className="text-gray-900 dark:text-white line-through">
												{gift.name}
											</div>
											<div className="text-sm text-gray-600 dark:text-gray-300 line-through">
												For: {gift.recipient}
											</div>
											{gift.description && (
												<div className="text-xs text-gray-500 dark:text-gray-400 line-through">
													{gift.description}
												</div>
											)}
											<div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
												{gift.price > 0 && (
													<span>${gift.price.toFixed(2)}</span>
												)}
												{gift.store && <span>Store: {gift.store}</span>}
											</div>
										</div>
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteGift(gift.id);
											}}
											className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2"
											title="Delete supply item"
										>
											×
										</button>
									</li>
								))}
							</ul>
						</div>
					</div>
				)}

				{/* Form Modal */}
				{showForm && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
						<div className="card card-gifts rounded-lg p-6 max-w-md mx-4 w-full max-h-[90vh] overflow-y-auto">
							<div className="flex justify-between items-center mb-4">
								<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
									Add New Supply Item
								</h3>
								<button
									onClick={closeForm}
									className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
								>
									×
								</button>
							</div>
							<form onSubmit={handleAddGift} className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Item Name *
									</label>
									<input
										type="text"
										value={form.name}
										onChange={(e) => setForm({ ...form, name: e.target.value })}
										className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Description
									</label>
									<textarea
										value={form.description}
										onChange={(e) =>
											setForm({ ...form, description: e.target.value })
										}
										className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
										rows={2}
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
											Price
										</label>
										<input
											type="number"
											step="0.01"
											value={form.price}
											onChange={(e) =>
												setForm({ ...form, price: e.target.value })
											}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
											Recipient *
										</label>
										<input
											type="text"
											value={form.recipient}
											onChange={(e) =>
												setForm({ ...form, recipient: e.target.value })
											}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
											required
										/>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
											Store
										</label>
										<input
											type="text"
											value={form.store}
											onChange={(e) =>
												setForm({ ...form, store: e.target.value })
											}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
											Product Link
										</label>
										<input
											type="url"
											value={form.productLink}
											onChange={(e) =>
												setForm({ ...form, productLink: e.target.value })
											}
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
										/>
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
										Notes
									</label>
									<textarea
										value={form.notes}
										onChange={(e) =>
											setForm({ ...form, notes: e.target.value })
										}
										className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
										rows={2}
									/>
								</div>
								<div className="flex gap-2">
									<button
										type="submit"
										className="flex-1 bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 transition-colors"
									>
										Add Supply Item
									</button>
									<button
										type="button"
										onClick={closeForm}
										className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
									>
										Cancel
									</button>
								</div>
							</form>
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
						{ value: "none", label: "No Sorting" },
						{ value: "recipient", label: "Sort by Recipient" },
						{ value: "store", label: "Sort by Store" },
						{ value: "price-high", label: "Sort by Price (High to Low)" },
						{ value: "price-low", label: "Sort by Price (Low to High)" },
					]}
					title="Sort Supplies"
				/>

				{/* Delete Confirmation Modal */}
				{deleteConfirm.show && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
						<div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
								Delete Supply Item
							</h3>
							<p className="text-gray-600 dark:text-gray-400 mb-6">
								Are you sure you want to delete this supply item? This action
								cannot be undone.
							</p>
							<div className="flex gap-2">
								<button
									onClick={confirmDelete}
									className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
								>
									Delete
								</button>
								<button
									onClick={cancelDelete}
									className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				)}
			</main>

			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
