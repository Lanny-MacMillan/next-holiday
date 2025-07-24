"use client";

import { useState } from "react";
import Link from "next/link";

const addressBook = [
	{ id: 1, name: "Alice Smith" },
	{ id: 2, name: "Bob Johnson" },
	{ id: 3, name: "Charlie Brown" },
];

export default function GiftListPage() {
	const [people, setPeople] = useState([
		{
			id: 1,
			name: "Alice Smith",
			gifts: [{ id: 1, text: "Book", done: false, url: undefined }],
		},
	]);
	const [newName, setNewName] = useState("");
	const [showBook, setShowBook] = useState(false);
	const [giftInputs, setGiftInputs] = useState<{ [key: number]: string }>({});
	const [giftUrlInputs, setGiftUrlInputs] = useState<{ [key: number]: string }>(
		{}
	);

	function addPerson(name: string) {
		setPeople((prev) => [...prev, { id: Date.now(), name, gifts: [] }]);
		setNewName("");
	}

	function addFromBook(person: { id: number; name: string }) {
		if (!people.some((p) => p.name === person.name)) {
			setPeople((prev) => [
				...prev,
				{ id: Date.now(), name: person.name, gifts: [] },
			]);
		}
		setShowBook(false);
	}

	function addGift(personId: number, text: string, url?: string) {
		setPeople((prev) =>
			prev.map((p) =>
				p.id === personId
					? {
							...p,
							gifts: [
								...p.gifts,
								{ id: Date.now(), text, url: url || undefined, done: false },
							],
					  }
					: p
			)
		);
		setGiftInputs((gi) => ({ ...gi, [personId]: "" }));
		setGiftUrlInputs((gi) => ({ ...gi, [personId]: "" }));
	}

	function toggleGift(personId: number, giftId: number) {
		setPeople((prev) =>
			prev.map((p) =>
				p.id === personId
					? {
							...p,
							gifts: p.gifts.map((g) =>
								g.id === giftId ? { ...g, done: !g.done } : g
							),
					  }
					: p
			)
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6 flex flex-col items-center">
				<h1 className="text-2xl font-bold mb-2 text-gray-900">Gift List</h1>
				<Link
					href="/christmas"
					className="text-blue-500 text-sm hover:underline mb-2"
				>
					← Back
				</Link>
			</header>
			<main className="w-full max-w-md flex flex-col gap-6">
				<form
					className="flex gap-2 mb-2"
					onSubmit={(e) => {
						e.preventDefault();
						if (newName.trim()) addPerson(newName.trim());
					}}
				>
					<input
						className="flex-1 border rounded px-3 py-2 text-gray-900 placeholder-gray-700"
						placeholder="Add person manually..."
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
					/>
					<button
						type="submit"
						className="bg-yellow-500 text-white px-4 py-2 rounded"
					>
						Add
					</button>
				</form>
				<button
					className="text-yellow-600 underline text-sm mb-2"
					onClick={() => setShowBook((v) => !v)}
				>
					{showBook ? "Hide" : "Select from Address Book"}
				</button>
				{showBook && (
					<div className="bg-white rounded shadow p-4 mb-2">
						<h2 className="font-semibold mb-2">Address Book</h2>
						<ul>
							{addressBook.map((person) => (
								<li
									key={person.id}
									className="flex justify-between items-center mb-1"
								>
									<span>{person.name}</span>
									<button
										className="text-yellow-500 hover:underline text-xs"
										onClick={() => addFromBook(person)}
									>
										Add
									</button>
								</li>
							))}
						</ul>
					</div>
				)}
				<ul className="divide-y bg-white rounded shadow">
					{people.map((person) => (
						<li key={person.id} className="px-4 py-3">
							<div className="font-semibold text-gray-900 mb-1">
								{person.name}
							</div>
							<ul className="mb-2">
								{person.gifts.map((gift) => (
									<li key={gift.id} className="flex items-center mb-1">
										<input
											type="checkbox"
											checked={gift.done}
											onChange={() => toggleGift(person.id, gift.id)}
											className="mr-2 accent-yellow-500"
										/>
										{gift.url ? (
											<a
												href={gift.url}
												target="_blank"
												rel="noopener noreferrer"
												className={
													gift.done
														? "line-through text-gray-400 hover:underline"
														: "text-yellow-700 hover:underline"
												}
											>
												{gift.text}
											</a>
										) : (
											<span
												className={
													gift.done
														? "line-through text-gray-400"
														: "text-gray-900"
												}
											>
												{gift.text}
											</span>
										)}
									</li>
								))}
							</ul>
							<form
								className="flex gap-2"
								onSubmit={(e) => {
									e.preventDefault();
									const text = giftInputs[person.id]?.trim();
									const url = giftUrlInputs[person.id]?.trim();
									if (text) addGift(person.id, text, url);
								}}
							>
								<input
									className="flex-1 border rounded px-2 py-1 text-sm text-gray-900 placeholder-gray-700"
									placeholder="Add gift idea..."
									value={giftInputs[person.id] || ""}
									onChange={(e) =>
										setGiftInputs((gi) => ({
											...gi,
											[person.id]: e.target.value,
										}))
									}
								/>
								<input
									className="flex-1 border rounded px-2 py-1 text-sm text-gray-900 placeholder-gray-700"
									placeholder="Optional link (e.g. https://amazon.com)"
									value={giftUrlInputs[person.id] || ""}
									onChange={(e) =>
										setGiftUrlInputs((gi) => ({
											...gi,
											[person.id]: e.target.value,
										}))
									}
								/>
								<button
									type="submit"
									className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
								>
									Add
								</button>
							</form>
						</li>
					))}
				</ul>
			</main>
		</div>
	);
}
