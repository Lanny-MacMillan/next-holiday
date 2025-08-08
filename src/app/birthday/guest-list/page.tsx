"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchBirthdayGuests,
	addBirthdayGuest,
	updateBirthdayGuest,
	deleteBirthdayGuest,
	toggleBirthdayGuestCompletion,
	BirthdayGuest,
} from "@/store/slices/birthday/birthdayGuestListSlice";
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

export default function BirthdayGuestListPage() {
	const dispatch = useAppDispatch();
	const { guests, loading, error, initialized } = useAppSelector(
		(state: any) => state.birthdayGuestList
	);
	const { contacts } = useAppSelector((state: any) => state.addressBook);

	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		guestId: string | null;
	}>({
		show: false,
		guestId: null,
	});
	const [showForm, setShowForm] = useState(false);
	const [editingGuest, setEditingGuest] = useState<BirthdayGuest | null>(null);
	const [sortBy, setSortBy] = useState<string>("none");
	const [showSortModal, setShowSortModal] = useState(false);

	useEffect(() => {
		// Fetch guests and contacts when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchBirthdayGuests());
		}
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch, initialized]);

	function handleAddGuest(formValues: Record<string, any>) {
		if (!formValues.name?.trim() || !formValues.numberOfGuests) return;

		if (editingGuest) {
			// Update existing guest
			const updatedGuest: BirthdayGuest = {
				...editingGuest,
				name: formValues.name,
				email: formValues.email || undefined,
				phone: formValues.phone || undefined,
				address: formValues.address || undefined,
				rsvpStatus: formValues.rsvpStatus as
					| "pending"
					| "confirmed"
					| "declined",
				numberOfGuests: parseInt(formValues.numberOfGuests),
				dietaryRestrictions: formValues.dietaryRestrictions || undefined,
				bringingDish: formValues.bringingDish || undefined,
				notes: formValues.notes || undefined,
			};
			dispatch(updateBirthdayGuest(updatedGuest));
			setEditingGuest(null);
		} else {
			// Add new guest
			const newGuest: Omit<BirthdayGuest, "id" | "createdAt" | "updatedAt"> = {
				name: formValues.name,
				email: formValues.email || undefined,
				phone: formValues.phone || undefined,
				address: formValues.address || undefined,
				rsvpStatus: formValues.rsvpStatus as
					| "pending"
					| "confirmed"
					| "declined",
				numberOfGuests: parseInt(formValues.numberOfGuests),
				dietaryRestrictions: formValues.dietaryRestrictions || undefined,
				bringingDish: formValues.bringingDish || undefined,
				notes: formValues.notes || undefined,
				isCompleted: false,
			};
			dispatch(addBirthdayGuest(newGuest));
		}

		setShowForm(false);
	}

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
		setEditingGuest(null);
	}

	function handleToggleGuest(guestId: string) {
		dispatch(toggleBirthdayGuestCompletion(guestId));
	}

	function handleEditGuest(guest: BirthdayGuest) {
		setEditingGuest(guest);
		setShowForm(true);
	}

	function handleDeleteGuest(guestId: string) {
		setDeleteConfirm({ show: true, guestId });
	}

	function confirmDelete() {
		if (deleteConfirm.guestId) {
			dispatch(deleteBirthdayGuest(deleteConfirm.guestId));
			setDeleteConfirm({ show: false, guestId: null });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, guestId: null });
	}

	function sortGuests(guestsToSort: BirthdayGuest[]): BirthdayGuest[] {
		switch (sortBy) {
			case "name":
				return [...guestsToSort].sort((a, b) => a.name.localeCompare(b.name));
			case "rsvpStatus":
				return [...guestsToSort].sort((a, b) =>
					a.rsvpStatus.localeCompare(b.rsvpStatus)
				);
			case "numberOfGuests":
				return [...guestsToSort].sort(
					(a, b) => b.numberOfGuests - a.numberOfGuests
				);
			case "date-created":
				return [...guestsToSort].sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
			default:
				return guestsToSort;
		}
	}

	if (loading && !initialized) {
		return (
			<div className="min-h-screen birthday-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading guests...</p>
				</div>
			</div>
		);
	}

	const sortedGuests = sortGuests(guests);
	const pendingGuests = sortedGuests.filter(
		(guest: BirthdayGuest) => guest.rsvpStatus === "pending"
	);
	const confirmedGuests = sortedGuests.filter(
		(guest: BirthdayGuest) => guest.rsvpStatus === "confirmed"
	);
	const declinedGuests = sortedGuests.filter(
		(guest: BirthdayGuest) => guest.rsvpStatus === "declined"
	);

	return (
		<div className="min-h-screen birthday-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Guest List"
				backHref="/birthday"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort guests"
				error={error}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				<AddButton title="Guest" onClick={openForm} color="amber" />
				<div className="flex items-center justify-center">
					{sortBy !== "none" && (
						<div className="text-center text-sm text-gray-600 dark:text-gray-400">
							{sortBy === "name" && "Sorted by Name"}
							{sortBy === "rsvpStatus" && "Sorted by RSVP Status"}
							{sortBy === "numberOfGuests" && "Sorted by Number of Guests"}
							{sortBy === "date-created" && "Sorted by Date Created"}
						</div>
					)}
				</div>

				<RSVPSection
					title="Pending"
					items={pendingGuests}
					rsvpStatus="pending"
					emptyMessage="No pending RSVPs yet."
					renderItem={(guest: BirthdayGuest) => (
						<GuestCardItem
							key={guest.id}
							guest={guest}
							onToggle={handleToggleGuest}
							onEdit={(guest) => {
								handleEditGuest(guest);
								setShowForm(true);
							}}
							onDelete={handleDeleteGuest}
							loading={loading}
							theme={{
								accentColor: "#f59e0b", // Amber for Birthday
							}}
							borderColor="rgb(var(--color-amber-500))" // Amber border for Birthday
						/>
					)}
				/>

				<RSVPSection
					title="Confirmed"
					items={confirmedGuests}
					rsvpStatus="confirmed"
					emptyMessage="No confirmed RSVPs yet."
					renderItem={(guest: BirthdayGuest) => (
						<GuestCardItem
							key={guest.id}
							guest={guest}
							onToggle={handleToggleGuest}
							onEdit={(guest) => {
								handleEditGuest(guest);
								setShowForm(true);
							}}
							onDelete={handleDeleteGuest}
							loading={loading}
							theme={{
								accentColor: "#f59e0b", // Amber for Birthday
							}}
							borderColor="rgb(var(--color-amber-500))" // Amber border for Birthday
						/>
					)}
				/>

				<RSVPSection
					title="Declined"
					items={declinedGuests}
					rsvpStatus="declined"
					emptyMessage="No declined RSVPs yet."
					renderItem={(guest: BirthdayGuest) => (
						<GuestCardItem
							key={guest.id}
							guest={guest}
							onToggle={handleToggleGuest}
							onEdit={(guest) => {
								handleEditGuest(guest);
								setShowForm(true);
							}}
							onDelete={handleDeleteGuest}
							loading={loading}
							theme={{
								accentColor: "#f59e0b", // Amber for Birthday
							}}
							borderColor="rgb(var(--color-amber-500))" // Amber border for Birthday
						/>
					)}
				/>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showForm}
				title={editingGuest ? "Edit Guest" : "Add New Guest"}
				fields={getFormConfig("guests", editingGuest ? "edit" : "add").fields}
				initialValues={
					editingGuest
						? {
								name: editingGuest.name,
								email: editingGuest.email || "",
								phone: editingGuest.phone || "",
								address: editingGuest.address || "",
								rsvpStatus: editingGuest.rsvpStatus,
								numberOfGuests: editingGuest.numberOfGuests.toString(),
								dietaryRestrictions: editingGuest.dietaryRestrictions || "",
								bringingDish: editingGuest.bringingDish || "",
								notes: editingGuest.notes || "",
						  }
						: {}
				}
				onSubmit={handleAddGuest}
				onClose={closeForm}
				loading={loading}
				submitText={
					loading
						? editingGuest
							? "Updating..."
							: "Adding..."
						: editingGuest
						? "Update Guest"
						: "Add Guest"
				}
				cancelText="Cancel"
				cardClassName="card"
				submitButtonColor="#f59e0b"
				showAddressBook={true}
				contacts={contacts}
				onAddressBookSelect={(contact) => {
					// The FormModal will handle the form values internally
				}}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={deleteConfirm.show}
				{...getDeleteConfig("guests")}
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
				loading={loading}
			/>

			{/* Sort Modal */}
			<SortModal
				isOpen={showSortModal}
				onClose={() => setShowSortModal(false)}
				sortBy={sortBy}
				onSortChange={setSortBy}
				sortOptions={[
					{ value: "none", label: "None" },
					{ value: "name", label: "Name" },
					{ value: "rsvpStatus", label: "RSVP Status" },
					{ value: "numberOfGuests", label: "Number of Guests" },
					{ value: "date-created", label: "Date Created" },
				]}
				title="Sort Guests"
			/>
		</div>
	);
}
