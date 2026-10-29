// Configuration for holiday-specific gift list data and display text
export interface HolidayGiftListConfig {
  displayText: string;
}

const HOLIDAY_GIFT_LIST_CONFIG: Record<string, HolidayGiftListConfig> = {
  Christmas: {
    displayText: 'Gift List',
  },
  Hanukkah: {
    displayText: 'Gift List',
  },
  "Valentine's Day": {
    displayText: 'Gift List',
  },
  Halloween: {
    displayText: 'Gift List',
  },
  Thanksgiving: {
    displayText: 'Shopping List',
  },
  Easter: {
    displayText: 'Gift List',
  },
  Kwanzaa: {
    displayText: 'Gift List',
  },
  'New Year': {
    displayText: 'Supplies List',
  },
  "Mother's Day": {
    displayText: 'Gift List',
  },
  "Father's Day": {
    displayText: 'Gift List',
  },
  Birthday: {
    displayText: 'Gift List',
  },
  Anniversary: {
    displayText: 'Gift List',
  },
  Graduation: {
    displayText: 'Gift List',
  },
  'Baby Shower': {
    displayText: 'Gift List',
  },
};

// Helper function to get holiday configuration
export function getHolidayGiftListConfig(holiday?: string): HolidayGiftListConfig {
  if (!holiday) {
    return {
      displayText: 'Gift List',
    };
  }

  return (
    HOLIDAY_GIFT_LIST_CONFIG[holiday] || {
      displayText: 'Gift List',
    }
  );
}
