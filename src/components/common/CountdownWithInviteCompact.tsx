'use client';

import CountdownTimer from './CountdownTimer';
import InviteButton from './InviteButton';
import { useSubscription } from '@/hooks/useSubscription';

interface CountdownWithInviteCompactProps {
  className?: string;
  holiday?: string;
  holidayKey?: string;
  showInviteButton?: boolean;
  holidayId?: string; // New prop for API-based countdown
  countdownTimer?: string | null; // New prop for countdown timer
}

export default function CountdownWithInviteCompact({
  className = '',
  holiday,
  holidayKey,
  holidayId,
  countdownTimer,
}: CountdownWithInviteCompactProps) {
  // Map holiday names to holiday keys if not provided
  const getHolidayKey = () => {
    if (holidayKey) return holidayKey;

    const holidayMap: Record<string, string> = {
      Christmas: 'christmas',
      Thanksgiving: 'thanksgiving',
      Halloween: 'halloween',
      Easter: 'easter',
      "Valentine's Day": 'valentines',
      'New Year': 'new-year',
      Birthday: 'birthday',
      Anniversary: 'anniversary',
      Graduation: 'graduation',
      'Baby Shower': 'baby-shower',
      "Mother's Day": 'mothers-day',
      "Father's Day": 'fathers-day',
      'Fourth of July': 'fourth-of-july',
      Hanukkah: 'hanukkah',
      Kwanzaa: 'kwanzaa',
    };

    return holiday ? holidayMap[holiday] || holiday.toLowerCase() : '';
  };
  const { isUserPlusMember, hasSubscription } = useSubscription();
  const isAuthorizedForSharing = hasSubscription && isUserPlusMember;

  const currentHolidayKey = getHolidayKey();

  return (
    <div className={`flex flex-col items-end gap-1 ${className}`}>
      <CountdownTimer
        holiday={holiday}
        holidayId={holidayId}
        initialCountdownTimer={countdownTimer}
      />
      {isAuthorizedForSharing && currentHolidayKey && (
        <InviteButton
          holidayKey={currentHolidayKey}
          holidayName={holiday || currentHolidayKey}
          className="text-xs px-2 py-1"
        />
      )}
    </div>
  );
}
