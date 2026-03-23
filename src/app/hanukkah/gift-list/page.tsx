'use client';

import { useState, useEffect, useMemo } from 'react';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { useSubscription } from '@/hooks/useSubscription';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState } from '@/store';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { transformGiftPayload } from '@/utils/formTransformers';
import { BudgetDisplay } from '@/components/common/BudgetDisplay';
import SortModal from '@/components/modals/SortModal';
import GiftCardItem from '@/components/cards/gift/GiftCardItem';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';

type SortOption = 'recipient' | 'store' | 'price-high' | 'price-low' | 'none';

export default function HanukkahGiftListPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);
  const { isUserPlusMember, hasSubscription } = useSubscription();

  // Use centralized holiday page data hook
  const { holidayId, holidayData, homeInitialized, auth0User } =
    useHolidayPageData();

  // Use standardized mutation hooks
  const {
    createGift,
    updateGift,
    deleteGift,
    createLoading,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  // Use standardized data refresh hook
  const { refreshHomeData } = useRefreshHomeData();

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'hanukkah'),
  );
  const isAuthorizedForSharing = hasSubscription && isUserPlusMember;

  // Get share members for Enhanced Compatibility Layer
  const shareData = useAppSelector((state: RootState) =>
    selectShareByHolidayKey(state, 'hanukkah'),
  );
  const baseMembers = shareData?.members || [];

  // Let Enhanced Compatibility Layer handle shareMembers enhancement automatically
  const shareMembers = baseMembers;

  // Use Redux data instead of RTK Query
  const gifts = useMemo(() => holidayData?.gifts || [], [holidayData?.gifts]);
  const loading = !homeInitialized;
  const error = null;
  const initialized = homeInitialized;

  // Local state for UI
  const [sortBy, setSortBy] = useState('recipient');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  async function handleAddGift(values: Record<string, any>) {
    if (!values.name?.trim() || !values.recipient?.trim()) return;
    if (!holidayId || !auth0User) return;

    try {
      const payload = transformGiftPayload(values, contacts, shareMembers);
      console.log('Add gift payload:', payload);

      // Use the standardized hook function
      const result = await createGift(payload);
      console.log('Add gift result:', result);

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
    }
  }

  function openAddModal() {
    setSelectedGift(null);
    setShowAddModal(true);
  }

  function closeAddModal() {
    setShowAddModal(false);
    setSelectedGift(null);
  }

  function closeEditModal() {
    setShowEditModal(false);
    setSelectedGift(null);
  }

  async function handleToggleGift(giftId: string) {
    if (!holidayId || !auth0User) return;

    try {
      // Find the current gift to get its completion status
      const currentGift = gifts.find((gift: any) => gift.id === giftId);
      if (!currentGift) return;

      // Toggle the completion status
      const newIsCompleted = !currentGift.isCompleted;

      // Use the standardized hook function
      await updateGift(giftId, { isCompleted: newIsCompleted });

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Error toggling gift:', error);
    }
  }

  async function handleDeleteGift(giftId: string) {
    // Find the full gift object by ID
    const giftToDelete = gifts.find((g: any) => g.id === giftId);
    if (!giftToDelete) {
      console.error('Gift not found for deletion:', giftId);
      return;
    }

    setSelectedGift(giftToDelete);
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!selectedGift || !holidayId || !auth0User) return;

    try {
      // Use the standardized hook function
      await deleteGift(selectedGift.id);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowDeleteModal(false);
      setSelectedGift(null);
    } catch (error) {
      console.error('Error deleting gift:', error);
    }
  }

  function cancelDelete() {
    setShowDeleteModal(false);
    setSelectedGift(null);
  }

  async function handleEditGift(gift: any) {
    setSelectedGift(gift);
    setShowEditModal(true);
  }

  async function handleUpdateGift(values: Record<string, any>) {
    if (!selectedGift || !holidayId || !auth0User) return;

    try {
      const payload = transformGiftPayload(values, contacts, shareMembers);

      // Use the standardized hook function
      await updateGift(selectedGift.id, payload);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowEditModal(false);
      setSelectedGift(null);
    } catch (error) {
      console.error('Error updating gift:', error);
    }
  }

  function sortGifts(giftsToSort: any[]): any[] {
    switch (sortBy) {
      case 'recipient':
        return [...giftsToSort].sort((a, b) =>
          (a.recipient || '').localeCompare(b.recipient || ''),
        );
      case 'store':
        return [...giftsToSort].sort((a, b) =>
          (a.store || '').localeCompare(b.store || ''),
        );
      case 'price-high':
        return [...giftsToSort].sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'price-low':
        return [...giftsToSort].sort((a, b) => (a.price || 0) - (b.price || 0));
      default:
        return giftsToSort;
    }
  }

  const sortedGifts = sortGifts(gifts);
  const incompleteGifts = sortedGifts.filter((gift: any) => !gift.isCompleted);
  const completedGifts = sortedGifts.filter((gift: any) => gift.isCompleted);

  return (
    <div className="min-h-screen hanukkah-gifts-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Hanukkah Gift List"
        backHref="/hanukkah"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort gifts"
        description="Track your Hanukkah gift ideas!"
        holidayColor="blue-500"
        error={error ? 'API Error' : undefined}
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        {/* Budget Display */}
        <BudgetDisplay holiday="Hanukkah" />

        <AddButton title="Gift" onClick={openAddModal} color="blue" />
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
          emptyMessage="All gifts completed! 🕯️"
          completedMessage=""
          renderItem={(gift: any) => (
            <GiftCardItem
              key={gift.id}
              gift={gift}
              isCompleted={false}
              onToggle={handleToggleGift}
              onEdit={handleEditGift}
              onDelete={handleDeleteGift}
              loading={loading || !!updateLoading}
              theme={{
                accentColor: '#3b82f6', // Blue for Hanukkah
              }}
              borderColor="rgb(var(--color-blue-500))" // Blue border for Hanukkah
              gamifiedBackgroundColor="bg-gradient-to-br from-blue-400 to-blue-600"
            />
          )}
        />

        <TaskSection
          title="Completed"
          items={completedGifts}
          isCompleted={true}
          emptyMessage="No completed gifts yet."
          completedMessage="No completed gifts yet."
          renderItem={(gift: any) => (
            <GiftCardItem
              key={gift.id}
              gift={gift}
              isCompleted={true}
              onToggle={handleToggleGift}
              onEdit={handleEditGift}
              onDelete={handleDeleteGift}
              loading={loading || !!updateLoading}
              theme={{
                accentColor: '#3b82f6', // Blue for Hanukkah
              }}
              borderColor="rgb(var(--color-blue-500))" // Blue border for Hanukkah
              gamifiedBackgroundColor="bg-gradient-to-br from-blue-400 to-blue-600"
            />
          )}
        />
      </main>

      {/* Form Modal */}
      <FormModal
        isOpen={showAddModal}
        onClose={closeAddModal}
        title="Add New Gift"
        fields={
          getFormConfigEnhanced('gifts', 'add', {
            holidayKey: 'hanukkah',
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        initialValues={{}}
        onSubmit={handleAddGift}
        loading={createLoading}
        submitText={createLoading ? 'Adding...' : 'Add Gift'}
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#2563eb"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Edit Gift Modal */}
      <FormModal
        isOpen={showEditModal}
        onClose={closeEditModal}
        title="Edit Gift"
        fields={
          getFormConfigEnhanced('gifts', 'edit', {
            holidayKey: 'hanukkah',
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        initialValues={
          selectedGift
            ? {
                recipient: selectedGift?.contact?.name || '',
                name: selectedGift?.name || '',
                description: selectedGift?.description || '',
                price: selectedGift?.price || '',
                store: selectedGift?.store || '',
                productLink: selectedGift?.productLink || '',
                assigned_to: selectedGift?.assignedTo || '',
                notes: selectedGift?.notes || '',
              }
            : undefined
        }
        onSubmit={handleUpdateGift}
        loading={updateLoading}
        submitText={updateLoading ? 'Updating...' : 'Update Gift'}
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#2563eb"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        title="Confirm Delete"
        message="Are you sure you want to delete this gift? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
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
