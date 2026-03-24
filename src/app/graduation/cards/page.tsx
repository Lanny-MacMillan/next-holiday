'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { getFormConfigEnhanced } from '@/config/formConfigs';
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

export default function GraduationCardsPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'graduation'),
  );

  // Use new standardized hooks
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
  const shareData = useAppSelector((state: any) =>
    selectShareByHolidayKey(state, 'graduation'),
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

  // Use direct cards data from holiday data like Christmas
  const cards = useMemo(
    () => (holidayData?.cards || []).map(transformCardWithAssignment),
    [holidayData?.cards, shareMembers],
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

  // CRUD Operations using new hooks
  const handleAddCard = async (values: Record<string, any>) => {
    if (!values.recipient?.trim() || !values.message?.trim()) {
      setToastMessage('Please fill in both Recipient and Message fields');
      setToastType('error');
      setShowToast(true);
      return;
    }
    if (!holidayId) return;

    setIsSubmitting(true);
    try {
      // Use enhanced transformCardPayload for flexible contact creation and address population
      const payload = transformCardPayload(values, contacts, shareMembers);

      await createCard(payload);

      // Refresh contacts to include any newly created ones
      dispatch(fetchContacts());

      await refreshHomeData(auth0User, holidayId);
      setShowForm(false);
    } catch (error) {
      console.error('Error creating card:', error);
      setToastMessage('Error creating card. Please try again.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!cardToDelete || !holidayId) return;

    try {
      await deleteCard(cardToDelete.id, cardToDelete);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowDeleteModal(false);
      setCardToDelete(null);
    } catch (error) {
      console.error('Error deleting card:', error);
      setToastMessage('Error deleting card. Please try again.');
      setToastType('error');
      setShowToast(true);
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
    const card = cards.find((c: any) => c.id === cardId);
    if (!card || !holidayId) return;

    try {
      // Include all required fields when updating completion status
      await updateCard(cardId, {
        recipient: card.recipient,
        message: card.message,
        address: card.address || '',
        contact_id: card.contact_id || null,
        assigned_to: card.assignedTo || null,
        isCompleted: !card.isCompleted,
      });

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Error toggling card completion:', error);
      setToastMessage('Error updating card status. Please try again.');
      setToastType('error');
      setShowToast(true);
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
        return (a.recipient || '').localeCompare(b.recipient || '');
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

  // Enhanced Compatibility Layer form config
  const formConfig = getFormConfigEnhanced('cards', 'add', {
    holidayKey: 'graduation',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('cards', 'edit', {
    holidayKey: 'graduation',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  // Helper function for edit initial values
  const getEditInitialValues = (card: any) => {
    if (!card) return {};

    return {
      recipient: card.recipient || '',
      message: card.message || '',
      address: card.address || '',
      assigned_to: card.assignedTo || '', // API field → Form field
    };
  };

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
          holidayColor="bg-gradient-to-br from-purple-400 to-purple-600"
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
                card={card}
                onToggleCompletion={handleToggleCompletion}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
                holidayColor="bg-gradient-to-br from-purple-400 to-purple-600"
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
                holidayColor="bg-gradient-to-br from-purple-400 to-purple-600"
              />
            )}
          />
        </div>
      </main>

      {/* Form Modal */}
      <FormModal
        isOpen={showForm}
        title="Add New Card"
        fields={formConfig.fields}
        onSubmit={handleAddCard}
        onClose={closeForm}
        loading={isSubmitting}
        submitText={isSubmitting ? 'Processing...' : 'Add Card'}
        cancelText="Cancel"
        cardClassName="card card-valentines"
        submitButtonColor="#8b5cf6"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Card"
        fields={editFormConfig.fields}
        initialValues={getEditInitialValues(cardToEdit)}
        onSubmit={handleEditSubmit}
        onClose={() => {
          setShowEditModal(false);
          setCardToEdit(null);
        }}
        loading={isEditSubmitting}
        submitText={isEditSubmitting ? 'Processing...' : 'Update Card'}
        cancelText="Cancel"
        cardClassName="card card-valentines"
        submitButtonColor="#8b5cf6"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        title="Delete Card"
        itemName={cardToDelete?.recipient}
        onConfirm={confirmDelete}
        loading={deleteLoading}
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
