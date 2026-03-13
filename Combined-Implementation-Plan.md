# Combined Implementation Plan: AssignTo + Notifications + Invite Bridge

Based on our analysis, here's the comprehensive next steps plan that combines assignTo functionality with a unified notification system using the bridge pattern for invites.

## 🚨 CRITICAL ANALYSIS FINDINGS

### Database Schema Status Check

- ✅ **Tasks**: Already have `assigned_to UUID REFERENCES users(id)` field in schema
- ❌ **Gifts**: Missing `assigned_to` field - needs addition
- ❌ **Cards**: Missing `assigned_to` field - needs addition
- ❌ **KwanzaaPrinciples**: Should NOT get assignTo (not user-assignable tasks)

### Form Field Implementation Chaos Discovered

Found **3 different patterns** across 15+ holiday pages:

**Pattern A: Conditional Spread (Most Common)**

```tsx
...(isHolidayShared
  ? [{ id: 'assignedTo', type: 'text', placeholder: 'Assigned To' }]
  : [])
```

**Pattern B: Config-Based Filtering**

```tsx
fields={getFormConfig('tasks', 'add').fields.filter(
  field => field.id !== 'assignedTo' || (isAuthorized && isShared)
)}
```

**Pattern C: Hardcoded in formConfigs.ts**

```tsx
{ id: 'assignedTo', type: 'text', placeholder: 'Assigned To' }
```

### Naming Convention Issues

- Frontend uses: `assignedTo` (camelCase)
- API/Database uses: `assigned_to` (snake_case)
- Plan below mixes both conventions - needs standardization

### REQUIRED: Add Phase 0 Before Implementation

## Phase 0: Foundation Cleanup (Week 0 - CRITICAL)

### Fix Current Inconsistencies

**Database Schema Corrections:**

```sql
-- CORRECTION: Only add to Gifts and Cards (Tasks already have assigned_to)
ALTER TABLE gifts ADD COLUMN assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE cards ADD COLUMN assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
-- NOTE: kwanzaa_principles should NOT get assignTo (not user-assignable tasks)
-- NOTE: tasks table already has assigned_to field
```

**Form Field Standardization:**

```typescript
// Create shared assignTo field builder to replace all 3 patterns
export function buildAssignToField(shareMembers: ShareMember[]): FormField {
  return {
    id: 'assignedTo',
    type: 'select',
    placeholder: 'Assign to (optional)',
    options: [
      { value: '', label: 'Unassigned' },
      ...shareMembers.map(member => ({
        value: member.userId,
        label: member.name || member.email || 'Unknown',
      })),
    ],
  };
}
```

**API Schema Standardization:**

```typescript
// Update existing APIs to use consistent naming
const giftSchema = z.object({
  // ...existing fields
  assigned_to: z.string().uuid().nullable().optional(), // NEW
});

const cardSchema = z.object({
  // ...existing fields
  assigned_to: z.string().uuid().nullable().optional(), // NEW
});
// NOTE: taskSchema already has assigned_to field
```

## Phase 1: Database Schema Foundation (Week 1)

### Core Schema Changes

```sql
-- 1. Notification system (assignedTo fields added in Phase 0)

-- 2. Create notifications system
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'task_assigned', 'gift_assigned', 'task_completed', 'invite_received'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    entity_type VARCHAR(50), -- 'task', 'gift', 'card', 'invite'
    entity_id UUID,
    holiday_id UUID REFERENCES holidays(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    invite_id UUID REFERENCES invites(id) ON DELETE CASCADE, -- Bridge to invites
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    read_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ
);

-- 3. Create notification preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignment_notifications BOOLEAN DEFAULT true,
    completion_notifications BOOLEAN DEFAULT true,
    invite_notifications BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT false,
    digest_frequency VARCHAR(20) DEFAULT 'immediate',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Add indexes
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_user_type ON notifications(user_id, type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_gifts_assigned_to ON gifts(assigned_to);
CREATE INDEX idx_cards_assigned_to ON cards(assigned_to);
```

### Migration Script

```sql
-- Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;
```

## Phase 2: API Layer Updates (Week 2)

### Enhanced API Endpoints

**1. Update Gifts API with AssignTo**

