"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchContacts,
	addContact,
	updateContact,
	deleteContact,
	Contact,
} from "@/store/slices/addressBookSlice";
import SortModal from "@/components/modals/SortModal";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";

type SortOption = "a-z" | "z-a" | "relationship" | "location" | "none";

export default function AddressBookPage() {
	const dispatch = useAppDispatch();
	const { contacts, loading, error, initialized } = useAppSelector(
		(state: any) => state.addressBook
	);

	const [sortBy, setSortBy] = useState<SortOption>("none");
	const [editingContact, setEditingContact] = useState<Contact | null>(null);
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

	function handleAddContact(formValues: Record<string, any>) {
		if (!formValues.name?.trim() || !formValues.phone?.trim()) return;

		const contactData: Omit<Contact, "id" | "createdAt" | "updatedAt"> = {
			name: formValues.name,
			email: formValues.email || undefined,
			phone: formValues.phone || undefined,
			streetAddress: formValues.streetAddress || undefined,
			city: formValues.city || undefined,
			state: formValues.state || undefined,
			zipCode: formValues.zipCode || undefined,
			relationship: formValues.relationship || undefined,
			notes: formValues.notes || undefined,
		};

		if (editingContact) {
			dispatch(updateContact({ ...editingContact, ...contactData }));
			setEditingContact(null);
		} else {
			dispatch(addContact(contactData));
		}

		setShowForm(false);
	}

	function openForm() {
		setShowForm(true);
		setEditingContact(null);
	}

	function closeForm() {
		setShowForm(false);
		setEditingContact(null);
	}

	function handleEditContact(contact: Contact) {
		setEditingContact(contact);
		setShowForm(true);
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

	// Get form configuration
	const formConfig = getFormConfig(
		"addressBook",
		editingContact ? "edit" : "add"
	);

	// Get delete configuration
	const deleteConfig = getDeleteConfig("addressBook");

	// Prepare initial values for editing
	const initialValues = editingContact
		? {
				name: editingContact.name,
				email: editingContact.email || "",
				phone: editingContact.phone || "",
				streetAddress: editingContact.streetAddress || "",
				city: editingContact.city || "",
				state: editingContact.state || "",
				zipCode: editingContact.zipCode || "",
				relationship: editingContact.relationship || "",
				notes: editingContact.notes || "",
		  }
		: {};

	return (
		<div className="min-h-screen christmas-address-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Address Book"
				backHref="/"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort contacts"
				description="Add, edit, and delete contacts"
				holidayColor="blue-500"
				error={error}
			/>

			<main className="w-full max-w-4xl flex flex-col gap-4 sm:gap-6">
				<AddButton title="Contact" onClick={openForm} color="blue" />

				<div className="flex items-center justify-center">
					{sortBy !== "none" && (
						<div className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
							{sortBy === "a-z" && "Sorted A-Z"}
							{sortBy === "z-a" && "Sorted Z-A"}
							{sortBy === "relationship" && "Sorted by Relationship"}
							{sortBy === "location" && "Sorted by Location"}
						</div>
					)}
				</div>

				<div className="card card-address rounded-2xl shadow">
					<h3 className="font-semibold p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm sm:text-base">
						Contacts ({sortedContacts.length})
					</h3>
					{sortedContacts.length === 0 ? (
						<div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm sm:text-base">
							No contacts yet. Add your first contact above!
						</div>
					) : (
						<ul className="divide-y divide-gray-200 dark:divide-gray-700">
							{sortedContacts.map((contact: Contact) => (
								<li
									key={contact.id}
									className="flex items-start px-3 sm:px-4 py-3 sm:py-4 gap-3"
								>
									<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center flex-shrink-0">
										<span className="text-pink-600 dark:text-pink-300 font-semibold text-sm sm:text-base">
											{getInitials(contact.name)}
										</span>
									</div>
									<div className="flex-1 min-w-0">
										<div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
											{contact.name}
										</div>
										{contact.email && (
											<div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
												{contact.email}
											</div>
										)}
										{contact.phone && (
											<div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
												{contact.phone}
											</div>
										)}
										{(contact.streetAddress ||
											contact.city ||
											contact.state ||
											contact.zipCode) && (
											<div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
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
											<div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
												{contact.notes}
											</div>
										)}
									</div>
									<div className="flex flex-col gap-2 flex-shrink-0">
										<button
											onClick={() => handleEditContact(contact)}
											className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs sm:text-sm px-2 py-1 rounded transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
											disabled={loading}
										>
											Edit
										</button>
										<button
											onClick={() => handleDeleteContact(contact.id)}
											className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs sm:text-sm px-2 py-1 rounded transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
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
			<FormModal
				isOpen={showForm}
				title={formConfig.title}
				fields={formConfig.fields}
				initialValues={initialValues}
				onSubmit={handleAddContact}
				onClose={closeForm}
				loading={loading}
				submitText={formConfig.submitText}
				cancelText={formConfig.cancelText}
				cardClassName={formConfig.cardClassName}
				submitButtonColor={formConfig.submitButtonColor}
			/>

			{/* Delete Modal */}
			<DeleteModal
				isOpen={deleteConfirm.show}
				title={deleteConfig.title}
				message={deleteConfig.message}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={loading}
				cardClassName={deleteConfig.cardClassName}
				confirmText={deleteConfig.confirmText}
				cancelText={deleteConfig.cancelText}
				confirmButtonColor={deleteConfig.confirmButtonColor}
			/>

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
