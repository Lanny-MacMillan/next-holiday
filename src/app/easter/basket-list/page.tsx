'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { transformGiftPayload } from '@/utils/formTransformers';
import { BudgetDisplay } from '@/components/common/BudgetDisplay';
import SortModal from '@/components/modals/SortModal';
import GiftCardItem from '@/components/cards/gift/GiftCardItem';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';

import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';

type SortOption = 'recipient' | 'store' | 'price-high' | 'price-low' | 'none';

export default function EasterBasketListPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);
  const shareMembers = useAppSelector(
    (state: any) =>
      state.shares.shares?.find((share: any) => share.holidayId === 'easter')
        ?.members || [],
  );

  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();

  const {
    createGift,
    updateGift,
    deleteGift,
    createLoading,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  const { refreshHomeData } = useRefreshHomeData();

  // Use only Redux data - no GET API calls on holiday pages

  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [giftToDelete, setGiftToDelete] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Get home data to check if contacts are available (already declared above)

  useEffect(() => {
    // Fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  async function handleAddGift(values: Record<string, any>) {
    if (!values.name?.trim() || !values.recipient?.trim()) return;
    if (!holidayId) return;

    setIsSubmitting(true);
    try {
      const payload = transformGiftPayload(values, contacts, shareMembers);
      await createGift(payload);

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

  // Enhanced Compatibility Layer for form configuration
  const addFormConfig = getFormConfigEnhanced('gifts', 'add', {
    holidayKey: 'easter',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('gifts', 'edit', {
    holidayKey: 'easter',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  function openForm() {
    setShowAddModal(true);
    setSelectedGift(null);
  }

  function closeForm() {
    setShowAddModal(false);
    setShowEditModal(false);
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

      await updateGift(giftId, {
        isCompleted: newIsCompleted,
      });

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
      const payload = transformGiftPayload(values, contacts, shareMembers);
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
      <div className="min-h-screen easter-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading basket items...</p>
        </div>
      </div>
    );
  }

  // Use only Redux data - no fallback to API calls
  const displayGifts =
    holidayData && homeInitialized && holidayData.gifts ? holidayData.gifts : [];

  const sortedGifts = sortGifts(displayGifts || []);
  const incompleteGifts = sortedGifts.filter((gift: any) => !gift.isCompleted);
  const completedGifts = sortedGifts.filter((gift: any) => gift.isCompleted);

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
        accentColor: '#a855f7', // Purple for Easter
      }}
      borderColor="rgb(var(--color-purple-500))" // Purple border for Easter
      gamifiedBackgroundColor="bg-gradient-to-br from-purple-300 to-purple-500"
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
        accentColor: '#a855f7', // Purple for Easter
      }}
      borderColor="rgb(var(--color-purple-500))" // Purple border for Easter
      gamifiedBackgroundColor="bg-gradient-to-br from-purple-300 to-purple-500"
    />
  );

  // Initial values for editing
  const getInitialValues = () => {
    if (!selectedGift) return {};

    return {
      recipient: selectedGift.recipient || '',
      giftName: selectedGift.name,
      description: selectedGift.description || '',
      price: selectedGift.price.toString(),
      store: selectedGift.store || '',
      product_link: selectedGift.productLink || '',
      notes: selectedGift.notes || '',
    };
  };

  return (
    <div className="min-h-screen easter-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Easter Basket"
        backHref="/easter"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort basket items"
        description="Keep track of Easter basket items and purchases!"
        holidayColor="purple-500"
        error={undefined}
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        {/* Budget Display */}
        <BudgetDisplay
          holiday="Easter"
          holidayColor="bg-gradient-to-br from-purple-300 to-purple-500"
          holidayId={holidayId || undefined}
        />

        <AddButton title="Basket Item" onClick={openForm} color="purple" />
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
          emptyMessage="All basket items completed! 🎉"
          completedMessage=""
          renderItem={renderGiftItem}
        />

        <TaskSection
          title="Completed"
          items={completedGifts}
          isCompleted={true}
          emptyMessage="No completed basket items yet."
          completedMessage=""
          renderItem={renderCompletedGiftItem}
        />
      </main>

      {/* Add Modal */}
      <FormModal
        isOpen={showAddModal}
        title="Add New Basket Item"
        fields={addFormConfig.fields}
        onSubmit={handleAddGift}
        onClose={closeForm}
        loading={isSubmitting}
        submitText={isSubmitting ? 'Processing...' : 'Add Item'}
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#a855f7"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Basket Item"
        fields={editFormConfig.fields}
        initialValues={{
          name: selectedGift?.name || '',
          recipient: selectedGift?.recipient || '',
          description: selectedGift?.description || '',
          price: selectedGift?.price?.toString() || '',
          store: selectedGift?.store || '',
          product_link: selectedGift?.productLink || '',
          notes: selectedGift?.notes || '',
        }}
        onSubmit={handleUpdateGift}
        onClose={closeForm}
        loading={isEditSubmitting}
        submitText={isEditSubmitting ? 'Processing...' : 'Update Item'}
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#a855f7"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        title="Delete Basket Item"
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
        title="Sort Basket Items"
      />
    </div>
  );
}
