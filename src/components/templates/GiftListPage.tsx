'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSharedHoliday } from '@/hooks/useSharedHoliday';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import { refreshShares } from '@/store/slices/sharesSlice';
import {
  transformGiftPayload,
  transformSuppliesPayload,
} from '@/utils/formTransformers';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import type { GiftListConfig } from '@/config/giftListConfigs';
import { BudgetDisplay } from '@/components/common/BudgetDisplay';
import SortModal from '@/components/modals/SortModal';
import GiftCardItem from '@/components/cards/gift/GiftCardItem';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import Toast from '@/components/common/Toast';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';

type SortOption = 'recipient' | 'store' | 'price-high' | 'price-low' | 'none';

const SORT_LABELS: Record<Exclude<SortOption, 'none'>, string> = {
  recipient: 'Recipient',
  store: 'Store',
  'price-high': 'Price: High to Low',
  'price-low': 'Price: Low to High',
};

function sortGifts(gifts: any[], sortBy: SortOption) {
  switch (sortBy) {
    case 'recipient':
      return [...gifts].sort((a, b) =>
        (a.recipient || '').localeCompare(b.recipient || ''),
      );
    case 'store':
      return [...gifts].sort((a, b) => (a.store || '').localeCompare(b.store || ''));
    case 'price-high':
      return [...gifts].sort((a, b) => (b.price || 0) - (a.price || 0));
    case 'price-low':
      return [...gifts].sort((a, b) => (a.price || 0) - (b.price || 0));
    default:
      return gifts;
  }
}

function failureMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    if (error.message.includes('address book')) {
      return 'Please select a recipient from the address book';
    }
    if (error.message.includes('uuid') || error.message.includes('Invalid uuid')) {
      return 'Assignment error: Please try selecting the assignee again';
    }
  }
  return fallback;
}

