interface Card {
	id: string;
	recipient: string;
	message?: string;
	address?: string;
	notes?: string;
	isCompleted: boolean;
}

interface MailCardProps {
	card: Card;
	editingCard: Card | null;
	setEditingCard: (card: Card | null) => void;
	onUpdateCard: (e: React.FormEvent) => void;
	onToggleCompletion: (cardId: string) => void;
	onDeleteCard: (cardId: string) => void;
}

export default function MailCard({
	card,
	editingCard,
	setEditingCard,
	onUpdateCard,
	onToggleCompletion,
	onDeleteCard,
}: MailCardProps) {
	const isEditing = editingCard?.id === card.id;

	return (
		<div
			className={`card card-valentines rounded-2xl p-4 transition-all ${
				card.isCompleted ? "opacity-75" : ""
			}`}
		>
			{isEditing ? (
				<form onSubmit={onUpdateCard} className="space-y-4">
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
								onClick={() => onToggleCompletion(card.id)}
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
								onClick={() => onDeleteCard(card.id)}
								className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded text-sm font-medium transition-colors"
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
