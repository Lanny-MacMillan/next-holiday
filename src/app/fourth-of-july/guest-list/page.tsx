"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import GuestListCard from "@/components/cards/guest/GuestListCard";

export default function FourthOfJulyGuestListPage() {
	const dispatch = useAppDispatch();
	const guests = useAppSelector((state: any) => state.addressBook.contacts);

	useEffect(() => {
		// Fetch address book data if needed
	}, [dispatch]);

	return (
		<div className="min-h-screen fourth-of-july-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/fourth-of-july"
						className="absolute left-0 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xl"
					>
						←
					</Link>
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
							🎆 Fourth of July Guest List
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Manage your guest list
						</p>
					</div>
				</div>
			</header>
			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<GuestListCard
					holiday="Fourth of July"
					href="/fourth-of-july/guest-list"
					theme={{
						primaryColor: "#dc2626",
						accentColor: "#f87171",
					}}
				/>
			</main>
		</div>
	);
}
