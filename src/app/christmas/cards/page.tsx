'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';

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
import Toast from '@/components/common/Toast';

export default function ChristmasCardsPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

  // Use standardized hooks
  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();

  const {
    createCard,
    updateCard,
    editCard, // ✅ Add editCard for field editing
    deleteCard,
    createLoading,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  // Use standardized data refresh hook

  // Enhanced Compatibility Layer - Get share members with current user inclusion
  const shareData = useAppSelector(state =>
    selectShareByHolidayKey(state, 'christmas'),
  );
  const baseMembers = shareData?.members || [];

  // Always include current user in shareMembers for assignTo functionality
  const shareMembers = auth0User
    ? [
        // Add current user first
        {
          userId: auth0User.sub || '',
          uuid: auth0User.id || '', // Database UUID for Enhanced Compatibility Layer
          name: auth0User.name || 'Me',
          email: auth0User.email || '',
          role: 'owner' as const,
        },
        // Add other members, filtering out current user if already present
        ...baseMembers
          .filter((member: any) => member.userId !== auth0User.sub)
          .map((member: any) => ({
            ...member,
            uuid: member.uuid || member.userId, // Preserve existing uuid, fallback to userId only if needed
          })),
      ]
    : baseMembers;

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

  // Use memoized cards filtering from holiday data with assignment names
  const cards = useMemo(
    () => (holidayData?.cards || []).map(transformCardWithAssignment),
    [holidayData?.cards, shareMembers],
  );
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

  // Toast state for error messages
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('error');

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  async function handleAddCard(values: Record<string, any>) {
    if (!values.recipient?.trim() || !values.message?.trim()) return;
    if (!holidayId || !auth0User) return;

    setIsSubmitting(true);
    try {
      const payload = transformCardPayload(values, contacts, shareMembers);

      // Use the standardized hook function
      await createCard(payload);

      // Refresh contacts to include any newly created ones
      dispatch(fetchContacts());

      setShowForm(false);
    } catch (error) {
      console.error('Error creating card:', error);

      // Show user-friendly error message with Toast
      let errorMessage = 'Error creating card. Please try again.';

      if (error instanceof Error) {
        if (
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
        await deleteCard(cardToDelete.id);

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
      const payload = transformCardPayload(values, contacts, shareMembers);

      // ✅ Use editCard for field editing (not updateCard)
      await editCard(cardToEdit.id, payload);

      setShowEditModal(false);
      setCardToEdit(null);
    } catch (error) {
      console.error('Error updating card:', error);

      // Show user-friendly error message with Toast
      let errorMessage = 'Error updating card. Please try again.';

      if (error instanceof Error) {
        if (
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
  };

  const handleToggleCompletion = async (cardId: string) => {
    try {
      const card = cards.find((c: any) => c.id === cardId);
      if (card && holidayId && auth0User) {
        // ✅ Use updateCard for completion toggling only (simplified)
        await updateCard(cardId, !card.isCompleted);
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

      {/* Toast for error messages */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        type={toastType}
      />

      <Footer />
    </div>
  );
}
