'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useGuestMutations } from '@/hooks/useGuestMutations';
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
  updateGuestInHomeData,
  addGuestToHomeData,
  removeGuestFromHomeData,
} from '@/store/slices/homeSlice';

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

export default function BirthdayGuestListPage() {
  const dispatch = useAppDispatch();

  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();

  const { createGuest, updateGuest, deleteGuest } = useGuestMutations();

  const { refreshHomeData } = useRefreshHomeData();

  // Get guest lists from holiday data
  const guestLists = useMemo(
    () => holidayData?.guestLists || [],
    [holidayData?.guestLists],
  );

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
      // Update existing guest - optimistic update to Redux first, then persist to API
      const updatedGuestList = {
        ...editingGuest,
        contact: {
          name: formValues.name,
          email: formValues.email || undefined,
          phone: formValues.phone || undefined,
          streetAddress: formValues.address || undefined,
        },
        rsvpStatus: formValues.rsvpStatus as 'pending' | 'confirmed' | 'declined',
        notes: formValues.notes || undefined,
      };

      // Update Redux immediately for responsive UI
      dispatch(
        updateGuestInHomeData({
          holidayId,
          guestId: editingGuest.id,
          updates: updatedGuestList,
        }),
      );

      // Persist to API in background
      try {
        await updateGuest({
          holidayId,
          guestId: editingGuest.id,
          isCompleted: formValues.rsvpStatus === 'confirmed',
        });

        // Refresh home data to ensure UI is in sync
        await refreshHomeData(auth0User, holidayId);
      } catch (error) {
        console.error('Failed to update guest:', error);
        // Could implement rollback logic here if needed
      }

      setEditingGuest(null);
      setShowForm(false);
    } else {
      // Add new guest - optimistic update to Redux first, then persist to API
      const tempId = `temp-${Date.now()}`;
      const newGuestList = {
        id: tempId, // Temporary ID for optimistic update
        contact: {
          name: formValues.name,
          email: formValues.email || undefined,
          phone: formValues.phone || undefined,
          streetAddress: formValues.address || undefined,
        },
        rsvpStatus: formValues.rsvpStatus as 'pending' | 'confirmed' | 'declined',
        notes: formValues.notes || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Update Redux immediately for responsive UI
      dispatch(
        addGuestToHomeData({
          holidayId,
          guest: newGuestList,
        }),
      );

      // Persist to API in background and refresh guest data
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
        });

        // Refresh home data to get the new guest with real ID
        await refreshHomeData(auth0User, holidayId);
      } catch (error) {
        console.error('Failed to create guest:', error);
        // Remove the temporary guest from Redux on error
        dispatch(
          removeGuestFromHomeData({
            holidayId,
            guestId: tempId,
          }),
        );
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
        guestList.rsvpStatus === 'confirmed' ? 'pending' : 'confirmed';

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
        }),
      );

      // Persist to API in background
      try {
        await updateGuest({
          auth0User,
          holidayId,
          guestId,
          isCompleted: newRsvpStatus === 'confirmed',
        }).unwrap();

        // Refresh home data to ensure UI is in sync
        await refreshHomeData(auth0User, holidayId);
      } catch (error) {
        console.error('Failed to toggle guest:', error);
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
        }),
      );

      // Persist to API in background
      try {
        await deleteGuest({
          holidayId,
          guestId: deleteConfirm.guestId,
        });

        // Refresh home data to ensure UI is in sync
        await refreshHomeData(auth0User, holidayId);
      } catch (error) {
        console.error('Failed to delete guest:', error);
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
      case 'name':
        return [...guestsToSort].sort((a, b) => a.name.localeCompare(b.name));
      case 'rsvpStatus':
        return [...guestsToSort].sort((a, b) =>
          a.rsvpStatus.localeCompare(b.rsvpStatus),
        );
      case 'numberOfGuests':
        return [...guestsToSort].sort((a, b) => b.numberOfGuests - a.numberOfGuests);
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
      <div className="min-h-screen birthday-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
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
    <div className="min-h-screen birthday-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Guest List"
        backHref="/birthday"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort guests"
        description="Keep track of your Birthday guests!"
        holidayColor="yellow-500"
        error={undefined}
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        <ReservationsTracker
          guests={guests}
          title="Birthday Guest Tracker"
          accentColor="#f59e0b"
        />
        <AddButton title="Guest" onClick={openForm} color="yellow" />
        <div className="flex items-center justify-center">
          {sortBy !== 'none' && (
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              {sortBy === 'name' && 'Sorted by Name'}
              {sortBy === 'rsvpStatus' && 'Sorted by RSVP Status'}
              {sortBy === 'numberOfGuests' && 'Sorted by Number of Guests'}
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
              theme={{
                accentColor: '#f59e0b', // Amber for Birthday
              }}
              borderColor="rgb(var(--color-yellow-500))" // Yellow border for Birthday
              holiday="Birthday"
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
              theme={{
                accentColor: '#f59e0b', // Amber for Birthday
              }}
              borderColor="rgb(var(--color-yellow-500))" // Yellow border for Birthday
              holiday="Birthday"
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
              theme={{
                accentColor: '#f59e0b', // Amber for Birthday
              }}
              borderColor="rgb(var(--color-yellow-500))" // Yellow border for Birthday
              holiday="Birthday"
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
        submitText={editingGuest ? 'Update Guest' : 'Add Guest'}
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#f59e0b"
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
          { value: 'numberOfGuests', label: 'Number of Guests' },
          { value: 'date-created', label: 'Date Created' },
        ]}
        title="Sort Guests"
      />
    </div>
  );
}
