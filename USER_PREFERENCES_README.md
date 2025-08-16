# User Preferences Implementation

This document describes the implementation of user preferences in the Next Holiday application.

## Overview

User preferences are now stored in the database and synchronized with Redux state. The implementation follows the same pattern as user data management.

## Database Schema

User preferences are stored in the `user_preferences` table with the following fields:

- `theme`: "light" | "dark" | "system"
- `displayMode`: "professional" | "gamified"
- `showCompletedItems`: boolean
- `showCountdown`: boolean
- `showProgressBars`: boolean
- `emailNotifications`: boolean
- `pushNotifications`: boolean
- `reminderNotifications`: boolean
- `taskDueReminders`: boolean
- `holidayCountdownAlerts`: boolean
- `timezone`: string
- `locale`: string
- `reducedMotion`: boolean
- `highContrast`: boolean
- `fontSize`: "small" | "medium" | "large"

## Redux State Management

### UserPreferencesSlice

The `userPreferencesSlice` manages user preferences state with the following features:

- **State**: `preferences`, `loading`, `error`, `initialized`
- **Actions**:
  - `getCurrentUserPreferences`: Fetches preferences from API
  - `updateUserPreferences`: Updates preferences in database
  - `setPreferences`, `clearPreferences`, `clearError`: Local state management

### Integration with Existing Theme System

The implementation maintains backward compatibility with the existing theme slice:

1. **AppContent.tsx**: Uses preferences from database if available, falls back to theme slice
2. **Settings Page**: Updates both local state and database simultaneously
3. **ThemeToggle**: Updates both local state and database when toggling theme

## API Endpoints

### POST /api/users

- Creates new user and default preferences
- Called during Auth0 login for new users
- Creates user preferences with default values automatically

### GET /api/users/me

- Fetches current user with account relationships and preferences
- Requires auth0Sub as query parameter or header
- Returns user data without sensitive fields

### GET /api/users/me/preferences

- Fetches current user's preferences
- Requires auth0Sub as query parameter or header
- Creates default preferences if none exist
- Returns full preferences object

### PUT /api/users/me/preferences

- Updates user preferences
- Requires auth0Sub in request body
- Validates allowed fields
- Uses upsert to create if not exists, update if exists

## Data Flow

1. **User Registration**: When a new user logs in for the first time, a row is created in both `users` and `user_preferences` tables with default values
2. **App Load**: `DataInitializer` fetches user and preferences data using auth0Sub from Auth0
3. **Settings Changes**: Changes are applied locally and to database simultaneously
4. **Theme Changes**: Theme toggle updates both local state and database
5. **Fallback**: If database is unavailable, falls back to local storage

## Authentication

The API endpoints use Auth0 sub (auth0Sub) for authentication instead of server-side sessions:

- **GET endpoints**: Accept auth0Sub as query parameter or header
- **PUT endpoints**: Accept auth0Sub in request body
- **Frontend**: Passes auth0Sub from Auth0 React SDK to API calls

## Key Features

### Real-time Synchronization

- Changes apply locally and to database at the same time
- Prevents UX issues from data mismatches
- Error handling reverts local state if database update fails

### Backward Compatibility

- Existing theme slice continues to work
- Gradual migration path for other components
- Fallback to local storage if database unavailable

### Error Handling

- Database errors don't break the UI
- Local state reversion on failed updates
- Toast notifications for user feedback

## Usage Examples

### Accessing Preferences in Components

```typescript
const { preferences, initialized } = useAppSelector(
	(state) => state.userPreferences
);

// Use preferences from database if available
const currentTheme = preferences?.theme || fallbackTheme;
const currentDisplayMode = preferences?.displayMode || fallbackDisplayMode;
```

### Updating Preferences

```typescript
const dispatch = useAppDispatch();

// Update single preference
await dispatch(updateUserPreferences({ theme: "dark" })).unwrap();

// Update multiple preferences
await dispatch(
	updateUserPreferences({
		theme: "dark",
		displayMode: "gamified",
	})
).unwrap();
```

## Default Values

When a new user is created, the following default preferences are automatically set:

```typescript
{
  theme: "light",
  displayMode: "professional",
  emailNotifications: false,
  pushNotifications: false,
  reminderNotifications: false,
  taskDueReminders: false,
  holidayCountdownAlerts: true,
  showCompletedItems: true,
  showCountdown: true,
  showProgressBars: true,
  timezone: "UTC",
  locale: "en-US",
  reducedMotion: false,
  highContrast: false,
  fontSize: "medium"
}
```

These defaults are defined in `src/lib/constants/userPreferences.ts` and used consistently across all API endpoints.

## Migration Notes

### From Theme Slice to User Preferences

The following settings are now managed in the database:

- `theme` → `preferences.theme`
- `displayMode` → `preferences.displayMode`
- `notifications.reminders` → `preferences.reminderNotifications`
- `notifications.shippingAlerts` → `preferences.pushNotifications`
- `notifications.upcomingEvents` → `preferences.holidayCountdownAlerts`

### Remaining in Theme Slice

The following settings remain in the theme slice for now:

- `holidayChoices`: Holiday selection and budgets
- `giftBudgetLimit`: Overall gift budget limit

## Future Enhancements

1. **Additional Preferences**: Add more user preference fields as needed
2. **Component Migration**: Gradually migrate all components to use user preferences
3. **Caching**: Implement caching for better performance
4. **Offline Support**: Add offline preference management
5. **Bulk Updates**: Support for updating multiple preferences at once
