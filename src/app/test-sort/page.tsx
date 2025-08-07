"use client";

import { getHolidayCountdownTime } from "@/utils/holidayUtils";
import { holidayData } from "@/data/holidayData";

export default function TestSortPage() {
	// Mock state with some countdown data
	const mockState = {
		cards: { cards: [] },
		giftList: { gifts: [] },
		tasks: { tasks: [] },
		addressBook: { contacts: [] },
		hanukkahGiftList: { gifts: [] },
		hanukkahTasks: { tasks: [] },
		kwanzaaGiftList: { gifts: [] },
		kwanzaaTasks: { tasks: [] },
		newYearGiftList: { gifts: [] },
		newYearTasks: { tasks: [] },
		valentinesGiftList: { gifts: [] },
		valentinesTasks: { tasks: [] },
		easterGiftList: { gifts: [] },
		easterTasks: { tasks: [] },
		halloweenGiftList: { gifts: [] },
		halloweenTasks: { tasks: [] },
		thanksgivingGiftList: { gifts: [] },
		thanksgivingTasks: { tasks: [] },
		mothersDayGiftList: { gifts: [] },
		mothersDayTasks: { tasks: [] },
		fathersDayGiftList: { gifts: [] },
		fathersDayTasks: { tasks: [] },
		fourthOfJulyTasks: { tasks: [] },
		birthdayGiftList: { gifts: [] },
		birthdayTasks: { tasks: [] },
		birthdayCards: { cards: [] },
		birthdayAddressBook: { contacts: [] },
		anniversaryGiftList: { gifts: [] },
		anniversaryTasks: { tasks: [] },
		graduationGiftList: { gifts: [] },
		graduationTasks: { tasks: [] },
		graduationCards: { cards: [] },
		graduationAddressBook: { contacts: [] },
		babyShowerGiftList: { gifts: [] },
		babyShowerTasks: { tasks: [] },
		babyShowerAddressBook: { contacts: [] },
		// Mock countdown states
		countdown: { targetDate: null, isActive: false },
		hanukkahCountdown: {
			targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
			isActive: true,
		},
		kwanzaaCountdown: { targetDate: null, isActive: false },
		newYearCountdown: {
			targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
			isActive: true,
		},
		valentinesCountdown: { targetDate: null, isActive: false },
		easterCountdown: { targetDate: null, isActive: false },
		halloweenCountdown: {
			targetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
			isActive: true,
		},
		thanksgivingCountdown: {
			targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
			isActive: true,
		},
	};

	// Sort holidays by countdown timer
	const sortedHolidays = [...holidayData].sort((a, b) => {
		const aCountdown = getHolidayCountdownTime(a.name, mockState);
		const bCountdown = getHolidayCountdownTime(b.name, mockState);

		// Sort by countdown time (closest first, then expired, then no countdown)
		return aCountdown - bCountdown;
	});

	return (
		<div className="min-h-screen bg-gray-100 p-8">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl font-bold mb-6">Holiday Sorting Test</h1>

				<div className="bg-white rounded-lg shadow p-6 mb-6">
					<h2 className="text-xl font-semibold mb-4">
						Sorted Holidays (by countdown)
					</h2>
					<div className="space-y-2">
						{sortedHolidays.map((holiday, index) => {
							const countdown = getHolidayCountdownTime(
								holiday.name,
								mockState
							);
							const countdownText =
								countdown === Infinity
									? "No countdown set"
									: countdown === 0
									? "Expired"
									: `${Math.floor(
											countdown / (1000 * 60 * 60 * 24)
									  )} days remaining`;

							return (
								<div
									key={holiday.id}
									className="flex justify-between items-center p-3 bg-gray-50 rounded"
								>
									<div>
										<span className="font-medium">{index + 1}.</span>{" "}
										{holiday.name}
									</div>
									<div className="text-sm text-gray-600">{countdownText}</div>
								</div>
							);
						})}
					</div>
				</div>

				<div className="bg-white rounded-lg shadow p-6">
					<h2 className="text-xl font-semibold mb-4">Countdown Details</h2>
					<div className="space-y-2">
						{Object.entries(mockState)
							.filter(([key, value]) => key.includes("Countdown"))
							.map(([key, value]) => (
								<div
									key={key}
									className="flex justify-between items-center p-2 bg-gray-50 rounded"
								>
									<span className="font-medium">{key}:</span>
									<span className="text-sm">
										{value.isActive ? value.targetDate : "Not active"}
									</span>
								</div>
							))}
					</div>
				</div>
			</div>
		</div>
	);
}
