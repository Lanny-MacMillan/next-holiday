export const DEFAULT_USER_PREFERENCES = {
  theme: 'light' as const,
  displayMode: 'professional' as const,
  emailNotifications: false,
  pushNotifications: false,
  reminderNotifications: false,
  taskDueReminders: false,
  holidayCountdownAlerts: true,
  // Other fields will use their default values from the schema
  showCompletedItems: true,
  showCountdown: true,
  showProgressBars: true,
  timezone: 'UTC',
  locale: 'en-US',
  reducedMotion: false,
  highContrast: false,
  fontSize: 'medium' as const,
};
