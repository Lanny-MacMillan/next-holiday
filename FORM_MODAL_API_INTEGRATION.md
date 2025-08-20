# FormModal API Integration Implementation

This document describes the implementation of authenticated API endpoints and RTK Query mutations for the FormModal functionality across all holiday routes.

## Overview

The implementation provides:

- **Authenticated API endpoints** for creating tasks, gifts, cards, and guest lists
- **RTK Query mutations** with selective invalidation
- **Route-based mutation selection** via custom hooks
- **Form value transformation** utilities
- **Address book integration** with contact linking

## Architecture

### 1. Authentication & Authorization

#### Auth Helper (`src/lib/auth.ts`)

```typescript
export async function assertHolidayAccess(
	holidayId: string,
	userId: string
): Promise<Response | null>;
```

- Validates user has access to holiday through account membership
- Returns 403 response if access denied, null if granted

### 2. API Endpoints

#### Base Endpoints Created:

- `POST /api/holidays/[holidayId]/tasks` → Creates tasks
- `POST /api/holidays/[holidayId]/gifts` → Creates gifts
- `POST /api/holidays/[holidayId]/cards` → Creates cards
- `POST /api/holidays/[holidayId]/guest-lists` → Creates/updates guest lists (upsert)

#### Common Features:

- **Authentication**: `requireAuth(request)` returns `{ userId }`
- **Authorization**: `assertHolidayAccess(holidayId, userId)` enforces tenant ownership
- **Validation**: Zod schemas for request body validation
- **Database**: Prisma operations with proper field mapping
- **Caching**: `Cache-Control: private, max-age=5, stale-while-revalidate=60`

### 3. RTK Query Integration

#### API Slice (`src/store/api.ts`)

```typescript
export const api = createApi({
	reducerPath: "api",
	baseQuery: fetchBaseQuery({ baseUrl: "/api", credentials: "include" }),
	tagTypes: ["Tasks", "Gifts", "Cards", "GuestList"],
	endpoints: (builder) => ({
		createTask: builder.mutation<any, { holidayId: string; payload: any }>({
			query: ({ holidayId, payload }) => ({
				url: `holidays/${holidayId}/tasks`,
				method: "POST",
				body: payload,
			}),
			invalidatesTags: (result, error, { holidayId }) => [
				{ type: "Tasks", id: holidayId },
			],
		}),
		// ... similar for gifts, cards, guest lists
	}),
});
```

#### Store Integration:

- Added to Redux store with middleware
- Provides mutations: `useCreateTaskMutation`, `useCreateGiftMutation`, etc.

### 4. Route-Based Mutation Selection

#### Custom Hook (`src/hooks/useFormModalMutation.ts`)

```typescript
export function useFormModalMutation() {
	const pathname = usePathname();
	const holidayPreferences = useAppSelector(/* ... */);
	const holidayId = getHolidayIdFromRoute(pathname, holidayPreferences);

	// Returns appropriate mutation based on route:
	// /christmas/gift-list → createGift
	// /christmas/cards → createCard
	// /christmas/tasks → createTask
	// /christmas/guest-list → createGuest
}
```

#### Route Mapping:

- `gift-list` → `createGift`
- `cards` → `createCard`
- `tasks`, `events`, `decorations`, etc. → `createTask` (with category)
- `guest-list` → `createGuest`

### 5. Form Value Transformation

#### Transformers (`src/utils/formTransformers.ts`)

```typescript
export function transformGiftPayload(
	values: Record<string, any>,
	contacts: any[]
) {
	const contact = contacts.find((c) => c.name === values.recipient);
	return {
		name: values.description || values.name || "",
		description: values.description || "",
		price: values.price ? parseFloat(values.price) : 0,
		store: values.store || "",
		product_link: values.productLink || "",
		notes: values.notes || "",
		contact_id: contact?.id || null,
	};
}
```

#### Features:

- **Contact linking**: Automatically links to contacts when recipient matches
- **Category mapping**: Route-based category assignment for tasks
- **Field normalization**: Consistent API field names
- **Validation**: Required field handling

## Usage Examples

### Christmas Gift List Page

