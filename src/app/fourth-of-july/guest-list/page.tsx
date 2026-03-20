'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import SortModal from '@/components/modals/SortModal';
import GuestCardItem from '@/components/cards/guest/GuestCardItem';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import RSVPSection from '@/components/common/RSVPSection';
import ReservationsTracker from '@/components/cards/reservation/ReservationsTracker';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import { getFormConfig } from '@/config/formConfigs';
import { getDeleteConfig } from '@/config/deleteModalConfigs';
import {
  useCreateGuestMutation,
  useUpdateGuestMutation,
  useEditGuestMutation,
  useDeleteGuestMutation,
} from '@/store/api';

interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  rsvpStatus: 'pending' | 'confirmed' | 'declined';
  numberOfGuests: number; // Required for compatibility with existing components
  notes?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function FourthOfJulyGuestListPage() {
  const dispatch = useAppDispatch();
  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();
  const { refreshHomeData } = useRefreshHomeData();

  // Get guest lists from holiday data
  const guestLists = holidayData?.guestLists || [];

  // Transform guest list data to match expected format
  const guests = guestLists.map((guestList: any) => ({
    id: guestList.id,
    name: guestList.contact?.name || 'Unknown',
    email: guestList.contact?.email || undefined,
    phone: guestList.contact?.phone || undefined,
    address: guestList.contact?.streetAddress || undefined,
    rsvpStatus: guestList.rsvpStatus || 'pending',
    numberOfGuests: 1, // Default to 1 since this isn't stored in the current schema
    notes: guestList.notes || undefined,
    isCompleted: guestList.rsvpStatus === 'confirmed',
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
  const [sortBy, setSortBy] = useState<string>('none');
  const [showSortModal, setShowSortModal] = useState(false);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  async function handleAddGuest(formValues: Record<string, any>) {
    if (
      !formValues.name ||
      (typeof formValues.name === 'string' && !formValues.name.trim())
    )
      return;

    if (!holidayId || !auth0User) return;

    if (editingGuest) {
      // Update existing guest
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
              | 'pending'
              | 'confirmed'
              | 'declined',
            notes: formValues.notes || undefined,
          },
          auth0User,
        }).unwrap();

        // Refresh data after successful update
        await refreshHomeData(auth0User, holidayId);
      } catch (error) {
        console.error('Failed to update guest:', error);
      }

      setEditingGuest(null);
      setShowForm(false);
    } else {
      // Add new guest
      try {
        await createGuest({
          holidayId,
          payload: {
            name: formValues.name,
            email: formValues.email || undefined,
            phone: formValues.phone || undefined,
            address: formValues.address || undefined,
            rsvpStatus: formValues.rsvpStatus as
              | 'pending'
              | 'confirmed'
              | 'declined',
            notes: formValues.notes || undefined,
          },
          auth0User,
        }).unwrap();

        // Refresh data after successful creation
        await refreshHomeData(auth0User, holidayId);
      } catch (error) {
        console.error('Failed to create guest:', error);
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

    try {
      await updateGuest({
        holidayId,
        guestId,
        isCompleted: true, // This will toggle the RSVP status
        auth0User,
      }).unwrap();

      // Refresh data after successful toggle
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Failed to toggle guest:', error);
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

        // Refresh data after successful deletion
        await refreshHomeData(auth0User, holidayId);
      } catch (error) {
        console.error('Failed to delete guest:', error);
      }

      setDeleteConfirm({ show: false, guestId: null });
    }
  }

  function cancelDelete() {
    setDeleteConfirm({ show: false, guestId: null });
  }

  function sortGuests(guestsToSort: Guest[]): Guest[] {
    switch (sortBy) {
      case 'name':
        return [...guestsToSort].sort((a, b) => a.name.localeCompare(b.name));
      case 'rsvpStatus':
        return [...guestsToSort].sort((a, b) =>
          a.rsvpStatus.localeCompare(b.rsvpStatus),
        );
      case 'date-created':
        return [...guestsToSort].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
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
    (guest: Guest) => guest.rsvpStatus === 'pending',
  );
  const confirmedGuests = sortedGuests.filter(
    (guest: Guest) => guest.rsvpStatus === 'confirmed',
  );
  const declinedGuests = sortedGuests.filter(
    (guest: Guest) => guest.rsvpStatus === 'declined',
  );

  return (
    <div className="min-h-screen fourth-of-july-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Guest List"
        backHref="/fourth-of-july"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort guests"
        description="Keep track of your Fourth of July guests!"
        holidayColor="#dc2626"
        error={undefined}
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        <ReservationsTracker
          guests={guests}
          title="Fourth of July Guest Tracker"
          accentColor="#dc2626"
        />
        <AddButton title="Guest" onClick={openForm} color="red" />
        <div className="flex items-center justify-center">
          {sortBy !== 'none' && (
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              {sortBy === 'name' && 'Sorted by Name'}
              {sortBy === 'rsvpStatus' && 'Sorted by RSVP Status'}
              {sortBy === 'date-created' && 'Sorted by Date Created'}
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
              onEdit={guest => {
                handleEditGuest(guest);
                setShowForm(true);
              }}
              onDelete={handleDeleteGuest}
              loading={updateGuestState.isLoading}
              theme={{
                accentColor: '#dc2626', // Red for Fourth of July
              }}
              borderColor="rgb(var(--color-red-500))" // Red border for Fourth of July
              holiday="Fourth of July"
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
              onEdit={guest => {
                handleEditGuest(guest);
                setShowForm(true);
              }}
              onDelete={handleDeleteGuest}
              loading={updateGuestState.isLoading}
              theme={{
                accentColor: '#dc2626', // Red for Fourth of July
              }}
              borderColor="rgb(var(--color-red-500))" // Red border for Fourth of July
              holiday="Fourth of July"
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
              onEdit={guest => {
                handleEditGuest(guest);
                setShowForm(true);
              }}
              onDelete={handleDeleteGuest}
              loading={updateGuestState.isLoading}
              theme={{
                accentColor: '#dc2626', // Red for Fourth of July
              }}
              borderColor="rgb(var(--color-red-500))" // Red border for Fourth of July
              holiday="Fourth of July"
            />
          )}
        />
      </main>

      {/* Form Modal */}
      <FormModal
        isOpen={showForm}
        title={editingGuest ? 'Edit Guest' : 'Add New Guest'}
        fields={getFormConfig('guests', editingGuest ? 'edit' : 'add').fields}
        initialValues={
          editingGuest
            ? {
                name: editingGuest.name,
                email: editingGuest.email || '',
                phone: editingGuest.phone || '',
                address: editingGuest.address || '',
                rsvpStatus: editingGuest.rsvpStatus,
                notes: editingGuest.notes || '',
              }
            : {}
        }
        onSubmit={handleAddGuest}
        onClose={closeForm}
        loading={
          editingGuest ? editGuestState.isLoading : createGuestState.isLoading
        }
        submitText={editingGuest ? 'Update Guest' : 'Add Guest'}
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#3b82f6"
        showAddressBook={true}
        contacts={contacts}
        onAddressBookSelect={contact => {
          // The FormModal will handle the form values internally
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteConfirm.show}
        {...getDeleteConfig('guests')}
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
          { value: 'none', label: 'None' },
          { value: 'name', label: 'Name' },
          { value: 'rsvpStatus', label: 'RSVP Status' },
          { value: 'date-created', label: 'Date Created' },
        ]}
        title="Sort Guests"
      />
    </div>
  );
}
