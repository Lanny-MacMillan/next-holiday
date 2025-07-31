# Redux Store Documentation

This document describes the Redux store setup and available slices for the Holiday Planner app.

## Store Configuration

The store is configured in `src/store/index.ts` and includes the following slices:

- `addressBook` - Contact management
- `cards` - Holiday cards tracking
- `giftList` - Gift list management
- `tasks` - To-do list management
- `user` - Authentication user data
- `theme` - Theme and user settings

## Available Slices

### Address Book Slice

- Track contact information
- Manage relationships and addresses
- Sort contacts by various criteria

**Available Actions:**

- `fetchContacts()` - Load all contacts
- `addContact(contact)` - Add new contact
- `updateContact(contact)` - Update existing contact
- `deleteContact(id)` - Delete contact

**State Structure:**

```typescript
{
  contacts: Contact[],
  loading: boolean,
  error: string | null,
  initialized: boolean
}
```

### Cards Slice

- Track card completion status
- Mark cards as completed
- Message and recipient management

**Available Actions:**

- `fetchCards()` - Load all cards
- `addCard(card)` - Add new card
- `deleteCard(id)` - Delete card
- `toggleCardCompletion(id)` - Toggle card completion status

**State Structure:**

```typescript
{
  cards: Card[],
  loading: boolean,
  error: string | null,
  initialized: boolean
}
```

### Gift List Slice

- Track gift completion status
- Mark gifts as completed
- Price and store information
- Product link management
- Recipient management

**Available Actions:**

- `fetchGifts()` - Load all gifts
- `addGift(gift)` - Add new gift
- `updateGift(gift)` - Update existing gift
- `deleteGift(id)` - Delete gift
- `toggleGiftCompletion(id)` - Toggle gift completion status

**State Structure:**

```typescript
{
  gifts: Gift[],
  loading: boolean,
  error: string | null,
  initialized: boolean
}
```

### Tasks Slice

- Track task completion status
- Mark tasks as completed
- Priority and due date management
- Category and assignment tracking

**Available Actions:**

- `fetchTasks()` - Load all tasks
- `addTask(task)` - Add new task
- `updateTask(task)` - Update existing task
- `deleteTask(id)` - Delete task
- `toggleTaskCompletion(id)` - Toggle task completion status

**State Structure:**

```typescript
{
  tasks: Task[],
  loading: boolean,
  error: string | null,
  initialized: boolean
}
```

### User Slice

- Store authenticated user information
- Track first-login status
- Manage user database presence

**Available Actions:**

- `setUser(user)` - Set current user
- `clearUser()` - Clear user data
- `checkUserInDb(sub)` - Check if user exists in database
- `addUserToDb(userData)` - Add user to database

**State Structure:**

```typescript
{
  user: User | null,
  loading: boolean,
  error: string | null,
  initialized: boolean
}
```

### Theme Slice

- Manage dark/light mode theme
- Store user preferences and settings
- Persist settings in localStorage

**Available Actions:**

- `toggleTheme()` - Toggle between light and dark mode
- `setTheme(theme)` - Set specific theme
- `updateSettings(settings)` - Update user settings
- `initializeTheme()` - Initialize theme from localStorage

**State Structure:**

```typescript
{
  settings: {
    theme: "light" | "dark",
    defaultHoliday: string,
    giftBudgetLimit: number,
    greetingStyle: "formal" | "informal",
    notifications: {
      reminders: boolean,
      shippingAlerts: boolean,
      upcomingEvents: boolean
    }
  },
  initialized: boolean
}
```

## Authentication Setup

### Auth0 Configuration

1. Create a `.env.local` file in the root directory with your Auth0 credentials:

```
NEXT_PUBLIC_AUTH0_DOMAIN=your-domain.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
NEXT_PUBLIC_AUTH0_CALLBACK_URL=http://localhost:3000
```

2. Configure your Auth0 application:
   - Set the callback URL to `http://localhost:3000`
   - Set the logout URL to `http://localhost:3000`
   - Enable the appropriate grant types (Authorization Code, Refresh Token)

### First-Login Check

The app automatically detects first-time users and:

1. Checks if the user exists in the database (simulated)
2. Adds new users to the database (simulated)
3. Stores user information in Redux state
4. Logs the first-login event to console

### Components

- `Auth0ProviderWrapper` - Wraps the app with Auth0 provider
- `AuthWrapper` - Handles authentication state and user management
- `Header` - Responsive header with logout functionality and theme toggle
- `Login` - Login page for unauthenticated users
- `ThemeToggle` - Theme toggle component for dark/light mode
- `SettingsPage` - User settings page with preferences

## Theme and Settings

### Dark Mode Support

The app includes full dark mode support with:

- Automatic theme detection and persistence
- localStorage storage for user preferences
- Tailwind CSS dark mode classes
- Responsive design for both themes

### Settings Page

The `/settings` page includes:

- User information display (name, email, profile picture)
- Theme toggle (light/dark mode)
- Holiday preferences (default holiday, budget limit, greeting style)
- Notification preferences (reminders, shipping alerts, upcoming events)

### Theme Components

- **ThemeToggle**: Toggle button with sun/moon icons
- **Settings Integration**: Theme settings in the settings page
- **Automatic Persistence**: Settings saved to localStorage
- **Global Application**: Theme applied to entire app

## Usage

The store provides typed hooks for easy access:

- `useAppDispatch()` - Typed dispatch function
- `useAppSelector()` - Typed selector function

Example usage:

```typescript
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const dispatch = useAppDispatch();
const { user } = useAppSelector((state) => state.user);
const { settings } = useAppSelector((state) => state.theme);
```
