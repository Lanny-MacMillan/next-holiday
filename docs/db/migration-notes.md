# Migration Notes: Redux to Database-Backed Architecture

This document outlines the migration strategy from the current Redux-only state management to a database-backed architecture using MySQL with Prisma ORM.

## Database Schema Overview

The application uses a MySQL database with the following key entities:

### Core Entities

- **users**: Auth0 user profiles with authentication data
- **accounts**: Multi-tenant households/families for collaboration
- **account_members**: Many-to-many relationship between users and accounts
- **holidays**: Holiday instances with metadata and configuration
- **contacts**: Address book entries for gift recipients, card recipients, etc.

### Planning Entities

- **tasks**: Generic and holiday-specific tasks with priorities and assignments
- **task_assignees**: Many-to-many relationship for task assignments
- **gifts**: Gift lists with recipients, prices, and purchase tracking
- **cards**: Greeting cards with recipients and sending status
- **budgets**: Budget tracking for holidays with spending limits
- **budget_transactions**: Individual budget line items and expenses

### Collaboration Entities

- **shares**: Holiday sharing for multi-user collaboration
- **share_members**: Many-to-many relationship for share membership
- **invites**: Invitation system for holiday sharing

### Specialized Entities

- **kwanzaa_principles**: Special daily principle tracking for Kwanzaa
- **guest_lists**: Guest lists for events and parties with RSVP tracking
- **audit_log**: Activity tracking for debugging and compliance

### Enums

- **TaskPriority**: low, medium, high
- **TaskStatus**: pending, in_progress, completed, cancelled
- **RSVPStatus**: pending, confirmed, declined, maybe
- **InviteStatus**: pending, accepted, declined, expired
- **MemberRole**: owner, admin, member

## Current State Analysis

### Redux Structure

The application currently uses Redux Toolkit with the following key slices:

- **Core slices**: `userSlice`, `addressBookSlice`, `tasksSlice`, `giftListSlice`, `cardsSlice`
- **Holiday-specific slices**: `birthdayGiftListSlice`, `christmasTasksSlice`, `thanksgivingBudgetSlice`, etc.
- **Collaboration slices**: `sharesSlice`, `invitesSlice`
- **Specialized slices**: `kwanzaaTasksSlice` (with daily principles)

### Data Patterns Identified

1. **Holiday-centric organization**: All planning data is organized by holiday type
2. **Multi-user collaboration**: Sharing system with invites and member management
3. **Contact management**: Centralized address book for gifts, cards, and guest lists
4. **Budget tracking**: Detailed expense tracking for specific holidays
5. **Task management**: Generic and holiday-specific tasks with priorities and assignments

## Migration Strategy

### Phase 1: Database Setup and API Layer

#### 1.1 Database Setup and Migration

**Prisma Schema Generation**

```bash
# Generate Prisma client from schema
npx prisma generate

# Create and apply initial migration
npx prisma migrate dev --name init

# For production deployment
npx prisma migrate deploy
```

**Database Connection**
The application uses MySQL with the following connection string format:

```
DATABASE_URL="mysql://username:password@host:port/database_name"
```

**Schema Features**

- All primary keys use UUIDs with `@default(uuid()) @db.Char(36)`
- Foreign keys include proper cascade delete rules
- Timestamps use `@default(now())` and `@updatedAt`
- Money fields use `@db.Decimal(12, 2)` for precision
- Enums are used for constrained field values
- Snake_case naming with `@map` directives for database compatibility

#### 1.2 API Route Implementation

Create new API routes in `src/app/api/` to replace Redux async thunks:

**User Management**

```typescript
// src/app/api/users/route.ts
export async function POST(request: Request) {
	const { auth0Sub, email, name, picture } = await request.json();
	const user = await prisma.user.upsert({
		where: { auth0Sub },
		update: { email, name, picture, isInDb: true },
		create: { auth0Sub, email, name, picture, isInDb: true },
	});
	return Response.json(user);
}

// src/app/api/users/me/route.ts
export async function GET(request: Request) {
	const auth0Sub = getAuth0Sub(request);
	const user = await prisma.user.findUnique({
		where: { auth0Sub },
		include: {
			ownedAccounts: true,
			accountMembers: { include: { account: true } },
		},
	});
	return Response.json(user);
}
```

**Account Management**

