'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import { transformGiftPayload } from '@/utils/formTransformers';
import { BudgetDisplay } from '@/components/common/BudgetDisplay';
import SortModal from '@/components/modals/SortModal';
import GiftCardItem from '@/components/cards/gift/GiftCardItem';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import { selectShareByHolidayKey } from '@/store/slices/sharesSlice';

import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';

type SortOption = 'recipient' | 'store' | 'price-high' | 'price-low' | 'none';

export default function GiftListPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

  // Share members for Enhanced Compatibility Layer
  const shareData = useAppSelector((state: any) =>
    selectShareByHolidayKey(state, 'anniversary'),
  );
  const shareMembers = shareData?.members || [];

  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();

  const {
    createGift,
    editGift,
    updateGift,
    deleteGift,
    createLoading,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  const displayGifts = useMemo(() => holidayData?.gifts || [], [holidayData?.gifts]);
  const isLoading = !homeInitialized;
  const error = null;

  // State management - separate add/edit modals
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
  }, [dispatch, homeInitialized]);

  // Enhanced Compatibility Layer form configs
  const addFormConfig = getFormConfigEnhanced('gifts', 'add', {
    holidayKey: 'anniversary',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('gifts', 'edit', {
    holidayKey: 'anniversary',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  // CRUD Operations with proper field validation and loading states
  async function handleAddGift(values: Record<string, any>) {
    if (!values.name?.trim() || !values.recipient?.trim()) return;
    if (!holidayId || !auth0User) return;

    setIsSubmitting(true);
    try {
      const payload = transformGiftPayload(values, contacts, shareMembers);
      await createGift(payload);

      // Refresh address book contacts
      dispatch(fetchContacts());

      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating gift:', error);
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
    if (!holidayId || !auth0User) return;

    try {
      const currentGift = displayGifts.find((gift: any) => gift.id === giftId);
      if (!currentGift) return;

      // ✅ Use simple boolean parameter for completion toggle
      await updateGift(giftId, !currentGift.isCompleted);
    } catch (error) {
      console.error('Error toggling gift:', error);
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
      // ✅ Use editGift for editing fields
      await editGift(selectedGift.id, payload);
      setShowEditModal(false);
      setSelectedGift(null);
    } catch (error) {
      console.error('Error updating gift:', error);
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
  if (isLoading) {
    return (
      <div className="min-h-screen anniversary-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
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
        accentColor: '#ec4899', // Pink for Anniversary
      }}
      borderColor="rgb(var(--color-pink-500))" // Pink border for Anniversary
      gamifiedBackgroundColor="bg-gradient-to-br from-pink-400 to-pink-600"
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
        accentColor: '#ec4899', // Pink for Anniversary
      }}
      borderColor="rgb(var(--color-pink-500))" // Pink border for Anniversary
      gamifiedBackgroundColor="bg-gradient-to-br from-pink-400 to-pink-600"
    />
  );

  return (
    <div className="min-h-screen anniversary-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Anniversary Gift List"
        backHref="/anniversary"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort gifts"
        description="Track your Anniversary gift ideas!"
        holidayColor="pink-500"
        error={error}
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        {/* Budget Display */}
        <BudgetDisplay
          holiday="Anniversary"
          holidayColor="bg-gradient-to-br from-pink-400 to-pink-600"
          holidayId={holidayId || undefined}
        />

        <AddButton title="Gift" onClick={openForm} color="pink" />
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

      {/* Add Form Modal */}
      <FormModal
        isOpen={showAddModal}
        title="Add New Gift"
        fields={addFormConfig.fields}
        initialValues={{}}
        onSubmit={handleAddGift}
        onClose={closeForm}
        loading={isSubmitting}
        submitText={isSubmitting ? 'Processing...' : 'Add Gift'}
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#ec4899"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Edit Form Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Gift"
        fields={editFormConfig.fields}
        initialValues={{
          name: selectedGift?.name || selectedGift?.description || '',
          recipient: selectedGift?.recipient || '',
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
        loading={isEditSubmitting}
        submitText={isEditSubmitting ? 'Processing...' : 'Update Gift'}
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#ec4899"
        contacts={contacts}
        shareMembers={shareMembers}
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
