# Holiday Sharing Implementation Notes

## Overview

This document outlines the implementation of per-holiday invites and sharing functionality for the Next.js + Redux holiday app.

## Architecture

### Data Model

#### HolidayShare Entity

- `shareId`: UUID representing collaboration on a single holiday instance
- `holidayKey`: String identifier for the holiday (e.g., "christmas-2025")
- `ownerUserId`: Auth0 sub of the share creator
- `memberUserIds`: Array of Auth0 subs for all members
- `createdAt`: ISO timestamp
- `updatedAt`: ISO timestamp

#### Invite Entity

- `inviteId`: UUID for the invite
- `shareId`: Reference to the HolidayShare
- `fromUserId`: Auth0 sub of the sender
- `toUserId` or `toEmail`: Recipient identifier
- `holidayKey`: String identifier for the holiday
- `status`: "pending" | "accepted" | "declined" | "expired"
- `message`: Optional personal message
- `createdAt`: ISO timestamp
- `respondedAt`: Optional ISO timestamp

### Redux Store Structure

#### sharesSlice

- Manages HolidayShare entities
- CRUD operations for shares
- Selectors for finding shares by holiday key and user membership

#### invitesSlice

- Manages Invite entities
- Handles invite lifecycle (create, accept, decline)
- Selectors for pending and outgoing invites

### API Routes (Temporary/Mock)

#### Shares

- `POST /api/shares` - Create new share
- `GET /api/shares?holidayKey=X` - Get share by holiday key
- `POST /api/shares/:shareId/members` - Add member to share

#### Invites

- `POST /api/invites` - Create new invite
- `GET /api/invites?inbox=1&userId=X` - Get pending invites for user
- `POST /api/invites/:inviteId/accept` - Accept invite
- `POST /api/invites/:inviteId/decline` - Decline invite

### UI Components

#### InviteButton

- Located under countdown timer on holiday cards (main page and holiday pages)
- Opens modal to invite users by email
- Creates share if none exists, then creates invite

#### AlertsBell

- Located in main app header
- Shows badge with pending invite count
- Modal with inbox/outgoing tabs for invite management

#### SharedIndicator

- Shows "Shared" pill and member avatars
- Appears when holiday is shared
- Located next to holiday title on cards

#### CountdownWithInvite

- Wrapper component combining countdown and invite button
- Can be used as drop-in replacement for CountdownTimer
- Compact version available for card layouts

## Sharing Logic

### Permission Model

- Anyone in `memberUserIds` can read/write items for that `shareId`
- Owner is the invite initiator
- All members default to "editor" role (extensible for future roles)

### Data Filtering

- When `shareId` exists, entities are filtered by `shareId`
- When no `shareId`, entities are filtered to exclude those with `shareId` (private data)
- Selectors handle this logic automatically

### Migration Strategy

- When invite is accepted, existing holiday data is migrated to include `shareId`
- New items created under shared holiday automatically carry `shareId`

## Future Database Mapping

### Tables Structure

```sql
-- Holiday shares
CREATE TABLE holiday_shares (
    id UUID PRIMARY KEY,
    holiday_key VARCHAR(255) NOT NULL,
    owner_user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Share members
CREATE TABLE share_members (
    share_id UUID REFERENCES holiday_shares(id),
    user_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'editor',
    PRIMARY KEY (share_id, user_id)
);

-- Share invites
CREATE TABLE share_invites (
    id UUID PRIMARY KEY,
    share_id UUID REFERENCES holiday_shares(id),
    from_user_id VARCHAR(255) NOT NULL,
    to_user_id VARCHAR(255),
    to_email VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP NOT NULL,
    responded_at TIMESTAMP
);

-- Domain tables with share_id foreign key
ALTER TABLE tasks ADD COLUMN share_id UUID REFERENCES holiday_shares(id);
ALTER TABLE gifts ADD COLUMN share_id UUID REFERENCES holiday_shares(id);
ALTER TABLE cards ADD COLUMN share_id UUID REFERENCES holiday_shares(id);
ALTER TABLE budgets ADD COLUMN share_id UUID REFERENCES holiday_shares(id);
ALTER TABLE rsvps ADD COLUMN share_id UUID REFERENCES holiday_shares(id);
ALTER TABLE expenses ADD COLUMN share_id UUID REFERENCES holiday_shares(id);
```

### Migration Strategy

1. Replace mock database with real database layer
2. Implement repository pattern with database-specific implementations
3. Add database migrations for schema changes
4. Implement data migration scripts for existing users

## Testing

### Unit Tests Needed

- `invitesSlice` reducers (send/accept/decline)
- `sharesSlice` reducers (create/update/add member)
- Migration utility functions
- Selector functions

### Integration Tests Needed

- Complete invite flow: create share → send invite → accept invite → verify shared data
- Permission validation
- Data filtering by shareId

## Security Considerations

### Auth0 Integration

- All user identification uses `auth0_sub` from session
- No user input validation for user IDs (handled by Auth0)

### Data Access Control

- API routes should validate user permissions
- Frontend selectors filter data appropriately
- Share membership validation on all operations

### Future Enhancements

- Invite expiration (currently no expiration)
- Role-based permissions (owner vs editor)
- Share deletion and member removal
- Real-time updates via WebSocket
- Email notifications for invites

## Copy/Text Guidelines

### Button Labels

- Invite button: "Invite"
- Send button: "Send Invite"
- Accept: "Accept"
- Decline: "Decline"

### Modal Titles

- Invite modal: "Share this holiday"
- Alerts modal: "Invites & Alerts"

### Field Labels

- Email field: "Invite by email or user ID"

### Toast Messages

- "Invite sent"
- "You're now sharing this holiday"
- "Invite declined"

## Implementation Status

### Completed

- ✅ Redux slices for shares and invites
- ✅ Mock database with repository pattern
- ✅ API routes for all CRUD operations
- ✅ UI components (InviteButton, AlertsBell, SharedIndicator)
- ✅ Updated existing slices with shareId support
- ✅ Selectors for filtering by shareId
- ✅ Integration with existing holiday pages using CountdownWithInvite
- ✅ SharedIndicator on holiday cards next to titles

### Pending

- 🔄 Toast notifications
- 🔄 Unit and integration tests
- 🔄 Real database implementation
- 🔄 Email notifications
- �� Real-time updates
