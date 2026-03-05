'use client';

import { useState } from 'react';
import UserAvatar from './UserAvatar';
import { ShareMember } from '@/store/slices/sharesSlice';

interface SharedUserListProps {
  members: ShareMember[];
  maxVisible?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showSharedIcon?: boolean;
  onOpenModal?: () => void; // New prop to handle external modal control
}

export default function SharedUserList({
  members,
  maxVisible = 5,
  size = 'sm',
  className = '',
  showSharedIcon = false,
  onOpenModal, // New prop
}: SharedUserListProps) {
  const [showModal, setShowModal] = useState(false);
  const visibleMembers = members.slice(0, maxVisible);
  const remainingCount = Math.max(0, members.length - maxVisible);

  // Handle modal open - use external handler if provided, otherwise use internal state
  const handleOpenModal = () => {
    if (onOpenModal) {
      onOpenModal();
    } else {
      setShowModal(true);
    }
  };

  if (members.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Optional shared icon */}
      {showSharedIcon && (
        <div className="flex items-center mr-1">
          <svg
            className="w-3 h-3 text-blue-600 dark:text-blue-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
        </div>
      )}

      {/* Member avatars */}
      <div
        className={`flex gap-1 ${className.includes('flex-row-reverse') ? 'flex-row-reverse' : ''}`}
      >
        {visibleMembers.map((member, index) => (
          <UserAvatar
            key={member.userId}
            userId={member.userId}
            name={member.name}
            email={member.email}
            picture={member.picture}
            size={size}
            className="ring-2 ring-white dark:ring-gray-800 hover:z-10 transition-transform hover:scale-110"
          />
        ))}

        {/* Additional members indicator */}
        {remainingCount > 0 && (
          <div className="relative inline-block">
            <button
              onClick={handleOpenModal}
              className={`${
                size === 'xs'
                  ? 'w-4 h-4 text-[8px]'
                  : size === 'sm'
                    ? 'w-6 h-6 text-[10px]'
                    : size === 'md'
                      ? 'w-8 h-8 text-xs'
                      : 'w-10 h-10 text-sm'
              } bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800 text-gray-700 dark:text-gray-300 font-medium cursor-pointer transition-colors`}
              title={`Click to see all ${members.length} members`}
            >
              +{remainingCount}
            </button>
          </div>
        )}
      </div>

      {/* Modal for all members - only show if using internal modal control */}
      {!onOpenModal && showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Shared Members ({members.length})
              </h3>
              <button
                onClick={() => setShowModal(false)}
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
              {members.map(member => (
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
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {member.name || 'Unknown User'}
                    </p>
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
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
