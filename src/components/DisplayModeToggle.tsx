'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useAuth0 } from '@auth0/auth0-react';
import { updateUserPreferences } from '@/store/slices/userPreferencesSlice';
import { updateSettings } from '@/store/slices/themeSlice';
import { refreshHomeData } from '@/store/slices/homeSlice';

export default function DisplayModeToggle() {
  const dispatch = useAppDispatch();
  const { user: auth0User } = useAuth0();
  const { settings } = useAppSelector((state: any) => state.theme);
  const { preferences } = useAppSelector((state: any) => state.userPreferences);
  const [isLoading, setIsLoading] = useState(false);

  // Use preferences from database if available, otherwise fall back to theme slice
  const currentDisplayMode = preferences?.displayMode || settings.displayMode;

  const handleToggle = async () => {
    if (isLoading) return; // Prevent multiple clicks

    const newDisplayMode =
      currentDisplayMode === 'professional' ? 'gamified' : 'professional';

    // Update local state immediately
    dispatch(updateSettings({ displayMode: newDisplayMode }));

    // Update database preferences if user is authenticated
    if (preferences && auth0User?.sub) {
      setIsLoading(true);
      try {
        await dispatch(
          updateUserPreferences({
            preferencesData: { displayMode: newDisplayMode },
            auth0Sub: auth0User.sub,
          }),
        ).unwrap();

        // Refresh home data so all components get updated display mode context
        await dispatch(refreshHomeData(auth0User)).unwrap();
      } catch (error) {
        console.error('Failed to update display mode in database:', error);
        // Revert local state if database update fails
        dispatch(updateSettings({ displayMode: currentDisplayMode }));
      } finally {
        setIsLoading(false);
      }
    } else {
      // If no user preferences, still refresh home data for display mode consistency
      if (auth0User) {
        try {
          await dispatch(refreshHomeData(auth0User)).unwrap();
        } catch (error) {
          console.error(
            'Failed to refresh home data after display mode change:',
            error,
          );
        }
      }
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors ${
        isLoading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      aria-label={`Switch to ${
        currentDisplayMode === 'professional' ? 'gamified' : 'professional'
      } mode`}
      title={`Switch to ${
        currentDisplayMode === 'professional' ? 'gamified' : 'professional'
      } mode`}
    >
      {isLoading ? (
        // Loading spinner
        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            className="opacity-25"
          />
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            className="opacity-75"
          />
        </svg>
      ) : currentDisplayMode === 'professional' ? (
        // Business briefcase icon for gamified mode (click to switch to professional)
        <svg
          className="h-6 w-6"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
          <g
            id="SVGRepo_tracerCarrier"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></g>
          <g id="SVGRepo_iconCarrier">
            <path d="M19,6.5H16v-1a3,3,0,0,0-3-3H11a3,3,0,0,0-3,3v1H5a3,3,0,0,0-3,3v9a3,3,0,0,0,3,3H19a3,3,0,0,0,3-3v-9A3,3,0,0,0,19,6.5Zm-9-1a1,1,0,0,1,1-1h2a1,1,0,0,1,1,1v1H10Zm10,13a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V13.45H7V14.5a1,1,0,0,0,2,0V13.45h6V14.5a1,1,0,0,0,2,0V13.45h3Zm0-7H4V9.5a1,1,0,0,1,1-1H19a1,1,0,0,1,1,1Z"></path>
          </g>
        </svg>
      ) : (
        // Gamepad icon for professional mode (click to switch to gamified)
        <svg className="h-6 w-6" viewBox="0 0 512 512" fill="currentColor">
          <path d="M510.002,309.835l-0.068-0.326l-0.076-0.334l-26.508-112.721l-0.106-0.417l-0.106-0.418 c-16.668-62.217-73.294-105.666-137.712-105.666H166.579c-64.418,0-121.045,43.449-137.712,105.666l-0.114,0.418l-0.099,0.417 L2.147,309.174l-0.076,0.326l-0.068,0.326c-9.749,46.43,16.926,92.496,62.036,107.168l1.586,0.509 c9.24,3.012,18.89,4.544,28.624,4.544c32.668,0,63.128-17.404,79.758-45.489l22.556-33.343l0.561-0.835l0.509-0.872 c0.796-1.388,2.276-2.253,3.861-2.253h109.02c1.586,0,3.066,0.865,3.862,2.253l0.508,0.872l0.562,0.835l22.555,33.343 c16.63,28.085,47.09,45.489,79.766,45.489c9.734,0,19.384-1.532,28.67-4.56l1.533-0.493 C493.07,402.331,519.737,356.257,510.002,309.835z M439.318,390.397l-1.54,0.501c-6.608,2.154-13.353,3.186-20.014,3.186 c-22.646,0-44.283-11.949-56.088-32.433l-23.064-34.101c-5.788-10.053-16.508-16.258-28.101-16.258h-109.02 c-11.592,0-22.312,6.206-28.101,16.258l-23.063,34.101c-11.804,20.484-33.434,32.433-56.081,32.433 c-6.661,0-13.405-1.032-20.013-3.186l-1.548-0.501c-31.431-10.219-50.102-42.485-43.311-74.819l26.508-112.722 c13.42-50.102,58.826-84.94,110.696-84.94h178.847c51.869,0,97.276,34.838,110.696,84.94l26.508,112.722 C489.413,347.912,470.75,380.178,439.318,390.397z" />
          <polygon points="157.453,172.061 123.912,172.061 123.912,210.579 85.387,210.579 85.387,244.105 123.912,244.105 123.912,282.637 157.453,282.637 157.453,244.105 195.978,244.105 195.978,210.579 157.453,210.579" />
          <path d="M365.721,206.247c11.668,0,21.113-9.445,21.113-21.098c0-11.669-9.445-21.114-21.113-21.114 c-11.653,0-21.098,9.445-21.098,21.114C344.622,196.802,354.068,206.247,365.721,206.247z" />
          <path d="M323.509,206.247c-11.653,0-21.106,9.453-21.106,21.098c0,11.669,9.453,21.122,21.106,21.122 c11.661,0,21.106-9.453,21.106-21.122C344.615,215.7,335.17,206.247,323.509,206.247z" />
          <path d="M365.721,248.459c-11.653,0-21.098,9.445-21.098,21.114c0,11.653,9.445,21.098,21.098,21.098 c11.668,0,21.113-9.445,21.113-21.098C386.834,257.904,377.388,248.459,365.721,248.459z" />
          <path d="M407.933,206.247c-11.653,0-21.099,9.453-21.099,21.098c0,11.669,9.446,21.122,21.099,21.122 c11.66,0,21.113-9.453,21.113-21.122C429.046,215.7,419.593,206.247,407.933,206.247z" />
        </svg>
      )}
    </button>
  );
}
