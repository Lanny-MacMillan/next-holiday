# Migration Notes: Redux to Database-Backed Architecture

This document outlines the migration strategy from the current Redux-only state management to a database-backed architecture using PostgreSQL.

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

#### 1.1 Database Deployment

```bash
# Deploy PostgreSQL schema to AWS RDS/Aurora
psql -h your-rds-endpoint -U your-username -d next_holiday -f db/schema.sql
psql -h your-rds-endpoint -U your-username -d next_holiday -f db/seed.example.sql
```

#### 1.2 API Route Implementation

Create new API routes in `src/app/api/` to replace Redux async thunks:

**User Management**

- `POST /api/users` - Create/update user
- `GET /api/users/me` - Get current user
- `PUT /api/users/profile` - Update profile

**Account Management**

- `GET /api/accounts` - List user's accounts
- `POST /api/accounts` - Create account
- `GET /api/accounts/:id` - Get account details
- `POST /api/accounts/:id/members` - Add member

**Holiday Management**

- `GET /api/holidays` - List holidays for account
- `POST /api/holidays` - Create holiday
- `GET /api/holidays/:id` - Get holiday details
- `PUT /api/holidays/:id` - Update holiday

**Task Management**

- `GET /api/holidays/:id/tasks` - List tasks for holiday
- `POST /api/holidays/:id/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/toggle` - Toggle completion

**Gift Management**

- `GET /api/holidays/:id/gifts` - List gifts for holiday
- `POST /api/holidays/:id/gifts` - Create gift
- `PUT /api/gifts/:id` - Update gift
- `DELETE /api/gifts/:id` - Delete gift
- `POST /api/gifts/:id/toggle` - Toggle purchase

**Contact Management**

- `GET /api/accounts/:id/contacts` - List contacts for account
- `POST /api/accounts/:id/contacts` - Create contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

**Budget Management**

- `GET /api/holidays/:id/budgets` - List budgets for holiday
- `POST /api/holidays/:id/budgets` - Create budget
- `GET /api/budgets/:id/transactions` - List transactions
- `POST /api/budgets/:id/transactions` - Add transaction

**Sharing & Collaboration**

- `POST /api/holidays/:id/share` - Share holiday
- `GET /api/shares/:id/members` - List share members
- `POST /api/shares/:id/invites` - Send invite
- `POST /api/invites/:id/accept` - Accept invite
- `POST /api/invites/:id/decline` - Decline invite

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
