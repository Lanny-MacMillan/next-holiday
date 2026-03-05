'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCards } from '@/store/slices/cardsSlice';
import { fetchGifts } from '@/store/slices/giftListSlice';
import { fetchTasks } from '@/store/slices/tasksSlice';
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

  useEffect(() => {
    // Fetch all data if not already initialized
    if (!cardsInitialized) {
      dispatch(fetchCards());
    }
    if (!giftsInitialized) {
      dispatch(fetchGifts());
    }
    if (!tasksInitialized) {
      dispatch(fetchTasks());
    }
    // Only fetch contacts if not initialized AND not available in home data
    if (!contactsInitialized && !homeData?.contacts?.length) {
      dispatch(fetchContacts());
    }
    // Fetch shares if not initialized
    if (!sharesInitialized && user?.sub) {
      dispatch(fetchShares(user.sub));
    }
    // Fetch invites if not initialized, not loading, and user is authenticated
    if (!invitesInitialized && !invitesLoading && user?.sub) {
      dispatch(fetchInboxInvites(user.sub));
      dispatch(fetchOutgoingInvites(user.sub));
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
    user?.sub,
  ]);

  // This component doesn't render anything
  return null;
}
