'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { fetchContacts, resetContacts } from '@/store/slices/addressBookSlice';
import { updateGuestInHomeData } from '@/store/slices/homeSlice';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
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
  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'fourth-of-july'),
  );
  const shareData = useAppSelector((state: any) =>
    selectShareByHolidayKey(state, 'fourth-of-july'),
  );
  const shareMembers = shareData?.members || [];
  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();

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
      // Find the original guest list entry to preserve other data
      const originalGuestList = guestLists.find(
        (gl: any) => gl.id === editingGuest.id,
      );

      if (originalGuestList) {
        // Manual optimistic update - update Home Slice immediately
        const updatePayload = {
          name: formValues.name,
          email: formValues.email || undefined,
          phone: formValues.phone || undefined,
          address: formValues.address || undefined,
          rsvpStatus: formValues.rsvp_status as 'pending' | 'confirmed' | 'declined',
          notes: formValues.notes || undefined,
        };

        dispatch(
          updateGuestInHomeData({
            holidayId,
            guestId: editingGuest.id,
            updates: {
              ...originalGuestList,
              rsvpStatus: updatePayload.rsvpStatus,
              notes: updatePayload.notes,
              isCompleted: updatePayload.rsvpStatus === 'confirmed',
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
            },
          }),
        );
      }

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
            rsvpStatus: formValues.rsvp_status as
              | 'pending'
              | 'confirmed'
              | 'declined',
            notes: formValues.notes || undefined,
          },
          auth0User,
        }).unwrap();
      } catch (error) {
        console.error('Failed to update guest:', error);
        // Revert on error by refreshing data
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

        // Reset and refresh contacts to ensure the newly created contact appears in the address book dropdown
        dispatch(resetContacts());
        dispatch(fetchContacts());
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

    const guestList = guestLists.find((gl: any) => gl.id === guestId);
    if (!guestList) return;

    const newRsvpStatus =
      guestList.rsvpStatus === 'confirmed' ? 'pending' : 'confirmed';

    // Manual optimistic update - update Home Slice immediately
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
        holidayId,
        guestId,
        isCompleted: newRsvpStatus === 'confirmed',
        auth0User,
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

  function handleEditGuest(guest: Guest) {
    setEditingGuest(guest);
    setShowForm(true);
  }

  function handleDeleteGuest(guestId: string) {
    setDeleteConfirm({ show: true, guestId });
  }

  async function confirmDelete() {
    if (deleteConfirm.guestId && holidayId && auth0User) {
      await deleteGuest({
        holidayId,
        guestId: deleteConfirm.guestId,
        auth0User,
      }).unwrap();

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
        fields={
          getFormConfigEnhanced('guests', editingGuest ? 'edit' : 'add', {
            holidayKey: 'fourth-of-july',
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        initialValues={
          editingGuest
            ? {
                name: editingGuest.name,
                email: editingGuest.email || '',
                phone: editingGuest.phone || '',
                address: editingGuest.address || '',
                rsvp_status: editingGuest.rsvpStatus || 'pending',
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
