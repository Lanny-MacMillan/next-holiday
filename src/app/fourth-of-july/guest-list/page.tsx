"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	selectHolidayPreferences,
	selectHomeInitialized,
	selectHomeData,
} from "@/store/selectors/home";
import { getHolidayDataFromRedux } from "@/utils/holidayData";
import { useGuestMutations } from "@/hooks/useGuestMutations";
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

interface Guest {
	id: string;
	name: string;
	email?: string;
	phone?: string;
	address?: string;
	rsvpStatus: "pending" | "confirmed" | "declined";
	numberOfGuests: number; // Required for compatibility with existing components
	notes?: string;
	isCompleted: boolean;
	createdAt: string;
	updatedAt: string;
}

export default function FourthOfJulyGuestListPage() {
	const dispatch = useAppDispatch();

	// Get current Redux state for skip logic
	const currentState = useAppSelector((state: any) => state);

	// Get home data and holiday data from Redux
	const homeData = useAppSelector(selectHomeData);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const holidayPreferences = useAppSelector(selectHolidayPreferences);

	// Use the guest mutations hook
	const {
		holidayId,
		auth0User,
		guests,
		loading,
		error,
		initialized,
		createGuest,
		updateGuest,
		editGuest,
		deleteGuest,
		createGuestState,
		updateGuestState,
		editGuestState,
		deleteGuestState,
	} = useGuestMutations();

	// Get holiday data from Redux
	const holidayData = getHolidayDataFromRedux(holidayId, currentState);

	// Note: Guests are not stored in home data, they use their own slice
	// The useGuestMutations hook already handles Redux state updates

	const { contacts } = useAppSelector((state: any) => state.addressBook);

	const [deleteConfirm, setDeleteConfirm] = useState<{
		show: boolean;
		guestId: string | null;
	}>({
		show: false,
		guestId: null,
	});
	const [showForm, setShowForm] = useState(false);
	const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
	const [sortBy, setSortBy] = useState<string>("none");
	const [showSortModal, setShowSortModal] = useState(false);

	useEffect(() => {
		// Always fetch contacts for address book functionality
		dispatch(fetchContacts());
	}, [dispatch]);

	async function handleAddGuest(formValues: Record<string, any>) {
		if (
			!formValues.name ||
			(typeof formValues.name === "string" && !formValues.name.trim())
		)
			return;

		if (!holidayId || !auth0User) return;

		if (editingGuest) {
			// Update existing guest
			try {
				const payload = {
					name: formValues.name,
					email: formValues.email || undefined,
					phone: formValues.phone || undefined,
					address: formValues.address || undefined,
					rsvpStatus: formValues.rsvpStatus as
						| "pending"
						| "confirmed"
						| "declined",
					notes: formValues.notes || undefined,
				};

				await editGuest({
					holidayId,
					guestId: editingGuest.id,
					payload,
					auth0User,
				}).unwrap();
				setEditingGuest(null);
				setShowForm(false);
			} catch (error) {
				console.error("Error editing guest:", error);
			}
		} else {
			// Add new guest
			try {
				const payload = {
					name: formValues.name,
					email: formValues.email || undefined,
					phone: formValues.phone || undefined,
					address: formValues.address || undefined,
					rsvpStatus: formValues.rsvpStatus as
						| "pending"
						| "confirmed"
						| "declined",
					notes: formValues.notes || undefined,
				};

				await createGuest({
					holidayId,
					payload,
					auth0User,
				}).unwrap();
				setShowForm(false);
			} catch (error) {
				console.error("Error creating guest:", error);
			}
		}
	}

	function openForm() {
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
		setEditingGuest(null);
	}

	async function handleToggleGuest(guestId: string) {
		if (!holidayId || !auth0User) return;

		try {
			const guest = guests.find((g: Guest) => g.id === guestId);
			if (guest) {
				// Toggle RSVP status: if confirmed, set to pending; if pending, set to confirmed
				const newIsCompleted = guest.rsvpStatus !== "confirmed";
				await updateGuest({
					holidayId,
					guestId,
					isCompleted: newIsCompleted,
					auth0User,
				}).unwrap();
			}
		} catch (error) {
			console.error("Error updating guest:", error);
		}
	}

	function handleEditGuest(guest: Guest) {
		setEditingGuest(guest);
		setShowForm(true);
	}

	function handleDeleteGuest(guestId: string) {
		setDeleteConfirm({ show: true, guestId });
	}

	async function confirmDelete() {
		if (deleteConfirm.guestId && holidayId && auth0User) {
			try {
				await deleteGuest({
					holidayId,
					guestId: deleteConfirm.guestId,
					auth0User,
				}).unwrap();

				setDeleteConfirm({ show: false, guestId: null });
			} catch (error) {
				console.error("Error deleting guest:", error);
			}
		}
	}

	function cancelDelete() {
		setDeleteConfirm({ show: false, guestId: null });
	}

	function sortGuests(guestsToSort: Guest[]): Guest[] {
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

	// Show loading only if home data is not initialized
	if (!homeInitialized) {
		return (
			<div className="min-h-screen fourth-of-july-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading guests...</p>
				</div>
			</div>
		);
	}

	const sortedGuests = sortGuests(guests);
	const pendingGuests = sortedGuests.filter(
		(guest: Guest) => guest.rsvpStatus === "pending"
	);
	const confirmedGuests = sortedGuests.filter(
		(guest: Guest) => guest.rsvpStatus === "confirmed"
	);
	const declinedGuests = sortedGuests.filter(
		(guest: Guest) => guest.rsvpStatus === "declined"
	);

	return (
		<div className="min-h-screen fourth-of-july-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Guest List"
				backHref="/fourth-of-july"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort guests"
				description="Keep track of your Fourth of July guests!"
				holidayColor="blue-600"
				error={error ? "API Error" : undefined}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				<ReservationsTracker
					guests={guests}
					title="Fourth of July Guest Tracker"
					accentColor="#3b82f6"
				/>
				<AddButton title="Guest" onClick={openForm} color="blue" />
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
					items={pendingGuests}
					rsvpStatus="pending"
					emptyMessage="No pending RSVPs yet."
					renderItem={(guest: Guest) => (
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
								accentColor: "#3b82f6", // Blue for Fourth of July
							}}
							borderColor="rgb(var(--color-blue-500))" // Blue border for Fourth of July
						/>
					)}
				/>

				<RSVPSection
					title="Confirmed"
					items={confirmedGuests}
					rsvpStatus="confirmed"
					emptyMessage="No confirmed RSVPs yet."
					renderItem={(guest: Guest) => (
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
								accentColor: "#3b82f6", // Blue for Fourth of July
							}}
							borderColor="rgb(var(--color-blue-500))" // Blue border for Fourth of July
						/>
					)}
				/>

				<RSVPSection
					title="Declined"
					items={declinedGuests}
					rsvpStatus="declined"
					emptyMessage="No declined RSVPs yet."
					renderItem={(guest: Guest) => (
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
								accentColor: "#3b82f6", // Blue for Fourth of July
							}}
							borderColor="rgb(var(--color-blue-500))" // Blue border for Fourth of July
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
								notes: editingGuest.notes || "",
						  }
						: {}
				}
				onSubmit={handleAddGuest}
				onClose={closeForm}
				loading={editGuestState.isLoading || createGuestState.isLoading}
				submitText={
					editGuestState.isLoading || createGuestState.isLoading
						? editingGuest
							? "Updating..."
							: "Adding..."
						: editingGuest
						? "Update Guest"
						: "Add Guest"
				}
				cancelText="Cancel"
				cardClassName="card"
				submitButtonColor="#3b82f6"
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
				loading={deleteGuestState.isLoading}
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
					{ value: "date-created", label: "Date Created" },
				]}
				title="Sort Guests"
			/>
		</div>
	);
}
