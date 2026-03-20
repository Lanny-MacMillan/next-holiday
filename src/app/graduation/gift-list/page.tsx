'use client';

import { useState, useEffect, useMemo } from 'react';
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

export default function GraduationGiftListPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [giftToDelete, setGiftToDelete] = useState<any>(null);

  useEffect(() => {
    // Fetch contacts for address book functionality
    if (homeInitialized) {
      dispatch(fetchContacts());
    }
  }, [dispatch, homeInitialized]);

  // CRUD Operations using new hooks
  const handleAddGift = async (values: Record<string, any>) => {
    if (!values.giftName?.trim() || !values.recipient?.trim()) return;
    if (!holidayId) return;

    try {
      const payload = transformGiftPayload(values, contacts);
      await createGift(payload);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

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

    try {
      const payload = transformGiftPayload(values, contacts);
      await updateGift(selectedGift.id, payload);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

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
  };

  const confirmDelete = async () => {
    if (!giftToDelete || !holidayId) return;

    try {
      await deleteGift(giftToDelete.id);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowDeleteModal(false);
      setGiftToDelete(null);
    } catch (error) {
      console.error('Error deleting gift:', error);
    }
  };

  // Helper functions
  const openForm = () => {
    setShowFormModal(true);
    setSelectedGift(null);
  };

  const closeForm = () => {
    setShowFormModal(false);
    setSelectedGift(null);
  };

  const handleDeleteGift = (gift: any) => {
    setGiftToDelete(gift);
    setShowDeleteModal(true);
  };

  const handleEditGiftOpen = (gift: any) => {
    setSelectedGift(gift);
    setShowFormModal(true);
  };

  const handleFormSubmit = selectedGift ? handleEditGift : handleAddGift;

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

      {/* Form Modal */}
      <FormModal
        isOpen={showFormModal}
        title={selectedGift ? 'Edit Gift' : 'Add New Gift'}
        fields={formFields}
        initialValues={
          selectedGift
            ? {
                giftName: selectedGift.name || '',
                recipient: selectedGift.recipient || '',
                price: selectedGift.price || '',
                store: selectedGift.store || '',
                notes: selectedGift.notes || '',
              }
            : {}
        }
        onSubmit={handleFormSubmit}
        onClose={closeForm}
        loading={loading}
        submitText={selectedGift ? 'Update Gift' : 'Add Gift'}
        cardClassName="card-gifts-graduation"
        showAddressBook={true}
        contacts={contacts}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        title="Delete Gift"
        itemName={giftToDelete?.name}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setGiftToDelete(null);
        }}
        loading={loading}
        cardClassName="card-gifts-graduation"
        confirmButtonColor="#8b5cf6"
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
