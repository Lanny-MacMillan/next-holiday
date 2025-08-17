# Database Tables Design

This document outlines the proposed PostgreSQL schema for the Next Holiday application, derived from Redux state analysis.

## Core Tables

### users

**Purpose**: Store Auth0 user information and profile data
**Redux Source**: `userSlice.user` (User interface)
**Key Columns**:

- `id` (uuid, PK) - Internal user ID
- `auth0_sub` (text, unique) - Auth0 subject identifier
- `email` (text, nullable) - User email address
- `name` (text, nullable) - Display name
- `picture` (text, nullable) - Profile picture URL
- `is_in_db` (boolean) - Whether user exists in our system
- `is_first_login` (boolean) - First-time user flag
- `created_at` (timestamptz) - Account creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**Keys/Indexes**:

- PK: `id`
- Unique: `auth0_sub`
- Index: `(email)` for lookups

**Why**: Auth0 integration requires storing user profile data and tracking first-time users for onboarding flows.

### accounts

**Purpose**: Multi-tenant households/families for collaboration
**Redux Source**: Derived from sharing patterns in `sharesSlice`
**Key Columns**:

- `id` (uuid, PK) - Account identifier
- `name` (text) - Account/household name
- `owner_user_id` (uuid, FK) - Primary account owner
- `created_at` (timestamptz) - Account creation
- `updated_at` (timestamptz) - Last update

**Keys/Indexes**:

- PK: `id`
- FK: `owner_user_id` → `users(id)`
- Index: `(owner_user_id)` for user's accounts

**Why**: Multi-user collaboration requires account-level organization. Each user can belong to multiple accounts (families, friend groups).

### account_members

**Purpose**: Many-to-many relationship between users and accounts
**Redux Source**: `sharesSlice.HolidayShare.memberUserIds`
**Key Columns**:

- `account_id` (uuid, FK) - Account reference
- `user_id` (uuid, FK) - User reference
- `role` (text) - Member role ('owner', 'admin', 'member')
- `invited_by` (uuid, FK, nullable) - Who invited this member
- `created_at` (timestamptz) - Membership creation

**Keys/Indexes**:

- Composite PK: `(account_id, user_id)`
- FK: `account_id` → `accounts(id)`
- FK: `user_id` → `users(id)`
- FK: `invited_by` → `users(id)`
- Index: `(user_id)` for user's memberships
- Index: `(account_id)` for account members

**Why**: Supports flexible collaboration where users can belong to multiple accounts with different roles.

### holidays

**Purpose**: Holiday instances with metadata and configuration
**Redux Source**: `holidayData` array + holiday-specific slices
**Key Columns**:

- `id` (uuid, PK) - Holiday instance ID
- `account_id` (uuid, FK) - Owning account
- `holiday_type` (text) - Holiday type ('christmas', 'birthday', etc.)
- `name` (text) - Custom holiday name
- `description` (text, nullable) - Holiday description
- `start_date` (date) - Holiday start date
- `end_date` (date, nullable) - Holiday end date
- `color_light` (text) - Light theme color
- `color_dark` (text) - Dark theme color
- `is_custom` (boolean) - Whether this is a custom holiday
- `created_by` (uuid, FK) - User who created the holiday
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update

**Keys/Indexes**:

- PK: `id`
- FK: `account_id` → `accounts(id)`
- FK: `created_by` → `users(id)`
- Index: `(account_id, holiday_type)` for account's holidays
- Index: `(start_date)` for date-based queries
- Index: `(is_custom)` for custom vs standard holidays

**Why**: Each holiday instance belongs to an account and can be shared among members. Supports both standard holidays and custom events.

### contacts

**Purpose**: Address book entries for gift recipients, card recipients, etc.
**Redux Source**: `addressBookSlice.contacts[]` (Contact interface)
**Key Columns**:

- `id` (uuid, PK) - Contact identifier
- `account_id` (uuid, FK) - Owning account
- `name` (text) - Contact name
- `email` (text, nullable) - Email address
- `phone` (text, nullable) - Phone number
- `street_address` (text, nullable) - Street address
- `city` (text, nullable) - City
- `state` (text, nullable) - State/province
- `postal_code` (text, nullable) - ZIP/postal code
- `relationship` (text, nullable) - Relationship to user
- `notes` (text, nullable) - Additional notes
- `created_by` (uuid, FK) - User who created contact
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update

**Keys/Indexes**:

- PK: `id`
- FK: `account_id` → `accounts(id)`
- FK: `created_by` → `users(id)`
- Index: `(account_id)` for account's contacts
- Index: `(name)` for name searches
- Index: `(email)` for email lookups

