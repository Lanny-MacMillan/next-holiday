# Holiday Cascade Delete Implementation

## Impact Report

### Database Schema Analysis

Based on the Prisma schema analysis, the following models have direct or indirect relationships with the `Holiday` model:

| Model Name        | Table Name            | Relation Type | FK Column    | ON DELETE | Nullable? | Notes                      |
| ----------------- | --------------------- | ------------- | ------------ | --------- | --------- | -------------------------- |
| **Holiday**       | `holidays`            | Root          | -            | -         | -         | Primary model              |
| Task              | `tasks`               | Direct        | `holiday_id` | CASCADE   | No        | ✅ Already has CASCADE     |
| TaskAssignee      | `task_assignees`      | Indirect      | `task_id`    | CASCADE   | No        | ✅ Cascades through Task   |
| Gift              | `gifts`               | Direct        | `holiday_id` | CASCADE   | No        | ✅ Already has CASCADE     |
| Card              | `cards`               | Direct        | `holiday_id` | CASCADE   | No        | ✅ Already has CASCADE     |
| Budget            | `budgets`             | Direct        | `holiday_id` | CASCADE   | No        | ✅ Already has CASCADE     |
| BudgetTransaction | `budget_transactions` | Indirect      | `budget_id`  | CASCADE   | No        | ✅ Cascades through Budget |
| Share             | `shares`              | Direct        | `holiday_id` | CASCADE   | No        | ✅ Already has CASCADE     |
| ShareMember       | `share_members`       | Indirect      | `share_id`   | CASCADE   | No        | ✅ Cascades through Share  |
| Invite            | `invites`             | Indirect      | `share_id`   | CASCADE   | No        | ✅ Cascades through Share  |
| KwanzaaPrinciple  | `kwanzaa_principles`  | Direct        | `holiday_id` | CASCADE   | No        | ✅ Already has CASCADE     |
| GuestList         | `guest_lists`         | Direct        | `holiday_id` | CASCADE   | No        | ✅ Already has CASCADE     |

### Key Findings

✅ **Excellent News**: All foreign key relationships to the `Holiday` model already have `ON DELETE CASCADE` configured in the database schema. This means we can implement a **DB-level cascade delete** approach, which is more efficient and reliable than application-level cascading.

### Database Cascade Strategy

Since all dependent models already have proper `ON DELETE CASCADE` constraints, we can implement a simple and efficient cascade delete by:

1. **Pre-counting** all dependent records for the `dryRun` functionality
2. **Single delete operation** on the `Holiday` record - the database will automatically cascade to all dependent tables
3. **Tenant scoping** - all operations must be scoped by `accountId` for multi-tenant safety

### API Routes Analysis

**Current Holiday API Routes:**

- `GET /api/holidays` - List holidays
- `POST /api/holidays` - Create holiday
- `GET /api/holidays/[id]` - Get specific holiday
- `PUT /api/holidays/[id]` - Update holiday
- `DELETE /api/holidays/[id]` - Delete holiday (basic implementation)

**Holiday-related API Routes:**

- `GET/POST/PUT/DELETE /api/holidays/[id]/tasks` - Task management
- `GET/POST/PUT/DELETE /api/holidays/[id]/gifts` - Gift management
- `GET/POST/PUT/DELETE /api/holidays/[id]/cards` - Card management
- `GET/POST/PUT /api/holidays/[id]/countdown` - Countdown timer
- `GET/POST /api/holidays/preferences` - Holiday preferences

### Redux Store Analysis

**Holiday-related Redux Slices:**

- `holidayPreferencesSlice.ts` - Manages holiday selection and preferences
- `sharesSlice.ts` - Manages holiday sharing functionality
- `budgetsSlice.ts` - Manages holiday budgets
- `countdownTimerSlice.ts` - Manages countdown timers

**RTK Query Endpoints:**

- Multiple endpoints in `api.ts` for gifts, cards, tasks, guest lists, etc.
- All endpoints are scoped by `holidayId` parameter

### Frontend Components Analysis

**Settings Page (`/settings`):**

- Holiday preferences management in `src/app/settings/page.tsx`
- Current implementation only removes from preferences array
- **No cascade delete confirmation** - this is where we need to add the confirmation modal

**Key Components:**

- `HolidayCard.tsx` - Displays holiday cards on home page
- `GiftListCard.tsx` - Manages gift lists per holiday
- `BudgetDisplay.tsx` - Shows budget information per holiday

### Implementation Strategy

Given that all database constraints are already properly configured with `ON DELETE CASCADE`, we can implement a **DB-level cascade delete** approach:

1. **Server Action**: `deleteHolidayData()` with `dryRun` support
2. **Pre-counting**: Query all dependent tables to show impact in `dryRun`
3. **Single Delete**: Delete the holiday record - database handles cascading
4. **UI Integration**: Confirmation modal in settings page
5. **Safety Guards**: Feature flags, row thresholds, tenant scoping

### Gaps and Recommendations

1. **Missing Feature**: No cascade delete confirmation in settings UI
2. **Missing Feature**: No `dryRun` functionality for impact assessment
3. **Missing Feature**: No row count thresholds or safety guards
4. **Missing Feature**: No feature flag for enabling/disabling cascade delete
5. **Good**: All database constraints are properly configured
6. **Good**: Multi-tenant architecture with `accountId` scoping is in place

