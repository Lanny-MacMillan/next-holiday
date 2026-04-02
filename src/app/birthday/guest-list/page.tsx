'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useGuestMutations } from '@/hooks/useGuestMutations';
import { fetchContacts, resetContacts } from '@/store/slices/addressBookSlice';
import { updateGuestInHomeData } from '@/store/slices/homeSlice';
import SortModal from '@/components/modals/SortModal';
import GuestCardItem from '@/components/cards/guest/GuestCardItem';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import RSVPSection from '@/components/common/RSVPSection';
import ReservationsTracker from '@/components/cards/reservation/ReservationsTracker';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import { guestsFormConfig, editGuestsFormConfig } from '@/config/formConfigs';
import { getDeleteConfig } from '@/config/deleteModalConfigs';

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
    updateGuest, // For completion toggling
    editGuest, // For field editing
    deleteGuest,
    createGuestState,
    updateGuestState,
    editGuestState,
    deleteGuestState,
  } = useGuestMutations();

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
      // Find the original guest list entry
      const originalGuestList = guestLists.find(
        (gl: any) => gl.id === editingGuest.id,
      );
      if (!originalGuestList) return;

      // Prepare payload with all form data (matching Fourth of July pattern)
      const updatePayload = {
        name: formValues.name,
        email: formValues.email,
        phone: formValues.phone,
        address: formValues.address,
        rsvpStatus: formValues.rsvp_status, // Note: form uses rsvp_status
        notes: formValues.notes,
      };

      const optimisticUpdate = {
        ...originalGuestList,
        rsvpStatus: updatePayload.rsvpStatus,
        isCompleted: updatePayload.rsvpStatus === 'confirmed',
        notes: updatePayload.notes,
        updatedAt: new Date().toISOString(),
        // Update nested contact data
        contact: {
          ...originalGuestList.contact,
          name: updatePayload.name,
          email: updatePayload.email || originalGuestList.contact?.email,
          phone: updatePayload.phone || originalGuestList.contact?.phone,
          streetAddress:
            updatePayload.address || originalGuestList.contact?.streetAddress,
        },
      };

      dispatch(
        updateGuestInHomeData({
          holidayId,
          guestId: editingGuest.id,
          updates: optimisticUpdate,
        }),
      );

      // Use editGuest mutation with full form data
      const result = await editGuest({
        holidayId,
        guestId: editingGuest.id,
        payload: updatePayload,
        auth0User,
      }).unwrap();

      if (result) {
        // Update Home Slice with actual server response
        dispatch(
          updateGuestInHomeData({
            holidayId,
            guestId: editingGuest.id,
            updates: result,
          }),
        );

        setEditingGuest(null);
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Failed to update guest:', error);
      // Revert on error - restore original guest list data
      const originalGuestList = guestLists.find(
        (gl: any) => gl.id === editingGuest.id,
      );
      if (originalGuestList) {
        dispatch(
          updateGuestInHomeData({
            holidayId,
            guestId: editingGuest.id,
            updates: originalGuestList,
          }),
        );
      }
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

      // Manual optimistic update - update Home Slice immediately for UI responsiveness
      dispatch(
        updateGuestInHomeData({
          holidayId,
          guestId,
          updates: {
            ...guestList,
            rsvpStatus: newRsvpStatus,
            isCompleted: newRsvpStatus === 'confirmed',
            updatedAt: new Date().toISOString(),
          },
        }),
      );

      // Then make API call
      try {
        await updateGuest({
          auth0User,
          holidayId,
          guestId,
          isCompleted: newRsvpStatus === 'confirmed',
        }).unwrap();
      } catch (error) {
        console.error('Failed to toggle guest:', error);
        // Revert on error
        dispatch(
          updateGuestInHomeData({
            holidayId,
            guestId,
            updates: guestList,
          }),
        );
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
          rsvp_status: editingGuest?.rsvpStatus || 'pending', // Note: form field is rsvp_status
          notes: editingGuest?.notes || '',
        }}
        onSubmit={handleUpdateGuest}
        onClose={() => {
          setShowEditModal(false);
          setEditingGuest(null);
        }}
        loading={editGuestState.isLoading}
        submitText={editGuestState.isLoading ? 'Processing...' : 'Update Guest'}
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
