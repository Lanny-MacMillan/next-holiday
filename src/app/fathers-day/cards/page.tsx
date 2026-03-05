'use client';

import { useState, useEffect } from 'react';
import {
  selectHolidayPreferences,
  selectHomeInitialized,
  selectHomeData,
} from '@/store/selectors/home';
import { getHolidayDataFromRedux } from '@/utils/holidayData';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState } from '@/store';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import { updateCardInHomeData, setHomeData } from '@/store/slices/homeSlice';
import { useFormModalMutation } from '@/hooks/useFormModalMutation';
import { transformCardPayload } from '@/utils/formTransformers';
import { getHolidayIdFromRoute } from '@/utils/holidayUtils';
import FormModal from '@/components/modals/FormModal';
import AddButton from '@/components/common/AddButton';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import MailCardStatus from '@/components/cards/MailCardStatus';
import MailCard from '@/components/cards/MailCard';
import TaskSection from '@/components/common/TaskSection';
import SortModal from '@/components/modals/SortModal';
import DeleteModal from '@/components/modals/DeleteModal';

export default function FathersDayCardsPage() {
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
  const currentState = useAppSelector((state: any) => state);

  // Get holiday ID for Father's Day - try to resolve from home data, fallback to route-based resolution
  const resolvedHolidayId = homeInitialized
    ? getHolidayIdFromRoute('/fathers-day', holidayPreferences)
    : getHolidayIdFromRoute('/fathers-day', holidayPreferences); // Allow fallback for cold entry

  // Get holiday data from Redux - single source of truth
  const holidayData = getHolidayDataFromRedux(resolvedHolidayId, currentState);

  // Use Redux data directly - no individual API calls needed
  const cards = holidayData?.cards || [];
  const isLoading = !homeInitialized;
  const error = null; // Error handling through home data loading

  const [showForm, setShowForm] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<any>(null);
  const [cardToEdit, setCardToEdit] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sortBy, setSortBy] = useState('recipient');

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

  // Form fields configuration for cards
  const formFields = [
    {
      id: 'recipient',
      type: 'text' as const,
      label: 'Recipient',
      placeholder: "Recipient's name",
      required: true,
    },
    {
      id: 'message',
      type: 'textarea' as const,
      label: 'Message',
      placeholder: 'Write your holiday message here...',
      rows: 3,
    },
    {
      id: 'address',
      type: 'textarea' as const,
      label: 'Address',
      placeholder: "Recipient's address...",
      rows: 2,
    },
  ];

  return (
    <div className="min-h-screen fathers-day-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Fathers Day Cards"
        backHref="/fathers-day"
        onSortClick={() => setShowSortModal(true)}
        description="Keep track of your Fathers Day cards!"
        holidayColor="blue-500"
        error={mutationError ? 'API Error' : undefined}
        sortTitle="Sort Cards"
      />

      <main className="w-full max-w-4xl flex flex-col gap-6">
        {/* Summary Stats */}
        <MailCardStatus
          totalCards={cards.length}
          completedCards={completedCards.length}
          incompleteCards={incompleteCards.length}
          holidayColor="bg-gradient-to-br from-blue-300 to-blue-500"
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
              onClick={() => setShowForm(true)}
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
                  holidayColor="bg-gradient-to-br from-blue-300 to-blue-500"
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
                  holidayColor="bg-gradient-to-br from-blue-300 to-blue-500"
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
        onSubmit={handleAddCard}
        onClose={closeForm}
        submitText="Add Card"
        cancelText="Cancel"
        cardClassName="card card-valentines"
        submitButtonColor="#3b82f6"
        showAddressBook={true}
        contacts={contacts}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Card"
        fields={formFields}
        initialValues={cardToEdit}
        onSubmit={handleEditSubmit}
        onClose={() => {
          setShowEditModal(false);
          setCardToEdit(null);
        }}
        submitText="Update Card"
        cancelText="Cancel"
        cardClassName="card card-valentines"
        submitButtonColor="#3b82f6"
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
        confirmButtonColor="#3b82f6"
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
