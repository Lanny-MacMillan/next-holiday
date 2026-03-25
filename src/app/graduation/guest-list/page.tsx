'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useGuestMutations } from '@/hooks/useGuestMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import {
  updateGuestInHomeData,
  addGuestToHomeData,
  removeGuestFromHomeData,
} from '@/store/slices/homeSlice';
import { fetchContacts, resetContacts } from '@/store/slices/addressBookSlice';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import { getDeleteConfig } from '@/config/deleteModalConfigs';
import { selectGuestListsByHoliday } from '@/store/slices/homeSlice';
import SortModal from '@/components/modals/SortModal';
import GuestCardItem from '@/components/cards/guest/GuestCardItem';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import RSVPSection from '@/components/common/RSVPSection';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import TaskSection from '@/components/common/TaskSection';

type SortOption = 'name' | 'rsvpStatus' | 'email' | 'none';

interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  rsvpStatus: 'pending' | 'confirmed' | 'declined';
  numberOfGuests: number;
  notes?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function GraduationGuestListPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'graduation'),
  );

  // Get share members for Enhanced Compatibility Layer
  const shareData = useAppSelector((state: any) =>
    selectShareByHolidayKey(state, 'graduation'),
  );
  const shareMembers = shareData?.members || [];

  // Use new standardized hooks
  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();

  const {
    holidayId: guestHolidayId,
    auth0User: guestAuth0User,
    guests,
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

  // Get guest lists from holiday data
  const guestLists = useMemo(
    () => holidayData?.guestLists || [],
    [holidayData?.guestLists],
  );

  // Transform guest list data to match expected format - using guests from hook
  // const guests = useMemo(() =>
  //   guestLists.map((guestList: any) => ({
  //     id: guestList.id,
  //     name: guestList.contact?.name || 'Unknown',
  //     email: guestList.contact?.email || undefined,
  //     phone: guestList.contact?.phone || undefined,
  //     address: guestList.contact?.streetAddress || undefined,
  //     rsvpStatus: guestList.rsvpStatus || 'pending',
  //     numberOfGuests: 1, // Default to 1 since this isn't stored in the current schema
  //     notes: guestList.notes || undefined,
  //     isCompleted: guestList.rsvpStatus === 'confirmed',
  //     createdAt: guestList.createdAt,
  //     updatedAt: guestList.updatedAt,
  //   }))
  // , [guestLists]);

  const isLoading = !homeInitialized;

  // State management
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    guestId: string | null;
  }>({
    show: false,
    guestId: null,
  });
  useEffect(() => {
    // Fetch contacts for address book functionality
    if (homeInitialized) {
      dispatch(fetchContacts());
    }
  }, [dispatch, homeInitialized]);

  // CRUD Operations using guest mutations hook
  const handleAddGuest = async (values: Record<string, any>) => {
    if (!values.name?.trim()) return;
    if (!holidayId) return;

    setIsSubmitting(true);
    try {
      const selectedContact = contacts?.find((c: any) => c.name === values.name);

      await createGuest({
        holidayId,
        payload: {
          name: values.name,
          email: values.email || selectedContact?.email,
          phone: values.phone || selectedContact?.phone,
          rsvpStatus: values.rsvpStatus || 'pending',
          notes: values.notes,
          contactId: selectedContact?.id,
        },
        auth0User,
      });
      await refreshHomeData(auth0User, holidayId);

      // Reset and refresh contacts to ensure the newly created contact appears in the address book dropdown
      dispatch(resetContacts());
      dispatch(fetchContacts());

      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating guest:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleRSVP = async (guestId: string) => {
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

      try {
        await updateGuest({
          holidayId,
          guestId,
          isCompleted: newRsvpStatus === 'confirmed',
          auth0User,
        });

        // Refresh home data to ensure UI is in sync
        await refreshHomeData(auth0User, holidayId);
      } catch (error) {
        console.error('Error updating guest RSVP:', error);
      }
    }
  };

  const handleEditGuest = async (values: Record<string, any>) => {
    if (!selectedGuest || !holidayId || !auth0User) return;

    setIsEditSubmitting(true);
    try {
      await updateGuest({
        holidayId,
        guestId: selectedGuest.id,
        isCompleted: values.rsvpStatus === 'confirmed',
        auth0User,
      });
      await refreshHomeData(auth0User, holidayId);
      setShowEditModal(false);
      setSelectedGuest(null);
    } catch (error) {
      console.error('Error updating guest:', error);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirm.guestId && holidayId && auth0User) {
      try {
        await deleteGuest({
          holidayId,
          guestId: deleteConfirm.guestId,
          auth0User,
        });

        // Refresh data after successful deletion
        await refreshHomeData(auth0User, holidayId);
      } catch (error) {
        console.error('Failed to delete guest:', error);
      }

      setDeleteConfirm({ show: false, guestId: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, guestId: null });
  };

  // Helper functions
  const openForm = () => {
    setShowAddModal(true);
    setSelectedGuest(null);
  };

  const closeAddForm = () => {
    setShowAddModal(false);
    setSelectedGuest(null);
  };

  const closeEditForm = () => {
    setShowEditModal(false);
    setSelectedGuest(null);
  };

  const handleDeleteGuest = (guestId: string) => {
    setDeleteConfirm({ show: true, guestId });
  };

  const handleEditGuestOpen = (guest: any) => {
    setSelectedGuest(guest);
    setShowEditModal(true);
  };

  // Loading state from hooks
  const loading =
    createGuestState.isLoading ||
    updateGuestState.isLoading ||
    deleteGuestState.isLoading;

  function sortGuests(guestsToSort: Guest[]): Guest[] {
    switch (sortBy) {
      case 'name':
        return [...guestsToSort].sort((a, b) =>
          (a.name || '').localeCompare(b.name || ''),
        );
      case 'rsvpStatus':
        const statusOrder = { pending: 0, confirmed: 1, declined: 2 };
        return [...guestsToSort].sort(
          (a, b) => statusOrder[a.rsvpStatus] - statusOrder[b.rsvpStatus],
        );
      case 'email':
        return [...guestsToSort].sort((a, b) =>
          (a.email || '').localeCompare(b.email || ''),
        );
      default:
        return guestsToSort;
    }
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

  const renderGuestItem = (guest: Guest) => (
    <GuestCardItem
      key={guest.id}
      guest={guest}
      onToggle={handleToggleRSVP}
      onEdit={handleEditGuestOpen}
      onDelete={handleDeleteGuest}
      holiday="graduation"
    />
  );

  // Enhanced Compatibility Layer form config (using guest-list type)
  const formConfig = getFormConfigEnhanced('guests', 'add', {
    holidayKey: 'graduation',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('guests', 'edit', {
    holidayKey: 'graduation',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  // Helper function for edit initial values
  const getEditInitialValues = (guest: any) => {
    if (!guest) return {};

    return {
      name: guest.name || '',
      email: guest.email || '',
      phone: guest.phone || '',
      rsvpStatus: guest.rsvpStatus || 'pending',
      notes: guest.notes || '',
    };
  };

  return (
    <div className="min-h-screen graduation-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Graduation Guest List"
        backHref="/graduation"
        onSortClick={() => setShowSortModal(true)}
        description="Manage your graduation celebration guest list!"
        holidayColor="purple-500"
        error={undefined}
        sortTitle="Sort Guests"
      />
      <AddButton title="Guest" onClick={openForm} color="purple" />

      <main className="w-full max-w-4xl flex flex-col gap-6">
        <RSVPSection
          title="Pending"
          items={pendingGuests}
          rsvpStatus="pending"
          emptyMessage="No pending RSVPs yet."
          renderItem={(guest: Guest) => (
            <GuestCardItem
              key={guest.id}
              guest={guest}
              onToggle={handleToggleRSVP}
              onEdit={handleEditGuestOpen}
              onDelete={handleDeleteGuest}
              holiday="graduation"
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
              onToggle={handleToggleRSVP}
              onEdit={handleEditGuestOpen}
              onDelete={handleDeleteGuest}
              holiday="graduation"
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
              onToggle={handleToggleRSVP}
              onEdit={handleEditGuestOpen}
              onDelete={handleDeleteGuest}
              holiday="graduation"
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
        onClose={closeAddForm}
        loading={isSubmitting}
        submitText={isSubmitting ? 'Processing...' : 'Add Guest'}
        cardClassName="card-guests-graduation"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Guest"
        fields={editFormConfig.fields}
        initialValues={getEditInitialValues(selectedGuest)}
        onSubmit={handleEditGuest}
        onClose={closeEditForm}
        loading={isEditSubmitting}
        submitText={isEditSubmitting ? 'Processing...' : 'Update Guest'}
        cardClassName="card-guests-graduation"
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
        onSortChange={(sortOption: string) => setSortBy(sortOption as SortOption)}
        sortOptions={[
          { value: 'none', label: 'None' },
          { value: 'name', label: 'Name' },
          { value: 'rsvpStatus', label: 'RSVP Status' },
          { value: 'email', label: 'Email' },
        ]}
        title="Sort Guests"
      />
    </div>
  );
}
