export type HolidayTheme =
  | 'christmas'
  | 'valentines'
  | 'easter'
  | 'halloween'
  | 'thanksgiving'
  | 'hanukkah'
  | 'kwanzaa'
  | 'new-year';

export interface HolidayColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

const holidayColorMap: Record<HolidayTheme, HolidayColors> = {
  christmas: {
    primary: '#dc2626', // red-600
    secondary: '#059669', // emerald-600
    accent: '#dc2626', // red-600
    background: 'christmas-gradient',
  },
  valentines: {
    primary: '#ec4899', // pink-500
    secondary: '#be185d', // pink-700
    accent: '#ec4899', // pink-500
    background: 'valentines-gradient',
  },
  easter: {
    primary: '#8b5cf6', // violet-500
    secondary: '#7c3aed', // violet-600
    accent: '#8b5cf6', // violet-500
    background: 'easter-gradient',
  },
  halloween: {
    primary: '#f97316', // orange-500
    secondary: '#ea580c', // orange-600
    accent: '#f97316', // orange-500
    background: 'halloween-gradient',
  },
  thanksgiving: {
    primary: '#d97706', // amber-600
    secondary: '#b45309', // amber-700
    accent: '#d97706', // amber-600
    background: 'thanksgiving-gradient',
  },
  hanukkah: {
    primary: '#3b82f6', // blue-500
    secondary: '#2563eb', // blue-600
    accent: '#3b82f6', // blue-500
    background: 'hanukkah-cards-gradient',
  },
  kwanzaa: {
    primary: '#059669', // emerald-600
    secondary: '#047857', // emerald-700
    accent: '#059669', // emerald-600
    background: 'kwanzaa-gradient',
  },
  'new-year': {
    primary: '#eab308', // yellow-500
    secondary: '#ca8a04', // yellow-600
    accent: '#eab308', // yellow-500
    background: 'new-year-gradient',
  },
};

export function detectHolidayTheme(pathname: string): HolidayTheme {
  if (pathname.includes('/christmas')) return 'christmas';
  if (pathname.includes('/valentines')) return 'valentines';
  if (pathname.includes('/easter')) return 'easter';
  if (pathname.includes('/halloween')) return 'halloween';
  if (pathname.includes('/thanksgiving')) return 'thanksgiving';
  if (pathname.includes('/hanukkah')) return 'hanukkah';
  if (pathname.includes('/kwanzaa')) return 'kwanzaa';
  if (pathname.includes('/new-year')) return 'new-year';

  // Default to christmas if no holiday is detected
  return 'christmas';
}

export function getHolidayColors(pathname: string): HolidayColors {
  const theme = detectHolidayTheme(pathname);
  return holidayColorMap[theme];
}

export function getHolidayAccentColor(pathname: string): string {
  const colors = getHolidayColors(pathname);
  return colors.accent;
}

/**
 * Get holiday ID from route pathname and holiday preferences
 */
export function getHolidayIdFromRoute(
  pathname: string,
  holidayPreferences: Array<{ holiday: string; holidayId: string }>,
): string | null {
  // Extract holiday name from pathname
  const holidayName = pathname.split('/')[1]; // e.g., "/christmas/gift-list" -> "christmas"

  if (!holidayName) return null;

  // Map route names to holiday names
  const routeToHolidayMap: Record<string, string> = {
    christmas: 'Christmas',
    hanukkah: 'Hanukkah',
    thanksgiving: 'Thanksgiving',
    easter: 'Easter',
    valentines: "Valentine's Day",
    birthday: 'Birthday',
    'mothers-day': "Mother's Day",
    'fathers-day': "Father's Day",
    halloween: 'Halloween',
    'new-year': 'New Year',
    kwanzaa: 'Kwanzaa',
    'fourth-of-july': 'Fourth of July',
    graduation: 'Graduation',
    'baby-shower': 'Baby Shower',
    anniversary: 'Anniversary',
  };

  const holidayNameFromRoute = routeToHolidayMap[holidayName];
  if (!holidayNameFromRoute) return null;

  // Find the holiday preference
  let preference = holidayPreferences.find(
    pref => pref.holiday === holidayNameFromRoute,
  );

  // If not found, try with the route name (for cases where holidayType is stored as route name)
  if (!preference) {
    preference = holidayPreferences.find(pref => pref.holiday === holidayName);
  }

  return preference?.holidayId || null;
}

