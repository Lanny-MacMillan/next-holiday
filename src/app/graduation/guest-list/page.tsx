"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchGraduationContacts,
	addGraduationContact,
	updateGraduationContact,
	deleteGraduationContact,
	GraduationContact,
} from "@/store/slices/graduation/graduationAddressBookSlice";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import SortModal from "@/components/modals/SortModal";
import GuestCardItem from "@/components/cards/guest/GuestCardItem";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import RSVPSection from "@/components/common/RSVPSection";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";

export default function GraduationGuestListPage() {
	const dispatch = useAppDispatch();
	const { contacts, loading, error, initialized } = useAppSelector(
		(state: any) => state.graduationAddressBook
	);
	const { contacts: globalContacts } = useAppSelector(
		(state: any) => state.addressBook
	);

	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		contactId: string | null;
	}>({
		show: false,
		contactId: null,
	});
	const [showForm, setShowForm] = useState(false);
	const [editingContact, setEditingContact] =
		useState<GraduationContact | null>(null);
	const [sortBy, setSortBy] = useState<string>("none");
	const [showSortModal, setShowSortModal] = useState(false);

	useEffect(() => {
		if (!initialized) {
			dispatch(fetchGraduationContacts());
		}
		dispatch(fetchContacts());
	}, [dispatch, initialized]);

	function handleAddContact(formValues: Record<string, any>) {
		if (!formValues.name?.trim()) return;

		// Map RSVP status to isCompleted
		const isCompleted = formValues.rsvpStatus === "confirmed";
		const isDeclined = formValues.rsvpStatus === "declined";

		if (editingContact) {
			const updatedContact: GraduationContact = {
				...editingContact,
				name: formValues.name,
				email: formValues.email || undefined,
				phone: formValues.phone || undefined,
				address: formValues.address || undefined,
				relationship: formValues.relationship || undefined,
				notes: formValues.notes || undefined,
				isCompleted: isCompleted,
				isDeclined: isDeclined,
				numberOfGuests: parseInt(formValues.numberOfGuests) || 1,
				dietaryRestrictions: formValues.dietaryRestrictions || undefined,
				bringingDish: formValues.bringingDish || undefined,
			};
			dispatch(updateGraduationContact(updatedContact));
			setEditingContact(null);
		} else {
			const newContact: Omit<
				GraduationContact,
				"id" | "createdAt" | "updatedAt"
			> = {
				name: formValues.name,
				email: formValues.email || undefined,
				phone: formValues.phone || undefined,
				address: formValues.address || undefined,
				relationship: formValues.relationship || undefined,
				notes: formValues.notes || undefined,
				isCompleted: isCompleted,
				isDeclined: isDeclined,
				numberOfGuests: parseInt(formValues.numberOfGuests) || 1,
				dietaryRestrictions: formValues.dietaryRestrictions || undefined,
				bringingDish: formValues.bringingDish || undefined,
			};
			dispatch(addGraduationContact(newContact));
		}
		setShowForm(false);
	}

	function handleToggleGuest(contactId: string) {
		// For now, we'll just toggle the completion status
		const contact = contacts.find((c: GraduationContact) => c.id === contactId);
		if (contact) {
			const updatedContact = {
				...contact,
				isCompleted: !contact.isCompleted,
			};
			dispatch(updateGraduationContact(updatedContact));
		}
	}

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
		setEditingContact(null);
	}

	function handleEditContact(contact: GraduationContact) {
		setEditingContact(contact);
		setShowForm(true);
	}

	function handleDeleteContact(contactId: string) {
		setDeleteConfirm({ show: true, contactId });
	}

	function confirmDelete() {
		if (deleteConfirm.contactId) {
			dispatch(deleteGraduationContact(deleteConfirm.contactId));
			setDeleteConfirm({ show: false, contactId: null });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, contactId: null });
	}

	function sortContacts(
		contactsToSort: GraduationContact[]
	): GraduationContact[] {
		switch (sortBy) {
			case "name":
				return [...contactsToSort].sort((a, b) => a.name.localeCompare(b.name));
			case "relationship":
				return [...contactsToSort].sort((a, b) =>
					(a.relationship || "").localeCompare(b.relationship || "")
				);
			case "date-created":
				return [...contactsToSort].sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
			default:
				return contactsToSort;
		}
	}

	if (loading && !initialized) {
		return (
			<div className="min-h-screen graduation-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading guests...</p>
				</div>
			</div>
		);
	}

	const sortedContacts = sortContacts(contacts);

	return (
		<div className="min-h-screen graduation-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Guest List"
				backHref="/graduation"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort guests"
				error={error}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				<AddButton title="Guest" onClick={openForm} color="purple" />
				<div className="flex items-center justify-center">
					{sortBy !== "none" && (
						<div className="text-center text-sm text-gray-600 dark:text-gray-400">
							{sortBy === "name" && "Sorted by Name"}
							{sortBy === "relationship" && "Sorted by Relationship"}
							{sortBy === "date-created" && "Sorted by Date Created"}
						</div>
					)}
				</div>

				<RSVPSection
					title="Pending"
					items={sortedContacts.filter(
						(contact: GraduationContact) =>
							!contact.isCompleted && !contact.isDeclined
					)}
					rsvpStatus="pending"
					emptyMessage="No pending guests yet."
					renderItem={(contact: GraduationContact) => (
						<GuestCardItem
							key={contact.id}
							guest={{
								id: contact.id,
								name: contact.name,
								email: contact.email,
								phone: contact.phone,
								address: contact.address,
								rsvpStatus: "pending" as any,
								numberOfGuests: contact.numberOfGuests || 1,
								dietaryRestrictions: contact.dietaryRestrictions,
								bringingDish: contact.bringingDish,
								notes: contact.notes,
								isCompleted: contact.isCompleted || false,
								createdAt: contact.createdAt,
								updatedAt: contact.updatedAt,
							}}
							onToggle={handleToggleGuest}
							onEdit={(guest) => {
								handleEditContact(contact);
								setShowForm(true);
							}}
							onDelete={handleDeleteContact}
							loading={loading}
							theme={{
								accentColor: "#8b5cf6",
							}}
							borderColor="rgb(var(--color-purple-500))"
						/>
					)}
				/>

				<RSVPSection
					title="Confirmed"
					items={sortedContacts.filter(
						(contact: GraduationContact) =>
							contact.isCompleted && !contact.isDeclined
					)}
					rsvpStatus="confirmed"
					emptyMessage="No confirmed guests yet."
					renderItem={(contact: GraduationContact) => (
						<GuestCardItem
							key={contact.id}
							guest={{
								id: contact.id,
								name: contact.name,
								email: contact.email,
								phone: contact.phone,
								address: contact.address,
								rsvpStatus: "confirmed" as any,
								numberOfGuests: contact.numberOfGuests || 1,
								dietaryRestrictions: contact.dietaryRestrictions,
								bringingDish: contact.bringingDish,
								notes: contact.notes,
								isCompleted: contact.isCompleted || false,
								createdAt: contact.createdAt,
								updatedAt: contact.updatedAt,
							}}
							onToggle={handleToggleGuest}
							onEdit={(guest) => {
								handleEditContact(contact);
								setShowForm(true);
							}}
							onDelete={handleDeleteContact}
							loading={loading}
							theme={{
								accentColor: "#8b5cf6",
							}}
							borderColor="rgb(var(--color-purple-500))"
						/>
					)}
				/>

				<RSVPSection
					title="Declined"
					items={sortedContacts.filter(
						(contact: GraduationContact) => contact.isDeclined
					)}
					rsvpStatus="declined"
					emptyMessage="No declined guests yet."
					renderItem={(contact: GraduationContact) => (
						<GuestCardItem
							key={contact.id}
							guest={{
								id: contact.id,
								name: contact.name,
								email: contact.email,
								phone: contact.phone,
								address: contact.address,
								rsvpStatus: "declined" as any,
								numberOfGuests: contact.numberOfGuests || 1,
								dietaryRestrictions: contact.dietaryRestrictions,
								bringingDish: contact.bringingDish,
								notes: contact.notes,
								isCompleted: contact.isCompleted || false,
								createdAt: contact.createdAt,
								updatedAt: contact.updatedAt,
							}}
							onToggle={handleToggleGuest}
							onEdit={(guest) => {
								handleEditContact(contact);
								setShowForm(true);
							}}
							onDelete={handleDeleteContact}
							loading={loading}
							theme={{
								accentColor: "#8b5cf6",
							}}
							borderColor="rgb(var(--color-purple-500))"
						/>
					)}
				/>
			</main>

			<FormModal
				isOpen={showForm}
				title={editingContact ? "Edit Guest" : "Add New Guest"}
				fields={getFormConfig("guests", editingContact ? "edit" : "add").fields}
				initialValues={
					editingContact
						? {
								name: editingContact.name,
								email: editingContact.email || "",
								phone: editingContact.phone || "",
								address: editingContact.address || "",
								relationship: editingContact.relationship || "",
								notes: editingContact.notes || "",
								rsvpStatus: editingContact.isCompleted
									? "confirmed"
									: editingContact.isDeclined
									? "declined"
									: "pending",
								numberOfGuests:
									editingContact.numberOfGuests?.toString() || "1",
								dietaryRestrictions: editingContact.dietaryRestrictions || "",
								bringingDish: editingContact.bringingDish || "",
						  }
						: {
								rsvpStatus: "pending",
								numberOfGuests: "1",
								dietaryRestrictions: "",
								bringingDish: "",
						  }
				}
				onSubmit={handleAddContact}
				onClose={closeForm}
				loading={loading}
				submitText={
					loading
						? editingContact
							? "Updating..."
							: "Adding..."
						: editingContact
						? "Update Guest"
						: "Add Guest"
				}
				cancelText="Cancel"
				cardClassName="card"
				submitButtonColor="#8b5cf6"
				showAddressBook={true}
				contacts={globalContacts}
			/>

			<DeleteModal
				isOpen={deleteConfirm.show}
				{...getDeleteConfig("guests")}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={loading}
			/>

			<SortModal
				isOpen={showSortModal}
				onClose={() => setShowSortModal(false)}
				sortBy={sortBy}
				onSortChange={setSortBy}
				sortOptions={[
					{ value: "none", label: "None" },
					{ value: "name", label: "Name" },
					{ value: "relationship", label: "Relationship" },
					{ value: "date-created", label: "Date Created" },
				]}
				title="Sort Guests"
			/>
		</div>
	);
}
