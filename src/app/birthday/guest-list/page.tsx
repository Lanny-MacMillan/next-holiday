'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useGuestMutations } from '@/hooks/useGuestMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { fetchContacts, resetContacts } from '@/store/slices/addressBookSlice';
import SortModal from '@/components/modals/SortModal';
import GuestCardItem from '@/components/cards/guest/GuestCardItem';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import RSVPSection from '@/components/common/RSVPSection';
import ReservationsTracker from '@/components/cards/reservation/ReservationsTracker';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import { getFormConfigEnhanced } from '@/config/formConfigs';
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

  const {
    createGuest,
    updateGuest,
    deleteGuest,
    createGuestState,
    updateGuestState,
    deleteGuestState,
  } = useGuestMutations();

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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

    try {
      const result = await createGuest({
        holidayId,
        payload: {
          name: formValues.name,
          email: formValues.email || undefined,
          phone: formValues.phone || undefined,
          address: formValues.address || undefined,
          rsvpStatus: formValues.rsvpStatus as 'pending' | 'confirmed' | 'declined',
          notes: formValues.notes || undefined,
        },
        auth0User,
      }).unwrap();

      if (result) {
        // Refresh home data to get the new guest with real ID
        await refreshHomeData(auth0User, holidayId);

        // Reset and refresh contacts to ensure the newly created contact appears in the address book dropdown
        dispatch(resetContacts());
        dispatch(fetchContacts());

        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Failed to create guest:', error);
    }
  }

  async function handleUpdateGuest(formValues: Record<string, any>) {
    if (!editingGuest || !holidayId || !auth0User) return;

    try {
      const result = await updateGuest({
        holidayId,
        guestId: editingGuest.id,
        isCompleted: formValues.rsvpStatus === 'confirmed',
      }).unwrap();

      if (result) {
        // Refresh home data to ensure UI is in sync
        await refreshHomeData(auth0User, holidayId);
        setEditingGuest(null);
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Failed to update guest:', error);
    }
  }

  function openForm() {
    setShowAddModal(true);
  }

  function closeForm() {
    setShowAddModal(false);
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
    setShowEditModal(true);
  }

  function handleDeleteGuest(guestId: string) {
    setDeleteConfirm({ show: true, guestId });
  }

  async function confirmDelete() {
    if (deleteConfirm.guestId && holidayId && auth0User) {
      try {
        const result = await deleteGuest({
          holidayId,
          guestId: deleteConfirm.guestId,
          auth0User,
        }).unwrap();

        // Update Redux for responsive UI
        dispatch(
          removeGuestFromHomeData({
            holidayId,
            guestId: deleteConfirm.guestId,
          }),
        );

        // Refresh home data to ensure UI is in sync
        await refreshHomeData(auth0User, holidayId);
        setDeleteConfirm({ show: false, guestId: null });
      } catch (error) {
        console.error('Failed to delete guest:', error);
      }
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

  // Enhanced Compatibility Layer form config
  const formConfig = getFormConfigEnhanced('guests', 'add', {
    holidayKey: 'birthday',
    shareMembers: [],
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('guests', 'edit', {
    holidayKey: 'birthday',
    shareMembers: [],
    auth0User: auth0User,
  });

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
              onEdit={() => handleEditGuest(guest)}
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
              onEdit={() => handleEditGuest(guest)}
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

      {/* Add Modal */}
      <FormModal
        isOpen={showAddModal}
        title="Add New Guest"
        fields={formConfig.fields}
        onSubmit={handleAddGuest}
        onClose={closeForm}
        loading={createGuestState.isLoading}
        submitText={createGuestState.isLoading ? 'Processing...' : 'Add Guest'}
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#f59e0b"
        contacts={contacts}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Guest"
        fields={editFormConfig.fields}
        initialValues={{
          name: editingGuest?.name || '',
          email: editingGuest?.email || '',
          phone: editingGuest?.phone || '',
          address: editingGuest?.address || '',
          rsvpStatus: editingGuest?.rsvpStatus || 'pending',
          notes: editingGuest?.notes || '',
        }}
        onSubmit={handleUpdateGuest}
        onClose={() => {
          setShowEditModal(false);
          setEditingGuest(null);
        }}
        loading={updateGuestState.isLoading}
        submitText={updateGuestState.isLoading ? 'Processing...' : 'Update Guest'}
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#f59e0b"
        contacts={contacts}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteConfirm.show}
        {...getDeleteConfig('guests')}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={deleteGuestState.isLoading}
        itemName={guests.find((g: Guest) => g.id === deleteConfirm.guestId)?.name}
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
