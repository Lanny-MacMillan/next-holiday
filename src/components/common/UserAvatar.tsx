'use client';

import { useState } from 'react';

interface UserAvatarProps {
  userId: string;
  name?: string | null;
  email?: string | null;
  picture?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: 'w-5 h-5 text-xs',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
};

const textSizeClasses = {
  xs: 'text-[8px]',
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
};

export default function UserAvatar({
  userId,
  name,
  email,
  picture,
  size = 'sm',
  showTooltip = true,
  className = '',
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [showTooltipState, setShowTooltipState] = useState(false);

  // Get initials from name or email
  const getInitials = () => {
    if (name) {
      return name
        .split(' ')
        .slice(0, 2)
        .map(n => n.charAt(0).toUpperCase())
        .join('');
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    // Fallback to userId
    return userId.charAt(0).toUpperCase();
  };

  const displayName = name || email || `User ${userId.slice(0, 8)}`;
  const shouldShowImage = picture && !imageError;
  const sizeClass = sizeClasses[size];
  const textSizeClass = textSizeClasses[size];

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltipState(true)}
      onMouseLeave={() => setShowTooltipState(false)}
    >
      <div
        className={`${sizeClass} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm ${className}`}
      >
        {shouldShowImage ? (
          <img
            src={picture}
            alt={displayName}
            className="w-full h-full rounded-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className={`font-semibold text-white ${textSizeClass}`}>
            {getInitials()}
          </span>
        )}
      </div>

      {/* Tooltip */}
      {/* {showTooltip && showTooltipState && (
				<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap z-50 shadow-lg">
					<div className="font-medium">{displayName}</div>
					{name && email && name !== email && (
						<div className="text-gray-300 dark:text-gray-400">{email}</div>
					)}
					{/* Tooltip arrow */}
      {/* <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
				</div>
			)} */}
    </div>
  );
}
