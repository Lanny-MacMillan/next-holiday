import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { useAuth0 } from '@auth0/auth0-react';
import {
  useGetGiftsQuery,
  useCreateGiftMutation,
  useUpdateGiftMutation,
  useEditGiftMutation,
  useDeleteGiftMutation,
} from '@/store/api';
import { getHolidayIdFromRoute } from '@/utils/holidayUtils';

export function useKwanzaaGiftsMutations() {
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

  // Get all gift mutations
  const [createGift, createGiftState] = useCreateGiftMutation();
  const [updateGift, updateGiftState] = useUpdateGiftMutation();
  const [editGift, editGiftState] = useEditGiftMutation();
  const [deleteGift, deleteGiftState] = useDeleteGiftMutation();

  // Get gifts query
  const {
    data: gifts = [],
    isLoading: loading,
    error,
    isSuccess: initialized,
  } = useGetGiftsQuery(
    { holidayId: holidayId || '', auth0User },
    { skip: !holidayId || !auth0User },
  );

  return {
    holidayId,
    auth0User,
    gifts,
    loading,
    error,
    initialized,
    createGift,
    updateGift,
    editGift,
    deleteGift,
    createGiftState,
    updateGiftState,
    editGiftState,
    deleteGiftState,
  };
}
