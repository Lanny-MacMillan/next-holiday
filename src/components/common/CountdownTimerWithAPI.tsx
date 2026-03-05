'use client';

import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useAuth0 } from '@auth0/auth0-react';
import {
  updateCountdownTimer,
  clearCountdownTimer,
} from '@/store/slices/countdownTimerSlice';
import DatePickerModal from '../modals/DatePickerModal';

interface CountdownTimerWithAPIProps {
  className?: string;
  holidayId: string;
  holidayName: string;
  initialCountdownTimer?: string | null;
}

export default function CountdownTimerWithAPI({
  className = '',
  holidayId,
  holidayName,
  initialCountdownTimer = null,
}: CountdownTimerWithAPIProps) {
  const dispatch = useAppDispatch();
  const { user: auth0User } = useAuth0();

  const { loading, error, updatingHolidayId } = useAppSelector(
    state => state.countdownTimer,
  );
  const isUpdating = updatingHolidayId === holidayId;

  const [countdownTimer, setCountdownTimer] = useState<string | null>(
    initialCountdownTimer,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    setCountdownTimer(initialCountdownTimer);
  }, [initialCountdownTimer]);

  useEffect(() => {
    if (!countdownTimer) {
      setTimeLeft(null);
      return;
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(countdownTimer).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownTimer]);

  const getCountdownColor = () => {
    if (!timeLeft) return 'text-gray-500 dark:text-gray-400';
    const totalHours = timeLeft.days * 24 + timeLeft.hours;
    if (totalHours <= 0) return 'text-red-500';
    if (totalHours <= 24) return 'text-yellow-500';
    return 'text-green-500';
  };

  const handleSetCountdown = async (date: string) => {
    try {
      await dispatch(
        updateCountdownTimer({
          holidayId,
          countdownTimer: date,
          auth0User,
        }),
      ).unwrap();
      setCountdownTimer(date);
      setShowDatePicker(false);
    } catch (error) {
      console.error('Failed to set countdown:', error);
    }
  };

  const handleUpdateCountdown = async (date: string) => {
    try {
      await dispatch(
        updateCountdownTimer({
          holidayId,
          countdownTimer: date,
          auth0User,
        }),
      ).unwrap();
      setCountdownTimer(date);
      setShowDatePicker(false);
    } catch (error) {
      console.error('Failed to update countdown:', error);
    }
  };

  const handleClearCountdown = async () => {
    try {
      await dispatch(
        clearCountdownTimer({
          holidayId,
          auth0User,
        }),
      ).unwrap();
      setCountdownTimer(null);
      setShowDatePicker(false);
    } catch (error) {
      console.error('Failed to clear countdown:', error);
    }
  };

  const { settings } = useAppSelector((state: any) => state.theme);
  const isGamifiedMode = settings.displayMode === 'gamified';

  if (isUpdating) {
    return (
      <div className={`${className} relative z-20`}>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {isGamifiedMode ? 'Updating...' : 'Updating countdown...'}
        </div>
      </div>
    );
  }

  if (error && updatingHolidayId === holidayId) {
    return (
      <div className={`${className} relative z-20`}>
        <div className="text-xs text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!countdownTimer) {
    const getHolidayColor = () => {
      const colorMap: { [key: string]: { light: string; dark: string } } = {
        christmas: { light: '#22c55e', dark: '#16a34a' },
        hanukkah: { light: '#3b82f6', dark: '#2563eb' },
        kwanzaa: { light: '#dc2626', dark: '#b91c1c' },
        'new-year': { light: '#f59e0b', dark: '#d97706' },
        valentines: { light: '#ec4899', dark: '#db2777' },
        easter: { light: '#a855f7', dark: '#9333ea' },
        halloween: { light: '#f97316', dark: '#ea580c' },
        thanksgiving: { light: '#f59e0b', dark: '#d97706' },
        'mothers-day': { light: '#ec4899', dark: '#db2777' },
        'fathers-day': { light: '#3b82f6', dark: '#2563eb' },
        'fourth-of-july': { light: '#dc2626', dark: '#b91c1c' },
        birthday: { light: '#f59e0b', dark: '#d97706' },
        anniversary: { light: '#ec4899', dark: '#db2777' },
        graduation: { light: '#a855f7', dark: '#9333ea' },
        'baby-shower': { light: '#06b6d4', dark: '#0891b2' },
      };

      const holidayIdMap: { [key: string]: string } = {
        Christmas: 'christmas',
        Hanukkah: 'hanukkah',
        Kwanzaa: 'kwanzaa',
        'New Year': 'new-year',
        "Valentine's Day": 'valentines',
        Easter: 'easter',
        Halloween: 'halloween',
        Thanksgiving: 'thanksgiving',
        "Mother's Day": 'mothers-day',
        "Father's Day": 'fathers-day',
        'Fourth of July': 'fourth-of-july',
        Birthday: 'birthday',
        Anniversary: 'anniversary',
        Graduation: 'graduation',
        'Baby Shower': 'baby-shower',
      };

      const holidayId = holidayIdMap[holidayName] || '';
      return colorMap[holidayId] || { light: '#6b7280', dark: '#4b5563' };
    };

    const holidayColor = getHolidayColor();

    return (
      <div className={`${className} relative z-20`}>
        <button
          onClick={e => {
            e.stopPropagation();
            setShowDatePicker(true);
          }}
          className={`text-xs font-medium transition-all duration-200 ${
            isGamifiedMode
              ? 'text-white hover:text-gray-200 hover:scale-110'
              : `countdown-timer-professional hover:scale-105`
          }`}
          style={
            !isGamifiedMode
              ? ({
                  color: holidayColor.light,
                  '--holiday-color': holidayColor.light,
                  '--holiday-color-dark': holidayColor.dark,
                } as React.CSSProperties)
              : {}
          }
        >
          Set Countdown
        </button>
        <DatePickerModal
          isOpen={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onDateSelect={handleSetCountdown}
          title="Set Countdown Date"
        />
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <div
        className={`${className} text-xs relative z-20 ${
          isGamifiedMode
            ? 'text-gray-500 dark:text-gray-400'
            : 'countdown-timer-professional'
        }`}
      >
        Calculating...
      </div>
    );
  }

  const completionMessage = getCompletionMessage();
  const isExpired =
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  if (completionMessage) {
    return (
      <div className={`${className} relative z-20`}>
        <button
          onClick={e => {
            e.stopPropagation();
            setShowDatePicker(true);
          }}
          className={`text-xs cursor-pointer transition-all duration-200 font-medium ${
            isGamifiedMode
              ? 'text-red-500 hover:scale-110'
              : 'countdown-timer-professional hover:scale-105'
          }`}
          title="Click to edit or delete countdown"
        >
          {completionMessage}
        </button>
        <DatePickerModal
          isOpen={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onDateSelect={handleUpdateCountdown}
          title="Update Countdown Date"
          currentDate={countdownTimer || ''}
          onDelete={handleClearCountdown}
        />
      </div>
    );
  }

  return (
    <div className={`${className} relative z-20`}>
      <button
        onClick={e => {
          e.stopPropagation();
          setShowDatePicker(true);
        }}
        className={`text-xs cursor-pointer transition-all duration-200 font-medium ${
          isGamifiedMode
            ? `${getCountdownColor()} hover:scale-110`
            : 'countdown-timer-professional hover:scale-105'
        }`}
        title="Click to edit or delete countdown"
      >
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {timeLeft.hours > 0 && `${timeLeft.hours}h `}
        {timeLeft.minutes > 0 && `${timeLeft.minutes}m `}
        {timeLeft.seconds}s
      </button>
      <DatePickerModal
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={handleUpdateCountdown}
        title="Update Countdown Date"
        currentDate={countdownTimer || ''}
        onDelete={handleClearCountdown}
      />
    </div>
  );
}

function getCompletionMessage() {
  // This would be implemented based on the holiday name
  return null;
}
