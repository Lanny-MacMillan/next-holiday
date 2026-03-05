'use client';

import CountdownTimer from './CountdownTimer';
import InviteButton from './InviteButton';

interface CountdownWithInviteProps {
  className?: string;
  holiday?: string;
  holidayKey?: string;
}

export default function CountdownWithInvite({
  className = '',
  holiday,
  holidayKey,
}: CountdownWithInviteProps) {
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

  const currentHolidayKey = getHolidayKey();

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <CountdownTimer holiday={holiday} />
      {currentHolidayKey && (
        <InviteButton
          holidayKey={currentHolidayKey}
          holidayName={holiday || currentHolidayKey}
        />
      )}
    </div>
  );
}
