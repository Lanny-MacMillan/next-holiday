'use client';

import { useState, useEffect } from 'react';
import {
  selectHolidayPreferences,
  selectHomeInitialized,
  selectHomeData,
  selectHolidayPrefById,
} from '@/store/selectors/home';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState } from '@/store';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import { updateCardInHomeData, setHomeData } from '@/store/slices/homeSlice';
import { useFormModalMutation } from '@/hooks/useFormModalMutation';
import { transformCardPayload } from '@/utils/formTransformers';
import { getHolidayIdFromRoute } from '@/utils/holidayUtils';
import { selectShareByHolidayKey } from '@/store/slices/sharesSlice';
import FormModal from '@/components/modals/FormModal';
import { getFormConfigEnhanced, getFormConfig } from '@/config/formConfigs';
import AddButton from '@/components/common/AddButton';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import MailCardStatus from '@/components/cards/MailCardStatus';
import MailCard from '@/components/cards/MailCard';
import TaskSection from '@/components/common/TaskSection';
import SortModal from '@/components/modals/SortModal';
import DeleteModal from '@/components/modals/DeleteModal';

export default function ChristmasCardsPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);
  const {
    holidayId,
    mutation,
    isLoading: mutationLoading,
    error: mutationError,
    auth0User,
  } = useFormModalMutation();

  // Get Redux selectors
  const holidayPreferences = useAppSelector(selectHolidayPreferences);
  const homeInitialized = useAppSelector(selectHomeInitialized);
  const homeData = useAppSelector(selectHomeData);

  // Get current Redux state for skip logic
  // Get holiday ID for Christmas - try to resolve from home data, fallback to route-based resolution
  const resolvedHolidayId = homeInitialized
    ? getHolidayIdFromRoute('/christmas', holidayPreferences)
    : getHolidayIdFromRoute('/christmas', holidayPreferences); // Allow fallback for cold entry

  const holidayData = useAppSelector(state =>
    selectHolidayPrefById(state, resolvedHolidayId),
  );

  // Get share members for Enhanced Compatibility Layer
  const shareData = useAppSelector(state =>
    selectShareByHolidayKey(state, 'christmas'),
  );
  const shareMembers = shareData?.members || [];

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

  // Get holiday data from Redux - single source of truth

  // Use Redux data directly - no individual API calls needed
  const cardsData = holidayData?.cards || [];
  const cards = cardsData.map(transformCardWithAssignment);
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

  // Function to refresh home data after mutations
  async function refreshHomeData() {
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
  }

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  async function handleAddCard(values: Record<string, any>) {
    if (!values.recipient?.trim() || !values.message?.trim()) return;
    if (!resolvedHolidayId || !mutation) return;

    setIsSubmitting(true);
    try {
      const payload = transformCardPayload(values, contacts);
      await mutation({
        holidayId: resolvedHolidayId || '',
        payload,
        auth0User,
      }).unwrap();

      // Refresh home data to ensure UI is in sync
      await refreshHomeData();

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
    const card = cards.find(c => c.id === cardId);
    setCardToDelete(card);
    setShowDeleteModal(true);
  };

  const handleEditCard = async (card: any) => {
    setCardToEdit(card);
    setShowEditModal(true);
  };

  const confirmDelete = async () => {
    if (cardToDelete && mutation) {
      try {
        await mutation({
          holidayId: resolvedHolidayId || '',
          payload: {
            id: cardToDelete.id,
            action: 'delete',
            recipient: cardToDelete.recipient,
            message: cardToDelete.message || '',
            address: cardToDelete.address || '',
          },
          auth0User,
        }).unwrap();

        // Refresh home data to ensure UI is in sync
        await refreshHomeData();

        setShowDeleteModal(false);
        setCardToDelete(null);
      } catch (error) {
        console.error('Error deleting card:', error);
      }
    }
  };

  const handleEditSubmit = async (values: Record<string, any>) => {
    if (cardToEdit && mutation) {
      setIsEditSubmitting(true);
      try {
        const payload = {
          ...transformCardPayload(values, contacts),
          id: cardToEdit.id,
          action: 'update',
        };

        // Optimistically update the Redux home data
        dispatch(
          updateCardInHomeData({
            holidayId: resolvedHolidayId || '',
            cardId: cardToEdit.id,
            updates: {
              recipient: values.recipient,
              message: values.message,
              address: values.address,
            },
          }),
        );

        await mutation({
          holidayId: resolvedHolidayId || '',
          payload,
          auth0User,
        }).unwrap();

        // Refresh home data to ensure UI is in sync
        await refreshHomeData();

        setShowEditModal(false);
        setCardToEdit(null);
      } catch (error) {
        console.error('Error updating card:', error);
        // Revert the optimistic update on error
        dispatch(
          updateCardInHomeData({
            holidayId: resolvedHolidayId || '',
            cardId: cardToEdit.id,
            updates: {
              recipient: cardToEdit.recipient,
              message: cardToEdit.message,
              address: cardToEdit.address,
            },
          }),
        );
      } finally {
        setIsEditSubmitting(false);
      }
    }
  };

  const handleToggleCompletion = async (cardId: string) => {
    if (mutation) {
      try {
        const card = cards.find(c => c.id === cardId);
        if (card) {
          const payload = {
            id: cardId,
            action: 'update',
            isCompleted: !card.isCompleted,
            recipient: card.recipient,
            message: card.message || '',
            address: card.address || '',
          };

          // Optimistically update the Redux home data
          dispatch(
            updateCardInHomeData({
              holidayId: resolvedHolidayId || '',
              cardId: cardId,
              updates: { isCompleted: !card.isCompleted },
            }),
          );

          await mutation({
            holidayId: resolvedHolidayId || '',
            payload,
            auth0User,
          }).unwrap();
        }
      } catch (error) {
        console.error('Error toggling card completion:', error);
        // Revert the optimistic update on error
        const card = cards.find(c => c.id === cardId);
        if (card) {
          dispatch(
            updateCardInHomeData({
              holidayId: resolvedHolidayId || '',
              cardId: cardId,
              updates: { isCompleted: card.isCompleted },
            }),
          );
        }
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

  const completedCards = cards.filter(card => card.isCompleted);
  const incompleteCards = cards.filter(card => !card.isCompleted);

  // Enhanced Compatibility Layer provides dynamic form configuration

  return (
    <div className="min-h-screen christmas-cards-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Christmas Cards"
        backHref="/christmas"
        onSortClick={() => setShowSortModal(true)}
        description="Keep track of your cards!"
        holidayColor="red-500"
        error={mutationError ? 'API Error' : undefined}
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

      <footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
        &copy; {new Date().getFullYear()} Next Holiday
      </footer>
    </div>
  );
}
