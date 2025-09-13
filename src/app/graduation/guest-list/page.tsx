"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import {
	selectHolidayPreferences,
	selectHomeInitialized,
	selectHomeData,
} from "@/store/selectors/home";
import { selectGuestListsByHoliday } from "@/store/slices/homeSlice";
import { getHolidayDataFromRedux } from "@/utils/holidayData";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";
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
import {
	updateGuestInHomeData,
	addGuestToHomeData,
	removeGuestFromHomeData,
} from "@/store/slices/homeSlice";
import {
	useCreateGuestMutation,
	useUpdateGuestMutation,
	useEditGuestMutation,
	useDeleteGuestMutation,
} from "@/store/api";

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

export default function GraduationGuestListPage() {
	const dispatch = useAppDispatch();
	const { user: auth0User } = useAuth0();

	// Get home data and holiday data from Redux
	const homeData = useAppSelector(selectHomeData);
	const homeInitialized = useAppSelector(selectHomeInitialized);
	const holidayPreferences = useAppSelector(selectHolidayPreferences);

	// Get holiday ID from route
	const holidayId = homeInitialized
		? getHolidayIdFromRoute("/graduation", holidayPreferences)
		: null;

	// Get current Redux state for skip logic
	const currentState = useAppSelector((state: any) => state);

	// Get holiday data from Redux
	const holidayData = getHolidayDataFromRedux(holidayId, currentState);

	// Get guest lists from home data
	const guestLists = useAppSelector(
		holidayId ? selectGuestListsByHoliday(holidayId) : () => []
	) as any[];

	// Transform guest list data to match expected format
	const guests = guestLists.map((guestList: any) => ({
		id: guestList.id,
		name: guestList.contact?.name || "Unknown",
		email: guestList.contact?.email || undefined,
		phone: guestList.contact?.phone || undefined,
		address: guestList.contact?.streetAddress || undefined,
		rsvpStatus: guestList.rsvpStatus || "pending",
		numberOfGuests: 1, // Default to 1 since this isn't stored in the current schema
		notes: guestList.notes || undefined,
		isCompleted: guestList.rsvpStatus === "confirmed",
		createdAt: guestList.createdAt,
		updatedAt: guestList.updatedAt,
	}));

	// Use API mutations only for data persistence
	const [createGuest, createGuestState] = useCreateGuestMutation();
	const [updateGuest, updateGuestState] = useUpdateGuestMutation();
	const [editGuest, editGuestState] = useEditGuestMutation();
	const [deleteGuest, deleteGuestState] = useDeleteGuestMutation();

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
			// Update existing guest - optimistic update to Redux first, then persist to API
			const updatedGuestList = {
				...editingGuest,
				contact: {
					name: formValues.name,
					email: formValues.email || undefined,
					phone: formValues.phone || undefined,
					streetAddress: formValues.address || undefined,
				},
				rsvpStatus: formValues.rsvpStatus as
					| "pending"
					| "confirmed"
					| "declined",
				notes: formValues.notes || undefined,
			};

			// Update Redux immediately for responsive UI
			dispatch(
				updateGuestInHomeData({
					holidayId,
					guestId: editingGuest.id,
					updates: updatedGuestList,
				})
			);

			// Persist to API in background
			try {
				await editGuest({
					holidayId,
					guestId: editingGuest.id,
					payload: {
						name: formValues.name,
						email: formValues.email || undefined,
						phone: formValues.phone || undefined,
						address: formValues.address || undefined,
						rsvpStatus: formValues.rsvpStatus as
							| "pending"
							| "confirmed"
							| "declined",
						notes: formValues.notes || undefined,
					},
					auth0User,
				}).unwrap();
			} catch (error) {
				console.error("Failed to update guest:", error);
				// Could implement rollback logic here if needed
			}

			setEditingGuest(null);
			setShowForm(false);
		} else {
			// Add new guest - optimistic update to Redux first, then persist to API
			const newGuestList = {
				id: `temp-${Date.now()}`, // Temporary ID for optimistic update
				contact: {
					name: formValues.name,
					email: formValues.email || undefined,
					phone: formValues.phone || undefined,
					streetAddress: formValues.address || undefined,
				},
				rsvpStatus: formValues.rsvpStatus as
					| "pending"
					| "confirmed"
					| "declined",
				notes: formValues.notes || undefined,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			// Update Redux immediately for responsive UI
			dispatch(
				addGuestToHomeData({
					holidayId,
					guest: newGuestList,
				})
			);

			// Persist to API in background
			try {
				await createGuest({
					holidayId,
					payload: {
						name: formValues.name,
						email: formValues.email || undefined,
						phone: formValues.phone || undefined,
						address: formValues.address || undefined,
						rsvpStatus: formValues.rsvpStatus as
							| "pending"
							| "confirmed"
							| "declined",
						notes: formValues.notes || undefined,
					},
					auth0User,
				}).unwrap();
			} catch (error) {
				console.error("Failed to create guest:", error);
				// Could implement rollback logic here if needed
			}

			setShowForm(false);
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

		const guestList = guestLists.find((gl: any) => gl.id === guestId);
		if (guestList) {
			// Toggle RSVP status: if confirmed, set to pending; if pending, set to confirmed
			const newRsvpStatus =
				guestList.rsvpStatus === "confirmed" ? "pending" : "confirmed";

			const updatedGuestList = {
				...guestList,
				rsvpStatus: newRsvpStatus,
				updatedAt: new Date().toISOString(),
			};

			// Update Redux immediately for responsive UI
			dispatch(
				updateGuestInHomeData({
					holidayId,
					guestId: guestId,
					updates: updatedGuestList,
				})
			);

			// Persist to API in background
			try {
				await updateGuest({
					holidayId,
					guestId,
					isCompleted: true, // This will toggle the RSVP status
					auth0User,
				}).unwrap();
			} catch (error) {
				console.error("Failed to toggle guest:", error);
				// Could implement rollback logic here if needed
			}
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
			// Update Redux immediately for responsive UI
			dispatch(
				removeGuestFromHomeData({
					holidayId,
					guestId: deleteConfirm.guestId,
				})
			);

			// Persist to API in background
			try {
				await deleteGuest({
					holidayId,
					guestId: deleteConfirm.guestId,
					auth0User,
				}).unwrap();
			} catch (error) {
				console.error("Failed to delete guest:", error);
				// Could implement rollback logic here if needed
			}

			setDeleteConfirm({ show: false, guestId: null });
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

	// Show loading only if home data is not initialized
	if (!homeInitialized) {
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
		<div className="min-h-screen graduation-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Guest List"
				backHref="/graduation"
				onSortClick={() => setShowSortModal(true)}
				sortTitle="Sort guests"
				description="Keep track of your Graduation guests!"
				holidayColor="purple-600"
				error={undefined}
			/>
			<main className="w-full max-w-4xl flex flex-col gap-6">
				<ReservationsTracker
					guests={guests}
					title="Graduation Guest Tracker"
					accentColor="#9333ea"
				/>
				<AddButton title="Guest" onClick={openForm} color="purple" />
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
							loading={updateGuestState.isLoading}
							theme={{
								accentColor: "#9333ea", // Purple for Graduation
							}}
							borderColor="rgb(var(--color-purple-500))" // Purple border for Graduation
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
							loading={updateGuestState.isLoading}
							theme={{
								accentColor: "#9333ea", // Purple for Graduation
							}}
							borderColor="rgb(var(--color-purple-500))" // Purple border for Graduation
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
							loading={updateGuestState.isLoading}
							theme={{
								accentColor: "#9333ea", // Purple for Graduation
							}}
							borderColor="rgb(var(--color-purple-500))" // Purple border for Graduation
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
				loading={
					editingGuest ? editGuestState.isLoading : createGuestState.isLoading
				}
				submitText={editingGuest ? "Update Guest" : "Add Guest"}
				cancelText="Cancel"
				cardClassName="card"
				submitButtonColor="#9333ea"
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
					{ value: "numberOfGuests", label: "Number of Guests" },
					{ value: "date-created", label: "Date Created" },
				]}
				title="Sort Guests"
			/>
		</div>
	);
}
