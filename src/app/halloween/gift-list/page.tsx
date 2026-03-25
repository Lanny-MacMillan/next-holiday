'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  updateGiftInHomeData,
  addGiftToHomeData,
  removeGiftFromHomeData,
  setHomeData,
} from '@/store/slices/homeSlice';
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
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';

type SortOption = 'recipient' | 'store' | 'price-high' | 'price-low' | 'none';

export default function HalloweenGiftListPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

  // Add shareMembers selector for Enhanced Compatibility Layer
  const shareMembers =
    useAppSelector((state: any) => selectShareByHolidayKey(state, 'halloween'))
      ?.members || [];

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

  // Data filtering using holidayData from the hook
  const gifts = useMemo(() => holidayData?.gifts || [], [holidayData?.gifts]);
  const isLoading = !homeInitialized;
  const error = null;

  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingGift, setEditingGift] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    giftId: string | null;
  }>({
    show: false,
    giftId: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // CRUD Operations - Add Gift with optimistic updates + refreshHomeData
  const handleAddGift = async (values: any) => {
    if (!values.name?.trim() || !values.recipient?.trim()) return;
    if (!holidayId || !auth0User) return;

    setIsSubmitting(true);
    try {
      // Use standardized payload transformation with proper contact lookup
      const payload = transformGiftPayload(values, contacts, shareMembers);

      const result = await createGift({ ...payload, isPurchased: false });

      // Update Redux state immediately
      dispatch(addGiftToHomeData({ holidayId, gift: result }));

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      // Refresh address book contacts
      dispatch(fetchContacts());

      setShowForm(false);
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
  };

  const handleTogglePurchased = async (giftId: string) => {
    const currentGift = gifts.find((gift: any) => gift.id === giftId);
    if (!currentGift || !holidayId) return;

    const newCompletedStatus = !currentGift.isCompleted;

    try {
      // Update API with isCompleted field (not isPurchased)
      await updateGift(giftId, {
        isCompleted: newCompletedStatus,
      });

      // Update Redux state immediately
      dispatch(
        updateGiftInHomeData({
          holidayId,
          giftId,
          updates: {
            ...currentGift,
            isCompleted: newCompletedStatus,
          },
        }),
      );

      // Refresh home data to update budget calculations
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Error toggling gift:', error);
    }
  };

  const handleEditGift = (gift: any) => {
    setEditingGift(gift);
    setShowEditModal(true);
  };

  const handleEditGiftSubmit = async (values: any) => {
    if (!editingGift || !holidayId) return;

    setIsEditSubmitting(true);
    try {
      // Use standardized payload transformation with proper contact lookup
      const updates = transformGiftPayload(values, contacts, shareMembers);

      await updateGift(editingGift.id, updates);

      // Update Redux state immediately
      dispatch(
        updateGiftInHomeData({
          holidayId,
          giftId: editingGift.id,
          updates,
        }),
      );

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setEditingGift(null);
      setShowEditModal(false);
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
  };

  const handleDelete = async (giftId: string) => {
    if (!holidayId) return;

    try {
      await deleteGift(giftId);

      // Update Redux state immediately
      dispatch(
        removeGiftFromHomeData({
          holidayId,
          giftId,
        }),
      );

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Error deleting gift:', error);
    }
  };

  function handleDeleteClick(giftId: string) {
    setDeleteConfirm({ show: true, giftId });
  }

  async function confirmDelete() {
    if (deleteConfirm.giftId) {
      await handleDelete(deleteConfirm.giftId);
      setDeleteConfirm({ show: false, giftId: null });
    }
  }

  function cancelDelete() {
    setDeleteConfirm({ show: false, giftId: null });
  }

  function openForm() {
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditingGift(null);
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

  if (isLoading) {
    return (
      <div className="min-h-screen halloween-tasks-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
        <div className="w-full max-w-4xl flex flex-col gap-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  const sortedGifts = sortGifts(gifts);
  const pendingGifts = sortedGifts.filter((gift: any) => !gift.isCompleted);
  const purchasedGifts = sortedGifts.filter((gift: any) => gift.isCompleted);

  const totalBudget = gifts.reduce(
    (sum: number, gift: any) => sum + (gift.price || 0),
    0,
  );
  const spentAmount = purchasedGifts.reduce(
    (sum: number, gift: any) => sum + (gift.price || 0),
    0,
  );

  const renderGiftItem = (gift: any) => (
    <GiftCardItem
      key={gift.id}
      gift={gift}
      isCompleted={false}
      onToggle={handleTogglePurchased}
      onDelete={handleDeleteClick}
      onEdit={handleEditGift}
      theme={{
        accentColor: '#f97316', // Orange for Halloween
      }}
      borderColor="rgb(249 115 22)" // Orange border for Halloween
      gamifiedBackgroundColor="bg-gradient-to-br from-orange-400 to-orange-600"
    />
  );

  const renderCompletedGiftItem = (gift: any) => (
    <GiftCardItem
      key={gift.id}
      gift={gift}
      isCompleted={true}
      onToggle={handleTogglePurchased}
      onDelete={handleDeleteClick}
      onEdit={handleEditGift}
      theme={{
        accentColor: '#f97316', // Orange for Halloween
      }}
      borderColor="rgb(249 115 22)" // Orange border for Halloween
      gamifiedBackgroundColor="bg-gradient-to-br from-orange-400 to-orange-600"
    />
  );

  return (
    <div className="min-h-screen halloween-tasks-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Gift List"
        backHref="/halloween"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort gifts"
        description="Track Halloween gifts and treats!"
        holidayColor="orange-500"
        error={undefined}
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        <BudgetDisplay
          holiday="Halloween"
          holidayColor="bg-gradient-to-br from-orange-400 to-orange-600"
          holidayId={holidayId || undefined}
        />

        <AddButton title="Gift" onClick={openForm} color="orange" />
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
          title="Pending Gifts"
          items={pendingGifts}
          isCompleted={false}
          emptyMessage="No gifts planned yet."
          completedMessage="All gifts purchased!"
          renderItem={renderGiftItem}
        />

        <TaskSection
          title="Purchased Gifts"
          items={purchasedGifts}
          isCompleted={true}
          emptyMessage="No purchased gifts yet."
          completedMessage=""
          renderItem={renderCompletedGiftItem}
        />
      </main>

      {/* Form Modal */}
      <FormModal
        isOpen={showForm}
        title="Add New Gift"
        fields={
          getFormConfigEnhanced('gifts', 'add', {
            holidayKey: 'halloween',
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        initialValues={{}}
        onSubmit={handleAddGift}
        onClose={closeForm}
        loading={isSubmitting}
        submitText={isSubmitting ? 'Processing...' : 'Add Gift'}
        cardClassName="card"
        submitButtonColor="#f97316"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Gift"
        fields={
          getFormConfigEnhanced('gifts', 'edit', {
            holidayKey: 'halloween',
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        initialValues={{
          name: editingGift?.name || editingGift?.description || '',
          recipient: editingGift?.recipient || '',
          description: editingGift?.description || '',
          price: editingGift?.price ? editingGift.price.toString() : '',
          store: editingGift?.store || '',
          product_link: editingGift?.productLink || '',
          assigned_to: editingGift?.assignedTo || '',
          notes: editingGift?.notes || '',
        }}
        onSubmit={handleEditGiftSubmit}
        onClose={closeEditModal}
        loading={isEditSubmitting}
        submitText={isEditSubmitting ? 'Processing...' : 'Update Gift'}
        cardClassName="card"
        submitButtonColor="#f97316"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteConfirm.show}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Confirm Delete"
        message="Are you sure you want to delete this gift? This action cannot be undone."
        cardClassName="bg-white rounded-lg shadow-lg"
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="#ef4444"
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
          { value: 'price-high', label: 'Price (High to Low)' },
          { value: 'price-low', label: 'Price (Low to High)' },
        ]}
        title="Sort Gifts"
      />
    </div>
  );
}