// One gift list for every holiday; the config supplies names, wording and colours.
export default function GiftListPage({ config }: { config: GiftListConfig }) {
  const { holidayKey, itemName, itemPlural, theme } = config;
  const isSupplies = config.formType === 'supplies';
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

  const { holidayId, holidayData, auth0User, homeInitialized, shareMembers } =
    useSharedHoliday(holidayKey);

  const {
    createGift,
    editGift,
    updateGift,
    deleteGift,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  const gifts = useMemo(() => holidayData?.gifts || [], [holidayData?.gifts]);

  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [giftToDelete, setGiftToDelete] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    dispatch(fetchContacts());
    if (auth0User?.sub) dispatch(refreshShares(auth0User.sub));
  }, [dispatch, auth0User?.sub]);

  const payloadFor = (values: Record<string, any>) =>
    isSupplies
      ? transformSuppliesPayload(values, shareMembers)
      : transformGiftPayload(values, contacts, shareMembers);

  async function handleAddGift(values: Record<string, any>) {
    if (isSupplies && !values.name?.trim()) {
      setToast({ message: 'Please fill in the Item Name field', type: 'error' });
      return;
    }
    if (!values.name?.trim() || (!isSupplies && !values.recipient?.trim())) return;
    if (!holidayId || !auth0User) return;

    setIsSubmitting(true);
    try {
      await createGift(payloadFor(values));
      dispatch(fetchContacts());
      setToast({ message: `${itemName} added successfully!`, type: 'success' });
      setShowAddModal(false);
    } catch (error) {
      setToast({
        message: failureMessage(
          error,
          `Error creating ${itemName.toLowerCase()}. Please try again.`,
        ),
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateGift(values: Record<string, any>) {
    if (!selectedGift || !holidayId || !auth0User) return;

    setIsEditSubmitting(true);
    try {
      await editGift(selectedGift.id, payloadFor(values));
      setToast({ message: `${itemName} updated successfully!`, type: 'success' });
      setShowEditModal(false);
      setSelectedGift(null);
    } catch (error) {
      setToast({
        message: failureMessage(
          error,
          `Error updating ${itemName.toLowerCase()}. Please try again.`,
        ),
        type: 'error',
      });
    } finally {
      setIsEditSubmitting(false);
    }
  }

  async function handleToggleGift(giftId: string) {
    if (!holidayId || !auth0User) return;
    const current = gifts.find((gift: any) => gift.id === giftId);
    if (!current) return;

    try {
      await updateGift(giftId, !current.isCompleted);
    } catch (error) {
      console.error('Error toggling gift:', error);
    }
  }

  async function confirmDelete() {
    if (!giftToDelete || !holidayId || !auth0User) return;

    try {
      await deleteGift(giftToDelete.id);
      setShowDeleteModal(false);
      setGiftToDelete(null);
    } catch (error) {
      console.error('Error deleting gift:', error);
    }
  }

  const closeAddModal = () => {
    setShowAddModal(false);
    setSelectedGift(null);
  };
  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedGift(null);
  };
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setGiftToDelete(null);
  };

  if (!homeInitialized) {
    return (
      <div
        className={`min-h-screen ${config.gradientClass} flex items-center justify-center`}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderBottomColor: theme.accent }}
          ></div>
          <p className="text-gray-600 dark:text-gray-300">Loading {itemPlural}...</p>
        </div>
      </div>
    );
  }

  const sortedGifts = sortGifts(gifts, sortBy);
  const incompleteGifts = sortedGifts.filter((gift: any) => !gift.isCompleted);
  const completedGifts = sortedGifts.filter((gift: any) => gift.isCompleted);

  const renderGiftItem = (gift: any, isCompleted: boolean) => (
    <GiftCardItem
      gift={gift}
      isCompleted={isCompleted}
      onToggle={handleToggleGift}
      onEdit={(selected: any) => {
        setSelectedGift(selected);
        setShowEditModal(true);
      }}
      onDelete={() => {
        setGiftToDelete(gift);
        setShowDeleteModal(true);
      }}
      loading={updateLoading}
      theme={{ accentColor: theme.accent }}
      borderColor={theme.border}
      gamifiedBackgroundColor={theme.gamified}
    />
  );

  const initialValues = selectedGift
    ? {
        recipient: selectedGift.recipient || '',
        name: selectedGift.name || selectedGift.description || '',
        description: selectedGift.description || '',
        price: selectedGift.price ? selectedGift.price.toString() : '',
        store: selectedGift.store || '',
        product_link: selectedGift.productLink || '',
        assigned_to: selectedGift.assignedTo || '',
        notes: selectedGift.notes || '',
      }
    : {};

  const formFields = (mode: 'add' | 'edit') =>
    getFormConfigEnhanced(isSupplies ? 'supplies' : 'gifts', mode, {
      holidayKey,
      shareMembers,
      auth0User,
    }).fields;

  const submitColor = theme.submit || theme.accent;
  const cardClassName = config.cardClassName || 'card';

  return (
    <div
      className={`min-h-screen ${config.gradientClass} flex flex-col items-center p-4 sm:p-8 font-sans`}
    >
      <HolidayPageHeader
        title={config.title}
        backHref={`/${holidayKey}`}
        onSortClick={() => setShowSortModal(true)}
        sortTitle={`Sort ${itemPlural}`}
        description={config.description}
        holidayColor={theme.header}
        error={undefined}
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        <BudgetDisplay
          holiday={config.budgetName}
          holidayColor={theme.budget}
          holidayId={holidayId || undefined}
        />

        <AddButton
          title={itemName}
          onClick={() => {
            setShowAddModal(true);
            setSelectedGift(null);
          }}
          color={theme.addButton}
        />
        {sortBy !== 'none' && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Sorted by {SORT_LABELS[sortBy]}
          </div>
        )}

        <TaskSection
          title="Incomplete"
          items={incompleteGifts}
          isCompleted={false}
          emptyMessage={`All ${itemPlural} completed!`}
          completedMessage=""
          renderItem={gift => renderGiftItem(gift, false)}
        />

        <TaskSection
          title="Completed"
          items={completedGifts}
          isCompleted={true}
          emptyMessage=""
          completedMessage={`No completed ${itemPlural} yet.`}
          renderItem={gift => renderGiftItem(gift, true)}
        />
      </main>

      <FormModal
        isOpen={showAddModal}
        onClose={closeAddModal}
        title={`Add New ${itemName}`}
        fields={formFields('add')}
        initialValues={{}}
        onSubmit={handleAddGift}
        loading={isSubmitting}
        submitText={isSubmitting ? 'Processing...' : `Add ${itemName}`}
        cancelText="Cancel"
        cardClassName={cardClassName}
        submitButtonColor={submitColor}
        contacts={contacts}
        shareMembers={shareMembers}
      />

      <FormModal
        isOpen={showEditModal}
        onClose={closeEditModal}
        title={`Edit ${itemName}`}
        fields={formFields('edit')}
        initialValues={initialValues}
        onSubmit={handleUpdateGift}
        loading={isEditSubmitting}
        submitText={isEditSubmitting ? 'Processing...' : `Update ${itemName}`}
        cancelText="Cancel"
        cardClassName={cardClassName}
        submitButtonColor={submitColor}
        contacts={contacts}
        shareMembers={shareMembers}
      />

      <DeleteModal
        isOpen={showDeleteModal}
        title={`Delete ${itemName}`}
        message={`Are you sure you want to delete "${giftToDelete?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={deleteLoading}
      />

      <SortModal
        isOpen={showSortModal}
        onClose={() => setShowSortModal(false)}
        sortBy={sortBy}
        onSortChange={(sortOption: string) => setSortBy(sortOption as SortOption)}
        sortOptions={[
          { value: 'none', label: 'None' },
          ...Object.entries(SORT_LABELS).map(([value, label]) => ({ value, label })),
        ]}
        title={`Sort ${itemPlural.replace(/\b\w/g, c => c.toUpperCase())}`}
      />

      <Toast
        message={toast?.message ?? ''}
        isVisible={!!toast}
        onClose={() => setToast(null)}
        type={toast?.type}
      />
    </div>
  );
}