**Why**: Centralized contact management for gifts, cards, and guest lists. Contacts are scoped to accounts for privacy.

### tasks

**Purpose**: Generic and holiday-specific tasks with priorities and assignments
**Redux Source**: `tasksSlice.tasks[]` + holiday-specific task slices
**Key Columns**:

- `id` (uuid, PK) - Task identifier
- `holiday_id` (uuid, FK) - Associated holiday
- `title` (text) - Task title
- `description` (text, nullable) - Task description
- `priority` (text) - Priority level ('low', 'medium', 'high')
- `category` (text, nullable) - Task category
- `is_completed` (boolean) - Completion status
- `completed_date` (timestamptz, nullable) - When completed
- `due_date` (date, nullable) - Due date
- `assigned_to` (uuid, FK, nullable) - Assigned user
- `created_by` (uuid, FK) - Task creator
- `share_id` (uuid, FK, nullable) - Associated share for collaboration
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update

**Keys/Indexes**:

- PK: `id`
- FK: `holiday_id` → `holidays(id)`
- FK: `assigned_to` → `users(id)`
- FK: `created_by` → `users(id)`
- FK: `share_id` → `shares(id)`
- Index: `(holiday_id)` for holiday's tasks
- Index: `(assigned_to)` for user's assigned tasks
- Index: `(is_completed)` for completion filtering
- Index: `(due_date)` for date-based queries
- Partial index: `(holiday_id) WHERE is_completed = false` for open tasks

**Why**: Tasks are the core planning entity, supporting both individual and collaborative task management with priorities and assignments.

### task_assignees

**Purpose**: Many-to-many relationship for task assignments
**Redux Source**: Derived from task assignment patterns
**Key Columns**:

- `task_id` (uuid, FK) - Task reference
- `user_id` (uuid, FK) - User reference
- `assigned_at` (timestamptz) - Assignment timestamp
- `assigned_by` (uuid, FK) - Who made the assignment

**Keys/Indexes**:

- Composite PK: `(task_id, user_id)`
- FK: `task_id` → `tasks(id)`
- FK: `user_id` → `users(id)`
- FK: `assigned_by` → `users(id)`
- Index: `(user_id)` for user's assignments

**Why**: Supports multiple assignees per task for collaborative planning.

### gifts

**Purpose**: Gift lists with recipients, prices, and purchase tracking
**Redux Source**: `giftListSlice.gifts[]` + holiday-specific gift slices
**Key Columns**:

- `id` (uuid, PK) - Gift identifier
- `holiday_id` (uuid, FK) - Associated holiday
- `contact_id` (uuid, FK, nullable) - Recipient contact
- `name` (text) - Gift name
- `description` (text, nullable) - Gift description
- `price` (numeric(12,2)) - Estimated price
- `actual_price` (numeric(12,2), nullable) - Actual purchase price
- `store` (text, nullable) - Store name
- `product_link` (text, nullable) - Product URL
- `notes` (text, nullable) - Additional notes
- `is_completed` (boolean) - Purchase status
- `completed_date` (timestamptz, nullable) - When purchased
- `created_by` (uuid, FK) - Gift creator
- `share_id` (uuid, FK, nullable) - Associated share
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update

**Keys/Indexes**:

- PK: `id`
- FK: `holiday_id` → `holidays(id)`
- FK: `contact_id` → `contacts(id)`
- FK: `created_by` → `users(id)`
- FK: `share_id` → `shares(id)`
- Index: `(holiday_id)` for holiday's gifts
- Index: `(contact_id)` for recipient's gifts
- Index: `(is_completed)` for completion filtering
- Index: `(price)` for budget queries

**Why**: Gift tracking with price management and recipient association. Supports both individual and shared gift lists.

### cards

**Purpose**: Greeting cards with recipients and sending status
**Redux Source**: `cardsSlice.cards[]` + holiday-specific card slices
**Key Columns**:

- `id` (uuid, PK) - Card identifier
- `holiday_id` (uuid, FK) - Associated holiday
- `contact_id` (uuid, FK, nullable) - Recipient contact
- `recipient` (text) - Recipient name
- `address` (text, nullable) - Mailing address
- `message` (text) - Card message
- `is_completed` (boolean) - Sent status
- `sent_date` (timestamptz, nullable) - When sent
- `created_by` (uuid, FK) - Card creator
- `share_id` (uuid, FK, nullable) - Associated share
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update

**Keys/Indexes**:

