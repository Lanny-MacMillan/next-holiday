'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { selectGuestListsByHoliday } from '@/store/slices/homeSlice';
import {
  updateGuestInHomeData,
  addGuestToHomeData,
  removeGuestFromHomeData,
  setHomeData,
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

export default function ThanksgivingGuestListPage() {
  const dispatch = useAppDispatch();

  // Use centralized holiday page data hook
  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();

  // Use standardized guest mutations hook and its data
  const {
    guests,
    createGuest,
    updateGuest,
    editGuest,
    deleteGuest,
    createGuestState,
    updateGuestState,
    editGuestState,
    deleteGuestState,
    loading: guestsLoading,
    error: guestsError,
  } = useGuestMutations();

  // Use standardized data refresh hook
  const { refreshHomeData } = useRefreshHomeData();

  // Get share members for Enhanced Compatibility Layer
  const shareMembers =
    useAppSelector((state: any) => state.shares.shareMembers) || [];

  // Enhanced Compatibility Layer - Guest form configuration
  const addFormConfig = getFormConfigEnhanced('guests', 'add', {
    holidayKey: 'thanksgiving',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('guests', 'edit', {
    holidayKey: 'thanksgiving',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  // Get guest lists from Redux home data (consistent with other pages)
  // This ensures immediate UI updates when Redux state changes
  const guestLists = holidayData?.guestLists || [];

  // Transform guest list data to match expected format with proper defaults
  const transformedGuests = useMemo(() => {
    return guestLists.map((guestList: any) => ({
      id: guestList.id,
      name: guestList.contact?.name || 'Unknown Guest', // Get name from nested contact object
      email: guestList.contact?.email || undefined,
      phone: guestList.contact?.phone || undefined,
      address: guestList.contact?.streetAddress || undefined,
      rsvpStatus: guestList.rsvpStatus || 'pending',
      numberOfGuests: guestList.numberOfGuests || 1, // Ensure numberOfGuests is never NaN or undefined
      notes: guestList.notes || undefined,
      isCompleted:
        guestList.rsvpStatus === 'confirmed' || guestList.isCompleted || false,
      createdAt: guestList.createdAt,
      updatedAt: guestList.updatedAt,
    }));
  }, [guestLists]);

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

  const handleAddGuest = async (formValues: Record<string, any>) => {
    if (
      !formValues.name ||
      (typeof formValues.name === 'string' && !formValues.name.trim())
    )
      return;

    if (!holidayId || !auth0User) return;

    if (editingGuest) {
      // Update existing guest
      try {
        const result = await editGuest({
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
            numberOfGuests: formValues.numberOfGuests || 1, // Ensure numberOfGuests defaults to 1
            notes: formValues.notes || undefined,
          },
          auth0User,
        }).unwrap();

        // Update Redux state immediately (following pattern from other pages)
        dispatch(
          updateGuestInHomeData({
            holidayId,
            guestId: editingGuest.id,
            updates: result,
          }),
        );

        // Refresh home data to ensure UI is in sync (following pattern from other pages)
        await refreshHomeData(auth0User, holidayId);

        setEditingGuest(null);
        setShowForm(false);
      } catch (error) {
        console.error('Failed to update guest:', error);
      }
    } else {
      // Add new guest
      try {
        const result = await createGuest({
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
            numberOfGuests: formValues.numberOfGuests || 1, // Ensure numberOfGuests defaults to 1
            notes: formValues.notes || undefined,
          },
          auth0User,
        }).unwrap();

        // Update Redux state immediately (following pattern from other pages)
        dispatch(
          addGuestToHomeData({
            holidayId,
            guest: result,
          }),
        );

        // Refresh home data to ensure UI is in sync (following pattern from other pages)
        await refreshHomeData(auth0User, holidayId);

        // Reset and refresh contacts to ensure the newly created contact appears in the address book dropdown
        dispatch(resetContacts());
        dispatch(fetchContacts());

        setShowForm(false);
      } catch (error) {
        console.error('Failed to create guest:', error);
      }
    }
  };

  function openForm() {
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingGuest(null);
  }

  const handleToggleGuest = async (guestId: string) => {
    if (!holidayId || !auth0User) return;

    // Find the original guestList data (not transformed) for the toggle operation
    const guestList = guestLists.find((gl: any) => gl.id === guestId);
    if (guestList) {
      // Toggle RSVP status: if confirmed, set to pending; if pending, set to confirmed
      const newRsvpStatus =
        guestList.rsvpStatus === 'confirmed' ? 'pending' : 'confirmed';

      try {
        await updateGuest({
          holidayId,
          guestId,
          isCompleted: newRsvpStatus === 'confirmed',
          auth0User,
        }).unwrap();

        // Update Redux state immediately with the original structure (not transformed)
        const updatedGuestList = {
          ...guestList,
          rsvpStatus: newRsvpStatus,
          updatedAt: new Date().toISOString(),
        };

        dispatch(
          updateGuestInHomeData({
            holidayId,
            guestId: guestId,
            updates: updatedGuestList,
          }),
        );
      } catch (error) {
        console.error('Failed to toggle guest:', error);
      }
    }
  };

  function handleEditGuest(guest: Guest) {
    setEditingGuest(guest);
    setShowForm(true);
  }

  function handleDeleteGuest(guestId: string) {
    setDeleteConfirm({ show: true, guestId });
  }

  const confirmDelete = async () => {
    if (deleteConfirm.guestId && holidayId && auth0User) {
      try {
        await deleteGuest({
          holidayId,
          guestId: deleteConfirm.guestId,
          auth0User,
        }).unwrap();

        // Update Redux state immediately (following pattern from other pages)
        dispatch(
          removeGuestFromHomeData({
            holidayId,
            guestId: deleteConfirm.guestId,
          }),
        );

        // Refresh home data to ensure UI is in sync (following pattern from other pages)
        await refreshHomeData(auth0User, holidayId);

        setDeleteConfirm({ show: false, guestId: null });
      } catch (error) {
        console.error('Failed to delete guest:', error);
      }
    }
  };

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
      <div className="min-h-screen thanksgiving-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading guests...</p>
        </div>
      </div>
    );
  }

  const sortedGuests = sortGuests(transformedGuests);
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
    <div className="min-h-screen thanksgiving-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Guest List"
        backHref="/thanksgiving"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort guests"
        description="Keep track of your Thanksgiving guests!"
        holidayColor="amber-600"
        error={undefined}
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        <ReservationsTracker
          guests={transformedGuests}
          title="Thanksgiving Guest Tracker"
          accentColor="#f97316"
        />
        <AddButton title="Guest" onClick={openForm} color="amber" />
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
                accentColor: '#f97316', // Orange for Thanksgiving
              }}
              borderColor="rgb(var(--color-orange-500))" // Orange border for Thanksgiving
              holiday="Thanksgiving"
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
                accentColor: '#f97316', // Orange for Thanksgiving
              }}
              borderColor="rgb(var(--color-orange-500))" // Orange border for Thanksgiving
              holiday="Thanksgiving"
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
                accentColor: '#f97316', // Orange for Thanksgiving
              }}
              borderColor="rgb(var(--color-orange-500))" // Orange border for Thanksgiving
              holiday="Thanksgiving"
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
        submitButtonColor="#f97316"
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
          { value: 'date-created', label: 'Date Created' },
        ]}
        title="Sort Guests"
      />
    </div>
  );
}
