# Holiday Sharing Feature

This document explains how to use the new per-holiday sharing functionality in the Next.js + Redux holiday app.

## Overview

The sharing feature allows users to collaborate on specific holidays by inviting others to share tasks, gifts, budgets, and other holiday-related data. Sharing is per-holiday only, not app-wide.

## How It Works

### 1. Sending Invites

1. Navigate to the main page (`/`) or any holiday page
2. Look for the **Invite** button under the countdown timer on holiday cards
3. Click the button to open the invite modal
4. Enter the recipient's email address and optional message
5. Click **Send Invite**

The system will:

- Create a share for the holiday if one doesn't exist
- Send an invite to the recipient
- Show a "Invite sent" confirmation

### 2. Managing Invites

1. Look for the **Alerts bell** in the main app header
2. The bell shows a badge with the number of pending invites
3. Click the bell to open the invites modal
4. Use the **Inbox** tab to see incoming invites
5. Use the **Outgoing** tab to see sent invites and their status

### 3. Accepting Invites

1. In the Alerts modal, find the invite you want to accept
2. Click **Accept** to join the shared holiday
3. You'll see a "You're now sharing this holiday" confirmation
4. The holiday page will now show a "Shared" indicator with member avatars

### 4. Declining Invites

1. In the Alerts modal, find the invite you want to decline
2. Click **Decline** to reject the invite
3. The sender will see the declined status in their outgoing invites

## Visual Indicators

### Shared Holiday Indicators

- **Shared pill**: Shows "Shared" with a checkmark icon (next to holiday title)
- **Member avatars**: Shows up to 2 member initials with a "+X" for additional members
- **Invite button**: Located under countdown timer on holiday cards

### Alerts Bell

- **Badge**: Shows count of pending invites
- **Modal**: Tabs for inbox and outgoing invites
- **Status badges**: Shows pending, accepted, declined, or expired status

## Data Sharing

### What Gets Shared

- Tasks
- Gift lists
- Cards
- Budgets
- RSVPs
- Expenses

### How Data is Filtered

- **When shared**: Only items with the matching `shareId` are shown
- **When private**: Only items without a `shareId` are shown
- **New items**: Automatically get the `shareId` when created under a shared holiday

### Permissions

- All share members can read and write shared data
- Private data remains private to each user
- Share owner has the same permissions as members

## Technical Implementation

### Redux Store

The sharing functionality is implemented using two new Redux slices:

- **`sharesSlice`**: Manages holiday shares and member relationships
- **`invitesSlice`**: Manages invite lifecycle and status

### API Routes

Temporary mock API routes are implemented:

- `POST /api/shares` - Create share
- `POST /api/invites` - Create invite
- `POST /api/invites/:id/accept` - Accept invite
- `POST /api/invites/:id/decline` - Decline invite
- `GET /api/invites?inbox=1` - Get pending invites

### Database Design

The implementation is designed to be easily replaced with a real database:

```sql
-- Core tables
holiday_shares (id, holiday_key, owner_user_id, created_at, updated_at)
share_members (share_id, user_id, role)
share_invites (id, share_id, from_user_id, to_user_id, to_email, status, message, created_at, responded_at)

-- Domain tables with share_id foreign key
tasks, gifts, cards, budgets, rsvps, expenses (all with share_id column)
```

## Usage Examples

### Basic Invite Flow

```typescript
// 1. User clicks Invite button
// 2. System creates share (if needed)
const share = await dispatch(
  createShare({
    holidayKey: 'christmas',
    ownerUserId: user.sub,
    memberUserIds: [user.sub],
  }),
).unwrap();

// 3. System creates invite
await dispatch(
  createInvite({
    shareId: share.shareId,
    fromUserId: user.sub,
    toEmail: 'friend@example.com',
    holidayKey: 'christmas',
    message: "Let's plan Christmas together!",
  }),
).unwrap();
```

### Accepting an Invite

```typescript
// 1. User clicks Accept
const result = await dispatch(acceptInvite(inviteId)).unwrap();

// 2. System adds user to share
dispatch(addShare(result.share));

// 3. System migrates existing data
await migrateHolidayDataToShare(
  result.invite.holidayKey,
  result.share.shareId,
  dispatch,
);
```

### Using Shared Data Selectors

```typescript
// Get tasks for a holiday (shared or private)
const tasks = useAppSelector(state =>
  selectTasksForHoliday(state, 'christmas', shareId),
);

// Check if holiday is shared
const isShared = useAppSelector(state => selectIsHolidayShared(state, 'christmas'));
```

## Future Enhancements

- **Real-time updates**: WebSocket integration for live collaboration
- **Email notifications**: Send emails when invites are sent/accepted/declined
- **Role-based permissions**: Owner vs editor roles
- **Share management**: Remove members, delete shares
- **Invite expiration**: Auto-expire invites after a certain time
- **Real database**: Replace mock implementation with PostgreSQL/MySQL

## Troubleshooting

### Common Issues

1. **Invite button not showing**: Make sure you're logged in and the holiday page is loaded
2. **Can't accept invite**: Check that the invite is still pending and not expired
3. **Shared data not showing**: Verify that you're a member of the share
4. **TypeScript errors**: Make sure all imports are correct and types are defined

### Debug Information

- Check browser console for API errors
- Verify Redux state in DevTools
- Check network tab for failed requests

## Support

For issues or questions about the sharing functionality, refer to the `SHARING_NOTES.md` file for technical implementation details.
