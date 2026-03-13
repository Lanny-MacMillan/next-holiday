'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { fetchContacts } from '@/store/slices/addressBookSlice';
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

export default function FourthOfJulySuppliesListPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);
  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();
  const { refreshHomeData } = useRefreshHomeData();

  // Use hooks for gift CRUD operations
  const {
    createGift,
    updateGift,
    deleteGift,
    createLoading,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [giftToDelete, setGiftToDelete] = useState<any>(null);

  // Use only Redux data - no fallback to API calls
  const displayGifts =
    holidayData && homeInitialized && holidayData.gifts ? holidayData.gifts : [];

  useEffect(() => {
    // Fetch contacts for address book functionality
    // Only fetch if home data is initialized (which contains contacts)
    if (homeInitialized) {
      dispatch(fetchContacts());
    }
  }, [dispatch, homeInitialized]);

  async function handleAddGift(values: Record<string, any>) {
    if (!values.giftName?.trim() || !values.recipient?.trim()) return;
    if (!holidayId || !auth0User) return;

    try {
      const giftData = transformGiftPayload(values, contacts);
      await createGift(giftData);
      await refreshHomeData(auth0User, holidayId);
      setShowFormModal(false);
    } catch (error) {
      console.error('Failed to add gift:', error);
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
    if (!holidayId || !auth0User) return;

    try {
      // Find the current gift to get its completion status
      const currentGift = displayGifts.find((gift: any) => gift.id === giftId);
      if (!currentGift) return;

      // Toggle the completion status
      const updateData = { isCompleted: !currentGift.isCompleted };
      await updateGift(giftId, updateData);
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Failed to toggle gift:', error);
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
      console.error('Failed to delete gift:', error);
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
      const giftData = transformGiftPayload(values, contacts);
      await updateGift(selectedGift.id, giftData);
      await refreshHomeData(auth0User, holidayId);
      setShowFormModal(false);
      setSelectedGift(null);
    } catch (error) {
      console.error('Failed to update gift:', error);
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

  // Show loading only if home data is not initialized
  if (!homeInitialized) {
    return (
      <div className="min-h-screen fourth-of-july-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading supplies...</p>
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
        accentColor: '#dc2626', // Red for Fourth of July
      }}
      borderColor="rgb(var(--color-red-500))" // Red border for Fourth of July
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
        accentColor: '#dc2626', // Red for Fourth of July
      }}
      borderColor="rgb(var(--color-red-500))" // Red border for Fourth of July
      gamifiedBackgroundColor="bg-gradient-to-br from-red-400 to-red-600"
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
      placeholder: 'Supply Item Name*',
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
    <div className="min-h-screen fourth-of-july-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Fourth of July Supply List"
        backHref="/fourth-of-july"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort supplies"
        description="Track your Fourth of July supply ideas!"
        holidayColor="red-500"
        error={undefined}
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        {/* Budget Display */}
        <BudgetDisplay
          holiday="Fourth of July"
          holidayColor="bg-gradient-to-br from-red-400 to-red-600"
          holidayId={holidayId || undefined}
        />

        <AddButton title="Supply" onClick={openForm} color="red" />
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
        loading={selectedGift ? updateLoading : createLoading}
        submitText={selectedGift ? 'Update Supply' : 'Add Supply'}
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#dc2626"
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
