# Database Tables Design

This document outlines the current MySQL schema for the Next Holiday application, reflecting the implemented Prisma schema.

**📊 [View Live ERD Diagram](https://mermaid.ai/app/projects/5a13959b-bcd3-4844-834d-1f664ae6f043/diagrams/3605b52a-9a41-4a09-a764-2c6ee2d62a92/version/v0.1/edit)** - Interactive database schema visualization

## Database Information

- **Engine**: MySQL
- **Schema Management**: Prisma ORM
- **Generated Client**: Located at `src/generated/prisma`

## Core Tables

### users

**Purpose**: Store Auth0 user information, profile data, and subscription details

**Description**: Central user table integrating with Auth0 OAuth and managing subscription plans.

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | CHAR(36) | No | uuid() | Primary key UUID |
| auth0Sub | VARCHAR(191) | No | - | Auth0 subject identifier (unique) |
| email | VARCHAR(191) | Yes | - | User email address |
| name | VARCHAR(191) | Yes | - | Display name |
| picture | TEXT | Yes | - | Profile picture URL |
| isInDb | BOOLEAN | No | false | Whether user exists in our system |
| isFirstLogin | BOOLEAN | No | true | First-time user flag for onboarding |
| subscriptionPlan | ENUM | No | 'free' | Subscription tier (free, plus) |
| subscriptionStartDate | DATETIME(3) | Yes | - | Subscription start timestamp |
| subscriptionEndDate | DATETIME(3) | Yes | - | Subscription end timestamp |
| createdAt | DATETIME(3) | No | now() | Account creation timestamp |
| updatedAt | DATETIME(3) | No | now() | Last update timestamp |

**Constraints**:

- Primary Key: `id`
- Unique Constraints: `auth0Sub`
- Indexes: `email`

**Relationships**:

- has_one: UserPreferences
- has_many: AccountMember (as user)
- has_many: AccountMember (as inviter)
- has_many: Account (as owner)
- has_many: AuditLog
- has_many: Budget (as creator)
- has_many: BudgetTransaction (as creator)
- has_many: Card (as creator)
- has_many: Contact (as creator)
- has_many: Gift (as creator)
- has_many: GuestList (as creator)
- has_many: Holiday (as creator)
- has_many: Invite (as sender)
- has_many: Invite (as receiver)
- has_many: ShareMember (as inviter)
- has_many: ShareMember (as user)
- has_many: Share (as owner)
- has_many: TaskAssignee (as assigner)
- has_many: TaskAssignee (as user)
- has_many: Task (as assignee)
- has_many: Task (as creator)
- has_many: Notification (as recipient)
- has_many: Notification (as sender)
- has_one: NotificationPreferences

### user_preferences

**Purpose**: Store user-specific application preferences and settings

**Description**: Comprehensive preferences table for theme, display mode, notifications, and accessibility settings.

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | CHAR(36) | No | uuid() | Primary key UUID |
| userId | CHAR(36) | No | - | Foreign key to users table |
| theme | VARCHAR(191) | No | 'system' | Theme preference (system, light, dark) |
| displayMode | VARCHAR(191) | No | 'professional' | Display mode (professional, gamified) |
| showCompletedItems | BOOLEAN | No | true | Show completed items in lists |
| showCountdown | BOOLEAN | No | true | Show countdown timers |
| showProgressBars | BOOLEAN | No | true | Show progress indicators |
| emailNotifications | BOOLEAN | No | true | Enable email notifications |
| pushNotifications | BOOLEAN | No | true | Enable push notifications |
| reminderNotifications | BOOLEAN | No | true | Enable reminder notifications |
| taskDueReminders | BOOLEAN | No | true | Enable task due reminders |
| holidayCountdownAlerts | BOOLEAN | No | true | Enable holiday countdown alerts |
| timezone | VARCHAR(191) | No | 'UTC' | User timezone |
| locale | VARCHAR(191) | No | 'en-US' | User locale |
| reducedMotion | BOOLEAN | No | false | Accessibility: reduced motion |
| highContrast | BOOLEAN | No | false | Accessibility: high contrast |
| fontSize | VARCHAR(191) | No | 'medium' | Font size preference (small, medium, large) |
| createdAt | DATETIME(3) | No | now() | Record creation timestamp |
| updatedAt | DATETIME(3) | No | now() | Last update timestamp |

**Constraints**:

- Primary Key: `id`
- Unique Constraints: `userId`
- Foreign Keys: `userId` → `users(id)` ON DELETE CASCADE
- Indexes: `userId`

**Relationships**:

- belongs_to: User

### accounts

**Purpose**: Multi-tenant households/families for collaboration

**Description**: Account-level organization allowing users to collaborate on holiday planning within family or friend groups.

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | CHAR(36) | No | uuid() | Primary key UUID |
| name | VARCHAR(191) | No | - | Account/household name |
| ownerUserId | CHAR(36) | No | - | Primary account owner |
| createdAt | DATETIME(3) | No | now() | Account creation timestamp |
| updatedAt | DATETIME(3) | No | now() | Last update timestamp |

**Constraints**:

- Primary Key: `id`
- Foreign Keys: `ownerUserId` → `users(id)` ON DELETE CASCADE
- Indexes: `ownerUserId`

**Relationships**:

- belongs_to: User (as owner)
- has_many: AccountMember
- has_many: AuditLog
- has_many: Contact
- has_many: Holiday

### account_members

**Purpose**: Junction table for many-to-many relationship between accounts and users

**Description**: Manages membership and roles within accounts, supporting invitation workflows.

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| accountId | CHAR(36) | No | - | Foreign key to accounts table |
| userId | CHAR(36) | No | - | Foreign key to users table |
| role | ENUM | No | - | Member role (owner, admin, member) |
| invitedBy | CHAR(36) | Yes | - | User who sent the invitation |
| createdAt | DATETIME(3) | No | now() | Membership creation timestamp |

**Constraints**:

- Primary Key: `(accountId, userId)`
- Foreign Keys:
  - `accountId` → `accounts(id)` ON DELETE CASCADE
  - `userId` → `users(id)` ON DELETE CASCADE
  - `invitedBy` → `users(id)`
- Indexes: `userId`, `accountId`, `invitedBy`

**Relationships**:

- belongs_to: Account
- belongs_to: User (as user)
- belongs_to: User (as inviter)

### holidays

**Purpose**: Store holiday/celebration information and settings

**Description**: Central table for all holiday types (built-in and custom) with configuration for dates, colors, and countdown timers.

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | CHAR(36) | No | uuid() | Primary key UUID |
| accountId | CHAR(36) | No | - | Account this holiday belongs to |
| holidayType | VARCHAR(191) | No | - | Type identifier (christmas, birthday, etc.) |
| name | VARCHAR(191) | No | - | Display name for the holiday |
| description | TEXT | Yes | - | Optional description |
| startDate | DATE | No | - | Holiday start date |
| endDate | DATE | Yes | - | Holiday end date (for multi-day holidays) |
| countdownTimer | DATETIME(3) | Yes | - | Custom countdown target datetime |
| colorLight | VARCHAR(191) | No | - | Light theme color |
| colorDark | VARCHAR(191) | No | - | Dark theme color |
| isCustom | BOOLEAN | No | false | Whether this is a user-created holiday |
| createdBy | CHAR(36) | No | - | User who created this holiday |
| createdAt | DATETIME(3) | No | now() | Record creation timestamp |
| updatedAt | DATETIME(3) | No | now() | Last update timestamp |

**Constraints**:

- Primary Key: `id`
- Unique Constraints: `(accountId, holidayType)`
- Foreign Keys:
  - `accountId` → `accounts(id)` ON DELETE CASCADE
  - `createdBy` → `users(id)` ON DELETE CASCADE
- Indexes: `(accountId, holidayType)`, `startDate`, `isCustom`, `createdBy`

**Relationships**:

- belongs_to: Account
- belongs_to: User (as creator)
- has_many: Budget
- has_many: Card
- has_many: Gift
- has_many: GuestList
- has_many: KwanzaaPrinciple
- has_one: Share
- has_many: Task
- has_many: Notification

### contacts

**Purpose**: Centralized address book for gift recipients, card recipients, and guests

**Description**: Comprehensive contact management with address information and relationship tracking.

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | CHAR(36) | No | uuid() | Primary key UUID |
| accountId | CHAR(36) | No | - | Account this contact belongs to |
| name | VARCHAR(191) | No | - | Contact full name |
| email | VARCHAR(191) | Yes | - | Email address |
| phone | VARCHAR(191) | Yes | - | Phone number |
| streetAddress | VARCHAR(191) | Yes | - | Street address |
| city | VARCHAR(191) | Yes | - | City name |
| state | VARCHAR(191) | Yes | - | State/province |
| postalCode | VARCHAR(191) | Yes | - | ZIP/postal code |
| relationship | VARCHAR(191) | Yes | - | Relationship to user |
| notes | TEXT | Yes | - | Additional notes |
| createdBy | CHAR(36) | No | - | User who created this contact |
| createdAt | DATETIME(3) | No | now() | Record creation timestamp |
| updatedAt | DATETIME(3) | No | now() | Last update timestamp |

**Constraints**:

- Primary Key: `id`
- Unique Constraints: `(accountId, email)`
- Foreign Keys:
  - `accountId` → `accounts(id)` ON DELETE CASCADE
  - `createdBy` → `users(id)` ON DELETE CASCADE
- Indexes: `accountId`, `name`, `email`, `createdBy`

**Relationships**:

- belongs_to: Account
- belongs_to: User (as creator)
- has_many: Card
- has_many: Gift
- has_many: GuestList

### tasks

**Purpose**: Task management for holiday preparations

**Description**: Comprehensive task system with priority, assignment, categories, and sharing support.

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | CHAR(36) | No | uuid() | Primary key UUID |
| holidayId | CHAR(36) | No | - | Holiday this task belongs to |
| title | VARCHAR(191) | No | - | Task title |
| description | TEXT | Yes | - | Task description |
| priority | ENUM | No | 'low' | Task priority (low, medium, high) |
| category | VARCHAR(191) | Yes | - | Task category |
| isCompleted | BOOLEAN | No | false | Whether task is completed |
| completedDate | DATETIME(3) | Yes | - | Completion timestamp |
| dueDate | DATE | Yes | - | Task due date |
| assignedTo | CHAR(36) | Yes | - | User assigned to this task |
| createdBy | CHAR(36) | No | - | User who created this task |
| shareId | CHAR(36) | Yes | - | Share context if shared |
| createdAt | DATETIME(3) | No | now() | Record creation timestamp |
| updatedAt | DATETIME(3) | No | now() | Last update timestamp |

**Constraints**:

- Primary Key: `id`
- Foreign Keys:
  - `holidayId` → `holidays(id)` ON DELETE CASCADE
  - `assignedTo` → `users(id)`
  - `createdBy` → `users(id)` ON DELETE CASCADE
  - `shareId` → `shares(id)`
- Indexes: `holidayId`, `assignedTo`, `isCompleted`, `dueDate`, `createdBy`, `shareId`

**Relationships**:

- belongs_to: Holiday
- belongs_to: User (as assignee)
- belongs_to: User (as creator)
- belongs_to: Share
- has_many: TaskAssignee

### task_assignees

**Purpose**: Junction table for tasks assigned to multiple users

**Description**: Supports multiple assignees per task with assignment tracking.

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| taskId | CHAR(36) | No | - | Foreign key to tasks table |
| userId | CHAR(36) | No | - | Foreign key to users table |
| assignedAt | DATETIME(3) | No | now() | Assignment timestamp |
| assignedBy | CHAR(36) | No | - | User who made the assignment |

**Constraints**:

- Primary Key: `(taskId, userId)`
- Foreign Keys:
  - `taskId` → `tasks(id)` ON DELETE CASCADE
  - `userId` → `users(id)` ON DELETE CASCADE
  - `assignedBy` → `users(id)` ON DELETE CASCADE
- Indexes: `userId`, `assignedBy`

**Relationships**:

- belongs_to: Task
- belongs_to: User (as assignee)
- belongs_to: User (as assigner)

### gifts

**Purpose**: Gift management and tracking

**Description**: Comprehensive gift planning with pricing, stores, links, and completion tracking.

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | CHAR(36) | No | uuid() | Primary key UUID |
| holidayId | CHAR(36) | No | - | Holiday this gift belongs to |
| contactId | CHAR(36) | Yes | - | Gift recipient from contacts |
| name | VARCHAR(191) | No | - | Gift name/title |
| description | TEXT | Yes | - | Gift description |
| price | DECIMAL(12,2) | No | - | Expected/budget price |
| actualPrice | DECIMAL(12,2) | Yes | - | Actual purchase price |
| store | VARCHAR(191) | Yes | - | Store name |
| productLink | TEXT | Yes | - | Direct link to product |
| notes | TEXT | Yes | - | Additional notes |
| isCompleted | BOOLEAN | No | false | Whether gift is purchased |
| completedDate | DATETIME(3) | Yes | - | Purchase completion timestamp |
| assignedTo | CHAR(36) | Yes | - | User assigned to this gift |
| createdBy | CHAR(36) | No | - | User who created this gift |
| shareId | CHAR(36) | Yes | - | Share context if shared |
| createdAt | DATETIME(3) | No | now() | Record creation timestamp |
| updatedAt | DATETIME(3) | No | now() | Last update timestamp |

**Constraints**:

- Primary Key: `id`
- Foreign Keys:
  - `holidayId` → `holidays(id)` ON DELETE CASCADE
  - `contactId` → `contacts(id)`
  - `assignedTo` → `users(id)`
  - `createdBy` → `users(id)` ON DELETE CASCADE
  - `shareId` → `shares(id)`
- Indexes: `holidayId`, `contactId`, `isCompleted`, `assignedTo`, `price`, `createdBy`, `shareId`

**Relationships**:

- belongs_to: Holiday
- belongs_to: Contact
- belongs_to: User (as creator)
- belongs_to: Share

### cards

**Purpose**: Holiday card management and tracking

**Description**: Greeting card planning with recipient tracking and completion status.

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | CHAR(36) | No | uuid() | Primary key UUID |
| holidayId | CHAR(36) | No | - | Holiday this card belongs to |
| contactId | CHAR(36) | Yes | - | Card recipient from contacts |
| recipient | VARCHAR(191) | No | - | Recipient name |
| address | TEXT | Yes | - | Mailing address |
| message | TEXT | No | - | Card message content |
| isCompleted | BOOLEAN | No | false | Whether card is sent |
| sentDate | DATETIME(3) | Yes | - | Date card was sent |
| assignedTo | CHAR(36) | Yes | - | User assigned to this card |
| createdBy | CHAR(36) | No | - | User who created this card |
| shareId | CHAR(36) | Yes | - | Share context if shared |
| createdAt | DATETIME(3) | No | now() | Record creation timestamp |
| updatedAt | DATETIME(3) | No | now() | Last update timestamp |

**Constraints**:

- Primary Key: `id`
- Foreign Keys:
  - `holidayId` → `holidays(id)` ON DELETE CASCADE
  - `contactId` → `contacts(id)`
  - `assignedTo` → `users(id)`
  - `createdBy` → `users(id)` ON DELETE CASCADE
  - `shareId` → `shares(id)`
- Indexes: `holidayId`, `contactId`, `isCompleted`, `assignedTo`, `createdBy`, `shareId`

**Relationships**:

- belongs_to: Holiday
- belongs_to: Contact
- belongs_to: User (as creator)
- belongs_to: Share

### budgets

**Purpose**: Budget tracking for holidays with spending limits and currency support

**Description**: Comprehensive budget management for holiday planning with expense tracking.

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | CHAR(36) | No | uuid() | Primary key UUID |
| holidayId | CHAR(36) | No | - | Holiday this budget belongs to |
| name | VARCHAR(191) | No | - | Budget name |
| totalBudget | DECIMAL(12,2) | No | - | Total budget amount |
| spentAmount | DECIMAL(12,2) | No | 0.00 | Amount spent |
| remainingAmount | DECIMAL(12,2) | No | 0.00 | Remaining budget |
| currency | VARCHAR(191) | No | - | Currency code |
| startDate | DATE | No | - | Budget start date |
| endDate | DATE | No | - | Budget end date |
| createdBy | CHAR(36) | No | - | User who created budget |
| createdAt | DATETIME(3) | No | now() | Record creation timestamp |
| updatedAt | DATETIME(3) | No | now() | Last update timestamp |

**Constraints**:

- Primary Key: `id`
- Foreign Keys:
  - `holidayId` → `holidays(id)` ON DELETE CASCADE
  - `createdBy` → `users(id)` ON DELETE CASCADE
- Indexes: `holidayId`, `(startDate, endDate)`, `createdBy`

**Relationships**:

- belongs_to: Holiday
- belongs_to: User (as creator)
- has_many: BudgetTransaction

### budget_transactions

**Purpose**: Individual budget transactions and expenses

**Description**: Detailed expense tracking within budgets with categorization.

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | CHAR(36) | No | uuid() | Primary key UUID |
| budgetId | CHAR(36) | No | - | Budget this transaction belongs to |
| name | VARCHAR(191) | No | - | Transaction name |
| description | TEXT | Yes | - | Transaction description |
| amount | DECIMAL(12,2) | No | - | Transaction amount |
| category | VARCHAR(191) | No | - | Expense category |
| transactionDate | DATE | No | - | Transaction date |
| isExpense | BOOLEAN | No | true | Whether this is an expense |
| createdBy | CHAR(36) | No | - | User who created transaction |
| createdAt | DATETIME(3) | No | now() | Record creation timestamp |
| updatedAt | DATETIME(3) | No | now() | Last update timestamp |

**Constraints**:

- Primary Key: `id`
- Foreign Keys:
  - `budgetId` → `budgets(id)` ON DELETE CASCADE
  - `createdBy` → `users(id)` ON DELETE CASCADE
- Indexes: `budgetId`, `category`, `transactionDate`, `createdBy`

**Relationships**:

- belongs_to: Budget
- belongs_to: User (as creator)

### shares

**Purpose**: Holiday sharing system for collaboration

**Description**: Enables sharing holidays between users for collaborative planning.

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | CHAR(36) | No | uuid() | Primary key UUID |
| holidayId | CHAR(36) | No | - | Holiday being shared (unique) |
| ownerUserId | CHAR(36) | No | - | Share owner |
| createdAt | DATETIME(3) | No | now() | Record creation timestamp |
| updatedAt | DATETIME(3) | No | now() | Last update timestamp |

**Constraints**:

- Primary Key: `id`
- Unique Constraints: `holidayId`
- Foreign Keys:
  - `holidayId` → `holidays(id)` ON DELETE CASCADE
  - `ownerUserId` → `users(id)` ON DELETE CASCADE
- Indexes: `ownerUserId`

**Relationships**:

- belongs_to: Holiday
- belongs_to: User (as owner)
- has_many: ShareMember
- has_many: Invite
- has_many: Task
- has_many: Gift
- has_many: Card

### share_members

**Purpose**: Junction table for share membership

**Description**: Manages users who have access to shared holidays.

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| shareId | CHAR(36) | No | - | Foreign key to shares table |
| userId | CHAR(36) | No | - | Foreign key to users table |
| joinedAt | DATETIME(3) | No | now() | When user joined share |
| invitedBy | CHAR(36) | Yes | - | User who sent invitation |

**Constraints**:

- Primary Key: `(shareId, userId)`
- Foreign Keys:
  - `shareId` → `shares(id)` ON DELETE CASCADE
  - `userId` → `users(id)` ON DELETE CASCADE
  - `invitedBy` → `users(id)`
- Indexes: `userId`, `shareId`, `invitedBy`

**Relationships**:

- belongs_to: Share
- belongs_to: User (as member)
- belongs_to: User (as inviter)

### invites

**Purpose**: Invitation system for holiday sharing

**Description**: Manages invitations to shared holidays with status tracking.

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | CHAR(36) | No | uuid() | Primary key UUID |
| shareId | CHAR(36) | No | - | Share being invited to |
| fromUserId | CHAR(36) | No | - | User sending invitation |
| toUserId | CHAR(36) | Yes | - | Invited user (if registered) |
| toEmail | VARCHAR(191) | Yes | - | Invited email (if not registered) |
| holidayKey | VARCHAR(191) | No | - | Holiday type for context |
| status | ENUM | No | - | Invitation status (pending, accepted, declined, expired) |
| message | TEXT | Yes | - | Optional invitation message |
| respondedAt | DATETIME(3) | Yes | - | Response timestamp |
| createdAt | DATETIME(3) | No | now() | Record creation timestamp |
| senderDismissedAt | DATETIME(3) | Yes | - | When sender dismissed notification |

**Constraints**:

- Primary Key: `id`
- Foreign Keys:
  - `shareId` → `shares(id)` ON DELETE CASCADE
  - `fromUserId` → `users(id)` ON DELETE CASCADE
  - `toUserId` → `users(id)`
- Indexes: `toEmail`, `status`, `shareId`, `fromUserId`, `toUserId`

**Relationships**:

- belongs_to: Share
- belongs_to: User (as sender)
- belongs_to: User (as receiver)
- has_many: Notification

### kwanzaa_principles

**Purpose**: Special daily principle tracking for Kwanzaa celebrations

**Description**: Tracks completion of the seven principles of Kwanzaa, one per day.

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | CHAR(36) | No | uuid() | Primary key UUID |
| holidayId | CHAR(36) | No | - | Kwanzaa holiday this belongs to |
| dayNumber | INT | No | - | Day of Kwanzaa (1-7) |
| name | VARCHAR(191) | No | - | Principle name |
| description | TEXT | Yes | - | Principle description |
| isCompleted | BOOLEAN | No | false | Whether principle is completed |
| completedAt | DATETIME(3) | Yes | - | Completion timestamp |
| notes | TEXT | Yes | - | Additional notes |
| createdAt | DATETIME(3) | No | now() | Record creation timestamp |
| updatedAt | DATETIME(3) | No | now() | Last update timestamp |

**Constraints**:

- Primary Key: `id`
- Unique Constraints: `(holidayId, dayNumber)`
- Foreign Keys: `holidayId` → `holidays(id)` ON DELETE CASCADE
- Indexes: `isCompleted`

**Relationships**:

- belongs_to: Holiday

### guest_lists

**Purpose**: Guest management for events and parties

**Description**: Tracks guests and RSVP status for holiday events.

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | CHAR(36) | No | uuid() | Primary key UUID |
| holidayId | CHAR(36) | No | - | Holiday this guest list belongs to |
| contactId | CHAR(36) | No | - | Guest contact |
| rsvpStatus | ENUM | Yes | - | RSVP status (pending, confirmed, declined, maybe) |
| rsvpDate | DATETIME(3) | Yes | - | When RSVP was received |
| notes | TEXT | Yes | - | Guest-specific notes |
| createdBy | CHAR(36) | No | - | User who created entry |
| createdAt | DATETIME(3) | No | now() | Record creation timestamp |
| updatedAt | DATETIME(3) | No | now() | Last update timestamp |

**Constraints**:

- Primary Key: `id`
- Unique Constraints: `(holidayId, contactId)`
- Foreign Keys:
  - `holidayId` → `holidays(id)` ON DELETE CASCADE
  - `contactId` → `contacts(id)` ON DELETE CASCADE
  - `createdBy` → `users(id)` ON DELETE CASCADE
- Indexes: `rsvpStatus`, `contactId`, `createdBy`

**Relationships**:

- belongs_to: Holiday
- belongs_to: Contact
- belongs_to: User (as creator)

### notifications

**Purpose**: Real-time notification system for user activity and events

**Description**: Tracks all notifications sent to users with read/dismiss status, supporting various notification types including task assignments, invitations, and completions.

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | CHAR(36) | No | uuid() | Primary key UUID |
| userId | CHAR(36) | No | - | User receiving the notification |
| type | VARCHAR(50) | No | - | Notification type identifier |
| title | VARCHAR(255) | No | - | Notification title |
| message | TEXT | Yes | - | Notification message content |
| entityType | VARCHAR(50) | Yes | - | Related entity type |
| entityId | CHAR(36) | Yes | - | Related entity ID |
| holidayId | CHAR(36) | Yes | - | Related holiday |
| fromUserId | CHAR(36) | Yes | - | User who triggered notification |
| inviteId | CHAR(36) | Yes | - | Related invite |
| isRead | BOOLEAN | No | false | Whether notification is read |
| isDismissed | BOOLEAN | No | false | Whether notification is dismissed |
| readAt | DATETIME(3) | Yes | - | Read timestamp |
| dismissedAt | DATETIME(3) | Yes | - | Dismissed timestamp |
| createdAt | DATETIME(3) | No | now() | Record creation timestamp |

**Constraints**:

- Primary Key: `id`
- Foreign Keys:
  - `userId` → `users(id)` ON DELETE CASCADE
  - `holidayId` → `holidays(id)` ON DELETE CASCADE
  - `fromUserId` → `users(id)` ON DELETE SET NULL
  - `inviteId` → `invites(id)` ON DELETE CASCADE
- Indexes: `(userId, isRead)`, `(userId, type)`, `createdAt`

**Relationships**:

- belongs_to: User (as recipient)
- belongs_to: User (as sender)
- belongs_to: Holiday
- belongs_to: Invite

### notification_preferences

**Purpose**: User-specific notification preferences and settings

**Description**: Granular control over notification types, delivery methods, and digest frequency.

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | CHAR(36) | No | uuid() | Primary key UUID |
| userId | CHAR(36) | No | - | Foreign key to users table |
| assignmentNotifications | BOOLEAN | No | true | Enable task/gift/card assignment notifications |
| completionNotifications | BOOLEAN | No | true | Enable completion notifications |
| inviteNotifications | BOOLEAN | No | true | Enable invitation notifications |
| emailNotifications | BOOLEAN | No | false | Enable email delivery |
| digestFrequency | VARCHAR(20) | No | 'immediate' | Email digest frequency |
| createdAt | DATETIME(3) | No | now() | Record creation timestamp |
| updatedAt | DATETIME(3) | No | now() | Last update timestamp |

**Constraints**:

- Primary Key: `id`
- Unique Constraints: `userId`
- Foreign Keys: `userId` → `users(id)` ON DELETE CASCADE
- Indexes: `userId`

**Relationships**:

- belongs_to: User

### audit_log

**Purpose**: Comprehensive audit logging for security and debugging

**Description**: Tracks all user actions and system events for accountability and troubleshooting.

**Columns**:
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | CHAR(36) | No | uuid() | Primary key UUID |
| accountId | CHAR(36) | No | - | Account context |
| userId | CHAR(36) | Yes | - | User who performed action |
| action | VARCHAR(191) | No | - | Action performed |
| entityType | VARCHAR(191) | No | - | Type of entity affected |
| entityId | CHAR(36) | Yes | - | ID of affected entity |
| details | JSON | Yes | - | Additional action details |
| ipAddress | VARCHAR(191) | Yes | - | User IP address |
| userAgent | TEXT | Yes | - | User agent string |
| createdAt | DATETIME(3) | No | now() | Action timestamp |

**Constraints**:

- Primary Key: `id`
- Foreign Keys:
  - `accountId` → `accounts(id)` ON DELETE CASCADE
  - `userId` → `users(id)`
- Indexes: `(accountId, createdAt)`, `(userId, createdAt)`, `(entityType, entityId)`, `createdAt`

**Relationships**:

- belongs_to: Account
- belongs_to: User

---

## Enums

### TaskPriority

- `low`
- `medium`
- `high`

### InviteStatus

- `pending`
- `accepted`
- `declined`
- `expired`

### RSVPStatus

- `pending`
- `confirmed`
- `declined`
- `maybe`

### MemberRole

- `owner`
- `admin`
- `member`

### SubscriptionPlan

- `free`
- `plus`

---

## Schema Summary

### Architecture Highlights

**Multi-Tenant Design**: All data is scoped to accounts, enabling secure multi-family usage

**Comprehensive Holiday Support**: Supports 15+ holiday types with extensible custom holidays (one per account per type)

**Advanced Collaboration**: Holiday sharing with invitation system and role management

**Real-Time Notifications**: In-app notification system with read/dismiss status and customizable preferences

**Complete Planning Suite**: Tasks, gifts, cards, budgets, and guest lists with full tracking and assignment support

**Subscription Management**: Built-in support for free and premium tiers

**User Experience**: Theme preferences, display modes, and accessibility features

**Security & Auditing**: Comprehensive audit logging and secure UUID identifiers

**Performance Optimized**: Strategic indexing and efficient relationship design

### Key Features

- **Auth0 Integration**: Secure OAuth with profile management
- **Real-time Collaboration**: Share holidays with family and friends
- **Notification System**: Real-time in-app notifications with granular preferences
- **Assignment Tracking**: Tasks, gifts, and cards can be assigned to specific users
- **Budget Tracking**: Comprehensive expense management with categories
- **Contact Management**: Centralized address book for all planning needs
- **Task Management**: Priority-based task system with assignments
- **Progress Tracking**: Completion status across all planning entities
- **Accessibility**: Full theme and preference customization
- **Audit Trail**: Complete action logging for security and debugging
