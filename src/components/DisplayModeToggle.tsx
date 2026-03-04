'use client';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useAuth0 } from '@auth0/auth0-react';
import { updateUserPreferences } from '@/store/slices/userPreferencesSlice';
import { updateSettings } from '@/store/slices/themeSlice';

export default function DisplayModeToggle() {
  const dispatch = useAppDispatch();
  const { user: auth0User } = useAuth0();
  const { settings } = useAppSelector((state: any) => state.theme);
  const { preferences } = useAppSelector((state: any) => state.userPreferences);

  // Use preferences from database if available, otherwise fall back to theme slice
  const currentDisplayMode = preferences?.displayMode || settings.displayMode;

  const handleToggle = async () => {
    const newDisplayMode =
      currentDisplayMode === 'professional' ? 'gamified' : 'professional';

    // Update local state immediately
    dispatch(updateSettings({ displayMode: newDisplayMode }));

    // Update database preferences if user is authenticated
    if (preferences && auth0User?.sub) {
      try {
        await dispatch(
          updateUserPreferences({
            preferencesData: { displayMode: newDisplayMode },
            auth0Sub: auth0User.sub,
          }),
        ).unwrap();
      } catch (error) {
        console.error('Failed to update display mode in database:', error);
        // Revert local state if database update fails
        dispatch(updateSettings({ displayMode: currentDisplayMode }));
      }
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
      aria-label={`Switch to ${
        currentDisplayMode === 'professional' ? 'gamified' : 'professional'
      } mode`}
      title={`Switch to ${
        currentDisplayMode === 'professional' ? 'gamified' : 'professional'
      } mode`}
    >
      {currentDisplayMode === 'professional' ? (
        // Game controller icon for professional mode (click to switch to gamified)
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M16 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ) : (
        // Business briefcase icon for gamified mode (click to switch to professional)
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a1 1 0 01-1 1H9a1 1 0 01-1-1V6m8 0H8M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      )}
    </button>
  );
}
