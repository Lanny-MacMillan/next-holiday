'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import { transformGiftPayload } from '@/utils/formTransformers';
import { BudgetDisplay } from '@/components/common/BudgetDisplay';
import SortModal from '@/components/modals/SortModal';
import GiftCardItem from '@/components/cards/gift/GiftCardItem';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { RootState } from '@/store';

import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';

type SortOption = 'recipient' | 'store' | 'price-high' | 'price-low' | 'none';

export default function BirthdayGiftListPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

  const { auth0User, holidayId, holidayData, homeInitialized } =
    useHolidayPageData();

  // Redux & Sharing - Enhanced Compatibility Layer
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'birthday'),
  );

  const shareData = useAppSelector((state: RootState) =>
    selectShareByHolidayKey(state, 'birthday'),
  );
  const baseMembers = shareData?.members || [];

  // Only include current user in shareMembers if holiday is actually shared
  const shareMembers =
    isHolidayShared && auth0User
      ? [
          // Add current user first
          {
            userId: auth0User.sub || '',
            uuid: auth0User.id || '', // Use database UUID for Enhanced Compatibility Layer
            name: auth0User.name || 'Me',
            email: auth0User.email || '',
            role: 'owner' as const,
          },
          // Add other members, filtering out current user if already present
          ...baseMembers
            .filter((member: any) => member.userId !== auth0User.sub)
            .map((member: any) => ({
              ...member,
              uuid: member.uuid || member.userId, // Prefer existing uuid, fallback to userId only if uuid missing
            })),
        ]
      : baseMembers;

  // Memoize shareMembers to prevent unnecessary re-renders
  const memoizedShareMembers = useMemo(() => shareMembers || [], [shareMembers]);

  // Helper function to resolve assignedTo UUID to user name
  const getAssignedUserName = (assignedToUuid: string): string | null => {
    if (!assignedToUuid || !memoizedShareMembers.length) return null;
    const member = memoizedShareMembers.find((m: any) => m.uuid === assignedToUuid);
    return member ? member.name || member.email || 'Unknown User' : assignedToUuid;
  };

  // Transform gifts to include assignedToName for display
  const transformGiftWithAssignment = (gift: any) => ({
    ...gift,
    assignedToName: gift.assignedTo ? getAssignedUserName(gift.assignedTo) : null,
  });

  const {
    createGift,
    updateGift,
    deleteGift,
    createLoading,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  const { refreshHomeData } = useRefreshHomeData();

  // Get gifts from holiday data with assignment names
  const gifts = useMemo(
    () => (holidayData?.gifts || []).map(transformGiftWithAssignment),
    [holidayData?.gifts, memoizedShareMembers],
  );

  const isLoading = !homeInitialized;

  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [giftToDelete, setGiftToDelete] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  useEffect(() => {
    // Fetch contacts for address book functionality
    // Only fetch if home data is initialized (which contains contacts)
    if (homeInitialized) {
      dispatch(fetchContacts());
    }
  }, [homeInitialized]);

  // Load contacts if holiday is shared for assignment functionality
  useEffect(() => {
    if (isHolidayShared && auth0User) {
      dispatch(fetchContacts(auth0User.sub));
    }
  }, [isHolidayShared, auth0User]);

  async function handleAddGift(values: Record<string, any>) {
    if (!values.name?.trim() || !values.recipient?.trim()) return;
    if (!holidayId) return;

    setIsSubmitting(true);
    try {
      const payload = transformGiftPayload(values, contacts, memoizedShareMembers);
      const result = await createGift(payload);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating gift:', error);
      // Show user-friendly error message
      if (error instanceof Error && error.message.includes('address book')) {
        alert('Please select a recipient from the address book');
      } else {
        alert('Error creating gift. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function openForm() {
    setShowAddModal(true);
    setSelectedGift(null);
  }

  function closeForm() {
    setShowAddModal(false);
    setSelectedGift(null);
  }

  async function handleToggleGift(giftId: string) {
    if (!holidayId) return;

    try {
      // Find the current gift to get its completion status from Redux data
      const currentGift = displayGifts.find((gift: any) => gift.id === giftId);
      if (!currentGift || !auth0User) return;

      // Toggle the completion status
      const newIsCompleted = !currentGift.isCompleted;

      await updateGift(giftId, { isCompleted: newIsCompleted });

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Error toggling gift:', error);
      // Handle error (could show a toast notification)
    }
  }

  async function handleDeleteGift(gift: any) {
    setGiftToDelete(gift);
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!giftToDelete || !holidayId || !auth0User) return;

    try {
      await deleteGift(giftToDelete.id);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowDeleteModal(false);
      setGiftToDelete(null);
    } catch (error) {
      console.error('Error deleting gift:', error);
    }
  }

  function cancelDelete() {
    setShowDeleteModal(false);
    setGiftToDelete(null);
  }

  async function handleEditGift(gift: any) {
    setSelectedGift(gift);
    setShowEditModal(true);
  }

  async function handleUpdateGift(values: Record<string, any>) {
    if (!selectedGift || !holidayId || !auth0User) return;

    setIsEditSubmitting(true);
    try {
      const payload = transformGiftPayload(values, contacts, memoizedShareMembers);
      await updateGift(selectedGift.id, payload);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowEditModal(false);
      setSelectedGift(null);
    } catch (error) {
      console.error('Error updating gift:', error);
      // Show user-friendly error message
      if (error instanceof Error && error.message.includes('address book')) {
        alert('Please select a recipient from the address book');
      } else {
        alert('Error updating gift. Please try again.');
      }
    } finally {
      setIsEditSubmitting(false);
    }
  }

  function sortGifts(giftsToSort: any[]): any[] {
    switch (sortBy) {
      case 'recipient':
        return [...giftsToSort].sort((a, b) =>
          a.recipient.localeCompare(b.recipient),
        );
      case 'store':
        return [...giftsToSort].sort((a, b) =>
          (a.store || '').localeCompare(b.store || ''),
        );
      case 'price-high':
        return [...giftsToSort].sort((a, b) => b.price - a.price);
      case 'price-low':
        return [...giftsToSort].sort((a, b) => a.price - b.price);
      default:
        return giftsToSort;
    }
  }

  // Show loading only if home data is not initialized
  if (!homeInitialized) {
    return (
      <div className="min-h-screen birthday-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading gifts...</p>
        </div>
      </div>
    );
  }

  // Use gifts from hook and apply sorting
  const displayGifts = sortGifts(gifts);

  const incompleteGifts = displayGifts.filter((gift: any) => !gift.isCompleted);
  const completedGifts = displayGifts.filter((gift: any) => gift.isCompleted);

  const renderGiftItem = (gift: any) => (
    <GiftCardItem
      key={gift.id}
      gift={gift}
      isCompleted={false}
      onToggle={handleToggleGift}
      onEdit={handleEditGift}
      onDelete={(giftId: string) => handleDeleteGift(gift)}
      loading={updateLoading}
      theme={{
        accentColor: '#f59e0b', // Amber for Birthday
      }}
      borderColor="rgb(var(--color-yellow-500))" // Yellow border for Birthday
      gamifiedBackgroundColor="bg-gradient-to-br from-yellow-300 to-yellow-500"
    />
  );

  const renderCompletedGiftItem = (gift: any) => (
    <GiftCardItem
      key={gift.id}
      gift={gift}
      isCompleted={true}
      onToggle={handleToggleGift}
      onEdit={handleEditGift}
      onDelete={(giftId: string) => handleDeleteGift(gift)}
      loading={updateLoading}
      theme={{
        accentColor: '#f59e0b', // Amber for Birthday
      }}
      borderColor="rgb(var(--color-yellow-500))" // Yellow border for Birthday
      gamifiedBackgroundColor="bg-gradient-to-br from-yellow-300 to-yellow-500"
    />
  );

  // Enhanced Compatibility Layer form config
  const formConfig = getFormConfigEnhanced('gifts', 'add', {
    holidayKey: 'birthday',
    shareMembers: memoizedShareMembers,
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('gifts', 'edit', {
    holidayKey: 'birthday',
    shareMembers: memoizedShareMembers,
    auth0User: auth0User,
  });

  // Initial values for editing with Enhanced Compatibility Layer field names
  const getInitialValues = () => {
    if (!selectedGift) return {};

    // Find the contact that matches this gift's recipient
    const matchingContact = contacts.find(
      (contact: any) => contact.name === selectedGift.recipient,
    );

    return {
      recipient: matchingContact ? selectedGift.recipient : '',
      name: selectedGift.name || selectedGift.description || '',
      description: selectedGift.description || '',
      price: selectedGift.price ? selectedGift.price.toString() : '',
      store: selectedGift.store || '',
      product_link: selectedGift.productLink || '',
      assigned_to: selectedGift.assignedTo || '',
      notes: selectedGift.notes || '',
    };
  };

  return (
    <div className="min-h-screen birthday-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Birthday Gift List"
        backHref="/birthday"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort gifts"
        description="Track your Birthday gift ideas!"
        holidayColor="yellow-500"
        error={undefined}
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        {/* Budget Display */}
        <BudgetDisplay
          holiday="Birthday"
          holidayColor="bg-gradient-to-br from-yellow-300 to-yellow-500"
          holidayId={holidayId || undefined}
        />

        <AddButton title="Gift" onClick={openForm} color="yellow" />
        <div className="flex items-center justify-center">
          {sortBy !== 'none' && (
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              {sortBy === 'recipient' && 'Sorted by Recipient'}
              {sortBy === 'store' && 'Sorted by Store'}
              {sortBy === 'price-high' && 'Sorted by Price (High to Low)'}
              {sortBy === 'price-low' && 'Sorted by Price (Low to High)'}
            </div>
          )}
        </div>

        <TaskSection
          title="Incomplete"
          items={incompleteGifts}
          isCompleted={false}
          emptyMessage="All gifts completed! 🎉"
          completedMessage=""
          renderItem={renderGiftItem}
        />

        <TaskSection
          title="Completed"
          items={completedGifts}
          isCompleted={true}
          emptyMessage="No completed gifts yet."
          completedMessage=""
          renderItem={renderCompletedGiftItem}
        />
      </main>

      {/* Add Modal */}
      <FormModal
        isOpen={showAddModal}
        title="Add New Gift"
        fields={formConfig.fields}
        onSubmit={handleAddGift}
        onClose={closeForm}
        loading={isSubmitting}
        submitText={isSubmitting ? 'Processing...' : 'Add Gift'}
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#3b82f6"
        contacts={contacts}
        shareMembers={memoizedShareMembers}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Gift"
        fields={editFormConfig.fields}
        initialValues={getInitialValues()}
        onSubmit={handleUpdateGift}
        onClose={() => {
          setShowEditModal(false);
          setSelectedGift(null);
        }}
        loading={isEditSubmitting}
        submitText={isEditSubmitting ? 'Processing...' : 'Update Gift'}
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#3b82f6"
        contacts={contacts}
        shareMembers={memoizedShareMembers}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        title="Delete Gift"
        message={`Are you sure you want to delete "${giftToDelete?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={deleteLoading}
      />

      {/* Sort Modal */}
      <SortModal
        isOpen={showSortModal}
        onClose={() => setShowSortModal(false)}
        sortBy={sortBy}
        onSortChange={(sortOption: string) => setSortBy(sortOption as SortOption)}
        sortOptions={[
          { value: 'none', label: 'None' },
          { value: 'recipient', label: 'Recipient' },
          { value: 'store', label: 'Store' },
          { value: 'price-high', label: 'Price: High to Low' },
          { value: 'price-low', label: 'Price: Low to High' },
        ]}
        title="Sort Gifts"
      />
    </div>
  );
}
