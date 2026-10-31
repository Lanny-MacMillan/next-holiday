'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useSharedHoliday } from '@/hooks/useSharedHoliday';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import { transformCardPayload } from '@/utils/formTransformers';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import type { CardPageConfig } from '@/config/cardPageConfigs';
import FormModal from '@/components/modals/FormModal';
import AddButton from '@/components/common/AddButton';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import Footer from '@/components/common/Footer';
import MailCardStatus from '@/components/cards/MailCardStatus';
import MailCard from '@/components/cards/MailCard';
import TaskSection from '@/components/common/TaskSection';
import SortModal from '@/components/modals/SortModal';
import DeleteModal from '@/components/modals/DeleteModal';
import Toast from '@/components/common/Toast';

const SORT_OPTIONS = [
  { value: 'recipient', label: 'Recipient' },
  { value: 'completed', label: 'Completion Status' },
  { value: 'message', label: 'Message' },
];

function sortCards(cards: any[], sortBy: string) {
  return [...cards].sort((a, b) => {
    switch (sortBy) {
      case 'recipient':
        return (a.recipient || '').localeCompare(b.recipient || '');
      case 'completed':
        return a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1;
      case 'message':
        return (a.message || '').localeCompare(b.message || '');
      default:
        return 0;
    }
  });
}

function failureMessage(error: unknown, fallback: string) {
  if (
    error instanceof Error &&
    (error.message.includes('uuid') || error.message.includes('Invalid uuid'))
  ) {
    return 'Assignment error: Please try selecting the assignee again';
  }
  return fallback;
}

