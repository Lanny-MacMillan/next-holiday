"use client";

import { useState } from "react";
import Link from "next/link";

const placeholderContacts = [
	{
		id: 1,
		name: "Alice Smith",
		address: "123 Candy Cane Ln, North Pole",
		phone: "555-1234",
		relationship: "Friend",
		image: "https://randomuser.me/api/portraits/women/1.jpg",
	},
	{
		id: 2,
		name: "Bob Johnson",
		address: "456 Snowman Ave, Wintertown",
		phone: "555-5678",
		relationship: "Cousin",
		image: "https://randomuser.me/api/portraits/men/2.jpg",
	},
];

export default function AddressBookPage() {
	const [contacts, setContacts] = useState(placeholderContacts);
	const [form, setForm] = useState({
		name: "",
		address: "",
		phone: "",
		relationship: "",
		image: "",
	});

	function addContact(e: React.FormEvent) {
		e.preventDefault();
		if (!form.name.trim()) return;
		setContacts((prev) => [
			...prev,
			{
				...form,
				id: Date.now(),
				image: form.image || "https://randomuser.me/api/portraits/lego/1.jpg",
			},
		]);
		setForm({ name: "", address: "", phone: "", relationship: "", image: "" });
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6 flex flex-col items-center">
				<h1 className="text-2xl font-bold mb-2 text-gray-900">Address Book</h1>
				<Link
					href="/christmas"
					className="text-blue-500 text-sm hover:underline mb-2"
				>
					← Back
				</Link>
			</header>
			<main className="w-full max-w-md flex flex-col gap-6">
				<form
					className="bg-white rounded shadow p-4 mb-4"
					onSubmit={addContact}
				>
					<h2 className="font-semibold mb-2">Add New Contact</h2>
					<div className="flex flex-col gap-2">
						<input
							className="border rounded px-3 py-2 text-gray-900 placeholder-gray-700"
							placeholder="Name*"
							value={form.name}
							onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
							required
						/>
						<input
							className="border rounded px-3 py-2 text-gray-900 placeholder-gray-700"
							placeholder="Address"
							value={form.address}
							onChange={(e) =>
								setForm((f) => ({ ...f, address: e.target.value }))
							}
						/>
						<input
							className="border rounded px-3 py-2 text-gray-900 placeholder-gray-700"
							placeholder="Phone"
							value={form.phone}
							onChange={(e) =>
								setForm((f) => ({ ...f, phone: e.target.value }))
							}
						/>
						<input
							className="border rounded px-3 py-2 text-gray-900 placeholder-gray-700"
							placeholder="Relationship"
							value={form.relationship}
							onChange={(e) =>
								setForm((f) => ({ ...f, relationship: e.target.value }))
							}
						/>
						<input
							className="border rounded px-3 py-2 text-gray-900 placeholder-gray-700"
							placeholder="Image URL (optional)"
							value={form.image}
							onChange={(e) =>
								setForm((f) => ({ ...f, image: e.target.value }))
							}
						/>
						<button
							type="submit"
							className="bg-pink-500 text-white px-4 py-2 rounded mt-2"
						>
							Add Contact
						</button>
					</div>
				</form>
				<ul className="divide-y bg-white rounded shadow">
					{contacts.map((c) => (
						<li key={c.id} className="flex items-center px-4 py-3 gap-4">
							<img
								src={c.image}
								alt={c.name}
								className="w-12 h-12 rounded-full object-cover border"
							/>
							<div className="flex-1">
								<div className="font-semibold text-gray-900">{c.name}</div>
								<div className="text-xs text-gray-500">{c.relationship}</div>
								<div className="text-xs text-gray-500">{c.address}</div>
								<div className="text-xs text-gray-500">{c.phone}</div>
							</div>
						</li>
					))}
				</ul>
			</main>
		</div>
	);
}
