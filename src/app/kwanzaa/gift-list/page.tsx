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
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { transformGiftPayload } from '@/utils/formTransformers';
import { BudgetDisplay } from '@/components/common/BudgetDisplay';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import SortModal from '@/components/modals/SortModal';
import GiftCardItem from '@/components/cards/gift/GiftCardItem';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';

import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';

type SortOption = 'recipient' | 'store' | 'price-high' | 'price-low' | 'none';

export default function KwanzaaGiftListPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

  // Use centralized holiday page data hook
  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();

  // Use standardized mutation hooks for gift operations
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
    selectIsHolidayShared(state, 'kwanzaa'),
  );

  // Get share members for Enhanced Compatibility Layer
  const shareData = useAppSelector(state =>
    selectShareByHolidayKey(state, 'kwanzaa'),
  );
  const shareMembers = shareData?.members || [];

  // Helper function to resolve assignedTo UUID to user name
  const getAssignedUserName = (assignedToUuid: string): string | null => {
    if (!assignedToUuid || !shareMembers.length) return null;

    const member = shareMembers.find((m: any) => m.uuid === assignedToUuid);
    return member ? member.name || member.email || 'Unknown User' : assignedToUuid;
  };

  // Transform gifts to include assignedToName for display
  const transformGiftWithAssignment = (gift: any) => ({
    ...gift,
    assignedToName: gift.assignedTo ? getAssignedUserName(gift.assignedTo) : null,
  });

  // Redux data access - gifts from holiday data with assignment name resolution
  const gifts = useMemo(
    () => (holidayData?.gifts || []).map(transformGiftWithAssignment),
    [holidayData?.gifts, shareMembers],
  );
  const isLoading = !homeInitialized;

  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [giftToDelete, setGiftToDelete] = useState<any>(null);

  useEffect(() => {
    // Fetch contacts for address book functionality
    // Only fetch if home data is initialized (which contains contacts)
    if (homeInitialized) {
      dispatch(fetchContacts());
    }
  }, [dispatch, homeInitialized]);

  async function handleAddGift(values: Record<string, any>) {
    if (!values.description?.trim() || !values.recipient?.trim()) return;
    if (!holidayId || !auth0User) return;

    try {
      const payload = transformGiftPayload(values, contacts, shareMembers);
      const result = await createGift(payload);

      // Update Redux state immediately
      dispatch(addGiftToHomeData({ holidayId: holidayId, gift: result }));

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowFormModal(false);
    } catch (error) {
      console.error('Error creating gift:', error);
      // Show user-friendly error message
      if (error instanceof Error && error.message.includes('address book')) {
        alert('Please select a recipient from the address book');
      }
    }
  }

  function openForm() {
    setShowFormModal(true);
    setSelectedGift(null);
  }

  function closeForm() {
    setShowFormModal(false);
    setSelectedGift(null);
  }

  async function handleToggleGift(giftId: string) {
    if (!holidayId || !auth0User) return;

    try {
      // Find the current gift to get its completion status from Redux data
      const currentGift = gifts.find((gift: any) => gift.id === giftId);
      if (!currentGift) return;

      const result = await updateGift(giftId, {
        isCompleted: !currentGift.isCompleted,
      });

      // Update Redux state
      dispatch(
        updateGiftInHomeData({
          holidayId: holidayId,
          giftId: giftId,
          updates: { isCompleted: !currentGift.isCompleted },
        }),
      );

      // Refresh home data to update progress on main holiday page
      await refreshHomeData(auth0User, holidayId);
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

      // Remove from Redux state on success
      dispatch(
        removeGiftFromHomeData({
          holidayId: holidayId,
          giftId: giftToDelete.id,
        }),
      );

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
    setShowFormModal(true);
  }

  async function handleUpdateGift(values: Record<string, any>) {
    if (!selectedGift || !holidayId || !auth0User) return;

    try {
      const payload = transformGiftPayload(values, contacts, shareMembers);
      const result = await updateGift(selectedGift.id, payload);

      // Update Redux state
      dispatch(
        updateGiftInHomeData({
          holidayId: holidayId,
          giftId: selectedGift.id,
          updates: result,
        }),
      );

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowFormModal(false);
      setSelectedGift(null);
    } catch (error) {
      console.error('Error updating gift:', error);
      // Show user-friendly error message
      if (error instanceof Error && error.message.includes('address book')) {
        alert('Please select a recipient from the address book');
      }
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
      <div className="min-h-screen kwanzaa-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading gifts...</p>
        </div>
      </div>
    );
  }

  const sortedGifts = sortGifts(gifts || []);
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
        accentColor: '#dc2626', // Red for Kwanzaa
      }}
      borderColor="rgb(var(--color-red-500))" // Red border for Kwanzaa
      gamifiedBackgroundColor="bg-gradient-to-br from-red-400 to-red-600"
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
        accentColor: '#dc2626', // Red for Kwanzaa
      }}
      borderColor="rgb(var(--color-red-500))" // Red border for Kwanzaa
      gamifiedBackgroundColor="bg-gradient-to-br from-red-400 to-red-600"
    />
  );

  // Enhanced Compatibility Layer configuration
  const formConfig = getFormConfigEnhanced('gifts', selectedGift ? 'edit' : 'add', {
    holidayKey: 'kwanzaa',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  // Debug: Log form config to see what fields are generated
  console.log('Gift form config fields:', formConfig.fields);
  console.log('ShareMembers for form:', shareMembers);

  // Initial values for editing
  const getInitialValues = () => {
    if (!selectedGift) return {};

    // For assigned_to, try multiple approaches since Enhanced Compatibility Layer might expect different formats
    let assignedToValue = '';
    if (selectedGift.assignedTo) {
      console.log('Processing assignment for gift:', selectedGift);
      console.log('Gift assignedTo UUID:', selectedGift.assignedTo);
      console.log('Available shareMembers:', shareMembers);

      // First try: Use UUID directly (Enhanced system might expect this)
      assignedToValue = selectedGift.assignedTo;
      console.log('Trying UUID directly:', assignedToValue);

      // Second try: Find the member and use userId (Auth0 ID)
      const assignedMember = shareMembers.find(
        (m: any) => m.uuid === selectedGift.assignedTo,
      );
      if (assignedMember) {
        const userIdValue = assignedMember.userId;
        console.log(
          `Found member: ${assignedMember.name} (UUID: ${assignedMember.uuid}, userId: ${userIdValue})`,
        );

        // Try userId approach as backup
        // assignedToValue = userIdValue;
        console.log('Using UUID for assignment field:', assignedToValue);
      } else {
        console.warn(
          `Could not find member for UUID ${selectedGift.assignedTo} in shareMembers`,
        );
        console.warn(
          'ShareMembers available:',
          shareMembers.map(m => ({ uuid: m.uuid, userId: m.userId, name: m.name })),
        );
      }
    }

    const initialValues = {
      recipient: selectedGift.recipient || '',
      name: selectedGift.name || '',
      description: selectedGift.name || selectedGift.description || '',
      price: selectedGift.price ? selectedGift.price.toString() : '',
      store: selectedGift.store || '',
      productLink: selectedGift.productLink || '',
      product_link: selectedGift.productLink || '',
      assigned_to: assignedToValue,
      notes: selectedGift.notes || '',
    };

    console.log('Final initial values for edit form:', initialValues);

    return initialValues;
  };

  return (
    <div className="min-h-screen kwanzaa-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Gift List"
        backHref="/kwanzaa"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort gifts"
        description="Keep track of gift ideas and purchases!"
        holidayColor="red-500"
        error={undefined}
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        {/* Budget Display */}
        <BudgetDisplay
          holiday="Kwanzaa"
          holidayColor="bg-gradient-to-br from-red-400 to-red-600"
          holidayId={holidayId || undefined}
        />

        <AddButton title="Gift" onClick={openForm} color="red" />
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
        title={selectedGift ? 'Edit Gift' : 'Add New Gift'}
        fields={formConfig.fields}
        initialValues={getInitialValues()}
        onSubmit={selectedGift ? handleUpdateGift : handleAddGift}
        onClose={closeForm}
        loading={createLoading || updateLoading}
        submitText={
          createLoading || updateLoading
            ? selectedGift
              ? 'Updating...'
              : 'Adding...'
            : selectedGift
              ? 'Update Gift'
              : 'Add Gift'
        }
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#dc2626"
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
