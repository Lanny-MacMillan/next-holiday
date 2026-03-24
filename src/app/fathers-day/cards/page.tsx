'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import { transformCardPayload } from '@/utils/formTransformers';
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
import { getFormConfigEnhanced } from '@/config/formConfigs';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { RootState } from '@/store';
import { getDeleteConfig } from '@/config/deleteModalConfigs';

// Helper function to extract recipient from task title
function extractRecipientFromTitle(title: string): string {
  // Extract recipient from "Card for [Name]" format
  const match = title?.match(/Card for (.+)/);
  return match ? match[1] : title || 'Unknown';
}

export default function FathersDayCardsPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

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

  const { refreshHomeData } = useRefreshHomeData();

  // Get share members for Enhanced Compatibility Layer
  const shareData = useAppSelector((state: RootState) =>
    selectShareByHolidayKey(state, 'fathers-day'),
  );
  const baseMembers = shareData?.members || [];
  const shareMembers = baseMembers;

  // Helper function to resolve assignedTo UUID to user name
  const getAssignedUserName = (assignedToUuid: string): string | null => {
    if (!assignedToUuid || !shareMembers.length) return null;
    const member = shareMembers.find((m: any) => m.uuid === assignedToUuid);
    return member ? member.name || member.email || 'Unknown User' : assignedToUuid;
  };

  // Transform cards to include assignedToName for display
  const transformCardWithAssignment = (card: any) => ({
    ...card,
    assignedToName: card.assignedTo ? getAssignedUserName(card.assignedTo) : null,
  });

  // Use direct cards data from holiday data like Christmas
  const cards = useMemo(
    () => (holidayData?.cards || []).map(transformCardWithAssignment),
    [holidayData?.cards, shareMembers],
  );
  const isLoading = !homeInitialized;
  const error = null;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<any>(null);
  const [cardToEdit, setCardToEdit] = useState<any>(null);
  const [sortBy, setSortBy] = useState('recipient');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('error');

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  async function handleAddCard(values: Record<string, any>) {
    if (!values.recipient?.trim() || !values.message?.trim()) {
      setToastMessage('Please fill in both Recipient and Message fields');
      setToastType('error');
      setShowToast(true);
      return;
    }
    if (!holidayId) return;
    setIsSubmitting(true);
    try {
      const payload = transformCardPayload(values, contacts, shareMembers);

      await createCard(payload);

      // Refresh contacts to include any newly created ones
      dispatch(fetchContacts());

      await refreshHomeData(auth0User, holidayId);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating card:', error);
      setToastMessage('Error creating card. Please try again.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  function openForm() {
    setShowAddModal(true);
  }

  function closeForm() {
    setShowAddModal(false);
  }

  function closeEditModal() {
    setShowEditModal(false);
    setCardToEdit(null);
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
    if (cardToDelete && holidayId) {
      try {
        await deleteCard(cardToDelete.id, cardToDelete);
        await refreshHomeData(auth0User, holidayId);
        setShowDeleteModal(false);
        setCardToDelete(null);
      } catch (error) {
        console.error('Error deleting card:', error);
        setToastMessage('Error deleting card. Please try again.');
        setToastType('error');
        setShowToast(true);
      }
    }
  };

  const handleEditSubmit = async (values: Record<string, any>) => {
    if (!cardToEdit || !holidayId) return;
    setIsEditSubmitting(true);
    try {
      // Use enhanced transformCardPayload for consistent handling
      const payload = transformCardPayload(values, contacts, shareMembers);

      await updateCard(cardToEdit.id, payload);
      await refreshHomeData(auth0User, holidayId);
      setShowEditModal(false);
      setCardToEdit(null);
    } catch (error) {
      console.error('Error updating card:', error);
      setToastMessage('Error updating card. Please try again.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleToggleCompletion = async (cardId: string) => {
    if (holidayId) {
      try {
        const card = cards.find((c: any) => c.id === cardId);
        if (card) {
          // Include all required fields when updating completion status
          await updateCard(cardId, {
            recipient: card.recipient,
            message: card.message,
            address: card.address || '',
            contact_id: card.contact_id || null,
            assigned_to: card.assignedTo || null,
            isCompleted: !card.isCompleted,
          });
          await refreshHomeData(auth0User, holidayId);
        }
      } catch (error) {
        console.error('Error toggling card completion:', error);
        setToastMessage('Error updating card status. Please try again.');
        setToastType('error');
        setShowToast(true);
      }
    }
  };

  const sortedCards = [...cards].sort((a, b) => {
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

  // Enhanced Compatibility Layer for form configuration
  const addFormConfig = getFormConfigEnhanced('cards', 'add', {
    holidayKey: 'fathers-day',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('cards', 'edit', {
    holidayKey: 'fathers-day',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const deleteConfig = getDeleteConfig('cards');

  return (
    <div className="min-h-screen fathers-day-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Fathers Day Cards"
        backHref="/fathers-day"
        onSortClick={() => setShowSortModal(true)}
        description="Keep track of your Fathers Day cards!"
        holidayColor="blue-500"
        error={error ? 'API Error' : undefined}
        sortTitle="Sort Cards"
      />

      <main className="w-full max-w-4xl flex flex-col gap-6">
        {/* Summary Stats */}
        <MailCardStatus
          totalCards={cards.length}
          completedCards={completedCards.length}
          incompleteCards={incompleteCards.length}
          holidayColor="bg-gradient-to-br from-blue-400 to-blue-600"
        />

        <AddButton title="Card" onClick={openForm} color="blue" />

        {/* Card List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Loading cards...</p>
          </div>
        ) : sortedCards.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No cards added yet.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
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
                  holidayColor="bg-gradient-to-br from-blue-400 to-blue-600"
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
                  holidayColor="bg-gradient-to-br from-blue-400 to-blue-600"
                />
              )}
            />
          </div>
        )}
      </main>

      {/* Add Modal */}
      <FormModal
        isOpen={showAddModal}
        title="Add New Card"
        fields={addFormConfig.fields}
        onSubmit={handleAddCard}
        onClose={closeForm}
        loading={isSubmitting}
        submitText={isSubmitting ? 'Processing...' : 'Add Card'}
        cancelText="Cancel"
        cardClassName="card card-valentines"
        submitButtonColor="#3b82f6"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Card"
        fields={editFormConfig.fields}
        initialValues={{
          recipient: cardToEdit?.recipient || '',
          message: cardToEdit?.message || cardToEdit?.description || '',
          address: cardToEdit?.address || '',
          assigned_to: cardToEdit?.assignedTo || '',
        }}
        onSubmit={handleEditSubmit}
        onClose={closeEditModal}
        loading={isEditSubmitting}
        submitText={isEditSubmitting ? 'Processing...' : 'Update Card'}
        cancelText="Cancel"
        cardClassName="card card-valentines"
        submitButtonColor="#3b82f6"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setCardToDelete(null);
        }}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title={deleteConfig.title}
        message={deleteConfig.message}
        itemName={cardToDelete?.recipient}
        confirmText={deleteConfig.confirmText}
        cancelText={deleteConfig.cancelText}
        confirmButtonColor={deleteConfig.confirmButtonColor}
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

      {/* Toast Notifications */}
      <Toast
        isVisible={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
      />

      <Footer />
    </div>
  );
}
