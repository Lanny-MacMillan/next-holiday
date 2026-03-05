import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { useAuth0 } from '@auth0/auth0-react';
import {
  useGetBabyShowerGamesQuery,
  useCreateBabyShowerGamesMutation,
  useUpdateBabyShowerGamesMutation,
  useEditBabyShowerGamesMutation,
  useDeleteBabyShowerGamesMutation,
} from '@/store/api';
import { getHolidayIdFromRoute } from '@/utils/holidayUtils';

export function useBabyShowerGamesMutations() {
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

  // Get all baby shower games mutations
  const [createBabyShowerGames, createBabyShowerGamesState] =
    useCreateBabyShowerGamesMutation();
  const [updateBabyShowerGames, updateBabyShowerGamesState] =
    useUpdateBabyShowerGamesMutation();
  const [editBabyShowerGames, editBabyShowerGamesState] =
    useEditBabyShowerGamesMutation();
  const [deleteBabyShowerGames, deleteBabyShowerGamesState] =
    useDeleteBabyShowerGamesMutation();

  // Get baby shower games query
  const {
    data: babyShowerGames = [],
    isLoading: loading,
    error,
    isSuccess: initialized,
  } = useGetBabyShowerGamesQuery(
    { holidayId: holidayId || '', auth0User },
    { skip: !holidayId || !auth0User },
  );

  return {
    holidayId,
    auth0User,
    babyShowerGames,
    loading,
    error,
    initialized,
    createBabyShowerGames,
    updateBabyShowerGames,
    editBabyShowerGames,
    deleteBabyShowerGames,
    createBabyShowerGamesState,
    updateBabyShowerGamesState,
    editBabyShowerGamesState,
    deleteBabyShowerGamesState,
  };
}
