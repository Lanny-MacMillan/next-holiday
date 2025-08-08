import React from "react";
import GiftListCard from "./GiftListCard";

// Example usage of the GiftListCard component for different holidays
export default function GiftCardExample() {
	return (
		<div className="space-y-8 p-6">
			<h2 className="text-2xl font-bold text-gray-800 mb-6">
				GiftListCard Component Examples
			</h2>

			{/* Christmas Example */}
			<div>
				<h3 className="text-lg font-semibold text-gray-700 mb-4">
					Christmas Theme
				</h3>
				<GiftListCard
					holidayName="Christmas"
					budget={{
						spent: 199.99,
						total: 500,
					}}
					giftList={{
						totalItems: 5,
						completedItems: 2,
					}}
					theme={{
						primaryColor: "#22c55e", // Green
						accentColor: "#eab308", // Yellow
					}}
				/>
			</div>

			{/* Valentine's Day Example */}
			<div>
				<h3 className="text-lg font-semibold text-gray-700 mb-4">
					Valentine's Day Theme
				</h3>
				<GiftListCard
					holidayName="Valentine's Day"
					budget={{
						spent: 150.5,
						total: 300,
					}}
					giftList={{
						totalItems: 3,
						completedItems: 1,
					}}
					theme={{
						primaryColor: "#ec4899", // Pink
						accentColor: "#f43f5e", // Rose
					}}
				/>
			</div>

			{/* Halloween Example */}
			<div>
				<h3 className="text-lg font-semibold text-gray-700 mb-4">
					Halloween Theme
				</h3>
				<GiftListCard
					holidayName="Halloween"
					budget={{
						spent: 75.25,
						total: 200,
					}}
					giftList={{
						totalItems: 8,
						completedItems: 6,
					}}
					theme={{
						primaryColor: "#f97316", // Orange
						accentColor: "#7c3aed", // Purple
					}}
				/>
			</div>

			{/* Easter Example */}
			<div>
				<h3 className="text-lg font-semibold text-gray-700 mb-4">
					Easter Theme
				</h3>
				<GiftListCard
					holidayName="Easter"
					budget={{
						spent: 45.0,
						total: 150,
					}}
					giftList={{
						totalItems: 4,
						completedItems: 4,
					}}
					theme={{
						primaryColor: "#84cc16", // Lime green
						accentColor: "#fbbf24", // Amber
					}}
				/>
			</div>
		</div>
	);
}