```typescript
// src/app/api/accounts/route.ts
export async function GET(request: Request) {
	const auth0Sub = getAuth0Sub(request);
	const user = await prisma.user.findUnique({
		where: { auth0Sub },
		include: {
			ownedAccounts: true,
			accountMembers: { include: { account: true } },
		},
	});
	const accounts = [
		...user.ownedAccounts,
		...user.accountMembers.map((m) => m.account),
	];
	return Response.json(accounts);
}

export async function POST(request: Request) {
	const { name } = await request.json();
	const auth0Sub = getAuth0Sub(request);
	const user = await prisma.user.findUnique({ where: { auth0Sub } });

	const account = await prisma.account.create({
		data: {
			name,
			ownerUserId: user.id,
			members: {
				create: {
					userId: user.id,
					role: "owner",
				},
			},
		},
	});
	return Response.json(account);
}
```

**Holiday Management**

```typescript
// src/app/api/holidays/route.ts
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const accountId = searchParams.get("accountId");

	const holidays = await prisma.holiday.findMany({
		where: { accountId },
		include: { creator: true },
	});
	return Response.json(holidays);
}

export async function POST(request: Request) {
	const holidayData = await request.json();
	const auth0Sub = getAuth0Sub(request);
	const user = await prisma.user.findUnique({ where: { auth0Sub } });

	const holiday = await prisma.holiday.create({
		data: {
			...holidayData,
			createdBy: user.id,
		},
	});
	return Response.json(holiday);
}
```

**Task Management**

```typescript
// src/app/api/holidays/[id]/tasks/route.ts
export async function GET(
	request: Request,
	{ params }: { params: { id: string } }
) {
	const tasks = await prisma.task.findMany({
		where: { holidayId: params.id },
		include: {
			assignee: true,
			creator: true,
			taskAssignees: { include: { user: true } },
		},
	});
	return Response.json(tasks);
}

export async function POST(
	request: Request,
	{ params }: { params: { id: string } }
) {
	const taskData = await request.json();
	const auth0Sub = getAuth0Sub(request);
	const user = await prisma.user.findUnique({ where: { auth0Sub } });

	const task = await prisma.task.create({
		data: {
			...taskData,
			holidayId: params.id,
			createdBy: user.id,
		},
	});
	return Response.json(task);
}
```

**Gift Management**

```typescript
// src/app/api/holidays/[id]/gifts/route.ts
export async function GET(
	request: Request,
	{ params }: { params: { id: string } }
) {
	const gifts = await prisma.gift.findMany({
		where: { holidayId: params.id },
		include: { contact: true, creator: true },
	});
	return Response.json(gifts);
}

export async function POST(
	request: Request,
	{ params }: { params: { id: string } }
) {
	const giftData = await request.json();
	const auth0Sub = getAuth0Sub(request);
	const user = await prisma.user.findUnique({ where: { auth0Sub } });

	const gift = await prisma.gift.create({
		data: {
			...giftData,
			holidayId: params.id,
			createdBy: user.id,
		},
	});
	return Response.json(gift);
}
```

**Contact Management**

```typescript
// src/app/api/accounts/[id]/contacts/route.ts
export async function GET(
	request: Request,
	{ params }: { params: { id: string } }
) {
	const contacts = await prisma.contact.findMany({
		where: { accountId: params.id },
		include: { creator: true },
	});
	return Response.json(contacts);
}

export async function POST(
	request: Request,
	{ params }: { params: { id: string } }
) {
	const contactData = await request.json();
	const auth0Sub = getAuth0Sub(request);
	const user = await prisma.user.findUnique({ where: { auth0Sub } });

	const contact = await prisma.contact.create({
		data: {
			...contactData,
			accountId: params.id,
			createdBy: user.id,
		},
	});
	return Response.json(contact);
}
```

**Budget Management**

```typescript
// src/app/api/holidays/[id]/budgets/route.ts
export async function GET(
	request: Request,
	{ params }: { params: { id: string } }
) {
	const budgets = await prisma.budget.findMany({
		where: { holidayId: params.id },
		include: {
			creator: true,
			transactions: true,
		},
	});
	return Response.json(budgets);
}

// src/app/api/budgets/[id]/transactions/route.ts
export async function POST(
	request: Request,
	{ params }: { params: { id: string } }
) {
	const transactionData = await request.json();
	const auth0Sub = getAuth0Sub(request);
	const user = await prisma.user.findUnique({ where: { auth0Sub } });

	const transaction = await prisma.budgetTransaction.create({
		data: {
			...transactionData,
			budgetId: params.id,
			createdBy: user.id,
		},
	});

	// Update budget amounts
	await updateBudgetAmounts(params.id);

	return Response.json(transaction);
}
```

**Sharing & Collaboration**

