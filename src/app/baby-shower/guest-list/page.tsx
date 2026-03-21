'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useGuestMutations } from '@/hooks/useGuestMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { selectGuestListsByHoliday } from '@/store/slices/homeSlice';
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
import { getFormConfigEnhanced } from '@/config/formConfigs';

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

  const { refreshHomeData } = useRefreshHomeData();

  // Get guest lists from home data
  const guestLists = useAppSelector(
    holidayId ? selectGuestListsByHoliday(holidayId) : () => [],
  ) as any[];

  // Transform guest list data to match expected format
  const guests = useMemo(
    () =>
      guestLists.map((guestList: any) => ({
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
      })),
    [guestLists],
  );

  const contacts = useAppSelector((state: any) => state.addressBook.contacts);

  // Get share members for Enhanced Compatibility Layer
  const shareData = useAppSelector((state: any) =>
    selectShareByHolidayKey(state, 'baby-shower'),
  );
  const shareMembers = shareData?.members || [];

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
      // Update existing guest
      await editGuest({
        holidayId,
        guestId: editingGuest.id,
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

      await refreshHomeData(auth0User, holidayId);
      setEditingGuest(null);
      setShowForm(false);
    } else {
      // Add new guest
      await createGuest({
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

      await refreshHomeData(auth0User, holidayId);
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

      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
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

  // Enhanced Compatibility Layer form configurations
  const addFormConfig = getFormConfigEnhanced('guests', 'add', {
    holidayKey: 'baby-shower',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('guests', 'edit', {
    holidayKey: 'baby-shower',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

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
