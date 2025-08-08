"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchBabyShowerGuests,
	addBabyShowerGuest,
	updateBabyShowerGuest,
	deleteBabyShowerGuest,
	toggleBabyShowerGuestCompletion,
	BabyShowerGuest,
} from "@/store/slices/baby-shower/babyShowerGuestListSlice";
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

export default function BabyShowerGuestListPage() {
	const dispatch = useAppDispatch();
	const { guests, loading, error, initialized } = useAppSelector(
		(state: any) => state.babyShowerGuestList
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
	const [editingGuest, setEditingGuest] = useState<BabyShowerGuest | null>(
		null
	);
	const [sortBy, setSortBy] = useState<string>("none");
	const [showSortModal, setShowSortModal] = useState(false);

	useEffect(() => {
		// Fetch guests and contacts when component mounts if not already initialized
		if (!initialized) {
			dispatch(fetchBabyShowerGuests());
		}
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch, initialized]);

	function handleAddGuest(formValues: Record<string, any>) {
		if (!formValues.name?.trim() || !formValues.numberOfGuests) return;

		if (editingGuest) {
			// Update existing guest
			const updatedGuest: BabyShowerGuest = {
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
				bringingGift: formValues.bringingGift || undefined,
				notes: formValues.notes || undefined,
			};
			dispatch(updateBabyShowerGuest(updatedGuest));
			setEditingGuest(null);
		} else {
			// Add new guest
			const newGuest: Omit<BabyShowerGuest, "id" | "createdAt" | "updatedAt"> =
				{
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
					bringingGift: formValues.bringingGift || undefined,
					notes: formValues.notes || undefined,
					isCompleted: false,
				};
			dispatch(addBabyShowerGuest(newGuest));
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
		// Find the guest and toggle their completion status
		const guest = guests.find((g: BabyShowerGuest) => g.id === guestId);
		if (guest) {
			const updatedGuest = {
				...guest,
				isCompleted: !guest.isCompleted,
			};
			dispatch(updateBabyShowerGuest(updatedGuest));
		}
	}

	function handleEditGuest(guest: BabyShowerGuest) {
		setEditingGuest(guest);
		setShowForm(true);
	}

	function handleDeleteGuest(guestId: string) {
		setDeleteConfirm({ show: true, guestId });
	}

	function confirmDelete() {
		if (deleteConfirm.guestId) {
			dispatch(deleteBabyShowerGuest(deleteConfirm.guestId));
			setDeleteConfirm({ show: false, guestId: null });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, guestId: null });
	}

	function sortGuests(guestsToSort: BabyShowerGuest[]): BabyShowerGuest[] {
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
			<div className="min-h-screen baby-shower-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading guests...</p>
				</div>
			</div>
		);
	}

	const sortedGuests = sortGuests(guests);
	const pendingGuests = sortedGuests.filter(
		(guest: BabyShowerGuest) =>
			!guest.isCompleted && guest.rsvpStatus !== "declined"
	);
	const confirmedGuests = sortedGuests.filter(
		(guest: BabyShowerGuest) =>
			guest.isCompleted && guest.rsvpStatus !== "declined"
	);
	const declinedGuests = sortedGuests.filter(
		(guest: BabyShowerGuest) => guest.rsvpStatus === "declined"
	);

	return (
		<div className="min-h-screen baby-shower-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Guest List"
				backHref="/baby-shower"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort guests"
				error={error}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				<AddButton title="Guest" onClick={openForm} color="blue" />
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
					renderItem={(guest: BabyShowerGuest) => (
						<GuestCardItem
							key={guest.id}
							guest={{
								...guest,
								rsvpStatus: "pending" as any,
							}}
							onToggle={handleToggleGuest}
							onEdit={(guest) => {
								handleEditGuest(guest);
								setShowForm(true);
							}}
							onDelete={handleDeleteGuest}
							loading={loading}
							theme={{
								accentColor: "#06b6d4", // Cyan for Baby Shower
							}}
							borderColor="rgb(var(--color-cyan-500))" // Cyan border for Baby Shower
						/>
					)}
				/>

				<RSVPSection
					title="Confirmed"
					items={confirmedGuests}
					rsvpStatus="confirmed"
					emptyMessage="No confirmed RSVPs yet."
					renderItem={(guest: BabyShowerGuest) => (
						<GuestCardItem
							key={guest.id}
							guest={{
								...guest,
								rsvpStatus: "confirmed" as any,
							}}
							onToggle={handleToggleGuest}
							onEdit={(guest) => {
								handleEditGuest(guest);
								setShowForm(true);
							}}
							onDelete={handleDeleteGuest}
							loading={loading}
							theme={{
								accentColor: "#06b6d4", // Cyan for Baby Shower
							}}
							borderColor="rgb(var(--color-cyan-500))" // Cyan border for Baby Shower
						/>
					)}
				/>

				<RSVPSection
					title="Declined"
					items={declinedGuests}
					rsvpStatus="declined"
					emptyMessage="No declined RSVPs yet."
					renderItem={(guest: BabyShowerGuest) => (
						<GuestCardItem
							key={guest.id}
							guest={{
								...guest,
								rsvpStatus: "declined" as any,
							}}
							onToggle={handleToggleGuest}
							onEdit={(guest) => {
								handleEditGuest(guest);
								setShowForm(true);
							}}
							onDelete={handleDeleteGuest}
							loading={loading}
							theme={{
								accentColor: "#06b6d4", // Cyan for Baby Shower
							}}
							borderColor="rgb(var(--color-cyan-500))" // Cyan border for Baby Shower
						/>
					)}
				/>
			</main>

			{/* Form Modal */}
			<FormModal
				isOpen={showForm}
				title={editingGuest ? "Edit Guest" : "Add New Guest"}
				fields={[
					{
						id: "name",
						type: "text" as const,
						placeholder: "Guest Name*",
						required: true,
					},
					{
						id: "email",
						type: "email" as const,
						placeholder: "Email",
					},
					{
						id: "phone",
						type: "tel" as const,
						placeholder: "Phone",
					},
					{
						id: "address",
						type: "textarea" as const,
						placeholder: "Address",
						rows: 2,
					},
					{
						id: "rsvpStatus",
						type: "select" as const,
						placeholder: "RSVP Status*",
						required: true,
						options: [
							{ value: "pending", label: "Pending" },
							{ value: "confirmed", label: "Confirmed" },
							{ value: "declined", label: "Declined" },
						],
					},
					{
						id: "numberOfGuests",
						type: "number" as const,
						placeholder: "Number of Guests*",
						required: true,
						min: "1",
					},
					{
						id: "dietaryRestrictions",
						type: "text" as const,
						placeholder: "Dietary Restrictions",
					},
					{
						id: "bringingGift",
						type: "text" as const,
						placeholder: "Bringing Gift",
					},
					{
						id: "notes",
						type: "textarea" as const,
						placeholder: "Notes",
						rows: 2,
					},
				]}
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
								bringingGift: editingGuest.bringingGift || "",
								notes: editingGuest.notes || "",
						  }
						: { rsvpStatus: "pending", numberOfGuests: "1" }
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
				submitButtonColor="#06b6d4"
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
