import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { useAuth0 } from '@auth0/auth0-react';
import {
  useGetEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useEditEventMutation,
  useDeleteEventMutation,
} from '@/store/api';
import { getHolidayIdFromRoute } from '@/utils/holidayUtils';

export function useEventMutations() {
  const pathname = usePathname();
  const { user: auth0User } = useAuth0();
  const holidayPreferences = useAppSelector(
    (state: any) => state.home.data?.holidayPreferences || [],
  );
  const homeInitialized = useAppSelector((state: any) => state.home.initialized);

  // Only resolve holidayId if home data is initialized
  const holidayId = homeInitialized
    ? getHolidayIdFromRoute(pathname, holidayPreferences)
    : null;

  // Get all event mutations
  const [createEvent, createEventState] = useCreateEventMutation();
  const [updateEvent, updateEventState] = useUpdateEventMutation();
  const [editEvent, editEventState] = useEditEventMutation();
  const [deleteEvent, deleteEventState] = useDeleteEventMutation();

  // Get events query
  const {
    data: events = [],
    isLoading: loading,
    error,
    isSuccess: initialized,
  } = useGetEventsQuery(
    { holidayId: holidayId || '', auth0User },
    { skip: !holidayId || !auth0User },
  );

  return {
    holidayId,
    auth0User,
    events,
    loading,
    error,
    initialized,
    createEvent,
    updateEvent,
    editEvent,
    deleteEvent,
    createEventState,
    updateEventState,
    editEventState,
    deleteEventState,
  };
}
