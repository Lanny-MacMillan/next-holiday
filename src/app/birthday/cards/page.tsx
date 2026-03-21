'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import {
  useCreateCardMutation,
  useCardOperationMutation,
  useDeleteCardMutation,
} from '@/store/api';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import FormModal from '@/components/modals/FormModal';
import AddButton from '@/components/common/AddButton';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import Footer from '@/components/common/Footer';
import MailCardStatus from '@/components/cards/MailCardStatus';
import MailCard from '@/components/cards/MailCard';
import TaskSection from '@/components/common/TaskSection';
import SortModal from '@/components/modals/SortModal';
import DeleteModal from '@/components/modals/DeleteModal';
import { getFormConfigEnhanced } from '@/config/formConfigs';

export default function BirthdayCardsPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();

  // Use card mutations instead of task mutations
  const [createCard, { isLoading: createLoading }] = useCreateCardMutation();
  const [cardOperation, { isLoading: updateLoading }] = useCardOperationMutation();
  const [deleteCard, { isLoading: deleteLoading }] = useDeleteCardMutation();

  const { refreshHomeData } = useRefreshHomeData();

  // Get cards from holiday data (using actual cards, not tasks)
  const cards = useMemo(() => holidayData?.cards || [], [holidayData?.cards]);

  const isLoading = !homeInitialized;
  const error = null; // Error handling through home data loading

  const [showForm, setShowForm] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<any>(null);
  const [cardToEdit, setCardToEdit] = useState<any>(null);
  const [sortBy, setSortBy] = useState('recipient');

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  async function handleAddCard(values: Record<string, any>) {
    if (!values.recipient?.trim() || !values.message?.trim()) return;
    if (!holidayId) return;

    try {
      // Use the cards API with proper payload structure
      const payload = {
        recipient: values.recipient,
        message: values.message || '',
        address: values.address || null,
      };

      await createCard({
        holidayId,
        payload,
        auth0User,
      }).unwrap();

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowForm(false);
    } catch (error) {
      console.error('Error creating card:', error);
      // Handle error (could show a toast notification)
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
    if (!cardToDelete || !holidayId) return;

    try {
      await deleteCard({
        holidayId,
        cardId: cardToDelete.id,
        auth0User,
      }).unwrap();

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowDeleteModal(false);
      setCardToDelete(null);
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const handleEditSubmit = async (values: Record<string, any>) => {
    if (!cardToEdit || !holidayId) return;

    try {
      const payload = {
        id: cardToEdit.id,
        action: 'update' as const,
        recipient: values.recipient,
        message: values.message || '',
        address: values.address || null,
      };

      await cardOperation({
        holidayId,
        payload,
        auth0User,
      }).unwrap();

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowEditModal(false);
      setCardToEdit(null);
    } catch (error) {
      console.error('Error updating card:', error);
    }
  };

  const handleToggleCompletion = async (cardId: string) => {
    if (!holidayId) return;

    try {
      const card = cards.find((c: any) => c.id === cardId);
      if (card) {
        const payload = {
          id: cardId,
          action: 'toggle' as const,
          recipient: card.recipient,
          message: card.message,
          address: card.address,
          isCompleted: !card.isCompleted,
        };

        await cardOperation({
          holidayId,
          payload,
          auth0User,
        }).unwrap();

        // Refresh home data to ensure UI is in sync
        await refreshHomeData(auth0User, holidayId);
      }
    } catch (error) {
      console.error('Error toggling card completion:', error);
    }
  };

  // Use only Redux data - cards are already in the correct format
  const displayCards = useMemo(() => {
    // Cards from the API are already in the correct format
    return cards.map((card: any) => ({
      id: card.id,
      recipient: card.recipient || '',
      message: card.message || '',
      address: card.address || '',
      notes: card.notes || '',
      isCompleted: card.isCompleted || false,
    }));
  }, [cards]);

  const sortedCards = [...displayCards].sort((a, b) => {
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

  const completedCards = displayCards.filter((card: any) => card.isCompleted);
  const incompleteCards = displayCards.filter((card: any) => !card.isCompleted);

  // Enhanced Compatibility Layer form config
  const formConfig = getFormConfigEnhanced('cards', 'add', {
    holidayKey: 'birthday',
    shareMembers: [],
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('cards', 'edit', {
    holidayKey: 'birthday',
    shareMembers: [],
    auth0User: auth0User,
  });

  return (
    <div className="min-h-screen birthday-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Birthday Cards"
        backHref="/birthday"
        onSortClick={() => setShowSortModal(true)}
        description="Keep track of your Birthday cards!"
        holidayColor="yellow-500"
        error={undefined}
        sortTitle="Sort Cards"
      />

      <main className="w-full max-w-4xl flex flex-col gap-6">
        {/* Summary Stats */}
        <MailCardStatus
          totalCards={displayCards.length}
          completedCards={completedCards.length}
          incompleteCards={incompleteCards.length}
          holidayColor="bg-gradient-to-br from-yellow-300 to-yellow-500"
        />

        <AddButton title="Card" onClick={openForm} color="amber" />

        {/* Card List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Loading cards...</p>
          </div>
        ) : sortedCards.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No cards added yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
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
                  holidayColor="bg-gradient-to-br from-yellow-300 to-yellow-500"
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
                  holidayColor="bg-gradient-to-br from-yellow-300 to-yellow-500"
                />
              )}
            />
          </div>
        )}
      </main>

      {/* Form Modal */}
      <FormModal
        isOpen={showForm}
        title="Add New Card"
        fields={formConfig.fields}
        onSubmit={handleAddCard}
        onClose={closeForm}
        loading={createLoading}
        submitText={createLoading ? 'Processing...' : 'Add Card'}
        cancelText="Cancel"
        cardClassName="card card-valentines"
        submitButtonColor="#f59e0b"
        contacts={contacts}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Card"
        fields={editFormConfig.fields}
        initialValues={{
          recipient: cardToEdit?.recipient || '',
          message: cardToEdit?.message || '',
          address: cardToEdit?.address || '',
        }}
        onSubmit={handleEditSubmit}
        onClose={() => {
          setShowEditModal(false);
          setCardToEdit(null);
        }}
        loading={updateLoading}
        submitText={updateLoading ? 'Processing...' : 'Update Card'}
        cancelText="Cancel"
        cardClassName="card card-valentines"
        submitButtonColor="#f59e0b"
        contacts={contacts}
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
        loading={deleteLoading}
        cardClassName="card card-valentines"
        confirmButtonColor="#f59e0b"
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