```typescript
export default function GiftListPage() {
	const { holidayId, mutation, isLoading } = useFormModalMutation();
	const { contacts } = useAppSelector((state) => state.addressBook);

	async function handleAddGift(values: Record<string, any>) {
		if (!holidayId || !mutation) return;

		try {
			const payload = transformGiftPayload(values, contacts);
			await mutation({ holidayId, payload }).unwrap();
			setShowForm(false);
		} catch (error) {
			console.error("Error creating gift:", error);
		}
	}

	return (
		<FormModal
			isOpen={showForm}
			title="Add New Gift"
			fields={formFields}
			onSubmit={handleAddGift}
			loading={isLoading}
			showAddressBook={true}
			contacts={contacts}
		/>
	);
}
```

### Christmas Cards Page

```typescript
export default function ChristmasCardsPage() {
	const { holidayId, mutation, isLoading } = useFormModalMutation();

	async function handleAddCard(values: Record<string, any>) {
		const payload = transformCardPayload(values, contacts);
		await mutation({ holidayId, payload }).unwrap();
	}

	// Similar FormModal setup
}
```

## Field Mapping

### Gifts

```typescript
{
  name: string,           // Required
  description?: string,
  price?: number,
  store?: string,
  product_link?: string,
  notes?: string,
  contact_id?: string,   // Linked from address book
}
```

### Cards

```typescript
{
  recipient: string,      // Required
  message: string,        // Required
  address?: string,
  contact_id?: string,   // Linked from address book
}
```

### Tasks

```typescript
{
  title: string,          // Required
  description?: string,
  priority?: "low" | "medium" | "high",
  category?: string,      // Auto-assigned from route
  due_date?: string,      // ISO date
  assigned_to?: string,
}
```

### Guest Lists

```typescript
{
  contact_id: string,     // Required (from address book)
  rsvp_status?: "pending" | "confirmed" | "declined" | "maybe",
  notes?: string,
}
```

## Route Categories for Tasks

The following routes automatically assign categories to tasks:

- `events` → "events"
- `decorations` → "decorations"
- `candle-lighting` → "candle-lighting"
- `meal-planning` → "meal-planning"
- `decorations-checklist` → "decorations-checklist"
- `shopping-list` → "shopping-list"
- `basket-list` → "basket-list"
- `date-ideas` → "date-ideas"
- `reservations` → "reservations"
- `party-planning` → "party-planning"
- `costume-ideas` → "costume-ideas"
- `trick-or-treat-prep` → "trick-or-treat-prep"
- `resolutions` → "resolutions"
- `supplies-list` → "supplies-list"
- `games` → "games"

## Testing

### Test Page (`/test-api`)

A test page is available at `/test-api` to verify API functionality:

- Shows current holiday ID and mutation type
- Provides test button to create items
- Displays API responses and errors

### Manual Testing

1. Navigate to any holiday route (e.g., `/christmas/gift-list`)
2. Click "Add New Gift" button
3. Fill form and submit
4. Verify item is created in database
5. Check RTK Query invalidation works

## Error Handling

- **Authentication**: 401 for unauthenticated requests
- **Authorization**: 403 for cross-account holiday access
- **Validation**: 400 for invalid request bodies
- **Database**: 500 for server errors
- **Client**: Error states in mutations with proper error boundaries

## Next Steps

1. **Implement GET endpoints** for fetching lists
2. **Add UPDATE/DELETE mutations** for editing/deleting items
3. **Implement optimistic updates** for better UX
4. **Add error toasts** for user feedback
5. **Remove hard-coded demo data** from all holiday pages
6. **Add loading states** for better UX
7. **Implement real-time updates** if needed

## Files Created/Modified

### New Files:

- `src/app/api/holidays/[holidayId]/tasks/route.ts`
- `src/app/api/holidays/[holidayId]/gifts/route.ts`
- `src/app/api/holidays/[holidayId]/cards/route.ts`
- `src/app/api/holidays/[holidayId]/guest-lists/route.ts`
- `src/store/api.ts`
- `src/hooks/useFormModalMutation.ts`
- `src/utils/formTransformers.ts`
- `src/app/test-api/page.tsx`

### Modified Files:

- `src/lib/auth.ts` - Added `assertHolidayAccess`
- `src/store/index.ts` - Added API slice to store
- `src/utils/holidayUtils.ts` - Added `getHolidayIdFromRoute`
- `src/app/christmas/gift-list/page.tsx` - Updated to use new API
- `src/app/christmas/cards/page.tsx` - Updated to use new API
