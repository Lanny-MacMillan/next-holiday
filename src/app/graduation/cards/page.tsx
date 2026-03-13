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

export default function GraduationCardsPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

  // Use new standardized hooks
  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();

  const {
    createTask,
    updateTask,
    deleteTask,
    createLoading,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  const { refreshHomeData } = useRefreshHomeData();

  // Filter cards from holiday data using Cards category
  const cards = useMemo(
    () => holidayData?.tasks?.filter((task: any) => task.category === 'Cards') || [],
    [holidayData?.tasks],
  );

  const isLoading = !homeInitialized;

  // State management
  const [showForm, setShowForm] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<any>(null);
  const [cardToEdit, setCardToEdit] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sortBy, setSortBy] = useState('recipient');

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // CRUD Operations using new hooks
  const handleAddCard = async (values: Record<string, any>) => {
    if (!values.recipient?.trim() || !values.message?.trim()) return;
    if (!holidayId) return;

    try {
      const transformedPayload = transformCardPayload(values, contacts);
      const payload = {
        title: `Card for ${values.recipient}`,
        category: 'Cards',
        priority: 'medium' as const,
        ...transformedPayload,
      };

      await createTask(payload);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowForm(false);
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };

  const confirmDelete = async () => {
    if (!cardToDelete || !holidayId) return;

    try {
      await deleteTask(cardToDelete.id);

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
      const transformedPayload = transformCardPayload(values, contacts);
      const payload = {
        title: `Card for ${values.recipient}`,
        category: 'Cards',
        priority: 'medium' as const,
        ...transformedPayload,
      };

      await updateTask(cardToEdit.id, payload);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowEditModal(false);
      setCardToEdit(null);
    } catch (error) {
      console.error('Error updating card:', error);
    }
  };

  const handleToggleCompletion = async (cardId: string) => {
    const card = cards.find((c: any) => c.id === cardId);
    if (!card || !holidayId) return;

    try {
      await updateTask(cardId, {
        isCompleted: !card.isCompleted,
      });

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Error toggling card completion:', error);
    }
  };

  // Helper functions
  const openForm = () => setShowForm(true);
  const closeForm = () => setShowForm(false);

  const handleDeleteCard = (cardId: string) => {
    const card = cards.find((c: any) => c.id === cardId);
    setCardToDelete(card);
    setShowDeleteModal(true);
  };

  const handleEditCard = (card: any) => {
    setCardToEdit(card);
    setShowEditModal(true);
  };

  // Loading state from hooks
  const loading = createLoading || updateLoading || deleteLoading;

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

  // Transform task data to card format for MailCard component
  const transformTaskToCard = (task: any) => {
    // Extract recipient from title "Card for [Recipient Name]"
    const recipient = task.title?.replace(/^Card for /, '') || 'Unknown';

    return {
      ...task,
      recipient,
      message: task.message || task.description || '',
      address: task.address || '',
    };
  };

  // Form fields configuration for cards
  const getEditInitialValues = (card: any) => {
    if (!card) return {};

    console.log('Card data for editing:', card); // Debug log

    // Extract recipient from title "Card for [Recipient Name]"
    const recipientFromTitle = card.title?.replace(/^Card for /, '') || '';

    return {
      recipient: card.recipient || recipientFromTitle,
      message: card.message || card.description || '',
      address: card.address || '',
    };
  };

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
      placeholder: 'Write your graduation message here...',
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
    <div className="min-h-screen graduation-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Graduation Cards"
        backHref="/graduation"
        onSortClick={() => setShowSortModal(true)}
        description="Keep track of your Graduation cards!"
        holidayColor="purple-500"
        error={undefined}
        sortTitle="Sort Cards"
      />

      <main className="w-full max-w-4xl flex flex-col gap-6">
        {/* Summary Stats */}
        <MailCardStatus
          totalCards={cards.length}
          completedCards={completedCards.length}
          incompleteCards={incompleteCards.length}
          holidayColor="bg-gradient-to-br from-purple-300 to-purple-500"
        />

        <AddButton title="Card" onClick={openForm} color="purple" />

        {/* Card List */}

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
                card={transformTaskToCard(card)}
                onToggleCompletion={handleToggleCompletion}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
                holidayColor="bg-gradient-to-br from-purple-300 to-purple-500"
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
                card={transformTaskToCard(card)}
                onToggleCompletion={handleToggleCompletion}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
                holidayColor="bg-gradient-to-br from-purple-300 to-purple-500"
              />
            )}
          />
        </div>
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
        submitButtonColor="#8b5cf6"
        showAddressBook={true}
        contacts={contacts}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Card"
        fields={formFields}
        initialValues={getEditInitialValues(cardToEdit)}
        onSubmit={handleEditSubmit}
        onClose={() => {
          setShowEditModal(false);
          setCardToEdit(null);
        }}
        submitText="Update Card"
        cancelText="Cancel"
        cardClassName="card card-valentines"
        submitButtonColor="#8b5cf6"
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
        confirmButtonColor="#8b5cf6"
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
