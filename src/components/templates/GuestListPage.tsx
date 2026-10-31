'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useSharedHoliday } from '@/hooks/useSharedHoliday';
import { useGuestMutations } from '@/hooks/useGuestMutations';
import { updateGuestInHomeData } from '@/store/slices/homeSlice';
import { fetchContacts, resetContacts } from '@/store/slices/addressBookSlice';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import { getDeleteConfig } from '@/config/deleteModalConfigs';
import type { GuestListConfig } from '@/config/guestListConfigs';
import SortModal from '@/components/modals/SortModal';
import GuestCardItem from '@/components/cards/guest/GuestCardItem';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import RSVPSection from '@/components/common/RSVPSection';
import ReservationsTracker from '@/components/cards/reservation/ReservationsTracker';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import Toast from '@/components/common/Toast';

type SortOption = 'name' | 'rsvpStatus' | 'email' | 'none';
type RsvpStatus = 'pending' | 'confirmed' | 'declined';

interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  rsvpStatus: RsvpStatus;
  numberOfGuests: number;
  notes?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

const SORT_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'name', label: 'Name' },
  { value: 'rsvpStatus', label: 'RSVP Status' },
  { value: 'email', label: 'Email' },
];

const STATUS_ORDER: Record<RsvpStatus, number> = {
  pending: 0,
  confirmed: 1,
  declined: 2,
};

const DUPLICATE_EMAIL = 'already tied to another contact';

function sortGuests(guests: Guest[], sortBy: SortOption) {
  switch (sortBy) {
    case 'name':
      return [...guests].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    case 'rsvpStatus':
      return [...guests].sort(
        (a, b) => STATUS_ORDER[a.rsvpStatus] - STATUS_ORDER[b.rsvpStatus],
      );
    case 'email':
      return [...guests].sort((a, b) =>
        (a.email || '').localeCompare(b.email || ''),
      );
    default:
      return guests;
  }
}

// The guest API reports a reused email in a few shapes
function failureMessage(error: any, action: 'creating' | 'updating') {
  const fallback = `Error ${action} guest. Please try again.`;
  const duplicate = (list: any[]) =>
    list.find(item => item?.message?.includes(DUPLICATE_EMAIL))?.message;

  if (Array.isArray(error?.data?.error))
    return duplicate(error.data.error) ?? fallback;
  if (Array.isArray(error?.data)) return duplicate(error.data) ?? fallback;
  if (typeof error?.data === 'string' && error.data.includes(DUPLICATE_EMAIL)) {
    return error.data;
  }
  if (error?.message) return `Error ${action} guest: ${error.message}`;
  return fallback;
}

