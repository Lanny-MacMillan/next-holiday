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
    createTask,
    updateTask,
    deleteTask,
    createLoading,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  const { refreshHomeData } = useRefreshHomeData();

  // Cards are stored as tasks with category 'Cards'
  const cards = useMemo(() => {
    const cardTasks =
      holidayData?.tasks?.filter((task: any) => task.category === 'Cards') || [];

    // Map task structure to card structure for MailCard component
    return cardTasks.map((task: any) => ({
      id: task.id,
      recipient: task.recipient || extractRecipientFromTitle(task.title),
      message: task.message || task.description || '',
      address: task.address || '',
      notes: task.notes || '',
      isCompleted: task.isCompleted || false,
      // Keep original task data for reference
      ...task,
    }));
  }, [holidayData?.tasks]);
  const isLoading = !homeInitialized;
  const error = null;

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

  async function handleAddCard(values: Record<string, any>) {
    if (!values.recipient?.trim() || !values.message?.trim()) return;
    if (!holidayId) return;

    try {
      const transformedPayload = transformCardPayload(values, contacts);
      const payload = {
        title: `Card for ${values.recipient}`,
        description: values.message || '',
        category: 'Cards',
        priority: 'medium' as const,
        ...transformedPayload,
      };

      await createTask(payload);
      await refreshHomeData(auth0User, holidayId);
      setShowForm(false);
    } catch (error) {
      console.error('Error creating card:', error);
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
        await deleteTask(cardToDelete.id);
        await refreshHomeData(auth0User, holidayId);
        setShowDeleteModal(false);
        setCardToDelete(null);
      } catch (error) {
        console.error('Error deleting card:', error);
      }
    }
  };

  const handleEditSubmit = async (values: Record<string, any>) => {
    if (cardToEdit && holidayId) {
      try {
        const transformedPayload = transformCardPayload(values, contacts);
        const payload = {
          title: `Card for ${values.recipient}`,
          description: values.message || '',
          category: 'Cards',
          priority: 'medium' as const,
          ...transformedPayload,
        };

        await updateTask(cardToEdit.id, payload);
        await refreshHomeData(auth0User, holidayId);
        setShowEditModal(false);
        setCardToEdit(null);
      } catch (error) {
        console.error('Error updating card:', error);
      }
    }
  };

  const handleToggleCompletion = async (cardId: string) => {
    if (holidayId) {
      try {
        const card = cards.find((c: any) => c.id === cardId);
        if (card) {
          await updateTask(cardId, {
            isCompleted: !card.isCompleted,
          });
          await refreshHomeData(auth0User, holidayId);
        }
      } catch (error) {
        console.error('Error toggling card completion:', error);
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
        error={error ? 'API Error' : undefined}
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
      <Footer />
    </div>
  );
}
