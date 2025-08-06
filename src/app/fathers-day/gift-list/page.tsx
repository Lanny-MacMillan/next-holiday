"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchFathersDayGifts } from "@/store/slices/fathersDayGiftListSlice";
import GiftListCard from "@/components/cards/gift/GiftListCard";

export default function FathersDayGiftListPage() {
	const dispatch = useAppDispatch();
	const gifts = useAppSelector((state: any) => state.fathersDayGiftList.gifts);

	useEffect(() => {
		dispatch(fetchFathersDayGifts());
	}, [dispatch]);

	return (
		<div className="min-h-screen fathers-day-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/fathers-day"
						className="absolute left-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xl"
					>
						←
					</Link>
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
							👨 Father's Day Gift Ideas
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Track your gift ideas for Dad
						</p>
					</div>
				</div>
			</header>
			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<GiftListCard
					holiday="Father's Day"
					href="/fathers-day/gift-list"
					theme={{
						primaryColor: "#3b82f6",
						accentColor: "#60a5fa",
					}}
				/>
			</main>
		</div>
	);
}
