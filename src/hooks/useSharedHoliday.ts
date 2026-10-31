import { useMemo } from 'react';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useAppSelector } from '@/store/hooks';
import { selectHolidayPrefById } from '@/store/selectors/home';

// The holiday a page works on, plus who it can be assigned to. On a holiday shared
// with the user, the share carries the owner's holiday id, so that one is used.
export function useSharedHoliday(holidayKey: string) {
  const {
    holidayId: baseHolidayId,
    holidayData: baseHolidayData,
    auth0User,
    homeInitialized,
  } = useHolidayPageData();

  const shareData = useAppSelector(state => {
    if (!baseHolidayId) return null;
    return state.shares.shares.find(
      (share: any) => share?.holidayKey === holidayKey,
    );
  });
  const holidayId = shareData?.holidayId || baseHolidayId;
  const holidayData =
    useAppSelector(state => selectHolidayPrefById(state, holidayId)) ||
    baseHolidayData;

  const baseMembers = shareData?.members;
  const shareMembers = useMemo(() => {
    const members = baseMembers || [];
    if (!auth0User) return members;
    return [
      // The current user is always assignable, listed first as the owner
      ...members
        .filter((member: any) => member.userId === auth0User.sub)
        .map((member: any) => ({
          ...member,
          uuid: member.uuid || member.userId,
          role: 'owner' as const,
        })),
      ...(members.find((member: any) => member.userId === auth0User.sub)
        ? []
        : [
            {
              userId: auth0User.sub || '',
              uuid: auth0User.id || '',
              name: auth0User.name || 'Me',
              email: auth0User.email || '',
              role: 'owner' as const,
            },
          ]),
      ...members
        .filter((member: any) => member.userId !== auth0User.sub)
        .map((member: any) => ({
          ...member,
          uuid: member.uuid || member.userId,
        })),
    ];
  }, [
    baseMembers,
    auth0User?.sub,
    auth0User?.id,
    auth0User?.name,
    auth0User?.email,
  ]);

  return { holidayId, holidayData, auth0User, homeInitialized, shareMembers };
}