// One guest list for every holiday that has one; the config supplies names and colours.
export default function GuestListPage({ config }: { config: GuestListConfig }) {
  const { holidayKey, holidayName, accent } = config;
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

  const { holidayId, holidayData, auth0User, homeInitialized } =
    useSharedHoliday(holidayKey);

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

  const guestLists = useMemo(
    () => holidayData?.guestLists || [],
    [holidayData?.guestLists],
  );

  const guests: Guest[] = useMemo(() => {
    const seen = new Set<string>();
    return guestLists
      .filter((guestList: any) => guestList?.id)
      .map((guestList: any) => ({
        id: guestList.id,
        name: guestList.contact?.name || 'Unknown Guest',
        email: guestList.contact?.email || undefined,
        phone: guestList.contact?.phone || undefined,
        address: guestList.contact?.streetAddress || undefined,
        rsvpStatus: guestList.rsvpStatus || 'pending',
        numberOfGuests: 1, // not stored in the schema
        notes: guestList.notes || undefined,
        isCompleted: guestList.rsvpStatus === 'confirmed',
        createdAt: guestList.createdAt,
        updatedAt: guestList.updatedAt,
      }))
      .filter((guest: Guest) => {
        if (seen.has(guest.id)) return false;
        seen.add(guest.id);
        return true;
      });
  }, [guestLists]);

  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [guestToDelete, setGuestToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    if (homeInitialized) dispatch(fetchContacts());
  }, [dispatch, homeInitialized]);

  async function handleAddGuest(values: Record<string, any>) {
    if (!values.name?.trim()) return;
    if (!holidayId || !auth0User) return;

    setIsSubmitting(true);
    try {
      const selectedContact = contacts?.find((c: any) => c.name === values.name);
      await createGuest({
        holidayId,
        payload: {
          name: values.name,
          email: values.email || selectedContact?.email || undefined,
          phone: values.phone || selectedContact?.phone || undefined,
          address: values.address || undefined,
          rsvpStatus: values.rsvp_status ?? values.rsvpStatus ?? 'pending',
          notes: values.notes || undefined,
        },
        auth0User,
      }).unwrap();

      // Reload contacts so the new one appears in the address book picker
      dispatch(resetContacts());
      dispatch(fetchContacts());
      setToast({ message: 'Guest added successfully!', type: 'success' });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating guest:', error);
      setToast({ message: failureMessage(error, 'creating'), type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleGuest(guestId: string) {
    if (!holidayId || !auth0User) return;

    const guestList = guestLists.find((gl: any) => gl.id === guestId);
    if (!guestList) return;

    const rsvpStatus =
      guestList.rsvpStatus === 'confirmed' ? 'pending' : 'confirmed';

    // Show the change straight away, and put it back if the save fails
    dispatch(
      updateGuestInHomeData({
        holidayId,
        guestId,
        updates: {
          ...guestList,
          rsvpStatus,
          isCompleted: rsvpStatus === 'confirmed',
          updatedAt: new Date().toISOString(),
        },
      }),
    );

    try {
      await updateGuest({
        auth0User,
        holidayId,
        guestId,
        isCompleted: rsvpStatus === 'confirmed',
      }).unwrap();
    } catch (error) {
      console.error('Failed to toggle guest:', error);
      dispatch(updateGuestInHomeData({ holidayId, guestId, updates: guestList }));
    }
  }

  async function handleUpdateGuest(values: Record<string, any>) {
    if (!selectedGuest || !holidayId || !auth0User) return;

    const original = guestLists.find((gl: any) => gl.id === selectedGuest.id);
    if (!original) return;

    const payload = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      address: values.address,
      rsvpStatus: values.rsvp_status ?? values.rsvpStatus,
      notes: values.notes,
    };

    setIsEditSubmitting(true);
    dispatch(
      updateGuestInHomeData({
        holidayId,
        guestId: selectedGuest.id,
        updates: {
          ...original,
          rsvpStatus: payload.rsvpStatus,
          isCompleted: payload.rsvpStatus === 'confirmed',
          notes: payload.notes,
          updatedAt: new Date().toISOString(),
          contact: {
            ...original.contact,
            name: payload.name,
            email: payload.email || original.contact?.email,
            phone: payload.phone || original.contact?.phone,
            streetAddress: payload.address || original.contact?.streetAddress,
          },
        },
      }),
    );

    try {
      const result = await editGuest({
        holidayId,
        guestId: selectedGuest.id,
        payload,
        auth0User,
      }).unwrap();

      dispatch(
        updateGuestInHomeData({
          holidayId,
          guestId: selectedGuest.id,
          updates: result,
        }),
      );
      setToast({ message: 'Guest updated successfully!', type: 'success' });
      setSelectedGuest(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update guest:', error);
      dispatch(
        updateGuestInHomeData({
          holidayId,
          guestId: selectedGuest.id,
          updates: original,
        }),
      );
      setToast({ message: failureMessage(error, 'updating'), type: 'error' });
    } finally {
      setIsEditSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!guestToDelete || !holidayId || !auth0User) return;

    try {
      await deleteGuest({ holidayId, guestId: guestToDelete, auth0User }).unwrap();
      setGuestToDelete(null);
    } catch (error) {
      console.error('Failed to delete guest:', error);
    }
  }

  const formFields = (mode: 'add' | 'edit') =>
    getFormConfigEnhanced('guests', mode, {
      holidayKey,
      shareMembers: [],
      auth0User,
    }).fields;

  const sortedGuests = sortGuests(guests, sortBy);
  const byStatus = (status: RsvpStatus) =>
    sortedGuests.filter(guest => guest.rsvpStatus === status);

  const renderGuest = (guest: Guest) => (
    <GuestCardItem
      key={guest.id}
      guest={guest}
      onToggle={handleToggleGuest}
      onEdit={(selected: any) => {
        setSelectedGuest(selected);
        setShowEditModal(true);
      }}
      onDelete={(guestId: string) => setGuestToDelete(guestId)}
      theme={{ accentColor: accent }}
      borderColor={config.border}
      holiday={holidayName}
    />
  );

  const sections: { title: string; status: RsvpStatus; empty: string }[] = [
    { title: 'Pending', status: 'pending', empty: 'No pending RSVPs yet.' },
    { title: 'Confirmed', status: 'confirmed', empty: 'No confirmed RSVPs yet.' },
    { title: 'Declined', status: 'declined', empty: 'No declined RSVPs yet.' },
  ];

  if (!homeInitialized) {
    return (
      <div
        className={`min-h-screen ${config.gradientClass} flex items-center justify-center`}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderBottomColor: accent }}
          ></div>
          <p className="text-gray-600 dark:text-gray-300">Loading guests...</p>
        </div>
      </div>
    );
  }

  const cardClassName = config.cardClassName || 'card';

  return (
    <div
      className={`min-h-screen ${config.gradientClass} flex flex-col items-center p-4 sm:p-8 font-sans`}
    >
      <HolidayPageHeader
        title={config.title}
        backHref={`/${holidayKey}`}
        onSortClick={() => setShowSortModal(true)}
        description={config.description}
        holidayColor={config.headerColor}
        error={undefined}
        sortTitle="Sort Guests"
      />

      <main className="w-full max-w-4xl flex flex-col gap-6">
        <ReservationsTracker
          guests={guests}
          title={`${holidayName} Guest Tracker`}
          accentColor={accent}
        />

        <AddButton
          title="Guest"
          onClick={() => {
            setShowAddModal(true);
            setSelectedGuest(null);
          }}
          color={config.addButton}
        />

        {sortBy !== 'none' && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Sorted by {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
          </div>
        )}

        {sections.map(section => (
          <RSVPSection
            key={section.status}
            title={section.title}
            items={byStatus(section.status)}
            rsvpStatus={section.status}
            emptyMessage={section.empty}
            renderItem={renderGuest}
          />
        ))}
      </main>

      <FormModal
        isOpen={showAddModal}
        title="Add New Guest"
        fields={formFields('add')}
        onSubmit={handleAddGuest}
        onClose={() => {
          setShowAddModal(false);
          setSelectedGuest(null);
        }}
        loading={isSubmitting || createGuestState.isLoading}
        submitText={isSubmitting ? 'Processing...' : 'Add Guest'}
        cardClassName={cardClassName}
        submitButtonColor={accent}
        contacts={contacts}
      />

      <FormModal
        isOpen={showEditModal}
        title="Edit Guest"
        fields={formFields('edit')}
        initialValues={
          selectedGuest
            ? {
                name: selectedGuest.name || '',
                email: selectedGuest.email || '',
                phone: selectedGuest.phone || '',
                address: selectedGuest.address || '',
                rsvp_status: selectedGuest.rsvpStatus || 'pending',
                notes: selectedGuest.notes || '',
              }
            : {}
        }
        onSubmit={handleUpdateGuest}
        onClose={() => {
          setShowEditModal(false);
          setSelectedGuest(null);
        }}
        loading={isEditSubmitting || editGuestState.isLoading}
        submitText={isEditSubmitting ? 'Processing...' : 'Update Guest'}
        cardClassName={cardClassName}
        submitButtonColor={accent}
        contacts={contacts}
      />

      <DeleteModal
        isOpen={guestToDelete !== null}
        {...getDeleteConfig('guests')}
        onConfirm={confirmDelete}
        onCancel={() => setGuestToDelete(null)}
        loading={deleteGuestState.isLoading || updateGuestState.isLoading}
      />

      <SortModal
        isOpen={showSortModal}
        onClose={() => setShowSortModal(false)}
        sortBy={sortBy}
        onSortChange={(sortOption: string) => setSortBy(sortOption as SortOption)}
        sortOptions={SORT_OPTIONS}
        title="Sort Guests"
      />

      <Toast
        message={toast?.message ?? ''}
        isVisible={!!toast}
        onClose={() => setToast(null)}
        type={toast?.type}
      />
    </div>
  );
}
