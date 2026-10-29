'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCards } from '@/store/slices/cardsSlice';
import { fetchGifts } from '@/store/slices/giftListSlice';
import { fetchTasks } from '@/store/slices/tasksSlice';
import { loadHome } from '@/store/loadHome';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import { fetchShares } from '@/store/slices/sharesSlice';
import {
  fetchInboxInvites,
  fetchOutgoingInvites,
} from '@/store/slices/invitesSlice';
import { useAuth0 } from '@auth0/auth0-react';

export default function DataInitializer() {
  const dispatch = useAppDispatch();
  const { user } = useAuth0();
  const { initialized: cardsInitialized } = useAppSelector(state => state.cards);
  const { initialized: giftsInitialized } = useAppSelector(state => state.giftList);
  const { initialized: tasksInitialized } = useAppSelector(state => state.tasks);
  const { initialized: contactsInitialized } = useAppSelector(
    state => state.addressBook,
  );
  const { initialized: sharesInitialized } = useAppSelector(state => state.shares);
  const { initialized: invitesInitialized, loading: invitesLoading } =
    useAppSelector(state => state.invites);
  const homeData = useAppSelector((state: any) => state.home.data);
  const homeInitialized = useAppSelector((state: any) => state.home.initialized);

  // One attempt per resource per user. A failed fetch leaves `initialized` false,
  // so without this every state change (e.g. `invitesLoading` toggling) would
  // re-dispatch all fetches and hammer the API while it is down.
  const attempted = useRef<Record<string, boolean>>({});
  const attemptedFor = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (attemptedFor.current !== user?.sub) {
      attempted.current = {};
      attemptedFor.current = user?.sub;
    }

    const fetchOnce = (key: string, initialized: boolean, run: () => void) => {
      if (initialized) {
        // Allow a fresh attempt if the slice is reset later
        attempted.current[key] = false;
        return;
      }
      if (attempted.current[key]) return;
      attempted.current[key] = true;
      run();
    };

    // Holiday pages read this; only the home page used to load it
    if (user?.sub) {
      const profile = user;
      fetchOnce('home', homeInitialized, () => dispatch(loadHome(profile)));
    }

    // Fetch all data if not already initialized
    fetchOnce('cards', cardsInitialized, () => dispatch(fetchCards()));
    fetchOnce('gifts', giftsInitialized, () => dispatch(fetchGifts()));
    fetchOnce('tasks', tasksInitialized, () => dispatch(fetchTasks()));
    // Only fetch contacts if not initialized AND not available in home data
    fetchOnce('contacts', contactsInitialized || !!homeData?.contacts?.length, () =>
      dispatch(fetchContacts()),
    );
    // Fetch shares if not initialized and user is authenticated
    if (user?.sub) {
      const sub = user.sub;
      fetchOnce('shares', sharesInitialized, () => dispatch(fetchShares(sub)));
      // Invites: also wait for any in-flight invite request
      if (!invitesLoading) {
        fetchOnce('invites', invitesInitialized, () => {
          dispatch(fetchInboxInvites(sub));
          dispatch(fetchOutgoingInvites(sub));
        });
      }
    }
  }, [
    cardsInitialized,
    giftsInitialized,
    tasksInitialized,
    contactsInitialized,
    sharesInitialized,
    invitesInitialized,
    invitesLoading,
    homeData?.contacts?.length,
    homeInitialized,
    user?.sub,
  ]);

  // This component doesn't render anything
  return null;
}
