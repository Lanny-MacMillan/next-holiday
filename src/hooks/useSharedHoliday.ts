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
  const hasUser = Boolean(auth0User);
  const userSub = auth0User?.sub;
  const userId = auth0User?.id;
  const userName = auth0User?.name;
  const userEmail = auth0User?.email;
  const shareMembers = useMemo(() => {
    const members = baseMembers || [];
    if (!hasUser) return members;
    return [
      // The current user is always assignable, listed first as the owner
      ...members
        .filter((member: any) => member.userId === userSub)
        .map((member: any) => ({
          ...member,
          uuid: member.uuid || member.userId,
          role: 'owner' as const,
        })),
      ...(members.find((member: any) => member.userId === userSub)
        ? []
        : [
            {
              userId: userSub || '',
              uuid: userId || '',
              name: userName || 'Me',
              email: userEmail || '',
              role: 'owner' as const,
            },
          ]),
      ...members
        .filter((member: any) => member.userId !== userSub)
        .map((member: any) => ({
          ...member,
          uuid: member.uuid || member.userId,
        })),
    ];
  }, [baseMembers, hasUser, userSub, userId, userName, userEmail]);

  return { holidayId, holidayData, auth0User, homeInitialized, shareMembers };
}
