"use client";

import HolidayCard from "@/components/cards/HolidayCard";

export default function GamifiedHolidayCardExample() {
	// Example data
	const exampleHoliday = {
		id: "christmas",
		name: "Christmas",
		description: "The most wonderful time of the year",
		route: "/christmas",
		color: {
			light: "#dc2626",
			dark: "#ef4444",
			progress: "bg-red-500",
		},
		progress: 0.3, // 30% complete
		completedItems: 3,
		totalItems: 10,
	};

	return (
		<div className="space-y-6 p-6">
			<h2 className="text-2xl font-bold text-gray-800 dark:text-white">
				Gamified HolidayCard Examples
			</h2>

			<div className="space-y-4">
				{/* Default gamified mode */}
				<div>
					<h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
						Default Gamified Mode (with built-in blob)
					</h3>
					<HolidayCard {...exampleHoliday} />
				</div>

				{/* Custom blob SVG */}
				<div>
					<h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
						Custom Blob SVG
					</h3>
					<HolidayCard {...exampleHoliday} customBlobSvg="/custom-blob.svg" />
				</div>

				{/* Professional mode */}
				<div>
					<h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
						Professional Mode
					</h3>
					<HolidayCard {...exampleHoliday} />
				</div>

				{/* Almost complete example */}
				<div>
					<h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
						Almost Complete (few tasks remaining)
					</h3>
					<HolidayCard
						{...exampleHoliday}
						progress={0.8}
						completedItems={8}
						totalItems={10}
					/>
				</div>

				{/* Complete example */}
				<div>
					<h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
						Complete (no tasks!)
					</h3>
					<HolidayCard
						{...exampleHoliday}
						progress={1.0}
						completedItems={10}
						totalItems={10}
					/>
				</div>
			</div>

			<div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
				<h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
					How to Use:
				</h4>
				<ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
					<li>
						• Go to Settings → Theme → Display Mode to toggle between gamified
						and professional modes
					</li>
					<li>
						• In gamified mode, each incomplete task is represented by a
						blob/germ
					</li>
					<li>
						• Pass <code>customBlobSvg</code> prop to use your own SVG
					</li>
					<li>• The blobs animate and are positioned randomly</li>
					<li>• Progress ring shows completion percentage</li>
				</ul>
			</div>
		</div>
	);
}
