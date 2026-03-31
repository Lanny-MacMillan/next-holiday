# PHASE 1: ARCHITECTURAL IMPROVEMENTS & OPTIMIZATION

**Goal**: Improve Redux architecture with changes that can be implemented immediately

**Status**: ⏳ Ready to start

---

## 🎯 WHAT WE'RE IMPROVING

Focus on architectural improvements that don't require the automatic sync implementation:

1. **Code consolidation** - Create shared hooks and components
2. **Performance optimizations** - Add memoization and RTK Query settings  
3. **Type safety improvements** - Strengthen TypeScript integration
4. **Component cleanup** - Remove duplicate code patterns
5. **State management optimization** - Improve existing patterns

*Note: Automatic sync and unused code cleanup will be handled later via linting tools*

---

## 📋 IMPLEMENTATION CHECKLIST

### ✅ Step 1: Create Shared Custom Hooks

**Create reusable mutation management hooks** to reduce code duplication:

#### **Create `src/hooks/useGiftManagement.ts`:**
```typescript
import { useCallback } from 'react';
import { 
  useCreateGiftMutation, 
  useUpdateGiftMutation, 
  useDeleteGiftMutation,
  useGetGiftsQuery 
} from '../store/api';

export const useGiftManagement = (holidayId: string, auth0User: any) => {
  const { data: gifts, isLoading, error } = useGetGiftsQuery({ holidayId, auth0User });
  const [createGift] = useCreateGiftMutation();
  const [updateGift] = useUpdateGiftMutation();  
  const [deleteGift] = useDeleteGiftMutation();

  const handleCreate = useCallback(async (payload: any) => {
    try {
      await createGift({ holidayId, payload, auth0User });
    } catch (error) {
      console.error('Failed to create gift:', error);
    }
  }, [createGift, holidayId, auth0User]);

  const handleToggle = useCallback(async (giftId: string, isCompleted: boolean) => {
    try {
      await updateGift({ holidayId, giftId, isCompleted, auth0User });
    } catch (error) {
      console.error('Failed to update gift:', error);
    }
  }, [updateGift, holidayId, auth0User]);

  const handleDelete = useCallback(async (giftId: string) => {
    try {
      await deleteGift({ holidayId, giftId, auth0User });
    } catch (error) {
      console.error('Failed to delete gift:', error);
    }
  }, [deleteGift, holidayId, auth0User]);

  return {
    gifts,
    isLoading,
    error,
    handleCreate,
    handleToggle,
    handleDelete,
  };
};
```

#### **Create similar hooks for other entities:**
- [ ] `src/hooks/useTaskManagement.ts`
- [ ] `src/hooks/useCardManagement.ts`
- [ ] `src/hooks/useGuestManagement.ts`

### ✅ Step 2: Optimize RTK Query Performance

**Edit `src/store/api.ts`** to add performance optimizations:

```typescript
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ /* existing config */ }),
  tagTypes: ['Gifts', 'Tasks', 'Cards', 'Guests', 'Events'],
  
  // ✅ ADD: Performance optimizations
  keepUnusedDataFor: 60, // Keep cache for 60 seconds
  refetchOnMountOrArgChange: 30, // Refetch if data is older than 30 seconds
  refetchOnFocus: true, // Refetch when window regains focus
  
  endpoints: (builder) => ({
    // existing endpoints...
  }),
});
```

### ✅ Step 3: Add Component Memoization

**Optimize heavy components with React.memo and useMemo:**

#### **Example: Gift List Component Optimization:**
```typescript
import React, { memo, useMemo } from 'react';

const GiftListComponent = memo(({ gifts, holidayId, onToggle }: Props) => {
  const sortedGifts = useMemo(() => 
    gifts?.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [gifts]
  );

  const completedCount = useMemo(() => 
    gifts?.filter(gift => gift.isCompleted).length || 0,
    [gifts]
  );

  return (
    <div>
      <p>Completed: {completedCount} / {gifts?.length || 0}</p>
      {sortedGifts?.map(gift => (
        <GiftItem key={gift.id} gift={gift} onToggle={onToggle} />
      ))}
    </div>
  );
});

export default GiftListComponent;
```

### ✅ Step 4: Strengthen TypeScript Types

**Create better type definitions for improved type safety:**

#### **Create `src/types/api.ts`:**
```typescript
// Strengthen RTK Query argument types
export interface GiftQueryArgs {
  holidayId: string;
  auth0User: User;
}

export interface GiftMutationArgs extends GiftQueryArgs {
  payload: CreateGiftPayload;
}

export interface UpdateGiftArgs extends GiftQueryArgs {
  giftId: string;
  isCompleted: boolean;
}

// Add runtime validation schemas
import { z } from 'zod';

export const GiftSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  isCompleted: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Gift = z.infer<typeof GiftSchema>;
```

---

## ✅ VERIFICATION STEPS

After implementing the improvements:

1. **TypeScript Check**: `npm run type-check` (should succeed with better types)
2. **Performance Check**: Measure bundle size and runtime performance
3. **Component Check**: Test memoized components render efficiently
4. **Hook Usage**: Verify shared hooks reduce code duplication

---

## 📊 EXPECTED IMPACT

### Before Phase 1:
- **Duplicate handler logic** across components
- **No performance optimizations** in RTK Query
- **Heavy re-renders** without memoization
- **Weak TypeScript types** (lots of `any`)

### After Phase 1:
- **Shared custom hooks** reduce duplication
- **Optimized RTK Query** cache behavior  
- **Memoized components** prevent unnecessary renders
- **Strong TypeScript types** catch errors at compile time
- **Better code organization** and maintainability

---

## 🚧 TROUBLESHOOTING

**If TypeScript errors occur:**
1. Update import statements for new hook locations
2. Check type definitions match your data structure
3. Ensure runtime validation schemas are correct

**If performance doesn't improve:**
1. Check React DevTools Profiler for render patterns
2. Verify memoization dependencies are correct
3. Test RTK Query cache behavior in Network tab

---

## ✅ COMPLETION CRITERIA

- [ ] Shared custom hooks created for gifts, tasks, cards, guests
- [ ] RTK Query performance optimizations added
- [ ] Heavy components memoized with React.memo
- [ ] TypeScript types strengthened  
- [ ] `npm run build` succeeds
- [ ] Performance improvements measurable
- [ ] Code duplication reduced

**When complete**, mark this phase as ✅ **COMPLETED** and proceed to Phase 2!