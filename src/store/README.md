# Redux Store Configuration

## Overview

This Redux store manages the application state for holiday planning, including user data, theme settings, and holiday-specific data.

## Performance Optimization

### Serializable State Warning

If you see a warning about `SerializableStateInvariantMiddleware` taking too long, this is due to the large number of reducers in the store. The warning is development-only and won't affect production.

### Solutions

1. **Increased Threshold (Recommended)**

   - The middleware warning threshold has been increased from 32ms to 128ms
   - This should resolve most warnings while maintaining safety checks

2. **Disable Serializable Check (Development Only)**

   - Create a `.env.local` file in your project root
   - Add: `NEXT_PUBLIC_DISABLE_SERIALIZABLE_CHECK=true`
   - This completely disables the serializable check in development

3. **Production Build**
   - The warning is automatically disabled in production builds
   - No action needed for production

### Middleware Configuration

- **Serializable Check**: Validates that actions and state are serializable
- **Immutable Check**: Validates that state mutations are handled correctly
- **Ignored Actions**: Persist-related actions are ignored
- **Ignored Paths**: User object from Auth0 is ignored (may contain non-serializable data)

## Store Structure

### Core Slices

- `user`: User authentication and profile data
- `theme`: UI theme and display settings
- `cards`: Holiday card management
- `giftList`: Gift tracking
- `tasks`: Task management
- `countdown`: Holiday countdown timers

### Holiday-Specific Slices

Each holiday has its own set of slices:

- `{holiday}GiftList`: Gift tracking for specific holiday
- `{holiday}Tasks`: Task management for specific holiday
- `{holiday}Countdown`: Countdown timer for specific holiday

### Example Holiday Slices

- `christmasGiftList`, `christmasTasks`, `christmasCountdown`
- `valentinesGiftList`, `valentinesTasks`, `valentinesCountdown`
- `halloweenGiftList`, `halloweenTasks`, `halloweenCountdown`
- And many more...

## Usage

### Accessing State

```typescript
import { useAppSelector } from "@/store/hooks";

const user = useAppSelector((state) => state.user.user);
const theme = useAppSelector((state) => state.theme.settings);
```

### Dispatching Actions

```typescript
import { useAppDispatch } from "@/store/hooks";
import { updateSettings } from "@/store/slices/themeSlice";

const dispatch = useAppDispatch();
dispatch(updateSettings({ displayMode: "gamified" }));
```

## Development Tips

1. **Redux DevTools**: Available in development mode
2. **Middleware Logging**: Configuration is logged in development
3. **Performance**: Large store size is normal due to many holiday-specific slices
4. **Serializable Check**: Can be disabled if performance is an issue

## Troubleshooting

### Performance Issues

- Check browser console for middleware configuration logs
- Consider disabling serializable check in development
- Monitor Redux DevTools for large state changes

### State Persistence

- Theme settings are automatically saved to localStorage
- User data is managed by Auth0
- Other state is ephemeral (resets on page reload)
