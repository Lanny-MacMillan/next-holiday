"use client";

import { useState } from "react";
import Link from "next/link";

const addressBook = [
	{ id: 1, name: "Alice Smith" },
	{ id: 2, name: "Bob Johnson" },
	{ id: 3, name: "Charlie Brown" },
];

export default function CardsPage() {
	const [people, setPeople] = useState([
		{ id: 1, name: "Alice Smith", sent: false },
	]);
	const [newName, setNewName] = useState("");
	const [showBook, setShowBook] = useState(false);

	function addPerson(name: string) {
		setPeople((prev) => [...prev, { id: Date.now(), name, sent: false }]);
		setNewName("");
	}

	function toggleSent(id: number) {
		setPeople((prev) =>
			prev.map((p) => (p.id === id ? { ...p, sent: !p.sent } : p))
		);
	}

	function addFromBook(person: { id: number; name: string }) {
		if (!people.some((p) => p.name === person.name)) {
			setPeople((prev) => [
				...prev,
				{ id: Date.now(), name: person.name, sent: false },
			]);
		}
		setShowBook(false);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6 flex flex-col items-center">
				<h1 className="text-2xl font-bold mb-2 text-gray-900">Holiday Cards</h1>
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
						className="bg-green-500 text-white px-4 py-2 rounded"
					>
						Add
					</button>
				</form>
				<button
					className="text-green-600 underline text-sm mb-2"
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
										className="text-green-500 hover:underline text-xs"
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
						<li key={person.id} className="flex items-center px-4 py-3">
							<input
								type="checkbox"
								checked={person.sent}
								onChange={() => toggleSent(person.id)}
								className="mr-3 accent-green-500"
							/>
							<span
								className={
									person.sent ? "line-through text-gray-400" : "text-gray-900"
								}
							>
								{person.name}
							</span>
							<span className="ml-auto text-xs text-gray-400">
								{person.sent ? "Sent" : "Unsent"}
							</span>
						</li>
					))}
				</ul>
			</main>
		</div>
	);
}