- PK: `id`
- FK: `holiday_id` → `holidays(id)`
- FK: `contact_id` → `contacts(id)`
- FK: `created_by` → `users(id)`
- FK: `share_id` → `shares(id)`
- Index: `(holiday_id)` for holiday's cards
- Index: `(contact_id)` for recipient's cards
- Index: `(is_completed)` for sending status

**Why**: Card management with recipient tracking and sending status for holiday greetings.

### budgets

**Purpose**: Budget tracking for holidays (Thanksgiving, Halloween)
**Redux Source**: `thanksgivingBudgetSlice.budgets[]`, `halloweenBudgetSlice`
**Key Columns**:

- `id` (uuid, PK) - Budget identifier
- `holiday_id` (uuid, FK) - Associated holiday
- `name` (text) - Budget name
- `total_budget` (numeric(12,2)) - Total budget amount
- `spent_amount` (numeric(12,2)) - Amount spent
- `remaining_amount` (numeric(12,2)) - Remaining budget
- `currency` (text) - Currency code
- `start_date` (date) - Budget start date
- `end_date` (date) - Budget end date
- `created_by` (uuid, FK) - Budget creator
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update

**Keys/Indexes**:

- PK: `id`
- FK: `holiday_id` → `holidays(id)`
- FK: `created_by` → `users(id)`
- Index: `(holiday_id)` for holiday's budgets
- Index: `(start_date, end_date)` for date range queries

**Why**: Budget tracking for holiday planning with spending limits and currency support.

### budget_transactions

**Purpose**: Individual budget line items and expenses
**Redux Source**: `thanksgivingBudgetSlice.budgetItems[]`
**Key Columns**:

- `id` (uuid, PK) - Transaction identifier
- `budget_id` (uuid, FK) - Associated budget
- `name` (text) - Transaction name
- `description` (text, nullable) - Transaction description
- `amount` (numeric(12,2)) - Transaction amount
- `category` (text) - Expense category
- `transaction_date` (date) - Transaction date
- `is_expense` (boolean) - Whether this is an expense
- `created_by` (uuid, FK) - Transaction creator
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update

**Keys/Indexes**:

- PK: `id`
- FK: `budget_id` → `budgets(id)`
- FK: `created_by` → `users(id)`
- Index: `(budget_id)` for budget's transactions
- Index: `(category)` for category filtering
- Index: `(transaction_date)` for date-based queries

**Why**: Detailed budget tracking with categories and transaction history.

### shares

**Purpose**: Holiday sharing for multi-user collaboration
**Redux Source**: `sharesSlice.shares[]` (HolidayShare interface)
**Key Columns**:

- `id` (uuid, PK) - Share identifier
- `holiday_id` (uuid, FK) - Associated holiday
- `owner_user_id` (uuid, FK) - Share owner
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update

**Keys/Indexes**:

- PK: `id`
- FK: `holiday_id` → `holidays(id)`
- FK: `owner_user_id` → `users(id)`
- Unique: `(holiday_id)` - One share per holiday
- Index: `(owner_user_id)` for user's shares

**Why**: Enables holiday sharing and collaboration between users.

### share_members

**Purpose**: Many-to-many relationship for share membership
**Redux Source**: `sharesSlice.HolidayShare.memberUserIds`
**Key Columns**:

- `share_id` (uuid, FK) - Share reference
- `user_id` (uuid, FK) - User reference
- `joined_at` (timestamptz) - When user joined
- `invited_by` (uuid, FK, nullable) - Who invited this user

**Keys/Indexes**:

- Composite PK: `(share_id, user_id)`
- FK: `share_id` → `shares(id)`
- FK: `user_id` → `users(id)`
- FK: `invited_by` → `users(id)`
- Index: `(user_id)` for user's shares
- Index: `(share_id)` for share members

**Why**: Tracks share membership and invitation history.

### invites

**Purpose**: Invitation system for holiday sharing
**Redux Source**: `invitesSlice.invites[]` (Invite interface)
**Key Columns**:

- `id` (uuid, PK) - Invite identifier
- `share_id` (uuid, FK) - Associated share
- `from_user_id` (uuid, FK) - Invitation sender
- `to_user_id` (uuid, FK, nullable) - Invited user (if registered)
- `to_email` (text, nullable) - Invited email (if not registered)
- `holiday_key` (text) - Holiday type for context
- `status` (text) - Invite status ('pending', 'accepted', 'declined', 'expired')
- `message` (text, nullable) - Invitation message
- `responded_at` (timestamptz, nullable) - Response timestamp
- `created_at` (timestamptz) - Creation timestamp