```typescript
// src/app/api/holidays/[id]/gifts/route.ts
const giftSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  price: z.number().min(0).optional(),
  store: z.string().nullable().optional(),
  product_link: z.string().url().nullable().optional(),
  notes: z.string().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(), // NEW
});

// In POST handler - create gift with notification
const gift = await prisma.gift.create({
  data: {
    // ...existing fields
    assignedTo: data.assigned_to,
  },
});

// Create assignment notification if assigned
if (data.assigned_to && data.assigned_to !== user.id) {
  await createAssignmentNotification({
    userId: data.assigned_to,
    fromUserId: user.id,
    entityType: 'gift',
    entityId: gift.id,
    holidayId: id,
    title: 'Gift Assignment',
    message: `${user.name} assigned you a gift: ${gift.name}`,
  });
}
```

**2. Update Cards API with AssignTo**

```typescript
// src/app/api/holidays/[id]/cards/route.ts - Similar pattern
const cardSchema = z.object({
  recipient: z.string().min(1),
  address: z.string().nullable().optional(),
  message: z.string().min(1),
  contact_id: z.string().uuid().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(), // NEW
});
```

**3. New Notifications API**

```typescript
// src/app/api/notifications/route.ts
export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unread') === 'true';

  // Get regular notifications
  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
      ...(unreadOnly && { isRead: false }),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      fromUser: { select: { name: true, picture: true } },
      holiday: { select: { name: true, holidayType: true } },
    },
  });

  // Get invite notifications (bridge pattern)
  const inviteNotifications = await prisma.invite.findMany({
    where: {
      OR: [{ toUserId: user.id }, { toEmail: user.email }],
      status: 'pending',
    },
    include: {
      fromUser: { select: { name: true, picture: true } },
      share: {
        include: {
          holiday: { select: { name: true, holidayType: true } },
        },
      },
    },
  });

  // Transform invites to notification format
  const transformedInvites = inviteNotifications.map(invite => ({
    id: `invite-${invite.id}`,
    type: 'invite_received',
    title: 'Holiday Share Invitation',
    message: `${invite.fromUser?.name} invited you to collaborate on ${invite.share.holiday.name}`,
    entityType: 'invite',
    entityId: invite.id,
    holidayId: invite.share.holidayId,
    fromUserId: invite.fromUserId,
    isRead: false,
    createdAt: invite.createdAt,
    fromUser: invite.fromUser,
    holiday: invite.share.holiday,
    isInvite: true, // Special flag
  }));

  return ok([...notifications, ...transformedInvites]);
}

export async function PATCH(request: NextRequest) {
  // Mark notifications as read/dismissed
  const user = await requireAuth(request);
  const { notificationIds, action } = await request.json();

  const updateData =
    action === 'read'
      ? { isRead: true, readAt: new Date() }
      : { isDismissed: true, dismissedAt: new Date() };

  await prisma.notification.updateMany({
    where: {
      id: { in: notificationIds },
      userId: user.id,
    },
    data: updateData,
  });

  return ok({ success: true });
}
```

**4. Notification Helper Functions**

```typescript
// src/lib/notifications.ts
interface NotificationData {
  userId: string;
  fromUserId: string;
  entityType: string;
  entityId: string;
  holidayId: string;
  title: string;
  message: string;
  type?: string;
}

export async function createAssignmentNotification(data: NotificationData) {
  // Check user preferences first
  const prefs = await prisma.notificationPreferences.findUnique({
    where: { userId: data.userId },
  });

  if (!prefs?.assignmentNotifications) return;

  return prisma.notification.create({
    data: {
      userId: data.userId,
      fromUserId: data.fromUserId,
      type: data.type || `${data.entityType}_assigned`,
      title: data.title,
      message: data.message,
      entityType: data.entityType,
      entityId: data.entityId,
      holidayId: data.holidayId,
    },
  });
}

export async function createCompletionNotification(data: NotificationData) {
  const prefs = await prisma.notificationPreferences.findUnique({
    where: { userId: data.userId },
  });

  if (!prefs?.completionNotifications) return;

  return prisma.notification.create({
    data: {
      userId: data.userId,
      fromUserId: data.fromUserId,
      type: `${data.entityType}_completed`,
      title: data.title,
      message: data.message,
      entityType: data.entityType,
      entityId: data.entityId,
      holidayId: data.holidayId,
    },
  });
}
```

## Phase 3: Form Field Consolidation (Week 3)

### New Form Architecture