/**
 * List of holidays that have fixed dates and should show "Enable Countdown"
 */
const NATIONAL_HOLIDAYS = [
  'Christmas',
  'Hanukkah',
  'Kwanzaa',
  'New Year',
  "Valentine's Day",
  'Easter',
  'Thanksgiving',
  'Halloween',
  "Mother's Day",
  "Father's Day",
  'Fourth of July',
];

/**
 * Check if a holiday is a national holiday with a fixed/calculable date
 */
export function isNationalHoliday(holidayName: string | undefined): boolean {
  if (!holidayName) return false;
  return NATIONAL_HOLIDAYS.includes(holidayName);
}

/**
 * Get the default date for a national holiday in the current or next year
 * Returns ISO datetime string in format YYYY-MM-DDTHH:MM:SS
 */
export function getDefaultHolidayDate(
  holidayName: string | undefined,
): string | null {
  if (!holidayName) return null;

  const now = new Date();
  const currentYear = now.getFullYear();

  // Helper to create date at midnight in local time
  const createDate = (year: number, month: number, day: number): Date => {
    return new Date(year, month - 1, day, 0, 0, 0);
  };

  // Helper to get nth weekday of month (e.g., 2nd Sunday)
  const getNthWeekdayOfMonth = (
    year: number,
    month: number,
    weekday: number,
    n: number,
  ): Date => {
    const firstDay = new Date(year, month - 1, 1);
    const firstWeekday = firstDay.getDay();
    const diff = (weekday - firstWeekday + 7) % 7;
    const date = 1 + diff + (n - 1) * 7;
    return new Date(year, month - 1, date, 0, 0, 0);
  };

  let holidayDate: Date | null = null;

  switch (holidayName) {
    case 'Christmas':
      holidayDate = createDate(currentYear, 12, 25);
      break;
    case 'New Year':
      // New Year is always next year
      holidayDate = createDate(currentYear + 1, 1, 1);
      break;
    case "Valentine's Day":
      holidayDate = createDate(currentYear, 2, 14);
      break;
    case 'Halloween':
      holidayDate = createDate(currentYear, 10, 31);
      break;
    case 'Fourth of July':
      holidayDate = createDate(currentYear, 7, 4);
      break;
    case "Mother's Day":
      // 2nd Sunday in May
      holidayDate = getNthWeekdayOfMonth(currentYear, 5, 0, 2);
      break;
    case "Father's Day":
      // 3rd Sunday in June
      holidayDate = getNthWeekdayOfMonth(currentYear, 6, 0, 3);
      break;
    case 'Thanksgiving':
      // 4th Thursday in November
      holidayDate = getNthWeekdayOfMonth(currentYear, 11, 4, 4);
      break;
    case 'Easter':
      // Easter calculation (Computus algorithm)
      // Using a simplified version for years 2000-2099
      const a = currentYear % 19;
      const b = Math.floor(currentYear / 100);
      const c = currentYear % 100;
      const d = Math.floor(b / 4);
      const e = b % 4;
      const f = Math.floor((b + 8) / 25);
      const g = Math.floor((b - f + 1) / 3);
      const h = (19 * a + b - d - g + 15) % 30;
      const i = Math.floor(c / 4);
      const k = c % 4;
      const l = (32 + 2 * e + 2 * i - h - k) % 7;
      const m = Math.floor((a + 11 * h + 22 * l) / 451);
      const month = Math.floor((h + l - 7 * m + 114) / 31);
      const day = ((h + l - 7 * m + 114) % 31) + 1;
      holidayDate = createDate(currentYear, month, day);
      break;
    case 'Hanukkah':
      // Hanukkah dates vary significantly by year (Hebrew calendar)
      // For 2026, Hanukkah begins on December 12, 2026
      // This is a placeholder - ideally would use a Hebrew calendar library
      if (currentYear === 2026) {
        holidayDate = createDate(2026, 12, 12);
      } else {
        // Default to early December as placeholder
        holidayDate = createDate(currentYear, 12, 10);
      }
      break;
    case 'Kwanzaa':
      // Kwanzaa always starts December 26
      holidayDate = createDate(currentYear, 12, 26);
      break;
    default:
      return null;
  }

  if (!holidayDate) return null;

  // If the date has already passed this year, use next year's date (except New Year)
  if (holidayDate < now && holidayName !== 'New Year') {
    const nextYear = currentYear + 1;
    switch (holidayName) {
      case 'Christmas':
        holidayDate = createDate(nextYear, 12, 25);
        break;
      case "Valentine's Day":
        holidayDate = createDate(nextYear, 2, 14);
        break;
      case 'Halloween':
        holidayDate = createDate(nextYear, 10, 31);
        break;
      case 'Fourth of July':
        holidayDate = createDate(nextYear, 7, 4);
        break;
      case "Mother's Day":
        holidayDate = getNthWeekdayOfMonth(nextYear, 5, 0, 2);
        break;
      case "Father's Day":
        holidayDate = getNthWeekdayOfMonth(nextYear, 6, 0, 3);
        break;
      case 'Thanksgiving':
        holidayDate = getNthWeekdayOfMonth(nextYear, 11, 4, 4);
        break;
      case 'Easter':
        const a = nextYear % 19;
        const b = Math.floor(nextYear / 100);
        const c = nextYear % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        holidayDate = createDate(nextYear, month, day);
        break;
      case 'Hanukkah':
        if (nextYear === 2026) {
          holidayDate = createDate(2026, 12, 12);
        } else if (nextYear === 2027) {
          holidayDate = createDate(2027, 12, 2);
        } else {
          holidayDate = createDate(nextYear, 12, 10);
        }
        break;
      case 'Kwanzaa':
        holidayDate = createDate(nextYear, 12, 26);
        break;
    }
  }

  // Format as datetime-local input format (YYYY-MM-DDTHH:MM)
  const year = holidayDate.getFullYear();
  const month = String(holidayDate.getMonth() + 1).padStart(2, '0');
  const day = String(holidayDate.getDate()).padStart(2, '0');
  const hours = String(holidayDate.getHours()).padStart(2, '0');
  const minutes = String(holidayDate.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Function to calculate countdown time for a holiday
export const getHolidayCountdownTime = (holidayName: string, state: any): number => {
  // Get the appropriate countdown state based on holiday name
  let countdownState;

  switch (holidayName) {
    case 'Hanukkah':
      countdownState = state.hanukkahCountdown;
      break;
    case 'Kwanzaa':
      countdownState = state.kwanzaaCountdown;
      break;
    case 'New Year':
      countdownState = state.newYearCountdown;
      break;
    case "Valentine's Day":
      countdownState = state.valentinesCountdown;
      break;
    case 'Easter':
      countdownState = state.easterCountdown;
      break;
    case 'Halloween':
      countdownState = state.halloweenCountdown;
      break;
    case 'Thanksgiving':
      countdownState = state.thanksgivingCountdown;
      break;
    default:
      countdownState = state.countdown;
      break;
  }

  // If no countdown is set or not active, return Infinity (will be sorted last)
  if (!countdownState || !countdownState.targetDate || !countdownState.isActive) {
    return Infinity;
  }

  // Calculate time remaining in milliseconds
  const now = new Date().getTime();
  const target = new Date(countdownState.targetDate).getTime();
  const difference = target - now;

  // If the date has passed, return 0 (will be sorted first)
  if (difference <= 0) {
    return 0;
  }

  return difference;
};