**Keys/Indexes**:

- PK: `id`
- FK: `share_id` → `shares(id)`
- FK: `from_user_id` → `users(id)`
- FK: `to_user_id` → `users(id)`
- Index: `(to_email)` for email-based invites
- Index: `(status)` for status filtering
- Index: `(share_id)` for share's invites

**Why**: Invitation system supports both registered and unregistered users for holiday sharing.

### kwanzaa_principles

**Purpose**: Special daily principle tracking for Kwanzaa
**Redux Source**: `kwanzaaTasksSlice` with "Daily Principles" category
**Key Columns**:

- `id` (uuid, PK) - Principle identifier
- `holiday_id` (uuid, FK) - Associated Kwanzaa holiday
- `day_number` (integer) - Day of Kwanzaa (1-7)
- `name` (text) - Principle name
- `description` (text, nullable) - Principle description
- `is_completed` (boolean) - Completion status
- `completed_at` (timestamptz, nullable) - When completed
- `notes` (text, nullable) - Additional notes
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update

**Keys/Indexes**:

- PK: `id`
- FK: `holiday_id` → `holidays(id)`
- Unique: `(holiday_id, day_number)` - One principle per day per holiday
- Index: `(is_completed)` for completion filtering

**Why**: Specialized tracking for Kwanzaa's seven principles, one per day.

### guest_lists

**Purpose**: Guest lists for events and parties
**Redux Source**: Holiday-specific guest list slices (birthday, graduation, etc.)
**Key Columns**:

- `id` (uuid, PK) - Guest list identifier
- `holiday_id` (uuid, FK) - Associated holiday
- `contact_id` (uuid, FK) - Guest contact
- `rsvp_status` (text, nullable) - RSVP status ('pending', 'confirmed', 'declined')
- `rsvp_date` (timestamptz, nullable) - When RSVP was received
- `notes` (text, nullable) - Guest-specific notes
- `created_by` (uuid, FK) - List creator
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update

**Keys/Indexes**:

- PK: `id`
- FK: `holiday_id` → `holidays(id)`
- FK: `contact_id` → `contacts(id)`
- FK: `created_by` → `users(id)`
- Unique: `(holiday_id, contact_id)` - One entry per guest per holiday
- Index: `(rsvp_status)` for status filtering

**Why**: Guest list management with RSVP tracking for events and parties.

### audit_log

**Purpose**: Activity tracking for debugging and compliance
**Redux Source**: Not in Redux, but recommended for production
**Key Columns**:

- `id` (uuid, PK) - Log entry identifier
- `account_id` (uuid, FK) - Associated account
- `user_id` (uuid, FK, nullable) - User who performed action
- `action` (text) - Action performed
- `entity_type` (text) - Type of entity affected
- `entity_id` (uuid, nullable) - ID of affected entity
- `details` (jsonb, nullable) - Additional action details
- `ip_address` (inet, nullable) - User's IP address
- `user_agent` (text, nullable) - User's browser/device
- `created_at` (timestamptz) - Action timestamp

**Keys/Indexes**:

- PK: `id`
- FK: `account_id` → `accounts(id)`
- FK: `user_id` → `users(id)`
- Index: `(account_id, created_at)` for account activity
- Index: `(user_id, created_at)` for user activity
- Index: `(entity_type, entity_id)` for entity history
- Index: `(created_at)` for time-based queries

**Why**: Audit trail for security, debugging, and compliance requirements.

## Enums and Constraints

### Task Priority

```sql
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
```

### Task Status

```sql
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
```

### RSVP Status

```sql
CREATE TYPE rsvp_status AS ENUM ('pending', 'confirmed', 'declined', 'maybe');
```

### Invite Status

```sql
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
```

### Member Role

```sql
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member');
```

## Denormalizations

1. **Budget amounts in budgets table**: `spent_amount` and `remaining_amount` are calculated from `budget_transactions` but stored for performance.

2. **Task completion dates**: `completed_date` is denormalized from the completion action for quick queries.

3. **Share member counts**: Could be calculated but may be cached for performance in high-traffic scenarios.

## Notes

- All tables use UUID primary keys with `gen_random_uuid()` for security
- Timestamps use `timestamptz` for timezone awareness
- Money fields use `numeric(12,2)` for precision
- Foreign keys include `ON DELETE CASCADE` where child records shouldn't outlive parents
- Indexes are optimized for common query patterns from the Redux selectors
- The schema supports both individual and collaborative holiday planning
- Auth0 integration is handled through the `auth0_sub` field in users table
