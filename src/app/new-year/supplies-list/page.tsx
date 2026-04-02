'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState } from '@/store';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useSubscription } from '@/hooks/useSubscription';
import Toast from '@/components/common/Toast';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { transformSuppliesPayload } from '@/utils/formTransformers';
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

export default function NewYearSuppliesListPage() {
  const dispatch = useAppDispatch();
  const { isUserPlusMember, hasSubscription } = useSubscription();

  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();

  const {
    createGift,
    updateGift, // For completion toggling
    editGift, // For field editing
    deleteGift,
    createLoading,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  const isHolidayShared = useAppSelector((state: any) =>
    state.shares ? state.shares.shareMembers?.length > 0 : false,
  );
  const isAuthorizedForSharing = hasSubscription && isUserPlusMember;

  // Get share members for Enhanced Compatibility Layer
  const shareData = useAppSelector((state: RootState) =>
    selectShareByHolidayKey(state, 'new-year'),
  );
  const baseMembers = shareData?.members || [];

  // Always include current user in shareMembers for assignTo functionality
  const shareMembers = auth0User
    ? [
        // Add current user first
        {
          userId: auth0User.sub || '',
          uuid: auth0User.id || '', // Database UUID for Enhanced Compatibility Layer
          name: auth0User.name || 'Me',
          email: auth0User.email || '',
          role: 'owner' as const,
        },
        // Add other members, filtering out current user if already present
        ...baseMembers
          .filter((member: any) => member.userId !== auth0User.sub)
          .map((member: any) => ({
            ...member,
            uuid: member.uuid || member.userId, // Prefer existing uuid field, fallback to userId only if uuid missing
          })),
      ]
    : baseMembers;

  // State management
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [giftToDelete, setGiftToDelete] = useState<any>(null);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('error');

  async function handleAddGift(values: Record<string, any>) {
    // Only name is required
    if (!values.name?.trim()) {
      setToastMessage('Please fill in the Item Name field');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      const payload = transformSuppliesPayload(values, shareMembers);

      const result = await createGift(payload);

      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating supply:', error);
      setToastMessage('Error creating supply. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
  }

  function openForm() {
    setShowAddModal(true);
    setSelectedGift(null);
  }

  async function handleToggleGift(giftId: string) {
    try {
      // Find the current gift to get its completion status from Redux data
      const currentGift = displayGifts.find((gift: any) => gift.id === giftId);
      if (!currentGift) return;

      // Toggle the completion status
      const newIsCompleted = !currentGift.isCompleted;

      // Update the gift using the hook with correct parameter structure
      await updateGift(giftId, newIsCompleted);
    } catch (error) {
      console.error('Error toggling gift:', error);
      setToastMessage('Error updating item. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
  }

  async function handleDeleteGift(gift: any) {
    setGiftToDelete(gift);
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!giftToDelete) return;

    try {
      // Delete using the hook
      await deleteGift(giftToDelete.id);

      setShowDeleteModal(false);
      setGiftToDelete(null);
    } catch (error) {
      console.error('Error deleting gift:', error);
      setToastMessage('Error deleting item. Please try again.');
      setToastType('error');
      setShowToast(true);
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
    if (!selectedGift) return;

    try {
      const payload = transformSuppliesPayload(values, shareMembers);

      // Update using the editGift hook for field updates
      const result = await editGift(selectedGift.id, payload);

      setShowEditModal(false);
      setSelectedGift(null);
    } catch (error) {
      console.error('Error updating supply:', error);
      setToastMessage('Error updating supply. Please try again.');
      setToastType('error');
      setShowToast(true);
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

  // Use only Redux data - no fallback to API calls
  const displayGifts =
    holidayData && homeInitialized && holidayData.gifts ? holidayData.gifts : [];

  const sortedGifts = sortGifts(displayGifts || []);
  const incompleteGifts = sortedGifts.filter((gift: any) => !gift.isCompleted);
  const completedGifts = sortedGifts.filter((gift: any) => gift.isCompleted);

  const renderGiftItem = (gift: any) => (
    <GiftCardItem
      gift={gift}
      isCompleted={false}
      onToggle={handleToggleGift}
      onEdit={handleEditGift}
      onDelete={(giftId: string) => handleDeleteGift(gift)}
      loading={updateLoading}
      theme={{
        accentColor: '#f59e0b', // Amber for New Year
      }}
      borderColor="rgb(var(--color-amber-500))" // Amber border for New Year
      gamifiedBackgroundColor="bg-gradient-to-br from-yellow-400 to-yellow-600"
    />
  );

  const renderCompletedGiftItem = (gift: any) => (
    <GiftCardItem
      gift={gift}
      isCompleted={true}
      onToggle={handleToggleGift}
      onEdit={handleEditGift}
      onDelete={(giftId: string) => handleDeleteGift(gift)}
      loading={updateLoading}
      theme={{
        accentColor: '#f59e0b', // Amber for New Year
      }}
      borderColor="rgb(var(--color-amber-500))" // Amber border for New Year
      gamifiedBackgroundColor="bg-gradient-to-br from-yellow-400 to-yellow-600"
    />
  );

  return (
    <div className="min-h-screen new-year-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Supply List"
        backHref="/new-year"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort supplies"
        description="Track your New Year supply ideas!"
        holidayColor="amber-500"
        error={undefined}
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        {/* Budget Display */}
        <BudgetDisplay
          holiday="New Year"
          holidayColor="bg-gradient-to-br from-yellow-400 to-yellow-600"
          holidayId={holidayId || undefined}
        />

        <AddButton
          title="Supply"
          onClick={() => setShowAddModal(true)}
          color="amber"
        />
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
          emptyMessage="All supplies completed! 🎉"
          completedMessage=""
          renderItem={renderGiftItem}
        />

        <TaskSection
          title="Completed"
          items={completedGifts}
          isCompleted={true}
          emptyMessage="No completed supplies yet."
          completedMessage=""
          renderItem={renderCompletedGiftItem}
        />
      </main>

      {/* Add Supply Modal */}
      <FormModal
        isOpen={showAddModal}
        title="Add New Supply"
        fields={
          getFormConfigEnhanced('supplies', 'add', {
            holidayKey: 'new-year' as any,
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        initialValues={{}}
        onSubmit={handleAddGift}
        onClose={() => setShowAddModal(false)}
        loading={createLoading}
        submitText={createLoading ? 'Adding...' : 'Add Supply'}
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#f59e0b"
        shareMembers={shareMembers}
      />

      {/* Edit Supply Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Supply"
        fields={
          getFormConfigEnhanced('supplies', 'edit', {
            holidayKey: 'new-year' as any,
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        initialValues={{
          name: selectedGift?.name || '',
          description: selectedGift?.description || '',
          price: selectedGift?.price ? selectedGift.price.toString() : '',
          store: selectedGift?.store || '',
          product_link: selectedGift?.productLink || '',
          assigned_to: selectedGift?.assignedTo || '',
          notes: selectedGift?.notes || '',
        }}
        onSubmit={handleUpdateGift}
        onClose={() => {
          setShowEditModal(false);
          setSelectedGift(null);
        }}
        loading={updateLoading}
        submitText={updateLoading ? 'Updating...' : 'Update Supply'}
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#f59e0b"
        shareMembers={shareMembers}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        title="Delete Supply"
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
        title="Sort Supplies"
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
