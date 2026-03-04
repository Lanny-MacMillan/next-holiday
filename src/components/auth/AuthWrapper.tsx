'use client';

import { useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setUser,
  clearUser,
  checkUserInDb,
  addUserToDb,
} from '@/store/slices/userSlice';
import { clearHomeData } from '@/store/slices/homeSlice';
import { clearCachedData } from '@/store/slices/themeSlice';
import { clearPreferences } from '@/store/slices/userPreferencesSlice';
import { api } from '@/store/api';
import { ReactNode } from 'react';

interface AuthWrapperProps {
  children: ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const dispatch = useAppDispatch();
  const { user: reduxUser, loading } = useAppSelector((state: any) => state.user);
  const hasSetInitialUser = useRef(false); // Prevent multiple setUser calls

  useEffect(() => {
    if (isAuthenticated && user && !hasSetInitialUser.current) {
      // Check if Redux already has subscription data - if so, don't override
      if (
        reduxUser &&
        reduxUser.subscriptionPlan &&
        reduxUser.subscriptionPlan !== 'free'
      ) {
        hasSetInitialUser.current = true; // Mark as set so we don't run again
        return;
      }

      // User is authenticated and we haven't set initial data yet
      hasSetInitialUser.current = true; // Mark as set to prevent re-runs

      const userData = {
        id: '', // Will be set by the database
        sub: user.sub!,
        email: user.email,
        name: user.name,
        picture: user.picture,
        isInDb: false, // Will be updated after DB check
        // Don't include subscription fields at all - HomePageWrapper will set complete data
      };

      // Add user to Redux with minimal data
      dispatch(setUser(userData));
    } else if (isAuthenticated && user && hasSetInitialUser.current) {
      // Already set initial user - never call setUser again
    } else if (!isAuthenticated && (reduxUser || hasSetInitialUser.current)) {
      // User logged out - clear all user data and caches for multi-tenant safety
      hasSetInitialUser.current = false; // Reset for next login
      dispatch(clearUser());
      dispatch(clearHomeData());
      dispatch(clearCachedData());
      dispatch(clearPreferences());
      // Clear RTK Query cache to prevent cross-tenant data leakage
      dispatch(api.util.resetApiState());
    }
  }, [isAuthenticated, user, reduxUser]);

  // Handle user switching (different user logs in)
  useEffect(() => {
    if (isAuthenticated && user && reduxUser && user.sub !== reduxUser.sub) {
      // Different user logged in - clear all data and caches
      dispatch(clearUser());
      dispatch(clearHomeData());
      dispatch(clearCachedData());
      dispatch(clearPreferences());
      dispatch(api.util.resetApiState());
    }
  }, [user?.sub, reduxUser?.sub, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