```typescript
// src/config/baseFormConfigs.ts
export const ASSIGNTO_FIELD: FormField = {
  id: 'assignedTo',
  type: 'select',
  placeholder: 'Assign to (optional)',
  options: [], // Populated dynamically with share members
};

export const BASE_FORM_CONFIGS = {
  task: {
    fields: [
      { id: 'title', type: 'text', placeholder: 'Task Title*', required: true },
      { id: 'description', type: 'textarea', placeholder: 'Description', rows: 2 },
      { id: 'priority', type: 'select', placeholder: 'Priority', options: [...] },
      ASSIGNTO_FIELD,
      { id: 'dueDate', type: 'date', placeholder: 'Due Date' },
    ],
    submitText: 'Add Task',
    cardClassName: 'bg-white dark:bg-gray-800 rounded-lg shadow-lg',
  },
  gift: {
    fields: [
      { id: 'recipient', type: 'text', placeholder: 'Recipient*', required: true },
      { id: 'name', type: 'text', placeholder: 'Gift Name' },
      { id: 'description', type: 'text', placeholder: 'Description' },
      { id: 'price', type: 'number', placeholder: 'Price', step: '0.01' },
      { id: 'store', type: 'text', placeholder: 'Store' },
      ASSIGNTO_FIELD, // NEW
      { id: 'notes', type: 'textarea', placeholder: 'Notes', rows: 2 },
    ],
    submitText: 'Add Gift',
    cardClassName: 'card',
    showAddressBook: true,
  },
  card: {
    fields: [
      { id: 'recipient', type: 'text', placeholder: 'Recipient*', required: true },
      { id: 'address', type: 'text', placeholder: 'Address (optional)' },
      { id: 'message', type: 'textarea', placeholder: 'Message*', required: true, rows: 3 },
      ASSIGNTO_FIELD, // NEW
    ],
    submitText: 'Add Card',
    cardClassName: 'card card-cards',
    showAddressBook: true,
  },
};
```

### Dynamic Form Builder

```typescript
// src/lib/formBuilder.ts
export function buildFormConfig(
  contentType: 'task' | 'gift' | 'card',
  holidayKey: string,
  shareMembers: ShareMember[] = [],
  customizations?: Partial<FormConfig>,
): FormConfig {
  const baseConfig = BASE_FORM_CONFIGS[contentType];

  // Populate assignTo options with share members
  const configWithAssignTo = {
    ...baseConfig,
    fields: baseConfig.fields.map(field => {
      if (field.id === 'assignedTo') {
        return {
          ...field,
          options: [
            { value: '', label: 'Unassigned' },
            ...shareMembers.map(member => ({
              value: member.userId,
              label: member.name || member.email || 'Unknown',
            })),
          ],
        };
      }
      return field;
    }),
  };

  // Apply holiday-specific customizations
  return {
    ...configWithAssignTo,
    ...customizations,
  };
}
```

## Phase 4: Frontend Integration (Week 4)

### Enhanced FormModal with AssignTo

```tsx
// Update FormModal to handle assignTo population
export default function FormModal({
  // ...existing props
  holidayId,
  shareMembers = [],
}: FormModalProps & { holidayId?: string; shareMembers?: ShareMember[] }) {
  // Populate assignTo field options
  const fieldsWithOptions = useMemo(
    () =>
      fields.map(field => {
        if (field.id === 'assignedTo' && shareMembers.length > 0) {
          return {
            ...field,
            options: [
              { value: '', label: 'Unassigned' },
              ...shareMembers.map(member => ({
                value: member.userId,
                label: member.name || member.email || 'Unknown',
              })),
            ],
          };
        }
        return field;
      }),
    [fields, shareMembers],
  );

  // Rest of component logic...
}
```

### Unified Notifications Component

