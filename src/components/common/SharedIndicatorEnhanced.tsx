'use client';

import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  selectShareByHolidayKey,
  selectIsOwnerByHolidayKey,
  ShareMember,
  removeMemberFromShare,
  leaveShare,
  fetchShares,
  refreshShares,
} from '@/store/slices/sharesSlice';
import {
  selectOutgoingInvites,
  selectPendingInvites,
} from '@/store/slices/invitesSlice';
import { setHomeData, removeSharedHolidayData } from '@/store/slices/homeSlice';
import { useAuth0 } from '@auth0/auth0-react';
import SharedUserList from './SharedUserList';
import UserAvatar from './UserAvatar';

interface SharedIndicatorEnhancedProps {
  holidayKey: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  maxVisibleMembers?: number;
  showLabel?: boolean;
}

export default function SharedIndicatorEnhanced({
  holidayKey,
  className = '',
  size = 'sm',
  maxVisibleMembers = 5,
  showLabel = true,
}: SharedIndicatorEnhancedProps) {
  const { user } = useAuth0();
  const dispatch = useAppDispatch();
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionToConfirm, setActionToConfirm] = useState<{
    type: 'leave' | 'remove';
    userId: string;
    userName: string;
  } | null>(null);

  const share = useAppSelector(state => selectShareByHolidayKey(state, holidayKey));

  // Get home data to find holidayId for immediate removal on leave
  const homeData = useAppSelector(state => state.home.data);

  // Check if user has pending invites for this holiday
  const pendingInvites = useAppSelector(state =>
    user?.sub ? selectPendingInvites(state, user.sub, user.email) : [],
  );

  // Debug: Also get ALL invites to see what's in the store
  const allInvites = useAppSelector(state => state.invites.invites || []);
  const fullInvitesState = useAppSelector(state => state.invites);
  const outgoingInvites = useAppSelector(state =>
    user?.sub ? selectOutgoingInvites(state, user.sub) : [],
  );

  const hasPendingInviteForHoliday = useMemo(() => {
    return pendingInvites.some((invite: any) => invite.holidayKey === holidayKey);
  }, [pendingInvites, holidayKey]);

  const isCurrentUserOwner = useMemo(() => {
    if (!user?.sub) return false;
    if (!share) return true; // No share exists, user can be considered owner
    return share.ownerUserId === user.sub;
  }, [share, user?.sub]);

  // Get members from the enhanced share data, fallback to memberUserIds for backward compatibility
  const members: ShareMember[] = useMemo(() => {
    if (!share) return [];

    return (
      share.members ||
      share.memberUserIds.map((userId: string) => ({
        userId,
        name: null,
        email: null,
        picture: null,
      }))
    );
  }, [share]);

  // If user has a pending invite for this holiday, show "invite pending" indicator
  if (hasPendingInviteForHoliday) {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border-2 flex-shrink-0 bg-yellow-500 text-white border-yellow-300 ${className}`}
      >
        <svg className="w-2.5 h-2.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Invite Pending</span>
      </span>
    );
  }

  if (!share) {
    return null;
  }

  // Show all shares that exist (even with just the owner)
  // This allows users to see shareable holidays and invite others
  if (members.length < 1) {
    return null;
  }

  // Handler functions
  const handleRemoveMember = (userId: string, userName: string) => {
    setActionToConfirm({
      type: 'remove',
      userId,
      userName,
    });
    setShowConfirmModal(true);
  };

  const handleLeaveShare = () => {
    if (user?.sub) {
      setActionToConfirm({
        type: 'leave',
        userId: user.sub,
        userName: user.name || 'You',
      });
      setShowConfirmModal(true);
    }
  };

  const handleConfirmAction = async () => {
    if (!actionToConfirm || !share) return;

    setIsLoading(true);
    setError(null);

    try {
      if (actionToConfirm.type === 'leave') {
        const result = await dispatch(
          leaveShare({
            shareId: share.shareId,
            userId: actionToConfirm.userId,
            holidayKey: holidayKey,
          }),
        ).unwrap();

        // Immediately remove the shared holiday data from Redux for better UX
        // Find the holidayId for this holidayKey
        const holidayPref = homeData?.holidayPreferences?.find(pref => {
          // Normalize both keys for comparison
          const normalizeKey = (key: string) =>
            key.toLowerCase().replace(/[-\s']/g, '');
          return (
            normalizeKey(pref.holiday) === normalizeKey(holidayKey) ||
            normalizeKey(pref.holidayId) === normalizeKey(holidayKey)
          );
        });

        if (holidayPref?.holidayId) {
          dispatch(removeSharedHolidayData({ holidayId: holidayPref.holidayId }));
        } else {
          console.error('❌ SharedIndicator: Could not find holiday to remove', {
            holidayKey,
            availableHolidays: homeData?.holidayPreferences?.map(p => ({
              holiday: p.holiday,
              holidayId: p.holidayId,
            })),
          });
        }
      } else {
        await dispatch(
          removeMemberFromShare({
            shareId: share.shareId,
            userId: actionToConfirm.userId,
          }),
        ).unwrap();
      }

      // Small delay to ensure backend operations are completed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Refresh all data to update the homepage
      if (user?.sub) {
        await dispatch(refreshShares(user.sub)); // Use refreshShares instead of fetchShares

        // Also refresh home data to ensure holiday cards update properly
        try {
          const response = await fetch('/api/home', {
            headers: {
              'Content-Type': 'application/json',
              'x-test-user': JSON.stringify({
                sub: user.sub,
                email: user.email,
                name: user.name,
                picture: user.picture,
              }),
            },
          });

          if (response.ok) {
            const result = await response.json();
            const data = result.data;

            // Update Redux store with fresh home data
            dispatch(setHomeData(data));
          }
        } catch (refreshError) {
          console.error(
            'Failed to refresh home data after share operation:',
            refreshError,
          );
        }
      }

      setShowConfirmModal(false);
      setActionToConfirm(null);

      // If user left the share, also close the members modal since they're no longer part of it
      if (actionToConfirm.type === 'leave') {
        setShowMembersModal(false);
      }
    } catch (error: any) {
      console.error('Error performing action:', error);
      setError(error.message || 'Failed to perform action');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAction = () => {
    if (isLoading) return; // Prevent closing while loading
    setShowConfirmModal(false);
    setActionToConfirm(null);
    setError(null);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMembersModal(true);
  };

  return (
    <>
      <button
        onClick={handleContainerClick}
        className={`flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity ${className}`}
        title="Click to view all shared members"
      >
        {/* Shared label with icon - positioned on the left */}
        {showLabel && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border-2 flex-shrink-0 ${
              members.length > 1
                ? 'bg-green-500 text-white border-green-300'
                : share.hasPendingInvites
                  ? 'bg-blue-500 text-white border-blue-300'
                  : 'bg-gray-500 text-white border-gray-300'
            }`}
          >
            <svg
              className="w-2.5 h-2.5 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {members.length > 1
              ? 'Shared'
              : share.hasPendingInvites && isCurrentUserOwner
                ? 'Invite Sent'
                : 'Shareable'}
          </span>
        )}

        {/* User avatars list using SharedUserList */}
        <SharedUserList
          members={members}
          maxVisible={maxVisibleMembers}
          size={size}
          showSharedIcon={false}
          onOpenModal={() => setShowMembersModal(true)}
          className=""
        />

        {/* Member count info - positioned on the right */}
        {members.length >= 1 && (
          <span className="hidden sm:block text-xs text-white ml-1 flex-shrink-0">
            {members.length} member{members.length !== 1 ? 's' : ''}
            {members.length === 1 && share.hasPendingInvites && isCurrentUserOwner
              ? ' (invite sent)'
              : ''}
          </span>
        )}
      </button>

      {/* Members Modal */}
      {showMembersModal &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
            onClick={() => setShowMembersModal(false)}
          >
            <div
              className="card rounded-lg p-4 sm:p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Shared Members ({members.length})
                </h3>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                {members.map(member => {
                  const isCurrentUser = member.userId === user?.sub;
                  const isOwner = share.ownerUserId === member.userId; // Use share.ownerUserId for accurate ownership
                  const canRemove = isCurrentUserOwner && !isOwner && !isCurrentUser;
                  const canLeave = isCurrentUser && !isOwner;

                  return (
                    <div
                      key={member.userId}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <UserAvatar
                        userId={member.userId}
                        name={member.name}
                        email={member.email}
                        picture={member.picture}
                        size="md"
                        showTooltip={false}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {member.name || 'Unknown User'}
                            {isOwner && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                                Owner
                              </span>
                            )}
                            {isCurrentUser && !isOwner && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                                You
                              </span>
                            )}
                          </p>
                        </div>
                        {member.email && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {member.email}
                          </p>
                        )}
                        {member.joinedAt && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        {canRemove && (
                          <button
                            onClick={() =>
                              handleRemoveMember(
                                member.userId,
                                member.name || 'Unknown User',
                              )
                            }
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            title="Remove member"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                        {canLeave && (
                          <button
                            onClick={handleLeaveShare}
                            className="p-1.5 text-gray-600 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 rounded-md transition-colors"
                            title="Leave shared holiday"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Confirmation Modal */}
      {showConfirmModal &&
        actionToConfirm &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]"
            onClick={handleCancelAction}
          >
            <div
              className="card rounded-lg p-6 max-w-md w-full mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-2 rounded-full ${actionToConfirm.type === 'leave' ? 'bg-orange-100 dark:bg-orange-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}
                >
                  <svg
                    className={`w-6 h-6 ${actionToConfirm.type === 'leave' ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {actionToConfirm.type === 'leave' ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    )}
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {actionToConfirm.type === 'leave'
                      ? 'Leave Shared Holiday?'
                      : 'Remove Member?'}
                  </h3>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-300">
                  {actionToConfirm.type === 'leave'
                    ? 'Are you sure you want to leave this shared holiday? You will no longer have access to shared content and updates.'
                    : `Are you sure you want to remove ${actionToConfirm.userName} from this shared holiday? They will lose access to shared content and updates.`}
                </p>
                {error && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelAction}
                  disabled={isLoading}
                  className={`px-4 py-2 font-medium transition-colors ${
                    isLoading
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={isLoading}
                  className={`px-4 py-2 text-white font-medium rounded-md transition-colors flex items-center gap-2 ${
                    isLoading
                      ? 'opacity-50 cursor-not-allowed'
                      : actionToConfirm.type === 'leave'
                        ? 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600'
                        : 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
                  }`}
                >
                  {isLoading && (
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  {isLoading
                    ? actionToConfirm.type === 'leave'
                      ? 'Leaving...'
                      : 'Removing...'
                    : actionToConfirm.type === 'leave'
                      ? 'Leave Holiday'
                      : 'Remove Member'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