```typescript
// src/app/api/holidays/[id]/share/route.ts
export async function POST(
	request: Request,
	{ params }: { params: { id: string } }
) {
	const auth0Sub = getAuth0Sub(request);
	const user = await prisma.user.findUnique({ where: { auth0Sub } });

	const share = await prisma.share.create({
		data: {
			holidayId: params.id,
			ownerUserId: user.id,
		},
	});
	return Response.json(share);
}

// src/app/api/shares/[id]/invites/route.ts
export async function POST(
	request: Request,
	{ params }: { params: { id: string } }
) {
	const { toEmail, message } = await request.json();
	const auth0Sub = getAuth0Sub(request);
	const user = await prisma.user.findUnique({ where: { auth0Sub } });

	const invite = await prisma.invite.create({
		data: {
			shareId: params.id,
			fromUserId: user.id,
			toEmail,
			message,
			status: "pending",
		},
	});
	return Response.json(invite);
}
```

### Phase 2: Redux State Migration

#### 2.1 Update Redux Slices

Modify existing slices to use API calls instead of localStorage:

```typescript
// Before: localStorage-based
export const fetchTasks = createAsyncThunk(
	"tasks/fetchTasks",
	async (_, { getState }) => {
		// localStorage logic
	}
);

// After: API-based
export const fetchTasks = createAsyncThunk(
	"tasks/fetchTasks",
	async (holidayId: string) => {
		const response = await fetch(`/api/holidays/${holidayId}/tasks`);
		if (!response.ok) throw new Error("Failed to fetch tasks");
		return response.json();
	}
);
```

#### 2.2 State Normalization

Update Redux state structure to match database schema:

```typescript
// Before: Flat arrays
interface TasksState {
	tasks: Task[];
}

// After: Normalized by holiday
interface TasksState {
	byHoliday: Record<string, Task[]>;
	loading: Record<string, boolean>;
	error: Record<string, string | null>;
}
```

#### 2.3 Selector Updates

Update selectors to work with normalized state:

```typescript
// Before
export const selectTasksForHoliday = (state: any, holidayKey: string) => {
	return state.tasks.tasks.filter((task) => task.holidayKey === holidayKey);
};

// After
export const selectTasksForHoliday = (state: any, holidayId: string) => {
	return state.tasks.byHoliday[holidayId] || [];
};
```

### Phase 3: Component Updates

#### 3.1 Data Fetching

Update components to fetch data by holiday ID instead of using global state:

```typescript
// Before
const tasks = useSelector((state) => state.tasks.tasks);

// After
const tasks = useSelector((state) => selectTasksForHoliday(state, holidayId));
const dispatch = useDispatch();

useEffect(() => {
	dispatch(fetchTasks(holidayId));
}, [holidayId, dispatch]);
```

#### 3.2 Form Submissions

Update forms to include holiday context:

```typescript
// Before
const handleSubmit = (taskData) => {
	dispatch(addTask(taskData));
};

// After
const handleSubmit = (taskData) => {
	dispatch(addTask({ ...taskData, holidayId }));
};
```

### Phase 4: Holiday-Specific Features

#### 4.1 Kwanzaa Principles

The `kwanzaa_principles` table supports the specialized daily principle tracking:

```typescript
// API endpoint
GET /api/holidays/:id/kwanzaa-principles

// Redux action
export const fetchKwanzaaPrinciples = createAsyncThunk(
  "kwanzaa/fetchPrinciples",
  async (holidayId: string) => {
    const response = await fetch(`/api/holidays/${holidayId}/kwanzaa-principles`);
    return response.json();
  }
);
```

#### 4.2 Budget Tracking

Budget features are supported through the `budgets` and `budget_transactions` tables:

```typescript
// API endpoints
GET /api/holidays/:id/budgets
POST /api/budgets/:id/transactions

// Automatic budget amount updates via database triggers
```

### Phase 5: Multi-User Collaboration

#### 5.1 Account-Based Access Control

All data is scoped to accounts, enabling multi-user collaboration:

```typescript
// API calls include account context
GET /api/accounts/:accountId/holidays
GET /api/accounts/:accountId/contacts

// Redux state organized by account
interface AppState {
  accounts: {
    current: string | null;
    byId: Record<string, Account>;
  };
  holidays: {
    byAccount: Record<string, Holiday[]>;
  };
}
```

#### 5.2 Sharing System

The sharing system enables holiday-specific collaboration:

```typescript
// Share a holiday
POST /api/holidays/:id/share

// Accept invitation
POST /api/invites/:id/accept

// Access shared data
GET /api/shares/:shareId/tasks
GET /api/shares/:shareId/gifts
```

## Data Migration Steps

### 1. User Data Migration

```sql
-- Migrate existing user data from localStorage to database
INSERT INTO users (auth0_sub, email, name, is_in_db, is_first_login)
SELECT
  'auth0|' || user_id,
  user_email,
  user_name,
  true,
  false
FROM existing_user_data;
```

