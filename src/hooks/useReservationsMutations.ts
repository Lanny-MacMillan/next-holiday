import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { useAuth0 } from '@auth0/auth0-react';
import {
  useGetReservationsQuery,
  useCreateReservationsMutation,
  useUpdateReservationsMutation,
  useEditReservationsMutation,
  useDeleteReservationsMutation,
} from '@/store/api';
import { getHolidayIdFromRoute } from '@/utils/holidayUtils';

export function useReservationsMutations() {
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

  // Get all reservations mutations
  const [createReservations, createReservationsState] =
    useCreateReservationsMutation();
  const [updateReservations, updateReservationsState] =
    useUpdateReservationsMutation();
  const [editReservations, editReservationsState] = useEditReservationsMutation();
  const [deleteReservations, deleteReservationsState] =
    useDeleteReservationsMutation();

  // Get reservations query
  const {
    data: reservations = [],
    isLoading: loading,
    error,
    isSuccess: initialized,
  } = useGetReservationsQuery(
    { holidayId: holidayId || '', auth0User },
    { skip: !holidayId || !auth0User },
  );

  return {
    holidayId,
    auth0User,
    reservations,
    loading,
    error,
    initialized,
    createReservations,
    updateReservations,
    editReservations,
    deleteReservations,
    createReservationsState,
    updateReservationsState,
    editReservationsState,
    deleteReservationsState,
  };
}
