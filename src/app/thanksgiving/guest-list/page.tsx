'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useGuestMutations } from '@/hooks/useGuestMutations';

import { fetchContacts, resetContacts } from '@/store/slices/addressBookSlice';
import SortModal from '@/components/modals/SortModal';
import GuestCardItem from '@/components/cards/guest/GuestCardItem';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import RSVPSection from '@/components/common/RSVPSection';
import ReservationsTracker from '@/components/cards/reservation/ReservationsTracker';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import Toast from '@/components/common/Toast';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import { guestsFormConfig, editGuestsFormConfig } from '@/config/formConfigs';
import { getDeleteConfig } from '@/config/deleteModalConfigs';
import { selectGuestListsByHoliday } from '@/store/slices/homeSlice';
import { setHomeData } from '@/store/slices/homeSlice';
import { updateGuestInHomeData } from '@/store/slices/homeSlice';

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

  // Get share members for Enhanced Compatibility Layer
  const shareMembers =
    useAppSelector((state: any) => state.shares.shareMembers) || [];

  // Get contacts from Redux
  const { contacts } = useAppSelector((state: any) => state.addressBook);

  // Enhanced Compatibility Layer - Guest form configuration
  // Use direct form configs instead of getFormConfigEnhanced to ensure all fields are included
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

  // Get guest lists from Redux home data (consistent with other pages)
  // This ensures immediate UI updates when Redux state changes
  const guestLists = holidayData?.guestLists || [];

  // Transform guest list data to match expected format with proper defaults
  const transformedGuests = useMemo(() => {
    const guestsMap = new Map();

    const transformed = guestLists
      .filter((guestList: any) => guestList && guestList.id) // Filter out undefined/null items
      .map((guestList: any) => ({
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
      }))
      .filter((guest: any) => {
        // Ensure unique guests by ID to prevent duplicate keys
        if (guestsMap.has(guest.id)) {
          return false;
        }
        guestsMap.set(guest.id, true);
        return true;
      });

    return transformed;
  }, [guestLists]);

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

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('error');

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
      const updatePayload = {
        name: formValues.name,
        email: formValues.email || undefined,
        phone: formValues.phone || undefined,
        address: formValues.address || undefined,
        rsvpStatus: formValues.rsvpStatus as 'pending' | 'confirmed' | 'declined',
        numberOfGuests: formValues.numberOfGuests || 1, // Ensure numberOfGuests defaults to 1
        notes: formValues.notes || undefined,
      };

      // Find the original guest list item for Home Slice update
      const originalGuestList = guestLists.find(
        (gl: any) => gl.id === editingGuest.id,
      );
      if (originalGuestList) {
        // Manual optimistic update - update Home Slice immediately
        dispatch(
          updateGuestInHomeData({
            holidayId,
            guestId: editingGuest.id,
            updates: {
              ...originalGuestList,
              rsvpStatus: updatePayload.rsvpStatus,
              numberOfGuests: updatePayload.numberOfGuests,
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

      try {
        const result = await editGuest({
          holidayId,
          guestId: editingGuest.id,
          payload: updatePayload,
          auth0User,
        }).unwrap();

        setEditingGuest(null);
        setShowForm(false);
      } catch (error: any) {
        console.error('❌ Failed to update guest:', error);

        // Revert optimistic update on error
        if (originalGuestList) {
          dispatch(
            updateGuestInHomeData({
              holidayId,
              guestId: editingGuest.id,
              updates: originalGuestList, // Revert to original
            }),
          );
        }

        // Check for duplicate email error from guest API (nested array format)
        if (error?.data?.error && Array.isArray(error.data.error)) {
          const duplicateEmailError = error.data.error.find(
            (err: any) =>
              err.message && err.message.includes('already tied to another contact'),
          );
          if (duplicateEmailError) {
            setToastMessage(duplicateEmailError.message);
          } else {
            setToastMessage('Error updating guest. Please try again.');
          }
        }
        // Check for duplicate email error from guest API (direct array format - fallback)
        else if (error?.data && Array.isArray(error.data)) {
          const duplicateEmailError = error.data.find(
            (err: any) =>
              err.message && err.message.includes('already tied to another contact'),
          );
          if (duplicateEmailError) {
            setToastMessage(duplicateEmailError.message);
          } else {
            setToastMessage('Error updating guest. Please try again.');
          }
        }
        // Check for duplicate email error from contacts API (string format)
        else if (
          error?.data &&
          typeof error.data === 'string' &&
          error.data.includes('already tied to another contact')
        ) {
          setToastMessage(error.data);
        } else if (error?.message) {
          setToastMessage(`Error updating guest: ${error.message}`);
        } else {
          setToastMessage('Error updating guest. Please try again.');
        }
        setToastType('error');
        setShowToast(true);
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

        // Reset and refresh contacts to ensure the newly created contact appears in the address book dropdown
        dispatch(resetContacts());
        dispatch(fetchContacts());

        setShowForm(false);
      } catch (error: any) {
        console.error('Failed to create guest:', error);

        // Check for duplicate email error from guest API (nested array format)
        if (error?.data?.error && Array.isArray(error.data.error)) {
          const duplicateEmailError = error.data.error.find(
            (err: any) =>
              err.message && err.message.includes('already tied to another contact'),
          );
          if (duplicateEmailError) {
            setToastMessage(duplicateEmailError.message);
          } else {
            setToastMessage('Error creating guest. Please try again.');
          }
        }
        // Check for duplicate email error from guest API (direct array format - fallback)
        else if (error?.data && Array.isArray(error.data)) {
          const duplicateEmailError = error.data.find(
            (err: any) =>
              err.message && err.message.includes('already tied to another contact'),
          );
          if (duplicateEmailError) {
            setToastMessage(duplicateEmailError.message);
          } else {
            setToastMessage('Error creating guest. Please try again.');
          }
        }
        // Check for duplicate email error from contacts API (string format)
        else if (
          error?.data &&
          typeof error.data === 'string' &&
          error.data.includes('already tied to another contact')
        ) {
          setToastMessage(error.data);
        } else if (error?.message) {
          setToastMessage(`Error creating guest: ${error.message}`);
        } else {
          setToastMessage('Error creating guest. Please try again.');
        }
        setToastType('error');
        setShowToast(true);
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

      try {
        const result = await updateGuest({
          holidayId,
          guestId,
          isCompleted: newRsvpStatus === 'confirmed',
          auth0User,
        }).unwrap();

      } catch (error) {
        console.error('❌ Failed to toggle guest:', error);
        // Revert optimistic update on error
        dispatch(
          updateGuestInHomeData({
            holidayId,
            guestId,
            updates: guestList, // Revert to original
          }),
        );
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

      {/* Toast for error messages */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        type={toastType}
      />
    </div>
  );
}
