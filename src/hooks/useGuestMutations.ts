import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { useAuth0 } from '@auth0/auth0-react';
import {
  useGetGuestListQuery,
  useCreateGuestMutation,
  useUpdateGuestMutation,
  useEditGuestMutation,
  useDeleteGuestMutation,
} from '@/store/api';
import { getHolidayIdFromRoute } from '@/utils/holidayUtils';

// Transform guest list with contact to guest format
function transformGuestListToGuest(guestList: any) {
  return {
    id: guestList.id,
    name: guestList.contact.name,
    email: guestList.contact.email || undefined,
    phone: guestList.contact.phone || undefined,
    address: guestList.contact.streetAddress || undefined,
    rsvpStatus: guestList.rsvpStatus || 'pending',
    numberOfGuests: 1, // Always default to 1 since this isn't stored in the current schema
    dietaryRestrictions: undefined, // Not stored in current schema
    bringingDish: undefined, // Not stored in current schema
    notes: guestList.notes || undefined,
    isCompleted: guestList.rsvpStatus === 'confirmed', // Use RSVP status for completion
    createdAt: guestList.createdAt,
    updatedAt: guestList.updatedAt,
  };
}

export function useGuestMutations() {
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

  // Get all guest mutations
  const [createGuest, createGuestState] = useCreateGuestMutation();
  const [updateGuest, updateGuestState] = useUpdateGuestMutation();
  const [editGuest, editGuestState] = useEditGuestMutation();
  const [deleteGuest, deleteGuestState] = useDeleteGuestMutation();

  // Get guest list query
  const {
    data: guestLists = [],
    isLoading: loading,
    error,
    isSuccess: initialized,
  } = useGetGuestListQuery(
    { holidayId: holidayId || '', auth0User },
    { skip: !holidayId || !auth0User },
  );

  // Transform guest lists to guests format
  const guests = guestLists.map(transformGuestListToGuest);

  return {
    holidayId,
    auth0User,
    guests,
    loading,
    error,
    initialized,
    createGuest,
    updateGuest,
    editGuest,
    deleteGuest,
    createGuestState,
    updateGuestState,
    editGuestState,
    deleteGuestState,
  };
}