// One cards page for every holiday that has one; the config supplies names and colours.
export default function CardsPage({ config }: { config: CardPageConfig }) {
  const { holidayKey, accent } = config;
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

  const { holidayId, holidayData, auth0User, homeInitialized, shareMembers } =
    useSharedHoliday(holidayKey);

  const { createCard, updateCard, editCard, deleteCard } = useHolidayMutations({
    holidayId,
    auth0User,
  });

  // Cards carry the assignee's id; show their name
  const cards = useMemo(
    () =>
      (holidayData?.cards || []).map((card: any) => {
        const member = card.assignedTo
          ? shareMembers.find((m: any) => m.uuid === card.assignedTo)
          : null;
        return {
          ...card,
          assignedToName: card.assignedTo
            ? member
              ? member.name || member.email || 'Unknown User'
              : card.assignedTo
            : null,
        };
      }),
    [holidayData?.cards, shareMembers],
  );

  const [showForm, setShowForm] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<any>(null);
  const [cardToEdit, setCardToEdit] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sortBy, setSortBy] = useState('recipient');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    dispatch(fetchContacts());
  }, [dispatch]);

  async function handleAddCard(values: Record<string, any>) {
    if (!values.recipient?.trim() || !values.message?.trim()) {
      setToast({
        message: 'Please fill in both Recipient and Message fields',
        type: 'error',
      });
      return;
    }
    if (!holidayId || !auth0User) return;

    setIsSubmitting(true);
    try {
      await createCard(transformCardPayload(values, contacts, shareMembers));
      dispatch(fetchContacts());
      setToast({ message: 'Card added successfully!', type: 'success' });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating card:', error);
      setToast({
        message: failureMessage(error, 'Error creating card. Please try again.'),
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditSubmit(values: Record<string, any>) {
    if (!cardToEdit || !holidayId || !auth0User) return;

    setIsEditSubmitting(true);
    try {
      await editCard(
        cardToEdit.id,
        transformCardPayload(values, contacts, shareMembers),
      );
      setToast({ message: 'Card updated successfully!', type: 'success' });
      setShowEditModal(false);
      setCardToEdit(null);
    } catch (error) {
      console.error('Error updating card:', error);
      setToast({
        message: failureMessage(error, 'Error updating card. Please try again.'),
        type: 'error',
      });
    } finally {
      setIsEditSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!cardToDelete || !holidayId || !auth0User) return;

    try {
      await deleteCard(cardToDelete.id);
      setShowDeleteModal(false);
      setCardToDelete(null);
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  }

  async function handleToggleCompletion(cardId: string) {
    try {
      const card = cards.find((c: any) => c.id === cardId);
      if (card && holidayId && auth0User) {
        await updateCard(cardId, !card.isCompleted);
      }
    } catch (error) {
      console.error('Error toggling card completion:', error);
    }
  }

  const sortedCards = sortCards(cards, sortBy);
  const completedCards = sortedCards.filter((card: any) => card.isCompleted);
  const incompleteCards = sortedCards.filter((card: any) => !card.isCompleted);

  const formFields = (mode: 'add' | 'edit') =>
    getFormConfigEnhanced('cards', mode, {
      holidayKey,
      shareMembers,
      auth0User,
    }).fields;

  const renderCard = (card: any) => (
    <MailCard
      key={card.id}
      card={card}
      onToggleCompletion={handleToggleCompletion}
      onEditCard={(selected: any) => {
        setCardToEdit(selected);
        setShowEditModal(true);
      }}
      onDeleteCard={(cardId: string) => {
        setCardToDelete(cards.find((c: any) => c.id === cardId));
        setShowDeleteModal(true);
      }}
      holidayColor={config.gradient}
    />
  );

  return (
    <div
      className={`min-h-screen ${config.gradientClass} flex flex-col items-center p-4 sm:p-8 font-sans`}
    >
      <HolidayPageHeader
        title={config.title}
        backHref={`/${holidayKey}`}
        onSortClick={() => setShowSortModal(true)}
        description={config.description}
        holidayColor={config.headerColor}
        error={undefined}
        sortTitle="Sort Cards"
      />

      <main className="w-full max-w-4xl flex flex-col gap-6">
        <MailCardStatus
          totalCards={cards.length}
          completedCards={completedCards.length}
          incompleteCards={incompleteCards.length}
          holidayColor={config.gradient}
        />

        <AddButton
          title="Card"
          onClick={() => setShowForm(true)}
          color={config.addButton}
        />

        {!homeInitialized ? (
          <div className="text-center py-8">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
              style={{ borderBottomColor: accent }}
            ></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Loading cards...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No cards added yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 hover:underline"
              style={{ color: accent }}
            >
              Add your first card
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <TaskSection
              title="Cards to Send"
              items={incompleteCards}
              isCompleted={false}
              emptyMessage="No cards to send yet."
              completedMessage="All cards sent!"
              renderItem={renderCard}
            />

            <TaskSection
              title="Sent Cards"
              items={completedCards}
              isCompleted={true}
              emptyMessage="No cards sent yet."
              completedMessage="No sent cards to display."
              renderItem={renderCard}
            />
          </div>
        )}
      </main>

      <FormModal
        isOpen={showForm}
        title="Add New Card"
        fields={formFields('add')}
        initialValues={{}}
        onSubmit={handleAddCard}
        onClose={() => setShowForm(false)}
        submitText={isSubmitting ? 'Processing...' : 'Add Card'}
        cancelText="Cancel"
        cardClassName="card card-valentines"
        submitButtonColor={accent}
        loading={isSubmitting}
        showAddressBook={true}
        contacts={contacts}
        shareMembers={shareMembers}
      />

      <FormModal
        isOpen={showEditModal}
        title="Edit Card"
        fields={formFields('edit')}
        initialValues={
          cardToEdit
            ? {
                recipient: cardToEdit.recipient || '',
                message: cardToEdit.message || '',
                address: cardToEdit.address || '',
                notes: cardToEdit.notes || '',
                assigned_to: cardToEdit.assignedTo || '',
              }
            : {}
        }
        onSubmit={handleEditSubmit}
        onClose={() => {
          setShowEditModal(false);
          setCardToEdit(null);
        }}
        submitText={isEditSubmitting ? 'Processing...' : 'Update Card'}
        cancelText="Cancel"
        cardClassName="card card-valentines"
        submitButtonColor={accent}
        loading={isEditSubmitting}
        showAddressBook={true}
        contacts={contacts}
        shareMembers={shareMembers}
      />

      <DeleteModal
        isOpen={showDeleteModal}
        title="Delete Card"
        itemName={cardToDelete?.recipient}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setCardToDelete(null);
        }}
        cardClassName="card card-valentines"
        confirmButtonColor={accent}
      />

      <SortModal
        isOpen={showSortModal}
        onClose={() => setShowSortModal(false)}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOptions={SORT_OPTIONS}
        title="Sort Cards"
      />

      <Toast
        message={toast?.message ?? ''}
        isVisible={!!toast}
        onClose={() => setToast(null)}
        type={toast?.type}
      />

      <Footer />
    </div>
  );
}