### Next Steps

1. Implement `deleteHolidayData` server action with `dryRun` support
2. Create confirmation modal component for settings page
3. Add feature flags and safety guards
4. Write comprehensive tests
5. Update settings page to integrate cascade delete functionality

## Implementation Summary

### ✅ Completed Implementation

#### 1. Server Action (`src/lib/server/holidays/deleteHolidayData.ts`)

- **Function**: `deleteHolidayData(params)` with full tenant scoping
- **Features**:
  - `dryRun` mode for impact assessment
  - Row count thresholds with `force` override
  - Feature flag protection (`DELETE_HOLIDAY_CASCADE_ENABLED`)
  - Comprehensive error handling
  - Multi-tenant safety with `accountId` validation

#### 2. API Routes (`src/app/api/holidays/[id]/delete-cascade/route.ts`)

- **POST**: Perform cascade delete with confirmation
- **GET**: Dry run to get impact data
- **Features**:
  - Authentication and authorization
  - Input validation with Zod schemas
  - Proper HTTP status codes
  - Error handling and user feedback

#### 3. UI Components

- **Modal**: `HolidayDeleteConfirmationModal.tsx`
  - Real-time impact data display
  - Holiday name confirmation requirement
  - Loading states and error handling
  - Responsive design with dark mode support
- **Settings Integration**: Updated `src/app/settings/page.tsx`
  - Automatic modal trigger on holiday deselection
  - Seamless integration with existing preferences flow

#### 4. Comprehensive Testing

- **Unit Tests**: `src/__tests__/server/holidays/deleteHolidayData.test.ts`
  - Feature flag validation
  - Permission checking
  - Dry run functionality
  - Threshold validation
  - Error handling
- **API Tests**: `src/__tests__/api/holidays/delete-cascade.test.tsx`
  - Authentication and authorization
  - Request validation
  - Success and error scenarios
- **Component Tests**: `src/__tests__/components/modals/HolidayDeleteConfirmationModal.test.tsx`
  - Modal rendering and interactions
  - Impact data display
  - Confirmation flow
  - Error handling

### 🔧 Configuration

#### Environment Variables

```bash
# Required for cascade delete functionality
DELETE_HOLIDAY_CASCADE_ENABLED=true

# Optional: Row count threshold (default: 50000)
DELETE_HOLIDAY_ROW_THRESHOLD=1000
```

#### Feature Flags

- `DELETE_HOLIDAY_CASCADE_ENABLED`: Master switch for the feature
- Can be toggled per environment (dev/staging/prod)

### 📊 Usage Examples

#### Dry Run (Impact Assessment)

```typescript
const result = await deleteHolidayData({
	accountId: "account-123",
	holidayId: "holiday-456",
	dryRun: true,
});

console.log(result.totals);
// {
//   Holiday: 1,
//   Task: 5,
//   TaskAssignee: 2,
//   Gift: 3,
//   Card: 2,
//   Budget: 1,
//   BudgetTransaction: 3,
//   Share: 1,
//   ShareMember: 1,
//   Invite: 0,
//   KwanzaaPrinciple: 0,
//   GuestList: 4
// }
```

#### Actual Deletion

```typescript
const result = await deleteHolidayData({
	accountId: "account-123",
	holidayId: "holiday-456",
	dryRun: false,
	force: false, // Will fail if > threshold
});
```

#### API Usage

```bash
# Get impact data
GET /api/holidays/holiday-456/delete-cascade

# Perform deletion
POST /api/holidays/holiday-456/delete-cascade
{
  "dryRun": false,
  "force": false
}
```

### 🛡️ Safety Features

1. **Multi-tenant Isolation**: All operations scoped by `accountId`
2. **Permission Validation**: Users can only delete holidays they have access to
3. **Row Count Thresholds**: Prevents accidental mass deletions
4. **Feature Flags**: Can be disabled instantly if needed
5. **Confirmation Required**: Users must type holiday name exactly
6. **Dry Run Preview**: Shows exactly what will be deleted
7. **Database Constraints**: Leverages existing `ON DELETE CASCADE` for reliability

### 🚀 Deployment Checklist

- [ ] Set `DELETE_HOLIDAY_CASCADE_ENABLED=true` in production
- [ ] Configure appropriate `DELETE_HOLIDAY_ROW_THRESHOLD` value
- [ ] Test in staging environment first
- [ ] Monitor database performance during initial usage
- [ ] Verify all foreign key constraints are properly configured
- [ ] Test with various holiday data scenarios

### 🔄 Rollback Plan

If issues arise:

1. Set `DELETE_HOLIDAY_CASCADE_ENABLED=false` to disable feature
2. Modal will show "feature not enabled" error
3. Users can still manually delete individual records if needed
4. No data loss as feature only deletes when explicitly confirmed

### 📈 Monitoring

Key metrics to monitor:

- Number of cascade delete operations
- Average records affected per deletion
- Error rates and types
- User adoption of the feature
- Database performance impact

### 🎯 Future Enhancements

Potential improvements:

1. **Bulk Operations**: Delete multiple holidays at once
2. **Scheduled Deletion**: Delay deletion for a specified time
3. **Backup Integration**: Create backups before deletion
4. **Audit Trail**: Enhanced logging of deletion operations
5. **Recovery Options**: Undo functionality within time window
