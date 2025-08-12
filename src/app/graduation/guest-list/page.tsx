"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	fetchGraduationGuests,
	addGraduationGuest,
	updateGraduationGuest,
	deleteGraduationGuest,
	GraduationGuest,
} from "@/store/slices/graduation/graduationGuestListSlice";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import SortModal from "@/components/modals/SortModal";
import GuestCardItem from "@/components/cards/guest/GuestCardItem";
import HolidayPageHeader from "@/components/common/HolidayPageHeader";
import AddButton from "@/components/common/AddButton";
import RSVPSection from "@/components/common/RSVPSection";
import ReservationsTracker from "@/components/cards/reservation/ReservationsTracker";
import FormModal from "@/components/modals/FormModal";
import DeleteModal from "@/components/modals/DeleteModal";
import { getFormConfig } from "@/config/formConfigs";
import { getDeleteConfig } from "@/config/deleteModalConfigs";

export default function GraduationGuestListPage() {
	const dispatch = useAppDispatch();
	const { guests, loading, error, initialized } = useAppSelector(
		(state: any) => state.graduationGuestList
	);
	const { contacts: globalContacts } = useAppSelector(
		(state: any) => state.addressBook
	);

	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		guestId: string | null;
	}>({
		show: false,
		guestId: null,
	});
	const [showForm, setShowForm] = useState(false);
	const [editingGuest, setEditingGuest] = useState<GraduationGuest | null>(
		null
	);
	const [sortBy, setSortBy] = useState<string>("none");
	const [showSortModal, setShowSortModal] = useState(false);

	useEffect(() => {
		if (!initialized) {
			dispatch(fetchGraduationGuests());
		}
		dispatch(fetchContacts());
	}, [dispatch, initialized]);

	function handleAddGuest(formValues: Record<string, any>) {
		if (!formValues.name || (typeof formValues.name === "string" && !formValues.name.trim())) return;

		if (editingGuest) {
			const updatedGuest: GraduationGuest = {
				...editingGuest,
				name: formValues.name,
				email: formValues.email || undefined,
				phone: formValues.phone || undefined,
				address: formValues.address || undefined,
				rsvpStatus: formValues.rsvpStatus || "pending",
				numberOfGuests: parseInt(formValues.numberOfGuests) || 1,
				dietaryRestrictions: formValues.dietaryRestrictions || undefined,
				bringingDish: formValues.bringingDish || undefined,
				notes: formValues.notes || undefined,
				isCompleted: formValues.rsvpStatus === "confirmed",
			};
			dispatch(updateGraduationGuest(updatedGuest));
			setEditingGuest(null);
		} else {
			const newGuest: Omit<GraduationGuest, "id" | "createdAt" | "updatedAt"> =
				{
					name: formValues.name,
					email: formValues.email || undefined,
					phone: formValues.phone || undefined,
					address: formValues.address || undefined,
					rsvpStatus: formValues.rsvpStatus || "pending",
					numberOfGuests: parseInt(formValues.numberOfGuests) || 1,
					dietaryRestrictions: formValues.dietaryRestrictions || undefined,
					bringingDish: formValues.bringingDish || undefined,
					notes: formValues.notes || undefined,
					isCompleted: formValues.rsvpStatus === "confirmed",
				};
			dispatch(addGraduationGuest(newGuest));
		}
		setShowForm(false);
	}

	function handleToggleGuest(guestId: string) {
		// For now, we'll just toggle the completion status
		const guest = guests.find((g: GraduationGuest) => g.id === guestId);
		if (guest) {
			const updatedGuest = {
				...guest,
				isCompleted: !guest.isCompleted,
			};
			dispatch(updateGraduationGuest(updatedGuest));
		}
	}

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
		setEditingGuest(null);
	}

	function handleEditGuest(guest: GraduationGuest) {
		setEditingGuest(guest);
		setShowForm(true);
	}

	function handleDeleteGuest(guestId: string) {
		setDeleteConfirm({ show: true, guestId });
	}

	function confirmDelete() {
		if (deleteConfirm.guestId) {
			dispatch(deleteGraduationGuest(deleteConfirm.guestId));
			setDeleteConfirm({ show: false, guestId: null });
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, guestId: null });
	}

	function sortGuests(guestsToSort: GraduationGuest[]): GraduationGuest[] {
		switch (sortBy) {
			case "name":
				return [...guestsToSort].sort((a, b) => a.name.localeCompare(b.name));
			case "rsvpStatus":
				return [...guestsToSort].sort((a, b) =>
					a.rsvpStatus.localeCompare(b.rsvpStatus)
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
			<div className="min-h-screen graduation-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading guests...</p>
				</div>
			</div>
		);
	}

	const sortedGuests = sortGuests(guests);

	return (
		<div className="min-h-screen graduation-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Guest List"
				backHref="/graduation"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort guests"
				description="Plan your graduation guest list with style!"
				holidayColor="purple-500"
				error={error}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				<ReservationsTracker
					guests={guests}
					title="Graduation Guest Tracker"
					accentColor="#8b5cf6"
				/>
				<AddButton title="Guest" onClick={openForm} color="purple" />
				<div className="flex items-center justify-center">
					{sortBy !== "none" && (
						<div className="text-center text-sm text-gray-600 dark:text-gray-400">
							{sortBy === "name" && "Sorted by Name"}
							{sortBy === "rsvpStatus" && "Sorted by RSVP Status"}
							{sortBy === "date-created" && "Sorted by Date Created"}
						</div>
					)}
				</div>

				<RSVPSection
					title="Pending"
					items={sortedGuests.filter(
						(guest: GraduationGuest) => guest.rsvpStatus === "pending"
					)}
					rsvpStatus="pending"
					emptyMessage="No pending guests yet."
					holidayColor="bg-gradient-to-br from-purple-300 to-purple-500"
					renderItem={(guest: GraduationGuest) => (
						<GuestCardItem
							key={guest.id}
							guest={guest}
							onToggle={handleToggleGuest}
							onEdit={handleEditGuest}
							onDelete={handleDeleteGuest}
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
					items={sortedGuests.filter(
						(guest: GraduationGuest) => guest.rsvpStatus === "confirmed"
					)}
					rsvpStatus="confirmed"
					emptyMessage="No confirmed guests yet."
					holidayColor="bg-gradient-to-br from-purple-300 to-purple-500"
					renderItem={(guest: GraduationGuest) => (
						<GuestCardItem
							key={guest.id}
							guest={guest}
							onToggle={handleToggleGuest}
							onEdit={handleEditGuest}
							onDelete={handleDeleteGuest}
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
					items={sortedGuests.filter(
						(guest: GraduationGuest) => guest.rsvpStatus === "declined"
					)}
					rsvpStatus="declined"
					emptyMessage="No declined guests yet."
					holidayColor="bg-gradient-to-br from-purple-300 to-purple-500"
					renderItem={(guest: GraduationGuest) => (
						<GuestCardItem
							key={guest.id}
							guest={guest}
							onToggle={handleToggleGuest}
							onEdit={handleEditGuest}
							onDelete={handleDeleteGuest}
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
				title={editingGuest ? "Edit Guest" : "Add New Guest"}
				fields={getFormConfig("guests", editingGuest ? "edit" : "add").fields}
				initialValues={
					editingGuest
						? {
								name: editingGuest.name,
								email: editingGuest.email || "",
								phone: editingGuest.phone || "",
								address: editingGuest.address || "",
								notes: editingGuest.notes || "",
								rsvpStatus: editingGuest.rsvpStatus,
								numberOfGuests: editingGuest.numberOfGuests?.toString() || "1",
								dietaryRestrictions: editingGuest.dietaryRestrictions || "",
								bringingDish: editingGuest.bringingDish || "",
						  }
						: {
								rsvpStatus: "pending",
								numberOfGuests: "1",
								dietaryRestrictions: "",
								bringingDish: "",
						  }
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
					{ value: "rsvpStatus", label: "RSVP Status" },
					{ value: "date-created", label: "Date Created" },
				]}
				title="Sort Guests"
			/>
		</div>
	);
}