```tsx
// src/components/common/NotificationCenter.tsx
export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const response = await fetch('/api/notifications');
    const data = await response.json();
    setNotifications(data);
    setUnreadCount(data.filter(n => !n.isRead).length);
  };

  const handleMarkAsRead = async (notificationIds: string[]) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationIds, action: 'read' }),
    });
    fetchNotifications();
  };

  const handleAcceptInvite = async (inviteId: string) => {
    await fetch(`/api/invites/${inviteId}/accept`, { method: 'POST' });
    fetchNotifications();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">No notifications</div>
            ) : (
              notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkAsRead}
                  onAcceptInvite={handleAcceptInvite}
                  onDeclineInvite={handleDeclineInvite}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
  onAcceptInvite,
  onDeclineInvite,
}) {
  if (notification.isInvite) {
    return (
      <div className="p-4 border-b hover:bg-gray-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-medium">{notification.title}</p>
            <p className="text-sm text-gray-600">{notification.message}</p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(notification.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onAcceptInvite(notification.entityId)}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Accept
          </button>
          <button
            onClick={() => onDeclineInvite(notification.entityId)}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            Decline
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
        !notification.isRead ? 'bg-blue-50' : ''
      }`}
      onClick={() => !notification.isRead && onMarkRead([notification.id])}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p
            className={`font-medium ${!notification.isRead ? 'text-blue-900' : ''}`}
          >
            {notification.title}
          </p>
          <p className="text-sm text-gray-600">{notification.message}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(notification.createdAt).toLocaleDateString()}
          </p>
        </div>
        {!notification.isRead && (
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
        )}
      </div>
    </div>
  );
}
```

### Update Holiday Pages

```tsx
// Example: Update a holiday page to use new form system
export default function HanukkahGiftsPage() {
  const { holidayId, shareMembers } = useHolidayPageData();

  const formConfig = useMemo(
    () =>
      buildFormConfig('gift', 'hanukkah', shareMembers, {
        submitButtonColor: '#3b82f6', // Hanukkah blue
      }),
    [shareMembers],
  );

  // Rest of component using formConfig...
}
```

## Phase 5: Testing & Refinement (Week 5)

### Key Test Scenarios

1. **Assignment Flow**: Assign gift → recipient gets notification → complete gift → assigner gets notification
2. **Invite Bridge**: Send invite → appears in notifications → accept → notification disappears
3. **Bulk Operations**: Mark multiple notifications as read
4. **User Preferences**: Disable notifications → verify no notifications sent
5. **Edge Cases**: Assign to self, assign to non-member, delete assigned item

### Performance Optimization

```sql
-- Add database constraints
ALTER TABLE notifications ADD CONSTRAINT chk_entity_type
  CHECK (entity_type IN ('task', 'gift', 'card', 'invite'));

-- Add cleanup job for old notifications
DELETE FROM notifications
WHERE created_at < NOW() - INTERVAL '90 days'
  AND is_dismissed = true;
```

## Implementation Timeline Summary

| Week       | Focus                | Deliverables                                      |
| ---------- | -------------------- | ------------------------------------------------- |
| **Week 0** | Foundation Cleanup   | Fix current inconsistencies, standardize patterns |
| **Week 1** | Database Foundation  | Notification schema, indexes, migrations          |
| **Week 2** | API Layer            | Enhanced endpoints, notification helpers          |
| **Week 3** | Form Consolidation   | Base configs, dynamic form builder                |
| **Week 4** | Frontend Integration | NotificationCenter, enhanced forms                |
| **Week 5** | Testing & Polish     | E2E tests, performance optimization               |

## Success Metrics

- ✅ All content types support assignTo (Gifts, Cards, Tasks)
- ✅ Unified notification experience (invites + assignments)
- ✅ Zero breaking changes to existing invite system
- ✅ Real-time notification delivery
- ✅ 80% reduction in form field duplication
- ✅ Consistent naming conventions (frontend ↔ backend)
- ✅ Standardized form field patterns across all holidays

## Risk Assessment: Medium-High → Medium (After Phase 0)

**Primary Risks:**

- Form field changes across 15+ holiday pages need careful coordination
- Existing task assignment functionality could break during refactor
- Notification/invite bridge integration complexity

**Mitigations:**

- Phase 0 cleanup reduces integration risks significantly
- Create comprehensive form field tests before changes
- Feature-flag notification system during rollout
- Maintain existing invite system throughout migration
- Standardized patterns make changes more predictable

## Key Benefits of This Approach

### 1. Bridge Pattern Advantages

- **Preserves Stability**: Existing invite system remains unchanged
- **Unified UX**: Users see all notifications in one place
- **Gradual Migration**: Can enhance either system independently
- **No Data Loss**: All existing invite functionality intact

### 2. AssignTo Universal Implementation

- **Consistent Experience**: Same assignment pattern across all content types
- **Scalable Architecture**: Easy to add new content types
- **Smart Notifications**: Context-aware assignment and completion alerts
- **User Preferences**: Granular control over notification types

### 3. Form Consolidation Benefits

- **Reduced Duplication**: Single source of truth for form configurations
- **Holiday Customization**: Easy theming and field customization per holiday
- **Maintainability**: Changes propagate across all implementations
- **Developer Experience**: Simplified form creation process

This approach gives you a complete, integrated system while preserving the stability of your existing invite functionality through the bridge pattern.
