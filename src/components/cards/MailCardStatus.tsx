interface MailCardStatusProps {
	totalCards: number;
	completedCards: number;
	incompleteCards: number;
}

export default function MailCardStatus({
	totalCards,
	completedCards,
	incompleteCards,
}: MailCardStatusProps) {
	const progressPercentage =
		totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

	return (
		<div className="card card-valentines rounded-2xl p-4">
			<div className="grid grid-cols-2 gap-4 text-center">
				<div>
					<p className="text-sm text-gray-600 dark:text-gray-400">
						Total Cards
					</p>
					<p className="text-2xl font-bold text-gray-800 dark:text-white">
						{totalCards}
					</p>
				</div>
				<div>
					<p className="text-sm text-gray-600 dark:text-gray-400">Sent</p>
					<p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
						{completedCards}
					</p>
				</div>
				<div>
					<p className="text-sm text-gray-600 dark:text-gray-400">To Send</p>
					<p className="text-lg font-bold text-gray-800 dark:text-white">
						{incompleteCards}
					</p>
				</div>
				<div>
					<p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
					<p className="text-lg font-bold text-pink-600 dark:text-pink-400">
						{progressPercentage}%
					</p>
				</div>
			</div>
		</div>
	);
}
