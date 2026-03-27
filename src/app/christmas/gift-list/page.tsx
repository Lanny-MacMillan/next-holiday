'use client';

import { useState, useEffect, useMemo } from 'react';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import { refreshShares } from '@/store/slices/sharesSlice';
import { selectHolidayPrefById } from '@/store/selectors/home';
import { transformGiftPayload } from '@/utils/formTransformers';
import { BudgetDisplay } from '@/components/common/BudgetDisplay';
import SortModal from '@/components/modals/SortModal';
import GiftCardItem from '@/components/cards/gift/GiftCardItem';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import Toast from '@/components/common/Toast';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import { selectShareByHolidayKey } from '@/store/slices/sharesSlice';

import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';

type SortOption = 'recipient' | 'store' | 'price-high' | 'price-low' | 'none';

export default function ChristmasGiftListPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

  // Use standardized hooks
  const {
    holidayId: baseHolidayId,
    holidayData: baseHolidayData,
    auth0User,
    homeInitialized,
    holidayPreferences,
  } = useHolidayPageData();

  // Get share data first to potentially override holidayId
  const shareData = useAppSelector(state => {
    if (!baseHolidayId) return null;
    // The shares come as an array, and we need to find one that matches this holiday
    // The API response uses holidayKey (like 'christmas'), not holidayId (UUID)
    return state.shares.shares.find(
      (share: any) => share?.holidayKey === 'christmas', // Use the holiday key, not the UUID
    );
  });

  // Use shared holiday ID if available, otherwise fall back to base holiday ID
  const holidayId = shareData?.holidayId || baseHolidayId;

  // Get holiday data for the correct holiday ID (shared vs base)
  const holidayData =
    useAppSelector(state => selectHolidayPrefById(state, holidayId)) ||
    baseHolidayData;

  const {
    createGift,
    editGift,
    updateGift,
    deleteGift,
    createLoading,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  // Use standardized data refresh hook
  const { refreshHomeData } = useRefreshHomeData();

  // Get share members for Enhanced Compatibility Layer
  // shareData is already retrieved above for holidayId logic
  const baseMembers = shareData?.members || [];

  // Always include current user in shareMembers for assignTo functionality
  const shareMembers = auth0User
    ? [
        // First, try to find current user in baseMembers (which has updated names)
        ...baseMembers
          .filter((member: any) => member.userId === auth0User.sub)
          .map((member: any) => ({
            ...member,
            uuid: member.uuid || member.userId,
            role: 'owner' as const, // Mark current user as owner
          })),
        // If current user not in baseMembers, add them manually with Auth0 data
        ...(baseMembers.find((member: any) => member.userId === auth0User.sub)
          ? []
          : [
              {
                userId: auth0User.sub || '',
                uuid: auth0User.id || '',
                name: auth0User.name || 'Me',
                email: auth0User.email || '',
                role: 'owner' as const,
              },
            ]),
        // Add other members, filtering out current user
        ...baseMembers
          .filter((member: any) => member.userId !== auth0User.sub)
          .map((member: any) => ({
            ...member,
            uuid: member.uuid || member.userId,
          })),
      ]
    : baseMembers;

  // Use memoized gifts filtering from holiday data
  const displayGifts = useMemo(() => holidayData?.gifts || [], [holidayData?.gifts]);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [giftToDelete, setGiftToDelete] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Toast state for error/success messages
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('error');

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());

    // Force refresh shares data to get the latest with holidayId field
    if (auth0User?.sub) {
      dispatch(refreshShares(auth0User.sub));
    }
  }, [dispatch, auth0User?.sub]);

  async function handleAddGift(values: Record<string, any>) {
    if (!values.name?.trim() || !values.recipient?.trim()) return;
    if (!holidayId || !auth0User) return;

    setIsSubmitting(true);
    try {
      // Pre-validate the assigned_to field before sending to transformer
      if (values.assignedTo || values.assigned_to) {
        const assignedValue = values.assignedTo || values.assigned_to;

        // Check if it's already a valid UUID
        const isValidUUID =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            assignedValue,
          );

        if (!isValidUUID) {
          // Try to find matching member
          const matchingMember = shareMembers.find(
            (m: any) => m.userId === assignedValue,
          );
        }
      } else {
        console.log('No assignment field in form values');
        console.log('Available form fields:', Object.keys(values));
      }

      const payload = transformGiftPayload(values, contacts, shareMembers);

      // Use the standardized hook function
      await createGift(payload);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      // Refresh address book contacts
      dispatch(fetchContacts());

      // Show success toast
      setToastMessage('Gift added successfully!');
      setToastType('success');
      setShowToast(true);

      setShowAddModal(false);
    } catch (error) {
      // Show user-friendly error message with Toast
      let errorMessage = 'Error creating gift. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('address book')) {
          errorMessage = 'Please select a recipient from the address book';
        } else if (
          error.message.includes('uuid') ||
          error.message.includes('Invalid uuid')
        ) {
          errorMessage = 'Assignment error: Please try selecting the assignee again';
        }
      }

      setToastMessage(errorMessage);
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  function openForm() {
    setShowAddModal(true);
    setSelectedGift(null);
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
    if (!holidayId) return;

    try {
      // Find the current gift to get its completion status from Redux data
      const currentGift = displayGifts.find((gift: any) => gift.id === giftId);
      if (!currentGift || !auth0User) return;

      // Toggle the completion status
      const newIsCompleted = !currentGift.isCompleted;

      // Use the standardized hook function
      await updateGift(giftId, newIsCompleted);

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
      // Use the standardized hook function
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
      // Pre-validate the assigned_to field before sending to transformer
      if (values.assignedTo || values.assigned_to) {
        const assignedValue = values.assignedTo || values.assigned_to;

        // Check if it's already a valid UUID
        const isValidUUID =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            assignedValue,
          );

        if (!isValidUUID) {
          // Try to find matching member
          const matchingMember = shareMembers.find(
            (m: any) => m.userId === assignedValue,
          );
        }
      } else {
        console.log('No assignment field in form values for update');
        console.log('Available form fields:', Object.keys(values));
      }

      const payload = transformGiftPayload(values, contacts, shareMembers);

      // Use the standardized hook function
      await editGift(selectedGift.id, payload);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      // Show success toast
      setToastMessage('Gift updated successfully!');
      setToastType('success');
      setShowToast(true);

      setShowEditModal(false);
      setSelectedGift(null);
    } catch (error) {
      console.error('Error updating gift:', error);

      // Show user-friendly error message with Toast
      let errorMessage = 'Error updating gift. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('address book')) {
          errorMessage = 'Please select a recipient from the address book';
        } else if (
          error.message.includes('uuid') ||
          error.message.includes('Invalid uuid')
        ) {
          errorMessage = 'Assignment error: Please try selecting the assignee again';
        }
      }

      setToastMessage(errorMessage);
      setToastType('error');
      setShowToast(true);
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
      <div className="min-h-screen christmas-gifts-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
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
        accentColor: '#22c55e', // Green for Christmas
      }}
      borderColor="rgb(var(--color-green-500))" // Green border for Christmas
      gamifiedBackgroundColor="bg-gradient-to-br from-red-400 to-red-600"
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
        accentColor: '#22c55e', // Green for Christmas
      }}
      borderColor="rgb(var(--color-green-500))" // Green border for Christmas
      gamifiedBackgroundColor="bg-gradient-to-br from-red-400 to-red-600"
    />
  );

  // Initial values for editing
  const getInitialValues = () => {
    if (!selectedGift) return {};

    // For assigned_to, use the UUID directly (not Auth0 user ID)
    let assignedToValue = '';
    if (selectedGift.assignedTo) {
      // The form field expects UUID format, and selectedGift.assignedTo is already a UUID
      assignedToValue = selectedGift.assignedTo;
    }

    const initialValues = {
      recipient: selectedGift.recipient || '',
      name: selectedGift.name || '',
      description: selectedGift.description || '',
      price: selectedGift.price ? selectedGift.price.toString() : '',
      store: selectedGift.store || '',
      product_link: selectedGift.productLink || '',
      assigned_to: assignedToValue,
      notes: selectedGift.notes || '',
    };

    return initialValues;
  };

  return (
    <div className="min-h-screen christmas-gifts-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Gift List"
        backHref="/christmas"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort gifts"
        description="Keep track of gift ideas and purchases!"
        holidayColor="red-500"
        error={undefined}
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        {/* Budget Display */}
        <BudgetDisplay
          holiday="Christmas"
          holidayColor="bg-gradient-to-br from-red-400 to-red-600"
          holidayId={holidayId || undefined}
        />

        <AddButton title="Gift" onClick={openForm} color="green" />
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

      {/* Add Gift Modal */}
      <FormModal
        isOpen={showAddModal}
        onClose={closeAddModal}
        title="Add New Gift"
        fields={
          getFormConfigEnhanced('gifts', 'add', {
            holidayKey: 'christmas',
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        initialValues={{}}
        onSubmit={handleAddGift}
        loading={isSubmitting}
        submitText={isSubmitting ? 'Processing...' : 'Add Gift'}
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#22c55e"
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
            holidayKey: 'christmas',
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        initialValues={getInitialValues()}
        onSubmit={handleUpdateGift}
        loading={isEditSubmitting}
        submitText={isEditSubmitting ? 'Processing...' : 'Update Gift'}
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#22c55e"
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

      {/* Toast for error/success messages */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        type={toastType}
      />
    </div>
  );
}
