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
import { getFormConfig } from '@/config/formConfigs';
import { getDeleteConfig } from '@/config/deleteModalConfigs';
import {
  getFormConfigEnhanced,
  guestsFormConfig,
  editGuestsFormConfig,
} from '@/config/formConfigs';

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

export default function BabyShowerGuestListPage() {
  const dispatch = useAppDispatch();

  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();

  const {
    createGuest,
    updateGuest,
    editGuest,
    deleteGuest,
    createGuestState,
    updateGuestState,
    editGuestState,
    deleteGuestState,
  } = useGuestMutations();

  // Get guest lists from holiday data (matching birthday/thanksgiving pattern)
  const guestLists = useMemo(
    () => holidayData?.guestLists || [],
    [holidayData?.guestLists],
  );

  // Transform guest list data to match expected format
  const guests = useMemo(() => {
    const guestsMap = new Map();

    const transformedGuests = guestLists
      .filter((guestList: any) => guestList && guestList.id)
      .map((guestList: any) => {
        const transformed = {
          id: guestList.id,
          name: guestList.contact?.name || 'Unknown Guest',
          email: guestList.contact?.email || undefined,
          phone: guestList.contact?.phone || undefined,
          address: guestList.contact?.streetAddress || undefined,
          rsvpStatus: guestList.rsvpStatus || 'pending',
          numberOfGuests: guestList.numberOfGuests || 1,
          notes: guestList.notes || undefined,
          isCompleted:
            guestList.rsvpStatus === 'confirmed' || guestList.isCompleted || false,
          createdAt: guestList.createdAt,
          updatedAt: guestList.updatedAt,
        };
        return transformed;
      })
      .filter((guest: any) => {
        // Ensure unique guests by ID to prevent duplicate keys
        if (guestsMap.has(guest.id)) return false;
        guestsMap.set(guest.id, true);
        return true;
      });

    return transformedGuests;
  }, [guestLists]);

  const { contacts } = useAppSelector((state: any) => state.addressBook);

  // Get share members for Enhanced Compatibility Layer
  const shareMembers =
    useAppSelector((state: any) => state.shares.shareMembers) || [];

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
    // Fetch contacts for address book functionality
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
      // Find original guest list data for error reversion
      const originalGuestList = guestLists.find(
        (gl: any) => gl.id === editingGuest.id,
      );
      if (!originalGuestList) return;

      // Prepare update payload (matching form config field names)
      const updatePayload = {
        name: formValues.name,
        email: formValues.email || undefined,
        phone: formValues.phone || undefined,
        address: formValues.address || undefined,
        rsvpStatus: formValues.rsvpStatus as 'pending' | 'confirmed' | 'declined', // Matches form config field id
        notes: formValues.notes || undefined,
      };

      // Manual optimistic update - update Home Slice immediately (like thanksgiving)
      const optimisticUpdate = {
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
      };

      dispatch(
        updateGuestInHomeData({
          holidayId,
          guestId: editingGuest.id,
          updates: optimisticUpdate,
        }),
      );

      // Then make API call
      try {
        const result = await editGuest({
          holidayId,
          guestId: editingGuest.id,
          payload: updatePayload,
          auth0User,
        });

        // Extract the actual guest data from nested response structure
        const actualGuestData = result?.data?.data || result?.data;

        if (actualGuestData) {
          // Update Home Slice with the real server response
          const serverResponseUpdate = {
            ...actualGuestData,
            isCompleted: actualGuestData.rsvpStatus === 'confirmed',
            // Preserve contact structure
            contact: actualGuestData.contact || originalGuestList.contact,
          };

          dispatch(
            updateGuestInHomeData({
              holidayId,
              guestId: editingGuest.id,
              updates: serverResponseUpdate,
            }),
          );
        }
      } catch (error) {
        console.error('❌ Failed to update guest:', error);

        // Revert optimistic update on error
        dispatch(
          updateGuestInHomeData({
            holidayId,
            guestId: editingGuest.id,
            updates: originalGuestList, // Revert to original
          }),
        );
      }

      setEditingGuest(null);
      setShowForm(false);
    } else {
      // Add new guest - createGuest mutation should handle Home Slice updates automatically
      await createGuest({
        holidayId,
        payload: {
          name: formValues.name,
          email: formValues.email || undefined,
          phone: formValues.phone || undefined,
          address: formValues.address || undefined,
          rsvpStatus: formValues.rsvpStatus || 'pending', // Ensure RSVP status is preserved
          numberOfGuests: parseInt(formValues.numberOfGuests) || 1,
          notes: formValues.notes || undefined,
        },
        auth0User,
      }).unwrap();

      // Reset and refresh contacts to ensure the newly created contact appears in the address book dropdown
      dispatch(resetContacts());
      dispatch(fetchContacts());

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
      });
    } catch (error) {
      // Revert on error
      dispatch(updateGuestInHomeData({ holidayId, guestId, updates: guestList }));
      console.error('Error toggling guest:', error);
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
      <div className="min-h-screen baby-shower-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading guests...</p>
        </div>
      </div>
    );
  }

  // Wrap filtered sections in useMemo to ensure proper re-rendering
  const sortedGuests = useMemo(() => {
    return sortGuests(guests);
  }, [guests, sortBy]);

  const pendingGuests = useMemo(() => {
    const filtered = sortedGuests.filter(
      (guest: Guest) => guest.rsvpStatus === 'pending',
    );
    return filtered;
  }, [sortedGuests]);

  const confirmedGuests = useMemo(() => {
    const filtered = sortedGuests.filter(
      (guest: Guest) => guest.rsvpStatus === 'confirmed',
    );
    return filtered;
  }, [sortedGuests]);

  const declinedGuests = useMemo(() => {
    const filtered = sortedGuests.filter(
      (guest: Guest) => guest.rsvpStatus === 'declined',
    );
    return filtered;
  }, [sortedGuests]);

  // Form configurations - use direct imports like working versions
  const addFormConfig = useMemo(
    () => ({
      ...guestsFormConfig,
      contacts: contacts,
      shareMembers: shareMembers,
    }),
    [contacts, shareMembers],
  );

  const editFormConfig = useMemo(
    () => ({
      ...editGuestsFormConfig,
      contacts: contacts,
      shareMembers: shareMembers,
    }),
    [contacts, shareMembers],
  );

  return (
    <div className="min-h-screen baby-shower-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Guest List"
        backHref="/baby-shower"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort guests"
        description="Keep track of your Baby Shower guests!"
        holidayColor="cyan-500"
        error={undefined}
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        <ReservationsTracker
          guests={guests}
          title="Baby Shower Guest Tracker"
          accentColor="#06b6d4"
        />
        <AddButton title="Guest" onClick={openForm} color="cyan" />
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
          borderColor="rgb(var(--color-cyan-500))" // Cyan border for Baby Shower
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
                accentColor: '#06b6d4', // Cyan for Baby Shower
              }}
              borderColor="rgb(var(--color-cyan-500))" // Cyan border for Baby Shower
              holiday="Baby Shower"
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
                accentColor: '#06b6d4', // Cyan for Baby Shower
              }}
              borderColor="rgb(var(--color-cyan-500))" // Cyan border for Baby Shower
              holiday="Baby Shower"
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
                accentColor: '#06b6d4', // Cyan for Baby Shower
              }}
              borderColor="rgb(var(--color-cyan-500))" // Cyan border for Baby Shower
              holiday="Baby Shower"
            />
          )}
        />
      </main>

      {/* Form Modal */}
      <FormModal
        isOpen={showForm}
        title={editingGuest ? 'Edit Guest' : 'Add New Guest'}
        fields={editingGuest ? editFormConfig.fields : addFormConfig.fields}
        initialValues={
          editingGuest
            ? {
                name: editingGuest.name,
                email: editingGuest.email || '',
                phone: editingGuest.phone || '',
                address: editingGuest.address || '',
                rsvpStatus: editingGuest.rsvpStatus, // Matches form config field id
                notes: editingGuest.notes || '',
              }
            : {}
        }
        onSubmit={handleAddGuest}
        onClose={closeForm}
        loading={
          editingGuest ? editGuestState.isLoading : createGuestState.isLoading
        }
        submitText={
          editingGuest
            ? editGuestState.isLoading
              ? 'Processing...'
              : 'Update Guest'
            : createGuestState.isLoading
              ? 'Processing...'
              : 'Add Guest'
        }
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#06b6d4"
        contacts={contacts}
        shareMembers={shareMembers}
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
          { value: 'numberOfGuests', label: 'Number of Guests' },
          { value: 'date-created', label: 'Date Created' },
        ]}
        title="Sort Guests"
      />
    </div>
  );
}
