'use client';

import { useState, useMemo } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { createShare, ShareMember, refreshShares } from '@/store/slices/sharesSlice';
import {
  createInvite,
  fetchOutgoingInvites,
  selectOutgoingInvites,
  Invite,
} from '@/store/slices/invitesSlice';
import {
  selectShareByHolidayKey,
  selectIsUserInShare,
  selectIsOwnerByHolidayKey,
} from '@/store/slices/sharesSlice';
import FormModal from '../modals/FormModal';
import Toast from './Toast';
import SharedIndicatorEnhanced from './SharedIndicatorEnhanced';
import { createPortal } from 'react-dom';

interface InviteButtonProps {
  holidayKey: string;
  holidayName: string;
  className?: string;
}

export default function InviteButton({
  holidayKey,
  holidayName,
  className = '',
}: InviteButtonProps) {
  const { user } = useAuth0();
  const dispatch = useAppDispatch();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('error');

  // Get current user's share for this holiday
  const share = useAppSelector(state => selectShareByHolidayKey(state, holidayKey));

  // Get outgoing invites to check for pending invites
  const outgoingInvites = useAppSelector(state =>
    user?.sub ? selectOutgoingInvites(state, user.sub) : [],
  );

  // Memoize the selector parameters to prevent unnecessary re-renders
  const isUserInShare = useMemo(() => {
    if (!share || !user?.sub) return false;
    return share.ownerUserId === user.sub || share.memberUserIds.includes(user.sub);
  }, [share, user?.sub]);

  const isUserOwner = useMemo(() => {
    if (!user?.sub) return false;
    if (!share) return true; // No share exists, user can be considered owner
    return share.ownerUserId === user.sub;
  }, [share, user?.sub]);

  const handleInviteClick = () => {
    setShowInviteModal(true);
  };

  const handleSendInvite = async (values: Record<string, any>) => {
    if (!user?.sub) return;

    const inviteEmail = values.email.trim().toLowerCase();

    // Helper function to show toast messages
    const showToastMessage = (
      message: string,
      type: 'success' | 'error' | 'info' = 'error',
    ) => {
      // Close modal first, then show toast for better visibility
      setShowInviteModal(false);
      setTimeout(() => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
      }, 100); // Small delay to let modal close first
    };

    // Validation 1: Prevent self-invite by email
    if (user.email && inviteEmail === user.email.toLowerCase()) {
      showToastMessage('You cannot invite yourself!');
      return;
    }

    // Validation 2: Prevent self-invite by user ID (if they enter their Auth0 sub)
    if (inviteEmail === user.sub) {
      showToastMessage('You cannot invite yourself!');
      return;
    }

    // Validation 3: Check for pending invites to this email for this holiday
    const hasPendingInvite = outgoingInvites.some(
      (invite: Invite) =>
        invite.holidayKey === holidayKey &&
        invite.toEmail === inviteEmail &&
        invite.status === 'pending',
    );

    if (hasPendingInvite) {
      showToastMessage(
        `A pending invite to ${inviteEmail} already exists for ${holidayName}!`,
      );
      return;
    }

    // Validation 4: Prevent inviting existing members
    if (share?.members) {
      const existingMemberByEmail = share.members.find(
        (member: ShareMember) => member.email?.toLowerCase() === inviteEmail,
      );
      if (existingMemberByEmail) {
        showToastMessage('This person is already a member of this holiday!');
        return;
      }

      // Also check by userId for Auth0 sub invitations
      const existingMemberByUserId = share.members.find(
        (member: ShareMember) => member.userId === inviteEmail,
      );
      if (existingMemberByUserId) {
        showToastMessage('This person is already a member of this holiday!');
        return;
      }
    }

    // Additional fallback: Check against memberUserIds array for backward compatibility
    if (share?.memberUserIds) {
      if (share.memberUserIds.includes(inviteEmail)) {
        showToastMessage('This person is already a member of this holiday!');
        return;
      }
      if (share.memberUserIds.includes(user.sub)) {
        // Prevent inviting self via memberUserIds
        if (inviteEmail === user.sub) {
          showToastMessage('You cannot invite yourself!');
          return;
        }
      }
    }

    setIsLoading(true);
    try {
      let currentShare = share;

      // If no share exists, create one
      if (!currentShare) {
        const shareResult = await dispatch(
          createShare({
            holidayKey,
            ownerUserId: user.sub,
            memberUserIds: [user.sub],
          }),
        ).unwrap();

        // Handle share creation status messages
        if (shareResult.shareStatus) {
          const statusMessages: Record<string, string> = {
            created_new: `Created new ${holidayName} share`,
            joined_existing: `Joined existing ${holidayName} share`,
            already_member: `You are already sharing ${holidayName}`,
          };

          const message =
            shareResult.message ||
            statusMessages[shareResult.shareStatus] ||
            `${holidayName} share updated`;
          const toastType =
            shareResult.shareStatus === 'created_new' ? 'success' : 'info';

          showToastMessage(message, toastType);
        }

        currentShare = shareResult;
      }

      // Create invite
      const inviteResult = await dispatch(
        createInvite({
          shareId: currentShare.id || currentShare.shareId, // Handle both field names
          fromUserId: user.sub,
          toEmail: values.email,
          holidayKey,
          message: values.message || '',
        }),
      ).unwrap();

      // Handle invite status messages
      if (inviteResult.inviteStatus) {
        // Use the message from the API response (which includes user lookup info)
        const message =
          inviteResult.message || `Invite sent to ${values.email} successfully!`;

        // Determine toast type based on user lookup status
        const toastType =
          inviteResult.userLookupStatus === 'registered_user' ? 'success' : 'info';

        showToastMessage(message, toastType);
      } else {
        showToastMessage(`Invite sent to ${values.email} successfully!`, 'success');
      }

      // Refetch outgoing invites to update the alerts bell
      await dispatch(fetchOutgoingInvites(user.sub));

      // Refetch shares to update the sharing status indicators
      await dispatch(refreshShares(user.sub));

      setShowInviteModal(false);
    } catch (error: any) {
      console.error('Failed to send invite:', error);
      console.log('Error object structure:', {
        message: error?.message,
        error: error?.error,
        dataError: error?.data?.error,
        type: typeof error,
        fullError: error,
      }); // Debug log

      // Extract error message from different possible error structures
      let errorMessage = 'Failed to send invite. Please try again.';

      // Check for API error message in various formats
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage = error.error;
      } else if (error?.data?.error) {
        errorMessage = error.data.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      console.log('Extracted error message:', errorMessage); // Debug log

      // Use the actual API error message directly if it's informative
      if (
        errorMessage &&
        errorMessage.length > 15 &&
        !errorMessage.toLowerCase().includes('failed to create') &&
        !errorMessage.includes('500') &&
        !errorMessage.includes('Internal Server Error')
      ) {
        // Show the exact API error message
        showToastMessage(errorMessage);
      } else if (errorMessage.toLowerCase().includes('conflict')) {
        // Handle 409 Conflict specifically - this usually means duplicate invite
        showToastMessage(
          `A pending invite to ${values.email} already exists for ${holidayName}.`,
        );
      } else {
        // Fallback for generic or unhelpful error messages
        showToastMessage('Failed to send invite. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Only show invite button if user is the owner (or no share exists yet)
  if (!isUserOwner) {
    // Show guest indicator that looks similar to invite button
    return (
      <>
        <SharedIndicatorEnhanced
          holidayKey={holidayKey}
          className={`px-4 py-2 bg-blue-600 hover:scale-110 text-white rounded-lg font-medium transition-colors cursor-pointer ${className}`}
          size="sm"
          maxVisibleMembers={10}
          showLabel={false}
          customText="Guest"
        />
      </>
    );
  }

  const inviteFields = [
    {
      id: 'email',
      type: 'email' as const,
      label: 'Invite by email or user ID',
      placeholder: 'Enter email address or user ID',
      required: true,
    },
    {
      id: 'message',
      type: 'textarea' as const,
      label: 'Message (optional)',
      placeholder: 'Add a personal message to your invite...',
      rows: 3,
    },
  ];

  return (
    <>
      <button
        onClick={handleInviteClick}
        className={`px-4 py-2 bg-blue-600 hover:scale-110 text-white rounded-lg font-medium transition-colors ${className}`}
        disabled={isLoading}
      >
        {isLoading ? 'Sending...' : 'Invite'}
      </button>

      <FormModal
        isOpen={showInviteModal}
        title="Share this holiday"
        fields={inviteFields}
        onSubmit={handleSendInvite}
        onClose={() => setShowInviteModal(false)}
        loading={isLoading}
        submitText="Send Invite"
        cancelText="Cancel"
      />

      {/* Modern Toast Notifications - Rendered via Portal to escape parent containers */}
      {typeof window !== 'undefined' &&
        createPortal(
          <Toast
            message={toastMessage}
            isVisible={showToast}
            onClose={() => setShowToast(false)}
            type={toastType}
          />,
          document.body,
        )}
    </>
  );
}
