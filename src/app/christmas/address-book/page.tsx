"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchContacts,
	addContact,
	updateContact,
	deleteContact,
	Contact,
} from "@/store/slices/addressBookSlice";

export default function AddressBookPage() {
	const dispatch = useAppDispatch();
	const { contacts, loading, error } = useAppSelector(
		(state: any) => state.addressBook
	);

	const [form, setForm] = useState({
		name: "",
		email: "",
		phone: "",
		address: "",
		notes: "",
	});

	useEffect(() => {
		// Fetch contacts when component mounts
		dispatch(fetchContacts());
	}, [dispatch]);

	function handleAddContact(e: React.FormEvent) {
		e.preventDefault();
		if (!form.name.trim() || !form.email.trim()) return;

		const newContact: Omit<Contact, "id" | "createdAt" | "updatedAt"> = {
			name: form.name,
			email: form.email,
			phone: form.phone || undefined,
			address: form.address || undefined,
			notes: form.notes || undefined,
		};

		dispatch(addContact(newContact));
		setForm({ name: "", email: "", phone: "", address: "", notes: "" });
	}

	function handleDeleteContact(contactId: string) {
		dispatch(deleteContact(contactId));
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading contacts...</p>
				</div>
			</div>
		);
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
				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
						{error}
					</div>
				)}
			</header>
			<main className="w-full max-w-md flex flex-col gap-6">
				<form
					className="bg-white rounded shadow p-4 mb-4"
					onSubmit={handleAddContact}
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
							placeholder="Email*"
							type="email"
							value={form.email}
							onChange={(e) =>
								setForm((f) => ({ ...f, email: e.target.value }))
							}
							required
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
							placeholder="Address"
							value={form.address}
							onChange={(e) =>
								setForm((f) => ({ ...f, address: e.target.value }))
							}
						/>
						<textarea
							className="border rounded px-3 py-2 text-gray-900 placeholder-gray-700"
							placeholder="Notes"
							value={form.notes}
							onChange={(e) =>
								setForm((f) => ({ ...f, notes: e.target.value }))
							}
							rows={3}
						/>
						<button
							type="submit"
							className="bg-pink-500 text-white px-4 py-2 rounded mt-2 hover:bg-pink-600 transition-colors"
							disabled={loading}
						>
							{loading ? "Adding..." : "Add Contact"}
						</button>
					</div>
				</form>

				<div className="bg-white rounded shadow">
					<h3 className="font-semibold p-4 border-b">
						Contacts ({contacts.length})
					</h3>
					{contacts.length === 0 ? (
						<div className="p-4 text-center text-gray-500">
							No contacts yet. Add your first contact above!
						</div>
					) : (
						<ul className="divide-y">
							{contacts.map((contact: Contact) => (
								<li
									key={contact.id}
									className="flex items-center px-4 py-3 gap-4"
								>
									<div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
										<span className="text-pink-600 font-semibold">
											{contact.name.charAt(0).toUpperCase()}
										</span>
									</div>
									<div className="flex-1">
										<div className="font-semibold text-gray-900">
											{contact.name}
										</div>
										<div className="text-sm text-gray-600">{contact.email}</div>
										{contact.phone && (
											<div className="text-xs text-gray-500">
												{contact.phone}
											</div>
										)}
										{contact.address && (
											<div className="text-xs text-gray-500">
												{contact.address}
											</div>
										)}
										{contact.notes && (
											<div className="text-xs text-gray-500 mt-1">
												{contact.notes}
											</div>
										)}
									</div>
									<button
										onClick={() => handleDeleteContact(contact.id)}
										className="text-red-500 hover:text-red-700 text-sm"
										disabled={loading}
									>
										Delete
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
			</main>
		</div>
	);
}
