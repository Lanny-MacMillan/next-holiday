'use client';

import { useState, useEffect, useMemo } from 'react';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import Toast from '@/components/common/Toast';
import { setHomeData } from '@/store/slices/homeSlice';
import { transformSuppliesPayload } from '@/utils/formTransformers';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { RootState } from '@/store';
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

export default function ThanksgivingShoppingListPage() {
  const dispatch = useAppDispatch();

  // Use centralized holiday page data hook
  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();

  // Redux & Sharing - Enhanced Compatibility Layer
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'thanksgiving'),
  );

  const shareData = useAppSelector((state: RootState) =>
    selectShareByHolidayKey(state, 'thanksgiving'),
  );
  const baseMembers = shareData?.members || [];

  // Only include current user in shareMembers if holiday is actually shared
  const shareMembers =
    isHolidayShared && auth0User
      ? [
          // Add current user first
          {
            userId: auth0User.sub || '',
            uuid: auth0User.id || '',
            name: auth0User.name || 'Me',
            email: auth0User.email || '',
            role: 'owner' as const,
          },
          ...baseMembers
            .filter((member: any) => member.userId !== auth0User.sub)
            .map((member: any) => ({
              ...member,
              uuid: member.uuid || member.userId,
            })),
        ]
      : baseMembers;

  // Enhanced Compatibility Layer - Gift form configuration (without holidayKey restriction)
  const addFormConfig = getFormConfigEnhanced('supplies', 'add', {
    holidayKey: 'thanksgiving',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('supplies', 'edit', {
    holidayKey: 'thanksgiving',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  // Use standardized mutation hooks for gifts
  const {
    createGift,
    editGift,
    updateGift,
    deleteGift,
    createLoading,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  // Use only Redux data - no GET API calls on holiday pages
  const displayGifts = useMemo(
    () =>
      holidayData && homeInitialized && holidayData.gifts ? holidayData.gifts : [],
    [holidayData, homeInitialized],
  );

  // Local state management
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [giftToDelete, setGiftToDelete] = useState<any>(null);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('error');

  const handleAddGift = async (values: Record<string, any>) => {
    if (!values.name?.trim()) {
      setToastMessage('Please fill in the Item Name field');
      setToastType('error');
      setShowToast(true);
      return;
    }
    if (!holidayId) return;

    try {
      const payload = transformSuppliesPayload(values, shareMembers);
      const result = await createGift(payload);

      setShowFormModal(false);
    } catch (error) {
      console.error('Error creating supply item:', error);
      setToastMessage('Error creating supply item. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
  };

  function openForm() {
    setShowFormModal(true);
    setSelectedGift(null);
  }

  function closeForm() {
    setShowFormModal(false);
    setSelectedGift(null);
  }

  const handleToggleGift = async (giftId: string) => {
    if (!holidayId) return;

    try {
      // Find the current gift to get its completion status from Redux data
      const currentGift = displayGifts.find((gift: any) => gift.id === giftId);
      if (!currentGift) return;

      // Toggle the completion status
      const newIsCompleted = !currentGift.isCompleted;

      // Update the gift using hook
      await updateGift(giftId, newIsCompleted);
    } catch (error) {
      console.error('Error toggling gift:', error);
      setToastMessage('Error updating item. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
  };

  async function handleDeleteGift(gift: any) {
    setGiftToDelete(gift);
    setShowDeleteModal(true);
  }

  const confirmDelete = async () => {
    if (!giftToDelete || !holidayId) return;

    try {
      // Delete gift using hook
      await deleteGift(giftToDelete.id);

      setShowDeleteModal(false);
      setGiftToDelete(null);
    } catch (error) {
      console.error('Error deleting gift:', error);
      setToastMessage('Error deleting item. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
  };

  function cancelDelete() {
    setShowDeleteModal(false);
    setGiftToDelete(null);
  }

  async function handleEditGift(gift: any) {
    setSelectedGift(gift);
    setShowFormModal(true);
  }

  const handleUpdateGift = async (values: Record<string, any>) => {
    if (!selectedGift || !holidayId) return;

    try {
      const payload = transformSuppliesPayload(values, shareMembers);
      // Update gift using hook
      const result = await editGift(selectedGift.id, payload);

      setShowFormModal(false);
      setSelectedGift(null);
    } catch (error) {
      console.error('Error updating supply item:', error);
      setToastMessage('Error updating supply item. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
  };

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
      <div className="min-h-screen thanksgiving-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading gifts...</p>
        </div>
      </div>
    );
  }

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
        accentColor: '#d97706', // Amber for Thanksgiving
      }}
      borderColor="rgb(var(--color-amber-500))" // Amber border for Thanksgiving
      gamifiedBackgroundColor="bg-gradient-to-br from-amber-400 to-amber-600"
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
        accentColor: '#d97706', // Amber for Thanksgiving
      }}
      borderColor="rgb(var(--color-amber-500))" // Amber border for Thanksgiving
      gamifiedBackgroundColor="bg-gradient-to-br from-amber-400 to-amber-600"
    />
  );

  // Get initial values for edit modal (Enhanced Compatibility pattern)
  const getInitialValues = () => {
    if (!selectedGift) return {};
    return {
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
    <div className="min-h-screen thanksgiving-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="🛒 Shopping List"
        backHref="/thanksgiving"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort shopping items"
        description="Keep track of your Thanksgiving shopping items!"
        holidayColor="amber-500"
        error={undefined}
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        {/* Budget Display */}
        <BudgetDisplay
          holiday="Thanksgiving"
          holidayColor="bg-gradient-to-br from-amber-400 to-amber-600"
          holidayId={holidayId || undefined}
        />

        <AddButton title="Item" onClick={openForm} color="amber" />
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

      {/* Form Modal */}
      <FormModal
        isOpen={showFormModal}
        title={selectedGift ? 'Edit Item' : 'Add New Item'}
        fields={selectedGift ? editFormConfig.fields : addFormConfig.fields}
        initialValues={getInitialValues()}
        onSubmit={selectedGift ? handleUpdateGift : handleAddGift}
        onClose={closeForm}
        loading={selectedGift ? updateLoading : createLoading}
        submitText={
          selectedGift
            ? updateLoading
              ? 'Processing...'
              : 'Update Item'
            : createLoading
              ? 'Processing...'
              : 'Add Item'
        }
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#d97706"
        shareMembers={shareMembers}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        title="Delete Item"
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
