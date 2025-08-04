"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchEasterGifts,
	addEasterGift,
	updateEasterGift,
	deleteEasterGift,
	toggleEasterGiftCompletion,
	setSelectedEasterGift,
	clearEasterError,
} from "@/store/slices/easterGiftListSlice";
import { BudgetDisplay } from "@/components/common/BudgetDisplay";

export default function EasterGiftListPage() {
	const dispatch = useAppDispatch();
	const gifts = useAppSelector((state) => state.easterGiftList.gifts);
	const loading = useAppSelector((state) => state.easterGiftList.loading);
	const error = useAppSelector((state) => state.easterGiftList.error);
	const selectedGift = useAppSelector(
		(state) => state.easterGiftList.selectedGift
	);

	const [showAddForm, setShowAddForm] = useState(false);
	const [editingGift, setEditingGift] = useState<any>(null);
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		price: 0,
		recipient: "",
		store: "",
		productLink: "",
		notes: "",
	});

	useEffect(() => {
		dispatch(fetchEasterGifts());
	}, [dispatch]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (editingGift) {
			await dispatch(
				updateEasterGift({
					...editingGift,
					...formData,
				})
			);
			setEditingGift(null);
		} else {
			await dispatch(addEasterGift({ ...formData, isCompleted: false }));
		}
		setFormData({
			name: "",
			description: "",
			price: 0,
			recipient: "",
			store: "",
			productLink: "",
			notes: "",
		});
		setShowAddForm(false);
	};

	const handleEdit = (gift: any) => {
		setEditingGift(gift);
		setFormData({
			name: gift.name,
			description: gift.description || "",
			price: gift.price,
			recipient: gift.recipient,
			store: gift.store || "",
			productLink: gift.productLink || "",
			notes: gift.notes || "",
		});
		setShowAddForm(true);
	};

	const handleDelete = async (giftId: string) => {
		if (confirm("Are you sure you want to delete this gift?")) {
			await dispatch(deleteEasterGift(giftId));
		}
	};

	const handleToggleCompletion = async (giftId: string) => {
		await dispatch(toggleEasterGiftCompletion(giftId));
	};

	const totalSpent = gifts
		.filter((gift) => gift.isCompleted)
		.reduce((sum, gift) => sum + gift.price, 0);

	const totalBudget = gifts.reduce((sum, gift) => sum + gift.price, 0);

	return (
		<div className="min-h-screen easter-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/easter"
						className="absolute left-0 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 text-xl"
					>
						←
					</Link>
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
							Easter Gift List
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Track your Easter gift ideas
						</p>
					</div>
				</div>
			</header>

			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				{/* Budget Display */}
				<BudgetDisplay holiday="Easter" />

				{/* Summary */}
				{gifts.length > 0 && (
					<div className="card rounded-lg p-4">
						<h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
							Summary
						</h3>
						<div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
							<div>Total Gifts: {gifts.length}</div>
							<div>Completed: {gifts.filter((g) => g.isCompleted).length}</div>
							<div>Total Budget: ${totalBudget.toFixed(2)}</div>
							<div>Spent: ${totalSpent.toFixed(2)}</div>
							<div>Remaining: ${(totalBudget - totalSpent).toFixed(2)}</div>
						</div>
					</div>
				)}

				{/* Add Gift Button */}
				<button
					onClick={() => setShowAddForm(true)}
					className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
					style={{ backgroundColor: "#a855f7", color: "white" }}
				>
					Add New Gift
				</button>

				{/* Error Display */}
				{error && (
					<div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
						{error}
						<button
							onClick={() => dispatch(clearEasterError())}
							className="float-right font-bold"
						>
							×
						</button>
					</div>
				)}

				{/* Incomplete Gifts */}
				<div>
					<h2 className="font-semibold text-gray-900 dark:text-white mb-2">
						Incomplete ({gifts.filter((g) => !g.isCompleted).length})
					</h2>
					<div className="card card-gifts rounded shadow">
						{gifts.filter((g) => !g.isCompleted).length === 0 ? (
							<div className="px-4 py-3 text-gray-400 dark:text-gray-500 text-center">
								All gifts completed! 🎉
							</div>
						) : (
							<ul className="divide-y divide-gray-200 dark:divide-gray-700">
								{gifts
									.filter((g) => !g.isCompleted)
									.map((gift) => (
										<li
											key={gift.id}
											className="flex items-center px-4 py-3 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20"
											onClick={() => handleToggleCompletion(gift.id)}
										>
											<input
												type="checkbox"
												checked={gift.isCompleted}
												readOnly
												className="mr-3 accent-purple-500"
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
												<div className="flex gap-2">
													<button
														onClick={(e) => {
															e.stopPropagation();
															handleEdit(gift);
														}}
														className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
													>
														Edit
													</button>
													<button
														onClick={(e) => {
															e.stopPropagation();
															handleDelete(gift.id);
														}}
														className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
													>
														Delete
													</button>
												</div>
											</div>
										</li>
									))}
							</ul>
						)}
					</div>
				</div>

				{/* Completed Gifts */}
				<div>
					<h2 className="font-semibold text-gray-400 dark:text-gray-500 mb-2">
						Completed ({gifts.filter((g) => g.isCompleted).length})
					</h2>
					<div className="card card-gifts rounded shadow">
						{gifts.filter((g) => g.isCompleted).length === 0 ? (
							<div className="px-4 py-3 text-gray-300 dark:text-gray-600 text-center">
								No completed gifts yet.
							</div>
						) : (
							<ul className="divide-y divide-gray-200 dark:divide-gray-700">
								{gifts
									.filter((g) => g.isCompleted)
									.map((gift) => (
										<li
											key={gift.id}
											className="flex items-center px-4 py-3 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 opacity-60"
											onClick={() => handleToggleCompletion(gift.id)}
										>
											<input
												type="checkbox"
												checked={gift.isCompleted}
												readOnly
												className="mr-3 accent-purple-500"
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
												<div className="flex gap-2">
													<button
														onClick={(e) => {
															e.stopPropagation();
															handleEdit(gift);
														}}
														className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
													>
														Edit
													</button>
													<button
														onClick={(e) => {
															e.stopPropagation();
															handleDelete(gift.id);
														}}
														className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
													>
														Delete
													</button>
												</div>
											</div>
										</li>
									))}
							</ul>
						)}
					</div>
				</div>
			</main>

			{/* Form Modal */}
			{showAddForm && (
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
								onClick={() => {
									setShowAddForm(false);
									setEditingGift(null);
									setFormData({
										name: "",
										description: "",
										price: 0,
										recipient: "",
										store: "",
										productLink: "",
										notes: "",
									});
								}}
								className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
								style={{ color: "#4b5563" }}
							>
								×
							</button>
						</div>
						<form onSubmit={handleSubmit} className="space-y-4">
							<input
								className="border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
								placeholder="Gift Name*"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								required
								style={{ color: "#111827", backgroundColor: "white" }}
							/>
							<input
								className="border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
								placeholder="Recipient*"
								value={formData.recipient}
								onChange={(e) =>
									setFormData({ ...formData, recipient: e.target.value })
								}
								required
								style={{ color: "#111827", backgroundColor: "white" }}
							/>
							<input
								className="border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
								placeholder="Description"
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
								style={{ color: "#111827", backgroundColor: "white" }}
							/>
							<div className="flex gap-2">
								<input
									className="flex-1 border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
									placeholder="Price"
									type="number"
									step="0.01"
									value={formData.price}
									onChange={(e) =>
										setFormData({
											...formData,
											price: parseFloat(e.target.value) || 0,
										})
									}
									style={{ color: "#111827", backgroundColor: "white" }}
								/>
								<input
									className="flex-1 border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
									placeholder="Store"
									value={formData.store}
									onChange={(e) =>
										setFormData({ ...formData, store: e.target.value })
									}
									style={{ color: "#111827", backgroundColor: "white" }}
								/>
							</div>
							<input
								className="border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
								placeholder="Product Link"
								type="url"
								value={formData.productLink}
								onChange={(e) =>
									setFormData({ ...formData, productLink: e.target.value })
								}
								style={{ color: "#111827", backgroundColor: "white" }}
							/>
							<textarea
								className="border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
								placeholder="Notes"
								value={formData.notes}
								onChange={(e) =>
									setFormData({ ...formData, notes: e.target.value })
								}
								rows={2}
								style={{ color: "#111827", backgroundColor: "white" }}
							/>
							<div className="flex gap-2">
								<button
									type="submit"
									className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-md transition-colors"
									style={{ backgroundColor: "#a855f7", color: "white" }}
								>
									{editingGift ? "Update Gift" : "Add Gift"}
								</button>
								<button
									type="button"
									onClick={() => {
										setShowAddForm(false);
										setEditingGift(null);
										setFormData({
											name: "",
											description: "",
											price: 0,
											recipient: "",
											store: "",
											productLink: "",
											notes: "",
										});
									}}
									className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors"
								>
									Cancel
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
