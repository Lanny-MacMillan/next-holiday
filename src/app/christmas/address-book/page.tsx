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

type SortOption = "a-z" | "z-a" | "relationship" | "location" | "none";

const relationshipGroups = {
	Family: [
		"Spouse / Partner",
		"Child",
		"Parent",
		"Sibling",
		"Grandparent",
		"Grandchild",
		"Aunt / Uncle",
		"Cousin",
		"In-law",
	],
	"Friends & Acquaintances": ["Friend", "Family Friend", "Neighbor"],
	Professional: ["Co-worker", "Teacher", "Coach"],
	Other: ["Godparent / Godchild", "Other"],
};

const usStates = [
	{ value: "AL", label: "Alabama" },
	{ value: "AK", label: "Alaska" },
	{ value: "AZ", label: "Arizona" },
	{ value: "AR", label: "Arkansas" },
	{ value: "CA", label: "California" },
	{ value: "CO", label: "Colorado" },
	{ value: "CT", label: "Connecticut" },
	{ value: "DE", label: "Delaware" },
	{ value: "FL", label: "Florida" },
	{ value: "GA", label: "Georgia" },
	{ value: "HI", label: "Hawaii" },
	{ value: "ID", label: "Idaho" },
	{ value: "IL", label: "Illinois" },
	{ value: "IN", label: "Indiana" },
	{ value: "IA", label: "Iowa" },
	{ value: "KS", label: "Kansas" },
	{ value: "KY", label: "Kentucky" },
	{ value: "LA", label: "Louisiana" },
	{ value: "ME", label: "Maine" },
	{ value: "MD", label: "Maryland" },
	{ value: "MA", label: "Massachusetts" },
	{ value: "MI", label: "Michigan" },
	{ value: "MN", label: "Minnesota" },
	{ value: "MS", label: "Mississippi" },
	{ value: "MO", label: "Missouri" },
	{ value: "MT", label: "Montana" },
	{ value: "NE", label: "Nebraska" },
	{ value: "NV", label: "Nevada" },
	{ value: "NH", label: "New Hampshire" },
	{ value: "NJ", label: "New Jersey" },
	{ value: "NM", label: "New Mexico" },
	{ value: "NY", label: "New York" },
	{ value: "NC", label: "North Carolina" },
	{ value: "ND", label: "North Dakota" },
	{ value: "OH", label: "Ohio" },
	{ value: "OK", label: "Oklahoma" },
	{ value: "OR", label: "Oregon" },
	{ value: "PA", label: "Pennsylvania" },
	{ value: "RI", label: "Rhode Island" },
	{ value: "SC", label: "South Carolina" },
	{ value: "SD", label: "South Dakota" },
	{ value: "TN", label: "Tennessee" },
	{ value: "TX", label: "Texas" },
	{ value: "UT", label: "Utah" },
	{ value: "VT", label: "Vermont" },
	{ value: "VA", label: "Virginia" },
	{ value: "WA", label: "Washington" },
	{ value: "WV", label: "West Virginia" },
	{ value: "WI", label: "Wisconsin" },
	{ value: "WY", label: "Wyoming" },
];

