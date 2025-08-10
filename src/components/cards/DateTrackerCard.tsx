interface DateTrackerCardProps {
	totalIdeas: number;
	completedIdeas: number;
	highPriorityIdeas: number;
	dueSoonIdeas: number;
}

export default function DateTrackerCard({
	totalIdeas,
	completedIdeas,
	highPriorityIdeas,
	dueSoonIdeas,
}: DateTrackerCardProps) {
	return (
		<div className="card card-valentines rounded-2xl p-4">
			<div className="grid grid-cols-2 gap-4 text-center">
				<div>
					<p className="text-sm text-gray-600 dark:text-gray-400">
						Total Ideas
					</p>
					<p className="text-2xl font-bold text-gray-800 dark:text-white">
						{totalIdeas}
					</p>
				</div>
				<div>
					<p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
					<p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
						{completedIdeas}
					</p>
				</div>
				<div>
					<p className="text-sm text-gray-600 dark:text-gray-400">
						High Priority
					</p>
					<p className="text-lg font-bold text-red-600 dark:text-red-400">
						{highPriorityIdeas}
					</p>
				</div>
				<div>
					<p className="text-sm text-gray-600 dark:text-gray-400">Due Soon</p>
					<p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
						{dueSoonIdeas}
					</p>
				</div>
			</div>
		</div>
	);
}
