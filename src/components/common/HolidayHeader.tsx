'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import { HolidayShapes } from '@/data/holidayShapes';

interface HolidayHeaderProps {
  holidayName: string;
  description?: string;
  showBackButton?: boolean;
  backHref?: string;
  cycleIcons?: boolean;
  availableHolidays?: string[];
}

export default function HolidayHeader({
  holidayName,
  description = 'Plan your holiday with ease!',
  showBackButton = true,
  backHref = '/',
  cycleIcons = false,
  availableHolidays = [],
}: HolidayHeaderProps) {
  const { displayMode } = useAppSelector((state: any) => state.theme.settings);
  const [currentHolidayIndex, setCurrentHolidayIndex] = useState(0);
  const [isIconCyclingEnabled, setIsIconCyclingEnabled] = useState(cycleIcons);

  const isGamified = displayMode === 'gamified';

  // Default holiday list if none provided
  const defaultHolidays = [
    'christmas',
    'hanukkah',
    'kwanzaa',
    'new-year',
    'valentines',
    'easter',
    'halloween',
    'thanksgiving',
    'mothers-day',
    'fathers-day',
    'fourth-of-july',
    'birthday',
    'anniversary',
    'graduation',
    'baby-shower',
  ];

  const holidaysToUse =
    availableHolidays.length > 0 ? availableHolidays : defaultHolidays;

  // Cycling logic
  useEffect(() => {
    if (!cycleIcons || !isIconCyclingEnabled || holidaysToUse.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentHolidayIndex(prev => (prev + 1) % holidaysToUse.length);
    }, 2000); // 2 seconds

    return () => clearInterval(interval);
  }, [cycleIcons, isIconCyclingEnabled, holidaysToUse.length]);

  // Get the current holiday for icon display
  const currentHolidayForIcon =
    cycleIcons && isIconCyclingEnabled && holidaysToUse.length > 0
      ? holidaysToUse[currentHolidayIndex]
      : holidayName.toLowerCase();

  // Get outline color based on holiday
  const getOutlineColor = () => {
    const outlineColorMap: { [key: string]: string } = {
      christmas: '#dc2626', // red-600
      hanukkah: '#2563eb', // blue-600
      kwanzaa: '#dc2626', // red-600
      'new-year': '#d97706', // amber-600
      'new year': '#d97706', // amber-600
      valentines: '#db2777', // pink-600
      "valentine's day": '#db2777', // pink-600
      easter: '#9333ea', // purple-600
      halloween: '#ea580c', // orange-600
      '🎃 halloween': '#ea580c', // orange-600 (with emoji)
      thanksgiving: '#d97706', // amber-600
      '🦃 thanksgiving': '#d97706', // amber-600 (with emoji)
      'mothers-day': '#db2777', // pink-600
      "mother's day": '#db2777', // pink-600
      "🌸 mother's day": '#db2777', // pink-600 (with emoji)
      'fathers-day': '#2563eb', // blue-600
      "father's day": '#2563eb', // blue-600
      "👨 father's day": '#2563eb', // blue-600 (with emoji)
      'fourth-of-july': '#dc2626', // red-600
      'fourth of july': '#dc2626', // red-600
      '🎆 fourth of july': '#dc2626', // red-600 (with emoji)
      birthday: '#eab308', // yellow-500
      anniversary: '#db2777', // pink-600
      graduation: '#9333ea', // purple-600
      'baby-shower': '#0891b2', // cyan-600
      'baby shower': '#0891b2', // cyan-600
      '👶 baby shower': '#0891b2', // cyan-600 (with emoji)
    };
    return outlineColorMap[holidayName.toLowerCase()] || ''; // default fallback
  };

  // Get emoji for holiday
  const getHolidayEmoji = () => {
    const emojiMap: { [key: string]: string } = {
      christmas: '🎄',
      hanukkah: '🕎',
      kwanzaa: '🕯️',
      'new-year': '🎊',
      'new year': '🎊',
      valentines: '💕',
      "valentine's day": '💕',
      easter: '🐰',
      halloween: '🎃',
      thanksgiving: '🦃',
      'mothers-day': '🌸',
      "mother's day": '🌸',
      'fathers-day': '👨',
      "father's day": '👨',
      'fourth-of-july': '🎆',
      'fourth of july': '🎆',
      birthday: '🎂',
      anniversary: '💖',
      graduation: '🎓',
      'baby-shower': '👶',
      'baby shower': '👶',
    };
    return emojiMap[holidayName.toLowerCase()] || '🎉';
  };

  // Get holiday SVG component
  const getHolidaySvg = () => {
    const holidayToUse = currentHolidayForIcon;

    const svgMap: { [key: string]: React.ComponentType<any> } = {
      christmas: HolidayShapes.christmas,
      hanukkah: HolidayShapes.hanukkah,
      kwanzaa: HolidayShapes.kwanzaa,
      'new-year': HolidayShapes['new-year'],
      'new year': HolidayShapes['new-year'],
      valentines: HolidayShapes.valentines,
      "valentine's day": HolidayShapes.valentines,
      easter: HolidayShapes.easter,
      halloween: HolidayShapes.halloween,
      thanksgiving: HolidayShapes.thanksgiving,
      'mothers-day': HolidayShapes['mothers-day'] || HolidayShapes.mothersday,
      "mother's day": HolidayShapes['mothers-day'] || HolidayShapes.mothersday,
      'fathers-day': HolidayShapes['fathers-day'] || HolidayShapes.fathersday,
      "father's day": HolidayShapes['fathers-day'] || HolidayShapes.fathersday,
      'fourth-of-july':
        HolidayShapes['fourth-of-july'] || HolidayShapes.fourthoffuly,
      'fourth of july':
        HolidayShapes['fourth-of-july'] || HolidayShapes.fourthoffuly,
      birthday: HolidayShapes.birthday,
      anniversary: HolidayShapes.anniversary,
      graduation: HolidayShapes.graduation,
      'baby-shower': HolidayShapes['baby-shower'] || HolidayShapes.babyshower,
      'baby shower': HolidayShapes['baby-shower'] || HolidayShapes.babyshower,
    };

    const SvgComponent =
      svgMap[holidayToUse.toLowerCase()] || HolidayShapes.christmas;
    return (
      <SvgComponent className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mr-2 sm:mr-3 md:mr-4" />
    );
  };

  // Clean holiday name (remove existing emojis and extra spaces)
  const getCleanHolidayName = () => {
    return holidayName
      .replace(/[🎄🕎🕯️🎊💕🐰🎃🦃🌸👨🎆🎂💖🎓👶🎉]/g, '') // Remove emojis
      .trim(); // Remove extra spaces
  };

  return (
    <header className="w-full max-w-4xl py-4 sm:py-6 px-4 sm:px-6">
      <div className="flex items-center justify-center relative">
        {showBackButton && (
          <Link
            href={backHref}
            className="absolute left-0 text-black dark:text-white text-3xl sm:text-4xl md:text-5xl transition-colors duration-200 hover:scale-110"
            onMouseEnter={e => {
              e.currentTarget.style.color = getOutlineColor();
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '';
            }}
          >
            ←
          </Link>
        )}
        <div className="text-center px-8 sm:px-12 min-w-0">
          <div className={isGamified ? 'relative inline-block' : ''}>
            {isGamified && (
              <div
                className="absolute top-0 left-0 w-full h-full rounded-2xl blur-lg opacity-70"
                style={{
                  // backgroundColor: getOutlineColor(),
                  transform: 'scale(1.2, 1.4)',
                  zIndex: 0,
                }}
              />
            )}
            <h1
              className={`${
                isGamified ? 'font-display' : 'font-sans'
              } text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-2 text-black dark:text-white break-words ${
                isGamified ? 'tracking-wide relative z-10' : ''
              } flex items-baseline justify-center`}
              style={
                isGamified
                  ? {
                      fontFamily: 'var(--font-family-fredoka)',
                      filter: 'drop-shadow(3px 5px 9px rgba(0, 0, 0, 0.5))',
                    }
                  : {
                      filter: 'drop-shadow(3px 5px 9px rgba(0, 0, 0, 0.5))',
                    }
              }
            >
              <span className="flex items-center">
                {getHolidaySvg()} {getCleanHolidayName()}
              </span>
            </h1>
          </div>
          <p
            className="text-center text-gray-600 dark:text-white text-sm sm:text-base break-words px-2 flex items-center justify-center gap-2"
            style={{
              fontFamily: 'var(--font-family-fredoka)',
            }}
          >
            {description}
            {/* Toggle button for cycling (only show if cycleIcons is true) */}
            {/* {cycleIcons && (
              <button
                onClick={() => setIsIconCyclingEnabled(!isIconCyclingEnabled)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                title={`${isIconCyclingEnabled ? 'Stop' : 'Start'} icon cycling`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isIconCyclingEnabled ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 9v6m4-6v6"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                  )}
                </svg>
              </button>
            )} */}
          </p>
        </div>
      </div>
    </header>
  );
}