export default function AddressBookPage() {
	const dispatch = useAppDispatch();
	const { contacts, loading, error, initialized } = useAppSelector(
		(state: any) => state.addressBook
	);

	const [form, setForm] = useState({
		name: "",
		email: "",
		phone: "",
		streetAddress: "",
		city: "",
		state: "",
		zipCode: "",
		relationship: "",
		notes: "",
	});
	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [editingContact, setEditingContact] = useState<Contact | null>(null);
	const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		contactId: string | null;
	}>({
		show: false,
		contactId: null,
	});

	useEffect(() => {
		// Fetch contacts when component mounts
		dispatch(fetchContacts());
	}, [dispatch]);

	function getInitials(name: string): string {
		const words = name
			.trim()
			.split(" ")
			.filter((word) => word.length > 0);
		if (words.length === 0) return "";
		if (words.length === 1) return words[0].charAt(0).toUpperCase();
		return (
			words[0].charAt(0) + words[words.length - 1].charAt(0)
		).toUpperCase();
	}

	function validateForm() {
		const errors: { [key: string]: string } = {};

		if (!form.name.trim()) {
			errors.name = "Name is required";
		}
		if (!form.phone.trim()) {
			errors.phone = "Phone is required";
		}
		if (!form.streetAddress.trim()) {
			errors.streetAddress = "Street address is required";
		}
		if (!form.city.trim()) {
			errors.city = "City is required";
		}
		if (!form.state.trim()) {
			errors.state = "State is required";
		}
		if (!form.zipCode.trim()) {
			errors.zipCode = "Zip code is required";
		}
		if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
			errors.email = "Please enter a valid email address";
		}

		setFormErrors(errors);
		return Object.keys(errors).length === 0;
	}

	function handleAddContact(e: React.FormEvent) {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		const contactData: Omit<Contact, "id" | "createdAt" | "updatedAt"> = {
			name: form.name,
			email: form.email || undefined,
			phone: form.phone || undefined,
			streetAddress: form.streetAddress || undefined,
			city: form.city || undefined,
			state: form.state || undefined,
			zipCode: form.zipCode || undefined,
			relationship: form.relationship || undefined,
			notes: form.notes || undefined,
		};

		if (editingContact) {
			dispatch(updateContact({ ...editingContact, ...contactData }));
			setEditingContact(null);
		} else {
			dispatch(addContact(contactData));
		}

		resetForm();
	}

	function handleEditContact(contact: Contact) {
		setEditingContact(contact);
		setForm({
			name: contact.name,
			email: contact.email || "",
			phone: contact.phone || "",
			streetAddress: contact.streetAddress || "",
			city: contact.city || "",
			state: contact.state || "",
			zipCode: contact.zipCode || "",
			relationship: contact.relationship || "",
			notes: contact.notes || "",
		});
		setFormErrors({});
	}

	function handleCancelEdit() {
		setEditingContact(null);
		resetForm();
		setFormErrors({});
	}

	function resetForm() {
		setForm({
			name: "",
			email: "",
			phone: "",
			streetAddress: "",
			city: "",
			state: "",
			zipCode: "",
			relationship: "",
			notes: "",
		});
		setFormErrors({});
	}

	function handleDeleteContact(contactId: string) {
		setDeleteConfirm({ show: true, contactId });
	}

	function confirmDelete() {
		if (deleteConfirm.contactId) {
			dispatch(deleteContact(deleteConfirm.contactId));
			setDeleteConfirm({ show: false, contactId: null });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, contactId: null });
	}

	function sortContacts(contactsToSort: Contact[]): Contact[] {
		switch (sortBy) {
			case "a-z":
				return [...contactsToSort].sort((a, b) => a.name.localeCompare(b.name));
			case "z-a":
				return [...contactsToSort].sort((a, b) => b.name.localeCompare(a.name));
			case "relationship":
				return [...contactsToSort].sort((a, b) =>
					(a.relationship || "").localeCompare(b.relationship || "")
				);
			case "location":
				return [...contactsToSort].sort((a, b) => {
					const aLocation = `${a.state || ""} ${a.city || ""}`.trim();
					const bLocation = `${b.state || ""} ${b.city || ""}`.trim();
					return aLocation.localeCompare(bLocation);
				});
			default:
				return contactsToSort;
		}
	}

	if (loading && !initialized) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading contacts...</p>
				</div>
			</div>
		);
	}

	const sortedContacts = sortContacts(contacts);

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
					<h2 className="font-semibold mb-2">
						{editingContact ? "Edit Contact" : "Add New Contact"}
					</h2>
					<div className="flex flex-col gap-2">
						<div>
							<input
								className={`border rounded px-3 py-2 text-gray-900 placeholder-gray-700 w-full ${
									formErrors.name ? "border-red-500" : ""
								}`}
								placeholder="Name*"
								value={form.name}
								onChange={(e) =>
									setForm((f) => ({ ...f, name: e.target.value }))
								}
								required
							/>
							{formErrors.name && (
								<div className="text-red-500 text-xs mt-1">
									{formErrors.name}
								</div>
							)}
						</div>
						<div>
							<input
								className={`border rounded px-3 py-2 text-gray-900 placeholder-gray-700 w-full ${
									formErrors.email ? "border-red-500" : ""
								}`}
								placeholder="Email (optional)"
								type="email"
								value={form.email}
								onChange={(e) =>
									setForm((f) => ({ ...f, email: e.target.value }))
								}
							/>
							{formErrors.email && (
								<div className="text-red-500 text-xs mt-1">
									{formErrors.email}
								</div>
							)}
						</div>
						<div>
							<input
								className={`border rounded px-3 py-2 text-gray-900 placeholder-gray-700 w-full ${
									formErrors.phone ? "border-red-500" : ""
								}`}
								placeholder="Phone*"
								value={form.phone}
								onChange={(e) =>
									setForm((f) => ({ ...f, phone: e.target.value }))
								}
								required
							/>
							{formErrors.phone && (
								<div className="text-red-500 text-xs mt-1">
									{formErrors.phone}
								</div>
							)}
						</div>
						<div>
							<input
								className={`border rounded px-3 py-2 text-gray-900 placeholder-gray-700 w-full ${
									formErrors.streetAddress ? "border-red-500" : ""
								}`}
								placeholder="Street Address*"
								value={form.streetAddress}
								onChange={(e) =>
									setForm((f) => ({ ...f, streetAddress: e.target.value }))
								}
								required
							/>
							{formErrors.streetAddress && (
								<div className="text-red-500 text-xs mt-1">
									{formErrors.streetAddress}
								</div>
							)}
						</div>
						<div className="flex gap-2">
							<div className="flex-1">
								<input
									className={`border rounded px-3 py-2 text-gray-900 placeholder-gray-700 w-full ${
										formErrors.city ? "border-red-500" : ""
									}`}
									placeholder="City*"
									value={form.city}
									onChange={(e) =>
										setForm((f) => ({ ...f, city: e.target.value }))
									}
									required
								/>
								{formErrors.city && (
									<div className="text-red-500 text-xs mt-1">
										{formErrors.city}
									</div>
								)}
							</div>
							<div className="flex-1">
								<select
									className={`border rounded px-3 py-2 text-gray-900 w-full ${
										formErrors.state ? "border-red-500" : ""
									}`}
									value={form.state}
									onChange={(e) =>
										setForm((f) => ({ ...f, state: e.target.value }))
									}
									required
								>
									<option value="">State*</option>
									{usStates.map((state) => (
										<option key={state.value} value={state.value}>
											{state.label}
										</option>
									))}
								</select>
								{formErrors.state && (
									<div className="text-red-500 text-xs mt-1">
										{formErrors.state}
									</div>
								)}
							</div>
						</div>
						<div>
							<input
								className={`border rounded px-3 py-2 text-gray-900 placeholder-gray-700 w-full ${
									formErrors.zipCode ? "border-red-500" : ""
								}`}
								placeholder="Zip Code*"
								value={form.zipCode}
								onChange={(e) =>
									setForm((f) => ({ ...f, zipCode: e.target.value }))
								}
								required
							/>
							{formErrors.zipCode && (
								<div className="text-red-500 text-xs mt-1">
									{formErrors.zipCode}
								</div>
							)}
						</div>
						<select
							className="border rounded px-3 py-2 text-gray-900"
							value={form.relationship}
							onChange={(e) =>
								setForm((f) => ({ ...f, relationship: e.target.value }))
							}
						>
							<option value="">Select Relationship (Optional)</option>
							{Object.entries(relationshipGroups).map(([group, options]) => (
								<optgroup key={group} label={group}>
									{options.map((option) => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</optgroup>
							))}
						</select>
						<textarea
							className="border rounded px-3 py-2 text-gray-900 placeholder-gray-700"
							placeholder="Notes"
							value={form.notes}
							onChange={(e) =>
								setForm((f) => ({ ...f, notes: e.target.value }))
							}
							rows={2}
						/>
						<div className="flex gap-2">
							<button
								type="submit"
								className="flex-1 bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition-colors"
								disabled={loading}
							>
								{loading
									? "Saving..."
									: editingContact
									? "Update Contact"
									: "Add Contact"}
							</button>
							{editingContact && (
								<button
									type="button"
									onClick={handleCancelEdit}
									className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
								>
									Cancel
								</button>
							)}
						</div>
					</div>
				</form>

				{/* Sort Controls */}
				<div className="bg-white rounded shadow p-4">
					<h3 className="font-semibold mb-2">Sort By</h3>
					<div className="flex flex-wrap gap-2">
						<button
							onClick={() => setSortBy("none")}
							className={`px-3 py-1 rounded text-sm ${
								sortBy === "none"
									? "bg-pink-500 text-white"
									: "bg-gray-200 text-gray-700 hover:bg-gray-300"
							}`}
						>
							None
						</button>
						<button
							onClick={() => setSortBy("a-z")}
							className={`px-3 py-1 rounded text-sm ${
								sortBy === "a-z"
									? "bg-pink-500 text-white"
									: "bg-gray-200 text-gray-700 hover:bg-gray-300"
							}`}
						>
							A-Z
						</button>
						<button
							onClick={() => setSortBy("z-a")}
							className={`px-3 py-1 rounded text-sm ${
								sortBy === "z-a"
									? "bg-pink-500 text-white"
									: "bg-gray-200 text-gray-700 hover:bg-gray-300"
							}`}
						>
							Z-A
						</button>
						<button
							onClick={() => setSortBy("relationship")}
							className={`px-3 py-1 rounded text-sm ${
								sortBy === "relationship"
									? "bg-pink-500 text-white"
									: "bg-gray-200 text-gray-700 hover:bg-gray-300"
							}`}
						>
							Relationship
						</button>
						<button
							onClick={() => setSortBy("location")}
							className={`px-3 py-1 rounded text-sm ${
								sortBy === "location"
									? "bg-pink-500 text-white"
									: "bg-gray-200 text-gray-700 hover:bg-gray-300"
							}`}
						>
							Location
						</button>
					</div>
				</div>

				<div className="bg-white rounded shadow">
					<h3 className="font-semibold p-4 border-b">
						Contacts ({sortedContacts.length})
					</h3>
					{sortedContacts.length === 0 ? (
						<div className="p-4 text-center text-gray-500">
							No contacts yet. Add your first contact above!
						</div>
					) : (
						<ul className="divide-y">
							{sortedContacts.map((contact: Contact) => (
								<li
									key={contact.id}
									className="flex items-center px-4 py-3 gap-3"
								>
									<div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
										<span className="text-pink-600 font-semibold">
											{getInitials(contact.name)}
										</span>
									</div>
									<div className="flex-1">
										<div className="font-semibold text-gray-900">
											{contact.name}
										</div>
										{contact.email && (
											<div className="text-sm text-gray-600">
												{contact.email}
											</div>
										)}
										{contact.phone && (
											<div className="text-sm text-gray-600">
												{contact.phone}
											</div>
										)}
										{(contact.streetAddress ||
											contact.city ||
											contact.state ||
											contact.zipCode) && (
											<div className="text-sm text-gray-600">
												{[
													contact.streetAddress,
													contact.city,
													contact.state,
													contact.zipCode,
												]
													.filter(Boolean)
													.join(", ")}
											</div>
										)}
										{contact.relationship && (
											<div className="text-xs text-pink-600 mt-1">
												{contact.relationship}
											</div>
										)}
										{contact.notes && (
											<div className="text-xs text-gray-500 mt-1">
												{contact.notes}
											</div>
										)}
									</div>
									<div className="flex flex-col gap-1">
										<button
											onClick={() => handleEditContact(contact)}
											className="text-blue-500 hover:text-blue-700 text-sm"
											disabled={loading}
										>
											Edit
										</button>
										<button
											onClick={() => handleDeleteContact(contact.id)}
											className="text-red-500 hover:text-red-700 text-sm"
											disabled={loading}
										>
											Delete
										</button>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</main>

			{/* Delete Confirmation Modal */}
			{deleteConfirm.show && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-sm mx-4">
						<h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
						<p className="text-gray-600 mb-6">
							Are you sure you want to delete this contact? This action cannot
							be undone.
						</p>
						<div className="flex gap-3">
							<button
								onClick={cancelDelete}
								className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={confirmDelete}
								className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
