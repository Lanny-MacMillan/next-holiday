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
import SortModal from "@/components/SortModal";

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
	const [showForm, setShowForm] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);

	useEffect(() => {
		// Fetch contacts when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchContacts());
		}
	}, [dispatch, initialized]);

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
		setShowForm(false);
	}

	function openForm() {
		setShowForm(true);
		resetForm();
	}

	function closeForm() {
		setShowForm(false);
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
			<div className="min-h-screen christmas-address-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading contacts...
					</p>
				</div>
			</div>
		);
	}

	const sortedContacts = sortContacts(contacts);

	return (
		<div className="min-h-screen christmas-address-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/christmas"
						className="absolute left-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xl"
					>
						←
					</Link>
					<h1 className="text-2xl font-bold text-gray-800 dark:text-white">
						Address Book
					</h1>
					<button
						onClick={() => setShowSortModal(true)}
						className="absolute right-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xl"
						title="Sort contacts"
					>
						<div className="flex flex-col gap-0.5">
							<div className="w-4 h-0.5 bg-current"></div>
							<div className="w-3 h-0.5 bg-current ml-1"></div>
							<div className="w-2 h-0.5 bg-current ml-2"></div>
						</div>
					</button>
				</div>
				{error && (
					<div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-2 rounded mb-4">
						{error}
					</div>
				)}
			</header>
			<main className="w-full max-w-md flex flex-col gap-6">
				<button
					onClick={openForm}
					className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition-colors"
				>
					Add New Contact
				</button>
				<div className="flex items-center justify-center">
					{sortBy !== "none" && (
						<div className="text-center text-sm text-gray-600 dark:text-gray-400">
							{sortBy === "a-z" && "Sorted A-Z"}
							{sortBy === "z-a" && "Sorted Z-A"}
							{sortBy === "relationship" && "Sorted by Relationship"}
							{sortBy === "location" && "Sorted by Location"}
						</div>
					)}
				</div>

				<div className="card card-address rounded shadow">
					<h3 className="font-semibold p-4 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
						Contacts ({sortedContacts.length})
					</h3>
					{sortedContacts.length === 0 ? (
						<div className="p-4 text-center text-gray-500 dark:text-gray-400">
							No contacts yet. Add your first contact above!
						</div>
					) : (
						<ul className="divide-y divide-gray-200 dark:divide-gray-700">
							{sortedContacts.map((contact: Contact) => (
								<li
									key={contact.id}
									className="flex items-center px-4 py-3 gap-3"
								>
									<div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center flex-shrink-0">
										<span className="text-pink-600 dark:text-pink-300 font-semibold">
											{getInitials(contact.name)}
										</span>
									</div>
									<div className="flex-1">
										<div className="font-semibold text-gray-900 dark:text-white">
											{contact.name}
										</div>
										{contact.email && (
											<div className="text-sm text-gray-600 dark:text-gray-300">
												{contact.email}
											</div>
										)}
										{contact.phone && (
											<div className="text-sm text-gray-600 dark:text-gray-300">
												{contact.phone}
											</div>
										)}
										{(contact.streetAddress ||
											contact.city ||
											contact.state ||
											contact.zipCode) && (
											<div className="text-sm text-gray-600 dark:text-gray-300">
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
											<div className="text-xs text-pink-600 dark:text-pink-400 mt-1">
												{contact.relationship}
											</div>
										)}
										{contact.notes && (
											<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
												{contact.notes}
											</div>
										)}
									</div>
									<div className="flex flex-col gap-1">
										<button
											onClick={() => handleEditContact(contact)}
											className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
											disabled={loading}
										>
											Edit
										</button>
										<button
											onClick={() => handleDeleteContact(contact.id)}
											className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
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

			{/* Form Modal */}
			{showForm && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 w-full max-h-[90vh] overflow-y-auto">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
								{editingContact ? "Edit Contact" : "Add New Contact"}
							</h3>
							<button
								onClick={closeForm}
								className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-xl"
							>
								×
							</button>
						</div>
						<form onSubmit={handleAddContact} className="space-y-4">
							<div>
								<input
									className={`border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-700 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${
										formErrors.name ? "border-red-500 dark:border-red-400" : ""
									}`}
									placeholder="Name*"
									value={form.name}
									onChange={(e) =>
										setForm((f) => ({ ...f, name: e.target.value }))
									}
									required
								/>
								{formErrors.name && (
									<div className="text-red-500 dark:text-red-400 text-xs mt-1">
										{formErrors.name}
									</div>
								)}
							</div>
							<div>
								<input
									className={`border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-700 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${
										formErrors.email ? "border-red-500 dark:border-red-400" : ""
									}`}
									placeholder="Email (optional)"
									type="email"
									value={form.email}
									onChange={(e) =>
										setForm((f) => ({ ...f, email: e.target.value }))
									}
								/>
								{formErrors.email && (
									<div className="text-red-500 dark:text-red-400 text-xs mt-1">
										{formErrors.email}
									</div>
								)}
							</div>
							<div>
								<input
									className={`border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-700 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${
										formErrors.phone ? "border-red-500 dark:border-red-400" : ""
									}`}
									placeholder="Phone*"
									value={form.phone}
									onChange={(e) =>
										setForm((f) => ({ ...f, phone: e.target.value }))
									}
									required
								/>
								{formErrors.phone && (
									<div className="text-red-500 dark:text-red-400 text-xs mt-1">
										{formErrors.phone}
									</div>
								)}
							</div>
							<div>
								<input
									className={`border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-700 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${
										formErrors.streetAddress
											? "border-red-500 dark:border-red-400"
											: ""
									}`}
									placeholder="Street Address*"
									value={form.streetAddress}
									onChange={(e) =>
										setForm((f) => ({ ...f, streetAddress: e.target.value }))
									}
									required
								/>
								{formErrors.streetAddress && (
									<div className="text-red-500 dark:text-red-400 text-xs mt-1">
										{formErrors.streetAddress}
									</div>
								)}
							</div>
							<div className="flex gap-2">
								<div className="flex-1">
									<input
										className={`border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-700 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${
											formErrors.city
												? "border-red-500 dark:border-red-400"
												: ""
										}`}
										placeholder="City*"
										value={form.city}
										onChange={(e) =>
											setForm((f) => ({ ...f, city: e.target.value }))
										}
										required
									/>
									{formErrors.city && (
										<div className="text-red-500 dark:text-red-400 text-xs mt-1">
											{formErrors.city}
										</div>
									)}
								</div>
								<div className="flex-1">
									<select
										className={`border rounded px-3 py-2 text-gray-900 dark:text-white w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${
											formErrors.state
												? "border-red-500 dark:border-red-400"
												: ""
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
										<div className="text-red-500 dark:text-red-400 text-xs mt-1">
											{formErrors.state}
										</div>
									)}
								</div>
							</div>
							<div>
								<input
									className={`border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-700 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${
										formErrors.zipCode
											? "border-red-500 dark:border-red-400"
											: ""
									}`}
									placeholder="Zip Code*"
									value={form.zipCode}
									onChange={(e) =>
										setForm((f) => ({ ...f, zipCode: e.target.value }))
									}
									required
								/>
								{formErrors.zipCode && (
									<div className="text-red-500 dark:text-red-400 text-xs mt-1">
										{formErrors.zipCode}
									</div>
								)}
							</div>
							<select
								className="border rounded px-3 py-2 text-gray-900 dark:text-white w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
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
								className="border rounded px-3 py-2 text-gray-900 dark:text-white placeholder-gray-700 dark:placeholder-gray-400 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
								placeholder="Notes"
								value={form.notes}
								onChange={(e) =>
									setForm((f) => ({ ...f, notes: e.target.value }))
								}
								rows={2}
							/>
							<div className="flex gap-3 pt-2">
								<button
									type="button"
									onClick={closeForm}
									className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
								>
									Cancel
								</button>
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
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			{deleteConfirm.show && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
						<h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
							Confirm Delete
						</h3>
						<p className="text-gray-600 dark:text-gray-300 mb-6">
							Are you sure you want to delete this contact? This action cannot
							be undone.
						</p>
						<div className="flex gap-3">
							<button
								onClick={cancelDelete}
								className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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

			{/* Sort Modal */}
			<SortModal
				isOpen={showSortModal}
				onClose={() => setShowSortModal(false)}
				sortBy={sortBy}
				onSortChange={(sortOption: string) =>
					setSortBy(sortOption as SortOption)
				}
				sortOptions={[
					{ value: "none", label: "None" },
					{ value: "a-z", label: "A-Z" },
					{ value: "z-a", label: "Z-A" },
					{ value: "relationship", label: "Relationship" },
					{ value: "location", label: "Location" },
				]}
				title="Sort Contacts"
			/>
		</div>
	);
}