### 2. Holiday Data Migration

```sql
-- Create default accounts for existing users
INSERT INTO accounts (name, owner_user_id)
SELECT
  user_name || ' Family',
  user_id
FROM users;

-- Create holiday instances
INSERT INTO holidays (account_id, holiday_type, name, start_date, created_by)
SELECT
  account_id,
  'christmas',
  'Christmas 2024',
  '2024-12-25',
  user_id
FROM accounts;
```

### 3. Task and Gift Migration

```sql
-- Migrate tasks from Redux state
INSERT INTO tasks (holiday_id, title, description, priority, is_completed, created_by)
SELECT
  holiday_id,
  title,
  description,
  priority,
  is_completed,
  created_by
FROM existing_tasks_data;
```

## Rollback Strategy

### 1. Feature Flags

Implement feature flags to gradually migrate features:

```typescript
const useDatabaseBackend = process.env.NEXT_PUBLIC_USE_DB === "true";

export const fetchTasks = createAsyncThunk(
	"tasks/fetchTasks",
	async (holidayId: string) => {
		if (useDatabaseBackend) {
			return fetchFromAPI(holidayId);
		} else {
			return fetchFromLocalStorage();
		}
	}
);
```

### 2. Dual Write Strategy

During migration, write to both Redux and database:

```typescript
export const addTask = createAsyncThunk("tasks/addTask", async (taskData) => {
	// Write to database
	const dbResponse = await fetch("/api/tasks", {
		method: "POST",
		body: JSON.stringify(taskData),
	});

	// Also update Redux for backward compatibility
	return { ...taskData, id: dbResponse.id };
});
```

## Performance Considerations

### 1. Database Indexing

The schema includes comprehensive indexes for common query patterns:

- `(account_id)` for account-scoped queries
- `(holiday_id)` for holiday-specific data
- `(is_completed)` for completion filtering
- Partial indexes for open tasks

### 2. Caching Strategy

Implement Redis caching for frequently accessed data:

```typescript
// Cache holiday data
const cachedHoliday = await redis.get(`holiday:${holidayId}`);
if (cachedHoliday) {
	return JSON.parse(cachedHoliday);
}

// Fetch from database and cache
const holiday = await db.holidays.findByPk(holidayId);
await redis.setex(`holiday:${holidayId}`, 3600, JSON.stringify(holiday));
```

### 3. Pagination

Implement pagination for large datasets:

```typescript
// API endpoint with pagination
GET /api/holidays/:id/tasks?page=1&limit=20

// Redux state with pagination
interface TasksState {
  byHoliday: Record<string, {
    items: Task[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  }>;
}
```

## Testing Strategy

### 1. Database Tests

Create comprehensive database tests:

```typescript
describe("Holiday API", () => {
	it("should create holiday with tasks", async () => {
		const holiday = await createHoliday(testData);
		const tasks = await createTasks(holiday.id, testTasks);

		expect(holiday.account_id).toBe(testAccount.id);
		expect(tasks).toHaveLength(testTasks.length);
	});
});
```

### 2. Integration Tests

Test the full Redux-to-database flow:

```typescript
describe("Task Management", () => {
	it("should sync Redux state with database", async () => {
		const task = await dispatch(addTask(testTask));
		const dbTask = await fetchTaskFromDB(task.id);

		expect(task).toEqual(dbTask);
	});
});
```

## Monitoring and Observability

### 1. Database Monitoring

- Set up CloudWatch metrics for RDS performance
- Monitor query performance with pg_stat_statements
- Track slow queries and optimize indexes

### 2. Application Monitoring

- Log all API calls and response times
- Monitor Redux action performance
- Track user experience metrics

### 3. Error Tracking

- Implement comprehensive error logging
- Set up alerts for database connection issues
- Monitor data consistency between Redux and database

## Security Considerations

### 1. Row-Level Security

Implement RLS policies for multi-tenant data:

```sql
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY holiday_access_policy ON holidays
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM account_members
      WHERE user_id = current_user_id()
    )
  );
```

### 2. API Security

- Validate all input data
- Implement rate limiting
- Use proper authentication middleware
- Sanitize SQL queries to prevent injection

### 3. Data Encryption

- Enable RDS encryption at rest
- Use SSL/TLS for database connections
- Encrypt sensitive data fields

## Conclusion

This migration provides a solid foundation for scaling the Next Holiday application with proper data persistence, multi-user collaboration, and enterprise-grade features. The phased approach minimizes risk while enabling gradual feature rollout and testing.
