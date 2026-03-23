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

export default function NewYearSuppliesListPage() {
  const dispatch = useAppDispatch();
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

  // Use standardized data refresh hook
  const { refreshHomeData } = useRefreshHomeData();

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

  // Debug shareMembers to identify UUID issues
  console.log('ShareMembers debug info:', {
    baseMembers: baseMembers.map(m => ({
      userId: m.userId,
      uuid: m.uuid,
      name: m.name,
    })),
    finalShareMembers: shareMembers.map(m => ({
      userId: m.userId,
      uuid: m.uuid,
      name: m.name,
    })),
    auth0User: { sub: auth0User?.sub, id: auth0User?.id, name: auth0User?.name },
  });

  const { contacts } = useAppSelector((state: any) => state.addressBook);

  // Helper function to update Redux state after gift operations (kept for compatibility)
  const updateGiftInRedux = (
    giftData: any,
    operation: 'add' | 'update' | 'delete',
  ) => {
    // Since we're using standardized hooks, this function is simplified
    // The hooks handle Redux updates automatically
    console.log(`Gift operation: ${operation}`, giftData);
  };

  // State management
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [giftToDelete, setGiftToDelete] = useState<any>(null);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    if (auth0User) {
      console.log('Fetching contacts for user:', auth0User.sub);
      dispatch(fetchContacts());
    }
  }, [dispatch, auth0User]);

  async function handleAddGift(values: Record<string, any>) {
    console.log('handleAddGift called with values:', values);
    console.log('Available contacts:', contacts);
    console.log('Form validation check:', {
      nameValid: !!values.name?.trim(),
      recipientValid: !!values.recipient?.trim(),
      name: values.name,
      recipient: values.recipient,
    });

    // Enhanced Compatibility Layer uses 'name' field, not 'giftName'
    if (!values.name?.trim() || !values.recipient?.trim()) {
      console.log('Validation failed - missing required fields');
      alert('Please fill in both Gift Name and Recipient fields');
      return;
    }

    try {
      console.log('Attempting to transform payload...');
      const payload = transformGiftPayload(values, contacts, shareMembers);
      console.log('Payload created successfully:', payload);

      const result = await createGift(payload);
      updateGiftInRedux(result, 'add');

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating gift:', error);
      // Show user-friendly error message with specific guidance
      if (error instanceof Error) {
        if (error.message.includes('Address book is empty')) {
          alert(
            '❌ Address Book Required\n\nTo add supplies, you need to:\n1. Go to Settings > Address Book\n2. Add at least one contact\n3. Return here and select the recipient from the dropdown\n\nThis helps track who supplies are for!',
          );
        } else if (
          error.message.includes('must be selected from the address book dropdown')
        ) {
          alert(
            '❌ Please Select from Dropdown\n\nDon\'t type the recipient name - click the dropdown arrow next to "Recipient" and select from your address book contacts.\n\nIf you don\'t see the person you want, add them in Settings > Address Book first.',
          );
        } else if (error.message.includes('address book')) {
          alert(
            "Please select a recipient from the address book dropdown (don't type manually)",
          );
        } else {
          alert('Error creating supply: ' + error.message);
        }
      } else {
        alert('Error creating supply. Please try again.');
      }
    }
  }

  function openForm() {
    console.log('Opening Add Supply modal');
    console.log(
      'Contacts available:',
      contacts?.length || 0,
      contacts?.map(c => c.name),
    );
    console.log('ShareMembers available:', shareMembers?.length || 0);
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

      // Update the gift using the hook
      await updateGift(giftId, { isCompleted: newIsCompleted });

      // Update Redux state directly
      updateGiftInRedux({ id: giftId, isCompleted: newIsCompleted }, 'update');

      // Refresh home data to ensure UI is in sync and progress updates
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
    if (!giftToDelete) return;

    try {
      // Delete using the hook
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
    if (!selectedGift) return;

    console.log('handleUpdateGift called with values:', values);
    console.log('shareMembers available:', shareMembers);

    try {
      const payload = transformGiftPayload(values, contacts, shareMembers);
      console.log('Update payload created:', payload);

      // Update using the hook
      const result = await updateGift(selectedGift.id, payload);
      console.log('Update result:', result);

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
          getFormConfigEnhanced('gifts', 'add', {
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
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Edit Supply Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Supply"
        fields={
          getFormConfigEnhanced('gifts', 'edit', {
            holidayKey: 'new-year' as any,
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        initialValues={{
          recipient: selectedGift?.recipient || '',
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
        contacts={contacts}
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
    </div>
  );
}
