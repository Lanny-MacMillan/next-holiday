import React from "react";

interface ReservationsTrackerProps {
	totalReservations: number;
	confirmedReservations: number;
}

const ReservationsTracker: React.FC<ReservationsTrackerProps> = ({
	totalReservations,
	confirmedReservations,
}) => {
	const completionPercentage =
		totalReservations > 0
			? Math.round((confirmedReservations / totalReservations) * 100)
			: 0;

	return (
		<div className="card card-valentines rounded-2xl p-4">
			<div className="grid grid-cols-2 gap-4 text-center">
				<div>
					<p className="text-sm text-gray-600 dark:text-gray-400">
						Total Reservations
					</p>
					<p className="text-2xl font-bold text-gray-800 dark:text-white">
						{totalReservations}
					</p>
				</div>
				<div>
					<p className="text-sm text-gray-600 dark:text-gray-400">Confirmed</p>
					<p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
						{confirmedReservations}
					</p>
				</div>
			</div>

			{/* Progress Bar */}
			{totalReservations > 0 && (
				<div className="mt-4">
					<div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
						<span>Progress</span>
						<span>{completionPercentage}%</span>
					</div>
					<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
						<div
							className="bg-pink-500 h-2 rounded-full transition-all duration-300"
							style={{ width: `${completionPercentage}%` }}
						></div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ReservationsTracker;
