'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
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
import { getFormConfig } from '@/config/formConfigs';

import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';

type SortOption = 'recipient' | 'store' | 'price-high' | 'price-low' | 'none';

export default function NewYearSuppliesListPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

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

  // Use only Redux data - no GET API calls on holiday pages

  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [giftToDelete, setGiftToDelete] = useState<any>(null);

  // Home data already declared above

  useEffect(() => {
    // Fetch contacts for address book functionality
    // Only fetch if home data is initialized (which contains contacts)
    if (homeInitialized) {
      dispatch(fetchContacts());
    }
  }, [dispatch, homeInitialized]);

  async function handleAddGift(values: Record<string, any>) {
    if (!values.giftName?.trim() || !values.recipient?.trim()) return;

    try {
      const payload = transformGiftPayload(values, contacts);
      const result = await createGift(payload);
      updateGiftInRedux(result, 'add');

      // Refresh home data to ensure UI is in sync
      await refreshHomeData();

      setShowFormModal(false);
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

  function openForm() {
    setShowFormModal(true);
    setSelectedGift(null);
  }

  function closeForm() {
    setShowFormModal(false);
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
      await refreshHomeData();

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
    if (!selectedGift) return;

    try {
      const payload = transformGiftPayload(values, contacts);
      // Update using the hook
      const result = await updateGift(selectedGift.id, payload);

      // Update Redux state directly
      updateGiftInRedux(result, 'update');

      // Refresh home data to ensure UI is in sync
      await refreshHomeData();

      setShowFormModal(false);
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

  // Function to refresh home data from server
  const refreshHomeData = async () => {
    if (!auth0User) return;

    try {
      const response = await fetch('/api/home', {
        headers: {
          'Content-Type': 'application/json',
          'x-test-user': JSON.stringify({
            sub: auth0User.sub,
            email: auth0User.email,
            name: auth0User.name,
            picture: auth0User.picture,
          }),
        },
      });

      if (response.ok) {
        const result = await response.json();
        dispatch(setHomeData(result.data));
      }
    } catch (error) {
      console.error('Error refreshing home data:', error);
    }
  };

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
      placeholder: 'Supply Name*',
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

        <AddButton title="Supply" onClick={openForm} color="amber" />
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

      {/* Form Modal */}
      <FormModal
        isOpen={showFormModal}
        title={selectedGift ? 'Edit Supply' : 'Add New Supply'}
        fields={formFields}
        initialValues={getInitialValues()}
        onSubmit={selectedGift ? handleUpdateGift : handleAddGift}
        onClose={closeForm}
        loading={createLoading || updateLoading}
        submitText={selectedGift ? 'Update Supply' : 'Add Supply'}
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#f59e0b"
        showAddressBook={true}
        contacts={contacts}
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
