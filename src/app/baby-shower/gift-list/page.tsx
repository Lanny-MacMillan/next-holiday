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

import { transformGiftPayload } from '@/utils/formTransformers';
import { BudgetDisplay } from '@/components/common/BudgetDisplay';
import SortModal from '@/components/modals/SortModal';
import GiftCardItem from '@/components/cards/gift/GiftCardItem';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import { getFormConfig } from '@/config/formConfigs';
import { getFormConfigEnhanced } from '@/config/formConfigs';

import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';

type SortOption = 'recipient' | 'store' | 'price-high' | 'price-low' | 'none';

export default function BabyShowerGiftListPage() {
  const dispatch = useAppDispatch();
  const contacts = useAppSelector((state: any) => state.addressBook.contacts);

  // Get share members for Enhanced Compatibility Layer
  const shareData = useAppSelector((state: any) =>
    selectShareByHolidayKey(state, 'baby-shower'),
  );
  const shareMembers = shareData?.members || [];

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

  // Get gift lists from holiday data
  const displayGifts = useMemo(() => {
    // Try both giftList and gifts properties to handle different data structures
    const gifts = holidayData?.giftList || holidayData?.gifts || [];
    console.log('Gift list updated:', gifts.length, 'gifts'); // Debug log
    console.log('Holiday data structure:', holidayData); // Debug log
    return gifts;
  }, [holidayData?.giftList, holidayData?.gifts, holidayData]);

  // Local loading states for specific operations
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [giftToDelete, setGiftToDelete] = useState<any>(null);

  useEffect(() => {
    // Fetch contacts for address book functionality
    if (homeInitialized) {
      dispatch(fetchContacts());
    }
  }, [dispatch, homeInitialized]);

  async function handleAddGift(values: Record<string, any>) {
    if (!values.name?.trim() || !values.recipient?.trim()) return;
    if (!holidayId || !auth0User) return;

    console.log('Creating gift with payload:', values); // Debug log
    const payload = transformGiftPayload(values, contacts, shareMembers);
    console.log('Transformed payload:', payload); // Debug log

    const result = await createGift(payload);
    console.log('Gift created successfully:', result); // Debug log

    // Force refresh the home data to ensure UI updates
    console.log('Refreshing home data...'); // Debug log

    // Add a small delay to ensure the API has processed the request
    await new Promise(resolve => setTimeout(resolve, 100));

    await refreshHomeData(auth0User, holidayId);
    console.log('Home data refreshed'); // Debug log

    setShowAddModal(false);
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
      // Find the current gift to get its completion status from Redux data
      const currentGift = displayGifts.find((gift: any) => gift.id === giftId);
      if (!currentGift) return;

      // Toggle the completion status
      const newIsCompleted = !currentGift.isCompleted;

      await updateGift(giftId, { isCompleted: newIsCompleted });
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

    const payload = transformGiftPayload(values, contacts, shareMembers);
    await updateGift(selectedGift.id, payload);
    await refreshHomeData(auth0User, holidayId);
    setShowEditModal(false);
    setSelectedGift(null);
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

  const sortedGifts = sortGifts(displayGifts || []);
  const incompleteGifts = sortedGifts.filter((gift: any) => !gift.isCompleted);
  const completedGifts = sortedGifts.filter((gift: any) => gift.isCompleted);

  // Enhanced Compatibility Layer form configurations
  const addFormConfig = getFormConfigEnhanced('gifts', 'add', {
    holidayKey: 'baby-shower',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('gifts', 'edit', {
    holidayKey: 'baby-shower',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const renderGiftItem = (gift: any) => (
    <GiftCardItem
      gift={gift}
      isCompleted={false}
      onToggle={handleToggleGift}
      onEdit={handleEditGift}
      onDelete={(giftId: string) => handleDeleteGift(gift)}
      loading={updateLoading}
      theme={{
        accentColor: '#06b6d4', // Cyan for Baby Shower
      }}
      borderColor="rgb(var(--color-cyan-500))" // Cyan border for Baby Shower
      gamifiedBackgroundColor="bg-gradient-to-br from-cyan-300 to-cyan-500"
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
        accentColor: '#06b6d4', // Cyan for Baby Shower
      }}
      borderColor="rgb(var(--color-cyan-500))" // Cyan border for Baby Shower
      gamifiedBackgroundColor="bg-gradient-to-br from-cyan-300 to-cyan-500"
    />
  );

  // Form fields configuration
  const formFields = [
    {
      id: 'recipient',
      type: 'text' as const,
      placeholder: 'Recipient (select from address book)*',
      required: true,
    },
    {
      id: 'giftName',
      type: 'text' as const,
      placeholder: 'Gift Name*',
      required: true,
    },
    {
      id: 'description',
      type: 'text' as const,
      placeholder: 'Description',
    },
    {
      id: 'price',
      type: 'number' as const,
      placeholder: 'Price',
      step: '0.01',
    },
    {
      id: 'store',
      type: 'text' as const,
      placeholder: 'Store',
    },
    {
      id: 'product_link',
      type: 'url' as const,
      placeholder: 'Product Link (optional)',
    },
    {
      id: 'notes',
      type: 'textarea' as const,
      placeholder: 'Notes',
      rows: 2,
    },
  ];

  // Initial values for editing
  const getInitialValues = () => {
    if (!selectedGift) return {};

    // Find the contact that matches this gift's recipient
    const matchingContact = contacts.find(
      (contact: any) => contact.name === selectedGift.recipient,
    );

    return {
      recipient: matchingContact ? selectedGift.recipient : '',
      giftName: selectedGift.name,
      description: selectedGift.description || '',
      price: selectedGift.price ? selectedGift.price.toString() : '',
      store: selectedGift.store || '',
      product_link: selectedGift.productLink || '',
      notes: selectedGift.notes || '',
    };
  };

  return (
    <div className="min-h-screen baby-shower-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Baby Shower Gift List"
        backHref="/baby-shower"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort gifts"
        description="Track your Baby Shower gift ideas!"
        holidayColor="cyan-500"
        error={undefined}
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        {/* Budget Display */}
        <BudgetDisplay
          holiday="Baby Shower"
          holidayColor="bg-gradient-to-br from-cyan-300 to-cyan-500"
          holidayId={holidayId || undefined}
        />

        <AddButton title="Gift" onClick={openForm} color="cyan" />
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
        title="Add New Gift"
        fields={addFormConfig.fields}
        onSubmit={handleAddGift}
        onClose={closeForm}
        loading={createLoading}
        submitText={createLoading ? 'Processing...' : 'Add Gift'}
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#06b6d4"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Edit Gift Modal */}
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
        loading={updateLoading}
        submitText={updateLoading ? 'Processing...' : 'Update Gift'}
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#06b6d4"
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
