'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import { getDeleteConfig } from '@/config/deleteModalConfigs';
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

export default function GraduationGiftListPage() {
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
    createGift,
    updateGift,
    deleteGift,
    createLoading,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  const { refreshHomeData } = useRefreshHomeData();

  // Filter gifts from holiday data (exclude cards)
  const gifts = useMemo(
    () => holidayData?.gifts?.filter((gift: any) => gift.category !== 'Cards') || [],
    [holidayData?.gifts],
  );

  const isLoading = !homeInitialized;

  // State management
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    giftId: string | null;
  }>({
    show: false,
    giftId: null,
  });

  useEffect(() => {
    // Fetch contacts for address book functionality
    if (homeInitialized) {
      dispatch(fetchContacts());
    }
  }, [dispatch, homeInitialized]);

  // CRUD Operations using new hooks
  const handleAddGift = async (values: Record<string, any>) => {
    if (!values.name?.trim() || !values.recipient?.trim()) return; // Enhanced Compatibility Layer uses 'name'
    if (!holidayId) return;

    setIsSubmitting(true);
    try {
      const payload = transformGiftPayload(values, contacts, shareMembers);
      await createGift({
        ...payload,
        assigned_to: values.assigned_to || undefined, // Snake case for API
      });
      await refreshHomeData(auth0User, holidayId);
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
  };

  const handleToggleGift = async (giftId: string) => {
    const currentGift = gifts.find((gift: any) => gift.id === giftId);
    if (!currentGift || !holidayId) return;

    const newIsCompleted = !currentGift.isCompleted;

    try {
      await updateGift(giftId, {
        isCompleted: newIsCompleted,
      });

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Error toggling gift:', error);
    }
  };

  const handleEditGift = async (values: Record<string, any>) => {
    if (!selectedGift || !holidayId) return;

    setIsEditSubmitting(true);
    try {
      const payload = transformGiftPayload(values, contacts, shareMembers);
      await updateGift(selectedGift.id, {
        ...payload,
        assigned_to: values.assigned_to || null, // Snake case for API
      });
      await refreshHomeData(auth0User, holidayId);
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
  };

  const confirmDelete = async () => {
    if (deleteConfirm.giftId && holidayId && auth0User) {
      try {
        await deleteGift(deleteConfirm.giftId);

        // Refresh data after successful deletion
        await refreshHomeData(auth0User, holidayId);
      } catch (error) {
        console.error('Failed to delete gift:', error);
      }

      setDeleteConfirm({ show: false, giftId: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, giftId: null });
  };

  // Helper functions
  const openForm = () => {
    setShowAddModal(true);
    setSelectedGift(null);
  };

  const closeAddForm = () => {
    setShowAddModal(false);
    setSelectedGift(null);
  };

  const closeEditForm = () => {
    setShowEditModal(false);
    setSelectedGift(null);
  };

  const handleDeleteGift = (giftId: string) => {
    setDeleteConfirm({ show: true, giftId });
  };

  const handleEditGiftOpen = (gift: any) => {
    setSelectedGift(gift);
    setShowEditModal(true);
  };

  // Loading state from hooks
  const loading = createLoading || updateLoading || deleteLoading;

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

  const sortedGifts = sortGifts(gifts || []);
  const incompleteGifts = sortedGifts.filter((gift: any) => !gift.isCompleted);
  const completedGifts = sortedGifts.filter((gift: any) => gift.isCompleted);

  // Calculate total budget information
  const totalBudget = gifts.reduce(
    (sum: number, gift: any) => sum + (gift.price || 0),
    0,
  );
  const remainingBudget = gifts
    .filter((gift: any) => !gift.isCompleted)
    .reduce((sum: number, gift: any) => sum + (gift.price || 0), 0);

  const renderGiftItem = (gift: any) => (
    <GiftCardItem
      key={gift.id}
      gift={gift}
      onToggle={handleToggleGift}
      onEdit={handleEditGiftOpen}
      onDelete={handleDeleteGift}
    />
  );

  // Enhanced Compatibility Layer form config
  const formConfig = getFormConfigEnhanced('gifts', 'add', {
    holidayKey: 'graduation',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('gifts', 'edit', {
    holidayKey: 'graduation',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  // Helper function for edit initial values
  const getEditInitialValues = (gift: any) => {
    if (!gift) return {};

    return {
      name: gift.name || gift.description || '',
      recipient: gift.recipient || '',
      description: gift.description || '',
      price: gift.price ? gift.price.toString() : '',
      store: gift.store || '',
      product_link: gift.productLink || '',
      assigned_to: gift.assignedTo || '', // API field → Form field
      notes: gift.notes || '',
    };
  };

  return (
    <div className="min-h-screen graduation-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Graduation Gift List"
        backHref="/graduation"
        onSortClick={() => setShowSortModal(true)}
        description="Track graduation gifts for your loved ones!"
        holidayColor="purple-500"
        error={undefined}
        sortTitle="Sort Gifts"
      />

      <main className="w-full max-w-4xl flex flex-col gap-6">
        {/* Budget Display */}
        <BudgetDisplay
          holiday="Graduation"
          holidayColor="bg-gradient-to-br from-purple-300 to-purple-500"
          holidayId={holidayId || undefined}
        />

        <AddButton title="Gift" onClick={openForm} color="purple" />

        {/* Gift List */}
        <div className="space-y-6">
          <TaskSection
            title="Gifts to Buy"
            items={incompleteGifts}
            isCompleted={false}
            emptyMessage="No gifts to buy."
            completedMessage="All gifts purchased!"
            renderItem={renderGiftItem}
          />

          <TaskSection
            title="Purchased Gifts"
            items={completedGifts}
            isCompleted={true}
            emptyMessage="No gifts purchased yet."
            completedMessage="No purchased gifts to display."
            renderItem={renderGiftItem}
          />
        </div>
      </main>

      {/* Add Modal */}
      <FormModal
        isOpen={showAddModal}
        title="Add New Gift"
        fields={formConfig.fields}
        onSubmit={handleAddGift}
        onClose={closeAddForm}
        loading={isSubmitting}
        submitText={isSubmitting ? 'Processing...' : 'Add Gift'}
        cardClassName="card-gifts-graduation"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Gift"
        fields={editFormConfig.fields}
        initialValues={getEditInitialValues(selectedGift)}
        onSubmit={handleEditGift}
        onClose={closeEditForm}
        loading={isEditSubmitting}
        submitText={isEditSubmitting ? 'Processing...' : 'Update Gift'}
        cardClassName="card-gifts-graduation"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteConfirm.show}
        {...getDeleteConfig('gifts')}
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
          { value: 'price-high', label: 'Price (High to Low)' },
          { value: 'price-low', label: 'Price (Low to High)' },
        ]}
        title="Sort Gifts"
      />
    </div>
  );
}
