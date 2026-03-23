'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState } from '@/store';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { useSubscription } from '@/hooks/useSubscription';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import {
  updateGiftInHomeData,
  addGiftToHomeData,
  removeGiftFromHomeData,
  setHomeData,
} from '@/store/slices/homeSlice';
import { transformGiftPayload } from '@/utils/formTransformers';
import { BudgetDisplay } from '@/components/common/BudgetDisplay';
import SortModal from '@/components/modals/SortModal';
import DeleteModal from '@/components/modals/DeleteModal';
import FormModal from '@/components/modals/FormModal';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import GiftCardItem from '@/components/cards/gift/GiftCardItem';

type SortOption = 'recipient' | 'store' | 'price-high' | 'price-low' | 'none';

export default function ValentinesGiftListPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);
  const { isUserPlusMember, hasSubscription } = useSubscription();

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

  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'valentines'),
  );
  const isAuthorizedForSharing = hasSubscription && isUserPlusMember;

  // Get share members for Enhanced Compatibility Layer
  const shareData = useAppSelector((state: RootState) =>
    selectShareByHolidayKey(state, 'valentines'),
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
            uuid: member.uuid || member.userId, // Ensure uuid field exists - prefer existing uuid over userId
          })),
      ]
    : baseMembers;

  // Helper function to update Redux state after gift operations
  const updateGiftInRedux = (
    giftData: any,
    operation: 'add' | 'update' | 'delete',
  ) => {
    if (!holidayId) return;

    // For add and update operations, ensure the recipient field is populated
    let processedGiftData = giftData;
    if (
      (operation === 'add' || operation === 'update') &&
      giftData.contactId &&
      contacts
    ) {
      const contact = contacts.find((c: any) => c.id === giftData.contactId);
      processedGiftData = {
        ...giftData,
        recipient: contact?.name || 'Unknown',
      };
    }

    switch (operation) {
      case 'add':
        dispatch(addGiftToHomeData({ holidayId, gift: processedGiftData }));
        break;
      case 'update':
        dispatch(
          updateGiftInHomeData({
            holidayId,
            giftId: processedGiftData.id,
            updates: processedGiftData,
          }),
        );
        break;
      case 'delete':
        dispatch(
          removeGiftFromHomeData({
            holidayId,
            giftId: giftData.id,
          }),
        );
        break;
    }
  };

  // Local state for modals and sorting
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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
    // Enhanced Compatibility Layer uses 'name' field, not 'giftName'
    const giftName = values.name || values.giftName || '';
    if (!giftName?.trim() || !values.recipient?.trim()) return;
    if (!holidayId || !auth0User) return;

    try {
      const payload = transformGiftPayload(values, contacts, shareMembers);
      const result = await createGift(payload);

      // Update Redux state directly
      updateGiftInRedux(result, 'add');

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
      // Find the current gift to get its completion status from Redux data
      const currentGift = displayGifts.find((gift: any) => gift.id === giftId);
      if (!currentGift) return;

      // Toggle the completion status
      const newIsCompleted = !currentGift.isCompleted;

      // Update the gift using the hook
      await updateGift(giftId, { isCompleted: newIsCompleted });

      // Update Redux state directly
      updateGiftInRedux({ id: giftId, isCompleted: newIsCompleted }, 'update');
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
      // Delete the gift using the hook
      await deleteGift(giftToDelete.id);

      // Update Redux state directly
      updateGiftInRedux({ id: giftToDelete.id }, 'delete');

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

    try {
      const payload = transformGiftPayload(values, contacts, shareMembers);
      const result = await updateGift(selectedGift.id, payload);

      // Update Redux state directly
      updateGiftInRedux(result, 'update');

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
    }
  }

  function sortGifts(giftsToSort: any[]): any[] {
    switch (sortBy) {
      case 'recipient':
        return [...giftsToSort].sort((a, b) =>
          a.recipient.localeCompare(b.recipient),
        );
      case 'store':
        return [...giftsToSort].sort((a, b) => {
          const storeA = a.store || '';
          const storeB = b.store || '';
          return storeA.localeCompare(storeB);
        });
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
      <div className="min-h-screen valentines-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading gifts...</p>
        </div>
      </div>
    );
  }

  // Use only Redux data - no fallback to API calls
  const displayGifts =
    holidayData && homeInitialized && holidayData.gifts ? holidayData.gifts : [];

  const sortedGifts = sortGifts(displayGifts || []);
  const incompleteGifts = sortedGifts.filter(gift => !gift.isCompleted);
  const completedGifts = sortedGifts.filter(gift => gift.isCompleted);

  // No need for getInitialValues function - handle inline like Hanukkah

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
        accentColor: '#ec4899', // Pink for Valentine's Day
      }}
      borderColor="rgb(var(--color-pink-500))" // Pink border for Valentine's Day
      gamifiedBackgroundColor="bg-gradient-to-br from-pink-300 to-pink-500"
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
        accentColor: '#ec4899', // Pink for Valentine's Day
      }}
      borderColor="rgb(var(--color-pink-500))" // Pink border for Valentine's Day
      gamifiedBackgroundColor="bg-gradient-to-br from-pink-300 to-pink-500"
    />
  );

  return (
    <div className="min-h-screen valentines-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Valentines Gift List"
        backHref="/valentines"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort gifts"
        description="Track your Valentines gift ideas!"
        holidayColor="pink-500"
        error={undefined}
      />

      <main className="w-full max-w-4xl flex flex-col gap-6">
        {/* Budget Display */}
        {holidayId && (
          <BudgetDisplay
            holiday="Valentine's Day"
            holidayColor="bg-gradient-to-br from-pink-300 to-pink-500"
            holidayId={holidayId}
          />
        )}
        {!holidayId && (
          <div className="text-center text-gray-500 p-4">
            Loading budget information...
          </div>
        )}

        <AddButton title="Gift" onClick={openAddModal} color="pink" />

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
          emptyMessage="All gifts completed! 💝"
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

      {/* Add Gift Modal */}
      <FormModal
        isOpen={showAddModal}
        onClose={closeAddModal}
        title="Add New Gift"
        fields={
          getFormConfigEnhanced('gifts', 'add', {
            holidayKey: 'valentines',
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
        submitButtonColor="#ec4899"
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
            holidayKey: 'valentines',
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        initialValues={{
          recipient: selectedGift?.contact?.name || '',
          name: selectedGift?.name || '', // Enhanced Compatibility Layer uses 'name' field
          description: selectedGift?.description || '',
          price: selectedGift?.price || '',
          store: selectedGift?.store || '',
          product_link: selectedGift?.productLink || '',
          assigned_to: selectedGift?.assignedTo || '',
          notes: selectedGift?.notes || '',
        }}
        onSubmit={handleUpdateGift}
        loading={updateLoading}
        submitText={updateLoading ? 'Updating...' : 'Update Gift'}
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
