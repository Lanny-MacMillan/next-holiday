import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { useAuth0 } from '@auth0/auth0-react';
import {
  useGetKwanzaaPrinciplesQuery,
  useCreateKwanzaaPrinciplesMutation,
  useUpdateKwanzaaPrinciplesMutation,
  useEditKwanzaaPrinciplesMutation,
  useDeleteKwanzaaPrinciplesMutation,
} from '@/store/api';
import { getHolidayIdFromRoute } from '@/utils/holidayUtils';

export function useKwanzaaPrinciplesMutations() {
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

  // Get all Kwanzaa principles mutations
  const [createKwanzaaPrinciples, createKwanzaaPrinciplesState] =
    useCreateKwanzaaPrinciplesMutation();
  const [updateKwanzaaPrinciples, updateKwanzaaPrinciplesState] =
    useUpdateKwanzaaPrinciplesMutation();
  const [editKwanzaaPrinciples, editKwanzaaPrinciplesState] =
    useEditKwanzaaPrinciplesMutation();
  const [deleteKwanzaaPrinciples, deleteKwanzaaPrinciplesState] =
    useDeleteKwanzaaPrinciplesMutation();

  // Get Kwanzaa principles query
  const {
    data: kwanzaaPrinciples = [],
    isLoading: loading,
    error,
    isSuccess: initialized,
  } = useGetKwanzaaPrinciplesQuery(
    { holidayId: holidayId || '', auth0User },
    { skip: !holidayId || !auth0User },
  );

  return {
    holidayId,
    auth0User,
    kwanzaaPrinciples,
    loading,
    error,
    initialized,
    createKwanzaaPrinciples,
    updateKwanzaaPrinciples,
    editKwanzaaPrinciples,
    deleteKwanzaaPrinciples,
    createKwanzaaPrinciplesState,
    updateKwanzaaPrinciplesState,
    editKwanzaaPrinciplesState,
    deleteKwanzaaPrinciplesState,
  };
}
