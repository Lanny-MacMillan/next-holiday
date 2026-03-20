'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import { transformCardPayload } from '@/utils/formTransformers';
import { getHolidayIdFromRoute } from '@/utils/holidayUtils';
import { selectShareByHolidayKey } from '@/store/slices/sharesSlice';
import FormModal from '@/components/modals/FormModal';
import { getFormConfigEnhanced, getFormConfig } from '@/config/formConfigs';
import AddButton from '@/components/common/AddButton';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import Footer from '@/components/common/Footer';
import MailCardStatus from '@/components/cards/MailCardStatus';
import MailCard from '@/components/cards/MailCard';
import TaskSection from '@/components/common/TaskSection';
import SortModal from '@/components/modals/SortModal';
import DeleteModal from '@/components/modals/DeleteModal';

export default function ChristmasCardsPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

  // Use standardized hooks
  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();

  const {
    createCard,
    updateCard,
    deleteCard,
    createLoading,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  // Use standardized data refresh hook
  const { refreshHomeData } = useRefreshHomeData();

  // Enhanced Compatibility Layer
  const shareData = useAppSelector(state =>
    selectShareByHolidayKey(state, 'christmas'),
  );
  const shareMembers = shareData?.members || [];

  // Use memoized cards filtering from holiday data
  const cards = useMemo(() => holidayData?.cards || [], [holidayData?.cards]);
  const isLoading = !homeInitialized;
  const error = null; // Error handling through home data loading

  const [showForm, setShowForm] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<any>(null);
  const [cardToEdit, setCardToEdit] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sortBy, setSortBy] = useState('recipient');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  async function handleAddCard(values: Record<string, any>) {
    if (!values.recipient?.trim() || !values.message?.trim()) return;
    if (!holidayId || !auth0User) return;

    setIsSubmitting(true);
    try {
      const payload = transformCardPayload(values, contacts);

      // Use the standardized hook function
      await createCard(payload);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowForm(false);
    } catch (error) {
      console.error('Error creating card:', error);
      // Handle error (could show a toast notification)
    } finally {
      setIsSubmitting(false);
    }
  }

  function openForm() {
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  const handleDeleteCard = async (cardId: string) => {
    const card = cards.find((c: any) => c.id === cardId);
    setCardToDelete(card);
    setShowDeleteModal(true);
  };

  const handleEditCard = async (card: any) => {
    setCardToEdit(card);
    setShowEditModal(true);
  };

  const confirmDelete = async () => {
    if (cardToDelete && holidayId && auth0User) {
      try {
        // Use the standardized hook function
        await deleteCard(cardToDelete.id, cardToDelete);

        // Refresh home data to ensure UI is in sync
        await refreshHomeData(auth0User, holidayId);

        setShowDeleteModal(false);
        setCardToDelete(null);
      } catch (error) {
        console.error('Error deleting card:', error);
      }
    }
  };

  const handleEditSubmit = async (values: Record<string, any>) => {
    if (!cardToEdit || !holidayId || !auth0User) return;

    setIsEditSubmitting(true);
    try {
      const payload = transformCardPayload(values, contacts);

      // Use the standardized hook function
      await updateCard(cardToEdit.id, payload);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowEditModal(false);
      setCardToEdit(null);
    } catch (error) {
      console.error('Error updating card:', error);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleToggleCompletion = async (cardId: string) => {
    try {
      const card = cards.find((c: any) => c.id === cardId);
      if (card && holidayId && auth0User) {
        // Use the standardized hook function
        await updateCard(cardId, {
          recipient: card.recipient,
          message: card.message || '',
          address: card.address || '',
          isCompleted: !card.isCompleted,
        });

        // Refresh home data to ensure UI is in sync
        await refreshHomeData(auth0User, holidayId);
      }
    } catch (error) {
      console.error('Error toggling card completion:', error);
    }
  };

  const sortedCards = [...cards].sort((a: any, b: any) => {
    switch (sortBy) {
      case 'recipient':
        return a.recipient.localeCompare(b.recipient);
      case 'completed':
        return a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1;
      case 'message':
        return (a.message || '').localeCompare(b.message || '');
      default:
        return 0;
    }
  });

  const completedCards = cards.filter((card: any) => card.isCompleted);
  const incompleteCards = cards.filter((card: any) => !card.isCompleted);

  // Enhanced Compatibility Layer provides dynamic form configuration

  return (
    <div className="min-h-screen christmas-cards-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Christmas Cards"
        backHref="/christmas"
        onSortClick={() => setShowSortModal(true)}
        description="Keep track of your cards!"
        holidayColor="red-500"
        error={error ? 'Failed to load cards' : undefined}
        sortTitle="Sort Cards"
      />

      <main className="w-full max-w-4xl flex flex-col gap-6">
        {/* Summary Stats */}
        <MailCardStatus
          totalCards={cards.length}
          completedCards={completedCards.length}
          incompleteCards={incompleteCards.length}
          holidayColor="bg-gradient-to-br from-red-300 to-red-500"
        />

        <AddButton title="Card" onClick={openForm} color="red" />

        {/* Card List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Loading cards...</p>
          </div>
        ) : sortedCards.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No cards added yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
              renderItem={card => (
                <MailCard
                  key={card.id}
                  card={card}
                  onToggleCompletion={handleToggleCompletion}
                  onEditCard={handleEditCard}
                  onDeleteCard={handleDeleteCard}
                  holidayColor="bg-gradient-to-br from-red-300 to-red-500"
                />
              )}
            />

            <TaskSection
              title="Sent Cards"
              items={completedCards}
              isCompleted={true}
              emptyMessage="No cards sent yet."
              completedMessage="No sent cards to display."
              renderItem={card => (
                <MailCard
                  key={card.id}
                  card={card}
                  onToggleCompletion={handleToggleCompletion}
                  onEditCard={handleEditCard}
                  onDeleteCard={handleDeleteCard}
                  holidayColor="bg-gradient-to-br from-red-300 to-red-500"
                />
              )}
            />
          </div>
        )}
      </main>

      {/* Add Card Modal */}
      <FormModal
        isOpen={showForm}
        title="Add New Card"
        fields={
          getFormConfigEnhanced('cards', 'add', {
            holidayKey: 'christmas',
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        initialValues={{}}
        onSubmit={handleAddCard}
        onClose={closeForm}
        submitText={isSubmitting ? 'Processing...' : 'Add Card'}
        cancelText="Cancel"
        cardClassName="card card-valentines"
        submitButtonColor="#ef4444"
        loading={isSubmitting}
        showAddressBook={true}
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Edit Card Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Card"
        fields={
          getFormConfigEnhanced('cards', 'edit', {
            holidayKey: 'christmas',
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
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
        submitButtonColor="#ef4444"
        loading={isEditSubmitting}
        showAddressBook={true}
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Delete Modal */}
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
        confirmButtonColor="#ef4444"
      />

      {/* Sort Modal */}
      <SortModal
        isOpen={showSortModal}
        onClose={() => setShowSortModal(false)}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOptions={[
          { value: 'recipient', label: 'Recipient' },
          { value: 'completed', label: 'Completion Status' },
          { value: 'message', label: 'Message' },
        ]}
        title="Sort Cards"
      />
      <Footer />
    </div>
  );
}
