"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMothersDayGifts } from "@/store/slices/mothers-day/mothersDayGiftListSlice";
import GiftListCard from "@/components/cards/gift/GiftListCard";

export default function MothersDayGiftListPage() {
	const dispatch = useAppDispatch();
	const gifts = useAppSelector((state: any) => state.mothersDayGiftList.gifts);

	useEffect(() => {
		dispatch(fetchMothersDayGifts());
	}, [dispatch]);

	return (
		<div className="min-h-screen mothers-day-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/mothers-day"
						className="absolute left-0 text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-300 text-xl"
					>
						←
					</Link>
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
							🌸 Mother's Day Gift Ideas
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Track your gift ideas for Mom
						</p>
					</div>
				</div>
			</header>
			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<GiftListCard
					holiday="Mother's Day"
					href="/mothers-day/gift-list"
					theme={{
						primaryColor: "#ec4899",
						accentColor: "#f472b6",
					}}
				/>
			</main>
		</div>
	);
}
