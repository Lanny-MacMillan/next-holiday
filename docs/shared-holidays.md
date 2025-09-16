# Shared Holidays

## Overview

The Shared Holidays feature enables tenant-wide holiday sharing through Account membership. Users can view and filter holidays based on ownership and sharing scope without requiring explicit sharing mechanisms.

## Architecture

### Tenant-Wide Sharing Model

Holidays are automatically shared within an Account through the existing membership model:

- **Account Membership**: Users belong to accounts via the `account_members` table
- **Holiday Access**: All account members can access holidays within their accounts
- **Scope Filtering**: Holidays are filtered by creator (`createdBy`) to distinguish ownership

### Data Model

```sql
-- Holidays belong to accounts
holidays.account_id → accounts.id

-- Users are members of accounts
account_members.account_id → accounts.id
account_members.user_id → users.id

-- Holiday creator tracking
holidays.created_by → users.id
```

## API Reference

### GET /api/holidays

List holidays with scope filtering.

#### Parameters

| Parameter     | Type                                   | Default | Description                  |
| ------------- | -------------------------------------- | ------- | ---------------------------- |
| `scope`       | `'mine' \| 'shared' \| 'all'`          | `'all'` | Filter holidays by ownership |
| `accountId`   | `string`                               | -       | Filter by specific account   |
| `holidayType` | `string`                               | -       | Filter by holiday type       |
| `q`           | `string`                               | -       | Search in name/description   |
| `sortBy`      | `'name' \| 'startDate' \| 'createdAt'` | -       | Sort field                   |
| `sortOrder`   | `'asc' \| 'desc'`                      | -       | Sort direction               |

#### Scope Behavior

- **`mine`**: Returns holidays where `createdBy === current_user.id`
- **`shared`**: Returns holidays where `createdBy !== current_user.id` (within user's accounts)
- **`all`**: Returns all holidays within user's accounts

#### Response Format

```json
{
	"success": true,
	"data": [
		{
			"id": "holiday-123",
			"name": "Christmas 2024",
			"holidayType": "christmas",
			"accountId": "account-456",
			"createdBy": "user-789",
			"createdAt": "2024-01-01T00:00:00Z",
			"updatedAt": "2024-01-01T00:00:00Z",
			"_visibility": "mine"
		}
	]
}
```

#### Visibility Annotation

Each holiday includes a `_visibility` field:

- **`"mine"`**: Holiday created by the current user
- **`"shared"`**: Holiday created by another account member

## Frontend Integration

### RTK Query Hook

```typescript
import { useGetHolidaysQuery } from "@/store/api";

const { data: holidays, isLoading } = useGetHolidaysQuery({
	scope: "all", // or 'mine' | 'shared'
});
```

### Selectors

```typescript
import {
	selectMyHolidays,
	selectSharedHolidays,
} from "@/store/selectors/holidays";

// Client-side filtering
const myHolidays = selectMyHolidays(holidays);
const sharedHolidays = selectSharedHolidays(holidays);
```

### UI Components

The holidays list page (`/holidays`) provides filter tabs:

- **All**: Shows all holidays with visibility badges
- **My Holidays**: Shows only user-created holidays
- **Shared With Me**: Shows only holidays created by others

## Authorization

### Access Control

- **Account Membership Required**: Users can only access holidays from accounts they belong to
- **No Explicit Sharing**: No Share/ShareMember tables are used for this feature
- **Creator Tracking**: `createdBy` field determines ownership for filtering

### Security Considerations

- All queries include tenant filtering: `account: { members: { some: { userId: user.id } } }`
- Scope filtering is applied after tenant filtering
- No cross-account data leakage possible

## Examples

### API Usage

```bash
# Get all holidays
GET /api/holidays

# Get only my holidays
GET /api/holidays?scope=mine

# Get holidays shared with me
GET /api/holidays?scope=shared

# Get holidays for specific account
GET /api/holidays?accountId=account-123&scope=all
```

### Frontend Usage

```typescript
// Filter tabs component
const [scope, setScope] = useState<"mine" | "shared" | "all">("all");
const { data: holidays = [] } = useGetHolidaysQuery({ scope });

// Display with visibility badges
{
	holidays.map((holiday) => (
		<div key={holiday.id}>
			<h3>{holiday.name}</h3>
			<span
				className={`badge ${
					holiday._visibility === "mine" ? "owner" : "shared"
				}`}
			>
				{holiday._visibility === "mine" ? "Owner" : "Shared"}
			</span>
		</div>
	));
}
```

## Testing

### API Tests

- Scope filtering with different user scenarios
- Tenant isolation verification
- Parameter validation
- Response format validation

### Selector Tests

- Filtering logic correctness
- Edge cases (empty arrays, mixed data)
- Consistency between selectors

## Migration Notes

- **No Schema Changes**: Existing Holiday model is sufficient
- **Backward Compatible**: Default scope is 'all' for existing clients
- **Progressive Enhancement**: New scope parameter is optional

## Future Enhancements

- **Granular Permissions**: Role-based access within accounts
- **Explicit Sharing**: Optional Share/ShareMember integration
- **Activity Tracking**: Audit log for holiday access
- **Bulk Operations**: Multi-holiday management features

