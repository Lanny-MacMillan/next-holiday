'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState } from '@/store';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useSubscription } from '@/hooks/useSubscription';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import { transformCardPayload } from '@/utils/formTransformers';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { getFormConfigEnhanced } from '@/config/formConfigs';
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

export default function ValentinesCardsPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);
  const { isUserPlusMember, hasSubscription } = useSubscription();

  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();

  const {
    createCard,
    editCard,
    updateCard,
    deleteCard,
    createLoading,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'valentines'),
  );
  const isAuthorizedForSharing = hasSubscription && isUserPlusMember;

  // Enhanced Compatibility Layer - Get share members with current user inclusion
  const shareData = useAppSelector((state: RootState) =>
    selectShareByHolidayKey(state, 'valentines'),
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

  // Use direct cards data from holiday data
  const cards = useMemo(
    () => (holidayData?.cards || []).map(transformCardWithAssignment),
    [holidayData?.cards, shareMembers],
  );
  const isLoading = !homeInitialized;
  const error = null;

  const [showForm, setShowForm] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<any>(null);
  const [cardToEdit, setCardToEdit] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sortBy, setSortBy] = useState('recipient');
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    if (!holidayId || !auth0User) return;

    try {
      setIsAdding(true);
      // Use enhanced transformCardPayload for flexible contact creation and address population
      const payload = transformCardPayload(values, contacts, shareMembers);

      // Use the card API instead of task API
      await createCard(payload);

      // Refresh contacts to include any newly created ones
      dispatch(fetchContacts());

      setShowForm(false);
    } catch (error) {
      console.error('Error creating card:', error);
      setToastMessage('Error creating card. Please try again.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsAdding(false);
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
    if (cardToDelete && holidayId) {
      try {
        setIsDeleting(true);
        await deleteCard(cardToDelete.id);

        setShowDeleteModal(false);
        setCardToDelete(null);
      } catch (error) {
        console.error('Error deleting card:', error);
        setToastMessage('Error deleting card. Please try again.');
        setToastType('error');
        setShowToast(true);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEditSubmit = async (values: Record<string, any>) => {
    if (cardToEdit && holidayId && auth0User) {
      try {
        setIsUpdating(true);
        // Use enhanced transformCardPayload for consistent handling
        const payload = transformCardPayload(values, contacts, shareMembers);

        await editCard(cardToEdit.id, payload);

        setShowEditModal(false);
        setCardToEdit(null);
      } catch (error) {
        console.error('Error updating card:', error);
        setToastMessage('Error updating card. Please try again.');
        setToastType('error');
        setShowToast(true);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleToggleCompletion = async (cardId: string) => {
    try {
      const card = cards.find((c: any) => c.id === cardId);
      if (card && holidayId && auth0User) {
        // Use the standardized hook function
        await updateCard(cardId, !card.isCompleted);
      }
    } catch (error) {
      console.error('Error toggling card completion:', error);
      setToastMessage('Error updating card status. Please try again.');
      setToastType('error');
      setShowToast(true);
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

  const loading = createLoading || updateLoading || deleteLoading;

  // Form fields configuration using Enhanced Compatibility Layer
  const formFields = getFormConfigEnhanced('cards', 'add', {
    holidayKey: 'valentines',
    shareMembers: shareMembers,
    auth0User: auth0User,
  }).fields;

  return (
    <div className="min-h-screen valentines-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Valentines Cards"
        backHref="/valentines"
        onSortClick={() => setShowSortModal(true)}
        description="Keep track of your Valentines cards!"
        holidayColor="pink-500"
        error={error ? 'API Error' : undefined}
        sortTitle="Sort Cards"
      />

      <main className="w-full max-w-4xl flex flex-col gap-6">
        {/* Summary Stats */}
        <MailCardStatus
          totalCards={cards.length}
          completedCards={completedCards.length}
          incompleteCards={incompleteCards.length}
          holidayColor="bg-gradient-to-br from-pink-400 to-pink-600"
        />

        <AddButton title="Card" onClick={openForm} color="pink" />

        {/* Card List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Loading cards...</p>
          </div>
        ) : sortedCards.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No cards added yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
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
                  holidayColor="bg-gradient-to-br from-pink-400 to-pink-600"
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
                  holidayColor="bg-gradient-to-br from-pink-300 to-pink-500"
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
        fields={formFields}
        shareMembers={shareMembers}
        onSubmit={handleAddCard}
        onClose={closeForm}
        loading={createLoading}
        submitText={createLoading ? 'Adding...' : 'Add Card'}
        cancelText="Cancel"
        cardClassName="card card-valentines"
        submitButtonColor="#ec4899"
        showAddressBook={true}
        contacts={contacts}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Card"
        fields={formFields}
        shareMembers={shareMembers}
        initialValues={
          cardToEdit
            ? {
                recipient: cardToEdit.recipient || '',
                message: cardToEdit.message || cardToEdit.description || '',
                address: cardToEdit.address || '',
                assigned_to: cardToEdit.assignedTo || '',
              }
            : undefined
        }
        onSubmit={handleEditSubmit}
        onClose={() => {
          setShowEditModal(false);
          setCardToEdit(null);
        }}
        loading={updateLoading}
        submitText={updateLoading ? 'Updating...' : 'Update Card'}
        cancelText="Cancel"
        cardClassName="card card-valentines"
        submitButtonColor="#ec4899"
        showAddressBook={true}
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
        cardClassName="card card-valentines"
        confirmButtonColor="#ec4899"
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
